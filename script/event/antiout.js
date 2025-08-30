module.exports.config = {
  name: "antiout",
  version: "1.1.0"
};

module.exports.handleEvent = async ({ event, api }) => {
  const leftID = event.logMessageData?.leftParticipantFbId;
  const currentUserID = api.getCurrentUserID();
  const actorID = event.logMessageData?.actorFbId;

  // Ignore kung bot ang umalis
  if (!leftID || leftID === currentUserID) return;

  const info = await api.getUserInfo(leftID);
  const { name } = info[leftID];

  // Determine if self-leave or kicked
  if (actorID === leftID) {
    // Self-leave → ibalik sa group
    api.addUserToGroup(leftID, event.threadID, (error) => {
      if (error) {
        api.sendMessage(`Woyyy gago! Hindi maibalik si ${name} 🙁`, event.threadID);
      } else {
        api.sendMessage(`HAHAHAHA TANGA, wala kang takas dito, ${name}! 🤖`, event.threadID);
      }
    });
  } else {
    // Kicked → huwag ibalik
    api.sendMessage(`${name} na-kick ng admin! Wala kang takas dito 🤭`, event.threadID);
  }
};
