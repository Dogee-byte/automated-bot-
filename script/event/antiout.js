module.exports.config = {
  name: "antiout",
  version: "1.2.0",
  author: "DungUwU",
  description: "Automatically re-adds members who leave the group if antiout is enabled",
  eventType: ["log:unsubscribe"],
  category: "events"
};

module.exports.handleEvent = async ({ event, api, Threads, Users }) => {
  try {
    // Get thread data
    let threadData = (await Threads.getData(event.threadID)).data || {};
    if (threadData.antiout == false) return; // antiout disabled
    if (event.logMessageData.leftParticipantFbId == api.getCurrentUserID()) return; // Ignore bot self

    // Get user name
    const leftUserId = event.logMessageData.leftParticipantFbId;
    const name = global.data.userName.get(leftUserId) || await Users.getNameUser(leftUserId);

    // Determine if self-leave or kicked
    const type = (event.author == leftUserId) ? "self-separation" : "kicked by admin";

    if (type === "self-separation") {
      // Try to add user back
      api.addUserToGroup(leftUserId, event.threadID, (error, info) => {
        if (error) {
          api.sendMessage(`Unable to re-add ${name} to the group 😢`, event.threadID);
        } else {
          api.sendMessage(`HAHAHA tanga, wala kang takas dito, ${name} 😎`, event.threadID);
        }
      });
    }

  } catch (err) {
    console.error("[ANTI-OUT] Error:", err);
  }
};
