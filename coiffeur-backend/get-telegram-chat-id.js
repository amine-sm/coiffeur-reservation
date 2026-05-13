require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");

const token = process.envTELEGRAM_BOT_TOKEN ;

if (!token) {
    console.error("❌ TELEGRAM_BOT_TOKEN manquant dans .env");
    process.exit(1);
}

const bot = new TelegramBot(token, {
    polling: true
});

console.log("✅ Bot lancé.");
console.log("➡️ Ouvrez votre bot Telegram et envoyez /start.");

bot.on("message", (msg) => {
    console.log("=================================");
    console.log("✅ Votre TELEGRAM_BARBER_CHAT_ID est :");
    console.log(msg.chat.id);
    console.log("=================================");
});