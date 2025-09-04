const axios = require("axios");

module.exports.config = {
  name: "echo",
  version: "1.0.1",
  role: 0,
  hasPrefix: false,
  aliases: [],
  description: "Ask Echo AI API",
  usage: "echo [your question]",
  credits: "Ari"
};

module.exports.run = async function({ api, event, args }) {
  const question = args.join(" ").trim();
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!question) {
    return api.sendMessage(
      "⚠️ Please provide a question.\n\n💡 Example: echo What is AI?",
      threadID,
      messageID
    );
  }

  try {
    const { data } = await axios.post("https://echo-ai.onrender.com/echo", {
      question
    }, {
      headers: { "Content-Type": "application/json" }
    });

    const reply = 
`┏━━━━━━━━━━━━━━━┓
   🤖 𝐄𝐂𝐇𝐎 𝐀𝐈  
┗━━━━━━━━━━━━━━━┛
📥 𝗤𝘂𝗲𝘀𝘁𝗶𝗼𝗻: ${question}
📤 𝗔𝗻𝘀𝘄𝗲𝗿: ${data.answer}
━━━━━━━━━━━━━━━━━━`;

    api.sendMessage(reply, threadID, messageID);
  } catch (err) {
    console.error("Echo Command Error:", err.message);
    api.sendMessage("❌ Error: Unable to connect to Echo API.", threadID, messageID);
  }
};
