const moment = require("moment-timezone");

module.exports.config = {
  name: "accept",
  version: "1.0.1",
  description: "Accept or Delete friend requests via command",
  cooldowns: 5,
  permissions: [0], 
  credits: "BLACK (Fixed by ARI)",
  usages: "/accept",
};

module.exports.onCall = async function ({ api, event }) {
  const form = {
    av: api.getCurrentUserID(),
    fb_api_req_friendly_name:
      "FriendingCometFriendRequestsRootQueryRelayPreloader",
    fb_api_caller_class: "RelayModern",
    doc_id: "4499164963466303",
    variables: JSON.stringify({ input: { scale: 3 } }),
  };

  try {
    const dataRes = await api.httpPost(
      "https://www.facebook.com/api/graphql/",
      form
    );
    const listRequest = JSON.parse(dataRes).data.viewer
      .friending_possibilities.edges;

    if (!listRequest || listRequest.length === 0) {
      return api.sendMessage(
        "✅ No pending friend requests.",
        event.threadID,
        event.messageID
      );
    }

    let msg = "=== Pending Friend Requests ===";
    let i = 0;
    for (const user of listRequest) {
      i++;
      msg += `\n\n${i}. Name: ${user.node.name}\nID: ${user.node.id}\nURL: ${user.node.url.replace(
        "www.facebook",
        "fb"
      )}\nTime: ${moment(user.time * 1000)
        .tz("Asia/Manila")
        .format("DD/MM/YYYY HH:mm:ss")}`;
    }

    api.sendMessage(
      msg + `\n\nReply:\nadd <number|all>  OR  del <number|all>`,
      event.threadID,
      (err, info) => {
        if (err) return;
        global.client.handleReply.push({
          name: module.exports.config.name, 
          messageID: info.messageID,
          listRequest,
          author: event.senderID,
          type: "acceptFriend",
        });
      }
    );
  } catch (err) {
    return api.sendMessage(
      `Error fetching requests:\n${err}`,
      event.threadID,
      event.messageID
    );
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { body, messageID, senderID, threadID } = event;
  const { author, listRequest, type } = handleReply;

  if (senderID !== author || type !== "acceptFriend") return;

  const args = body.trim().split(/\s+/);
  const action = args[0].toLowerCase();

  if (!["add", "del"].includes(action)) {
    return api.sendMessage(
      `⚠️ Wrong format!\nUse: add <number|all>  or  del <number|all>`,
      threadID,
      messageID
    );
  }

  // Build form
  const form = {
    av: api.getCurrentUserID(),
    fb_api_caller_class: "RelayModern",
    variables: {
      input: {
        source: "friends_tab",
        actor_id: api.getCurrentUserID(),
        client_mutation_id: Math.round(Math.random() * 19) + "",
      },
      scale: 3,
      refresh_num: 0,
    },
  };

  if (action === "add") {
    form.fb_api_req_friendly_name =
      "FriendingCometFriendRequestConfirmMutation";
    form.doc_id = "3147613905362928";
  } else {
    form.fb_api_req_friendly_name =
      "FriendingCometFriendRequestDeleteMutation";
    form.doc_id = "4108254489275063";
  }

  // Target indexes
  let targets = args.slice(1);
  if (targets[0] === "all") {
    targets = listRequest.map((_, index) => index + 1);
  }

  const success = [],
    failed = [];

  for (const stt of targets) {
    const user = listRequest[parseInt(stt) - 1];
    if (!user) {
      failed.push(`ID#${stt} not found`);
      continue;
    }

    form.variables.input.friend_requester_id = user.node.id;
    form.variables = JSON.stringify(form.variables);

    try {
      const res = await api.httpPost(
        "https://www.facebook.com/api/graphql/",
        form
      );
      const json = JSON.parse(res);
      if (json.errors) failed.push(user.node.name);
      else success.push(user.node.name);
    } catch (err) {
      failed.push(user.node.name);
    }
    form.variables = JSON.parse(form.variables);
  }

  return api.sendMessage(
    `✅ ${action === "add" ? "Accepted" : "Deleted"} ${success.length
    } request(s):\n${success.join(
      "\n"
    )}\n\n❌ Failed (${failed.length}): ${failed.join("\n")}`,
    threadID,
    messageID
  );
};
