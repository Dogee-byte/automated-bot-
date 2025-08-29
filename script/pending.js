const fs = require("fs");

module.exports.config = { 
  name: "pending", 
  version: "1.0.0", 
  role: 2, 
  hasPrefix: false, 
  aliases: [], 
  description: "Approve or deny a pending group message request", 
  usage: "pending", 
  credits: "XaviaTeam (convert by ari)" 
};

module.exports.languages = { 
  "en_US": {
    "invalidIndexes": "Invalid indexes",
    "successDeny": "Denied successfully {success} group(s)",
    "failDeny": "Some groups could not be denied:\n{fail}",
    "denied": "Sorry, your group has been denied",
    "successApprove": "Approved successfully {success} group(s)",
    "failApprove": "Some groups could not be approved:\n{fail}",
    "approved": "Congratulations, your group has been approved\n{prefix}help to see the list of commands",
    "pendingThreadList": "List of pending threads:\n{pendingThread}\n\nReply with:\n- deny <index/all>\n- approve <index/all>",
    "pendingThreadListEmpty": "There are no pending threads",
    "error": "An error has occurred, please try again later"
  }
};

function handleError(e) { 
  console.error(e); 
  return null; 
}

function out(botID, cTID) { 
  return new Promise((resolve) => { 
    global.api.removeUserFromGroup(botID, cTID, (err) => { 
      if (err) return resolve(null), console.error(err); 
      resolve(true); 
    }); 
  }); 
}

async function callback({ api, event, getLang, Reply }) { 
  const { pendingThread } = Reply;
  const input = event.body.trim().split(" ");   

  const indexes = (input[1] == "all" || input[1] == "-a")
    ? pendingThread.map((_, index) => index)
    : input.slice(1)
        .map(index => parseInt(index) - 1)
        .filter(index => index >= 0 && index < pendingThread.length);

  let success = 0, fail = [];   

  if (input[0] == "deny" || input[0] == "d") {       
    if (indexes.length == 0) 
      return api.sendMessage(getLang("invalidIndexes"), event.threadID);        

    const threads = indexes.map(index => pendingThread[index]);       
    for (const thread of threads) {           
      const { threadID: cTID } = thread;           
      let _info = await api.sendMessage(getLang("denied"), cTID).catch(handleError);           
      let _out = await out(global.botID, cTID);            

      if (_info == null || _out == null) fail.push(cTID);           
      else success++;            
      await new Promise(r => setTimeout(r, 500));       
    }        

    api.sendMessage(getLang("successDeny", { success }), event.threadID);       
    if (fail.length > 0) api.sendMessage(getLang("failDeny", { fail: fail.join("\n") }), event.threadID);   

  } else if (input[0] == "approve" || input[0] == "a") {       
    if (indexes.length == 0) 
      return api.sendMessage(getLang("invalidIndexes"), event.threadID);        

    const threads = indexes.map(index => pendingThread[index]);       
    for (const thread of threads) {           
      const { threadID: cTID } = thread;           
      let threadPrefix = global.data.threads.get(cTID)?.data?.prefix || global.config.PREFIX;            
      let _info = await api.sendMessage(getLang("approved", { prefix: threadPrefix }), cTID).catch(handleError);           
      if (_info == null) fail.push(cTID);           
      else success++;            
      await new Promise(r => setTimeout(r, 500));       
    }        

    api.sendMessage(getLang("successApprove", { success }), event.threadID);       
    if (fail.length > 0) api.sendMessage(getLang("failApprove", { fail: fail.join("\n") }), event.threadID);   
  }
}

module.exports.run = async function({ api, event, getLang }) { 
  try { 
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
