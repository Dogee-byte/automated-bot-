const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "billboard",
  version: "1.4.0",
  credits: "Ari",
  role: 0,
  description: "Show your text on a tilted billboard",
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

    ctx.save();

    ctx.translate(canvas.width / 2, canvas.height / 2.4); 
    ctx.rotate(-0.05); 
    ctx.scale(1, 0.9); 

    ctx.font = "45px BillboardFont, Arial";
    ctx.fillStyle = "#000000"; 
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(255,255,255,0.4)"; 
    ctx.shadowBlur = 4;

    function wrapText(context, text, x, y, maxWidth, lineHeight) {
      const words = text.split(" ");
      let line = "";
      let lines = [];

      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + " ";
        let metrics = context.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          lines.push(line.trim());
          line = words[n] + " ";
        } else {
          line = testLine;
        }
      }
      lines.push(line.trim());

      let startY = y - ((lines.length - 1) * lineHeight) / 2;
      for (let i = 0; i < lines.length; i++) {
        context.fillText(lines[i], x, startY + i * lineHeight);
      }
    }

    wrapText(ctx, text, 0, 0, canvas.width - 500, 55);

    ctx.restore();

    const outPath = path.join(__dirname, `billboard_${event.senderID}.png`);
    const out = fs.createWriteStream(outPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);

    out.on("finish", () => {
      api.sendMessage(
        {
          body: `📢 Tilted Billboard generated!\nYour text: "${text}"`,
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
