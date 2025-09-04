const axios = require("axios");

module.exports.config = {
  name: "echo",
  version: "1.0.0",
  role: 0,
  hasPrefix: false,
  description: "Ask Echo AI a question",
  usage: "echo [your question]",
  credits: "Ari (api by ari)",
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const question = args.join(" ").trim();
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!question) {
    return api.sendMessage("❌ Please provide a valid question.", threadID, messageID);
  }

  api.sendMessage("🤖 Echo AI is thinking...", threadID, async () => {
    try {
      const { data } = await axios.post("https://echoai-api.onrender.com/echo", {
        question: question,
      });

      const replyMessage = `✨ 𝗘𝗰𝗵𝗼 𝗔𝗜\n━━━━━━━━━━━━━━━━━━\n📝${data.reply || "No response"}\n━━━━━━━━━━━━━━━━━━\n`;

      api.sendMessage(replyMessage, threadID, messageID);
    } catch (error) {
      console.error("❌ Echo AI Error:", error.message);
      api.sendMessage("❌ Error: " + (error.response?.data?.message || error.message), threadID, messageID);
    }
  });
};
