const fs = require("fs-extra");
const axios = require("axios");
const pidusage = require("pidusage");
const moment = require("moment-timezone");
const { loadImage, createCanvas, registerFont } = require("canvas");

function byte2mb(bytes) {
  const units = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let l = 0, n = parseInt(bytes, 10) || 0;
  while (n >= 1024 && ++l) n = n / 1024;
  return `${n.toFixed(n < 10 && l > 0 ? 1 : 0)} ${units[l]}`;
}

module.exports.config = {
  name: "upt2",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Converted by Ari (original Mirai-Team)",
  description: "Show uptime status with image",
  commandCategory: "System",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  try {
    const time = process.uptime();
    const hours = Math.floor(time / (60 * 60));
    const minutes = Math.floor((time % (60 * 60)) / 60);
    const seconds = Math.floor(time % 60);

    const z_1 = hours < 10 ? "0" + hours : hours;
    const x_1 = minutes < 10 ? "0" + minutes : minutes;
    const y_1 = seconds < 10 ? "0" + seconds : seconds;

    const stats = await pidusage(process.pid);
    const timeStart = Date.now();
    const timeNow = moment.tz("Asia/Manila").format("DD/MM/YYYY || HH:mm:ss");

    // download font if not exists
    if (!fs.existsSync(__dirname + `/tad/Grandstander-Bold.ttf`)) {
      let fontData = (await axios.get(
        `https://github.com/hanakuUwU/font/raw/main/Grandstander-Bold.ttf`,
        { responseType: "arraybuffer" }
      )).data;
      fs.writeFileSync(
        __dirname + `/tad/Grandstander-Bold.ttf`,
        Buffer.from(fontData, "utf-8")
      );
    }

    // pick random anime ID
    let id = args[0]
      ? parseInt(args[0])
      : Math.floor(Math.random() * 848) + 1;

    const charData = (
      await axios.get(
        `https://run.mocky.io/v3/0dcc2ccb-b5bd-45e7-ab57-5dbf9db17864`
      )
    ).data;

    // prepare paths
    let pathImg = __dirname + `/tad/avatar_bg.png`;
    let pathAva = __dirname + `/tad/avatar_anime.png`;

    // download images
    let background = (
      await axios.get(`https://imgur.com/1QncZxH.png`, {
        responseType: "arraybuffer",
      })
    ).data;
    fs.writeFileSync(pathImg, Buffer.from(background, "utf-8"));

    let avtAnime = (
      await axios.get(encodeURI(`${charData[id].imgAnime}`), {
        responseType: "arraybuffer",
      })
    ).data;
    fs.writeFileSync(pathAva, Buffer.from(avtAnime, "utf-8"));

    // draw canvas
    let bg = await loadImage(pathImg);
    let ava = await loadImage(pathAva);
    let canvas = createCanvas(bg.width, bg.height);
    let ctx = canvas.getContext("2d");

    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(ava, 4000, -590, 5300, 5300);

    registerFont(__dirname + `/tad/Grandstander-Bold.ttf`, {
      family: "Grandstander",
    });
    ctx.textAlign = "center";
    ctx.font = "750px Grandstander";
    ctx.fillStyle = "#FFF";
    ctx.fillText("legend bot", canvas.width / 2 - 660, 1600);

    ctx.font = "350px Grandstander";
    ctx.fillStyle = "#000";
    ctx.fillText("Ralph Angelo Garcia", canvas.width / 2 - 660, 1000);
    ctx.fillText(`${z_1}:${x_1}:${y_1}`, canvas.width / 2 - 630, 2000);

    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);

    api.sendMessage(
      {
        body: `=== UPTIME ROBOT ===\nBot worked ${hours}h ${minutes}m ${seconds}s\n\nCPU: ${stats.cpu.toFixed(
          1
        )}%\nRAM: ${byte2mb(
          stats.memory
        )}\nPing: ${Date.now() - timeStart}ms\nChar ID: ${id}\n━━━━━━━━━━━━━━\n[ ${timeNow} ]`,
        attachment: fs.createReadStream(pathImg),
      },
      event.threadID,
      () => {
        fs.unlinkSync(pathImg);
        fs.unlinkSync(pathAva);
      },
      event.messageID
    );
  } catch (e) {
    console.log(e);
    return api.sendMessage("❌ Error while generating uptime image.", event.threadID);
  }
};
