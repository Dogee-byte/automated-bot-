const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");
const { createCanvas, loadImage, registerFont } = require("canvas");
const moment = require("moment-timezone");

module.exports.config = {
  name: "uptime",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "ARI",
  description: "Show uptime of bot process",
  commandCategory: "System",
  usages: "uptime",
  cooldowns: 3,
};

try {
  registerFont(path.join(__dirname, "../fonts/Inter-Bold.ttf"), { family: "Inter", weight: "700" });
  registerFont(path.join(__dirname, "../fonts/Inter-Regular.ttf"), { family: "Inter", weight: "400" });
} catch (_) {}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  if (minutes || hours || days) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  return parts.join(" ");
}

function getSystemStats() {
  const totalMem = os.totalmem() / 1024 / 1024;
  const freeMem = os.freemem() / 1024 / 1024;
  const usedMem = totalMem - freeMem;
  const cpuLoad = os.loadavg()[0]; 

  return {
    ram: `${usedMem.toFixed(0)}MB / ${totalMem.toFixed(0)}MB`,
    cpu: `${cpuLoad.toFixed(2)} load`
  };
}

module.exports.run = async function ({ api, event }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  try {
    const uptimeSec = process.uptime();
    const uptimeText = formatUptime(uptimeSec);

    const startedAt = moment(Date.now() - uptimeSec * 1000)
      .tz("Asia/Manila")
      .format("YYYY-MM-DD HH:mm:ss z");

    const { ram, cpu } = getSystemStats();
    const botName = (global?.config?.BOTNAME) || "𝙴𝚌𝚑𝚘 𝙰𝚒";

    const avatarUrl = "https://i.imgur.com/I3Milxg.jpeg"; 
    let avatarBuffer = null;
    try {
      const { data } = await axios.get(avatarUrl, { responseType: "arraybuffer" });
      avatarBuffer = Buffer.from(data);
    } catch {}

    const width = 1100, height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(1, "#1e293b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const avatarSize = 260;
    const avatarX = 60;
    const avatarY = (height - avatarSize) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2,
      0,
      Math.PI * 2
    );
    ctx.closePath();
    ctx.clip();

    if (avatarBuffer) {
      const img = await loadImage(avatarBuffer);
      ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
    } else {
      ctx.fillStyle = "#111827";
      ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2 + 8,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = "rgba(59,130,246,0.9)";
    ctx.lineWidth = 8;
    ctx.shadowColor = "rgba(59,130,246,0.7)";
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.font = "bold 46px Inter";
    ctx.fillStyle = "#f8fafc";
    ctx.fillText(`${botName} Status`, 350, 120);

    ctx.font = "28px Inter";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Uptime:", 350, 180);

    ctx.font = "bold 58px Inter";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(uptimeText, 350, 240);

    ctx.font = "26px Inter";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(`Started: ${startedAt}`, 350, 290);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "26px Inter";
    ctx.fillText("Memory Usage:", 350, 350);
    ctx.font = "bold 34px Inter";
    ctx.fillStyle = "#facc15";
    ctx.fillText(ram, 350, 390);

    ctx.font = "26px Inter";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("CPU Load:", 350, 440);
    ctx.font = "bold 34px Inter";
    ctx.fillStyle = "#22c55e";
    ctx.fillText(cpu, 350, 480);

    const outDir = path.join(__dirname, "cache");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `uptime_${Date.now()}.png`);
    fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

    await api.sendMessage(
      { body: "", attachment: fs.createReadStream(outPath) },
      threadID,
      () => { try { fs.unlinkSync(outPath); } catch {} },
      messageID
    );

  } catch (err) {
    console.error("[uptime] error:", err);
    return api.sendMessage(`❌ Error: ${err.message}`, event.threadID, event.messageID);
  }
};
