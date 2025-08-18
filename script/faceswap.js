pastebin const axios = require("axios");

module.exports.config = {
  name: "faceswap",
  version: "1.0.0",
  credits: "rapido // kaiz API",
  description: "Swap faces between two replied photos",
  usePrefix: true,
  commandCategory: "image"
};

module.exports.run = async function ({ api, event }) {
  try {
    let targetUrl, sourceUrl;

    if (event.messageReply?.attachments?.length >= 2) {
      if (event.messageReply.attachments[0]?.type === "photo") {
        targetUrl = event.messageReply.attachments[0].url;
      }
      if (event.messageReply.attachments[1]?.type === "photo") {
        sourceUrl = event.messageReply.attachments[1].url;
      }
    }

    if (!targetUrl || !sourceUrl) {
      return api.sendMessage("❌ Please reply with two photos.", event.threadID, event.messageID);
    }

    const apiUrl = `https://kaiz-apis.gleeze.com/api/faceswap-v2?targetUrl=${encodeURIComponent(targetUrl)}&sourceUrl=${encodeURIComponent(sourceUrl)}&apikey=e8529ee4-e32f-4e01-b194-f207bec86068`;

    const response = await axios.get(apiUrl, { responseType: "stream" });

    return api.sendMessage(
      {
        body: "✅ Here’s the faceswapped photo:",
        attachment: response.data
      },
      event.threadID,
      event.messageID
    );

  } catch (error) {
    return api.sendMessage("⚠️ Failed to process the photos.", event.threadID, event.messageID);
  }
};
