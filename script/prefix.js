const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");
try {
  registerFont(path.join(__dirname, "../fonts/OpenSans-Bold.ttf"), { family: "OpenSans" });
} catch (e) {
  console.log("⚠️ Font not found, using system default.");
}

let config = {};
try {
  config = JSON.parse(fs.readFileSync(path.join(__dirname, "../config.json")));
} catch (e) {
  config.prefix = " ";
  config.botName = "Echo AI";
}

module.exports.config = {
  name: "prefix",
  version: "5.0.0",
  role: 0,
  description: "bot prefix.",
  prefix: true,
  premium: false,
  credits: "ari",
  cooldowns: 5,
  category: "info"
};

const emojiMap = {
  bot: "https://twemoji.maxcdn.com/v/latest/72x72/1f916.png",
  pin: "https://twemoji.maxcdn.com/v/latest/72x72/1f4cc.png",
  id: "https://twemoji.maxcdn.com/v/latest/72x72/1f194.png",
  sparkle: "https://twemoji.maxcdn.com/v/latest/72x72/2728.png",
  rocket: "https://twemoji.maxcdn.com/v/latest/72x72/1f680.png"
};

async function drawEmoji(ctx, emojiUrl, x, y, size = 40) {
  try {
    const img = await loadImage(emojiUrl);
    ctx.drawImage(img, x, y, size, size);
  } catch (e) {
    console.log("⚠️ Failed to load emoji:", emojiUrl);
  }
}

async function makePrefixCard(botPrefix, botName) {
  const width = 700;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#1e3a8a");
  gradient.addColorStop(1, "#0f172a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
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

  // Title with emoji
  await drawEmoji(ctx, emojiMap.bot, width / 2 - 180, 135, 36);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px OpenSans";
  ctx.textAlign = "center";
  ctx.fillText("Bot Information", width / 2 + 30, 165);

  // Prefix with emoji
  await drawEmoji(ctx, emojiMap.pin, width / 2 - 150, 200, 34);
  ctx.fillStyle = "#facc15";
  ctx.font = "bold 32px OpenSans";
  ctx.fillText(`Prefix: ${botPrefix}`, width / 2 + 30, 225);

  // Name with emoji
  await drawEmoji(ctx, emojiMap.id, width / 2 - 150, 255, 32);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "bold 30px OpenSans";
  ctx.fillText(`Name: ${botName}`, width / 2 + 30, 280);

  // Footer with emojis
  await drawEmoji(ctx, emojiMap.sparkle, width / 2 - 170, 305, 28);
  await drawEmoji(ctx, emojiMap.rocket, width / 2 + 120, 305, 28);
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "italic 22px OpenSans";
  ctx.fillText("Enjoy chatting with me!", width / 2, 330);

  return canvas.toBuffer();
}

// Add roundRect helper
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
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
  const botName = config.botName || "Echo AI";

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
