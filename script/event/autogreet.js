const cron = require("node-cron");

let utils;
try {
    try {
        utils = require("ws3-fca/utils");
    } catch {
        utils = require("ws3-fca/src/utils");
    }
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

// --- Greetings ---
const greetings = {
    morning: [
        { time: "7:35 AM", message: "Good morning! ☀️ Breakfast time?" },
        { time: "8:30 AM", message: "Rise and shine! 🍳☕" },
        { time: "9:00 AM", message: "Morning vibes! Anyone up for breakfast?" },
    ],
    lunchtime: [
        { time: "12:00 PM", message: "It's lunchtime, kain na!" },
        { time: "12:30 PM", message: "Hungry yet? Lunch plans?" },
        { time: "1:00 PM", message: "Lunch break! Let's eat!" },
    ],
    afternoonSnack: [
        { time: "3:00 PM", message: "Snack time! 🍪" },
        { time: "3:30 PM", message: "Feeling peckish? Grab a snack!" },
        { time: "4:00 PM", message: "Afternoon delight: Snacks await!" },
    ],
    eveningDinner: [
        { time: "6:00 PM", message: "Dinner time! 🍽️" },
        { time: "7:00 PM", message: "Enjoy your dinner!" },
        { time: "7:36 PM", message: "Evening dinner bell! 🥘" },
    ],
    lateNightSnack: [
        { time: "11:00 PM", message: "Late-night talk anyone? 🫶" },
        { time: "11:30 PM", message: "Snack time for night owls!" },
        { time: "12:00 AM", message: "Midnight snacks, don't stay up too late!" },
    ],
};

module.exports.config = {
    name: "autogreet",
    version: "2.0",
    credits: "Ari",
    description: "Automatic greetings",
    category: "events",
};

let initialized = false;

module.exports.handleEvent = async function ({ api }) {
    if (initialized) return;
    initialized = true;

    console.log("✅ AutoGreet cron jobs initializing...");

    const scheduleGreeting = (cronTime, greetingArray) => {
        cron.schedule(cronTime, () => sendRandomGreeting(api, greetingArray), { timezone: "Asia/Manila" });
    };

    greetings.morning.forEach(g => scheduleGreeting(convertTimeToCron(g.time), greetings.morning));
    greetings.lunchtime.forEach(g => scheduleGreeting(convertTimeToCron(g.time), greetings.lunchtime));
    greetings.afternoonSnack.forEach(g => scheduleGreeting(convertTimeToCron(g.time), greetings.afternoonSnack));
    greetings.eveningDinner.forEach(g => scheduleGreeting(convertTimeToCron(g.time), greetings.eveningDinner));
    greetings.lateNightSnack.forEach(g => scheduleGreeting(convertTimeToCron(g.time), greetings.lateNightSnack));
};

function convertTimeToCron(timeStr) {
    const [time, meridian] = timeStr.split(" ");
    let [hour, minute] = time.split(":").map(Number);
    if (meridian.toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (meridian.toUpperCase() === "AM" && hour === 12) hour = 0;
    return `${minute} ${hour} * * *`;
}

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

        if (groupThreads.length === 0) {
            console.log("⚠️ No group threads found to send greetings.");
            return;
        }

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
