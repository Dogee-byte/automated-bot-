const cron = require("node-cron");

const greetings = {
  morning: [
    "Good morning! ☀️ How about starting the day with a delicious breakfast?",
    "Rise and shine! It's breakfast time! 🍳☕",
    "Morning vibes! Anyone up for a breakfast feast?"
  ],
  lunchtime: [
    "It's lunchtime, my friends! Let's gather for a tasty meal.",
    "Hungry yet? Lunch plans anyone?",
    "Lunch break! Who's in for some good food and great company?"
  ],
  afternoonSnack: [
    "Time for a snack break! Join me for some treats?",
    "Feeling a bit peckish? Snacks and chit-chat await!",
    "Afternoon delight: Snacks, laughter, and fun!"
  ],
  eveningDinner: [
    "Dinner plans tonight? Let's enjoy a hearty meal together.",
    "Evening has come, and so has the dinner bell! 🍽️",
    "Dinner is served! Who's joining me at the table?"
  ],
  lateNightSnack: [
    "Late-night munchies? Come on over for some snacks!",
    "Midnight snack run, anyone? Let's satisfy those cravings.",
    "Burning the midnight oil? Grab a snack and keep me company."
  ]
};

module.exports.config = {
  name: "autogreet",
  version: "1.2",
  author: "ari",
  description: "Auto greetings in GC",
  category: "events"
};

module.exports.handleEvent =function () {
};

module.exports.onLoad = function ({ api }) {
  cron.schedule("35 7 * * *", () => sendRandomGreeting(api, greetings.morning), { timezone: "Asia/Manila" });
  cron.schedule("0 12 * * *", () => sendRandomGreeting(api, greetings.lunchtime), { timezone: "Asia/Manila" });
  cron.schedule("0 15 * * *", () => sendRandomGreeting(api, greetings.afternoonSnack), { timezone: "Asia/Manila" });
  cron.schedule("0 18 * * *", () => sendRandomGreeting(api, greetings.eveningDinner), { timezone: "Asia/Manila" });
  cron.schedule("0 23 * * *", () => sendRandomGreeting(api, greetings.lateNightSnack), { timezone: "Asia/Manila" });
};

async function sendRandomGreeting(api, greetingArray) {
  const randomIndex = Math.floor(Math.random() * greetingArray.length);
  const message = greetingArray[randomIndex];

  const threadList = await api.getThreadList(100, null, ["INBOX"]);
  const groupThreads = threadList.filter(t => t.isGroup);

  for (const thread of groupThreads) {
    api.sendMessage(message, thread.threadID);
  }
}
