const axios = require("axios");

module.exports.config = {
  name: "echo",
  version: "1.2.0",
  role: 0,
  hasPrefix: false,
  description: "Ask Echo AI anything",
  usage: "echo [your question]",
  credits: "Ari (API by Ari)",
};

module.exports.run = async function ({ api, event, args }) {
  const question = args.join(" ").trim();
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!question) {
    return api.sendMessage("❌ 𝘗𝘭𝘦𝘢𝘴𝘦 𝘱𝘳𝘰𝘷𝘪𝘥𝘦 𝘢 𝘲𝘶𝘦𝘴𝘵𝘪𝘰𝘯.", threadID, messageID);
  }

  api.sendMessage("⌛ Echo AI is thinking...\n■□□□□", threadID, async (err, info) => {
    if (err) return;

    try {
      const bars = ["■■□□□", "■■■□□", "■■■■□", "■■■■■"];
      for (let i = 0; i < bars.length; i++) {
        await new Promise(r => setTimeout(r, 600));
        api.editMessage(`⌛ Echo AI is thinking...\n${bars[i]}`, info.messageID);
      }

      const { data } = await axios.post("https://echoai-api.onrender.com/chat", {
        message: question,
      });

      const reply = data.ai?.trim() || "⚠️ Echo AI did not return a response.";

      const finalMessage =
`✨ 𝐄𝐜𝐡𝐨 𝐀𝐈
━━━━━━━━━━━━━━━━━━
${reply}
━━━━━━━━━━━━━━━━━━
👑 𝐎𝐰𝐧𝐞𝐫: 𝗔𝗿𝗶`;

      api.editMessage(finalMessage, info.messageID);
    } catch (error) {
      console.error("Echo AI Command Error:", error);
      api.editMessage(
        "❌ Error: " + (error.response?.data?.error || error.message),
        info.messageID
      );
    }
  });
};
