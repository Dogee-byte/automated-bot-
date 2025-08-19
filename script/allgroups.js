module.exports.config = {
  name: "allgroups",
  version: "2.0.3",
  permission: 2,
  credits: "ari",
  description: "Show all groups and manage ban/out",
  prefix: true,
  premium: false,
  category: "admin",
  usages: "groups",
  cooldowns: 5,
};

module.exports.handleReply = async function({ api, event, handleReply, Threads }) {
  // only allow the author of the command to reply
  if (event.senderID != handleReply.author) return;

  const args = event.body.trim().split(" ");
  const command = args[0]?.toLowerCase();
  const index = parseInt(args[1]) - 1;

  if (isNaN(index) || index < 0 || index >= handleReply.groupid.length) {
    return api.sendMessage("⚠️ Invalid number.", event.threadID, event.messageID);
  }

  const idgr = handleReply.groupid[index];

  if (command === "out") {
    try {
      await api.removeUserFromGroup(api.getCurrentUserID(), idgr);
      api.sendMessage(`🚪 Bot has left the group: ${idgr}`, event.threadID, event.messageID);
    } catch (e) {
      api.sendMessage(`❌ Failed to leave group ${idgr}\n${e}`, event.threadID, event.messageID);
    }
  } else if (command === "ban") {
    try {
      const data = (await Threads.getData(idgr)).data || {};
      data.banned = 1;
      await Threads.setData(idgr, { data });
      global.data.threadBanned.set(parseInt(idgr), 1);
      api.sendMessage(`✅ Group banned: ${idgr}`, event.threadID, event.messageID);
    } catch (e) {
      api.sendMessage(`❌ Failed to ban group ${idgr}\n${e}`, event.threadID, event.messageID);
    }
  } else {
    api.sendMessage("⚠️ Invalid command. Use:\nout <number>\nban <number>", event.threadID, event.messageID);
  }
};

module.exports.run = async function({ api, event }) {
  try {
    const inbox = await api.getThreadList(100, null, ["INBOX"]);
    const groupList = inbox.filter(thread => thread.isGroup && thread.isSubscribed);

    if (groupList.length === 0) {
      return api.sendMessage("⚠️ No groups found.", event.threadID, event.messageID);
    }

    const threadInfoList = [];
    for (const group of groupList) {
      const info = await api.getThreadInfo(group.threadID);
      threadInfoList.push({
        id: group.threadID,
        name: group.name || "Unnamed Group",
        members: info.userInfo.length
      });
    }

    // sort by members count (desc)
    threadInfoList.sort((a, b) => b.members - a.members);

    let msg = "📋 Group List:\n\n";
    const groupid = [];
    let i = 1;
    for (const group of threadInfoList) {
      msg += `${i}. ${group.name}\n   🆔: ${group.id}\n   👥 Members: ${group.members}\n\n`;
      groupid.push(group.id);
      i++;
    }

    msg += "Reply with:\n- out <number> = leave group\n- ban <number> = ban group";

    api.sendMessage(msg, event.threadID, (err, data) => {
      if (err) return;
      global.client.handleReply.push({
        name: module.exports.config.name,
        author: event.senderID,
        messageID: data.messageID,
        groupid,
        type: "reply"
      });
    });
  } catch (e) {
    api.sendMessage(`❌ Error: ${e}`, event.threadID, event.messageID);
  }
};
