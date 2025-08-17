import moment from "moment-timezone";

export const config = {
  name: "accept",
  version: "1.0.1",
  credits: "BLACK (convert by ARI)",
  description: "Manage friend requests (confirm or delete)",
  usages: "accept",
  cooldowns: 3
};

export async function onCall({ message, api }) {
  const form = {
    av: api.getCurrentUserID(),
    fb_api_req_friendly_name:
      "FriendingCometFriendRequestsRootQueryRelayPreloader",
    fb_api_caller_class: "RelayModern",
    doc_id: "4499164963466303",
    variables: JSON.stringify({ input: { scale: 3 } }),
  };

  const listRequest = JSON.parse(
    await api.httpPost("https://www.facebook.com/api/graphql/", form)
  ).data.viewer.friending_possibilities.edges;

  if (listRequest.length === 0)
    return message.reply("✅ No pending friend requests.");

  let msg = "📥 Friend Requests:\n";
  let i = 0;
  for (const user of listRequest) {
    i++;
    msg +=
      `\n${i}. 👤 Name: ${user.node.name}` +
      `\n🆔 ID: ${user.node.id}` +
      `\n🔗 Url: ${user.node.url.replace("www.facebook", "fb")}` +
      `\n⏰ Time: ${moment(user.time * 1000) 
        .tz("Asia/Manila")
        .format("DD/MM/YYYY HH:mm:ss")}\n`;
  }

  const info = await message.reply(
    `${msg}\n\n📌 Reply this message with:\n- confirm <number | all>\n- del <number | all>`
  );

  global.GoatBot.onReply.set(info.messageID, {
    commandName: config.name,
    messageID: info.messageID,
    author: message.senderID,
    listRequest
  });
}

export async function handleReply({ event, api, Reply, message }) {
  if (event.senderID !== Reply.author) return;

  const { body } = event;
  const { listRequest } = Reply;

  const args = body.trim().toLowerCase().split(/\s+/);

  const action = args[0]; // confirm or del
  let targetIDs = args.slice(1);

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

  if (action === "confirm") {
    form.fb_api_req_friendly_name =
      "FriendingCometFriendRequestConfirmMutation";
    form.doc_id = "3147613905362928";
  } else if (action === "del") {
    form.fb_api_req_friendly_name =
      "FriendingCometFriendRequestDeleteMutation";
    form.doc_id = "4108254489275063";
  } else {
    return message.reply('❌ Invalid action. Use "confirm" or "del".');
  }

  if (args[1] === "all") {
    targetIDs = [];
    const lengthList = listRequest.length;
    for (let i = 1; i <= lengthList; i++) targetIDs.push(i);
  }

  const success = [];
  const failed = [];
  const newTargetIDs = [];
  const promiseFriends = [];

  for (const stt of targetIDs) {
    const u = listRequest[parseInt(stt) - 1];
    if (!u) {
      failed.push(`❌ Stt ${stt} not found`);
      continue;
    }
    form.variables.input.friend_requester_id = u.node.id;
    form.variables = JSON.stringify(form.variables);
    newTargetIDs.push(u);
    promiseFriends.push(
      api.httpPost("https://www.facebook.com/api/graphql/", form)
    );
    form.variables = JSON.parse(form.variables);
  }

  const lengthTarget = newTargetIDs.length;
  for (let i = 0; i < lengthTarget; i++) {
    try {
      const friendRequest = await promiseFriends[i];
      if (JSON.parse(friendRequest).errors)
        failed.push(newTargetIDs[i].node.name);
      else success.push(newTargetIDs[i].node.name);
    } catch (e) {
      failed.push(newTargetIDs[i].node.name);
    }
  }

  message.reply(
    `✅ Action: ${action}\n\n` +
      (success.length > 0
        ? `🎉 Success (${success.length}):\n${success.join("\n")}\n`
        : "") +
      (failed.length > 0
        ? `⚠️ Failed (${failed.length}):\n${failed.join("\n")}`
        : "")
  );
}
