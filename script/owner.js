const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "owner",
  version: "4.0.0",
  role: 0,
  description: "Owner info (Futuristic with Emoji Support)",
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
    await drawTextWithEmoji(ctx, owner.title, textX, topY + 150, 50);

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = '32px Poppins, sans-serif';
    await drawTextWithEmoji(ctx, owner.bio, textX, topY + 220, 40, 700);

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

async function drawTextWithEmoji(ctx, text, x, y, lineHeight, maxWidth = 800) {
  const words = text.split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      await renderLine(ctx, line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  await renderLine(ctx, line, x, y);
}

async function renderLine(ctx, line, x, y) {
  let cursorX = x;
  const regex = /\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu;
  const parts = line.split(regex);
  const emojis = line.match(regex);

  for (let i = 0; i < parts.length; i++) {
    const textPart = parts[i];
    if (textPart) {
      ctx.fillText(textPart, cursorX, y);
      cursorX += ctx.measureText(textPart).width;
    }

    if (emojis && emojis[i]) {
      const emoji = emojis[i];
      const url = twemoji.parse(emoji, { folder: 'svg', ext: '.svg' })
        .match(/src="([^"]+)"/)?.[1];
      if (url) {
        try {
          const img = await loadImage(url);
          const size = parseInt(ctx.font, 10) || 32;
          ctx.drawImage(img, cursorX, y - size + 10, size, size);
          cursorX += size;
        } catch (err) {
          ctx.fillText(emoji, cursorX, y); // fallback
          cursorX += ctx.measureText(emoji).width;
        }
      }
    }
  }
}
