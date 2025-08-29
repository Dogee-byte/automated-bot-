module.exports.config = { 
  name: "pending", 
  version: "1.0.2", 
  role: 0, 
  hasPrefix: false,
  aliases: [], 
  description: "Approve or deny pending group requests", 
  usage: "pending | approve or deny", 
  credits: "Ari (fixed by lennon" 
};

function handleError(e) { console.error(e); return null; }

function out(botID, cTID) { 
  return new Promise((resolve) => { 
    global.api.removeUserFromGroup(botID, cTID, (err) => { 
      if (err) return resolve(null), console.error(err); 
      resolve(true); 
    }); 
  }); 
}

module.exports.run = async function({ api, event }) { 
  try { 
    if (!global.botID) global.botID = api.getCurrentUserID();

    const args = event.body.trim().split(" ");
    const action = args[0]?.toLowerCase();

    if (action === "approve" || action === "deny") {
      const SPAM = (await api.getThreadList(100, null, ["OTHER"])) || []; 
      const PENDING = (await api.getThreadList(100, null, ["PENDING"])) || []; 
      const pendingThread = [...SPAM, ...PENDING].filter(thread => thread.isGroup && thread.isSubscribed);

      if (pendingThread.length === 0) 
        return api.sendMessage("⚠ No pending threads.", event.threadID);

      let indexes = [];
      if (args[1] === "all") {
        indexes = pendingThread.map((_, i) => i);
      } else {
        indexes = args.slice(1).map(i => parseInt(i) - 1).filter(i => i >= 0 && i < pendingThread.length);
      }

      if (indexes.length === 0) 
        return api.sendMessage("⚠ Invalid index.", event.threadID);

      let success = 0, fail = [];

      for (const i of indexes) {
        const thread = pendingThread[i];
        const { threadID: cTID, name } = thread;

        if (action === "approve") {
          let prefix = global.data?.threads.get(cTID)?.data?.prefix || global.config?.PREFIX || "!";
          let _info = await api.sendMessage(`✅ Approved! You can now use commands.\nTry: ${prefix}help`, cTID).catch(handleError);
          if (_info == null) fail.push(name);
          else success++;
        } else {
          let _info = await api.sendMessage("❌ Sorry, your group request was denied.", cTID).catch(handleError);
          let _out = await out(global.botID, cTID);
          if (_info == null || _out == null) fail.push(name);
          else success++;
        }

        await new Promise(r => setTimeout(r, 500));
      }

      return api.sendMessage(
        `${action === "approve" ? "✅ Approved" : "❌ Denied"} ${success} group(s).\n` +
        (fail.length > 0 ? `⚠ Failed: ${fail.join(", ")}` : ""),
        event.threadID
      );
    }

    const SPAM = (await api.getThreadList(100, null, ["OTHER"])) || []; 
    const PENDING = (await api.getThreadList(100, null, ["PENDING"])) || []; 
    const pendingThread = [...SPAM, ...PENDING].filter(thread => thread.isGroup && thread.isSubscribed);

    if (pendingThread.length === 0) 
      return api.sendMessage("⚠ No pending threads.", event.threadID);

    let msg = "📌 Pending Groups:\n";
    msg += pendingThread.map((t, i) => `${i+1}. ${t.name} (${t.threadID})`).join("\n");
    msg += "\n\nCommands:\napprove <index/all>\ndeny <index/all>";

    return api.sendMessage(msg, event.threadID);

  } catch (e) {       
    console.error(e);       
    return api.sendMessage("❌ Error while running pending command.", event.threadID);   
  }   
};
