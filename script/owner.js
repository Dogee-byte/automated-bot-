const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "owner",
  version: "4.0.0",
  role: 0,
  description: "Owner info (Futuristic Cool Design, No Emoji)",
  cooldown: 5,
  aliases: ["ownerinfo", "botowner"]
};

module.exports.run = async ({ api, event }) => {
  try {
    const outPath = path.join(__dirname, 'temp_owner.png');

    // Load fonts
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
      title: "Autobot Owner",
      bio: "Full Stack Developer • Creator of Futuristic Bots • Always Online • Innovating Everyday",
      avatarUrl: "https://i.imgur.com/HvNZezn.png"
    };

    const width = 1400, height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background gradient (deep cyber blue → violet)
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0d0f1a');
    grad.addColorStop(0.5, '#1a0033');
    grad.addColorStop(1, '#0b1024');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Grid lines (cyber grid effect)
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Center glow
    const glow = ctx.createRadialGradient(width/2, height/2, 120, width/2, height/2, 650);
    glow.addColorStop(0, 'rgba(0,180,255,0.2)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0,0,width,height);

    // Avatar
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
      ctx.fillStyle = '#00c8ff';
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI*2);
      ctx.fill();
    }

    // Neon rings (blue + magenta)
    const rings = ['#00c8ff', '#ff00ff', '#00f0ff', '#ff0080'];
    rings.forEach((color, i) => {
      ctx.beginPath();
      ctx.lineWidth = 5;
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 25;
      ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 + 12 + (i*9), 0, Math.PI*2);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;

    // Text Section
    const textX = avatarX + avatarSize + 100;
    const topY = avatarY + 40;

    // Owner Name (Big + Glowing)
    ctx.fillStyle = '#ffffff';
    ctx.font = '110px Bebas, sans-serif';
    ctx.textAlign = 'left';
    ctx.shadowColor = '#00eaff';
    ctx.shadowBlur = 25;
    ctx.fillText(owner.name, textX, topY + 80);

    // Title
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ff00ff';
    ctx.font = '45px Poppins, sans-serif';
    ctx.fillText(owner.title, textX, topY + 150);

    // Bio (Multi-line)
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '32px Poppins, sans-serif';
    wrapText(ctx, owner.bio, textX, topY + 220, 700, 45);

    // Futuristic bottom line
    ctx.fillStyle = '#00eaff';
    ctx.shadowColor = '#00eaff';
    ctx.shadowBlur = 20;
    ctx.fillRect(0, height - 12, width, 12);

    // Save & send
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

// Text wrap helper
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
