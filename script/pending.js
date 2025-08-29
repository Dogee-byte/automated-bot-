module.exports.config = { 
  name: "pending", 
  version: "1.0.1", 
  role: 0, 
  hasPrefix: true, 
  aliases: [], 
  description: "Approve or deny pending group requests", 
  usage: "pending", 
  credits: "Ari (fix by Lennon" 
};

module.exports.run = async function({ api, event }) { 
  try {
    if (!global.botID) global.botID = api.getCurrentUserID();

    const SPAM = (await api.getThreadList(100, null, ["OTHER"])) || []; 
    const PENDING = (await api.getThreadList(100, null, ["PENDING"])) || []; 
    const pendingThread = [...SPAM, ...PENDING].filter(thread => thread.isGroup && thread.isSubscribed);

    if (pendingThread.length === 0) {
      return api.sendMessage("✅ No pending threads found.", event.threadID);
    }

    let msg = "📌 Pending Threads:\n";
    msg += pendingThread.map((t, i) => `${i+1}. ${t.name} (${t.threadID})`).join("\n");
    msg += "\n\nReply with:\n - approve <index>\n - deny <index>";

    return api.sendMessage(msg, event.threadID, (err, info) => {
      if (err) return console.error(err);

      if (!global.client.handleReply) global.client.handleReply = [];
      global.client.handleReply.push({
        type: "pending",
        name: module.exports.config.name,
        messageID: info.messageID,
        author: event.senderID,
        pendingThread,
        callback: module.exports.callback
      });
    });

  } catch (e) {
    console.error(e);
    return api.sendMessage("❌ Error while running pending command.", event.threadID);
  }
};

module.exports.callback = async function({ api, event, Reply }) {
  try {
    if (event.senderID !== Reply.author) return;
    const { pendingThread } = Reply;

    const args = event.body.trim().split(" ");
    const action = args[0];
    const index = parseInt(args[1]) - 1;

    if (isNaN(index) || index < 0 || index >= pendingThread.length) {
      return api.sendMessage("⚠ Invalid index.", event.threadID);
    }

    const target = pendingThread[index];
    if (action === "approve") {
      api.sendMessage(`✅ Approved group: ${target.name}`, target.threadID);
      return api.sendMessage(`You approved ${target.name}`, event.threadID);
    } else if (action === "deny") {
      api.sendMessage(`❌ Denied group: ${target.name}`, target.threadID);
      return api.sendMessage(`You denied ${target.name}`, event.threadID);
    } else {
      return api.sendMessage("⚠ Invalid action. Use approve/deny.", event.threadID);
    }
  } catch (e) {
    console.error(e);
    return api.sendMessage("❌ Error inside callback.", event.threadID);
  }
};
