const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "billboard",
  version: "3.1.0",
  credits: "Ari",
  role: 0,
  description: "Show your text inside the billboard",
  aliases: ["bb"],
  cooldown: 5
};

module.exports.run = async ({ api, event, args }) => {
  try {
    const fontPath = path.join(__dirname, "billboard-font.ttf");
    if (fs.existsSync(fontPath)) {
      registerFont(fontPath, { family: "BillboardFont" });
    }

    const text = args.length > 0 ? args.join(" ") : "Your Text Here";

    const billboardImg = "https://i.imgur.com/1l75057.jpg";
    const bg = await loadImage(billboardImg);
    const canvas = createCanvas(bg.width, bg.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    // === Billboard rectangle area (safe zone inside white part) ===
    const boxX = 450;
    const boxY = 260;
    const boxWidth = 1000;
    const boxHeight = 500;

    // Debug outline (pwede mong alisin later)
    ctx.strokeStyle = "red";
    ctx.lineWidth = 5;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // === Auto font sizing ===
    let fontSize = 36; // start large
    ctx.font = `${fontSize}px BillboardFont, Arial`;

    function getLines(context, text, maxWidth) {
      const words = text.split(" ");
      let line = "";
      let lines = [];

      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + " ";
        let testWidth = context.measureText(testLine).width;
        if (testWidth > maxWidth && n > 0) {
          lines.push(line.trim());
          line = words[n] + " ";
        } else {
          line = testLine;
        }
      }
      lines.push(line.trim());
      return lines;
    }

    let lines;
    let lineHeight;
    do {
      ctx.font = `${fontSize}px BillboardFont, Arial`;
      lineHeight = fontSize + 10;
      lines = getLines(ctx, text, boxWidth);

      let textHeight = lines.length * lineHeight;
      let widest = Math.max(...lines.map(l => ctx.measureText(l).width));

      if (widest <= boxWidth && textHeight <= boxHeight) break;
      fontSize -= 2;
    } while (fontSize > 18);

    // === Draw text ===
    ctx.font = `${fontSize}px BillboardFont, Arial`;
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(255,255,255,0.6)";
    ctx.shadowBlur = 6;

    let totalHeight = lines.length * lineHeight;
    let startY = boxY + (boxHeight - totalHeight) / 2 + fontSize;

    lines.forEach((line, i) => {
      ctx.fillText(line, boxX + boxWidth / 2, startY + i * lineHeight);
    });

    // === Save result ===
    const outPath = path.join(__dirname, `billboard_${event.senderID}.png`);
    const out = fs.createWriteStream(outPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);

    out.on("finish", () => {
      api.sendMessage(
        {
          body: `📢 Billboard generated!\nYour text: "${text}"`,
          attachment: fs.createReadStream(outPath)
        },
        event.threadID,
        () => fs.unlinkSync(outPath),
        event.messageID
      );
    });
  } catch (e) {
    api.sendMessage(`❌ Error: ${e.message}`, event.threadID, event.messageID);
  }
};
