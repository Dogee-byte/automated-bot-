const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");

try {
  registerFont(path.join(__dirname, "../fonts/NotoColorEmoji.ttf"), { family: "Emoji" });
  registerFont(path.join(__dirname, "../fonts/OpenSans-Bold.ttf"), { family: "OpenSans" });
} catch (e) {
  console.log("⚠️ Fonts not found, fallback to system fonts.");
}

let config = {};
try {
  config = JSON.parse(fs.readFileSync(path.join(__dirname, "../config.json")));
} catch (e) {
  config.prefix = " ";
  config.botName = "🤖 | 𝙴𝚌𝚑𝚘 𝙰𝙸";
}

module.exports.config = {
  name: "prefix",
  version: "4.0.0",
  role: 0,
  description: "Displays the bot's prefix with stylish Canvas card (emoji + gradient).",
  prefix: true,
  premium: false,
  credits: "ari x gpt",
  cooldowns: 5,
  category: "info"
};

const gradients = [
  ["#1e3a8a", "#0f172a"],
  ["#9333ea", "#4c1d95"],
  ["#059669", "#064e3b"],
  ["#ea580c", "#7c2d12"],
  ["#e11d48", "#4a044e"],
  ["#0ea5e9", "#0c4a6e"]
];

const emojiSet = ["🤖", "✨", "⚡", "🔥", "🆔", "📌", "🚀", "🎉", "🌟", "💡"];

async function makePrefixCard(botPrefix, botName) {
  const width = 700;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const [color1, color2] = gradients[Math.floor(Math.random() * gradients.length)];
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  const emojiCount = 15;
  for (let i = 0; i < emojiCount; i++) {
    const emoji = emojiSet[Math.floor(Math.random() * emojiSet.length)];
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 24 + Math.random() * 32;

    ctx.font = `${size}px Emoji`;
    ctx.globalAlpha = 0.3 + Math.random() * 0.5; 
    ctx.fillText(emoji, x, y);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.roundRect(40, 120, width - 80, 220, 25);
  ctx.fill();

  try {
    const logo = await loadImage("https://i.imgur.com/BzZ7g0C.png"); 
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, 90, 45, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logo, width / 2 - 45, 45, 90, 90);
    ctx.restore();
  } catch (err) {
    console.log("⚠️ Logo failed to load.");
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px OpenSans, Emoji";
  ctx.textAlign = "center";
  ctx.fillText("🤖 Bot Information", width / 2, 170);

  ctx.fillStyle = "#facc15";
  ctx.font = "bold 34px OpenSans, Emoji";
  ctx.fillText(`📌 Prefix: ${botPrefix}`, width / 2, 230);

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "bold 30px OpenSans, Emoji";
  ctx.fillText(`🆔 Name: ${botName}`, width / 2, 280);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "italic 22px OpenSans, Emoji";
  ctx.fillText("✨ Enjoy chatting with me! 🚀", width / 2, 330);

  return canvas.toBuffer();
  
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  this.beginPath();
  this.moveTo(x + r, y);
  this.arcTo(x + w, y, x + w, y + h, r);
  this.arcTo(x + w, y + h, x, y + h, r);
  this.arcTo(x, y + h, x, y, r);
  this.arcTo(x, y, x + w, y, r);
  this.closePath();
  return this;
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;
  const botPrefix = config.prefix || " ";
  const botName = config.botName || "🤖 | 𝙴𝚌𝚑𝚘 𝙰𝙸";

  const imgBuffer = await makePrefixCard(botPrefix, botName);
  const filePath = path.join(__dirname, `prefix_${Date.now()}.png`);
  fs.writeFileSync(filePath, imgBuffer);

  return api.sendMessage(
    { body: "", attachment: fs.createReadStream(filePath) },
    threadID,
    () => fs.unlinkSync(filePath),
    messageID
  );
};
