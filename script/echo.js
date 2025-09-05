const axios = require("axios");

module.exports.config = {
  name: "echo",
  version: "1.1.0",
  role: 0,
  hasPrefix: false,
  description: "Ask Echo AI anything",
  usage: "echo [your question]",
  credits: "Ari (api by ari)",
};

module.exports.run = async function ({ api, event, args }) {
  const question = args.join(" ").trim();
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!question) {
    return api.sendMessage("❌ Please provide a question.", threadID, messageID);
  }

  try {
    const { data } = await axios.post("https://echoai-api.onrender.com/chat", {
      message: question,
    });

    const reply = data.ai?.trim() || "⚠️ Echo AI did not return a response.";

    const finalMessage =
`✨ 𝗘𝗰𝗵𝗼 𝗔𝗜
━━━━━━━━━━━━━━━━━━
${reply}
━━━━━━━━━━━━━━━━━━`;

    api.sendMessage(finalMessage, threadID, messageID);
  } catch (error) {
    console.error("Echo AI Command Error:", error);
    api.sendMessage(
      "❌ Error: " + (error.response?.data?.error || error.message),
      threadID,
      messageID
    );
  }
};
