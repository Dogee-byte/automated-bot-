// index.js or main.js
const login = require("fb-chat-api");
const fs = require("fs");
const path = require("path");

const appState = require("./appstate.json");

global.client = {};
global.client.commands = new Map();
global.client.handleReply = [];
global.client.handleReaction = [];

global.data = {};
global.data.threadBanned = new Map();

const commandFiles = fs.readdirSync(__dirname + "/modules/commands").filter(f => f.endsWith(".js"));
for (const file of commandFiles) {
  const cmd = require(`./modules/commands/${file}`);
  global.client.commands.set(cmd.config.name, cmd);
  console.log("Loaded command:", cmd.config.name);
}

login({ appState }, (err, api) => {
  if (err) return console.error("FB login failed:", err);

  api.setOptions({ listenEvents: true, autoMarkDelivery: true });

  api.listenMqtt(async (err, event) => {
    if (err) return console.error(err);

    if (event.type === "message" || event.type === "message_reply") {
      const body = event.body;
      const prefix = "!";  

      if (global.client.handleReply.length > 0) {
        const replyData = global.client.handleReply.find(x => x.messageID == event.messageID);
        if (replyData) {
          const cmd = global.client.commands.get(replyData.name);
          if (cmd && typeof cmd.handleReply === "function") {
            return cmd.handleReply({ api, event, handleReply: replyData });
          }
        }
      }

      if (body && body.startsWith(prefix)) {
        const args = body.slice(prefix.length).trim().split(/\s+/);
        const cmdName = args.shift().toLowerCase();

        const command = global.client.commands.get(cmdName);
        if (!command) return;

        try {
          command.run({ api, event, args });
        } catch (err) {
          console.log("Error:", err);
        }
      }
    }

    // (Optional) handle reactions
    if (event.type === "message_reaction") {
      const reactData = global.client.handleReaction.find(x => x.messageID == event.messageID);
      if (reactData) {
        const command = global.client.commands.get(reactData.name);
        if (command && typeof command.handleReaction === "function") {
          return command.handleReaction({ api, event, handleReaction: reactData });
        }
      }
    }
  });
});
