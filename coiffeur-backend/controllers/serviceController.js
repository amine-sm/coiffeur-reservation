const pool = require("../config/db");
const fs = require("fs");
const path = require("path");

/*
    Construire l'URL complète de l'image.
    Exemple :
    image en base = /uploads/services/photo-123.jpg
    retourne = http://localhost:4000/uploads/services/photo-123.jpg
*/
function buildImageUrl(req, imagePath) {
    if (!imagePath) return null;

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath;
    }

    return `${req.protocol}://${req.get("host")}${imagePath}`;
}

/*
    Supprimer une ancienne image locale du serveur.
*/
function deleteLocalImage(imagePath) {
    if (!imagePath) return;

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return;
    }

    const cleanPath = imagePath.replace(/^\/+/, "");
    const fullPath = path.join(__dirname, "..", cleanPath);

    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }
}

const getAllServices = async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM services ORDER BY id DESC"
        );

        const data = rows.map((service) => ({
            ...service,
            image_url: buildImageUrl(req, service.image)
        }));

        res.json({
            success: true,
            data
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

        const service = {
            ...rows[0],
            image_url: buildImageUrl(req, rows[0].image)
        };

        res.json({
            success: true,
            data: service
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
        const { nom, duree, prix, description, statut } = req.body;

        if (!nom || !duree || !prix) {
            return res.status(400).json({
                success: false,
                message: "Nom, durée et prix sont obligatoires"
            });
        }

        let image = null;

        if (req.file) {
            image = `/uploads/services/${req.file.filename}`;
        }

        const [result] = await pool.query(
            `
            INSERT INTO services 
            (
                nom, 
                duree, 
                prix, 
                image, 
                description,
                statut
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                nom,
                duree,
                prix,
                image,
                description || null,
                statut || "actif"
            ]
        );

        const [rows] = await pool.query(
            "SELECT * FROM services WHERE id = ?",
            [result.insertId]
        );

        const service = {
            ...rows[0],
            image_url: buildImageUrl(req, rows[0].image)
        };

        res.status(201).json({
            success: true,
            message: "Service ajouté avec succès",
            data: service
        });
    } catch (error) {
        if (req.file) {
            deleteLocalImage(`/uploads/services/${req.file.filename}`);
        }

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
        const { nom, duree, prix, description, statut } = req.body;

        if (!nom || !duree || !prix) {
            return res.status(400).json({
                success: false,
                message: "Nom, durée et prix sont obligatoires"
            });
        }

        const [oldRows] = await pool.query(
            "SELECT * FROM services WHERE id = ?",
            [id]
        );

        if (oldRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Service introuvable"
            });
        }

        const oldService = oldRows[0];

        let image = oldService.image;

        if (req.file) {
            image = `/uploads/services/${req.file.filename}`;

            if (oldService.image) {
                deleteLocalImage(oldService.image);
            }
        }

        const [result] = await pool.query(
            `
            UPDATE services
            SET nom = ?,
                duree = ?,
                prix = ?,
                image = ?,
                description = ?,
                statut = ?
            WHERE id = ?
            `,
            [
                nom,
                duree,
                prix,
                image,
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

        const service = {
            ...rows[0],
            image_url: buildImageUrl(req, rows[0].image)
        };

        res.json({
            success: true,
            message: "Service modifié avec succès",
            data: service
        });
    } catch (error) {
        if (req.file) {
            deleteLocalImage(`/uploads/services/${req.file.filename}`);
        }

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

        const [oldRows] = await pool.query(
            "SELECT * FROM services WHERE id = ?",
            [id]
        );

        if (oldRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Service introuvable"
            });
        }

        const oldService = oldRows[0];

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

        if (oldService.image) {
            deleteLocalImage(oldService.image);
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