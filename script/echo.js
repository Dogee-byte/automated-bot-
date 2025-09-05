const axios = require("axios");

module.exports.config = {
  name: "echo",
  version: "1.4.0",
  role: 0,
  hasPrefix: false,
  description: "Ask Echo AI anything",
  usage: "echo [your question]",
  credits: "Ari (api by Ari)",
};

module.exports.run = async function ({ api, event, args }) {
  const question = args.join(" ").trim();
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!question) {
    return api.sendMessage("❌ 𝘗𝘭𝘦𝘢𝘴𝘦 𝘱𝘳𝘰𝘷𝘪𝘥𝘦 𝘢 𝘲𝘶𝘦𝘴𝘵𝘪𝘰𝘯.", threadID, messageID);
  }

  try {
    api.sendMessage("⏳ 𝐄𝐜𝐡𝐨 𝐀𝐈 𝐢𝐬 𝐭𝐡𝐢𝐧𝐤𝐢𝐧𝐠...\n▒▒▒▒▒▒▒▒▒▒", threadID, async (err, info) => {
      if (err) return;

      let loadingStages = [
        "██▒▒▒▒▒▒▒▒▒",
        "████▒▒▒▒▒▒▒",
        "██████▒▒▒▒▒",
        "████████▒▒▒",
        "██████████▒",
        "███████████"
      ];

      for (let i = 0; i < loadingStages.length; i++) {
        await new Promise(res => setTimeout(res, 500));
        api.editMessage(`⏳ 𝐄𝐜𝐡𝐨 𝐀𝐈 𝐢𝐬 𝐭𝐡𝐢𝐧𝐤𝐢𝐧𝐠...\n${loadingStages[i]}`, info.messageID);
      }

      const { data } = await axios.post("https://echoai-api.onrender.com/chat", {
        message: question,
      });

      const reply = data.ai?.trim() || "⚠️ 𝐄𝐜𝐡𝐨 𝐀𝐈 𝐝𝐢𝐝 𝐧𝐨𝐭 𝐫𝐞𝐭𝐮𝐫𝐧 𝐚 𝐫𝐞𝐬𝐩𝐨𝐧𝐬𝐞.";

      api.getUserInfo(event.senderID, (err, infoUser) => {
        const userName = infoUser?.[event.senderID]?.name || "Unknown User";
        const timePH = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });

        const finalMessage = 
`✨ 𝐄𝐜𝐡𝐨 𝐀𝐈  
━━━━━━━━━━━━━━━━━━  
${reply}  
━━━━━━━━━━━━━━━━━━  
👑 𝐎𝐰𝐧𝐞𝐫: 𝗔𝗿𝗶  
🗣 𝐀𝐬𝐤𝐞𝐝 𝐛𝐲: ${userName}  
⏰ 𝐓𝐢𝐦𝐞: ${timePH}`;

        api.editMessage(finalMessage, info.messageID);
      });
    });
  } catch (error) {
    console.error("Echo AI Command Error:", error);
    api.sendMessage(
      "❌ 𝐄𝐫𝐫𝐨𝐫: " + (error.response?.data?.error || error.message),
      threadID,
      messageID
    );
  }
};
