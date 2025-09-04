const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
    name: "faceswap",
    version: "1.1.0",
    credits: "Ari",
    description: "Swap faces between two images",
    usages: "faceswap",
    commandCategory: "fun",
    cooldowns: 5
};

module.exports.run = async function({ api, event }) {
    try {
        if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length < 2) {
            return api.sendMessage("❌ Please reply with 2 images (source face + target image).", event.threadID, event.messageID);
        }

        const [source, target] = event.messageReply.attachments;

        if (!source.url || !target.url) {
            return api.sendMessage("❌ Invalid attachments. Please make sure you reply with 2 images.", event.threadID, event.messageID);
        }

        const apikey = "8721466d-c231-4641-a691-50ede6fdce52";
        const apiUrl = `https://kaiz-apis.gleeze.com/api/faceswap-v2?sourceUrl=${encodeURIComponent(source.url)}&targetUrl=${encodeURIComponent(target.url)}&apikey=${apikey}`;

        const outputPath = path.join(__dirname, "cache", `faceswap_${Date.now()}.png`);
        const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(outputPath, Buffer.from(response.data, "binary"));

        return api.sendMessage(
            { body: "✅ Face swapped successfully!", attachment: fs.createReadStream(outputPath) },
            event.threadID,
            () => fs.unlinkSync(outputPath),
            event.messageID
        );

    } catch (err) {
        console.error(err);
        return api.sendMessage("❌ Failed to swap faces. Try again later or check if the API is working.", event.threadID, event.messageID);
    }
};
