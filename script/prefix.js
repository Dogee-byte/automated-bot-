const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

let config = {};
try {
  config = JSON.parse(fs.readFileSync(path.join(__dirname, "../config.json")));
} catch (e) {
  config.prefix = " ";
  config.botName = "🤖 | 𝙴𝚌𝚑𝚘 𝙰𝙸";
}

module.exports.config = {
  name: "prefix",
  version: "2.0.0",
  role: 0,
  description: "Displays the bot's prefix with a Canvas card.",
  prefix: true,
  premium: false,
  credits: "ari",
  cooldowns: 5,
  category: "info"
};

async function makePrefixCard(botPrefix, botName) {
  const width = 600;
  const height = 300;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0f172a"; 
  ctx.fillRect(0, 0, width, height);

  try {
    const bg = await loadImage("https://i.imgur.com/jxWqIBf.jpg");
    ctx.drawImage(bg, 0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, width, height);
  } catch (err) {
    console.log("⚠️ Background image failed, using solid color.");
  }

  try {
    const logo = await loadImage("https://i.imgur.com/qZ5R6J1.png");
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, 80, 50, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logo, width / 2 - 50, 30, 100, 100);
    ctx.restore();
  } catch (err) {
    console.log("⚠️ Logo failed to load, skipping...");
  }

  ctx.fillStyle = "#38bdf8"; 
  ctx.font = "bold 34px Sans";
  ctx.textAlign = "center";
  ctx.fillText("🤖 Bot Information", width / 2, 170);

  ctx.fillStyle = "#facc15"; 
  ctx.font = "bold 28px Sans";
  ctx.fillText(`📌 Prefix: ${botPrefix}`, width / 2, 210);

  ctx.fillStyle = "#ffffff"; 
  ctx.font = "bold 26px Sans";
  ctx.fillText(`🆔 Name: ${botName}`, width / 2, 250);

  return canvas.toBuffer();
}

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;
  const botPrefix = config.prefix || " ";
  const botName = config.botName || "🤖 | 𝙴𝚌𝚑𝚘 𝙰𝙸";

  const imgBuffer = await makePrefixCard(botPrefix, botName);
  const filePath = path.join(__dirname, `prefix_${Date.now()}.png`);
  fs.writeFileSync(filePath, imgBuffer);

  return api.sendMessage(
    {
      body: "🙏 Thanks for using my bot!",
      attachment: fs.createReadStream(filePath)
    },
    threadID,
    () => fs.unlinkSync(filePath),
    messageID
  );
};
