module.exports.config = {
 name: "antiout",
 eventType: ["log:unsubscribe"],
 version: "0.0.1",
 credits: "Ari",
 description: "Listen events"
};

module.exports.handleEvent = async({ event, api, Threads, Users }) => {
 let data = (await Threads.getData(event.threadID)).data || {};
 if (data.antiout == false) return;
 if (event.logMessageData.leftParticipantFbId == api.getCurrentUserID()) return;
 const name = global.data.userName.get(event.logMessageData.leftParticipantFbId) || await Users.getNameUser(event.logMessageData.leftParticipantFbId);
 const type = (event.author == event.logMessageData.leftParticipantFbId) ? "self-separation" : "being kicked by the administrator na pasikat";
 if (type == "self-separation") {
  api.addUserToGroup(event.logMessageData.leftParticipantFbId, event.threadID, (error, info) => {
   if (error) {
    api.sendMessage(`Unable to re-add members ${name} to the group ni block ako ng hayop:( `, event.threadID)
   } else api.sendMessage(`HAHAHAHA TANGA, wala kang takas kay 🤖 | 𝙴𝚌𝚑𝚘 𝙰𝙸 ${name} kung d lang kita lab d kita ibabalik （￣へ￣）`, event.threadID);
  })
 }
}
