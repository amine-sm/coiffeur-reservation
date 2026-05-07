const pool = require("../config/db");

/*
    Supprime les créneaux passés non réservés.
*/
async function deletePastAvailableCreneaux(connection = pool) {
    await connection.query(`
        DELETE FROM creneaux_disponibles
        WHERE statut <> 'reserve'
          AND TIMESTAMP(date_creneau, heure_creneau) < NOW()
    `);
}

/*
    Supprime automatiquement les rendez-vous passés.
    Important :
    - Supprime le RDV passé.
    - Supprime tous les créneaux de la même date/heure, car la réservation bloque tous les services.
    - Ne supprime pas le client.
*/
async function deleteExpiredRendezvous(connection = pool) {
    const ownConnection = connection === pool;
    const conn = ownConnection ? await pool.getConnection() : connection;

    try {
        if (ownConnection) {
            await conn.beginTransaction();
        }

        const [expiredRows] = await conn.query(`
            SELECT 
                id,
                creneau_id,
                DATE_FORMAT(date_rdv, '%Y-%m-%d') AS date_rdv,
                TIME_FORMAT(heure_rdv, '%H:%i') AS heure_rdv
            FROM rendezvous
            WHERE TIMESTAMP(date_rdv, heure_rdv) < NOW()
            FOR UPDATE
        `);

        if (expiredRows.length === 0) {
            if (ownConnection) {
                await conn.commit();
            }

            return {
                deletedRendezvous: 0,
                deletedCreneaux: 0
            };
        }

        const rdvIds = expiredRows.map((row) => row.id);

        let deletedCreneaux = 0;

        for (const row of expiredRows) {
            const [deleteCreneauxResult] = await conn.query(
                `
                DELETE FROM creneaux_disponibles
                WHERE date_creneau = ?
                  AND heure_creneau = ?
                `,
                [row.date_rdv, row.heure_rdv]
            );

            deletedCreneaux += deleteCreneauxResult.affectedRows || 0;
        }

        await conn.query(
            `
            DELETE FROM rendezvous
            WHERE id IN (?)
            `,
            [rdvIds]
        );

        if (ownConnection) {
            await conn.commit();
        }

        return {
            deletedRendezvous: rdvIds.length,
            deletedCreneaux
        };
    } catch (error) {
        if (ownConnection) {
            await conn.rollback();
        }

        throw error;
    } finally {
        if (ownConnection) {
            conn.release();
        }
    }
}

const createRendezvous = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await deleteExpiredRendezvous(connection);
        await deletePastAvailableCreneaux(connection);

        const {
            nom_client,
            prenom_client,
            email,
            telephone,
            service_id,
            creneau_id,
            note
        } = req.body;

        if (!nom_client || !telephone || !service_id || !creneau_id) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: "Nom, téléphone, service et créneau sont obligatoires"
            });
        }

        const [services] = await connection.query(
            "SELECT * FROM services WHERE id = ? AND statut = 'actif'",
            [service_id]
        );

        if (services.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "Service introuvable ou inactif"
            });
        }

        const service = services[0];

        const [creneaux] = await connection.query(
            `
            SELECT 
                id,
                service_id,
                DATE_FORMAT(date_creneau, '%Y-%m-%d') AS date_creneau,
                TIME_FORMAT(heure_creneau, '%H:%i') AS heure_creneau,
                statut
            FROM creneaux_disponibles
            WHERE id = ?
              AND service_id = ?
              AND TIMESTAMP(date_creneau, heure_creneau) >= NOW()
            FOR UPDATE
            `,
            [creneau_id, service_id]
        );

        if (creneaux.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "Créneau introuvable, expiré ou indisponible pour ce service"
            });
        }

        const creneau = creneaux[0];

        if (creneau.statut !== "disponible") {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: "Ce créneau n'est plus disponible"
            });
        }

        /*
            On verrouille tous les créneaux de la même date/heure.
            S'il y en a déjà un réservé, on bloque la réservation.
        */
        const [sameTimeRows] = await connection.query(
            `
            SELECT 
                id,
                statut
            FROM creneaux_disponibles
            WHERE date_creneau = ?
              AND heure_creneau = ?
            FOR UPDATE
            `,
            [creneau.date_creneau, creneau.heure_creneau]
        );

        const hasReservedSameTime = sameTimeRows.some(
            (row) => row.statut === "reserve"
        );

        if (hasReservedSameTime) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: "Cette heure est déjà réservée pour un autre service"
            });
        }

        let clientId = null;

        const [clients] = await connection.query(
            "SELECT id FROM clients WHERE telephone = ? LIMIT 1",
            [telephone]
        );

        if (clients.length > 0) {
            clientId = clients[0].id;
        } else {
            const [newClient] = await connection.query(
                `
                INSERT INTO clients 
                (
                    nom, 
                    prenom, 
                    email, 
                    telephone
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    nom_client,
                    prenom_client || null,
                    email || null,
                    telephone
                ]
            );

            clientId = newClient.insertId;
        }

        const [rdvResult] = await connection.query(
            `
            INSERT INTO rendezvous
            (
                client_id,
                nom_client,
                prenom_client,
                email,
                telephone,
                service_id,
                creneau_id,
                date_rdv,
                heure_rdv,
                statut,
                prix,
                note
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_attente', ?, ?)
            `,
            [
                clientId,
                nom_client,
                prenom_client || null,
                email || null,
                telephone,
                service_id,
                creneau_id,
                creneau.date_creneau,
                creneau.heure_creneau,
                service.prix,
                note || null
            ]
        );

        /*
            Réservation globale :
            Tous les créneaux qui ont la même date et la même heure deviennent réservés.
        */
        await connection.query(
            `
            UPDATE creneaux_disponibles
            SET statut = 'reserve'
            WHERE date_creneau = ?
              AND heure_creneau = ?
            `,
            [
                creneau.date_creneau,
                creneau.heure_creneau
            ]
        );

        const [rdvRows] = await connection.query(
            `
            SELECT 
                r.id,
                r.client_id,
                r.nom_client,
                r.prenom_client,
                r.email,
                r.telephone,
                r.service_id,
                r.creneau_id,
                DATE_FORMAT(r.date_rdv, '%Y-%m-%d') AS date_rdv,
                TIME_FORMAT(r.heure_rdv, '%H:%i') AS heure_rdv,
                r.statut,
                r.prix,
                r.note,
                s.nom AS service_nom,
                s.duree AS service_duree
            FROM rendezvous r
            LEFT JOIN services s ON s.id = r.service_id
            WHERE r.id = ?
            `,
            [rdvResult.insertId]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: "Rendez-vous réservé avec succès",
            data: rdvRows[0]
        });
    } catch (error) {
        await connection.rollback();

        res.status(500).json({
            success: false,
            message: "Erreur création rendez-vous",
            error: error.message
        });
    } finally {
        connection.release();
    }
};

const getAllRendezvous = async (req, res) => {
    try {
        await deleteExpiredRendezvous();
        await deletePastAvailableCreneaux();

        const { statut, date } = req.query;

        let sql = `
            SELECT 
                r.id,
                r.client_id,
                r.nom_client,
                r.prenom_client,
                r.email,
                r.telephone,
                r.service_id,
                r.creneau_id,
                DATE_FORMAT(r.date_rdv, '%Y-%m-%d') AS date_rdv,
                TIME_FORMAT(r.heure_rdv, '%H:%i') AS heure_rdv,
                r.statut,
                r.prix,
                r.note,
                s.nom AS service_nom,
                s.duree AS service_duree,
                DATE_FORMAT(c.date_creneau, '%Y-%m-%d') AS date_creneau,
                TIME_FORMAT(c.heure_creneau, '%H:%i') AS heure_creneau,
                c.statut AS creneau_statut
            FROM rendezvous r
            LEFT JOIN services s ON s.id = r.service_id
            LEFT JOIN creneaux_disponibles c ON c.id = r.creneau_id
            WHERE TIMESTAMP(r.date_rdv, r.heure_rdv) >= NOW()
        `;

        const params = [];

        if (statut) {
            sql += " AND r.statut = ?";
            params.push(statut);
        }

        if (date) {
            sql += " AND r.date_rdv = ?";
            params.push(date);
        }

        sql += " ORDER BY r.date_rdv ASC, r.heure_rdv ASC";

        const [rows] = await pool.query(sql, params);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur récupération rendez-vous",
            error: error.message
        });
    }
};

const getRendezvousById = async (req, res) => {
    try {
        await deleteExpiredRendezvous();
        await deletePastAvailableCreneaux();

        const { id } = req.params;

        const [rows] = await pool.query(
            `
            SELECT 
                r.id,
                r.client_id,
                r.nom_client,
                r.prenom_client,
                r.email,
                r.telephone,
                r.service_id,
                r.creneau_id,
                DATE_FORMAT(r.date_rdv, '%Y-%m-%d') AS date_rdv,
                TIME_FORMAT(r.heure_rdv, '%H:%i') AS heure_rdv,
                r.statut,
                r.prix,
                r.note,
                s.nom AS service_nom,
                s.duree AS service_duree,
                DATE_FORMAT(c.date_creneau, '%Y-%m-%d') AS date_creneau,
                TIME_FORMAT(c.heure_creneau, '%H:%i') AS heure_creneau,
                c.statut AS creneau_statut
            FROM rendezvous r
            LEFT JOIN services s ON s.id = r.service_id
            LEFT JOIN creneaux_disponibles c ON c.id = r.creneau_id
            WHERE r.id = ?
              AND TIMESTAMP(r.date_rdv, r.heure_rdv) >= NOW()
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Rendez-vous introuvable ou expiré"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur récupération rendez-vous",
            error: error.message
        });
    }
};

const updateRendezvousStatut = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await deleteExpiredRendezvous(connection);
        await deletePastAvailableCreneaux(connection);

        const { id } = req.params;
        const { statut } = req.body;

        const statutsAutorises = ["en_attente", "confirme", "termine", "annule"];

        if (!statut || !statutsAutorises.includes(statut)) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: "Statut invalide"
            });
        }

        const [rdvRows] = await connection.query(
            `
            SELECT 
                *,
                DATE_FORMAT(date_rdv, '%Y-%m-%d') AS clean_date_rdv,
                TIME_FORMAT(heure_rdv, '%H:%i') AS clean_heure_rdv
            FROM rendezvous
            WHERE id = ?
              AND TIMESTAMP(date_rdv, heure_rdv) >= NOW()
            FOR UPDATE
            `,
            [id]
        );

        if (rdvRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "Rendez-vous introuvable ou déjà expiré"
            });
        }

        const rdv = rdvRows[0];

        await connection.query(
            "UPDATE rendezvous SET statut = ? WHERE id = ?",
            [statut, id]
        );

        if (statut === "annule") {
            await connection.query(
                `
                UPDATE creneaux_disponibles
                SET statut = 'disponible'
                WHERE date_creneau = ?
                  AND heure_creneau = ?
                `,
                [
                    rdv.clean_date_rdv,
                    rdv.clean_heure_rdv
                ]
            );
        }

        if (statut === "confirme" || statut === "termine") {
            await connection.query(
                `
                UPDATE creneaux_disponibles
                SET statut = 'reserve'
                WHERE date_creneau = ?
                  AND heure_creneau = ?
                `,
                [
                    rdv.clean_date_rdv,
                    rdv.clean_heure_rdv
                ]
            );
        }

        const [rows] = await connection.query(
            `
            SELECT 
                r.id,
                r.client_id,
                r.nom_client,
                r.prenom_client,
                r.email,
                r.telephone,
                r.service_id,
                r.creneau_id,
                DATE_FORMAT(r.date_rdv, '%Y-%m-%d') AS date_rdv,
                TIME_FORMAT(r.heure_rdv, '%H:%i') AS heure_rdv,
                r.statut,
                r.prix,
                r.note,
                s.nom AS service_nom,
                s.duree AS service_duree
            FROM rendezvous r
            LEFT JOIN services s ON s.id = r.service_id
            WHERE r.id = ?
            `,
            [id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: "Statut modifié avec succès",
            data: rows[0]
        });
    } catch (error) {
        await connection.rollback();

        res.status(500).json({
            success: false,
            message: "Erreur modification statut",
            error: error.message
        });
    } finally {
        connection.release();
    }
};

const deleteRendezvous = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await deleteExpiredRendezvous(connection);
        await deletePastAvailableCreneaux(connection);

        const { id } = req.params;

        const [rdvRows] = await connection.query(
            `
            SELECT 
                *,
                DATE_FORMAT(date_rdv, '%Y-%m-%d') AS clean_date_rdv,
                TIME_FORMAT(heure_rdv, '%H:%i') AS clean_heure_rdv
            FROM rendezvous
            WHERE id = ?
            FOR UPDATE
            `,
            [id]
        );

        if (rdvRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "Rendez-vous introuvable"
            });
        }

        const rdv = rdvRows[0];

        await connection.query(
            "DELETE FROM rendezvous WHERE id = ?",
            [id]
        );

        /*
            Suppression manuelle d'un RDV :
            On libère tous les créneaux de la même date/heure.
        */
        await connection.query(
            `
            UPDATE creneaux_disponibles
            SET statut = 'disponible'
            WHERE date_creneau = ?
              AND heure_creneau = ?
            `,
            [
                rdv.clean_date_rdv,
                rdv.clean_heure_rdv
            ]
        );

        await connection.commit();

        res.json({
            success: true,
            message: "Rendez-vous supprimé et créneau libéré avec succès"
        });
    } catch (error) {
        await connection.rollback();

        res.status(500).json({
            success: false,
            message: "Erreur suppression rendez-vous",
            error: error.message
        });
    } finally {
        connection.release();
    }
};

const cleanExpiredRendezvous = async (req, res) => {
    try {
        const result = await deleteExpiredRendezvous();
        await deletePastAvailableCreneaux();

        res.json({
            success: true,
            message: "Nettoyage des rendez-vous expirés terminé",
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur nettoyage rendez-vous expirés",
            error: error.message
        });
    }
};

module.exports = {
    createRendezvous,
    getAllRendezvous,
    getRendezvousById,
    updateRendezvousStatut,
    deleteRendezvous,
    cleanExpiredRendezvous,
    deleteExpiredRendezvous
};