const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "calculate", 
  version: "1.0.2",
  role: 0,
  credits: "Ari + GPT-5",
  description: "Love calculator ❤️",
  hasPrefix: false,
  usage: "calculate first name | second name",
  cooldowns: 1,
};

const loveCalculator = {
  getRandomPercentage: () => Math.floor(Math.random() * 101),

  getLoveComment: (percentage) => {
    if (percentage < 10) {
      return {
        comment: "It's better to find another partner☺️",
        gifLink: "https://i.imgur.com/l74sepy.gif",
        audioLink: "https://drive.google.com/uc?export=download&id=1CYTTaxQIMIdXXdYFO6UN1ShdQiasaUX9",
      };
    } else if (percentage < 20) {
      return {
        comment: "The chance of success is very low 💔",
        gifLink: "https://i.imgur.com/GdgW1fm.gif",
        audioLink: "https://drive.google.com/uc?export=download&id=1BN_FCS8hNqrg4vgq7mso9zPlR5RW0JD7",
      };
    } else if (percentage < 30) {
      return {
        comment: "Very low chance.\nYou both have to work on it 💐",
        gifLink: "https://i.imgur.com/2oLW6ow.gif",
        audioLink: "https://drive.google.com/uc?export=download&id=1RiIqz4YwL9xbcoGa5svtFsGpmewEaCj0",
      };
    } else if (percentage < 40) {
      return {
        comment: "Not bad, give your\nbest to make it a success 💝",
        gifLink: "https://i.imgur.com/rqGLgqm.gif",
        audioLink: "https://drive.google.com/uc?export=download&id=1eycxUA5jDZB_LSheX0kkZU-pwE7o1TbM",
      };
    } else if (percentage < 50) {
      return {
        comment: "You two will be a fine couple\nbut not perfect 😔💟",
        gifLink: "https://i.imgur.com/6wAxorq.gif",
        audioLink: "https://drive.google.com/uc?export=download&id=1P83CMEWiZ08eMr6G5kMyBZ7DYlljMWac",
      };
    } else if (percentage < 60) {
      return {
        comment: "You two have some potential.\nKeep working on it! 💏",
        gifLink: "https://i.imgur.com/ceDO779.gif",
        audioLink: "https://drive.google.com/uc?export=download&id=1_RjvyfAbJEQc5M9v-2_9lEuczp5I5nFy",
      };
    } else if (percentage < 70) {
      return {
        comment: "You two will be a nice couple 💑",
        gifLink: "https://i.imgur.com/pGuGuC0.gif",
        audioLink: "https://drive.google.com/uc?export=download&id=1AkwiVnY7kpHTwLKi0hZv4jT19UKc5x4C",
      };
    } else if (percentage < 80) {
      return {
        comment: "If you two keep loving each other or confess your feelings,\nit might make some good changes 👩‍❤️‍💋‍👨",
        gifLink: "https://i.imgur.com/bt77RPY.gif",
        audioLink: "https://drive.google.com/uc?export=download&id=1jGiEvE6namRCfMU2IEOU7bFzFX5QrSGu",
      };
    } else if (percentage < 90) {
      return {
        comment: "Perfect match!\nYour love is meant to be! 💑",
        gifLink: "https://i.imgur.com/kXNlsFf.gif",
        audioLink: "https://drive.google.com/uc?export=download&id=1kx4HkDM-SBF2h62Na_gHTmow653zL0nm",
      };
    } else {
      return {
        comment: "Amazing perfectly matched!\nYou two are meant to be for each other.\nBest wishes for your future! 👩‍❤️‍💋‍👨💐",
        gifLink: "https://i.imgur.com/sY03YzC.gif",
        audioLink: "https://drive.google.com/uc?export=download&id=1NNML3BkFOWuRodg2VBsgQNfV_pgSDa1I",
      };
    }
  },

  downloadFile: async (url, localPath) => {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(localPath, Buffer.from(response.data, "binary"));
  },
};

module.exports.run = async function ({ api, event, args }) {
  const tzt = args.join(" ").split("|").map(item => item.trim());

  if (!args[0] || tzt.length !== 2) {
    return api.sendMessage("❌ Please provide two names separated by | \n\nExample: calculate Ari | Pookie", event.threadID, event.messageID);
  }

  const [firstName, secondName] = tzt;
  const lovePercentage = loveCalculator.getRandomPercentage();
  const { comment, gifLink, audioLink } = loveCalculator.getLoveComment(lovePercentage);

  const hearts = Math.round(lovePercentage / 10);
  const progressBar = "❤️".repeat(hearts) + "🤍".repeat(10 - hearts);

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  const gifPath = path.join(cacheDir, "love.gif");
  const audioPath = path.join(cacheDir, "love.mp3");

  try {
    await Promise.all([
      loveCalculator.downloadFile(gifLink, gifPath),
      loveCalculator.downloadFile(audioLink, audioPath)
    ]);

    const message = `💘 Love Calculation 💘\n\n🔹 ${firstName} ❤️ ${secondName}\n🔹 Compatibility: ${lovePercentage}%\n${progressBar}\n\n${comment}`;
    const gifReadStream = fs.createReadStream(gifPath);

    api.sendMessage({ body: message, attachment: gifReadStream }, event.threadID, async (err) => {
      if (!err) {
        const audioReadStream = fs.createReadStream(audioPath);
        api.sendMessage({ body: "", attachment: audioReadStream }, event.threadID);
      }
    });

  } catch (e) {
    console.error(e);
    api.sendMessage("⚠️ Error downloading media. Please try again later.", event.threadID, event.messageID);
  }
};
