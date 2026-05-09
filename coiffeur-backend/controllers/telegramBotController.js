const TelegramBot = require("node-telegram-bot-api");
const pool = require("../config/db");

const {
    changeRendezvousStatus
} = require("../services/rendezvousStatusService");

const {
    notifyStatusChange,
    formatRdvText,
    escapeHtml
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
                        "❌ Lien de rendez-vous invalide."
                    );
                    return;
                }

                const result = await linkClientTelegramToRdv(chatId, rdvId);

                if (!result.success) {
                    await bot.sendMessage(
                        chatId,
                        "❌ Rendez-vous introuvable ou expiré."
                    );
                    return;
                }

                await bot.sendMessage(
                    chatId,
                    `✅ Votre Telegram est bien lié au RDV #${rdvId}.\n\nVous recevrez ici la confirmation ou l'annulation du coiffeur.`
                );

                return;
            }

            await bot.sendMessage(
                chatId,
                `✅ Bot PRESTIGE actif.\n\nVotre chat_id : ${chatId}\n\nSi vous êtes coiffeur, mettez cette valeur dans TELEGRAM_BARBER_CHAT_ID.`
            );
        } catch (error) {
            console.error("❌ Erreur /start Telegram :", error);

            await bot.sendMessage(
                chatId,
                "❌ Erreur lors de la liaison Telegram avec le rendez-vous."
            );
        }
    });

    bot.on("callback_query", async (query) => {
        const chatId = query.message?.chat?.id;
        const messageId = query.message?.message_id;
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
                    `✅ <b>Action effectuée</b>\n\nRDV #${rdvId} ${getActionLabel(statut)}.\n\n<pre>${escapeHtml(formatRdvText(updatedRdv))}</pre>`,
                    {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: "HTML"
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