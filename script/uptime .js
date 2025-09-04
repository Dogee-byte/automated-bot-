const { createCanvas } = require("canvas");
const os = require("os");
const fs = require("fs").promises;
const pidusage = require("pidusage");

module.exports.config = {
  name: "uptime",
  version: "1.1.0",
  role: 0,
  credits: "Ari",
  description: "Uptime ni bur4t",
  hasPrefix: false,
  cooldown: 5,
  aliases: []
};

module.exports.byte2mb = (bytes) => {
  const units = ["Bytes", "KB", "MB", "GB"];
  let l = 0, n = parseInt(bytes, 10) || 0;
  while (n >= 1024 && ++l) n = n / 1024;
  return `${n.toFixed(2)} ${units[l]}`;
};

module.exports.getStartTimestamp = async () => {
  try {
    const startTimeStr = await fs.readFile("time.txt", "utf8");
    return parseInt(startTimeStr);
  } catch {
    return Date.now();
  }
};

module.exports.saveStartTimestamp = async (timestamp) => {
  try {
    await fs.writeFile("time.txt", timestamp.toString());
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

function drawProgressBar(ctx, x, y, width, height, percent, color1, color2) {
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(x, y, width, height);

  const gradient = ctx.createLinearGradient(x, y, x + width, y);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);

  const fillWidth = Math.max(0, Math.min(width, (percent / 100) * width));
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, fillWidth, height);

  ctx.lineWidth = 2;
  ctx.strokeStyle = "#ffffff";
  ctx.strokeRect(x, y, width, height);
}

module.exports.run = async ({ api, event }) => {
  try {
    const startTime = await module.exports.getStartTimestamp();
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const usage = await pidusage(process.pid);

    const osInfo = {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release()
    };

    const uptimeMessage = module.exports.getUptime(uptimeSeconds);

    const canvas = createCanvas(800, 500);
    const ctx = canvas.getContext("2d");

    const bgGradient = ctx.createLinearGradient(0, 0, 800, 500);
    bgGradient.addColorStop(0, "#0f2027");
    bgGradient.addColorStop(0.5, "#203a43");
    bgGradient.addColorStop(1, "#2c5364");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const titleGradient = ctx.createLinearGradient(0, 0, 800, 0);
    titleGradient.addColorStop(0, "#00f5ff");
    titleGradient.addColorStop(1, "#ff00ff");
    ctx.fillStyle = titleGradient;
    ctx.font = "bold 34px Arial";
    ctx.shadowColor = "#000000";
    ctx.shadowBlur = 8;
    ctx.fillText("BOT UPTIME STATUS", 200, 70);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#ffffff";
    ctx.font = "20px Arial";
    let y = 150;
    ctx.fillText(`[ Uptime ] : ${uptimeMessage}`, 60, y); y += 40;
    ctx.fillText(`[ Platform ] : ${osInfo.platform}`, 60, y); y += 40;
    ctx.fillText(`[ Arch ] : ${osInfo.arch}`, 60, y); y += 40;
    ctx.fillText(`[ Ping ] : ${Date.now() - event.timestamp}ms`, 60, y); y += 50;

    const cpuPercent = usage.cpu.toFixed(1);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`[ CPU ] Usage: ${cpuPercent}%`, 60, y);
    drawProgressBar(ctx, 280, y - 20, 450, 25, cpuPercent, "#00ffcc", "#0077ff");
    y += 70;

    const ramUsed = usage.memory;
    const ramTotal = os.totalmem();
    const ramPercent = ((ramUsed / ramTotal) * 100).toFixed(1);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(
      `[ RAM ] Usage: ${module.exports.byte2mb(ramUsed)} / ${module.exports.byte2mb(ramTotal)} (${ramPercent}%)`,
      60,
      y
    );
    drawProgressBar(ctx, 60, y + 10, 670, 25, ramPercent, "#ff007f", "#ffae00");

    ctx.lineWidth = 6;
    ctx.shadowColor = "#00fff7";
    ctx.shadowBlur = 20;
    ctx.strokeStyle = "#00fff7";
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    await module.exports.saveStartTimestamp(startTime);

    return api.sendMessage(
      { body: " ", attachment: canvas.toBuffer() },
      event.threadID,
      event.messageID
    );
  } catch (err) {
    console.error("Uptime command error:", err);
    return api.sendMessage("❌ Error while generating uptime card.", event.threadID);
  }
};
