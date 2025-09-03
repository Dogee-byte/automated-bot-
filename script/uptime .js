const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");
const { createCanvas, loadImage, registerFont } = require("canvas");
const moment = require("moment-timezone");

module.exports.config = {
  name: "uptime",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "ari",
  description: "Show bot uptime, RAM & CPU",
  commandCategory: "System",
  usages: "uptime",
  cooldowns: 3,
};

try {
  registerFont(path.join(__dirname, "../fonts/Inter-Bold.ttf"), { family: "Inter", weight: "700" });
  registerFont(path.join(__dirname, "../fonts/Inter-Regular.ttf"), { family: "Inter", weight: "400" });
} catch (_) {}

let START_TIME = Date.now();

function formatUptime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  if (minutes || hours || days) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
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

async function drawCard({ botName, uptimeText, startedAtText, avatarBuffer, ramText, cpuText }) {
  const width = 1100;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#0f172a");
  grad.addColorStop(1, "#1e293b");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, 600);
  glow.addColorStop(0, "rgba(59,130,246,0.3)");
  glow.addColorStop(1, "rgba(59,130,246,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 3;
  const panelX = 220, panelY = 50, panelW = width - panelX - 60, panelH = height - 100, r = 32;
  ctx.beginPath();
  ctx.moveTo(panelX + r, panelY);
  ctx.lineTo(panelX + panelW - r, panelY);
  ctx.quadraticCurveTo(panelX + panelW, panelY, panelX + panelW, panelY + r);
  ctx.lineTo(panelX + panelW, panelY + panelH - r);
  ctx.quadraticCurveTo(panelX + panelW, panelY + panelH, panelX + panelW - r, panelY + panelH);
  ctx.lineTo(panelX + r, panelY + panelH);
  ctx.quadraticCurveTo(panelX, panelY + panelH, panelX, panelY + panelH - r);
  ctx.lineTo(panelX, panelY + r);
  ctx.quadraticCurveTo(panelX, panelY, panelX + r, panelY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const avatarSize = 260;
  const avatarX = 60;
  const avatarY = (height - avatarSize) / 2;

  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 12, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(59,130,246,0.9)";
  ctx.lineWidth = 8;
  ctx.shadowColor = "rgba(59,130,246,0.7)";
  ctx.shadowBlur = 20;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.clip();

  if (avatarBuffer) {
    try {
      const img = await loadImage(avatarBuffer);
      ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
    } catch {
      ctx.fillStyle = "#111827";
      ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    }
  }
  ctx.restore();

  const titleFont = '700 48px "Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial';
  const valueFont = '700 64px "Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial';
  const labelFont = '400 26px "Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial';

  ctx.font = titleFont;
  ctx.fillStyle = "#f8fafc";
  ctx.fillText(`${botName} Status`, panelX + 40, panelY + 80);

  ctx.font = labelFont;
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("Uptime", panelX + 40, panelY + 150);

  ctx.font = valueFont;
  ctx.fillStyle = "#38bdf8";
  ctx.shadowColor = "rgba(56,189,248,0.6)";
  ctx.shadowBlur = 15;
  ctx.fillText(uptimeText, panelX + 40, panelY + 210);
  ctx.shadowBlur = 0;

  ctx.font = labelFont;
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText(`Started: ${startedAtText}`, panelX + 40, panelY + 260);
  
  ctx.font = labelFont;
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("Memory Usage", panelX + 40, panelY + 320);

  ctx.font = "700 34px Inter";
  ctx.fillStyle = "#facc15";
  ctx.fillText(ramText, panelX + 40, panelY + 360);

  ctx.font = labelFont;
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("CPU Load", panelX + 40, panelY + 410);

  ctx.font = "700 34px Inter";
  ctx.fillStyle = "#22c55e";
  ctx.fillText(cpuText, panelX + 40, panelY + 450);

  return canvas.toBuffer("image/png");
}

module.exports.onLoad = () => {
  if (!START_TIME) START_TIME = Date.now();
};

module.exports.run = async function ({ api, event }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  try {
    const uptimeMs = Date.now() - START_TIME;
    const uptimeText = formatUptime(uptimeMs);
    const startedAt = moment(START_TIME).tz("Asia/Manila").format("YYYY-MM-DD HH:mm:ss z");
    const { ram, cpu } = getSystemStats();
    const botName = (global?.config?.BOTNAME) || "Echo AI";

    let avatarBuffer = null;
    try {
      const botID = api.getCurrentUserID();
      const url = `https://graph.facebook.com/${botID}/picture?height=512&width=512`;
      const { data } = await axios.get(url, { responseType: "arraybuffer" });
      avatarBuffer = Buffer.from(data);
    } catch {}

    const pngBuffer = await drawCard({
      botName,
      uptimeText,
      startedAtText: startedAt,
      avatarBuffer,
      ramText: ram,
      cpuText: cpu
    });

    const outDir = path.join(__dirname, "cache");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `uptime_${Date.now()}.png`);
    fs.writeFileSync(outPath, pngBuffer);

    await api.sendMessage(
      { body: "", attachment: fs.createReadStream(outPath) },
      threadID,
      () => { try { fs.unlinkSync(outPath); } catch {} },
      messageID
    );
  } catch (err) {
    console.error("[uptime] error:", err);
    return api.sendMessage(`❌ Failed to render uptime: ${err.message}`, threadID, messageID);
  }
};
