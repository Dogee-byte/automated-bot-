module.exports.config = { 
  name: "pending", 
  version: "1.0.0", 
  role: 0, 
  hasPrefix: true, 
  aliases: [], 
  description: "Approve or deny a pending group message request", 
  usage: "pending", 
  credits: "XaviaTeam (convert by ari)" 
};

module.exports.run = async function({ api, event, getLang }) { 
  try { 
    if (!global.botID) global.botID = api.getCurrentUserID();

    const SPAM = (await api.getThreadList(100, null, ["OTHER"])) || []; 
    const PENDING = (await api.getThreadList(100, null, ["PENDING"])) || []; 
    const pendingThread = [...SPAM, ...PENDING].filter(thread => thread.isGroup && thread.isSubscribed);

    if (pendingThread.length == 0) 
      return api.sendMessage(getLang("pendingThreadListEmpty"), event.threadID);        

    return api.sendMessage(
      getLang("pendingThreadList", { 
        pendingThread: pendingThread.map((thread, index) => `${index + 1}. ${thread.name} (${thread.threadID})`).join("\n") 
      }),
      event.threadID,
      (err, info) => { 
        if (!err) global.client.handleReply.push({ 
          type: "pending", 
          name: module.exports.config.name, 
          messageID: info.messageID, 
          author: event.senderID, 
          pendingThread, 
          callback 
        }); 
      }
    );   
  } catch (e) {       
    console.error(e);       
    return api.sendMessage(getLang("error"), event.threadID);   
  }   
};
