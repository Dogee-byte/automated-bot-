module.exports = {
  config: {
    name: "spam",
    aliases: [],
    version: "1.0",
    author: "kim/zed", // onvert by ari
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Spam a message multiple times"
    },
    longDescription: {
      en: "Send a message repeatedly in the current chat"
    },
    category: "fun",
    guide: {
      en: "{p}spam <amount> <message>"
    }
  },

  onStart: async function ({ api, event, args }) {
    const amount = parseInt(args[0]);
    const message = args.slice(1).join(" ");

    if (isNaN(amount) || !message) {
      return api.sendMessage(
        "❌ Invalid usage.\n\nCorrect: {p}spam <amount> <message>",
        event.threadID,
        event.messageID
      );
    }

    for (let i = 0; i < amount; i++) {
      api.sendMessage(message, event.threadID);
    }
  }
}; 
