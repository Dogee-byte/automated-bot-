const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const util = require("util");
const path = require("path");
const os = require("os");
const pidusage = require("pidusage");

const unlinkAsync = util.promisify(fs.unlink);

const historyFilePath = path.resolve(__dirname, '..', 'data', 'history.json');

let historyData = [];
try {
  historyData = require(historyFilePath);
} catch (readError) {
  console.error('Error reading history.json:', readError);
}

try {
  registerFont(path.join(__dirname, "../fonts/OpenSans-Bold.ttf"), { family: "OpenSans" });
} catch (e) {}

module.exports.config = {
  name: 'active',
  aliases: ["listusers", "listbots", "activeusers", "list-users", "bot-users", "active-users", "active-bots", "list-bot", "botstatus"],
  description: 'List all active bots in the history session.',
  version: '2.0.0',
  role: 2,
  cooldown: 0,
  credits: "ari",
  hasPrefix: false,
  usage: "active-session",
  dependencies: {
    "process": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const pogi = "61577110900436";
  if (!pogi.includes(event.senderID))
    return api.sendMessage("This Command is only for AUTOBOT owner.", event.threadID, event.messageID);

  const { threadID, messageID } = event;

  if (args[0] && args[0].toLowerCase() === 'logout') {
    await logout(api, event);
    return;
  }

  if (historyData.length === 0) {
    return api.sendMessage('No users found in the history configuration.', threadID, messageID);
  }

  const currentUserId = api.getCurrentUserID();
  const mainBotIndex = historyData.findIndex(user => user.userid === currentUserId);

  if (mainBotIndex === -1) {
    return api.sendMessage('Main bot not found in history.', threadID, messageID);
  }

  const mainBot = historyData[mainBotIndex];
  const mainBotName = await getUserName(api, currentUserId);
  const mainBotRunningTime = convertTime(mainBot.time);

  const userPromises = historyData
    .filter((user) => user.userid !== currentUserId)
    .map(async (user) => {
      const userName = await getUserName(api, user.userid);
      const userRunningTime = convertTime(user.time);
      return { name: userName, id: user.userid, uptime: userRunningTime };
    });

  const sessions = (await Promise.all(userPromises)).filter(Boolean);

  const buffer = await generateActiveCanvas(mainBotName, currentUserId, mainBotRunningTime, sessions);

  return api.sendMessage({
    body: "Active Bot Session",
    attachment: buffer
  }, threadID, messageID);
};

async function logout(api, event) {
  const { threadID, messageID } = event;
  const currentUserId = api.getCurrentUserID();
  const jsonFilePath = path.resolve(__dirname, '..', 'data', 'session', `${currentUserId}.json`);

  try {
    await unlinkAsync(jsonFilePath);
    api.sendMessage('Bot Has been Logout!.', threadID, messageID, () => process.exit(1));
  } catch (error) {
    console.error('Error deleting JSON file:', error);
    api.sendMessage('Error during logout. Please try again.', threadID, messageID);
  }
}

async function getUserName(api, userID) {
  try {
    const userInfo = await api.getUserInfo(userID);
    return userInfo && userInfo[userID] ? userInfo[userID].name : "unknown";
  } catch (error) {
    return "unknown";
  }
}

function convertTime(timeValue) {
  const totalSeconds = parseInt(timeValue, 10);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const remainingHours = Math.floor((totalSeconds % (24 * 60 * 60)) / 3600);
  const remainingMinutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${days}d ${remainingHours}h ${remainingMinutes}m ${remainingSeconds}s`;
}

function formatBytes(bytes) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Byte";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
}

async function generateActiveCanvas(mainBotName, mainBotID, uptime, sessions) {
  const width = 1000;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#1e1e2e";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px OpenSans";
  ctx.fillText("Active Bot Session", 40, 60);

  ctx.font = "bold 28px OpenSans";
  ctx.fillStyle = "#00ffcc";
  ctx.fillText(`MainBot: ${mainBotName}`, 40, 120);

  ctx.font = "20px OpenSans";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`ID: ${mainBotID}`, 40, 150);
  ctx.fillText(`Uptime: ${uptime}`, 40, 180);

  const cpu = os.cpus()[0].model;
  const cores = os.cpus().length;
  const totalMem = formatBytes(os.totalmem());
  const freeMem = formatBytes(os.freemem());

  ctx.fillStyle = "#ffcc00";
  ctx.font = "bold 24px OpenSans";
  ctx.fillText("System Info:", 40, 240);

  ctx.font = "20px OpenSans";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`CPU: ${cpu}`, 40, 270);
  ctx.fillText(`Cores: ${cores}`, 40, 300);
  ctx.fillText(`Memory: ${freeMem} / ${totalMem}`, 40, 330);

  const usage = await pidusage(process.pid);
  const ramPercent = (usage.memory / os.totalmem()) * 100;
  const cpuPercent = usage.cpu;

  drawBar(ctx, 40, 360, 400, ramPercent, "RAM Usage");
  drawBar(ctx, 40, 410, 400, cpuPercent, "CPU Usage");

  ctx.fillStyle = "#ff6666";
  ctx.font = "bold 24px OpenSans";
  ctx.fillText(`Other Sessions [${sessions.length}]`, 500, 240);

  ctx.fillStyle = "#ffffff";
  ctx.font = "18px OpenSans";

  sessions.slice(0, 8).forEach((s, i) => {
    ctx.fillText(`${i + 1}. ${s.name} (${s.id}) - ${s.uptime}`, 500, 280 + i * 25);
  });

  return canvas.toBuffer();
}

function drawBar(ctx, x, y, width, percent, label) {
  ctx.fillStyle = "#ffffff";
  ctx.font = "16px OpenSans";
  ctx.fillText(`${label}: ${percent.toFixed(1)}%`, x, y - 5);

  ctx.fillStyle = "#444";
  ctx.fillRect(x, y, width, 20);

  ctx.fillStyle = percent > 80 ? "#ff4444" : "#44ff44";
  ctx.fillRect(x, y, (width * percent) / 100, 20);
}
