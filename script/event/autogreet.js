const cron = require("node-cron");

const greetings = {
  test: [
    "Hello! 👋 (test greeting every 1 minute)",
    "AutoGreet is working! ✅",
    "This is a test greeting ⏰"
  ]
};

module.exports.config = {
  name: "autogreet",
  version: "1.6-test",
  author: "ari",
  description: "Auto greetings in all GCs (test mode, latest 100 only)",
  category: "events"
};

module.exports.handleEvent = function () {};

module.exports.onLoad = async function ({ api }) {
  // Every 1 minute (for testing)
  cron.schedule("* * * * *", () => sendRandomGreeting(api, greetings.test), { timezone: "Asia/Manila" });

  console.log("[AUTO-GREET] Test schedule loaded: Every 1 minute ✅ (latest 100 threads only)");
};

async function sendRandomGreeting(api, greetingArray) {
  try {
    const randomIndex = Math.floor(Math.random() * greetingArray.length);
    const message = greetingArray[randomIndex];

    // Get latest 100 threads only
    const threads = await api.getThreadList(100, null, ["INBOX"]);
    const groupThreads = threads.filter(t => t.isGroup);

    for (const thread of groupThreads) {
      api.sendMessage(message, thread.threadID, err => {
        if (err) console.error("[AUTO-GREET] Failed to send:", err);
      });
    }

    console.log(`[AUTO-GREET] Sent "${message}" to ${groupThreads.length} group(s).`);
  } catch (e) {
    console.error("[AUTO-GREET] Error:", e);
  }
}
