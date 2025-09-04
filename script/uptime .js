const fs = require("fs");
const path = require("path");
const os = require("os");
const { createCanvas, registerFont } = require("canvas");
const pidusage = require("pidusage");

module.exports.config = {
  name: "uptime",
  version: "2.1.0",
  role: 0,
  credits: "ARI",
  description: "bur4t",
  hasPrefix: false,
  cooldown: 5,
  aliases: []
};

try {
  registerFont(path.join(__dirname, "../fonts/Inter-Bold.ttf"), { family: "Inter", weight: "700" });
  registerFont(path.join(__dirname, "../fonts/Inter-Regular.ttf"), { family: "Inter", weight: "400" });
} catch (_) {}

function byte2mb(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = parseInt(bytes, 10) || 0;
  while (n >= 1024 && ++i) n /= 1024;
  return `${n.toFixed(1)} ${units[i]}`;
}

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
      release: os.release()
    };

    const width = 1200, height = 650;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "#141E30");
    bg.addColorStop(1, "#243B55");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 3;
    ctx.roundRect(50, 50, width - 100, height - 100, 30);
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 60px Inter";
    ctx.fillStyle = "#f8fafc";
    ctx.fillText("BOT UPTIME STATUS", 80, 130);

    ctx.font = "bold 70px Inter";
    ctx.fillStyle = "#38bdf8";
    ctx.textAlign = "center";
    ctx.fillText(formatUptime(uptimeSeconds), width / 2, 260);

    ctx.font = "28px Inter";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("Uptime", width / 2, 300);

    ctx.textAlign = "left";

    ctx.font = "28px Inter";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("[CPU] Usage:", 100, 380);
    ctx.fillText("[RAM] Usage:", 100, 430);
    ctx.fillText("[CORE] Cores:", 100, 480);
    ctx.fillText("[NET] Ping:", 100, 530);

    ctx.font = "bold 34px Inter";
    ctx.fillStyle = "#22c55e";
    ctx.fillText(`${usage.cpu.toFixed(1)}%`, 350, 380);

    ctx.fillStyle = "#facc15";
    ctx.fillText(byte2mb(usage.memory), 350, 430);

    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`${os.cpus().length}`, 350, 480);

    ctx.fillStyle = "#f87171";
    ctx.fillText(`${Date.now() - event.timestamp}ms`, 350, 530);

    ctx.font = "28px Inter";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(`[OS] ${osInfo.platform} (${osInfo.architecture})`, 650, 380);
    ctx.fillText(`[REL] ${osInfo.release}`, 650, 430);

    ctx.font = "20px Inter";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "right";
    ctx.fillText("Autobot by ARI", width - 80, height - 38);

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
