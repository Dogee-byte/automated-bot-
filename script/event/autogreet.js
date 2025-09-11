const cron = require("node-cron");

try {
  const utils = require("ws3-fca/src/utils");
  if (typeof utils.CustomError !== "function") {
    class CustomError extends Error {
      constructor(message) {
        super(message);
        this.name = "CustomError";
      }
    }
    utils.CustomError = CustomError;
    console.log("✅ Patched ws3-fca CustomError");
  }
} catch (e) {
  console.warn("⚠️ Could not patch ws3-fca CustomError:", e.message);
}

const greetings = {
  morning: [
    { time: "7:35 AM", message: "Good morning! ☀️ How about starting the day with a delicious breakfast?" },
    { time: "8:30 AM", message: "Rise and shine! It's breakfast time! 🍳☕" },
    { time: "9:00 AM", message: "Morning vibes! Anyone up for a breakfast feast?" },
  ],
  lunchtime: [
    { time: "12:00 PM", message: "It's lunchtime, kain na mga burat" },
    { time: "12:30 PM", message: "Hungry yet? Lunch plans anyone?" },
    { time: "1:00 PM", message: "Lunch break! Who's in for some good food and great company?" },
  ],
  afternoonSnack: [
    { time: "3:00 PM", message: "Time for a snack break! Join me for some treats?" },
    { time: "3:30 PM", message: "Feeling a bit peckish? Snacks and chit-chat await!" },
    { time: "4:00 PM", message: "Afternoon delight: Snacks, laughter, and fun!" },
  ],
  eveningDinner: [
    { time: "6:00 PM", message: "Dinner plans tonight? Let's enjoy a hearty meal together." },
    { time: "7:00 PM", message: "Dinner time, kain sa mga hindi minahal dyan" },
    { time: "7:36 PM", message: "Evening has come, and so has the dinner bell! 🍽️" },
  ],
  lateNightSnack: [
    { time: "11:00 PM", message: "11:00 pm, baka gusto mo akong ayain ng late-night talk 🫶" },
    { time: "11:30 PM", message: "10:30 pm, relapse time para sa mga tanga dyan" },
    { time: "12:00 AM", message: "Ops! 12 na tama na kakareplapse baka pumanaw ka kakapuyat" },
  ],
};

module.exports.config = {
  name: "autogreet",
  version: "2.0",
  credits: "Ari",
  description: "Automatic greetings",
  category: "events"
};

let initialized = false;

module.exports.handleEvent = async function ({ api, event }) {
  if (initialized) return;
  initialized = true;

  console.log("✅ AutoGreet cron jobs initialized");

  const scheduleGreeting = (cronTime, greetingArray) => {
    cron.schedule(cronTime, () => sendRandomGreeting(api, greetingArray), { timezone: "Asia/Manila" });
  };

  scheduleGreeting("35 7 * * *", greetings.morning);
  scheduleGreeting("30 8 * * *", greetings.morning);
  scheduleGreeting("0 9 * * *", greetings.morning);

  scheduleGreeting("0 12 * * *", greetings.lunchtime);
  scheduleGreeting("30 12 * * *", greetings.lunchtime);
  scheduleGreeting("0 13 * * *", greetings.lunchtime);

  scheduleGreeting("0 15 * * *", greetings.afternoonSnack);
  scheduleGreeting("30 15 * * *", greetings.afternoonSnack);
  scheduleGreeting("0 16 * * *", greetings.afternoonSnack);

  scheduleGreeting("0 18 * * *", greetings.eveningDinner);
  scheduleGreeting("0 19 * * *", greetings.eveningDinner);
  scheduleGreeting("36 19 * * *", greetings.eveningDinner);

  scheduleGreeting("0 23 * * *", greetings.lateNightSnack);
  scheduleGreeting("30 23 * * *", greetings.lateNightSnack);
  scheduleGreeting("0 0 * * *", greetings.lateNightSnack);
};

async function sendRandomGreeting(api, greetingArray) {
  const randomIndex = Math.floor(Math.random() * greetingArray.length);
  const { time, message } = greetingArray[randomIndex];

  try {
    let cursor = null;
    let allThreads = [];

    do {
      const threads = await api.getThreadList(100, cursor, ["INBOX"]);
      allThreads = allThreads.concat(threads);
      if (threads.length < 100) break;
      cursor = threads[threads.length - 1]?.timestamp;
    } while (true);

    const groupThreads = allThreads.filter(t => t.isGroup);

    for (let thread of groupThreads) {
      try {
        await api.sendMessage(`[${time}] ${message}`, thread.threadID);
      } catch (err) {
        console.error(`❌ Failed to send in ${thread.threadID}:`, err.message);
      }
    }

    console.log(`✅ Sent greeting to ${groupThreads.length} groups: [${time}] ${message}`);
  } catch (err) {
    console.error("❌ Error fetching/sending greetings:", err);
  }
}
