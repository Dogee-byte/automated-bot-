const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");
const { createCanvas, loadImage, registerFont } = require("canvas");
const moment = require("moment-timezone");

module.exports.config = {
  name: "uptime",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "ARI",
  description: "Show real uptime of bot",
  commandCategory: "System",
  usages: "uptime",
  cooldowns: 3,
};

if (!global.botStartTime) {
  global.botStartTime = Date.now();
}

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
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds> 0) parts.push(`${secs}s`);
  return parts.join(" ");
}

function getSystemStats() {
  const totalMem = os.totalmem() / 1024 / 1024;
  const freeMem = os.freemem() / 1024 / 1024;
  const usedMem = totalMem - freeMem;
  const cpuLoad = os.loadavg()[0];
  return {
    ram: { used: usedMem, total: totalMem },
    cpu: cpuLoad
  };
}

module.exports.run = async function ({ api, event }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  try {
    const uptimeSec = Math.floor((Date.now() - global.botStartTime) / 1000);
    const uptimeText = formatUptime(uptimeSec);

    const startedAt = moment(Date.now() - uptimeSec * 1000)
      .tz("Asia/Manila")
      .format("YYYY-MM-DD HH:mm:ss z");

    const stats = getSystemStats();
    const botName = (global?.config?.BOTNAME) || "ECHO AI";

    let avatarUrl = "https://i.imgur.com/GQCNq9R.png"; 

    try {
      if (avatarUrl) {
        avatarImg = await loadImage(avatarUrl);
      } else {
        const botID = api.getCurrentUserID();
        const avatarRes = await axios.get(
          `https://graph.facebook.com/${botID}/picture?height=512&width=512&redirect=false`
        );
        const realUrl = avatarRes.data?.data?.url;
        if (realUrl) avatarImg = await loadImage(realUrl);
      }
    } catch (e) {
      console.error("Failed to load avatar:", e.message);
    }
    
    const width = 1200, height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "#0f2027");
    bg.addColorStop(0.5, "#203a43");
    bg.addColorStop(1, "#2c5364");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 3;
    ctx.roundRect(320, 50, 820, 500, 30);
    ctx.fill();
    ctx.stroke();

    const avatarSize = 240;
    const avatarX = 40;
    const avatarY = (height - avatarSize) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    if (avatarBuffer) {
      const img = await loadImage(avatarBuffer);
      ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
    } else {
      ctx.fillStyle = "#1f2937";
      ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 8, 0, Math.PI * 2);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 10;
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 25;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.font = "bold 50px Inter";
    ctx.fillStyle = "#f1f5f9";
    ctx.fillText(`${botName} Status`, 360, 120);

    ctx.font = "28px Inter";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("Uptime:", 360, 180);
    ctx.font = "bold 64px Inter";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(uptimeText, 500, 185);

    ctx.font = "26px Inter";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(`Started: ${startedAt}`, 360, 250);

    ctx.font = "26px Inter";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("Memory Usage:", 360, 310);
    ctx.font = "bold 36px Inter";
    ctx.fillStyle = "#facc15";
    ctx.fillText(`${stats.ram.used.toFixed(0)}MB / ${stats.ram.total.toFixed(0)}MB`, 360, 350);

    const barX = 360, barY = 370, barW = 400, barH = 25;
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = "#facc15";
    ctx.fillRect(barX, barY, (stats.ram.used / stats.ram.total) * barW, barH);
    ctx.strokeStyle = "#fef3c7";
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.font = "26px Inter";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("CPU Load:", 360, 430);
    ctx.font = "bold 36px Inter";
    ctx.fillStyle = "#22c55e";
    ctx.fillText(`${stats.cpu.toFixed(2)} load`, 360, 470);
    
    const cpuBarW = 400, cpuBarH = 25, cpuBarX = 360, cpuBarY = 490;
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(cpuBarX, cpuBarY, cpuBarW, cpuBarH);
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(cpuBarX, cpuBarY, Math.min(stats.cpu / os.cpus().length, 1) * cpuBarW, cpuBarH);
    ctx.strokeStyle = "#bbf7d0";
    ctx.strokeRect(cpuBarX, cpuBarY, cpuBarW, cpuBarH);

    ctx.font = "20px Inter";
    ctx.fillStyle = "#64748b";
    ctx.fillText("Autobot by ARI", width - 280, height - 30);

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
