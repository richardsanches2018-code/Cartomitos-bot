const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");

async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ CARTOMITOS BOT CONECTADO!");
    }

    if (connection === "close") {
      const motivo =
        lastDisconnect?.error?.output?.statusCode;

      if (motivo !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconectando...");
        iniciarBot();
      } else {
        console.log("❌ WhatsApp desconectado.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const texto =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    const comando = texto.trim().toLowerCase();

    if (comando === "/start") {
      await sock.sendMessage(msg.key.remoteJid, {
        text:
`🎯 *CARTOMITOS BOT*

🏆 Bem-vindo ao nosso bolão!

📋 Comandos disponíveis:

/cartela
/meupalpite
/parcial
/ranking
/geral
/regras

🔥 Boa sorte a todos!`
      });
    }
  });
}

iniciarBot();
