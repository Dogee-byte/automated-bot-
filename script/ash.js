const axios = require("axios");

module.exports.config = {
  name: "ash",
  version: "1.3.0",
  credit: "Ari (api by ari",
  Description: "Talk with Ashley (your new gf 🤭💓)",
  category: "fun"
};

function toSerifFont(text) {
  const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const serif   = "𝖺𝖻𝖼𝖽𝖾𝖿𝗀𝗁𝗂𝗃𝗄𝗅𝗆𝗇𝗈𝗉𝗊𝗋𝗌𝗍𝗎𝗏𝗐𝗑𝗒𝗓" + 
                  "𝖠𝖡𝖢𝖣𝖤𝖥𝖦𝖧𝖨𝖩𝖪𝖫𝖬𝖭𝖮𝖯𝖰𝖱𝖲𝖳𝖴𝖵𝖶𝖷𝖸𝖹";
  return text.split("").map(ch => {
    const idx = normal.indexOf(ch);
    return idx !== -1 ? serif[idx] : ch;
  }).join("");
}

module.exports.run = async function ({ api, event, args }) {
  if (args.length === 0) {
    return api.sendMessage(toSerifFont("Baby~ what do you want to tell me? 💕"), event.threadID, event.messageID);
  }

  const userMessage = args.join(" ");

  try {
    const res = await axios.post("https://ashley-api.onrender.com/chat", {
      character: "ashley",
      message: userMessage
    });

    let reply = res.data.reply || "Mmm, I didn’t catch that babe~ 😘";
    reply = toSerifFont(reply);

    return api.sendMessage(reply, event.threadID, event.messageID);
  } catch (err) {
    console.error("Ashley API error:", err.message);
    return api.sendMessage(toSerifFont("Sorry baby 😢 Ashley can’t reply right now."), event.threadID, event.messageID);
  }
};
