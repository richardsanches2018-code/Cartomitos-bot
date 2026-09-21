const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const QRCode = require("qrcode");
const http = require("http");

let qrAtual = null;

const PORT = process.env.PORT || 3000;

const servidor = http.createServer(async (req, res) => {
  if (req.url === "/qr") {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });

    if (!qrAtual) {
      res.end(`
        <html>
          <body style="font-family:Arial;text-align:center;padding:40px">
            <h2>🤖 Cartomitos Bot</h2>
            <p>⏳ QR Code ainda não disponível.</p>
            <p>Atualize a página em alguns segundos.</p>
          </body>
        </html>
      `);
      return;
    }

    const imagem = await QRCode.toDataURL(qrAtual);

    res.end(`
      <html>
        <head>
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>Cartomitos Bot</title>
        </head>
        <body style="font-family:Arial;text-align:center;padding:20px">
          <h2>🤖 CARTOMITOS BOT</h2>
          <p>Abra o WhatsApp e escaneie o QR Code:</p>

          <img src="${imagem}" style="width:300px;max-width:90%;">

          <p>WhatsApp → Configurações → Aparelhos conectados → Conectar aparelho</p>

          <p>🔄 Se o QR expirar, atualize esta página.</p>
        </body>
      </html>
    `);

    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("Cartomitos Bot online!");
});

servidor.listen(PORT, () => {
  console.log(`🌐 Servidor iniciado na porta ${PORT}`);
});

async function iniciarBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./auth");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrAtual = qr;
      console.log("📱 QR CODE GERADO!");
      console.log("🌐 Acesse /qr no endereço público do Railway.");
    }

    if (connection === "connecting") {
      console.log("🔄 Conectando ao WhatsApp...");
    }

    if (connection === "open") {
      qrAtual = null;
      console.log("================================");
      console.log("✅ CARTOMITOS BOT CONECTADO!");
      console.log("================================");
    }

    if (connection === "close") {
      const codigo =
        lastDisconnect?.error?.output?.statusCode;

      console.log("❌ Conexão encerrada:", codigo);

      if (codigo !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconectando em 5 segundos...");
        setTimeout(iniciarBot, 5000);
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
