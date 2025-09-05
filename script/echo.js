const axios = require("axios");

module.exports.config = {
  name: "echo",
  version: "1.0.0",
  role: 0,
  hasPrefix: false,
  description: "Ask Echo AI anything",
  usage: "echo [your question]",
  credits: "Ari (API by echoai-api.onrender.com)",
};

module.exports.run = async function ({ api, event, args }) {
  const question = args.join(" ").trim();
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!question) {
    return api.sendMessage("[❗] Please provide a question.", threadID, messageID);
  }

  const loadingFrames = [
    "⌛ Loading: ▰▱▱",
    "⌛ Loading: ▰▰▱",
    "⌛ Loading: ▰▰▰",
  ];

  api.sendMessage(loadingFrames[0], threadID, async (err, info) => {
    if (err) return;
    let frame = 1;

    const interval = setInterval(() => {
      if (frame < loadingFrames.length) {
        api.editMessage(loadingFrames[frame], info.messageID);
        frame++;
      } else {
        clearInterval(interval);
      }
    }, 500);

    try {
      const { data } = await axios.post("https://echoai-api.onrender.com/chat", {
        message: question,
      });

      clearInterval(interval);

      const reply = data.ai?.trim() || "⚠️ Echo AI did not return a response.";

      const finalMessage =
`✨ 𝗘𝗰𝗵𝗼 𝗔𝗜
━━━━━━━━━━━━━━━━━━
${reply}
━━━━━━━━━━━━━━━━━━
👑 Owner: Ari`;

      api.editMessage(finalMessage, info.messageID);

    } catch (error) {
      clearInterval(interval);
      console.error("Echo AI Command Error:", error.response?.data || error.message);
      api.editMessage(
        "❌ Error: " + (error.response?.data?.error || error.message),
        info.messageID
      );
    }
  });
};
