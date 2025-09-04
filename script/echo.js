const axios = require('axios');

module.exports.config = {
  name: 'echo',
  version: '1.1.0',
  role: 0,
  hasPrefix: false,
  aliases: ['ai', 'gpt'],
  description: "Talk with Echo AI",
  usage: "echo [your question]",
  credits: 'Ari (api by ari)',
  cooldown: 3,
};

module.exports.run = async function({ api, event, args }) {
  const prompt = args.join(" ").trim();
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!prompt) {
    return api.sendMessage("❌ Please provide a question.\nExample: echo Hello!", threadID, messageID);
  }

  try {
    const { data } = await axios.post("https://echoai-api.onrender.com/echo", {
      prompt: prompt
    });

    const timePH = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });

    const replyMessage = 
`🤖 𝗘𝗖𝗛𝗢 𝗔𝗜  
━━━━━━━━━━━━━━━━━━  
${data.reply || "⚠️ No response received."}  
━━━━━━━━━━━━━━━━━━  
🕒 ${timePH}`;

    api.sendMessage(replyMessage, threadID, messageID);

  } catch (error) {
    console.error("Echo API Error:", error.response?.data || error.message);
    const errMsg = `❌ Error: ${
      error.response?.data?.error || error.message || "Unknown error"
    }`;
    api.sendMessage(errMsg, threadID, messageID);
  }
};
