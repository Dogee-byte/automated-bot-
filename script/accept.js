import moment from "moment-timezone";

export const config = {
  name: "accept",
  version: "1.0.0",
  credits: "BLACK (convert by ari)",
  permissions: [2],
  description: "Accept / Delete friend requests via Facebook ID",
  usages: "accept",
  cooldowns: 5,
};

async function onReply({ event, api, Reply, args, data }) {
  const { body, messageID } = event;
  const listRequest = data.listRequest;

  const cmd = body.trim().toLowerCase().split(" ");
  if (!["add", "del"].includes(cmd[0]))
    return api.sendMessage(
      `❌ Wrong format!\nUse: add <number | all> or del <number | all>`,
      event.threadID,
      event.messageID
    );

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

  if (cmd[0] === "add") {
    form.fb_api_req_friendly_name =
      "FriendingCometFriendRequestConfirmMutation";
    form.doc_id = "3147613905362928";
  } else {
    form.fb_api_req_friendly_name =
      "FriendingCometFriendRequestDeleteMutation";
    form.doc_id = "4108254489275063";
  }

  let targets = cmd.slice(1);
  if (targets[0] === "all") {
    targets = listRequest.map((_, idx) => idx + 1);
  }

  const success = [],
    failed = [];

  for (const stt of targets) {
    const user = listRequest[parseInt(stt) - 1];
    if (!user) {
      failed.push(`ID ${stt} not found`);
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
    } catch (e) {
      failed.push(user.node.name);
    }
    form.variables = JSON.parse(form.variables);
  }

  api.sendMessage(
    `✅ ${cmd[0] == "add" ? "Accepted" : "Deleted"} ${
      success.length
    } friend request(s):\n${success.join(
      "\n"
    )}\n\n❌ Failed (${failed.length}): ${failed.join("\n")}`,
    event.threadID,
    messageID
  );
}

// === Command Call === //
export async function onCall({ message, api, event, args }) {
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
    const listRequest = JSON.parse(dataRes).data.viewer.friending_possibilities
      .edges;

    if (!listRequest || listRequest.length == 0)
      return api.sendMessage(
        "No pending friend requests.",
        event.threadID,
        event.messageID
      );

    let msg = "=== Pending Friend Requests ===";
    let count = 0;
    for (const user of listRequest) {
      count++;
      msg += `\n\n${count}. Name: ${user.node.name}\nID: ${user.node.id}\nURL: ${user.node.url.replace(
        "www.facebook",
        "fb"
      )}\nTime: ${moment(user.time * 1000)
        .tz("Asia/Manila")
        .format("DD/MM/YYYY HH:mm:ss")}`;
    }

    api.sendMessage(
      msg + `\n\nReply:\nadd <number|all> or del <number|all>`,
      event.threadID,
      (err, info) => {
        global.client.handleReply.push({
          name: config.name,
          messageID: info.messageID,
          listRequest,
          author: event.senderID,
          type: "acceptFriend",
        });
      }
    );
  } catch (e) {
    api.sendMessage(`${e}`, event.threadID, event.messageID);
  }
}

// Register reply handler
export const handleReply = async function (o) {
  if (o.type !== "acceptFriend") return;
  await onReply(o);
};
