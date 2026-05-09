// services/smtpService.js

const nodemailer = require("nodemailer");

const smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function verifySmtpConnection() {
    try {
        await smtpTransporter.verify();
        console.log("✅ SMTP connecté avec succès.");
        return true;
    } catch (error) {
        console.error("❌ Erreur connexion SMTP :", error.message);
        return false;
    }
}

module.exports = {
    smtpTransporter,
    verifySmtpConnection
};