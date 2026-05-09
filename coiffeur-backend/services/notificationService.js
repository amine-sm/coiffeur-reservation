const nodemailer = require("nodemailer");
const TelegramBot = require("node-telegram-bot-api");

const salonName = process.env.SALON_NAME || "Salon de coiffure";
const barberEmail = process.env.BARBER_EMAIL || "";
const barberChatId = process.env.TELEGRAM_BARBER_CHAT_ID || "";

let bot = null;

if (process.env.TELEGRAM_BOT_TOKEN) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
        polling: false
    });
}

let mailTransporter = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    mailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || "false") === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatClientName(rdv) {
    return `${rdv.nom_client || ""} ${rdv.prenom_client || ""}`.trim();
}

function cleanTime(value) {
    if (!value) return "-";
    return String(value).slice(0, 5);
}

function formatRdvText(rdv) {
    return [
        `RDV #${rdv.id}`,
        `Client : ${formatClientName(rdv) || "-"}`,
        `Téléphone : ${rdv.telephone || "-"}`,
        `Email : ${rdv.email || "-"}`,
        `Service : ${rdv.service_nom || "-"}`,
        `Date : ${rdv.date_rdv || "-"}`,
        `Heure : ${cleanTime(rdv.heure_rdv)}`,
        `Prix : ${rdv.prix || 0} DZD`,
        `Statut : ${rdv.statut || "-"}`
    ].join("\n");
}

function htmlTemplate(title, message, rdv) {
    return `
        <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;">
            <div style="max-width:620px;margin:auto;background:#ffffff;border-radius:22px;padding:24px;border:1px solid #e5e7eb;">
                <div style="height:4px;background:linear-gradient(90deg,#D97706,#FBBF24,#D97706);border-radius:999px;margin-bottom:20px;"></div>

                <h2 style="margin:0;color:#111827;font-size:24px;">
                    ${escapeHtml(title)}
                </h2>

                <p style="font-size:15px;line-height:1.7;color:#374151;">
                    ${message}
                </p>

                <div style="margin-top:18px;background:#111111;color:#ffffff;border-radius:18px;padding:18px;">
                    <p><b>RDV #${escapeHtml(rdv.id)}</b></p>
                    <p>Client : ${escapeHtml(formatClientName(rdv) || "-")}</p>
                    <p>Téléphone : ${escapeHtml(rdv.telephone || "-")}</p>
                    <p>Email : ${escapeHtml(rdv.email || "-")}</p>
                    <p>Service : ${escapeHtml(rdv.service_nom || "-")}</p>
                    <p>Date : ${escapeHtml(rdv.date_rdv || "-")}</p>
                    <p>Heure : ${escapeHtml(cleanTime(rdv.heure_rdv))}</p>
                    <p>Prix : ${escapeHtml(rdv.prix || 0)} DZD</p>
                    <p>Statut : ${escapeHtml(rdv.statut || "-")}</p>
                </div>

                <p style="margin-top:18px;color:#6b7280;font-size:13px;">
                    ${escapeHtml(salonName)}
                </p>
            </div>
        </div>
    `;
}

async function sendEmail(to, subject, html, text) {
    try {
        if (!mailTransporter) {
            console.warn("⚠️ SMTP non configuré. Email ignoré.");
            return { success: false, skipped: true };
        }

        if (!to) {
            return { success: false, skipped: true };
        }

        const result = await mailTransporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || salonName}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
            to,
            subject,
            html,
            text
        });

        console.log("✅ Email envoyé :", result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error("❌ Erreur email :", error.message);
        return { success: false, error: error.message };
    }
}

async function sendTelegramToChat(chatId, message, options = {}) {
    try {
        if (!bot) {
            console.warn("⚠️ Telegram non configuré.");
            return { success: false, skipped: true };
        }

        if (!chatId) {
            console.warn("⚠️ chat_id Telegram manquant.");
            return { success: false, skipped: true };
        }

        const result = await bot.sendMessage(chatId, message, {
            parse_mode: "HTML",
            ...options
        });

        console.log("✅ Telegram envoyé :", result.message_id);
        return { success: true, messageId: result.message_id };
    } catch (error) {
        console.error("❌ Erreur Telegram :", error.message);
        return { success: false, error: error.message };
    }
}

async function sendTelegramMessage(message, options = {}) {
    return sendTelegramToChat(barberChatId, message, options);
}

async function notifyNewReservation(rdv) {
    const clientName = formatClientName(rdv);

    const telegramText =
`🔔 <b>Nouvelle réservation - ${escapeHtml(salonName)}</b>

<pre>${escapeHtml(formatRdvText(rdv))}</pre>

Choisissez une action :`;

    const telegramOptions = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "✅ Confirmer",
                        callback_data: `rdv:confirme:${rdv.id}`
                    },
                    {
                        text: "❌ Annuler",
                        callback_data: `rdv:annule:${rdv.id}`
                    }
                ],
                [
                    {
                        text: "💰 Terminer",
                        callback_data: `rdv:termine:${rdv.id}`
                    }
                ]
            ]
        }
    };

    const barberText =
`Nouvelle réservation - ${salonName}

${formatRdvText(rdv)}`;

    const clientText =
`Bonjour ${clientName || ""},

Votre demande de rendez-vous est bien reçue.

${formatRdvText(rdv)}

Statut : En attente de confirmation par le coiffeur.

Pour recevoir la réponse sur Telegram, cliquez sur le bouton dans la page de confirmation.

${salonName}`;

    await Promise.allSettled([
        sendTelegramMessage(telegramText, telegramOptions),

        sendEmail(
            barberEmail,
            `Nouvelle réservation RDV #${rdv.id}`,
            htmlTemplate(
                "Nouvelle réservation",
                "Un client vient de réserver un rendez-vous.",
                rdv
            ),
            barberText
        ),

        rdv.email
            ? sendEmail(
                rdv.email,
                `Votre demande de rendez-vous - ${salonName}`,
                htmlTemplate(
                    "Demande reçue",
                    "Votre demande de rendez-vous est bien reçue. Elle est en attente de confirmation.",
                    rdv
                ),
                clientText
            )
            : Promise.resolve()
    ]);
}

async function notifyStatusChange(rdv, statut) {
    const clientName = formatClientName(rdv);

    const messages = {
        en_attente: {
            title: "Rendez-vous en attente",
            client:
`Bonjour ${clientName || ""},

Votre rendez-vous est en attente.

${formatRdvText(rdv)}

${salonName}`,
            barber:
`ℹ️ RDV remis en attente.

${formatRdvText(rdv)}`
        },

        confirme: {
            title: "Rendez-vous confirmé",
            client:
`Bonjour ${clientName || ""},

✅ Votre rendez-vous est confirmé.

${formatRdvText(rdv)}

Merci d'arriver à l'heure.
${salonName}`,
            barber:
`✅ RDV confirmé.

${formatRdvText(rdv)}`
        },

        annule: {
            title: "Rendez-vous annulé",
            client:
`Bonjour ${clientName || ""},

❌ Votre rendez-vous est annulé.

${formatRdvText(rdv)}

Vous pouvez reprendre un autre créneau disponible.
${salonName}`,
            barber:
`❌ RDV annulé.

${formatRdvText(rdv)}

Les créneaux correspondants sont libérés.`
        },

        termine: {
            title: "Rendez-vous terminé",
            client:
`Bonjour ${clientName || ""},

✨ Merci pour votre visite.
Votre rendez-vous est marqué comme terminé.

${formatRdvText(rdv)}

À bientôt.
${salonName}`,
            barber:
`💰 RDV terminé et compté dans la recette.

${formatRdvText(rdv)}`
        }
    };

    const current = messages[statut] || messages.en_attente;

    const clientTelegramChatId =
        rdv.telegram_chat_id ||
        rdv.client_telegram_chat_id ||
        null;

    await Promise.allSettled([
        sendTelegramMessage(`<pre>${escapeHtml(current.barber)}</pre>`),

        clientTelegramChatId
            ? sendTelegramToChat(
                clientTelegramChatId,
                `<pre>${escapeHtml(current.client)}</pre>`
            )
            : Promise.resolve(),

        sendEmail(
            barberEmail,
            `${current.title} - RDV #${rdv.id}`,
            htmlTemplate(
                current.title,
                current.barber.replace(/\n/g, "<br/>"),
                rdv
            ),
            current.barber
        ),

        rdv.email
            ? sendEmail(
                rdv.email,
                `${current.title} - ${salonName}`,
                htmlTemplate(
                    current.title,
                    current.client.replace(/\n/g, "<br/>"),
                    rdv
                ),
                current.client
            )
            : Promise.resolve()
    ]);
}

module.exports = {
    sendEmail,
    sendTelegramMessage,
    sendTelegramToChat,
    notifyNewReservation,
    notifyStatusChange,
    formatRdvText,
    escapeHtml
};