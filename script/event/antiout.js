module.exports.config = {
  name: "antiout",
  eventType: ["log:unsubscribe"],
  version: "0.0.3",
  credits: "DungUwU (fixed by Vern)",
  description: "Prevent members from leaving the group or send messages when kicked"
};

module.exports.handleEvent = async ({ event, api, Threads, Users }) => {
  try {
    let threadData = await Threads.getData(event.threadID);
    let data = threadData.data || {};

    // Kung naka-off, wag mag trigger
    if (!data.antiout) return;

    // Wag re-add kung bot mismo ang umalis
    if (event.logMessageData.leftParticipantFbId == api.getCurrentUserID()) return;

    // Pangalan ng umalis
    let name = await Users.getNameUser(event.logMessageData.leftParticipantFbId);

    // Pangalan ng nag-remove (kung kick ng admin)
    let authorName = await Users.getNameUser(event.author);

    // Check type
    const type = (event.author == event.logMessageData.leftParticipantFbId) 
      ? "self" 
      : "kick";

    if (type === "self") {
      api.addUserToGroup(event.logMessageData.leftParticipantFbId, event.threadID, (error) => {
        if (error) {
          return api.sendMessage(
            `❌ Hindi ko maibalik si ${name}, baka naka-block ako.`,
            event.threadID
          );
        }
        return api.sendMessage(
          `😈 Walang takas, ${name}! Binalik ka ulit.`,
          event.threadID
        );
      });
    } else if (type === "kick") {
      api.sendMessage(
        `🚨 Si ${name} ay tinanggal ng admin na si ${authorName}.`,
        event.threadID
      );
    }

  } catch (err) {
    console.error("Antiout error:", err);
  }
};
