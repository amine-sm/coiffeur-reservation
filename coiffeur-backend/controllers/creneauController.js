const pool = require("../config/db");

function isValidDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function isValidTime(value) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ""));
}

const getAvailableCreneaux = async (req, res) => {
    try {
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
              AND c.date_creneau >= CURDATE()
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

        res.json({
            success: true,
            data: rows
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
            ORDER BY c.heure_creneau ASC
            `,
            [service_id, date]
        );

        res.json({
            success: true,
            data: rows
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
              AND date_creneau >= CURDATE()
            GROUP BY date_creneau
            HAVING total_disponibles > 0
            ORDER BY date_creneau ASC
            `,
            [service_id]
        );

        res.json({
            success: true,
            data: rows
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
            ORDER BY c.date_creneau DESC, c.heure_creneau DESC
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

const createCreneau = async (req, res) => {
    try {
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

        const [exists] = await pool.query(
            `
            SELECT id 
            FROM creneaux_disponibles 
            WHERE service_id = ?
              AND date_creneau = ?
              AND heure_creneau = ?
            LIMIT 1
            `,
            [service_id, date_creneau, heure_creneau]
        );

        if (exists.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Ce créneau existe déjà pour ce service"
            });
        }

        const finalStatut = statut || "disponible";

        const [result] = await pool.query(
            `
            INSERT INTO creneaux_disponibles
            (
                service_id,
                date_creneau,
                heure_creneau,
                statut
            )
            VALUES (?, ?, ?, ?)
            `,
            [service_id, date_creneau, heure_creneau, finalStatut]
        );

        const [rows] = await pool.query(
            `
            SELECT 
                c.id,
                c.service_id,
                DATE_FORMAT(c.date_creneau, '%Y-%m-%d') AS date_creneau,
                TIME_FORMAT(c.heure_creneau, '%H:%i') AS heure_creneau,
                c.statut,
                s.nom AS service_nom
            FROM creneaux_disponibles c
            LEFT JOIN services s ON s.id = c.service_id
            WHERE c.id = ?
            `,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: "Créneau ajouté avec succès",
            data: rows[0]
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
                message: "Un autre créneau existe déjà avec cette date et cette heure"
            });
        }

        await pool.query(
            `
            UPDATE creneaux_disponibles
            SET service_id = ?,
                date_creneau = ?,
                heure_creneau = ?,
                statut = ?
            WHERE id = ?
            `,
            [
                service_id,
                date_creneau,
                heure_creneau,
                statut || "disponible",
                id
            ]
        );

        const [rows] = await pool.query(
            `
            SELECT 
                c.id,
                c.service_id,
                DATE_FORMAT(c.date_creneau, '%Y-%m-%d') AS date_creneau,
                TIME_FORMAT(c.heure_creneau, '%H:%i') AS heure_creneau,
                c.statut,
                s.nom AS service_nom
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
        const { id } = req.params;

        const [rows] = await pool.query(
            "SELECT * FROM creneaux_disponibles WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Créneau introuvable"
            });
        }

        if (rows[0].statut === "reserve") {
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
    deleteCreneau
};