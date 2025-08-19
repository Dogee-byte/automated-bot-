module.exports.config = {
  name: "allgroups",
  version: "2.0.2",
  permission: 2,
  credits: "ari (fixed by GPT)",
  description: "Show all groups and manage ban/out",
  prefix: true,
  premium: false,
  category: "admin",
  usages: "groups",
  cooldowns: 5,
};

module.exports.handleReply = async function({ api, event, Threads, handleReply }) {
  if (parseInt(event.senderID) !== parseInt(handleReply.author)) return;

  const args = event.body.trim().split(" ");
  const command = args[0].toLowerCase();
  const index = parseInt(args[1]) - 1;

  if (isNaN(index) || index < 0 || index >= handleReply.groupid.length) {
    return api.sendMessage("⚠️ Invalid number.", event.threadID, event.messageID);
  }

  const idgr = handleReply.groupid[index];

  switch (handleReply.type) {
    case "reply": {
      if (command === "ban") {
        const data = (await Threads.getData(idgr)).data || {};
        data.banned = 1;
        await Threads.setData(idgr, { data });
        global.data.threadBanned.set(parseInt(idgr), 1);
        api.sendMessage(`✅ Successfully banned group ID: ${idgr}`, event.threadID, event.messageID);
      } 
      else if (command === "out") {
        try {
          await api.removeUserFromGroup(api.getCurrentUserID(), idgr);
          api.sendMessage(`🚪 Bot has left the group: ${idgr}`, event.threadID, event.messageID);
        } catch (err) {
          api.sendMessage(`❌ Failed to leave group ${idgr}\n${err}`, event.threadID, event.messageID);
        }
      } 
      else {
        api.sendMessage("⚠️ Invalid command. Use: out <number> or ban <number>", event.threadID, event.messageID);
      }
      break;
    }
  }
};

module.exports.run = async function({ api, event, botID }) {
  const inbox = await api.getThreadList(100, null, ["INBOX"]);
  const groupList = inbox.filter(thread => thread.isGroup && thread.isSubscribed);

  const threadInfoList = [];
  for (const group of groupList) {
    const info = await api.getThreadInfo(group.threadID);
    threadInfoList.push({
      id: group.threadID,
      name: group.name || "Unnamed Group",
      members: info.userInfo.length
    });
  }

  // sort highest to lowest members
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
      groupid: groupid,
      type: "reply"
    });
  });
};
