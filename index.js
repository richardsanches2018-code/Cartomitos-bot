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
    logger: pino({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  if (!state.creds.registered) {
    const numero = process.env.WA_NUMBER;

    if (!numero) {
      console.log("❌ WA_NUMBER não foi configurado no Railway.");
      return;
    }

    const codigo = await sock.requestPairingCode(numero);

    console.log("================================");
    console.log("📱 CÓDIGO DO CARTOMITOS BOT:");
    console.log(codigo);
    console.log("================================");
  }

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ CARTOMITOS BOT CONECTADO AO WHATSAPP!");
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

📋 Comandos:

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
