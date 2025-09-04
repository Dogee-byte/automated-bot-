const axios = require("axios");

let userMemory = {};

module.exports.config = {
  name: "echo",
  version: "3.1",
  author: "ari (api by ari)",
  countDown: 5,
  role: 0,
  shortDescription: "Talk with Echo AI",
  longDescription: "Chat with Echo AI",
  category: "AI"
};

module.exports.run = async function ({ api, args, event }) {
  const userId = event.senderID;

  if (!args[0]) return message.reply("❌ Please type something for Echo AI.");

  if (args[0].toLowerCase() === "reset") {
    userMemory[userId] = [];
    return message.reply("🧹 Memory reset! Let's start fresh.");
  }

  if (!userMemory[userId]) userMemory[userId] = [];

  try {
    const userInput = args.join(" ");

    userMemory[userId].push({ role: "user", content: userInput });

    let reply;

    try {
      const res = await axios.post("https://echoai-api.onrender.com/api/ask", {
        question: userInput,
        history: userMemory[userId]
      });
      reply = res.data.answer;
    } catch (e) {
      const res = await axios.post("https://echoai-api.onrender.com", {
        question: userInput,
        history: userMemory[userId]
      });
      reply = res.data.answer;
    }

    if (!reply) reply = "⚠️ Echo AI didn’t reply.";

    userMemory[userId].push({ role: "assistant", content: reply });

    message.reply(reply);

  } catch (err) {
    console.error("❌ API Error:", err.response?.data || err.message);
    message.reply("❌ Error: Cannot connect to Echo AI API.");
  }
};
