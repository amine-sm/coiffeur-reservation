const pool = require("../config/db");

const getAllServices = async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM services ORDER BY id DESC"
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur récupération services",
            error: error.message
        });
    }
};

const getServiceById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(
            "SELECT * FROM services WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Service introuvable"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur récupération service",
            error: error.message
        });
    }
};

const createService = async (req, res) => {
    try {
        const { nom, duree, prix, image, description } = req.body;

        if (!nom || !duree || !prix) {
            return res.status(400).json({
                success: false,
                message: "Nom, durée et prix sont obligatoires"
            });
        }

        const [result] = await pool.query(
            `INSERT INTO services (nom, duree, prix, image, description)
             VALUES (?, ?, ?, ?, ?)`,
            [nom, duree, prix, image || null, description || null]
        );

        const [rows] = await pool.query(
            "SELECT * FROM services WHERE id = ?",
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: "Service ajouté avec succès",
            data: rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur ajout service",
            error: error.message
        });
    }
};

const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, duree, prix, image, description, statut } = req.body;

        if (!nom || !duree || !prix) {
            return res.status(400).json({
                success: false,
                message: "Nom, durée et prix sont obligatoires"
            });
        }

        const [result] = await pool.query(
            `UPDATE services
             SET nom = ?,
                 duree = ?,
                 prix = ?,
                 image = ?,
                 description = ?,
                 statut = ?
             WHERE id = ?`,
            [
                nom,
                duree,
                prix,
                image || null,
                description || null,
                statut || "actif",
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Service introuvable"
            });
        }

        const [rows] = await pool.query(
            "SELECT * FROM services WHERE id = ?",
            [id]
        );

        res.json({
            success: true,
            message: "Service modifié avec succès",
            data: rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur modification service",
            error: error.message
        });
    }
};

const deleteService = async (req, res) => {
    try {
        const { id } = req.params;

        const [hasRdv] = await pool.query(
            "SELECT id FROM rendezvous WHERE service_id = ? LIMIT 1",
            [id]
        );

        if (hasRdv.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Impossible de supprimer ce service car il possède des rendez-vous"
            });
        }

        const [result] = await pool.query(
            "DELETE FROM services WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Service introuvable"
            });
        }

        res.json({
            success: true,
            message: "Service supprimé avec succès"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur suppression service",
            error: error.message
        });
    }
};

module.exports = {
    getAllServices,
    getServiceById,
    createService,
    updateService,
    deleteService
};