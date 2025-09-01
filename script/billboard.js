const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "billboard",
  version: "1.0.2",
  role: 0,
  author: "Clarence DK | convert by ari",
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
    const isNew = !!ctx.message;
    const message = isNew ? ctx.message : null;
    const api = isNew ? ctx.api : ctx.api;
    const event = isNew ? ctx.event : ctx.event;
    const args = isNew ? ctx.args : ctx.args;
    const usersData = ctx.usersData || ctx.Users;

    console.log("🚀 Billboard command triggered");

    const avatarPath = __dirname + "/cache/avt.jpg";
    const outputPath = __dirname + "/cache/wew.jpg";
    if (!fs.existsSync(__dirname + "/cache")) fs.mkdirSync(__dirname + "/cache");

    const text = args.join(" ");
    if (!text) {
      const reply = "⚠️ Please put a message.";
      return isNew ? message.reply(reply) : api.sendMessage(reply, event.threadID, event.messageID);
    }

    // 🔹 Get user name
    let name, linkAvatar;
    if (usersData.getName) {
      name = await usersData.getName(event.senderID);
      linkAvatar = await usersData.getAvatarUrl(event.senderID);
    } else {
      name = await usersData.getNameUser(event.senderID);
      linkAvatar = (await api.getUserInfo(event.senderID))[event.senderID].thumbSrc;
    }

    console.log("👤 User:", name);
    console.log("🖼️ Avatar URL:", linkAvatar);

    // 🔹 Download avatar
    console.log("👉 Downloading avatar...");
    const avatarBuffer = (await axios.get(linkAvatar, { responseType: "arraybuffer" })).data;
    console.log("✅ Avatar size:", avatarBuffer.length);
    fs.writeFileSync(avatarPath, Buffer.from(avatarBuffer, "utf-8"));

    // 🔹 Download base image
    const baseUrl = "https://i.imgur.com/uN7Sllp.jpg"; // jpg version
    console.log("👉 Downloading base image:", baseUrl);
    const baseBuffer = (await axios.get(baseUrl, { responseType: "arraybuffer" })).data;
    console.log("✅ Base image size:", baseBuffer.length);
    fs.writeFileSync(outputPath, Buffer.from(baseBuffer, "utf-8"));

    // 🔹 Load images
    console.log("👉 Loading images into canvas...");
    const image = await loadImage(avatarPath);
    const baseImage = await loadImage(outputPath);

    // 🔹 Create canvas
    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx2d = canvas.getContext("2d");
    ctx2d.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    ctx2d.drawImage(image, 148, 75, 110, 110);

    // 🔹 Texts
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

    // 🔹 Save result
    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(outputPath, imageBuffer);
    fs.removeSync(avatarPath);

    console.log("🎉 Billboard generated successfully!");
    return isNew
      ? message.reply({ attachment: fs.createReadStream(outputPath) }, () => fs.unlinkSync(outputPath))
      : api.sendMessage({ attachment: fs.createReadStream(outputPath) }, event.threadID, () => fs.unlinkSync(outputPath), event.messageID);

  } catch (err) {
    console.error("❌ Billboard error:", err);
    if (ctx.message) return ctx.message.reply("❌ Error while generating billboard. Check console logs.");
    else return ctx.api.sendMessage("❌ Error while generating billboard. Check console logs.", ctx.event.threadID, ctx.event.messageID);
  }
};
