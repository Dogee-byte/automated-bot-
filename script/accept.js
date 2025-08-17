const moment = require("moment-timezone");

if (!global.Utils) global.Utils = {};

global.Utils.handleReply = async function ({ api, event, listRequest }) {
  const { threadID, messageID, body } = event;

  if (!body) return;

  const cmd = body.trim().split(" ");
  const action = cmd[0].toLowerCase();

  const form = {
    av: api.getCurrentUserID(),
    fb_api_caller_class: "RelayModern",
    variables: {
      input: {
        source: "friends_tab",
        actor_id: api.getCurrentUserID(),
        client_mutation_id: Math.round(Math.random() * 19).toString(),
      },
      scale: 3,
      refresh_num: 0,
    },
  };

  const success = [];
  const failed = [];

  if (action === "confirm") {
    form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
    form.doc_id = "3147613905362928";
  } else if (action === "del") {
    form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
    form.doc_id = "4108254489275063";
  } else {
    return api.sendMessage('❗ Please use: <confirm | del> <order | all>', threadID, messageID);
  }

  let targetIDs = cmd.slice(1);
  if (cmd[1] === "all") targetIDs = listRequest.map((_, i) => i + 1);

  const promiseFriends = [];
  const newTargetIDs = [];

  for (const stt of targetIDs) {
    const u = listRequest[parseInt(stt) - 1];
    if (!u) {
      failed.push(`❌ Stt ${stt} not found in the list`);
      continue;
    }
    form.variables.input.friend_requester_id = u.node.id;
    form.variables = JSON.stringify(form.variables);
    newTargetIDs.push(u);
    promiseFriends.push(api.httpPost("https://www.facebook.com/api/graphql/", form));
    form.variables = JSON.parse(form.variables);
  }

  for (let i = 0; i < newTargetIDs.length; i++) {
    try {
      const friendRequest = await promiseFriends[i];
      if (JSON.parse(friendRequest).errors) failed.push(newTargetIDs[i].node.name);
      else success.push(newTargetIDs[i].node.name);
    } catch (e) {
      failed.push(newTargetIDs[i].node.name);
    }
  }

  api.sendMessage(
    `✅ Successfully ${action === "confirm" ? "confirmed" : "deleted"} ${success.length} request(s):\n${success.join("\n")}${failed.length > 0 ? `\n❌ Failed: ${failed.join("\n")}` : ""}`,
    threadID,
    messageID
  );
};

module.exports.config = {
  name: "accept",
  version: "1.0.4",
  role: 2,
  aliases: ["friend"],
  credits: "BLACK (fixed by AJ)",
  description: "Confirm or delete friend requests via Facebook ID",
  cooldown: 0,
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;

  const form = {
    av: api.getCurrentUserID(),
    fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
    fb_api_caller_class: "RelayModern",
    doc_id: "4499164963466303",
    variables: JSON.stringify({ input: { scale: 3 } }),
  };

  const res = await api.httpPost("https://www.facebook.com/api/graphql/", form);
  const listRequest = JSON.parse(res).data.viewer.friending_possibilities.edges;

  if (!listRequest || listRequest.length === 0) {
    return api.sendMessage("✨ No pending friend requests.", threadID, messageID);
  }

  let msg = "";
  let i = 0;
  for (const user of listRequest) {
    i++;
    msg +=
      `\n${i}. 𝐍𝐚𝐦𝐞: ${user.node.name}` +
      `\n𝐈𝐃: ${user.node.id}` +
      `\n𝐔𝐫𝐥: ${user.node.url.replace("www.facebook", "fb")}` +
      `\n𝐓𝐢𝐦𝐞: ${moment(user.time * 1000)
        .tz("Asia/Manila")
        .format("DD/MM/YYYY HH:mm:ss")}\n`;
  }

  return api.sendMessage(
    `${msg}\n\nReply with: <confirm | del> <order | all> to take action`,
    threadID,
    (err, info) => {
      if (!err) {
        // gamitin ang global.Utils.handleReply
        global.GoatBot.onReply.set(info.messageID, {
          commandName: module.exports.config.name,
          messageID: info.messageID,
          author: event.senderID,
          listRequest,
          handleReply: global.Utils.handleReply
        });
      }
    },
    messageID
  );
};
