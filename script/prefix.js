const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");

try {
  registerFont(path.join(__dirname, "../fonts/OpenSans-Bold.ttf"), { family: "OpenSans" });
  registerFont(path.join(__dirname, "../fonts/OpenSans-Regular.ttf"), { family: "OpenSans-Regular" });
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
  version: "1.0.0",
  role: 0,
  description: "bot prefix",
  credits: "ari",
  cooldowns: 5,
  category: "info"
};

const emojiMap = {
  bot: "https://twemoji.maxcdn.com/v/latest/72x72/1f916.png",
  pin: "https://twemoji.maxcdn.com/v/latest/72x72/1f4cc.png",
  id: "https://twemoji.maxcdn.com/v/latest/72x72/1f194.png"
};

async function drawEmoji(ctx, url, x, y, size = 36) {
  try {
    const img = await loadImage(url);
    ctx.drawImage(img, x, y, size, size);
  } catch (err) {
    console.log("⚠️ Emoji failed:", url);
  }
}

async function makeCoolCard(botPrefix, botName) {
  const width = 750, height = 430;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, "#0f2027");
  bgGradient.addColorStop(0.5, "#203a43");
  bgGradient.addColorStop(1, "#2c5364");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.roundRect(40, 100, width - 80, 280, 25);
  ctx.fill();
  ctx.shadowBlur = 0;

  try {
    const avatar = await loadImage("https://i.imgur.com/lGxhMfB.jpeg");
    const centerX = width / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, 90, 55, 0, Math.PI * 2);
    ctx.closePath();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 6;
    ctx.shadowColor = "#0ea5e9";
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.clip();
    ctx.drawImage(avatar, centerX - 55, 35, 110, 110);
    ctx.restore();
  } catch {}

  await drawEmoji(ctx, emojiMap.bot, 120, 140, 42);
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 34px OpenSans";
  ctx.fillText("Bot Information", 180, 175);

  await drawEmoji(ctx, emojiMap.pin, 120, 210, 38);
  ctx.fillStyle = "#facc15";
  ctx.font = "bold 30px OpenSans";
  ctx.fillText(`Prefix: ${botPrefix}`, 180, 240);

  await drawEmoji(ctx, emojiMap.id, 120, 270, 38);
  ctx.fillStyle = "#93c5fd";
  ctx.font = "bold 30px OpenSans";
  ctx.fillText(`Name: ${botName}`, 180, 300);
  
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "italic 23px OpenSans-Regular";
  ctx.textAlign = "center";
  ctx.fillText("Enjoy chatting with me!", width / 2, 355);

  return canvas.toBuffer();
}

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;
  const botPrefix = config.prefix || " ";
  const botName = config.botName || "Echo AI";

  const imgBuffer = await makeCoolCard(botPrefix, botName);
  const filePath = path.join(__dirname, `prefix_${Date.now()}.png`);
  fs.writeFileSync(filePath, imgBuffer);

  return api.sendMessage(
    { body: "", attachment: fs.createReadStream(filePath) },
    threadID,
    () => fs.unlinkSync(filePath),
    messageID
  );
};
