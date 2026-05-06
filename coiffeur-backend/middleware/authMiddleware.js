const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const verifyAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Token manquant"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [rows] = await pool.query(
            "SELECT id, nom, email, role FROM admins WHERE id = ?",
            [decoded.id]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Admin introuvable"
            });
        }

        req.admin = rows[0];
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Token invalide",
            error: error.message
        });
    }
};

module.exports = {
    verifyAdmin
};