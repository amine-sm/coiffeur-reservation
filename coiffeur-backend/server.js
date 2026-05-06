const express = require("express");
const cors = require("cors");
require("dotenv").config();

const serviceRoutes = require("./routes/serviceRoutes");
const clientRoutes = require("./routes/clientRoutes");
const rendezvousRoutes = require("./routes/rendezvousRoutes");
const creneauRoutes = require("./routes/creneauRoutes");
const adminRoutes = require("./routes/adminRoutes");

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
});