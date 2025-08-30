module.exports.config = {
  name: "antiout",
  eventType: ["log:unsubscribe"],
  version: "1.2.0",
  credits: "DungUwU",
  description: "Handle self-leave and kicks"
};

module.exports.run = async ({ event, api, Threads, Users }) => {
  let data = (await Threads.getData(event.threadID)).data || {};
  if (data.antiout === false) return;

  const leftID = event.logMessageData.leftParticipantFbId;
  const currentUserID = api.getCurrentUserID();
  if (!leftID || leftID === currentUserID) return;

  const name = global.data.userName.get(leftID) || await Users.getNameUser(leftID);

  // Determine self-leave or kicked
  const type = (event.author === leftID) ? "self-leave" : "kicked";

  if (type === "self-leave") {
    // Ibabalik lang kung self-leave
    api.addUserToGroup(leftID, event.threadID, (error) => {
      if (error) {
        api.sendMessage(`Woyyy gago! Hindi maibalik si ${name} 🙁`, event.threadID);
      } else {
        api.sendMessage(`HAHAHAHA TANGA, wala kang takas dito, ${name}! 🤖`, event.threadID);
      }
    });
  } else {
    // Hindi ibabalik kung na-kick
    api.sendMessage(`${name} na-kick ng admin! Wala kang takas dito 🤭`, event.threadID);
  }
};
