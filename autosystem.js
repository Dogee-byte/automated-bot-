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
      sleep: `Good night everyone, tama na relapse wala nang pake sayo yun.`,
      note: "Greetings every morning, afternoon and evening. Timezone: Asia/Manila"
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

  // 🔹 Greetings
  async function greetings(config) {
    if (config.status) {
      try {
        const schedule = [
          { timer: "5:00:00 AM", message: config.morning },
          { timer: "11:00:00 AM", message: config.afternoon },
          { timer: "6:00:00 PM", message: config.evening },
          { timer: "10:00:00 PM", message: config.sleep }
        ];
        const userID = await api.getCurrentUserID();

        setInterval(() => {
          const now = new Date(Date.now() + 25200000) // +7 hours offset (Asia/Manila)
            .toLocaleTimeString("en-US", { hour12: true });
          const match = schedule.find((s) => s.timer === now);

          if (match) {
            const allThread = global.data?.allThreadID?.get(userID) || [];
            allThread.forEach((threadID) => {
              api.sendMessage(match.message, threadID);
            });
            logger(`[greetings] Sent: ${match.message}`);
          }
        }, 1000 * 60); // check every minute
      } catch (error) {
        logger(`[greetings] Error: ${error}`);
      }
    }
  }

  // 🔹 Auto Accept Pending
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

  // 🔹 Keep Alive (para hindi mag-log out ang AppState)
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

  // Run systems
  autosetbio(configCustom.autosetbio);
  greetings(configCustom.greetings);
  acceptPending(configCustom.acceptPending);
  keepAlive(configCustom.keepAlive);

  logger("[SYSTEM] Autosystem is running...");
};
