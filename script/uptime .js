const os = require("os");
const fs = require("fs").promises;

module.exports.config = {
  name: "uptime",
  version: "2.0.0",
  role: 0,
  credits: "Ari (bulletproof ver.)",
  description: "Uptime card with CPU/RAM bars; falls back to text if canvas/pidusage missing",
  hasPrefix: false,
  cooldown: 5,
  aliases: []
};

// ---------- Helpers ----------
const byte2mb = (bytes) => {
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  let l = 0, n = parseInt(bytes, 10) || 0;
  while (n >= 1024 && ++l) n = n / 1024;
  return `${n.toFixed(l ? 2 : 0)} ${units[l]}`;
};

const getUptimeString = (uptimeSec) => {
  const days = Math.floor(uptimeSec / 86400);
  const hours = Math.floor((uptimeSec % 86400) / 3600);
  const mins = Math.floor((uptimeSec % 3600) / 60);
  const seconds = Math.floor(uptimeSec % 60);
  return `${days}d ${hours}h ${mins}m ${seconds}s`;
};

const asciiBar = (percent, width = 24) => {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  const filled = Math.round((p / 100) * width);
  const empty = width - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
};

const getStartTimestamp = async () => {
  try {
    const s = await fs.readFile("time.txt", "utf8");
    const v = parseInt(s, 10);
    return Number.isFinite(v) ? v : Date.now();
  } catch {
    return Date.now();
  }
};

const saveStartTimestamp = async (ts) => {
  try { await fs.writeFile("time.txt", String(ts)); } catch (e) { console.error("saveStartTimestamp:", e); }
};

// ---------- Main ----------
module.exports.run = async ({ api, event }) => {
  try {
    // Uptime
    const startTime = await getStartTimestamp();
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const uptimeMessage = getUptimeString(uptimeSeconds);

    // Try to load pidusage; fallback if missing
    let cpuPercent = null;
    let procMemBytes = null;

    let pidusage;
    try { pidusage = require("pidusage"); } catch { pidusage = null; }

    if (pidusage) {
      try {
        const usage = await pidusage(process.pid);
        cpuPercent = Number(usage.cpu) || 0;           // process CPU %
        procMemBytes = Number(usage.memory) || 0;      // process RSS
      } catch (e) {
        console.warn("pidusage failed, using fallbacks:", e?.message || e);
      }
    }
    if (cpuPercent === null) {
      // Approximate from 1-min load (system-wide), normalized by core count
      const cores = (os.cpus() || []).length || 1;
      const load1 = (os.loadavg?.()[0]) || 0;
      cpuPercent = Math.max(0, Math.min(100, (load1 / cores) * 100));
    }
    if (procMemBytes === null) {
      procMemBytes = (process.memoryUsage?.().rss) || 0;
    }

    const totalMem = os.totalmem();
    const ramPercent = Math.max(0, Math.min(100, (procMemBytes / totalMem) * 100));

    // Build text body (always present so laging may reply)
    const bodyLines = [
      "🤖 BOT UPTIME STATUS",
      `⏱ Uptime: ${uptimeMessage}`,
      `⚙️ CPU: ${cpuPercent.toFixed(1)}% ${asciiBar(cpuPercent)}`,
      `📦 RAM: ${byte2mb(procMemBytes)} / ${byte2mb(totalMem)} (${ramPercent.toFixed(1)}%) ${asciiBar(ramPercent)}`,
      `🖥 Platform: ${os.platform()}  |  Arch: ${os.arch()}`,
      `🧩 Cores: ${(os.cpus() || []).length}  |  OS: ${os.release()}`,
      `📡 Ping: ${Math.max(0, Date.now() - (event?.timestamp || Date.now()))}ms`
    ];
    const textBody = bodyLines.join("\n");

    // Try to load canvas; if not available, send text-only reply
    let attachment = null;
    try {
      const { createCanvas } = require("canvas"); // lazy require
      if (typeof createCanvas === "function") {
        // ---- Draw canvas card ----
        const W = 900, H = 520;
        const canvas = createCanvas(W, H);
        const ctx = canvas.getContext("2d");

        // Background gradient
        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, "#0f2027");
        bg.addColorStop(0.5, "#203a43");
        bg.addColorStop(1, "#2c5364");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // Title (gradient fill)
        const titleGrad = ctx.createLinearGradient(0, 0, W, 0);
        titleGrad.addColorStop(0, "#00f5ff");
        titleGrad.addColorStop(1, "#ff00ff");
        ctx.fillStyle = titleGrad;
        ctx.font = "bold 36px Arial";
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 10;
        ctx.fillText("🤖 BOT UPTIME STATUS", 240, 70);
        ctx.shadowBlur = 0;

        // Divider
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(30, 100);
        ctx.lineTo(W - 30, 100);
        ctx.stroke();

        // Info text
        ctx.fillStyle = "#ffffff";
        ctx.font = "20px Arial";
        let y = 150;
        const leftX = 60;
        const lineGap = 36;

        ctx.fillText(`⏱ Uptime: ${uptimeMessage}`, leftX, y); y += lineGap;
        ctx.fillText(`🖥 Platform: ${os.platform()}   •   Arch: ${os.arch()}   •   Cores: ${(os.cpus() || []).length}`, leftX, y); y += lineGap;
        ctx.fillText(`🧩 OS: ${os.release()}   •   📡 Ping: ${Math.max(0, Date.now() - (event?.timestamp || Date.now()))}ms`, leftX, y);
        y += 50;

        // Bars helper (with gradient fill)
        const drawBar = (label, percent, x, yBar, width, height, c1, c2) => {
          ctx.fillStyle = "#ffffff";
          ctx.font = "20px Arial";
          ctx.fillText(`${label}: ${percent.toFixed(1)}%`, leftX, yBar - 10);

          // background
          ctx.fillStyle = "rgba(255,255,255,0.15)";
          ctx.fillRect(x, yBar, width, height);

          // gradient fill
          const g = ctx.createLinearGradient(x, yBar, x + width, yBar);
          g.addColorStop(0, c1);
          g.addColorStop(1, c2);
          const fillWidth = Math.max(0, Math.min(width, (percent / 100) * width));
          ctx.fillStyle = g;
          ctx.fillRect(x, yBar, fillWidth, height);

          // border
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#ffffff";
          ctx.strokeRect(x, yBar, width, height);
        };

        // CPU bar
        drawBar("⚙️ CPU Usage", cpuPercent, 300, y - 20, 520, 26, "#00ffcc", "#0077ff");
        y += 70;

        // RAM bar
        ctx.fillStyle = "#ffffff";
        ctx.font = "20px Arial";
        ctx.fillText(
          `📦 RAM: ${byte2mb(procMemBytes)} / ${byte2mb(totalMem)} (${ramPercent.toFixed(1)}%)`,
          leftX,
          y - 10
        );
        // wider bar for RAM
        const ramX = leftX, ramW = W - leftX * 2;
        // background
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(ramX, y, ramW, 26);
        // fill
        const rg = ctx.createLinearGradient(ramX, y, ramX + ramW, y);
        rg.addColorStop(0, "#ff007f");
        rg.addColorStop(1, "#ffae00");
        const ramFill = Math.max(0, Math.min(ramW, (ramPercent / 100) * ramW));
        ctx.fillStyle = rg;
        ctx.fillRect(ramX, y, ramFill, 26);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ffffff";
        ctx.strokeRect(ramX, y, ramW, 26);

        // Frame glow
        ctx.lineWidth = 6;
        ctx.shadowColor = "rgba(0,255,247,0.7)";
        ctx.shadowBlur = 18;
        ctx.strokeStyle = "#00fff7";
        ctx.strokeRect(20, 20, W - 40, H - 40);
        ctx.shadowBlur = 0;

        attachment = canvas.toBuffer();
      }
    } catch (e) {
      console.warn("Canvas not available, sending text-only:", e?.message || e);
    }

    await saveStartTimestamp(startTime);

    if (attachment) {
      return api.sendMessage(
        { body: textBody, attachment },
        event.threadID,
        event.messageID
      );
    } else {
      return api.sendMessage(textBody, event.threadID, event.messageID);
    }
  } catch (err) {
    console.error("uptime command fatal error:", err);
    return api.sendMessage("❌ Error while generating uptime info. Check console logs.", event.threadID);
  }
};
