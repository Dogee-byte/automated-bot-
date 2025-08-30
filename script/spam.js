module.exports.config = {
  name: "spam",
  version: "1.0",
  author: "kim/zed", // Converted by ari
  role: 2,
};

module.exports.run = async function ({ api, event, args }) {
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
};
