const axios = require("axios");

module.exports.config = {
  name: "echo",
  version: "1.2.0",
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
    return api.sendMessage("[❕] Please provide a question.", threadID, messageID);
  }

  let progress = 0;
  const loadingMsg = await api.sendMessage("⏳ Echo AI is thinking...", threadID);

  const interval = setInterval(async () => {
    progress = (progress + 5) % 105; 
    const barLength = 20;
    const filled = Math.floor((progress / 100) * barLength);
    const empty = barLength - filled;
    const loadingBar = "█".repeat(filled) + "░".repeat(empty);

    await api.editMessage(
      `⏳ Echo AI is thinking...\n\n[${loadingBar}] ${progress}%`,
      loadingMsg.messageID,
      threadID
    );
  }, 500);

  try {
    const { data } = await axios.post("https://echoai-api.onrender.com/chat", {
      message: question,
    });

    clearInterval(interval);

    const reply = data.ai?.trim() || "⚠️ Echo AI did not return a response.";

    const styles = [
      `🌌 Ｅｃｈｏ ＡＩ\n━━━━━━━━━━━━━━\n${reply}\n━━━━━━━━━━━━━━`,
      `⚡ 𝑬𝒄𝒉𝒐 𝑨𝑰 ⚡\n➖➖➖➖➖➖\n${reply}\n➖➖➖➖➖➖`,
      `🔥 ＥＣＨＯ ＡＩ 🔥\n▬▬▬▬▬▬▬▬▬▬▬▬▬\n${reply}\n▬▬▬▬▬▬▬▬▬▬▬▬▬`,
      `✨ 𝙀𝘾𝙃𝙊 𝘼𝙄 ✨\n━━━━━━━━━━━━━━━\n${reply}\n━━━━━━━━━━━━━━━`,
      `💎 ᴇᴄʜᴏ ᴀɪ 💎\n─────────────\n${reply}\n─────────────`
    ];

    const finalMessage = styles[Math.floor(Math.random() * styles.length)];

    await api.editMessage(finalMessage, loadingMsg.messageID, threadID);
  } catch (error) {
    clearInterval(interval);
    console.error("Echo AI Command Error:", error);
    api.editMessage(
      "❌ Error: " + (error.response?.data?.error || error.message),
      loadingMsg.messageID,
      threadID
    );
  }
};
