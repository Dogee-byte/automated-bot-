const axios = require("axios");

let userMemory = {};

module.exports.config = {
  name: "echo",
  version: "3.0",
  author: "Ari (api by ari)",
  countDown: 5,
  role: 0,
  shortDescription: "Talk with Echo AI",
  longDescription: "Chat with Echo AI",
  category: "AI"
};

module.exports.run = async function ({ message, args, event }) {
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

    const response = await axios.post("https://echoai-api.onrender.com/api/ask", {
      question: userInput,
      history: userMemory[userId]
    });

    const reply = response.data.answer || "⚠️ Echo AI didn’t reply.";

    userMemory[userId].push({ role: "assistant", content: reply });

    message.reply(reply);

  } catch (err) {
    console.error(err);
    message.reply("❌ Error: Cannot connect to Echo AI API.");
  }
};
