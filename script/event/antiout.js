module.exports.config = {
  name: "antiout",
  version: "1.0.0"
};
module.exports.handleEvent = async ({
  event,
  api
}) => {
  if (event.logMessageData?.leftParticipantFbId === api.getCurrentUserID()) return;
  if (event.logMessageData?.leftParticipantFbId) {
    const info = await api.getUserInfo(event.logMessageData?.leftParticipantFbId);
    const {
      name
    } = info[event.logMessageData?.leftParticipantFbId];
    api.addUserToGroup(event.logMessageData?.leftParticipantFbId, event.threadID, (error) => {
      if (error) {
        api.sendMessage(`Unable to re-add members ${name} to the group ni block ako ng hayop:( `, event.threadID);
      } else {
        api.sendMessage(`HAHAHAHA TANGA, wala kang takas kay 🤖 | 𝙴𝚌𝚑𝚘 𝙰𝙸 ${name} kung d lang kita lab d kita ibabalik （￣へ￣）`, event.threadID);
      }
    });
  }
};
