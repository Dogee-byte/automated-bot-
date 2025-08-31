const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "biliboard",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "?? / converted by ari",
  description: "put text on billboard",
  usages: "[text]",
  cooldowns: 5
};

async function wrapText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width < maxWidth) return [text];
  if (ctx.measureText("W").width > maxWidth) return null;
  const words = text.split(" ");
  const lines = [];
  let line = "";
  while (words.length > 0) {
    let split = false;
    while (ctx.measureText(words[0]).width >= maxWidth) {
      const temp = words[0];
      words[0] = temp.slice(0, -1);
      if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
      else {
        split = true;
        words.splice(1, 0, temp.slice(-1));
      }
    }
    if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) line += `${words.shift()} `;
    else {
      lines.push(line.trim());
      line = "";
    }
    if (words.length === 0) lines.push(line.trim());
  }
  return lines;
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  try {
    const text = args.join(" ");
    if (!text) return api.sendMessage("⚠️ Please enter text to put on the billboard.", threadID, messageID);

    api.sendMessage("⏳ Generating your billboard, please wait...", threadID, messageID);

    const imgURL = "https://i.imgur.com/aOZUbNm.jpg"; 
    const pathImg = __dirname + "/cache/biliboard.jpg";

    const getImage = (await axios.get(imgURL, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathImg, Buffer.from(getImage, "utf-8"));

    const baseImage = await loadImage(pathImg);
    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    let fontSize = 30; 
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";

    do {
      ctx.font = `bold ${fontSize}px Arial`;
      var lines = await wrapText(ctx, text, 480); 
      fontSize--;
    } while (ctx.measureText(text).width > 480);

    let lineHeight = fontSize + 5;
    let y = 100; 
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], 330, y);
      y += lineHeight;
    }

    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);

    return api.sendMessage(
      { body: "✅ Here’s your billboard:", attachment: fs.createReadStream(pathImg) },
      threadID,
      () => fs.unlinkSync(pathImg),
      messageID
    );
  } catch (e) {
    console.error(e);
    return api.sendMessage("❌ Error making billboard.", threadID, messageID);
  }
};
