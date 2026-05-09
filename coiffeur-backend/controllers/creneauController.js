const pool = require("../config/db");

function isValidDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function isValidTime(value) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ""));
}

function toMinutes(time) {
    const [hours, minutes] = String(time).split(":").map(Number);
    return hours * 60 + minutes;
}

function isCreneauCompatible(heureDebut, dureeService, rendezvousExistants) {
    const newStart = toMinutes(heureDebut);
    const newEnd = newStart + Number(dureeService || 0);

    for (const rdv of rendezvousExistants) {
        const oldStart = toMinutes(rdv.heure_rdv);
        const oldEnd = oldStart + Number(rdv.service_duree || 0);

        const overlap = newStart < oldEnd && newEnd > oldStart;

        if (overlap) {
            return false;
        }
    }

    return true;
}

/*
    Supprime automatiquement les créneaux passés non réservés.
    Les créneaux réservés restent pour garder le lien avec les rendez-vous actifs.
*/
async function deletePastAvailableCreneaux(connection = pool) {
    await connection.query(`
        DELETE FROM creneaux_disponibles
        WHERE statut <> 'reserve'
          AND TIMESTAMP(date_creneau, heure_creneau) < NOW()
    `);
}

/*
    Vérifie si une date + heure est déjà passée côté MySQL.
*/
async function isPastDateTime(date_creneau, heure_creneau) {
    const dateTimeValue = `${date_creneau} ${heure_creneau}:00`;

    const [rows] = await pool.query(
        "SELECT TIMESTAMP(?) < NOW() AS is_past",
        [dateTimeValue]
    );

    return rows[0].is_past === 1;
}

async function getRendezvousByDate(date) {
    const [rdvRows] = await pool.query(
        `
        SELECT 
            TIME_FORMAT(r.heure_rdv, '%H:%i') AS heure_rdv,
            s.duree AS service_duree
        FROM rendezvous r
        LEFT JOIN services s ON s.id = r.service_id
        WHERE r.date_rdv = ?
          AND r.statut <> 'annule'
          AND TIMESTAMP(r.date_rdv, r.heure_rdv) >= NOW()
        `,
        [date]
    );

    return rdvRows;
}

const getAvailableCreneaux = async (req, res) => {
    try {
        await deletePastAvailableCreneaux();

        const { service_id, date } = req.query;

        let sql = `
            SELECT 
                c.id,
                c.service_id,
                DATE_FORMAT(c.date_creneau, '%Y-%m-%d') AS date_creneau,
                TIME_FORMAT(c.heure_creneau, '%H:%i') AS heure_creneau,
                c.statut,
                s.nom AS service_nom,
                s.duree AS service_duree,
                s.prix AS service_prix
            FROM creneaux_disponibles c
            LEFT JOIN services s ON s.id = c.service_id
            WHERE c.statut = 'disponible'
              AND TIMESTAMP(c.date_creneau, c.heure_creneau) >= NOW()
        `;

        const params = [];

        if (service_id) {
            sql += " AND c.service_id = ?";
            params.push(service_id);
        }

        if (date) {
            if (!isValidDate(date)) {
                return res.status(400).json({
                    success: false,
                    message: "Format date invalide. Utilisez YYYY-MM-DD"
                });
            }

            sql += " AND c.date_creneau = ?";
            params.push(date);
        }

        sql += " ORDER BY c.date_creneau ASC, c.heure_creneau ASC";

        const [rows] = await pool.query(sql, params);

        let data = rows;

        if (date) {
            const rdvRows = await getRendezvousByDate(date);

            data = rows.filter((creneau) =>
                isCreneauCompatible(
                    creneau.heure_creneau,
                    creneau.service_duree,
                    rdvRows
                )
            );
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur récupération créneaux disponibles",
            error: error.message
        });
    }
};

const getPublicCreneauxByDate = async (req, res) => {
    try {
        await deletePastAvailableCreneaux();

        const { service_id, date } = req.query;

        if (!service_id || !date) {
            return res.status(400).json({
                success: false,
                message: "Service et date sont obligatoires"
            });
        }

        if (!isValidDate(date)) {
            return res.status(400).json({
                success: false,
                message: "Format date invalide. Utilisez YYYY-MM-DD"
            });
        }

        const [rows] = await pool.query(
            `
            SELECT 
                c.id,
                c.service_id,
                DATE_FORMAT(c.date_creneau, '%Y-%m-%d') AS date_creneau,
                TIME_FORMAT(c.heure_creneau, '%H:%i') AS heure_creneau,
                c.statut,
                s.nom AS service_nom,
                s.duree AS service_duree,
                s.prix AS service_prix
            FROM creneaux_disponibles c
            LEFT JOIN services s ON s.id = c.service_id
            WHERE c.service_id = ?
              AND c.date_creneau = ?
              AND c.statut = 'disponible'
              AND TIMESTAMP(c.date_creneau, c.heure_creneau) >= NOW()
            ORDER BY c.heure_creneau ASC
            `,
            [service_id, date]
        );

        const rdvRows = await getRendezvousByDate(date);

        const filteredRows = rows.filter((creneau) =>
            isCreneauCompatible(
                creneau.heure_creneau,
                creneau.service_duree,
                rdvRows
            )
        );

        res.json({
            success: true,
            data: filteredRows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur récupération créneaux publics",
            error: error.message
        });
    }
};

const getPublicAvailableDates = async (req, res) => {
    try {
        await deletePastAvailableCreneaux();

        const { service_id } = req.query;

        if (!service_id) {
            return res.status(400).json({
                success: false,
                message: "Service obligatoire"
            });
        }

        const [rows] = await pool.query(
            `
            SELECT 
                DATE_FORMAT(date_creneau, '%Y-%m-%d') AS date_creneau,
                COUNT(*) AS total_creneaux,
                SUM(CASE WHEN statut = 'disponible' THEN 1 ELSE 0 END) AS total_disponibles
            FROM creneaux_disponibles
            WHERE service_id = ?
              AND statut = 'disponible'
              AND TIMESTAMP(date_creneau, heure_creneau) >= NOW()
            GROUP BY date_creneau
            HAVING total_disponibles > 0
            ORDER BY date_creneau ASC
            `,
            [service_id]
        );

        const finalDates = [];

        for (const row of rows) {
            const [creneaux] = await pool.query(
                `
                SELECT 
                    c.id,
                    TIME_FORMAT(c.heure_creneau, '%H:%i') AS heure_creneau,
                    s.duree AS service_duree
                FROM creneaux_disponibles c
                LEFT JOIN services s ON s.id = c.service_id
                WHERE c.service_id = ?
                  AND c.date_creneau = ?
                  AND c.statut = 'disponible'
                  AND TIMESTAMP(c.date_creneau, c.heure_creneau) >= NOW()
                `,
                [service_id, row.date_creneau]
            );

            const rdvRows = await getRendezvousByDate(row.date_creneau);

            const availableCreneaux = creneaux.filter((creneau) =>
                isCreneauCompatible(
                    creneau.heure_creneau,
                    creneau.service_duree,
                    rdvRows
                )
            );

            if (availableCreneaux.length > 0) {
                finalDates.push({
                    ...row,
                    total_disponibles: availableCreneaux.length
                });
            }
        }

        res.json({
            success: true,
            data: finalDates
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur récupération dates disponibles",
            error: error.message
        });
    }
};

const getAllCreneauxAdmin = async (req, res) => {
    try {
        await deletePastAvailableCreneaux();

        const [rows] = await pool.query(
            `
            SELECT 
                c.id,
                c.service_id,
                DATE_FORMAT(c.date_creneau, '%Y-%m-%d') AS date_creneau,
                TIME_FORMAT(c.heure_creneau, '%H:%i') AS heure_creneau,
                c.statut,
                s.nom AS service_nom,
                s.duree AS service_duree,
                s.prix AS service_prix
            FROM creneaux_disponibles c
            LEFT JOIN services s ON s.id = c.service_id
            WHERE TIMESTAMP(c.date_creneau, c.heure_creneau) >= NOW()
               OR c.statut = 'reserve'
            ORDER BY c.date_creneau DESC, c.heure_creneau DESC, s.nom ASC
            `
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur récupération créneaux admin",
            error: error.message
        });
    }
};

/*
    Nouvelle version :
    - accepte service_id pour compatibilité ancienne
    - accepte service_ids pour créer le même créneau pour plusieurs services
*/
const createCreneau = async (req, res) => {
    try {
        await deletePastAvailableCreneaux();

        const {
            service_id,
            service_ids,
            date_creneau,
            heure_creneau,
            statut
        } = req.body;

        const selectedServiceIds = Array.isArray(service_ids)
            ? service_ids
            : service_id
                ? [service_id]
                : [];

        if (selectedServiceIds.length === 0 || !date_creneau || !heure_creneau) {
            return res.status(400).json({
                success: false,
                message: "Au moins un service, la date et l'heure sont obligatoires"
            });
        }

        if (!isValidDate(date_creneau)) {
            return res.status(400).json({
                success: false,
                message: "Date invalide. Format attendu : YYYY-MM-DD"
            });
        }

        if (!isValidTime(heure_creneau)) {
            return res.status(400).json({
                success: false,
                message: "Heure invalide. Format attendu : HH:mm"
            });
        }

        const isPast = await isPastDateTime(date_creneau, heure_creneau);

        if (isPast) {
            return res.status(400).json({
                success: false,
                message: "Impossible de créer un créneau avec une date ou une heure déjà passée"
            });
        }

        const cleanServiceIds = [
            ...new Set(
                selectedServiceIds
                    .map((id) => String(id).trim())
                    .filter(Boolean)
            )
        ];

        if (cleanServiceIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Aucun service valide sélectionné"
            });
        }

        const [services] = await pool.query(
            `
            SELECT id
            FROM services
            WHERE id IN (?)
              AND statut = 'actif'
            `,
            [cleanServiceIds]
        );

        if (services.length !== cleanServiceIds.length) {
            return res.status(404).json({
                success: false,
                message: "Un ou plusieurs services sont introuvables ou inactifs"
            });
        }

        const [reservedSameTime] = await pool.query(
            `
            SELECT id
            FROM creneaux_disponibles
            WHERE date_creneau = ?
              AND heure_creneau = ?
              AND statut = 'reserve'
            LIMIT 1
            `,
            [date_creneau, heure_creneau]
        );

        if (reservedSameTime.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Cette heure est déjà réservée pour un autre service"
            });
        }

        const [duplicates] = await pool.query(
            `
            SELECT service_id
            FROM creneaux_disponibles
            WHERE service_id IN (?)
              AND date_creneau = ?
              AND heure_creneau = ?
            `,
            [cleanServiceIds, date_creneau, heure_creneau]
        );

        if (duplicates.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Ce créneau existe déjà pour un ou plusieurs services sélectionnés"
            });
        }

        const finalStatut = statut || "disponible";

        const values = cleanServiceIds.map((id) => [
            id,
            date_creneau,
            heure_creneau,
            finalStatut
        ]);

        await pool.query(
            `
            INSERT INTO creneaux_disponibles
            (
                service_id,
                date_creneau,
                heure_creneau,
                statut
            )
            VALUES ?
            `,
            [values]
        );

        const [rows] = await pool.query(
            `
            SELECT 
                c.id,
                c.service_id,
                DATE_FORMAT(c.date_creneau, '%Y-%m-%d') AS date_creneau,
                TIME_FORMAT(c.heure_creneau, '%H:%i') AS heure_creneau,
                c.statut,
                s.nom AS service_nom,
                s.duree AS service_duree,
                s.prix AS service_prix
            FROM creneaux_disponibles c
            LEFT JOIN services s ON s.id = c.service_id
            WHERE c.service_id IN (?)
              AND c.date_creneau = ?
              AND c.heure_creneau = ?
            ORDER BY s.nom ASC
            `,
            [cleanServiceIds, date_creneau, heure_creneau]
        );

        res.status(201).json({
            success: true,
            message: "Créneaux ajoutés avec succès pour les services sélectionnés",
            data: rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur ajout créneau",
            error: error.message
        });
    }
};

const updateCreneau = async (req, res) => {
    try {
        await deletePastAvailableCreneaux();

        const { id } = req.params;

        const {
            service_id,
            date_creneau,
            heure_creneau,
            statut
        } = req.body;

        if (!service_id || !date_creneau || !heure_creneau) {
            return res.status(400).json({
                success: false,
                message: "Service, date et heure sont obligatoires"
            });
        }

        if (!isValidDate(date_creneau)) {
            return res.status(400).json({
                success: false,
                message: "Date invalide. Format attendu : YYYY-MM-DD"
            });
        }

        if (!isValidTime(heure_creneau)) {
            return res.status(400).json({
                success: false,
                message: "Heure invalide. Format attendu : HH:mm"
            });
        }

        const isPast = await isPastDateTime(date_creneau, heure_creneau);

        if (isPast) {
            return res.status(400).json({
                success: false,
                message: "Impossible de modifier un créneau vers une date ou une heure déjà passée"
            });
        }

        const [oldRows] = await pool.query(
            "SELECT * FROM creneaux_disponibles WHERE id = ?",
            [id]
        );

        if (oldRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Créneau introuvable"
            });
        }

        if (oldRows[0].statut === "reserve") {
            return res.status(400).json({
                success: false,
                message: "Impossible de modifier un créneau réservé"
            });
        }

        const [services] = await pool.query(
            "SELECT id FROM services WHERE id = ? AND statut = 'actif'",
            [service_id]
        );

        if (services.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Service introuvable ou inactif"
            });
        }

        const [reservedSameTime] = await pool.query(
            `
            SELECT id
            FROM creneaux_disponibles
            WHERE date_creneau = ?
              AND heure_creneau = ?
              AND statut = 'reserve'
              AND id <> ?
            LIMIT 1
            `,
            [date_creneau, heure_creneau, id]
        );

        if (reservedSameTime.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Cette date et cette heure sont déjà réservées"
            });
        }

        const [duplicates] = await pool.query(
            `
            SELECT id
            FROM creneaux_disponibles
            WHERE service_id = ?
              AND date_creneau = ?
              AND heure_creneau = ?
              AND id <> ?
            LIMIT 1
            `,
            [service_id, date_creneau, heure_creneau, id]
        );

        if (duplicates.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Un autre créneau existe déjà avec cette date et cette heure pour ce service"
            });
        }

        const finalStatut = statut || "disponible";

        await pool.query(
            `
            UPDATE creneaux_disponibles
            SET service_id = ?,
                date_creneau = ?,
                heure_creneau = ?,
                statut = ?
            WHERE id = ?
            `,
            [service_id, date_creneau, heure_creneau, finalStatut, id]
        );

        const [rows] = await pool.query(
            `
            SELECT 
                c.id,
                c.service_id,
                DATE_FORMAT(c.date_creneau, '%Y-%m-%d') AS date_creneau,
                TIME_FORMAT(c.heure_creneau, '%H:%i') AS heure_creneau,
                c.statut,
                s.nom AS service_nom,
                s.duree AS service_duree,
                s.prix AS service_prix
            FROM creneaux_disponibles c
            LEFT JOIN services s ON s.id = c.service_id
            WHERE c.id = ?
            `,
            [id]
        );

        res.json({
            success: true,
            message: "Créneau modifié avec succès",
            data: rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur modification créneau",
            error: error.message
        });
    }
};

const deleteCreneau = async (req, res) => {
    try {
        await deletePastAvailableCreneaux();

        const { id } = req.params;

        const [oldRows] = await pool.query(
            "SELECT * FROM creneaux_disponibles WHERE id = ?",
            [id]
        );

        if (oldRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Créneau introuvable"
            });
        }

        if (oldRows[0].statut === "reserve") {
            return res.status(400).json({
                success: false,
                message: "Impossible de supprimer un créneau réservé"
            });
        }

        await pool.query(
            "DELETE FROM creneaux_disponibles WHERE id = ?",
            [id]
        );

        res.json({
            success: true,
            message: "Créneau supprimé avec succès"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur suppression créneau",
            error: error.message
        });
    }
};

module.exports = {
    getAvailableCreneaux,
    getPublicCreneauxByDate,
    getPublicAvailableDates,
    getAllCreneauxAdmin,
    createCreneau,
    updateCreneau,
    deleteCreneau,
    deletePastAvailableCreneaux
};