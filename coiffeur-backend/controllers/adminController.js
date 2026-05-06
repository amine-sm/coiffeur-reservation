const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const registerAdmin = async (req, res) => {
    try {
        const { nom, email, password } = req.body;

        if (!nom || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Nom, email et mot de passe sont obligatoires"
            });
        }

        const [exists] = await pool.query(
            "SELECT id FROM admins WHERE email = ?",
            [email]
        );

        if (exists.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Cet email existe déjà"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            `INSERT INTO admins (nom, email, password)
             VALUES (?, ?, ?)`,
            [nom, email, hashedPassword]
        );

        res.status(201).json({
            success: true,
            message: "Admin créé avec succès",
            data: {
                id: result.insertId,
                nom,
                email
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur création admin",
            error: error.message
        });
    }
};

const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email et mot de passe sont obligatoires"
            });
        }

        const [rows] = await pool.query(
            "SELECT * FROM admins WHERE email = ?",
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Email ou mot de passe incorrect"
            });
        }

        const admin = rows[0];

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Email ou mot de passe incorrect"
            });
        }

        const token = jwt.sign(
            {
                id: admin.id,
                email: admin.email,
                role: admin.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            message: "Connexion réussie",
            token,
            admin: {
                id: admin.id,
                nom: admin.nom,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur connexion admin",
            error: error.message
        });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const [[totalRdv]] = await pool.query(
            "SELECT COUNT(*) AS total FROM rendezvous"
        );

        const [[rdvAttente]] = await pool.query(
            "SELECT COUNT(*) AS total FROM rendezvous WHERE statut = 'en_attente'"
        );

        const [[rdvConfirmes]] = await pool.query(
            "SELECT COUNT(*) AS total FROM rendezvous WHERE statut = 'confirme'"
        );

        const [[rdvTermines]] = await pool.query(
            "SELECT COUNT(*) AS total FROM rendezvous WHERE statut = 'termine'"
        );

        const [[recette]] = await pool.query(
            "SELECT COALESCE(SUM(prix), 0) AS total FROM rendezvous WHERE statut = 'termine'"
        );

        const [[creneauxDisponibles]] = await pool.query(
            "SELECT COUNT(*) AS total FROM creneaux_disponibles WHERE statut = 'disponible'"
        );

        const [[creneauxReserves]] = await pool.query(
            "SELECT COUNT(*) AS total FROM creneaux_disponibles WHERE statut = 'reserve'"
        );

        const [topServices] = await pool.query(
            `SELECT 
                s.nom,
                COUNT(r.id) AS total
             FROM rendezvous r
             LEFT JOIN services s ON s.id = r.service_id
             GROUP BY s.id, s.nom
             ORDER BY total DESC
             LIMIT 5`
        );

        res.json({
            success: true,
            data: {
                total_rendezvous: totalRdv.total,
                rendezvous_en_attente: rdvAttente.total,
                rendezvous_confirmes: rdvConfirmes.total,
                rendezvous_termines: rdvTermines.total,
                recette_totale: recette.total,
                creneaux_disponibles: creneauxDisponibles.total,
                creneaux_reserves: creneauxReserves.total,
                top_services: topServices
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur statistiques dashboard",
            error: error.message
        });
    }
};

module.exports = {
    registerAdmin,
    loginAdmin,
    getDashboardStats
};