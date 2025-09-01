const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "uptime",
  version: "1.1.0",
  role: 0,
  cooldown: 5,
  aliases: ["ut", "up"],
  description: "Shows how long the bot has been online.",
  usage: "[uptime]",
  credits: "ari"
};

module.exports.run = async ({ api, event }) => {
  try {
    const uptimeMs = Date.now() - global.startTime;
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((uptimeMs % (1000 * 60)) / 1000);

    const startDate = new Date(global.startTime);
    const options = { 
      year: "numeric", month: "long", day: "numeric", 
      hour: "2-digit", minute: "2-digit", second: "2-digit" 
    };
    const formattedStart = startDate.toLocaleString("en-US", options);

    const botname = "Echo_AI";
    const instag = "..."; 
    const ghub = "ari000";
    const fb = "Ari";
    const apikey = "8721466d-c231-4641-a691-50ede6fdce52";

    const url = `https://kaiz-apis.gleeze.com/api/uptime?instag=${encodeURIComponent(instag)}&ghub=${encodeURIComponent(ghub)}&fb=${encodeURIComponent(fb)}&hours=${hours}&minutes=${minutes}&seconds=${seconds}&botname=${encodeURIComponent(botname)}&apikey=${apikey}`;

    const imgPath = path.join(__dirname, "cache", `uptime_${event.senderID}.png`);
    const res = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(imgPath, Buffer.from(res.data, "binary"));

    api.sendMessage(
      {
        body: `⏱ Bot Uptime: ${hours}h ${minutes}m ${seconds}s\n📅 Online Since: ${formattedStart}`,
        attachment: fs.createReadStream(imgPath)
      },
      event.threadID,
      () => fs.unlinkSync(imgPath),
      event.messageID
    );
  } catch (err) {
    console.error(err);
    api.sendMessage("❌ Failed to fetch uptime canvas.", event.threadID, event.messageID);
  }
};
