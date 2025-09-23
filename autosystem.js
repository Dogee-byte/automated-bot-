module.exports = async ({ api }) => {
  const logger = console.log;

  const configCustom = {
    autosetbio: {
      status: true,
      bio: `boWrat quh nahmamagA 😓💔`
    },
    greetings: {
      status: true,
      schedule: [
        { hour: 5, period: "AM", message: "Good morning everyone! Rise and shine ☀️" },
        { hour: 6, period: "AM", message: "Time for morning stretches! 🧘‍♂️" },
        { hour: 7, period: "AM", message: "🍳🥖 Breakfast time! Don't skip it 💪" },
        { hour: 9, period: "AM", message: "Keep hustling! 💼 Productivity vibes!" },
        { hour: 11, period: "AM", message: "Good late morning! Almost lunch 🍲" },
        { hour: 12, period: "PM", message: "🍲 Lunch time! Refuel your energy 🔋" },
        { hour: 2, period: "PM", message: "Afternoon vibes! Stay hydrated 💧" },
        { hour: 3, period: "PM", message: "🍪 Merienda time! Snack break ☕🥤" },
        { hour: 5, period: "PM", message: "Evening is coming! 🌆 Take a deep breath" },
        { hour: 6, period: "PM", message: "Good evening everyone! 🌇 Time to relax" },
        { hour: 7, period: "PM", message: "🍛 Dinner o'clock! Eat well 🥢🍗" },
        { hour: 9, period: "PM", message: "Night vibes! 🌙 Almost bedtime 😴" },
        { hour: 10, period: "PM", message: "10:00 pm, mag rerelapse na naman yung tanga dyan. 🥀" },
        { hour: 12, period: "AM", message: "12 na tama na kakarelapse 💓" },
        { hour: 2, period: "AM", message: "Late night alert! 🦉 Don't stay up too long" },
        { hour: 4, period: "AM", message: "Sunrise is comming 😍🌄" }
      ],
      weekend: "🎉 Happy weekend! Chill and enjoy your freedom 🏖️🍻",
      monday: "💼 Monday grind! Start the week strong 💪🔥",
      friday: "🎶 Friday night vibes! End the week with good energy 🕺💃"
    },
    acceptPending: { status: false, time: 10 },
    keepAlive: { status: true, interval: 1000 * 60 * 10 }
  };

  function autosetbio(config) {
    if (!config.status) return;
    try {
      api.changeBio(config.bio, (err) => {
        if (err) logger(`[setbio] Error: ${err}`);
        else logger(`[setbio] Changed bot bio to: ${config.bio}`);
      });
    } catch (error) {
      logger(`[setbio] Unexpected error: ${error}`);
    }
  }

  async function greetings(config) {
    if (!config.status) return;

    let sentToday = new Set();
    let currentDate = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Manila" });

    setInterval(async () => {
      const now = new Date().toLocaleTimeString("en-US", { hour12: true, timeZone: "Asia/Manila" });
      const [time, period] = now.split(" ");
      const [hour] = time.split(":").map(Number);

      const today = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Manila" });
      if (today !== currentDate) {
        sentToday.clear();
        currentDate = today;
      }

      const match = config.schedule.find(s => s.hour === hour && s.period === period);
      if (match && !sentToday.has(`${hour}${period}`)) {
        try {
          const threads = await api.getThreadList(100, null, ["INBOX"]);
          const groupThreads = threads.filter(t => t.isGroup);
          for (const thread of groupThreads) {
            api.sendMessage(match.message, thread.threadID);
          }
          logger(`[greetings] Sent to ${groupThreads.length} groups: ${match.message}`);
          sentToday.add(`${hour}${period}`);
        } catch (err) {
          logger("[greetings] Error sending to groups:", err);
        }
      }

      const weekday = new Date().toLocaleDateString("en-US", { weekday: "long", timeZone: "Asia/Manila" });
      if (!sentToday.has(`day-${weekday}-${hour}${period}`)) {
        try {
          const threads = await api.getThreadList(100, null, ["INBOX"]);
          const groupThreads = threads.filter(t => t.isGroup);
          if ((weekday === "Saturday" || weekday === "Sunday") && hour === 9 && period === "AM") {
            for (const thread of groupThreads) api.sendMessage(config.weekend, thread.threadID);
            sentToday.add(`day-${weekday}-${hour}${period}`);
          } else if (weekday === "Monday" && hour === 8 && period === "AM") {
            for (const thread of groupThreads) api.sendMessage(config.monday, thread.threadID);
            sentToday.add(`day-${weekday}-${hour}${period}`);
          } else if (weekday === "Friday" && hour === 8 && period === "PM") {
            for (const thread of groupThreads) api.sendMessage(config.friday, thread.threadID);
            sentToday.add(`day-${weekday}-${hour}${period}`);
          }
        } catch (err) {
          logger("[greetings] Error sending weekly/daily greetings:", err);
        }
      }

    }, 1000 * 60); 
  }

  function acceptPending(config) {
    if (!config.status) return;
    setInterval(async () => {
      try {
        const list = [
          ...(await api.getThreadList(1, null, ["PENDING"])),
          ...(await api.getThreadList(1, null, ["OTHER"]))
        ];
        if (list[0]) {
          api.sendMessage("This thread was automatically approved by our system.", list[0].threadID);
          logger(`[pending] Approved thread: ${list[0].threadID}`);
        }
      } catch (err) {
        logger(`[pending] Error: ${err}`);
      }
    }, config.time * 60 * 1000);
  }
  
  function keepAlive(config) {
    if (!config.status) return;
    setInterval(async () => {
      try {
        await api.getCurrentUserID();
        logger("[keepAlive] Session refreshed.");
      } catch (err) {
        logger("[keepAlive] Error refreshing session:", err);
      }
    }, config.interval);
  }

  autosetbio(configCustom.autosetbio);
  greetings(configCustom.greetings);
  acceptPending(configCustom.acceptPending);
  keepAlive(configCustom.keepAlive);

  logger("[SYSTEM] Autosystem is running...");
};
