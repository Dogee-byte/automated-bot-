module.exports.config = {
  name: "config",
  version: "1.1.0",
  permission: 3,
  prefix: false,
  premium: false,
  credits: "ARI",
  description: "config bot",
  category: "operator",
  cooldowns: 5
};

module.exports.languages = {
  "bangla": {},
  "english": {}
};

const axios = require("axios");
const fs = require("fs-extra");

// FB headers
const cookie = process.env['configAppstate'];
const headers = {
  "Host": "mbasic.facebook.com",
  "user-agent": "Mozilla/5.0 (Linux; Android 11; M2101K7BG Build/RP1A.200720.011;) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/97.0.4692.98 Mobile Safari/537.36",
  "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
  "referer": "https://mbasic.facebook.com/?refsrc=deprecated&_rdr",
  "accept-encoding": "gzip, deflate",
  "accept-language": "en-US,en;q=0.9",
  "Cookie": cookie
};

// helper extract postID from link
function extractPostID(link) {
  let match = link.match(/(?:story_fbid=|fbid=|\/posts\/|\/permalink\/)(\d+)/);
  return match ? match[1] : link; // kung wala, gamitin kung ano nilagay
}

// main entry
module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  const reply = msg => api.sendMessage(msg, threadID, messageID);

  return reply(
`⚙️ Config Menu

👤 Profile
1. Change Bio
2. Change Nickname
3. Change Avatar
4. Avatar Shield (on/off)

💬 Messaging
5. Pending Messages
6. Unread Messages
7. Spam Messages
8. Send Message

📝 Posts
9. Create Post
10. Delete Post
11. Comment on Post
12. React to Post
13. Create Note

👥 Friends
14. Add Friend
15. Accept Friend Request
16. Decline Friend Request
17. Unfriend
18. Block User
19. Unblock User

🚪 System
20. Logout

➡️ Use: reply with a number`
  );
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body, attachments } = event;
  if (!body) return;
  const text = body.trim();

  const reply = (msg, cb) => {
    if (cb) api.sendMessage(msg, threadID, cb, messageID);
    else api.sendMessage(msg, threadID, messageID);
  };
  
  if (handleReply.type === "menu") {
    switch (text) {
      case "1": return reply("✏️ Enter new bio:", () => setNext("bio"));
      case "2": return reply("✏️ Enter new nickname:", () => setNext("nickname"));
      case "3": return reply("📸 Send new avatar image:", () => setNext("avatar"));
      case "4": return reply("🛡️ Type 'on' or 'off' to toggle shield:", () => setNext("shield"));
      case "5": return reply("📥 Fetching pending messages...", () => setNext("pending"));
      case "6": return reply("📥 Fetching unread messages...", () => setNext("unread"));
      case "7": return reply("⚠️ Enter spam text:", () => setNext("spam"));
      case "8": return reply("✉️ Enter userID + message:", () => setNext("sendmsg"));
      case "9": return reply("📝 Enter post content:", () => setNext("post"));
      case "10": return reply("❌ Enter post link to delete:", () => setNext("deletepost"));
      case "11": return reply("💬 Enter post link + comment:", () => setNext("comment"));
      case "12": return reply("❤️ Enter post link:", () => setNext("react_id"));
      case "13": return reply("📝 Enter note content:", () => setNext("note"));
      case "14": return reply("👤 Enter user ID to add friend:", () => setNext("addfriend"));
      case "15": return reply("👤 Enter user ID to accept request:", () => setNext("acceptfriend"));
      case "16": return reply("👤 Enter user ID to decline request:", () => setNext("declinefriend"));
      case "17": return reply("👤 Enter user ID to unfriend:", () => setNext("unfriend"));
      case "18": return reply("🚫 Enter user ID to block:", () => setNext("block"));
      case "19": return reply("✅ Enter user ID to unblock:", () => setNext("unblock"));
      case "20": return reply("🚪 Logging out...", () => setNext("logout"));
      default: return reply("❌ Invalid choice.");
    }
  }

  if (handleReply.type === "bio") {
    try {
      await axios.post("https://mbasic.facebook.com/profile/bio/edit", { bio: text }, { headers });
      reply("✅ Bio updated!");
    } catch { reply("❌ Failed to update bio."); }
  }

  if (handleReply.type === "nickname") {
    try {
      await axios.post("https://mbasic.facebook.com/nickname/change", { nickname: text }, { headers });
      reply("✅ Nickname updated!");
    } catch { reply("❌ Failed to update nickname."); }
  }

  if (handleReply.type === "avatar") {
    if (attachments.length > 0) {
      let img = attachments[0].url;
      try {
        await axios.post("https://mbasic.facebook.com/profile/picture/upload", { url: img }, { headers });
        reply("✅ Avatar changed!");
      } catch { reply("❌ Failed to change avatar."); }
    } else reply("❌ Please attach an image.");
  }

  if (handleReply.type === "shield") {
    try {
      await axios.post("https://mbasic.facebook.com/profile/shield/toggle", { enable: text === "on" }, { headers });
      reply(`🛡️ Avatar shield ${text === "on" ? "enabled" : "disabled"}!`);
    } catch { reply("❌ Failed to toggle shield."); }
  }

  if (handleReply.type === "pending") {
    try {
      let res = await axios.get("https://mbasic.facebook.com/messages/?folder=pending", { headers });
      reply("📥 Pending messages:\n" + res.data.slice(0, 200));
    } catch { reply("❌ Failed to fetch pending."); }
  }

  if (handleReply.type === "unread") {
    try {
      let res = await axios.get("https://mbasic.facebook.com/messages/?folder=unread", { headers });
      reply("📥 Unread messages:\n" + res.data.slice(0, 200));
    } catch { reply("❌ Failed to fetch unread."); }
  }

  if (handleReply.type === "spam") {
    try {
      for (let i = 0; i < 5; i++) {
        await axios.post("https://mbasic.facebook.com/messages/send", { text }, { headers });
      }
      reply("✅ Spam sent!");
    } catch { reply("❌ Failed to spam."); }
  }

  if (handleReply.type === "sendmsg") {
    let [uid, ...msg] = text.split(" ");
    try {
      await axios.post(`https://mbasic.facebook.com/messages/send/?id=${uid}`, { text: msg.join(" ") }, { headers });
      reply("✅ Message sent.");
    } catch { reply("❌ Failed to send message."); }
  }

  if (handleReply.type === "post") {
    try {
      await axios.post("https://mbasic.facebook.com/composer/mbasic/", { text }, { headers });
      reply("✅ Post created!");
    } catch { reply("❌ Failed to post."); }
  }

  if (handleReply.type === "deletepost") {
    let id = extractPostID(text);
    try {
      await axios.post(`https://mbasic.facebook.com/${id}/delete`, {}, { headers });
      reply("✅ Post deleted!");
    } catch { reply("❌ Failed to delete."); }
  }

  if (handleReply.type === "comment") {
    let [link, ...msg] = text.split(" ");
    let id = extractPostID(link);
    try {
      await axios.post(`https://mbasic.facebook.com/${id}/comment`, { text: msg.join(" ") }, { headers });
      reply("💬 Commented!");
    } catch { reply("❌ Failed to comment."); }
  }

  if (handleReply.type === "react_id") {
    let id = extractPostID(text);
    reply(
`Choose reaction:
1. 👍
2. ❤️
3. 😆
4. 😮
5. 😢
6. 😡`,
      () => setNext("react_choose", id)
    );
  }

  if (handleReply.type === "react_choose") {
    const id = handleReply.postID;
    const reactions = ["LIKE", "LOVE", "HAHA", "WOW", "SORRY", "ANGER"];
    const choice = parseInt(text);
    if (choice >= 1 && choice <= 6) {
      try {
        await axios.post(`https://mbasic.facebook.com/reactions/picker/?ft_id=${id}`, { reaction: reactions[choice - 1] }, { headers });
        reply(`✅ Reacted with ${reactions[choice - 1]}!`);
      } catch { reply("❌ Failed to react."); }
    } else reply("❌ Invalid reaction.");
  }

  if (handleReply.type === "note") {
    try {
      await axios.post("https://mbasic.facebook.com/notes/create", { text }, { headers });
      reply("✅ Note created!");
    } catch { reply("❌ Failed to create note."); }
  }

  if (handleReply.type === "addfriend") {
    try {
      await axios.post(`https://mbasic.facebook.com/add_friend/action/?id=${text}`, {}, { headers });
      reply("👤 Friend request sent.");
    } catch { reply("❌ Failed to add friend."); }
  }

  if (handleReply.type === "acceptfriend") {
    try {
      await axios.post(`https://mbasic.facebook.com/friends/accept/?id=${text}`, {}, { headers });
      reply("✅ Friend accepted.");
    } catch { reply("❌ Failed to accept."); }
  }

  if (handleReply.type === "declinefriend") {
    try {
      await axios.post(`https://mbasic.facebook.com/friends/decline/?id=${text}`, {}, { headers });
      reply("❌ Friend declined.");
    } catch { reply("❌ Failed to decline."); }
  }

  if (handleReply.type === "unfriend") {
    try {
      await axios.post(`https://mbasic.facebook.com/removefriend.php?id=${text}`, {}, { headers });
      reply("👤 Unfriended.");
    } catch { reply("❌ Failed to unfriend."); }
  }

  if (handleReply.type === "block") {
    try {
      await axios.post(`https://mbasic.facebook.com/privacy/block/add/${text}`, {}, { headers });
      reply("🚫 User blocked.");
    } catch { reply("❌ Failed to block."); }
  }

  if (handleReply.type === "unblock") {
    try {
      await axios.post(`https://mbasic.facebook.com/privacy/block/remove/${text}`, {}, { headers });
      reply("✅ User unblocked.");
    } catch { reply("❌ Failed to unblock."); }
  }

  if (handleReply.type === "logout") {
    try {
      await axios.get("https://mbasic.facebook.com/logout", { headers });
      reply("🚪 Logged out.");
    } catch { reply("❌ Failed to log out."); }
  }

  function setNext(type, postID = null) {
    global.client.handleReply.push({
      name: module.exports.config.name,
      messageID,
      author: senderID,
      type,
      postID
    });
  }
};
