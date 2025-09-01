const axios = require("axios");

function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return { hours, minutes, secs };
}

module.exports.config = {
  name: "uptime",
  version: "1.0.0",
  author: "Ari",
  countDown: 5,
  role: 0,
  shortDescription: "Check bot uptime",
  longDescription: "Shows how long the bot has been online and fetches uptime API data.",
  category: "system",
  guide: {
    en: "{pn}"
  }
};

module.exports.run = async function ({ api, event }) {
  try {
    const uptimeSeconds = process.uptime();
    const { hours, minutes, secs } = formatUptime(uptimeSeconds);

    const url = "https://kaiz-apis.gleeze.com/api/uptime";
    const params = {
      instag: "your_instagram_here",
      ghub: "ari000",
      fb: "Ari",
      hours,
      minutes,
      seconds: secs,
      botname: "Echo_AI",
      apikey: "8721466d-c231-4641-a691-50ede6fdce52"
    };

    const response = await axios.get(url, { params });
    const data = response.data;

    const replyText =
      `🤖 Bot Uptime (${params.botname}):\n` +
      `⏳ ${hours}h ${minutes}m ${secs}s\n` +
      `🔗 GitHub: ${params.ghub}\n` +
      `📘 FB: ${params.fb}\n` +
      `📸 IG: ${params.instag}\n\n` +
      `API Response: ${JSON.stringify(data)}`;

    api.sendMessage(replyText, event.threadID, event.messageID);
  } catch (err) {
    console.error("Error fetching uptime:", err.message);
    api.sendMessage("❌ Failed to fetch uptime data.", event.threadID, event.messageID);
  }
};
