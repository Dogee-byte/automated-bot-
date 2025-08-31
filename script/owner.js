const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");

module.exports.config = {
  name: "owner",
  version: "2.1.0",
  credits: "Ari A.K.A pogi",
  description: "Show futuristic owner info card",
  usage: "{p}owner",
  cooldown: 3
};

module.exports.run = async ({ api, event }) => {
  try {
    const width = 900;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#0f0c29");
    gradient.addColorStop(0.5, "#302b63");
    gradient.addColorStop(1, "#24243e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.shadowColor = "rgba(0, 255, 255, 0.8)";
    ctx.shadowBlur = 35;
    ctx.strokeStyle = "#00f7ff";
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, width - 40, height - 40);
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "rgba(255, 0, 255, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.3);
    ctx.lineTo(width, height * 0.6);
    ctx.stroke();

    const avatar = await loadImage("https://i.imgur.com/HvNZezn.png"); // replace link with your pic
    ctx.save();
    ctx.beginPath();
    ctx.arc(180, height / 2, 120, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 60, height / 2 - 120, 240, 240);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(180, height / 2, 125, 0, Math.PI * 2);
    ctx.strokeStyle = "#00f7ff";
    ctx.lineWidth = 6;
    ctx.shadowColor = "#00f7ff";
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#fff";
    ctx.font = "bold 58px Poppins";
    ctx.fillText("ARI", 330, 180);

    ctx.fillStyle = "#ff00ff";
    ctx.font = "bold 36px Poppins";
    ctx.shadowColor = "#ff00ff";
    ctx.shadowBlur = 25;
    ctx.fillText("⚡ AUTOBOT OWNER ⚡", 330, 230);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#d1d5db";
    ctx.font = "24px Poppins";
    ctx.fillText("◈ Full Stack Coder • ⚝ Creator of Bots", 330, 290);
    ctx.fillText("⟁ Always Online • ✦ Innovating Everyday", 330, 330);

    const path = __dirname + "/cache/owner_card.png";
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(path, buffer);

    api.sendMessage(
      {
        body: "👑 𝔬𝔴𝔫𝔢𝔯 𝔦𝔫𝔣𝔬 👑",
        attachment: fs.createReadStream(path)
      },
      event.threadID,
      () => fs.unlinkSync(path),
      event.messageID
    );
  } catch (err) {
    api.sendMessage("❌ Error generating owner card: " + err.message, event.threadID, event.messageID);
  }
};
