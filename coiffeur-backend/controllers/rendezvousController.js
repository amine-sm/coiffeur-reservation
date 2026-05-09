const pool = require("../config/db");

const {
    notifyNewReservation,
    notifyStatusChange
} = require("../services/notificationService");

/*
    Convertit HH:mm en minutes.
    Exemple : 10:30 => 630
*/
function toMinutes(time) {
    const [hours, minutes] = String(time).split(":").map(Number);
    return hours * 60 + minutes;
}

/*
    Convertit minutes en HH:mm.
    Exemple : 630 => 10:30
*/
function minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/*
    Vérifie si un nouveau RDV chevauche un autre RDV existant.

    Important :
    - On ignore les RDV annulés.
    - On vérifie uniquement les RDV futurs ou en cours.
*/
async function hasOverlapRendezvous(
    connection,
    dateRdv,
    heureDebut,
    duree,
    excludeRdvId = null
) {
    const newStart = toMinutes(heureDebut);
    const newEnd = newStart + Number(duree || 0);

    let sql = `
        SELECT 
            r.id,
            TIME_FORMAT(r.heure_rdv, '%H:%i') AS heure_rdv,
            s.duree AS service_duree
        FROM rendezvous r
        LEFT JOIN services s ON s.id = r.service_id
        WHERE r.date_rdv = ?
          AND r.statut <> 'annule'
          AND TIMESTAMPADD(
                MINUTE, 
                COALESCE(s.duree, 0), 
                TIMESTAMP(r.date_rdv, r.heure_rdv)
              ) >= NOW()
    `;

    const params = [dateRdv];

    if (excludeRdvId) {
        sql += " AND r.id <> ?";
        params.push(excludeRdvId);
    }

    sql += " FOR UPDATE";

    const [rows] = await connection.query(sql, params);

    for (const row of rows) {
        const oldStart = toMinutes(row.heure_rdv);
        const oldEnd = oldStart + Number(row.service_duree || 0);

        const overlap = newStart < oldEnd && newEnd > oldStart;

        if (overlap) {
            return true;
        }
    }

    return false;
}

/*
    Réserve tous les créneaux compris dans la durée du service.
    Exemple :
    - début : 10:00
    - durée : 60 min
    => bloque 10:00, 10:15, 10:30, 10:45 si ces créneaux existent.
*/
async function reserveCreneauxByDuration(connection, dateRdv, heureDebut, duree) {
    const start = toMinutes(heureDebut);
    const end = start + Number(duree || 0);

    const startTime = minutesToTime(start);
    const endTime = minutesToTime(end);

    await connection.query(
        `
        UPDATE creneaux_disponibles
        SET statut = 'reserve'
        WHERE date_creneau = ?
          AND TIME_FORMAT(heure_creneau, '%H:%i') >= ?
          AND TIME_FORMAT(heure_creneau, '%H:%i') < ?
        `,
        [dateRdv, startTime, endTime]
    );
}

/*
    Libère tous les créneaux compris dans la durée du service.
    Utilisé quand un RDV est annulé.
*/
async function libererCreneauxByDuration(connection, dateRdv, heureDebut, duree) {
    const start = toMinutes(heureDebut);
    const end = start + Number(duree || 0);

    const startTime = minutesToTime(start);
    const endTime = minutesToTime(end);

    await connection.query(
        `
        UPDATE creneaux_disponibles
        SET statut = 'disponible'
        WHERE date_creneau = ?
          AND TIME_FORMAT(heure_creneau, '%H:%i') >= ?
          AND TIME_FORMAT(heure_creneau, '%H:%i') < ?
        `,
        [dateRdv, startTime, endTime]
    );
}

/*
    Supprime les créneaux passés non réservés.

    Important :
    - Les créneaux disponibles passés peuvent être supprimés.
    - Les créneaux réservés restent pour garder la cohérence avec les RDV.
*/
async function deletePastAvailableCreneaux(connection = pool) {
    await connection.query(`
        DELETE FROM creneaux_disponibles
        WHERE statut <> 'reserve'
          AND TIMESTAMP(date_creneau, heure_creneau) < NOW()
    `);
}

/*
    Ne supprime plus les rendez-vous passés.

    Correction importante pour la recette :
    - Avant, les RDV passés étaient supprimés avec DELETE.
    - Maintenant, on garde les RDV dans la table rendezvous.
    - Les RDV passés confirmés/en_attente deviennent "termine".
    - Les RDV "termine" restent en base pour calculer la recette.
    - Les RDV "annule" restent annulés et ne comptent pas dans la recette.

    Un RDV devient terminé après la fin du service :
    date_rdv + heure_rdv + durée service < maintenant.
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
                r.id,
                r.statut,
                DATE_FORMAT(r.date_rdv, '%Y-%m-%d') AS date_rdv,
                TIME_FORMAT(r.heure_rdv, '%H:%i') AS heure_rdv,
                COALESCE(s.duree, 0) AS service_duree
            FROM rendezvous r
            LEFT JOIN services s ON s.id = r.service_id
            WHERE r.statut IN ('en_attente', 'confirme')
              AND TIMESTAMPADD(
                    MINUTE, 
                    COALESCE(s.duree, 0), 
                    TIMESTAMP(r.date_rdv, r.heure_rdv)
                  ) < NOW()
            FOR UPDATE
        `);

        if (expiredRows.length === 0) {
            if (ownConnection) {
                await conn.commit();
            }

            return {
                updatedRendezvous: 0,
                deletedRendezvous: 0,
                message: "Aucun rendez-vous passé à terminer"
            };
        }

        const rdvIds = expiredRows.map((row) => row.id);

        await conn.query(
            `
            UPDATE rendezvous
            SET statut = 'termine'
            WHERE id IN (?)
            `,
            [rdvIds]
        );

        if (ownConnection) {
            await conn.commit();
        }

        return {
            updatedRendezvous: rdvIds.length,
            deletedRendezvous: 0,
            message: "Rendez-vous passés marqués comme terminés"
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

        const hasOverlap = await hasOverlapRendezvous(
            connection,
            creneau.date_creneau,
            creneau.heure_creneau,
            service.duree
        );

        if (hasOverlap) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: "Ce créneau chevauche déjà un autre rendez-vous. Veuillez choisir une autre heure."
            });
        }

        let clientId = null;

        const [clients] = await connection.query(
            "SELECT id, telegram_chat_id FROM clients WHERE telephone = ? LIMIT 1",
            [telephone]
        );

        if (clients.length > 0) {
            clientId = clients[0].id;

            await connection.query(
                `
                UPDATE clients
                SET nom = ?,
                    prenom = ?,
                    email = ?
                WHERE id = ?
                `,
                [
                    nom_client,
                    prenom_client || null,
                    email || null,
                    clientId
                ]
            );
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

        await reserveCreneauxByDuration(
            connection,
            creneau.date_creneau,
            creneau.heure_creneau,
            service.duree
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
                r.telegram_chat_id,
                cl.telegram_chat_id AS client_telegram_chat_id,
                DATE_FORMAT(r.date_rdv, '%Y-%m-%d') AS date_rdv,
                TIME_FORMAT(r.heure_rdv, '%H:%i') AS heure_rdv,
                r.statut,
                r.prix,
                r.note,
                s.nom AS service_nom,
                s.duree AS service_duree
            FROM rendezvous r
            LEFT JOIN services s ON s.id = r.service_id
            LEFT JOIN clients cl ON cl.id = r.client_id
            WHERE r.id = ?
            `,
            [rdvResult.insertId]
        );

        await connection.commit();

        notifyNewReservation(rdvRows[0]).catch((error) => {
            console.error("❌ Erreur notification nouvelle réservation :", error.message);
        });

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
                r.telegram_chat_id,
                cl.telegram_chat_id AS client_telegram_chat_id,
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
            LEFT JOIN clients cl ON cl.id = r.client_id
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
                r.telegram_chat_id,
                cl.telegram_chat_id AS client_telegram_chat_id,
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
            LEFT JOIN clients cl ON cl.id = r.client_id
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
                r.*,
                DATE_FORMAT(r.date_rdv, '%Y-%m-%d') AS clean_date_rdv,
                TIME_FORMAT(r.heure_rdv, '%H:%i') AS clean_heure_rdv,
                s.duree AS service_duree
            FROM rendezvous r
            LEFT JOIN services s ON s.id = r.service_id
            WHERE r.id = ?
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
            "UPDATE rendezvous SET statut = ? WHERE id = ?",
            [statut, id]
        );

        if (statut === "annule") {
            await libererCreneauxByDuration(
                connection,
                rdv.clean_date_rdv,
                rdv.clean_heure_rdv,
                rdv.service_duree
            );
        }

        if (
            statut === "confirme" ||
            statut === "termine" ||
            statut === "en_attente"
        ) {
            await reserveCreneauxByDuration(
                connection,
                rdv.clean_date_rdv,
                rdv.clean_heure_rdv,
                rdv.service_duree
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
                r.telegram_chat_id,
                cl.telegram_chat_id AS client_telegram_chat_id,
                DATE_FORMAT(r.date_rdv, '%Y-%m-%d') AS date_rdv,
                TIME_FORMAT(r.heure_rdv, '%H:%i') AS heure_rdv,
                r.statut,
                r.prix,
                r.note,
                s.nom AS service_nom,
                s.duree AS service_duree
            FROM rendezvous r
            LEFT JOIN services s ON s.id = r.service_id
            LEFT JOIN clients cl ON cl.id = r.client_id
            WHERE r.id = ?
            `,
            [id]
        );

        await connection.commit();

        notifyStatusChange(rows[0], statut).catch((error) => {
            console.error("❌ Erreur notification changement statut :", error.message);
        });

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

/*
    Suppression professionnelle :
    - On ne supprime plus physiquement un rendez-vous.
    - On le transforme en "annule".
    - Cela garde l'historique client.
    - Cela évite les pertes de données.
    - Les RDV annulés ne comptent pas dans la recette.
*/
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
                r.*,
                DATE_FORMAT(r.date_rdv, '%Y-%m-%d') AS clean_date_rdv,
                TIME_FORMAT(r.heure_rdv, '%H:%i') AS clean_heure_rdv,
                COALESCE(s.duree, 0) AS service_duree
            FROM rendezvous r
            LEFT JOIN services s ON s.id = r.service_id
            WHERE r.id = ?
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

        if (rdv.statut === "termine") {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "Impossible de supprimer un rendez-vous terminé, car il sert au calcul de la recette"
            });
        }

        await libererCreneauxByDuration(
            connection,
            rdv.clean_date_rdv,
            rdv.clean_heure_rdv,
            rdv.service_duree
        );

        const [deleteResult] = await connection.query(
            "DELETE FROM rendezvous WHERE id = ?",
            [id]
        );

        if (deleteResult.affectedRows === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Rendez-vous introuvable ou déjà supprimé"
            });
        }

        await connection.commit();

        return res.json({
            success: true,
            message: "Rendez-vous supprimé définitivement et créneaux libérés avec succès",
            data: {
                id: Number(id),
                ancien_statut: rdv.statut
            }
        });
    } catch (error) {
        await connection.rollback();

        return res.status(500).json({
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
            message: "Nettoyage terminé : les rendez-vous passés sont conservés et marqués terminés",
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