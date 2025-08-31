const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "billboard",
  version: "3.0.0",
  credits: "Ari",
  role: 0,
  description: "Put your text realistically inside the billboard",
  aliases: ["bb"],
  cooldown: 5
};

module.exports.run = async ({ api, event, args }) => {
  try {
    // font support
    const fontPath = path.join(__dirname, "billboard-font.ttf");
    if (fs.existsSync(fontPath)) {
      registerFont(fontPath, { family: "BillboardFont" });
    }

    const text = args.length > 0 ? args.join(" ") : "Your Text Here";

    // load background
    const billboardImg = path.join(__dirname, "billboard.jpg"); 
    // TIP: Save yung pinadala mong picture as billboard.jpg sa same folder
    const bg = await loadImage(billboardImg);

    const canvas = createCanvas(bg.width, bg.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    // offscreen canvas = parang rectangular billboard
    const offW = 1000, offH = 600;
    const offCanvas = createCanvas(offW, offH);
    const offCtx = offCanvas.getContext("2d");

    // fill background white (optional)
    offCtx.fillStyle = "#fff";
    offCtx.fillRect(0, 0, offW, offH);

    // draw text centered
    let fontSize = 40;
    offCtx.font = `${fontSize}px BillboardFont, Arial`;
    offCtx.fillStyle = "#000";
    offCtx.textAlign = "center";
    offCtx.textBaseline = "middle";

    // shrink font until kasya
    while (offCtx.measureText(text).width > offW * 0.9 && fontSize > 20) {
      fontSize -= 2;
      offCtx.font = `${fontSize}px BillboardFont, Arial`;
    }
    offCtx.fillText(text, offW / 2, offH / 2);

    // target corners ng billboard (adjust kung medyo off)
    const corners = [
      { x: 120, y: 160 },   // top-left
      { x: 930, y: 110 },   // top-right
      { x: 1010, y: 520 },  // bottom-right
      { x: 90, y: 560 }     // bottom-left
    ];

    // perspective transform
    function drawImageWarp(ctx, img, sx, sy, sw, sh, corners) {
      const step = 20; // mas mataas = mas smooth warp
      for (let i = 0; i < step; i++) {
        for (let j = 0; j < step; j++) {
          const u = i / step, v = j / step;
          const u1 = (i + 1) / step, v1 = (j + 1) / step;

          const p1 = interp(corners, u, v);
          const p2 = interp(corners, u1, v);
          const p3 = interp(corners, u1, v1);
          const p4 = interp(corners, u, v1);

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.closePath();
          ctx.clip();

          ctx.transform(
            (p2.x - p1.x) / (sw / step), (p2.y - p1.y) / (sw / step),
            (p4.x - p1.x) / (sh / step), (p4.y - p1.y) / (sh / step),
            p1.x, p1.y
          );

          ctx.drawImage(
            img,
            sx + i * (sw / step),
            sy + j * (sh / step),
            sw / step,
            sh / step,
            0,
            0,
            sw / step,
            sh / step
          );

          ctx.restore();
        }
      }
    }

    function interp(c, u, v) {
      const x =
        (1 - u) * (1 - v) * c[0].x +
        u * (1 - v) * c[1].x +
        u * v * c[2].x +
        (1 - u) * v * c[3].x;
      const y =
        (1 - u) * (1 - v) * c[0].y +
        u * (1 - v) * c[1].y +
        u * v * c[2].y +
        (1 - u) * v * c[3].y;
      return { x, y };
    }

    drawImageWarp(ctx, offCanvas, 0, 0, offW, offH, corners);

    // save
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
