const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "pair",
  version: "3.4.0",
  role: 0,
  credits: "Ari",
  description: "Randomly pairs you with someone in the group using canvas",
  aliases: ["ship", "partner"],
  cooldown: 5,
};

module.exports.run = async function ({ api, event }) {
  try {
    const { threadID, messageID, senderID, mentions } = event;
    let name1, name2, uid2;

    const senderInfo = await api.getUserInfo(senderID);
    name1 = senderInfo[senderID].name;

    if (Object.keys(mentions).length > 0) {
      uid2 = Object.keys(mentions)[0];
      name2 = mentions[uid2];
    } else {
      const threadInfo = await api.getThreadInfo(threadID);
      const members = threadInfo.participantIDs.filter(id => id !== senderID);

      if (members.length === 0) {
        return api.sendMessage("❌ Walang mapapair dito.", threadID, messageID);
      }

      uid2 = members[Math.floor(Math.random() * members.length)];
      const userInfo = await api.getUserInfo(uid2);
      name2 = userInfo[uid2].name;
    }

    const percent = Math.floor(Math.random() * 101);

    const avatar1 = await loadImage(`https://graph.facebook.com/${senderID}/picture?width=300&height=300`);
    const avatar2 = await loadImage(`https://graph.facebook.com/${uid2}/picture?width=300&height=300`);

    const canvas = createCanvas(700, 400);
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#ff9a9e");
    gradient.addColorStop(1, "#fad0c4");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "white";
    ctx.font = "bold 32px Sans";
    ctx.textAlign = "center";
    ctx.fillText("💞 Pair Result 💞", canvas.width / 2, 50);

    function drawCircleImage(img, x, y, size) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, x, y, size, size);
      ctx.restore();
    }

    drawCircleImage(avatar1, 100, 120, 180);
    drawCircleImage(avatar2, 420, 120, 180);

    ctx.font = "80px Sans";
    ctx.fillText("❤️", canvas.width / 2, 220);

    ctx.font = "22px Sans";
    ctx.fillStyle = "white";
    ctx.fillText(name1, 190, 340);
    ctx.fillText(name2, 510, 340);
    
    ctx.fillStyle = "yellow";
    ctx.font = "bold 28px Sans";
    ctx.fillText(`Compatibility: ${percent}%`, canvas.width / 2, 380);

    const quotes = [
      "💘 Destiny has spoken!",
      "😂 Aba! May chemistry kayo!",
      "🔥 Sparks are flying!",
      "🌹 Love is in the air!",
      "🤣 Bagay kayo parang copy at paste!",
      "✨ The stars have aligned!",
      "😳 Uy, kinikilig ako para sa inyo!"
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    ctx.fillStyle = "white";
    ctx.font = "18px Sans";
    ctx.fillText(randomQuote, canvas.width / 2, 100);

    const filePath = path.join(__dirname, `pair_${Date.now()}.png`);
    const out = fs.createWriteStream(filePath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);

    out.on("finish", () => {
      api.sendMessage(
        {
          body: `💞 Pair Result: ${name1} ❤️ ${name2}`,
          attachment: fs.createReadStream(filePath),
        },
        threadID,
        () => fs.unlinkSync(filePath), 
        messageID
      );
    });

  } catch (err) {
    console.error("PAIR COMMAND ERROR:", err);
    return api.sendMessage("⚠️ Error pairing.", event.threadID, event.messageID);
  }
};
