module.exports.config = {
  name: "antiout",
  version: "1.0.0"
};

module.exports.handleEvent = async ({ event, api }) => {
  const leftUserId = event.logMessageData?.leftParticipantFbId;

  // Huwag i-process kung ang umalis ay ang bot mismo
  if (!leftUserId || leftUserId === api.getCurrentUserID()) return;

  const info = await api.getUserInfo(leftUserId);
  const { name } = info[leftUserId];

  // Mag-send ng message kapag naremove o umalis ang user
  api.sendMessage(`⚠️ Attention! Si ${name} ay na-remove o umalis sa group!`, event.threadID);

  // Subukan ibalik ang user sa group
  api.addUserToGroup(leftUserId, event.threadID, (error) => {
    if (error) {
      api.sendMessage(`Woyyy gago! Si ${name} ay umalis 😢 Mamimiss kita beshie, ingat ka!`, event.threadID);
    } else {
      api.sendMessage(`HAHAHAHA TANGA, wala kang takas kay 🤖 | 𝙴𝚌𝚑𝚘 𝙰𝙸 ${name} kung di lang kita lab, d kita ibabalik! 😎`, event.threadID);
    }
  });
};
