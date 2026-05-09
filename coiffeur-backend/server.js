const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const serviceRoutes = require("./routes/serviceRoutes");
const clientRoutes = require("./routes/clientRoutes");
const rendezvousRoutes = require("./routes/rendezvousRoutes");
const creneauRoutes = require("./routes/creneauRoutes");
const adminRoutes = require("./routes/adminRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const {
    deleteExpiredRendezvous
} = require("./controllers/rendezvousController");

const {
    initTelegramBot
} = require("./controllers/telegramBotController");

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
    : [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ];

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Backend application coiffeur fonctionne avec MySQL ✅"
    });
});

app.use("/api/services", serviceRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/rendezvous", rendezvousRoutes);
app.use("/api/creneaux", creneauRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route introuvable"
    });
});

app.use((err, req, res, next) => {
    console.error("Erreur serveur :", err);

    res.status(500).json({
        success: false,
        message: "Erreur interne serveur",
        error: err.message
    });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);

    initTelegramBot();

    cleanExpiredRdvOnServerStart();
    startExpiredRdvCleaner();
});

async function cleanExpiredRdvOnServerStart() {
    try {
        const result = await deleteExpiredRendezvous();

        if (result.deletedRendezvous > 0) {
            console.log(
                `🧹 Nettoyage démarrage : ${result.deletedRendezvous} RDV expiré(s) supprimé(s), ${result.updatedCreneaux} créneau(x) libéré(s)`
            );
        } else {
            console.log("✅ Aucun RDV expiré au démarrage");
        }
    } catch (error) {
        console.error(
            "❌ Erreur nettoyage RDV au démarrage :",
            error.message
        );
    }
}

function startExpiredRdvCleaner() {
    setInterval(async () => {
        try {
            const result = await deleteExpiredRendezvous();

            if (result.deletedRendezvous > 0) {
                console.log(
                    `🧹 Nettoyage automatique : ${result.deletedRendezvous} RDV expiré(s) supprimé(s), ${result.updatedCreneaux} créneau(x) libéré(s)`
                );
            }
        } catch (error) {
            console.error(
                "❌ Erreur nettoyage automatique RDV expirés :",
                error.message
            );
        }
    }, 60 * 1000);
}