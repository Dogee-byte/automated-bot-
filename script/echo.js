const axios = require("axios");

module.exports.config = {
  name: "echo",
  version: "1.1.0",
  role: 0,
  hasPrefix: false,
  aliases: ["echoai"],
  description: "Talk with Echo AI",
  usage: "echo <your message>",
  credits: "Ari (api by ari)",
  cooldown: 3,
};

module.exports.run = async function({ api, event, args }) {
  const promptText = args.join(" ").trim();
  const senderID = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!promptText) {
    return api.sendMessage("❌ Please provide a question. Example: echo Hello!", threadID, messageID);
  }

  api.sendMessage("⏳ Processing your request with Echo AI...", threadID, async (err, info) => {
    if (err) return;

    try {
      const { data } = await axios.post("https://echoai-api.onrender.com/api/ask", {
        question: promptText
      });

      const responseText = data.answer || "⚠️ No response received from Echo AI.";

      api.getUserInfo(senderID, (err, infoUser) => {
        const userName = infoUser?.[senderID]?.name || "Unknown User";
        const timePH = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });

        const replyMessage = `
╭───────────⭓
│ 🤖 𝗘𝗖𝗛𝗢 𝗔𝗜 𝗥𝗘𝗦𝗣𝗢𝗡𝗦𝗘
│ 
│ ${responseText}
│ 
│ 👤 Asked by: ${userName}
│ ⏰ Time: ${timePH}
╰─────────────────⭓`;

        api.editMessage(replyMessage, info.messageID);
      });

    } catch (error) {
      console.error("Echo AI Error:", error);
      const errMsg = "❌ Error: " + (error.response?.data?.message || error.message || "Unknown error occurred.");
      api.editMessage(errMsg, info.messageID);
    }
  });
};
