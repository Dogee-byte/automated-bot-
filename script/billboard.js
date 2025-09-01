const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "billboard",
  version: "1.0.1",
  role: 0,
  author: "Clarence DK | Converted by Ari",
  countDown: 5,
  shortDescription: "Edit billboard with your text",
  longDescription: "Put your avatar and text onto a billboard template",
  category: "image",
  guide: "{pn} [text]"
};

module.exports.wrapText = (ctx, text, maxWidth) => {
  return new Promise(resolve => {
    if (ctx.measureText(text).width < maxWidth) return resolve([text]);
    if (ctx.measureText("W").width > maxWidth) return resolve(null);
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
      if (ctx.measureText(`${line}${words[0]}`).width < maxWidth)
        line += `${words.shift()} `;
      else {
        lines.push(line.trim());
        line = "";
      }
      if (words.length === 0) lines.push(line.trim());
    }
    return resolve(lines);
  });
};

module.exports.run = async function (ctx) {
  try {
    if (ctx.message) {
      const { message, args, event, usersData } = ctx;

      const avatarPath = __dirname + "/cache/avt.png";
      const outputPath = __dirname + "/cache/wew.png";
      if (!fs.existsSync(__dirname + "/cache")) fs.mkdirSync(__dirname + "/cache");

      const text = args.join(" ");
      if (!text) return message.reply("Please put a message");

      const name = await usersData.getName(event.senderID);
      const linkAvatar = await usersData.getAvatarUrl(event.senderID);

      const avatarBuffer = (await axios.get(linkAvatar, { responseType: "arraybuffer" })).data;
      const baseBuffer = (await axios.get("https://i.imgur.com/uN7Sllp.jpg", { responseType: "arraybuffer" })).data;

      fs.writeFileSync(avatarPath, Buffer.from(avatarBuffer, "utf-8"));
      fs.writeFileSync(outputPath, Buffer.from(baseBuffer, "utf-8"));

      const image = await loadImage(avatarPath);
      const baseImage = await loadImage(outputPath);
      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx2d = canvas.getContext("2d");

      ctx2d.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      ctx2d.drawImage(image, 148, 75, 110, 110);

      ctx2d.font = "800 23px Arial";
      ctx2d.fillStyle = "#ffffff";
      ctx2d.textAlign = "start";
      ctx2d.fillText(name, 280, 110);

      ctx2d.font = "400 23px Arial";
      ctx2d.fillStyle = "#000000";
      ctx2d.textAlign = "start";

      let fontSize = 55;
      while (ctx2d.measureText(text).width > 600) {
        fontSize--;
        ctx2d.font = `400 ${fontSize}px Arial, sans-serif`;
      }

      const lines = await this.wrapText(ctx2d, text, 250);
      ctx2d.fillText(lines.join("\n"), 280, 145);

      const imageBuffer = canvas.toBuffer();
      fs.writeFileSync(outputPath, imageBuffer);
      fs.removeSync(avatarPath);

      return message.reply({ attachment: fs.createReadStream(outputPath) }, () => fs.unlinkSync(outputPath));
    }

    else {
      const { api, event, args, Users } = ctx;

      const avatarPath = __dirname + "/cache/avt.png";
      const outputPath = __dirname + "/cache/wew.png";
      if (!fs.existsSync(__dirname + "/cache")) fs.mkdirSync(__dirname + "/cache");

      const text = args.join(" ");
      if (!text) return api.sendMessage("Please put a message", event.threadID, event.messageID);

      const name = await Users.getNameUser(event.senderID);
      const linkAvatar = (await api.getUserInfo(event.senderID))[event.senderID].thumbSrc;

      const avatarBuffer = (await axios.get(linkAvatar, { responseType: "arraybuffer" })).data;
      const baseBuffer = (await axios.get("https://i.imgur.com/uN7Sllp.jpg", { responseType: "arraybuffer" })).data;

      fs.writeFileSync(avatarPath, Buffer.from(avatarBuffer, "utf-8"));
      fs.writeFileSync(outputPath, Buffer.from(baseBuffer, "utf-8"));

      const image = await loadImage(avatarPath);
      const baseImage = await loadImage(outputPath);
      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx2d = canvas.getContext("2d");

      ctx2d.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      ctx2d.drawImage(image, 148, 75, 110, 110);

      ctx2d.font = "800 23px Arial";
      ctx2d.fillStyle = "#ffffff";
      ctx2d.textAlign = "start";
      ctx2d.fillText(name, 280, 110);

      ctx2d.font = "400 23px Arial";
      ctx2d.fillStyle = "#000000";
      ctx2d.textAlign = "start";

      let fontSize = 55;
      while (ctx2d.measureText(text).width > 600) {
        fontSize--;
        ctx2d.font = `400 ${fontSize}px Arial, sans-serif`;
      }

      const lines = await this.wrapText(ctx2d, text, 250);
      ctx2d.fillText(lines.join("\n"), 280, 145);

      const imageBuffer = canvas.toBuffer();
      fs.writeFileSync(outputPath, imageBuffer);
      fs.removeSync(avatarPath);

      return api.sendMessage(
        { attachment: fs.createReadStream(outputPath) },
        event.threadID,
        () => fs.unlinkSync(outputPath),
        event.messageID
      );
    }
  } catch (err) {
    console.error(err);
    if (ctx.message) return ctx.message.reply("❌ Error while generating billboard.");
    else return ctx.api.sendMessage("❌ Error while generating billboard.", ctx.event.threadID, ctx.event.messageID);
  }
};
