const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

module.exports.config = {
  name: "billboard",
  version: "2.1.0",
  role: 0,
  credits: "vern + ikaw",
  description: "Generate a billboard image with custom text inside the board.",
  usage: "/billboard <your message>",
  prefix: true,
  cooldowns: 3,
  commandCategory: "Canvas"
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const text = args.join(' ').trim();
  const prefix = "/";

  if (!text) {
    return api.sendMessage(
      `📌 Usage: ${prefix}billboard <your message>\n💬 Example: ${prefix}billboard Hello World!`,
      threadID, messageID
    );
  }

  try {
    // base image path (yung pinakita mong billboard picture)
    const basePath = path.join(__dirname, "cache", "https://files.catbox.moe/8w3jif.jpeg");
    if (!fs.existsSync(basePath)) {
      return api.sendMessage("🚫 Wala pang base image sa cache/billboard_base.jpg", threadID, messageID);
    }

    // Load base image
    const baseImage = await loadImage(basePath);
    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");

    // Draw base image
    ctx.drawImage(baseImage, 0, 0);

    // === Billboard rectangle area (approx) ===
    const rectX = 90;   // left margin
    const rectY = 80;   // top margin
    const rectW = 620;  // width ng billboard
    const rectH = 320;  // height ng billboard

    // === Text style ===
    ctx.font = "bold 50px Arial";
    ctx.fillStyle = "white";       // main text color
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Shadow / outline para mas visible
    ctx.shadowColor = "black";
    ctx.shadowBlur = 6;
    ctx.lineWidth = 4;

    // === Word-wrap ===
    const maxWidth = rectW - 40; // margin sa gilid
    const lineHeight = 60;
    const words = text.split(" ");
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      let word = words[i];
      let width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);

    // Center vertically sa loob ng billboard
    const startY = rectY + rectH / 2 - (lines.length * lineHeight) / 2;

    lines.forEach((line, i) => {
      ctx.fillText(line, rectX + rectW / 2, startY + i * lineHeight);
    });

    // === Save output ===
    const outPath = path.join(__dirname, "cache", "billboard_out.jpg");
    const buffer = canvas.toBuffer("image/jpeg");
    fs.writeFileSync(outPath, buffer);

    // Send result
    return api.sendMessage({
      body: `🖼️ Billboard created!\n\n"${text}"`,
      attachment: fs.createReadStream(outPath)
    }, threadID, messageID);

  } catch (err) {
    console.error("Billboard error:", err);
    return api.sendMessage("❌ Failed to generate billboard image.", threadID, messageID);
  }
};
