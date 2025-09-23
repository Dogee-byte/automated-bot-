module.exports = async ({ api }) => {
  const logger = console.log;

  const configCustom = {
    autosetbio: {
      status: true,
      bio: `boWrat quh nahmamagA 😓💔`,
      note: "Automatically change the bot bio."
    },
    greetings: {
      status: true,
      morning: `Good morning everyone, have a nice day.`,
      afternoon: `Good afternoon everyone, don't forget to eat your lunch.`,
      evening: `Good evening everyone, don't forget to eat dinner.`,
      sleep: `Good night everyone, mag rerepalse na naman yung tanga dyan.`,
      
      breakfast: "🍳🥖 Breakfast check! Don't skip the most important meal of the day 💪",
      noon: "🍲 It's high noon! Time for lunch, recharge your energy 🔋",
      merienda: "🍪 Coffee or milk tea break? Merienda time ☕🥤",
      dinner: "🍛 Dinner o'clock! Eat well and enjoy your meal 🥢🍗",
      midnight: "🌙 Midnight vibes 🌌 — sino gising pa? tama na kaka-relapse oyy",
      lateNight: "🦉 Night owls detected 🐦, wag masyadong puyat! 😴",
      weekend: "🎉 Happy weekend! Chill, rest, and enjoy your freedom 🏖️🍻",
      monday: "💼 Monday grind is real! Start strong 💪🔥",
      friday: "🎶 Friday night vibes! Let's end the week with good energy 🕺💃",
      note: "Greetings every morning, afternoon, evening, midnight etc. Timezone: Asia/Manila"
    },
    acceptPending: {
      status: false,
      time: 10,
      note: "Approve waiting messages after a certain time."
    },
    keepAlive: {
      status: true,
      interval: 1000 * 60 * 10,
      note: "Keep the session alive to avoid logout."
    }
  };

  function autosetbio(config) {
    if (config.status) {
      try {
        api.changeBio(config.bio, (err) => {
          if (err) {
            logger(`[setbio] Error: ${err}`);
          } else {
            logger(`[setbio] Changed bot bio to: ${config.bio}`);
          }
        });
      } catch (error) {
        logger(`[setbio] Unexpected error: ${error}`);
      }
    }
  }

  async function greetings(config) {
    if (config.status) {
      try {
        const schedule = [
          { hour: 5, period: "AM", message: config.morning },
          { hour: 11, period: "AM", message: config.afternoon },
          { hour: 6, period: "PM", message: config.evening },
          { hour: 10, period: "PM", message: config.sleep },

          { hour: 7, period: "AM", message: config.breakfast },
          { hour: 12, period: "PM", message: config.noon },
          { hour: 3, period: "PM", message: config.merienda },
          { hour: 7, period: "PM", message: config.dinner },
          { hour: 12, period: "AM", message: config.midnight },
          { hour: 2, period: "AM", message: config.lateNight }
        ];

        setInterval(async () => {
          const now = new Date().toLocaleTimeString("en-US", {
            hour12: true,
            timeZone: "Asia/Manila"
          });

          const [time, period] = now.split(" ");
          const [hour] = time.split(":").map(Number);

          const match = schedule.find(s => s.hour === hour && s.period === period);

          if (match) {
            try {
              const threads = await api.getThreadList(100, null, ["INBOX"]);
              const groupThreads = threads.filter(t => t.isGroup);

              for (const thread of groupThreads) {
                api.sendMessage(match.message, thread.threadID);
              }

              logger(`[greetings] Sent to ${groupThreads.length} groups: ${match.message}`);
            } catch (err) {
              logger("[greetings] Error sending to groups:", err);
            }
          }
          
          const day = new Date().toLocaleDateString("en-US", {
            weekday: "long",
            timeZone: "Asia/Manila"
          });

          if ((day === "Saturday" || day === "Sunday") && hour === 9 && period === "AM") {
            const threads = await api.getThreadList(100, null, ["INBOX"]);
            const groupThreads = threads.filter(t => t.isGroup);
            for (const thread of groupThreads) api.sendMessage(config.weekend, thread.threadID);
          } else if (day === "Monday" && hour === 8 && period === "AM") {
            const threads = await api.getThreadList(100, null, ["INBOX"]);
            const groupThreads = threads.filter(t => t.isGroup);
            for (const thread of groupThreads) api.sendMessage(config.monday, thread.threadID);
          } else if (day === "Friday" && hour === 8 && period === "PM") {
            const threads = await api.getThreadList(100, null, ["INBOX"]);
            const groupThreads = threads.filter(t => t.isGroup);
            for (const thread of groupThreads) api.sendMessage(config.friday, thread.threadID);
          }

        }, 1000 * 60);
      } catch (error) {
        logger(`[greetings] Error: ${error}`);
      }
    }
  }

  function acceptPending(config) {
    if (config.status) {
      setInterval(async () => {
        try {
          const list = [
            ...(await api.getThreadList(1, null, ["PENDING"])),
            ...(await api.getThreadList(1, null, ["OTHER"]))
          ];
          if (list[0]) {
            api.sendMessage(
              "This thread was automatically approved by our system.",
              list[0].threadID
            );
            logger(`[pending] Approved thread: ${list[0].threadID}`);
          }
        } catch (err) {
          logger(`[pending] Error: ${err}`);
        }
      }, config.time * 60 * 1000);
    }
  }

  function keepAlive(config) {
    if (config.status) {
      setInterval(async () => {
        try {
          await api.getCurrentUserID();
          logger("[keepAlive] Session refreshed.");
        } catch (err) {
          logger("[keepAlive] Error refreshing session:", err);
        }
      }, config.interval);
    }
  }

  autosetbio(configCustom.autosetbio);
  greetings(configCustom.greetings);
  acceptPending(configCustom.acceptPending);
  keepAlive(configCustom.keepAlive);

  logger("[SYSTEM] Autosystem is running...");
};
