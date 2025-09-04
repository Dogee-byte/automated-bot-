const { createCanvas, loadImage } = require("canvas");
const os = require("os");
const fs = require("fs").promises;
const pidusage = require("pidusage");

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
  version: "1.3.1",
  role: 0,
  credits: "Ari",
  description: "Uptime ni bur4t",
  hasPrefix: false,
  cooldown: 5
};

function byte2mb(bytes) {
  const units = ['Bytes', 'KB', 'MB', 'GB'];
  let l = 0, n = parseInt(bytes, 10) || 0;
  while (n >= 1024 && ++l) n = n / 1024;
  return `${n.toFixed(2)} ${units[l]}`;
}

async function getStartTimestamp() {
  try {
    const startTimeStr = await fs.readFile('time.txt', 'utf8');
    return parseInt(startTimeStr);
  } catch {
    return Date.now();
  }
}

async function saveStartTimestamp(timestamp) {
  try {
    await fs.writeFile('time.txt', timestamp.toString());
  } catch (error) {
    console.error("Error saving start timestamp:", error);
  }
}

function getUptime(uptime) {
  const days = Math.floor(uptime / (3600 * 24));
  const hours = Math.floor((uptime % (3600 * 24)) / 3600);
  const mins = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  return `${days}d ${hours}h ${mins}m ${seconds}s`;
}

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
  try {
    const startTime = await getStartTimestamp();
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const usage = await pidusage(process.pid);

    const osInfo = {
      platform: os.platform(),
      architecture: os.arch(),
      hostname: os.hostname(),
      release: os.release()
    };

    const uptimeMessage = getUptime(uptimeSeconds);

    const canvas = createCanvas(900, 550);
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, 900, 550);
    gradient.addColorStop(0, "#141E30");
    gradient.addColorStop(1, "#243B55");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.font = "bold 34px Arial";
    ctx.fillStyle = "#00f5ff";
    ctx.fillText("BOT UPTIME STATUS", 260, 70);

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
      console.log("Avatar not loaded:", e);
    }

    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 200);
    ctx.lineTo(870, 200);
    ctx.stroke();

    ctx.font = "22px Arial";
    ctx.fillStyle = "#ffffff";
    let y = 250;
    ctx.fillText(`[ UPTIME ]: ${uptimeMessage}`, 60, y); y += 40;
    ctx.fillText(`[ PLATFORM ]: ${osInfo.platform}`, 60, y); y += 40;
    ctx.fillText(`[ ARCH ]: ${osInfo.architecture}`, 60, y); y += 40;
    ctx.fillText(`[ PING ]: ${Date.now() - event.timestamp}ms`, 60, y); y += 50;
    
    const cpuPercent = usage.cpu.toFixed(1);
    ctx.fillText(`[ CPU ]: ${cpuPercent}%`, 60, y);
    drawProgressBar(ctx, 250, y - 20, 550, 25, cpuPercent, "#00ffcc");
    y += 60;

    const ramUsed = usage.memory;
    const ramTotal = os.totalmem();
    const ramPercent = ((ramUsed / ramTotal) * 100).toFixed(1);
    ctx.fillText(`[ RAM ]: ${byte2mb(ramUsed)} / ${byte2mb(ramTotal)} (${ramPercent}%)`, 60, y);
    drawProgressBar(ctx, 60, y + 10, 740, 25, ramPercent, "#ff007f");

    ctx.lineWidth = 8;
    ctx.strokeStyle = "#00fff7";
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    await saveStartTimestamp(startTime);

    return api.sendMessage(
      { body: formatFont("⚡ System Uptime ⚡"), attachment: canvas.toBuffer() },
      event.threadID,
      event.messageID
    );
  } catch (err) {
    console.error("Uptime command error:", err);
    return api.sendMessage("❌ Error while generating uptime card.", event.threadID);
  }
};
