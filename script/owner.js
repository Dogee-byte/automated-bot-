const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "owner",
  version: "3.5.0",
  role: 0,
  description: "Owner info (Futuristic Cool Design)",
  credit: "ari",
  cooldown: 5,
  aliases: ["ownerinfo", "botowner"]
};

module.exports.run = async ({ api, event }) => {
  try {
    const outPath = path.join(__dirname, 'temp_owner.png');

    const fontsPath = path.join(__dirname, 'fonts');
    const safeFontLoad = (file, family) => {
      try {
        const fontPath = path.join(fontsPath, file);
        if (fs.existsSync(fontPath)) {
          registerFont(fontPath, { family });
        }
      } catch {}
    };
    safeFontLoad('BebasNeue-Regular.ttf', 'Bebas');
    safeFontLoad('Poppins-Bold.ttf', 'Poppins');

    const owner = {
      name: "ARI",
      title: "⚡ Autobot Owner ⚡",
      bio: "💻 Full Stack Coder • 🎨 Creator of Futuristic Bots • ⚡ Always Online • 🚀 Innovating Everyday",
      avatarUrl: "https://i.imgur.com/HvNZezn.png"
    };

    const width = 1400, height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#050816');
    grad.addColorStop(0.5, '#1b0036');
    grad.addColorStop(1, '#030b24');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(0, 255, 242, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const glow = ctx.createRadialGradient(width/2, height/2, 100, width/2, height/2, 600);
    glow.addColorStop(0, 'rgba(0,255,242,0.2)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0,0,width,height);

    const avatarSize = 280;
    const avatarX = 120, avatarY = height/2 - avatarSize/2;
    try {
      const avatarImg = await loadImage(owner.avatarUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();
    } catch {
      ctx.fillStyle = '#00fff2';
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI*2);
      ctx.fill();
    }

    const rings = ['#00fff2', '#ff00ff', '#00fff2', '#ff0080'];
    rings.forEach((color, i) => {
      ctx.beginPath();
      ctx.lineWidth = 5;
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 25;
      ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 + 10 + (i*8), 0, Math.PI*2);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;

    const textX = avatarX + avatarSize + 80;
    const topY = avatarY + 40;

    ctx.fillStyle = '#ffffff';
    ctx.font = '110px Bebas, sans-serif';
    ctx.textAlign = 'left';
    ctx.shadowColor = '#00fff2';
    ctx.shadowBlur = 25;
    ctx.fillText(owner.name, textX, topY + 80);

    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ff00ff';
    ctx.font = '45px Poppins, sans-serif';
    ctx.fillText(owner.title, textX, topY + 150);

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = '32px Poppins, sans-serif';
    wrapText(ctx, owner.bio, textX, topY + 220, 700, 45);

    ctx.fillStyle = '#00fff2';
    ctx.shadowColor = '#00fff2';
    ctx.shadowBlur = 20;
    ctx.fillRect(0, height - 12, width, 12);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outPath, buffer);
    await api.sendMessage({
      body: `👑 ${owner.name}\n${owner.title}`,
      attachment: fs.createReadStream(outPath)
    }, event.threadID);

    setTimeout(() => { try { fs.unlinkSync(outPath); } catch {} }, 5000);

  } catch (err) {
    console.error(err);
    await api.sendMessage("❌ Error generating owner card.", event.threadID);
  }
};

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}
