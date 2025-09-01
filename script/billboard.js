const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "billboard",
  aliases: ["billoard"],
  version: "1.0.1",
  author: "Clarence DK | Converted by ari",
  countDown: 5,
  role: 0
};

module.exports.wrapText = (ctx, text, maxWidth) => {
  return new Promise(resolve => {
    if (ctx.measureText(text).width < maxWidth) return resolve([text]);
    if (ctx.measureText('W').width > maxWidth) return resolve(null);
    const words = text.split(' ');
    const lines = [];
    let line = '';
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
        line = '';
      }
      if (words.length === 0) lines.push(line.trim());
    }
    return resolve(lines);
  });
};

module.exports.run = async function ({ message, args, event, usersData }) {
  const avatarPath = __dirname + "/cache/avt.png";
  const outputPath = __dirname + "/cache/wew.png";
  const text = args.join(" ");

  if (!text) return message.reply("Please put a message");

  const name = await usersData.getName(event.senderID);
  const linkAvatar = await usersData.getAvatarUrl(event.senderID);

  const avatarBuffer = (await axios.get(linkAvatar, { responseType: "arraybuffer" })).data;
  const baseBuffer = (await axios.get("https://imgur.com/uN7Sllp.png", { responseType: "arraybuffer" })).data;

  fs.writeFileSync(avatarPath, Buffer.from(avatarBuffer, "utf-8"));
  fs.writeFileSync(outputPath, Buffer.from(baseBuffer, "utf-8"));

  const image = await loadImage(avatarPath);
  const baseImage = await loadImage(outputPath);
  const canvas = createCanvas(baseImage.width, baseImage.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(baseImage, 10, 10, canvas.width, canvas.height);
  ctx.drawImage(image, 148, 75, 110, 110);

  ctx.font = "800 23px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "start";
  ctx.fillText(name, 280, 110);

  ctx.font = "400 23px Arial";
  ctx.fillStyle = "#000000";
  ctx.textAlign = "start";

  let fontSize = 55;
  while (ctx.measureText(text).width > 600) {
    fontSize--;
    ctx.font = `400 ${fontSize}px Arial, sans-serif`;
  }

  const lines = await this.wrapText(ctx, text, 250);
  ctx.fillText(lines.join("\n"), 280, 145);

  const imageBuffer = canvas.toBuffer();
  fs.writeFileSync(outputPath, imageBuffer);
  fs.removeSync(avatarPath);

  return message.reply({
    attachment: fs.createReadStream(outputPath)
  }, () => fs.unlinkSync(outputPath));
};
