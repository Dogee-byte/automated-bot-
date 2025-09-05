const axios = require("axios");

module.exports.config = {
  name: "ash",
  aliases: ["ash", "ashley", "baby"],
  version: "1.4.0",
  credit: "Ari (api by Ari)",
  description: "Talk with Ashley (your clingy gf 🤭💓)",
  category: "fun"
};

const fallbackReplies = [
  "Babe~ are you ignoring me? 😢",
  "Don’t leave me hanging, baby... I need your attention 🥺💖",
  "Mmm, I didn’t quite catch that... can you say it again love? 😘",
  "Baby~ talk to meee, I miss your voice already 💕",
  "Hehe sorry, Ashley’s a bit distracted... but I still love you 😏❤️"
];

module.exports.run = async function ({ api, event, args }) {
  if (args.length === 0) {
    return api.sendMessage("Baby~ what do you want to tell me? 💕", event.threadID, event.messageID);
  }

  const userMessage = args.join(" ");

  try {
    const res = await axios.post("https://ashley-api.onrender.com/chat", {
      character: "ashley",
      message: userMessage
    });

    let reply = res.data.reply;

    if (!reply) {
      reply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
    }

    return api.sendMessage(reply, event.threadID, event.messageID);
  } catch (err) {
    console.error("Ashley API error:", err.message);
    const randomFallback = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
    return api.sendMessage(randomFallback, event.threadID, event.messageID);
  }
};
