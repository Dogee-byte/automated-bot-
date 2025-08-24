module.exports.config = {
  name: "autogreet",
  version: "4.0.0",
  role: 0,
  credits: "Ari",
  description: "Auto greetings every hour with random reminders (meals, snacks, rest).",
  usage: "autogreet status",
  category: "Automation",
};

let interval = null;

const messages = {
  morning: [
    "☀️ Good Morning! Don’t forget to eat your breakfast 🥞🥛",
    "🌄 Rise and shine! Breakfast is the most important meal 🍳🥓",
    "☀️ Good Morning everyone! Have a great start to your day 🌸",
  ],
  afternoon: [
    "🌤️ Good Afternoon! Stay hydrated 💧",
    "🌤️ Good Afternoon! Time for a little stretch 🙆",
    "🌤️ Don’t forget your snack this afternoon 🍪☕",
  ],
  evening: [
    "🌆 Good Evening! Don’t forget your dinner 🍲🥤",
    "🌆 Evening vibes 🌙 Take a walk and relax 🚶",
    "🌆 Good Evening everyone! Hope you had a good day 💫",
  ],
  night: [
    "🌙 Good Night! Time to rest, see you tomorrow 😴",
    "🌙 Sleep well and sweet dreams 🌌✨",
    "🌙 Don’t stay up too late, your health matters ❤️",
  ],
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return pick(messages.morning);
  if (hour >= 12 && hour < 17) return pick(messages.afternoon);
  if (hour >= 17 && hour < 21) return pick(messages.evening);
  return pick(messages.night);
}

module.exports.onLoad = function ({ api }) {
  if (interval) clearInterval(interval);

  interval = setInterval(async () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    if (minute !== 0) return;

    const greet = getGreeting(hour);

    try {
      const threads = await api.getThreadList(100, null, ["INBOX"]);
      for (const t of threads) {
        if (t.isGroup && t.isSubscribed) {
          await api.sendMessage(greet, t.threadID);
        }
      }
    } catch (e) {
      console.error("AutoGreet error:", e);
    }
  }, 60 * 1000); 
};

module.exports.onCall = async function ({ message }) {
  return message.reply("🤖 AutoGreet is running automatically every hour ⏰");
};
