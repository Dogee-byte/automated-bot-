const { createCanvas, loadImage, registerFont } = require("canvas");
const tae = require("fs-extra");
const os = require("os");
const fs = require("fs").promises;
const pidusage = require("pidusage");
const path = require("path");

try {
  registerFont(path.join(__dirname, "../fonts/OpenSans-Bold.ttf"), { family: "OpenSans" });
} catch (e) {
  console.log("Font not found, using default font.");
}

let fontEnabled = true;

function formatFont(text) {
  const fontMapping = {
    a: "𝖺", b: "𝖻", c: "𝖼", d: "𝖽", e: "𝖾", f: "𝖿",
    g: "𝗀", h: "𝗁", i: "𝗂", j: "𝗃", k: "𝗄", l: "𝗅",
    m: "𝗆", n: "𝗇", o: "𝗈", p: "𝗉", q: "𝗊", r: "𝗋",
    s: "𝗌", t: "𝗍", u: "𝗎", v: "𝗏", w: "𝗐", x: "𝗑",
    y: "𝗒", z: "𝗓",
    A: "𝖠", B: "𝖡", C: "𝖢", D: "𝖣", E: "𝖤", F: "𝖥",
    G: "𝖦", H: "𝖧", I: "𝖨", J: "𝖩", K: "𝖪", L: "𝖫",
    M: "𝖬", N: "𝖭", O: "𝖮", P: "𝖯", Q: "𝖰", R: "𝖱",
    S: "𝖲", T: "𝖳", U: "𝖴", V: "𝖵", W: "𝖶", X: "𝖷",
    Y: "𝖸", Z: "𝖹"
  };

  let formattedText = "";
  for (const char of text) {
    formattedText += (fontEnabled && char in fontMapping) ? fontMapping[char] : char;
  }
  return formattedText;
}

module.exports.config = {
  name: "uptime",
  version: "1.3.0",
  role: 0,
  credits: "Ari",
  description: "uptime ni bur4t",
  hasPrefix: false,
  cooldown: 5,
  aliases: []
};

module.exports.byte2mb = (bytes) => {
  const units = ['Bytes', 'KB', 'MB', 'GB'];
  let l = 0, n = parseInt(bytes, 10) || 0;
  while (n >= 1024 && ++l) n = n / 1024;
  return `${n.toFixed(2)} ${units[l]}`;
};

module.exports.getStartTimestamp = async () => {
  try {
    const startTimeStr = await fs.readFile('time.txt', 'utf8');
    return parseInt(startTimeStr);
  } catch {
    return Date.now();
  }
};

module.exports.saveStartTimestamp = async (timestamp) => {
  try {
    await fs.writeFile('time.txt', timestamp.toString());
  } catch (error) {
    console.error("Error saving start timestamp:", error);
  }
};

module.exports.getUptime = (uptime) => {
  const days = Math.floor(uptime / (3600 * 24));
  const hours = Math.floor((uptime % (3600 * 24)) / 3600);
  const mins = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  return `${days}d ${hours}h ${mins}m ${seconds}s`;
};

function drawProgressBar(ctx, x, y, width, height, percent, color) {
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(x, y, width, height);

  const fillWidth = Math.max(0, Math.min(width, (percent / 100) * width));
  ctx.fillStyle = color;
  ctx.fillRect(x, y, fillWidth, height);
  
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#ffffff";
  ctx.strokeRect(x, y, width, height);
}

module.exports.run = async ({ api, event }) => {
  const startTime = await module.exports.getStartTimestamp();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const usage = await pidusage(process.pid);

  const osInfo = {
    platform: os.platform(),
    architecture: os.arch(),
    hostname: os.hostname(),
    release: os.release()
  };

  const uptimeMessage = module.exports.getUptime(uptimeSeconds);

  const canvas = createCanvas(900, 550);
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 900, 550);
  gradient.addColorStop(0, "#141E30");
  gradient.addColorStop(1, "#243B55");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  for (let i = -500; i < 1000; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 500, 550);
    ctx.stroke();
  }

  const titleGradient = ctx.createLinearGradient(0, 0, 800, 0);
  titleGradient.addColorStop(0, "#00f5ff");
  titleGradient.addColorStop(1, "#ff00ff");
  ctx.font = "bold 38px OpenSans";
  ctx.fillStyle = titleGradient;
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 8;
  ctx.fillText("BOT UPTIME STATUS", 240, 70);
  ctx.shadowBlur = 0;

  try {
    const botAvatar = await loadImage("https://i.imgur.com/P6Uumae.png"); 
    ctx.save();
    ctx.beginPath();
    ctx.arc(120, 120, 80, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(botAvatar, 40, 40, 160, 160);
    ctx.restore();
  } catch (e) {
    console.log("Avatar not loaded.");
  }

  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, 200);
  ctx.lineTo(870, 200);
  ctx.stroke();

  ctx.font = "24px OpenSans";
  ctx.fillStyle = "#ffffff";
  let y = 250;
  ctx.fillText(`[ UPTIME ]: ${uptimeMessage}`, 60, y); y += 40;
  ctx.fillText(`[ PLATFORM ]: ${osInfo.platform}`, 60, y); y += 40;
  ctx.fillText(`[ ARCH ]: ${osInfo.architecture}`, 60, y); y += 40;
  ctx.fillText(`[ PING ]: ${Date.now() - event.timestamp}ms`, 60, y); y += 50;

  const cpuPercent = usage.cpu.toFixed(1);
  ctx.fillText(`[ CPU ] Usage: ${cpuPercent}%`, 60, y);
  drawProgressBar(ctx, 300, y - 20, 500, 25, cpuPercent, "#00ffcc");
  y += 60;

  const ramUsed = usage.memory;
  const ramTotal = os.totalmem();
  const ramPercent = ((ramUsed / ramTotal) * 100).toFixed(1);
  ctx.fillText(`[ RAM ] Usage: ${module.exports.byte2mb(ramUsed)} / ${module.exports.byte2mb(ramTotal)} (${ramPercent}%)`, 60, y);
  drawProgressBar(ctx, 60, y + 10, 740, 25, ramPercent, "#ff007f");

  ctx.lineWidth = 8;
  ctx.shadowColor = "#00fff7";
  ctx.shadowBlur = 20;
  ctx.strokeStyle = "#00fff7";
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  await module.exports.saveStartTimestamp(startTime);

  return api.sendMessage(
    { body: formatFont(" "), attachment: canvas.toBuffer() },
    event.threadID,
    event.messageID
  );
};
