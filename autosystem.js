module.exports = async ({ api }) => {
  const logger = console.log;

  const configCustom = {
    autosetbio: {
      status: false,
      bio: `Prefix : ${global.config?.PREFIX || "!"}`,
      note: "Automatically change the bot bio."
    },
    greetings: {
      status: true,
      morning: `Good morning everyone, have a nice day.`,
      afternoon: `Good afternoon everyone, don't forget to eat your lunch.`,
      evening: `Good evening everyone, don't forget to eat dinner.`,
      sleep: `Good night everyone, mag r-relapse na naman yung tanaga dyan`,

      breakfast: "🍳🥖 Breakfast check! Don't skip the most important meal of the day 💪",
      noon: "🍲 It's high noon! Time for lunch, recharge your energy 🔋",
      merienda: "🍪 Coffee or milk tea break? Merienda time ☕🥤",
      dinner: "🍛 Dinner o'clock! Eat well and enjoy your meal 🥢🍗",
      midnight: "🌙 Midnight vibes 🌌 — sino gising pa? tama na kaka-relapse hoyy",
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
          { timer: "5:00:00 AM", message: config.morning },
          { timer: "11:00:00 AM", message: config.afternoon },
          { timer: "6:00:00 PM", message: config.evening },
          { timer: "10:00:00 PM", message: config.sleep },

          { timer: "7:00:00 AM", message: config.breakfast },
          { timer: "12:00:00 PM", message: config.noon },
          { timer: "3:00:00 PM", message: config.merienda },
          { timer: "7:00:00 PM", message: config.dinner },
          { timer: "12:00:00 AM", message: config.midnight },
          { timer: "2:00:00 AM", message: config.lateNight }
        ];

        const userID = await api.getCurrentUserID();

        setInterval(() => {
          const now = new Date(Date.now() + 25200000) 
            .toLocaleTimeString("en-US", { hour12: true });
          const match = schedule.find((s) => s.timer === now);

          if (match) {
            const allThread = global.data?.allThreadID?.get(userID) || [];
            allThread.forEach((threadID) => {
              api.sendMessage(match.message, threadID);
            });
            logger(`[greetings] Sent: ${match.message}`);
          }

          const day = new Date().toLocaleDateString("en-US", {
            weekday: "long",
            timeZone: "Asia/Manila"
          });

          if ((day === "Saturday" || day === "Sunday") && now === "9:00:00 AM") {
            api.sendMessage(config.weekend, userID);
          } else if (day === "Monday" && now === "8:00:00 AM") {
            api.sendMessage(config.monday, userID);
          } else if (day === "Friday" && now === "8:00:00 PM") {
            api.sendMessage(config.friday, userID);
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
          await api.getCurrentUserID(); // simple call to keep session alive
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
