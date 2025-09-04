const fs = require("fs");
const path = require("path");
const os = require("os");
const { createCanvas, registerFont } = require("canvas");
const pidusage = require("pidusage");

// Config
module.exports.config = {
  name: "uptime",
  version: "1.0.4",
  role: 0,
  credits: "ARI",
  description: "Get bot uptime and system information with cool canvas",
  hasPrefix: false,
  cooldown: 5,
  aliases: []
};

// Load custom font
try {
  registerFont(path.join(__dirname, "../fonts/Inter-Bold.ttf"), { family: "Inter", weight: "700" });
  registerFont(path.join(__dirname, "../fonts/Inter-Regular.ttf"), { family: "Inter", weight: "400" });
} catch (_) {}

// Convert bytes
function byte2mb(bytes) {
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  let l = 0, n = parseInt(bytes, 10) || 0;
  while (n >= 1024 && ++l) n = n / 1024;
  return `${n.toFixed(n < 10 && l > 0 ? 1 : 0)} ${units[l]}`;
}

// Uptime formatting
function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${d}d ${h}h ${m}m ${s}s`;
}

module.exports.run = async ({ api, event }) => {
  try {
    const uptimeSeconds = Math.floor(process.uptime());
    const usage = await pidusage(process.pid);
    const osInfo = {
      platform: os.platform(),
      architecture: os.arch(),
      hostname: os.hostname(),
      release: os.release(),
    };

    // Canvas setup
    const width = 1200, height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "#1e3c72");
    bg.addColorStop(1, "#2a5298");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Card container
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 3;
    ctx.roundRect(60, 40, width - 120, height - 80, 25);
    ctx.fill();
    ctx.stroke();

    // Title
    ctx.font = "bold 54px Inter";
    ctx.fillStyle = "#f1f5f9";
    ctx.fillText("Bot Uptime Status", 100, 120);

    // Uptime
    ctx.font = "28px Inter";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("Uptime:", 100, 180);
    ctx.font = "bold 64px Inter";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(formatUptime(uptimeSeconds), 250, 185);

    // CPU & RAM
    ctx.font = "28px Inter";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("CPU Usage:", 100, 260);
    ctx.fillText("RAM Usage:", 100, 310);

    ctx.font = "bold 36px Inter";
    ctx.fillStyle = "#22c55e";
    ctx.fillText(`${usage.cpu.toFixed(1)}%`, 320, 260);
    ctx.fillStyle = "#facc15";
    ctx.fillText(byte2mb(usage.memory), 320, 310);

    // Other stats
    ctx.font = "28px Inter";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(`Cores: ${os.cpus().length}`, 100, 380);
    ctx.fillText(`Ping: ${Date.now() - event.timestamp}ms`, 100, 420);

    ctx.fillText(`OS: ${osInfo.platform} (${osInfo.architecture})`, 550, 380);
    ctx.fillText(`Host: ${osInfo.hostname}`, 550, 420);
    ctx.fillText(`Release: ${osInfo.release}`, 550, 460);

    // Footer
    ctx.font = "20px Inter";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Autobot Canvas by ARI", width - 300, height - 30);

    // Save image
    const outDir = path.join(__dirname, "cache");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `uptime_${Date.now()}.png`);
    fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

    await api.sendMessage(
      { body: "", attachment: fs.createReadStream(outPath) },
      event.threadID,
      () => { try { fs.unlinkSync(outPath); } catch {} },
      event.messageID
    );
  } catch (err) {
    console.error("[uptime] error:", err);
    return api.sendMessage(`❌ Error: ${err.message}`, event.threadID, event.messageID);
  }
};
