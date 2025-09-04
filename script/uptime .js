const fs = require("fs");
const path = require("path");
const os = require("os");
const { createCanvas, registerFont } = require("canvas");
const moment = require("moment-timezone");

module.exports.config = {
  name: "uptime",
  version: "1.1.1",
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
  if (secs > 0) parts.push(`${secs}s`);
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
    ctx.roundRect(100, 50, 1000, 500, 30);
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 50px Inter";
    ctx.fillStyle = "#f1f5f9";
    ctx.fillText(`${botName} Status`, 120, 120);

    ctx.font = "28px Inter";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("Uptime:", 120, 180);
    ctx.font = "bold 64px Inter";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(uptimeText, 250, 185);

    ctx.font = "26px Inter";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(`Started: ${startedAt}`, 120, 250);

    ctx.font = "26px Inter";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("Memory Usage:", 120, 310);
    ctx.font = "bold 36px Inter";
    ctx.fillStyle = "#facc15";
    ctx.fillText(`${stats.ram.used.toFixed(0)}MB / ${stats.ram.total.toFixed(0)}MB`, 120, 350);

    const barX = 120, barY = 370, barW = 400, barH = 25;
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = "#facc15";
    ctx.fillRect(barX, barY, (stats.ram.used / stats.ram.total) * barW, barH);
    ctx.strokeStyle = "#fef3c7";
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.font = "26px Inter";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("CPU Load:", 120, 430);
    ctx.font = "bold 36px Inter";
    ctx.fillStyle = "#22c55e";
    ctx.fillText(`${stats.cpu.toFixed(2)} load`, 120, 470);

    const cpuBarW = 400, cpuBarH = 25, cpuBarX = 120, cpuBarY = 490;
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
