const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { createCanvas, loadImage, registerFont } = require('canvas');

module.exports.config = {
    name: "welcome",
    version: "5.2.0",
    role: 0,
    description: "Welcome new members with avatar",
    credits: "ARI (fixed)",
    hasEvent: true
};

try {
    registerFont(path.join(__dirname, "fonts", "Poppins-Bold.ttf"), { family: "Poppins" });
} catch {}

function drawCyberGrid(ctx, width, height) {
    const colors = ['rgba(0,255,255,0.1)', 'rgba(255,0,255,0.1)', 'rgba(0,255,128,0.1)'];
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
        ctx.strokeStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
    }
    for (let j = 0; j < height; j += 40) {
        ctx.strokeStyle = colors[j % colors.length];
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
        ctx.stroke();
    }
}

function drawMatrix(ctx, width, height) {
    const cols = Math.floor(width / 20);
    const drops = Array(cols).fill(0);

    for (let i = 0; i < drops.length; i++) {
        drops[i] = Math.random() * height;
    }

    for (let frame = 0; frame < 50; frame++) {
        for (let i = 0; i < drops.length; i++) {
            const x = i * 20;
            const y = drops[i] * frame * 0.01 % height;
            ctx.fillStyle = 'rgba(0,255,0,0.4)';
            ctx.font = "15px monospace";
            ctx.fillText(String.fromCharCode(0x30A0 + Math.random() * 96), x, y);
        }
    }
}

module.exports.handleEvent = async function ({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;
    const addedParticipants = event.logMessageData?.addedParticipants;
    if (!addedParticipants?.length) return;

    const groupInfo = await api.getThreadInfo(event.threadID);
    const groupName = groupInfo.threadName || "this group";

    const width = 900, height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(0.5, '#1c0030'); 
    gradient.addColorStop(1, '#000820');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    drawMatrix(ctx, width, height);

    const particleColors = ['#ff0080', '#00ffff', '#ff00ff', '#00ff80'];
    for (let i = 0; i < 80; i++) {
        ctx.beginPath();
        ctx.fillStyle = particleColors[Math.floor(Math.random() * particleColors.length)] + (Math.random() * 0.5).toFixed(2).slice(1);
        ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCyberGrid(ctx, width, height);

    const avatarSize = 85;
    const avatarSpacing = 20;
    const totalWidth = addedParticipants.length * (avatarSize * 2 + avatarSpacing) - avatarSpacing;
    let startX = width / 2 - totalWidth / 2;

    const names = [];
    for (const participant of addedParticipants) {
        const userID = participant.userFbId || participant.userId || participant.id;
        if (!userID) continue;

        const getAvatar = async (uid) => {
        const url = `https://graph.facebook.com/${uid}/picture?height=300&width=300&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const response = await axios.get(url, { responseType: "arraybuffer" });
        const imageBuffer = Buffer.from(response.data, "binary");
        return await loadImage(`data:image/png;base64,${imageBuffer.toString("base64")}`);
    }
        ctx.save();
        ctx.beginPath();
        ctx.arc(startX + avatarSize, height / 2 - 40, avatarSize, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatarImg, startX, height / 2 - 125, avatarSize * 2, avatarSize * 2);
        ctx.restore();

        // Neon ring
        ctx.strokeStyle = particleColors[Math.floor(Math.random() * particleColors.length)];
        ctx.lineWidth = 4;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(startX + avatarSize, height / 2 - 40, avatarSize + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        startX += avatarSize * 2 + avatarSpacing;

        const info = await api.getUserInfo(userID);
        names.push(info[userID]?.name || "New Member");
    }

    ctx.fillStyle = '#ff80ff';
    ctx.shadowColor = '#ff80ff';
    ctx.shadowBlur = 15;
    ctx.textAlign = "center";
    ctx.font = "bold 50px Poppins, Sans-serif";
    ctx.fillText(`WELCOME, ${names.join(", ")}!`, width / 2, height - 130);

    ctx.font = "28px Poppins, Sans-serif";
    ctx.fillText(`to ${groupName}`, width / 2, height - 85);

    ctx.font = "20px Poppins, Sans-serif";
    ctx.fillText("We’re happy that you’re here. Please interact with us, welcome!", width / 2, height - 50);
    ctx.shadowBlur = 0;

    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    const imagePath = path.join(cacheDir, `welcome_${Date.now()}.png`);
    fs.writeFileSync(imagePath, canvas.toBuffer("image/png"));

    await api.sendMessage({
        body: `🎉 Everyone welcome ${names.join(", ")} to ${groupName}!`,
        attachment: fs.createReadStream(imagePath)
    }, event.threadID);

    fs.unlinkSync(imagePath);
};
