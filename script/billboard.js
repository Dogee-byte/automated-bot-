const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "billboard",
  version: "1.0.1",
  role: 0,
  credits: "vern (modified by you)",
  description: "Send your own billboard image instead of API.",
  usage: "/billboard <your message>",
  prefix: true,
  cooldowns: 3,
  commandCategory: "Canvas"
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const text = args.join(' ').trim();
  const prefix = "/";

  if (!text) {
    const usageMessage = `════『 𝗕𝗜𝗟𝗟𝗕𝗢𝗔𝗥𝗗 』════\n\n` +
      `⚠️ Please provide the message for your billboard.\n\n` +
      `📌 Usage: ${prefix}billboard <your message>\n` +
      `💬 Example: ${prefix}billboard Hello, World!\n\n` +
      `> Thank you for using Billboard Generator!`;

    return api.sendMessage(usageMessage, threadID, messageID);
  }

  try {
    // Path sa sarili mong image (pwedeng JPG/PNG na nakasave sa "cache" folder)
    const imgPath = path.join(__dirname, "cache", "https://i.imgur.com/1l75057.jpg");

    if (!fs.existsSync(imgPath)) {
      return api.sendMessage("🚫 Wala pang naka-save na billboard image sa cache/billboard.jpg", threadID, messageID);
    }

    return api.sendMessage({
      body: `════『 𝗕𝗜𝗟𝗟𝗕𝗢𝗔𝗥𝗗 』════\n\n🖼️ "${text}"\n\n> Using your own custom image.`,
      attachment: fs.createReadStream(imgPath)
    }, threadID, messageID);

  } catch (error) {
    console.error('❌ Billboard error:', error);

    const errorMessage = `════『 𝗘𝗥𝗥𝗢𝗥 』════\n\n` +
      `🚫 Failed to send billboard image.\n` +
      `🔧 Reason: ${error.message || 'Unknown error'}\n\n` +
      `Please try again later.`;

    return api.sendMessage(errorMessage, threadID, messageID);
  }
};
