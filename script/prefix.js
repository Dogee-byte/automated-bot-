const fs = require("fs");
const axios = require("axios");
const path = require("path");
const util = require("util");
const unlinkAsync = util.promisify(fs.unlink);

let config = {};
try {
  config = JSON.parse(fs.readFileSync(path.join(__dirname, "../config.json")));
} catch (e) {
  config.prefix = " ";
  config.botName = "🤖 | 𝙴𝚌𝚑𝚘 𝙰𝙸";
}

module.exports.config = {
  name: "prefix",
  version: "2.0.0",
  role: 0,
  description: "Displays the bot's prefix with a random GIF.",
  prefix: true,
  premium: false,
  credits: "ari",
  cooldowns: 5,
  category: "info"
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;
  const botPrefix = config.prefix || " ";
  const botName = config.botName || "🤖 | 𝙴𝚌𝚑𝚘 𝙰𝙸";

  const gifList = [
    "https://media3.giphy.com/media/v1.Y2lkPTZjMDliOTUyNGtwOTdnb2t1dHI4dXJ0bXcyM283dG1nbmxhdm9nZnVvOHM4OGhkaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/oAvQOD7hJMXQFDDhBI/giphy.gif",
    "https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUyaDBsYXN6bmk1bjhydmd2MDc1Mndudmg4eXBweWI4dmx0N3c2b256NiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/9jwuxt5bXKadi/giphy.gif",
    "https://media2.giphy.com/media/v1.Y2lkPTZjMDliOTUyemYxNThnazlxdHNma2Q1aHZubnpjdGFucDFtemdyZW1sdnRrcXM4bSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ZCSZp478OpzSMpAAFc/giphy.gif",
    "https://media2.giphy.com/media/v1.Y2lkPTZjMDliOTUyYjJwNDQ0OWN6eDFqdXFyYnBrdTJrMXB5eXhtczR1eXFzYjdjb2pxNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/DXwyLeoYK7ozTUUOdG/giphy.gif",
    "https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUyOWVhNXhpeHY1YXoxcTNoNHl0cWF3ZXBveTJoODc5cG9vZ3J6OWRzeSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/RIpj8HJGVGGTUdM76b/giphy.gif"
  ];

  const gifUrl = gifList[Math.floor(Math.random() * gifList.length)];
  const tempFilePath = path.join(__dirname, `prefix_${Date.now()}.gif`);

  try {
    const response = await axios({
      url: gifUrl,
      method: "GET",
      responseType: "stream"
    });

    const writer = fs.createWriteStream(tempFilePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    await new Promise((resolve, reject) => {
      api.sendMessage({
        body: `🤖 𝗕𝗼𝘁 𝗜𝗻𝗳𝗼𝗿𝗺𝗮𝘁𝗶𝗼𝗻\n📌 𝗣𝗿𝗲𝗳𝗶𝘅: ${botPrefix}\n🆔 𝗕𝗼𝘁 𝗡𝗮𝗺𝗲: ${botName}\n\n🙏 𝗧𝗵𝗮𝗻𝗸𝘀 𝗳𝗼𝗿 𝘂𝘀𝗶𝗻𝗴 𝗺𝘆 𝗯𝗼𝘁!`,
        attachment: fs.createReadStream(tempFilePath)
      }, threadID, (err) => {
        if (err) reject(err);
        else resolve();
      }, messageID);
    });

  } catch (error) {
    console.error("Error in prefix command:", error);
    api.sendMessage("⚠️ Failed to fetch or send the GIF.", threadID, messageID);
  } finally {
    unlinkAsync(tempFilePath).catch(e => {});
  }
};
