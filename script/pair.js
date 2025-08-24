const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "pair",
  version: "3.0.5",
  role: 0,
  credits: "ARI",
  description: "Randomly pairs you with someone in the group (with profile pics and emojis on canvas)",
  aliases: ["ship", "partner"],
  cooldown: 5,
};

module.exports.run = async function ({ api, event }) {
  try {
    const { threadID, messageID, senderID, mentions } = event;
    let name1, name2, uid2;

    const info = await api.getUserInfo(senderID);
    name1 = info[senderID].name;

    if (Object.keys(mentions).length > 0) {
      uid2 = Object.keys(mentions)[0];
      name2 = mentions[uid2];
    } else {
      const threadInfo = await api.getThreadInfo(threadID);
      const members = threadInfo.participantIDs.filter(id => id !== senderID);
      if (members.length === 0) return api.sendMessage("❌ Walang mapapair dito.", threadID, messageID);
      uid2 = members[Math.floor(Math.random() * members.length)];
      const info2 = await api.getUserInfo(uid2);
      name2 = info2[uid2].name;
    }

    const percent = Math.floor(Math.random() * 101);

    const getAvatar = async (uid) => {
      const url = `https://graph.facebook.com/${uid}/picture?height=300&width=300&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const response = await axios.get(url, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data, "binary");
      return await loadImage(`data:image/png;base64,${buffer.toString("base64")}`);
    };

    const avatar1 = await getAvatar(senderID);
    const avatar2 = await getAvatar(uid2);

    const canvas = createCanvas(700, 400);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffe4ec";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const drawCircleImage = (img, x, y, size) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, x, y, size, size);
      ctx.restore();
    };

    drawCircleImage(avatar1, 100, 120, 180);
    drawCircleImage(avatar2, 420, 120, 180);

    const emojiToURL = (emoji) => {
      const codePoint = Array.from(emoji).map(c => c.codePointAt(0).toString(16)).join('-');
      return `https://twemoji.maxcdn.com/v/latest/72x72/${codePoint}.png`;
    };

    const drawEmoji = async (ctx, emoji, x, y, size) => {
      try {
        const url = emojiToURL(emoji);
        const img = await loadImage(url);
        ctx.drawImage(img, x, y, size, size);
      } catch (e) {
        console.log("Emoji load failed:", emoji, e.message);
      }
    };
    
    await drawEmoji(ctx, "💞", canvas.width / 2 - 40, 10, 50);
    await drawEmoji(ctx, "💞", canvas.width / 2 + 10, 10, 50);

    ctx.fillStyle = "#000";
    ctx.font = "bold 32px Sans";
    ctx.textAlign = "center";
    ctx.fillText("Pair Result", canvas.width / 2, 80);

    await drawEmoji(ctx, "❤️", canvas.width / 2 - 40, 200, 80);

    ctx.fillStyle = "#000";
    ctx.font = "22px Sans";
    ctx.fillText(name1, 190, 340);
    ctx.fillText(name2, 490, 340);

    ctx.fillStyle = "#880e4f";
    ctx.font = "bold 30px Sans";
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

    let quoteX = 50;
    const quoteY = 120;
    for (const char of randomQuote) {
      if (/\p{Emoji}/u.test(char)) {
        await drawEmoji(ctx, char, quoteX, quoteY - 20, 24);
        quoteX += 30;
      } else {
        ctx.fillStyle = "#4a148c";
        ctx.font = "18px Sans";
        ctx.fillText(char, quoteX, quoteY);
        quoteX += ctx.measureText(char).width;
      }
    }

    const filePath = path.join(__dirname, "pair.png");
    const out = fs.createWriteStream(filePath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);

    out.on("finish", () => {
      api.sendMessage(
        {
          body: `💞 Pair Result: ${name1} ❤️ ${name2}`,
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        () => fs.unlinkSync(filePath),
        messageID
      );
    });

  } catch (err) {
    console.error("PAIR ERROR:", err);
    api.sendMessage("⚠️ Error pairing", event.threadID, event.messageID);
  }
};
