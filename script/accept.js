const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "accept",
    version: "1.0.0",
    description: "Accept or Delete friend requests",
    credits: "ARI convert",
    usage: "[add/del] [order | all]",
    cooldown: 5
  },

  onStart: async function ({ api, event }) {
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
      return api.sendMessage("✅ No pending friend requests!", event.threadID);
    }

    let text = "=== Pending Friend Requests ===";
    let i = 0;
    for (const user of listRequest) {
      i++;
      text += `\n\n${i}. Name: ${user.node.name}\nID: ${user.node.id}\nURL: ${user.node.url.replace("www.facebook","fb")}\nTime: ${moment(user.time * 1000).tz("Asia/Manila").format("DD/MM/yyyy HH:mm:ss")}`;
    }

    api.sendMessage(`${text}\n\nReply: add <no.|all> or del <no.|all>`, event.threadID, (err, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: "accept",
        messageID: info.messageID,
        listRequest,
        author: event.senderID
      });
    });
  },

  onReply: async function ({ api, event, Reply }) {
    if (event.senderID != Reply.author) return;
    
    const { listRequest } = Reply;
    const args = event.body.trim().split(/\s+/);
    const action = args[0].toLowerCase();

    if (!["add", "del"].includes(action)) {
      return api.sendMessage("Wrong format! Example: add 1 or del all", event.threadID, event.messageID);
    }

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
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
      form.doc_id = "3147613905362928";
    } else {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
      form.doc_id = "4108254489275063";
    }

    let targets = args.slice(1);
    if (targets[0] === "all") {
      targets = listRequest.map((_, idx) => idx + 1);
    }

    const success = [], failed = [];
    for (const stt of targets) {
      const user = listRequest[parseInt(stt) - 1];
      if (!user) {
        failed.push(`ID ${stt} not found`);
        continue;
      }

      form.variables.input.friend_requester_id = user.node.id;
      form.variables = JSON.stringify(form.variables);

      try {
        const rq = await api.httpPost("https://www.facebook.com/api/graphql/", form);
        const js = JSON.parse(rq);
        if (js.errors) failed.push(user.node.name);
        else success.push(user.node.name);
      } catch (err) {
        failed.push(user.node.name);
      }
      form.variables = JSON.parse(form.variables);
    }

    return api.sendMessage(
      `✅ ${action === "add" ? "Accepted" : "Deleted"} ${success.length}:\n${success.join("\n")}\n\n❌ Failed (${failed.length}):\n${failed.join("\n")}`,
      event.threadID,
      event.messageID
    );
  }
};
