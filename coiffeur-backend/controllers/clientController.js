const pool = require("../config/db");

const getAllClients = async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM clients ORDER BY id DESC"
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur récupération clients",
            error: error.message
        });
    }
};

const getClientById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(
            "SELECT * FROM clients WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Client introuvable"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur récupération client",
            error: error.message
        });
    }
};

module.exports = {
    getAllClients,
    getClientById
};