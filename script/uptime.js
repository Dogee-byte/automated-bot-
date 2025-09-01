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
  role: 1, 
  shortDescription: "Check bot uptime",
  longDescription: "Shows how long the bot has been online and fetches uptime data.",
  category: "system",
};

module.exports.run = async function ({ message }) {
  try {
    const uptimeSeconds = process.uptime();
    const { hours, minutes, secs } = formatUptime(uptimeSeconds);

    const url = "https://kaiz-apis.gleeze.com/api/uptime";
    const params = {
      instag: "...", 
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

    message.reply(
      `🤖 Bot Uptime (${params.botname}):\n` +
      `⏳ ${hours}h ${minutes}m ${secs}s\n` +
      `🔗 GitHub: ${params.ghub}\n` +
      `📘 FB: ${params.fb}\n` +
      `📸 IG: ${params.instag}\n\n` +
      `Response: ${JSON.stringify(data)}`
    );
  } catch (err) {
    console.error("Error fetching uptime:", err.message);
    message.reply("❌ Failed to fetch uptime data.");
  }
};
