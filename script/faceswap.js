const axios = require('axios');
const fs = require('fs-extra');

module.exports.config = {
  name: "faceswap",
  version: "1.0.0",
  role: 0,
  credits: "Vern",
  description: "Swap faces of two replied images",
  aliases: [],
  usages: "< reply two images >",
  cooldown: 2,
};

module.exports.run = async ({ api, event }) => {
  let pathie = __dirname + `/cache/faceswapped-image.jpg`;
  const { threadID, messageID } = event;

  if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length < 2) {
    return api.sendMessage("❌ Please reply to two images to use the face swap feature.", threadID, messageID);
  }

  const image1 = event.messageReply.attachments[0];
  const image2 = event.messageReply.attachments[1];

  const isGif = (att) => att.type === "photo" && att.mimeType && att.mimeType.includes("gif");

  if (isGif(image1) || isGif(image2)) {
    return api.sendMessage("❌ GIF images are not supported. Please reply using two normal images.", threadID, messageID);
  }

  const url1 = image1.url;
  const url2 = image2.url;

  try {
    api.sendMessage("⌛ Swapping faces, please wait...", threadID, messageID);

    const faceswapUrl = `https://kaiz-apis.gleeze.com/api/faceswap-v2?targetUrl=${encodeURIComponent(targetUrl)}&sourceUrl=${encodeURIComponent(sourceUrl)}&apikey=e8529ee4-e32f-4e01-b194-f207bec86068`;

    const imgBuffer = (await axios.get(faceswapUrl, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathie, Buffer.from(imgBuffer));

    api.sendMessage({
      body: "🪄 | Face swap completed successfully",
      attachment: fs.createReadStream(pathie)
    }, threadID, () => fs.unlinkSync(pathie), messageID);

  } catch (error) {
    api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
  }
};
