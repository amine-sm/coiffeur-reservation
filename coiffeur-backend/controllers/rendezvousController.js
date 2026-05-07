const pool = require("../config/db");

/*
    Supprime automatiquement les créneaux passés non réservés.
    On garde les créneaux réservés pour ne pas casser les rendez-vous existants.
*/
async function deletePastAvailableCreneaux(connection = pool) {
    await connection.query(`
        DELETE FROM creneaux_disponibles
        WHERE statut <> 'reserve'
          AND TIMESTAMP(date_creneau, heure_creneau) < NOW()
    `);
}

const createRendezvous = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

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

        await connection.query(
            "UPDATE creneaux_disponibles SET statut = 'reserve' WHERE id = ?",
            [creneau_id]
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
            WHERE 1 = 1
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

        sql += " ORDER BY r.date_rdv DESC, r.heure_rdv DESC";

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
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Rendez-vous introuvable"
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
            "SELECT * FROM rendezvous WHERE id = ? FOR UPDATE",
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
            "UPDATE rendezvous SET statut = ? WHERE id = ?",
            [statut, id]
        );

        if (statut === "annule" && rdv.creneau_id) {
            await connection.query(
                "UPDATE creneaux_disponibles SET statut = 'disponible' WHERE id = ?",
                [rdv.creneau_id]
            );
        }

        if ((statut === "confirme" || statut === "termine") && rdv.creneau_id) {
            await connection.query(
                "UPDATE creneaux_disponibles SET statut = 'reserve' WHERE id = ?",
                [rdv.creneau_id]
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

        const { id } = req.params;

        const [rdvRows] = await connection.query(
            "SELECT * FROM rendezvous WHERE id = ? FOR UPDATE",
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

        if (rdv.creneau_id) {
            await connection.query(
                "UPDATE creneaux_disponibles SET statut = 'disponible' WHERE id = ?",
                [rdv.creneau_id]
            );
        }

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

module.exports = {
    createRendezvous,
    getAllRendezvous,
    getRendezvousById,
    updateRendezvousStatut,
    deleteRendezvous
};