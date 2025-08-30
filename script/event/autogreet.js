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
  version: "2.3-test",
  author: "ari",
  description: "Auto greetings in all GCs (test mode every 1 min, latest 100 only)",
  category: "system"
};

module.exports.handleEvent = function () {};

module.exports.run = async function ({ api }) {
  console.log("[AUTO-GREET] Command loaded ✅");

  // Avoid double scheduling
  if (global.autogreetStarted) return;
  global.autogreetStarted = true;

  // Every 1 minute (TEST MODE)
  cron.schedule("* * * * *", () => {
    console.log("[AUTO-GREET] Cron triggered ⏰");
    sendRandomGreeting(api, greetings.test);
  }, { timezone: "Asia/Manila" });
};

async function sendRandomGreeting(api, greetingArray) {
  try {
    const randomIndex = Math.floor(Math.random() * greetingArray.length);
    const message = greetingArray[randomIndex];

    console.log("[AUTO-GREET] Fetching threads...");
    const threads = await api.getThreadList(100, null, ["INBOX"]);

    if (!threads || threads.length === 0) {
      console.log("[AUTO-GREET] No threads found ❌");
      return;
    }

    const groupThreads = threads.filter(t => t.isGroup);
    console.log(`[AUTO-GREET] Found ${groupThreads.length} group(s).`);

    for (const thread of groupThreads) {
      api.sendMessage(message, thread.threadID, err => {
        if (err) {
          console.error("[AUTO-GREET] Failed to send:", err);
        } else {
          console.log(`[AUTO-GREET] Sent to thread: ${thread.threadID}`);
        }
      });
    }
  } catch (e) {
    console.error("[AUTO-GREET] Error:", e);
  }
}
