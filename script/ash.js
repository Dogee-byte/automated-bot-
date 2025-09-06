const axios = require("axios");
const fs = require("fs");

let autoReplyEnabled = true; 
const memoryFile = __dirname + "/memory.json";
let memory = {};

if (fs.existsSync(memoryFile)) {
  try {
    memory = JSON.parse(fs.readFileSync(memoryFile, "utf8"));
    console.log("✅ Ashley memory loaded.");
  } catch (err) {
    console.error("❌ Failed to load memory.json:", err.message);
    memory = {};
  }
} else {
  fs.writeFileSync(memoryFile, JSON.stringify({}, null, 2));
  console.log("🆕 Created new memory.json");
}

function saveMemory() {
  fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2));
}

module.exports.config = {
  name: "ash",
  version: "3.0.0",
  credit: "Ari (api by ari",
  aliases: ["Ashley", "Ash", "Baby"],
  description: "Ashley auto-reply clingy gf 💕 with memory + on/off toggle",
  category: "fun",
  usePrefix: true
};

module.exports.run = async function ({ api, event, args }) {
  const cmd = args[0] ? args[0].toLowerCase() : "";

  if (cmd === "on") {
    autoReplyEnabled = true;
    return api.sendMessage("✅ Ashley auto-reply is now ON, baby 💕", event.threadID, event.messageID);
  }

  if (cmd === "off") {
    autoReplyEnabled = false;
    return api.sendMessage("❌ Ashley auto-reply is now OFF, babe 😢", event.threadID, event.messageID);
  }

  if (cmd === "status") {
    return api.sendMessage(
      `Ashley auto-reply is currently ${autoReplyEnabled ? "✅ ON" : "❌ OFF"}.`,
      event.threadID,
      event.messageID
    );
  }

  return api.sendMessage(
    "Usage:\n• ash on → enable auto-reply\n• ash off → disable auto-reply\n• ash status → check if ON/OFF",
    event.threadID,
    event.messageID
  );
};

module.exports.handleEvent = async function ({ api, event }) {
  if (!event.body) return;
  if (event.senderID == api.getCurrentUserID()) return; 

  if (!autoReplyEnabled) return; 

  const userId = event.senderID;
  if (!memory[userId]) memory[userId] = [];

  if (!event.isGroup || event.type === "message_reply" || event.body.toLowerCase().includes("ashley")) {
    try {
      memory[userId].push({ role: "user", content: event.body });
      if (memory[userId].length > 10) {
        memory[userId] = memory[userId].slice(-10);
      }

      const res = await axios.post("https://ashley-api.onrender.com/chat", {
        character: "Ashley",
        message: event.body,
        user: userId
      });

      let reply = res.data.reply || "Baby~ I’m here 😘";

      memory[userId].push({ role: "assistant", content: reply });
      if (memory[userId].length > 10) {
        memory[userId] = memory[userId].slice(-10);
      }

      saveMemory();

      api.sendMessage(reply, event.threadID, event.messageID);
    } catch (err) {
      console.error("Ashley API error:", err.message);
      api.sendMessage("Sorry baby 😢 Ashley can’t reply right now.", event.threadID, event.messageID);
    }
  }
};
