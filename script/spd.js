const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports.config = {
  name: "sdp",
  version: "1.0.0",
  role: 0, 
  hasPrefix: false,
  aliases: ["styledp", "canvasdp"],
  description: "Generate a stylized display picture (DP) using Canvas.",
  usage: "sdp [optional text] or reply/mention someone",
  credits: "ari",
};

async function fetchBuffer(url) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
}

function drawCircularImage(ctx, img, x, y, radius) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();
}

function drawMultilineCenter(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";

  for (const w of words) {
    const test = current ? current + " " + w : w;
    const { width } = ctx.measureText(test);
    if (width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  const totalHeight = lines.length * lineHeight;
  let startY = y - totalHeight / 2 + lineHeight / 2;
  for (const line of lines) {
    ctx.fillText(line, x, startY);
    startY += lineHeight;
  }
}

function resolveTargetUID(event) {
  if (event.messageReply?.senderID) return event.messageReply.senderID;
  const mentionIDs = event.mentions ? Object.keys(event.mentions) : [];
  if (mentionIDs.length > 0) return mentionIDs[0];
  return event.senderID;
}

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  const overlayText = args.join(" ").trim() || "Stay awesome!";
  const uid = resolveTargetUID(event);

  const avatarURL = `https://graph.facebook.com/${uid}/picture?width=1024&height=1024`;

  const W = 1080, H = 1350;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  try {
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#111827");
    bg.addColorStop(1, "#1f2937");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const ringCx = W / 2;
    const ringCy = H * 0.38;
    const ringOuter = Math.min(W, H) * 0.34;
    const ringInner = ringOuter - 18;

    const ringGradient = ctx.createRadialGradient(
      ringCx, ringCy, ringInner - 10,
      ringCx, ringCy, ringOuter + 40
    );
    ringGradient.addColorStop(0, "#60a5fa");
    ringGradient.addColorStop(0.5, "#a78bfa");
    ringGradient.addColorStop(1, "#f472b6");

    ctx.beginPath();
    ctx.arc(ringCx, ringCy, ringOuter, 0, Math.PI * 2);
    ctx.arc(ringCx, ringCy, ringInner, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = ringGradient;
    ctx.fill("evenodd");

    const avatarBuf = await fetchBuffer(avatarURL);
    const avatarImg = await loadImage(avatarBuf);

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 30;
    drawCircularImage(ctx, avatarImg, ringCx, ringCy, ringInner - 14);
    ctx.restore();

    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 78px sans-serif";
    ctx.fillText("STYLIZED DP", W / 2, H * 0.67);

    ctx.globalAlpha = 0.35;
    ctx.fillRect(W * 0.2, H * 0.69, W * 0.6, 2);
    ctx.globalAlpha = 1;

    
    ctx.font = "600 46px sans-serif";
    drawMultilineCenter(ctx, overlayText, W / 2, H * 0.78, W * 0.78, 56);

    ctx.globalAlpha = 0.7;
    ctx.font = "24px sans-serif";
    ctx.fillText("/sdp • canvas", W / 2, H - 40);
    ctx.globalAlpha = 1;

    const outPath = path.join(__dirname, `sdp_${Date.now()}.png`);
    const out = fs.createWriteStream(outPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);

    await new Promise((resolve, reject) => {
      out.on("finish", resolve);
      out.on("error", reject);
    });

    return api.sendMessage(
      {
        body: "Here you go!",
        attachment: fs.createReadStream(outPath),
      },
      threadID,
      () => fs.unlink(outPath, () => {}),
      messageID
    );
  } catch (e) {
    console.error(e);
    return api.sendMessage(
      `⚠️ SDP Canvas error: ${e.message}`,
      threadID,
      undefined,
      messageID
    );
  }
};

module.exports.onLoad = async function () {
};
