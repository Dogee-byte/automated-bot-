module.exports.config = {
  name: "accept",
  version: "1.0.4",
  role: 0,
  credits: "BLACK (fixed by Ari)",
  description: "Manage friend requests (confirm or delete)",
  usage: "accept",
  cooldowns: 3,
};

module.exports.onCall = async function ({ message, api }) {
  try {
    const form = {
      av: api.getCurrentUserID(),
      fb_api_req_friendly_name:
        "FriendingCometFriendRequestsRootQueryRelayPreloader",
      fb_api_caller_class: "RelayModern",
      doc_id: "4499164963466303",
      variables: JSON.stringify({ input: { scale: 3 } }),
    };

    const raw = await api.httpPost("https://www.facebook.com/api/graphql/", form);
    let res;
    try {
      res = JSON.parse(raw);
    } catch (err) {
      console.error("❌ JSON parse error:", raw);
      return message.reply("❌ Failed to parse response from Facebook.");
    }

    const listRequest = res?.data?.viewer?.friending_possibilities?.edges || [];
    if (listRequest.length === 0)
      return message.reply("✅ No pending friend requests.");

    let msg = "📥 Friend Requests:\n";
    listRequest.forEach((user, i) => {
      const date = new Date(user.time * 1000).toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
      });
      msg +=
        `\n${i + 1}. 👤 Name: ${user.node.name}` +
        `\n🆔 ID: ${user.node.id}` +
        `\n🔗 Url: ${user.node.url.replace("www.facebook", "fb")}` +
        `\n⏰ Time: ${date}\n`;
    });

    const info = await message.reply(
      `${msg}\n\n📌 Reply with:\n- confirm <number | all>\n- del <number | all>`
    );

    global.GoatBot.onReply.set(info.messageID, {
      commandName: module.exports.config.name,
      messageID: info.messageID,
      author: message.senderID,
      listRequest,
    });
  } catch (err) {
    console.error("❌ onCall error:", err);
    return message.reply("⚠️ Something went wrong.");
  }
};

module.exports.handleReply = async function ({ event, api, Reply, message }) {
  if (event.senderID !== Reply.author) return;

  const { body } = event;
  const { listRequest } = Reply;

  const args = body.trim().toLowerCase().split(/\s+/);
  const action = args[0]; // confirm or del
  let targetIDs = args.slice(1);

  if (!["confirm", "del"].includes(action)) {
    return message.reply('❌ Invalid action. Use "confirm" or "del".');
  }

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
    form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
    form.doc_id = "3147613905362928";
  } else if (action === "del") {
    form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
    form.doc_id = "4108254489275063";
  }

  if (args[1] === "all") {
    targetIDs = [];
    for (let i = 1; i <= listRequest.length; i++) targetIDs.push(i);
  }

  const success = [];
  const failed = [];

  for (const stt of targetIDs) {
    const u = listRequest[parseInt(stt) - 1];
    if (!u) {
      failed.push(`❌ Stt ${stt} not found`);
      continue;
    }

    form.variables.input.friend_requester_id = u.node.id;
    const sendForm = { ...form, variables: JSON.stringify(form.variables) };

    try {
      const raw = await api.httpPost("https://www.facebook.com/api/graphql/", sendForm);
      const res = JSON.parse(raw);

      if (res?.errors) {
        console.error("❌ GraphQL error:", res.errors);
        failed.push(u.node.name);
      } else {
        success.push(u.node.name);
      }
    } catch (e) {
      console.error("❌ Request error:", e);
      failed.push(u.node.name);
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
};
