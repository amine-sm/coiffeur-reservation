const TelegramBot = require("node-telegram-bot-api");
const pool = require("../config/db");

const {
    changeRendezvousStatus
} = require("../services/rendezvousStatusService");

const {
    notifyStatusChange,
    formatRdvText
} = require("../services/notificationService");

let botInstance = null;
let isBotInitialized = false;

function getActionLabel(statut) {
    const labels = {
        en_attente: "remis en attente",
        confirme: "confirmé",
        annule: "annulé",
        termine: "terminé"
    };

    return labels[statut] || statut;
}

function botFooter() {
    return `
━━━━━━━━━━━━━━━━━━━━
PRESTIGE Salon • Message automatique
`.trim();
}

function formatClientLinkedMessage() {
    return `
💈 Votre rendez-vous est bien connecté

Bonjour 👋

Votre Telegram est maintenant lié à votre rendez-vous.

Vous recevrez ici les notifications importantes :

✅ Confirmation du rendez-vous
❌ Annulation du rendez-vous
⏳ Changement de statut
✔️ Fin du rendez-vous

Merci pour votre confiance.

${botFooter()}
`.trim();
}

function formatSalonStartMessage(chatId) {
    return `
💈 PRESTIGE Salon Bot

━━━━━━━━━━━━━━━━━━━━

Le bot Telegram est actif avec succès.

Chat ID du salon :

${chatId}

Copiez cette valeur dans votre fichier .env :

TELEGRAM_BARBER_CHAT_ID=${chatId}

Vous recevrez ici les nouveaux rendez-vous avec les boutons :

✅ Confirmer
❌ Annuler
✔️ Terminer

${botFooter()}
`.trim();
}

function formatInvalidLinkMessage() {
    return `
❌ Lien invalide

Le lien de rendez-vous est invalide ou expiré.

Veuillez demander un nouveau lien au salon.

${botFooter()}
`.trim();
}

function formatBotErrorMessage() {
    return `
❌ Erreur

Une erreur est survenue pendant la liaison Telegram.

Veuillez réessayer plus tard.

${botFooter()}
`.trim();
}

function formatSalonActionDoneMessage(rdvId, statut, rdv) {
    return `
✅ Action enregistrée avec succès

━━━━━━━━━━━━━━━━━━━━

Rendez-vous : #${rdvId}
Nouveau statut : ${getActionLabel(statut)}

📋 Détails du rendez-vous

${formatRdvText(rdv)}

${botFooter()}
`.trim();
}

function getBot() {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
        console.warn("⚠️ TELEGRAM_BOT_TOKEN manquant. Bot Telegram désactivé.");
        return null;
    }

    if (!botInstance) {
        botInstance = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
            polling: true
        });
    }

    return botInstance;
}

async function linkClientTelegramToRdv(chatId, rdvId) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [rows] = await connection.query(
            `
            SELECT 
                id,
                client_id,
                nom_client,
                prenom_client,
                telephone,
                email
            FROM rendezvous
            WHERE id = ?
            FOR UPDATE
            `,
            [rdvId]
        );

        if (rows.length === 0) {
            await connection.rollback();

            return {
                success: false,
                message: "Rendez-vous introuvable."
            };
        }

        const rdv = rows[0];

        await connection.query(
            `
            UPDATE rendezvous
            SET telegram_chat_id = ?
            WHERE id = ?
            `,
            [String(chatId), rdvId]
        );

        if (rdv.client_id) {
            await connection.query(
                `
                UPDATE clients
                SET telegram_chat_id = ?
                WHERE id = ?
                `,
                [String(chatId), rdv.client_id]
            );
        }

        await connection.commit();

        return {
            success: true,
            rdv
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

function initTelegramBot() {
    const bot = getBot();

    if (!bot) {
        return null;
    }

    if (isBotInitialized) {
        console.log("ℹ️ Bot Telegram déjà initialisé.");
        return bot;
    }

    isBotInitialized = true;

    bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const payload = match && match[1] ? String(match[1]).trim() : "";

        try {
            if (payload.startsWith("rdv_")) {
                const rdvId = Number(payload.replace("rdv_", ""));

                if (!rdvId) {
                    await bot.sendMessage(
                        chatId,
                        formatInvalidLinkMessage()
                    );
                    return;
                }

                const result = await linkClientTelegramToRdv(chatId, rdvId);

                if (!result.success) {
                    await bot.sendMessage(
                        chatId,
                        formatInvalidLinkMessage()
                    );
                    return;
                }

                await bot.sendMessage(
                    chatId,
                    formatClientLinkedMessage()
                );

                return;
            }

            await bot.sendMessage(
                chatId,
                formatSalonStartMessage(chatId)
            );
        } catch (error) {
            console.error("❌ Erreur /start Telegram :", error);

            await bot.sendMessage(
                chatId,
                formatBotErrorMessage()
            );
        }
    });

    bot.on("callback_query", async (query) => {
        const chatId = query.message && query.message.chat
            ? query.message.chat.id
            : null;

        const messageId = query.message
            ? query.message.message_id
            : null;

        const data = query.data || "";

        try {
            const allowedChatId = String(process.env.TELEGRAM_BARBER_CHAT_ID || "");

            if (!chatId || String(chatId) !== allowedChatId) {
                await bot.answerCallbackQuery(query.id, {
                    text: "⛔ Non autorisé.",
                    show_alert: true
                });
                return;
            }

            const parts = data.split(":");

            if (parts.length !== 3 || parts[0] !== "rdv") {
                await bot.answerCallbackQuery(query.id, {
                    text: "Action invalide.",
                    show_alert: true
                });
                return;
            }

            const statut = parts[1];
            const rdvId = Number(parts[2]);

            if (!rdvId) {
                await bot.answerCallbackQuery(query.id, {
                    text: "RDV invalide.",
                    show_alert: true
                });
                return;
            }

            const updatedRdv = await changeRendezvousStatus(rdvId, statut);

            await notifyStatusChange(updatedRdv, statut);

            await bot.answerCallbackQuery(query.id, {
                text: `✅ RDV #${rdvId} ${getActionLabel(statut)}.`,
                show_alert: false
            });

            if (chatId && messageId) {
                await bot.editMessageText(
                    formatSalonActionDoneMessage(rdvId, statut, updatedRdv),
                    {
                        chat_id: chatId,
                        message_id: messageId
                    }
                );
            }
        } catch (error) {
            console.error("❌ Erreur callback Telegram :", error);

            await bot.answerCallbackQuery(query.id, {
                text: error.message || "Erreur serveur.",
                show_alert: true
            });
        }
    });

    bot.on("polling_error", (error) => {
        console.error("❌ Telegram polling error :", error.message);
    });

    console.log("✅ Bot Telegram lancé avec succès.");

    return bot;
}

module.exports = {
    initTelegramBot
};