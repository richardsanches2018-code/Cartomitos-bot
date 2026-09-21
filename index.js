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

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "connecting") {
      console.log("🔄 Conectando ao WhatsApp...");
    }

    if (connection === "open") {
      console.log("✅ CARTOMITOS BOT CONECTADO!");
    }

    if (connection === "close") {
      const codigo =
        lastDisconnect?.error?.output?.statusCode;

      console.log("❌ Conexão fechada:", codigo);

      if (codigo !== DisconnectReason.loggedOut) {
        console.log("🔄 Tentando reconectar...");
        setTimeout(iniciarBot, 5000);
      }
    }
  });

  // Gera o código somente se ainda não houver uma conta vinculada
  if (!state.creds.registered) {
    const numero = process.env.WA_NUMBER;

    if (!numero) {
      console.log("❌ WA_NUMBER não configurado.");
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const codigo = await sock.requestPairingCode(numero);

      console.log("================================");
      console.log("📱 CÓDIGO DE VINCULAÇÃO:");
      console.log(codigo);
      console.log("================================");
    } catch (erro) {
      console.error("❌ ERRO AO GERAR CÓDIGO:", erro);
    }
  }

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const texto =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (texto.trim().toLowerCase() === "/start") {
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
/regras`
      });
    }
  });
}

iniciarBot();
