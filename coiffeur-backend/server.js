const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const serviceRoutes = require("./routes/serviceRoutes");
const clientRoutes = require("./routes/clientRoutes");
const rendezvousRoutes = require("./routes/rendezvousRoutes");
const creneauRoutes = require("./routes/creneauRoutes");
const adminRoutes = require("./routes/adminRoutes");

// IMPORTANT : on importe la fonction qui supprime les RDV expirés
const {
    deleteExpiredRendezvous
} = require("./controllers/rendezvousController");

const app = express();

app.use(
    cors({
        origin: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001"
        ],
        credentials: true
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// IMPORTANT : rendre le dossier uploads accessible publiquement
// Exemple image : http://localhost:4000/uploads/services/photo.png
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

    // Nettoyage au démarrage du serveur
    cleanExpiredRdvOnServerStart();

    // Nettoyage automatique chaque 1 minute
    startExpiredRdvCleaner();
});

/*
    Cette fonction nettoie les RDV expirés directement au démarrage.
    Exemple :
    - Le serveur était fermé
    - Des RDV sont passés
    - Quand tu relances le serveur, ils seront supprimés automatiquement
*/
async function cleanExpiredRdvOnServerStart() {
    try {
        const result = await deleteExpiredRendezvous();

        if (result.deletedRendezvous > 0) {
            console.log(
                `🧹 Nettoyage démarrage : ${result.deletedRendezvous} RDV expiré(s) supprimé(s), ${result.deletedCreneaux} créneau(x) supprimé(s)`
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

/*
    Cette fonction tourne chaque 1 minute.
    Si un RDV dépasse son heure, il sera supprimé automatiquement.
*/
function startExpiredRdvCleaner() {
    setInterval(async () => {
        try {
            const result = await deleteExpiredRendezvous();

            if (result.deletedRendezvous > 0) {
                console.log(
                    `🧹 Nettoyage automatique : ${result.deletedRendezvous} RDV expiré(s) supprimé(s), ${result.deletedCreneaux} créneau(x) supprimé(s)`
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