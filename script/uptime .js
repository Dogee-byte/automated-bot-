const fs = require("fs");
const path = require("path");
const os = require("os");
const { createCanvas, registerFont } = require("canvas");
const pidusage = require("pidusage");

module.exports.config = {
  name: "uptime",
  version: "1.0.0",
  role: 0,
  credits: "ARI",
  description: "Uptime ni bur4t",
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

    const width = 1250, height = 700;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "#0f2027");
    bg.addColorStop(0.5, "#203a43");
    bg.addColorStop(1, "#2c5364");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 3;
    ctx.roundRect(60, 60, width - 120, height - 120, 40);
    ctx.fill();
    ctx.stroke();
    
    ctx.font = "bold 65px Inter";
    ctx.fillStyle = "#f8fafc";
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 20;
    ctx.fillText("BOT UPTIME MONITOR", 90, 140);
    ctx.shadowBlur = 0;

    ctx.textAlign = "center";
    ctx.font = "bold 75px Inter";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(formatUptime(uptimeSeconds), width / 2, 250);

    ctx.font = "28px Inter";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("Uptime", width / 2, 300);
    ctx.textAlign = "left";

    const cpuUsage = usage.cpu / 100;
    ctx.font = "28px Inter";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("CPU Usage:", 120, 380);

    const cpuBarX = 120, cpuBarY = 400, cpuBarW = 450, cpuBarH = 30;
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(cpuBarX, cpuBarY, cpuBarW, cpuBarH);
    const cpuGrad = ctx.createLinearGradient(cpuBarX, cpuBarY, cpuBarX + cpuBarW, cpuBarY);
    cpuGrad.addColorStop(0, "#16a34a");
    cpuGrad.addColorStop(1, "#22c55e");
    ctx.fillStyle = cpuGrad;
    ctx.fillRect(cpuBarX, cpuBarY, cpuUsage * cpuBarW, cpuBarH);
    ctx.strokeStyle = "#bbf7d0";
    ctx.strokeRect(cpuBarX, cpuBarY, cpuBarW, cpuBarH);

    ctx.font = "bold 26px Inter";
    ctx.fillStyle = "#f8fafc";
    ctx.textAlign = "center";
    ctx.fillText(`${usage.cpu.toFixed(1)}%`, cpuBarX + cpuBarW / 2, cpuBarY + 24);
    ctx.textAlign = "left";

    const totalMem = os.totalmem();
    const usedMem = usage.memory;
    const ramUsage = usedMem / totalMem;
    ctx.font = "28px Inter";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("RAM Usage:", 120, 470);

    const ramBarX = 120, ramBarY = 490, ramBarW = 450, ramBarH = 30;
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(ramBarX, ramBarY, ramBarW, ramBarH);
    const ramGrad = ctx.createLinearGradient(ramBarX, ramBarY, ramBarX + ramBarW, ramBarY);
    ramGrad.addColorStop(0, "#f59e0b");
    ramGrad.addColorStop(1, "#facc15");
    ctx.fillStyle = ramGrad;
    ctx.fillRect(ramBarX, ramBarY, ramUsage * ramBarW, ramBarH);
    ctx.strokeStyle = "#fde68a";
    ctx.strokeRect(ramBarX, ramBarY, ramBarW, ramBarH);

    ctx.font = "bold 26px Inter";
    ctx.fillStyle = "#1e293b";
    ctx.textAlign = "center";
    ctx.fillText(`${byte2mb(usedMem)} / ${byte2mb(totalMem)}`, ramBarX + ramBarW / 2, ramBarY + 24);
    ctx.textAlign = "left";

    ctx.font = "28px Inter";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("Cores:", 120, 570);
    ctx.fillText("Ping:", 120, 620);

    ctx.font = "bold 32px Inter";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`${os.cpus().length}`, 240, 570);

    ctx.fillStyle = "#f87171";
    ctx.fillText(`${Date.now() - event.timestamp}ms`, 240, 620);

    ctx.font = "28px Inter";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(`OS: ${osInfo.platform} (${osInfo.architecture})`, 700, 380);
    ctx.fillText(`Release: ${osInfo.release}`, 700, 430);

    ctx.font = "20px Inter";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "right";
    ctx.fillText("Autobot by ARI", width - 80, height - 30);

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
