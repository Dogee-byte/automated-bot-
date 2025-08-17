const moment = require("moment-timezone");

module.exports.config = {
  name: "accept",
  version: "1.0.3",
  role: 2,
  aliases: ["friend"],
  credits: "BLACK (fixed by AJ)",
  description: "Confirm or delete friend requests via Facebook ID",
  cooldown: 0,
};

module.exports.handleReply = async function ({ api, event, Reply }) {
  const { listRequest } = Reply;
  const { threadID, messageID, body, senderID } = event;

  if (senderID !== Reply.author)
    return api.sendMessage("❗ Ikaw lang ang pwedeng gumamit ng reply na ito.", threadID, messageID);

  const args = body.trim().split(/\s+/);
  const action = args[0]?.toLowerCase();

  const baseForm = {
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
    baseForm.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
    baseForm.doc_id = "3147613905362928";
  } else if (action === "del") {
    baseForm.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
    baseForm.doc_id = "4108254489275063";
  } else {
    return api.sendMessage(
      '❗ Please use: <confirm | del> <order | all>',
      threadID,
      messageID
    );
  }

  if (!args[1]) return api.sendMessage("❗ Wrong command. Example: confirm 1 o del all", threadID, messageID);

  let targetIDs = args.slice(1);

  if (args[1] === "all") {
    targetIDs = [];
    for (let i = 1; i <= listRequest.length; i++) targetIDs.push(i);
  }

  const newTargetIDs = [];
  const promiseFriends = [];

  for (const stt of targetIDs) {
    const u = listRequest[parseInt(stt) - 1];
    if (!u) {
      failed.push(`❌ Stt ${stt} not found in the list`);
      continue;
    }

    // Clone baseForm para hindi magulo
    const tempForm = { ...baseForm };
    tempForm.variables = JSON.stringify({
      ...baseForm.variables,
      input: {
        ...baseForm.variables.input,
        friend_requester_id: u.node.id,
      },
    });

    newTargetIDs.push(u);
    promiseFriends.push(api.httpPost("https://www.facebook.com/api/graphql/", tempForm));
  }

  for (let i = 0; i < newTargetIDs.length; i++) {
    try {
      const friendRequest = await promiseFriends[i];
      if (JSON.parse(friendRequest).errors) {
        failed.push(newTargetIDs[i].node.name);
      } else {
        success.push(newTargetIDs[i].node.name);
      }
    } catch (e) {
      failed.push(newTargetIDs[i].node.name);
    }
  }

  api.sendMessage(
    `✅ ${action === "confirm" ? "Confirmed" : "Deleted"} ${success.length} request(s):\n${success.join("\n")}${
      failed.length > 0 ? `\n❌ Failed: ${failed.join("\n")}` : ""
    }`,
    threadID,
    messageID
  );
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

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
        global.GoatBot.onReply.set(info.messageID, {
          commandName: module.exports.config.name,
          messageID: info.messageID,
          author: senderID,
          listRequest,
        });
      }
    },
    messageID
  );
};
