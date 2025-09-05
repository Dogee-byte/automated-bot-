const axios = require("axios");

module.exports.config = {
  name: "ash",
  version: "2.0.0",
  aliases: ["Ash", "Ashley", "baby"],
  credit: "Ari (API by Ari)",
  description: "Talk with Ashley (clingy gf 🥰💓)",
  category: "fun"
};

module.exports.run = async function ({ api, event, args }) {
  if (args.length === 0) {
    return api.sendMessage("Baby~ what do you want to tell me? 💕", event.threadID, event.messageID);
  }

  const userMessage = args.join(" ");

  try {
    const res = await axios.post("https://ashley-api.onrender.com/chat", {
      character: "Ashley",     
      message: userMessage,
      user: event.senderID     
    });

    let reply = res.data.reply || "Mmm, I didn’t catch that babe~ 😘";
    return api.sendMessage(reply, event.threadID, event.messageID);
  } catch (err) {
    console.error("Ashley API error:", err.message);
    return api.sendMessage("Sorry baby 😢 Ashley can’t reply right now.", event.threadID, event.messageID);
  }
};
