module.exports.config = {
  name: "config",
  version: "1.0.0",
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

const cookie = process.env['configAppstate'];
const headers = {
  "Host": "mbasic.facebook.com",
  "user-agent": "Mozilla/5.0 (Linux; Android 11; M2101K7BG Build/RP1A.200720.011;) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/97.0.4692.98 Mobile Safari/537.36",
  "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
  "sec-fetch-site": "same-origin",
  "sec-fetch-mode": "navigate",
  "sec-fetch-user": "?1",
  "sec-fetch-dest": "document",
  "referer": "https://mbasic.facebook.com/?refsrc=deprecated&_rdr",
  "accept-encoding": "gzip, deflate",
  "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cookie": cookie
};

function extractPostID(link) {
  let match = link.match(/(?:story_fbid=|fbid=|\/posts\/|\/permalink\/)(\d+)/);
  return match ? match[1] : link;
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const reply = (msg, callback) => {
    if (callback) api.sendMessage(msg, threadID, callback, messageID);
    else api.sendMessage(msg, threadID, messageID);
  };

  if (!args[0]) {
    return reply(
      `⚙️ Config Menu\n
1. Change Bio
2. Change Nickname
3. Pending Messages
4. Unread Messages
5. Spam Messages
6. Change Avatar
7. Avatar Shield (on/off)
8. Block User
9. Unblock User
10. Create Post
11. Delete Post
12. Comment on Post
13. React to Post
14. Add Friend
15. Accept Friend Request
16. Decline Friend Request
17. Unfriend
18. Send Message
19. Create Note
20. Logout\n
➡️ Use: config <number>`
    );
  }

  return module.exports.handleReply({
    api,
    botid: senderID,
    event,
    handleReply: { type: "menu", author: senderID },
    getText: () => {}
  });
};

module.exports.handleReply = async function ({ api, botid, event, handleReply, getText }) {
  const { type, author } = handleReply;
  const { threadID, messageID, senderID } = event;
  let body = event.body || "";
  if (author != senderID) return;

  const args = body.split(" ");
  const reply = function (msg, callback) {
    if (callback) api.sendMessage(msg, threadID, callback, messageID);
    else api.sendMessage(msg, threadID, messageID);
  };

  // ---------------- MENU ----------------
  if (type === "menu") {
    switch (args[0]) {
      case "1": return reply("✏️ Please enter new bio:");
      case "2": return reply("✏️ Please enter new nickname:");
      case "3": return reply("📥 Fetching pending messages...");
      case "4": return reply("📥 Fetching unread messages...");
      case "5": return reply("⚠️ Enter spam text:");
      case "6": return reply("📸 Send new avatar image:");
      case "7": return reply("🛡️ Toggle avatar shield (on/off):");
      case "8": return reply("🚫 Enter user ID to block:");
      case "9": return reply("✅ Enter user ID to unblock:");
      case "10": return reply("📝 Enter post content:");
      case "11": return reply("❌ Enter post link to delete:");
      case "12": return reply("💬 Enter post link + your comment:");
      case "13": return reply("❤️ Enter post link to react:");
      case "14": return reply("👤 Enter user ID to add friend:");
      case "15": return reply("👤 Enter user ID to accept request:");
      case "16": return reply("👤 Enter user ID to decline request:");
      case "17": return reply("👤 Enter user ID to unfriend:");
      case "18": return reply("✉️ Enter user ID + your message:");
      case "19": return reply("📝 Enter note content:");
      case "20": return reply("🚪 Logging out...");
      default: return reply("❌ Invalid choice, please try again.");
    }
  }
  
  if (type === "bio") {
    try {
      await axios.post("https://mbasic.facebook.com/profile/bio/edit", { bio: body }, { headers });
      reply("✅ Bio updated successfully!");
    } catch {
      reply("❌ Failed to update bio.");
    }
  }

  if (type === "nickname") {
    try {
      await axios.post("https://mbasic.facebook.com/nickname/change", { nickname: body }, { headers });
      reply("✅ Nickname updated!");
    } catch {
      reply("❌ Failed to update nickname.");
    }
  }

  if (type === "avatar") {
    if (event.attachments.length > 0) {
      let img = event.attachments[0].url;
      try {
        await axios.post("https://mbasic.facebook.com/profile/picture/upload", { url: img }, { headers });
        reply("✅ Avatar changed!");
      } catch {
        reply("❌ Failed to change avatar.");
      }
    } else reply("❌ Please attach an image.");
  }

  if (type === "shield") {
    try {
      await axios.post("https://mbasic.facebook.com/profile/shield/toggle", { enable: body === "on" }, { headers });
      reply(`🛡️ Avatar shield ${body === "on" ? "enabled" : "disabled"}!`);
    } catch {
      reply("❌ Failed to toggle avatar shield.");
    }
  }

  if (type === "pending") {
    try {
      let res = await axios.get("https://mbasic.facebook.com/messages/?folder=pending", { headers });
      reply("📥 Pending messages:\n" + res.data);
    } catch {
      reply("❌ Failed to fetch pending messages.");
    }
  }

  if (type === "unread") {
    try {
      let res = await axios.get("https://mbasic.facebook.com/messages/?folder=unread", { headers });
      reply("📥 Unread messages:\n" + res.data);
    } catch {
      reply("❌ Failed to fetch unread messages.");
    }
  }

  if (type === "spam") {
    try {
      for (let i = 0; i < 5; i++) {
        await axios.post("https://mbasic.facebook.com/messages/send", { text: body }, { headers });
      }
      reply("✅ Spam sent!");
    } catch {
      reply("❌ Failed to send spam.");
    }
  }

  if (type === "sendmsg") {
    let [uid, ...msg] = body.split(" ");
    try {
      await axios.post(`https://mbasic.facebook.com/messages/send/?id=${uid}`, { text: msg.join(" ") }, { headers });
      reply("✅ Message sent.");
    } catch {
      reply("❌ Failed to send message.");
    }
  }

  if (type === "post") {
    try {
      await axios.post("https://mbasic.facebook.com/composer/mbasic/", { text: body }, { headers });
      reply("✅ Post created!");
    } catch {
      reply("❌ Failed to create post.");
    }
  }

  if (type === "deletepost") {
    let postID = extractPostID(body);
    try {
      await axios.post(`https://mbasic.facebook.com/${postID}/delete`, {}, { headers });
      reply("✅ Post deleted!");
    } catch {
      reply("❌ Failed to delete post.");
    }
  }

  if (type === "comment") {
    let [link, ...text] = body.split(" ");
    let postID = extractPostID(link);
    try {
      await axios.post(`https://mbasic.facebook.com/${postID}/comment`, { text: text.join(" ") }, { headers });
      reply("💬 Commented!");
    } catch {
      reply("❌ Failed to comment.");
    }
  }

  if (type === "react_id") {
    let postID = extractPostID(body);
    return module.exports.handleReply({
      api,
      botid,
      event,
      handleReply: { type: "react_choose", author: senderID, postID },
      getText
    });
  }

  if (type === "react_choose") {
    const reactions = ["LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY"];
    let choice = parseInt(body) - 1;
    if (choice < 0 || choice >= reactions.length) return reply("❌ Invalid choice.");
    try {
      await axios.post(`https://mbasic.facebook.com/reactions/picker/?ft_id=${handleReply.postID}`, { reaction: reactions[choice] }, { headers });
      reply(`✅ Reacted with ${reactions[choice]}!`);
    } catch {
      reply("❌ Failed to react.");
    }
  }

  if (type === "note") {
    try {
      await axios.post("https://mbasic.facebook.com/notes/create", { text: body }, { headers });
      reply("✅ Note created!");
    } catch {
      reply("❌ Failed to create note.");
    }
  }

  if (type === "addfriend") {
    try {
      await axios.post(`https://mbasic.facebook.com/add_friend/action/?id=${body}`, {}, { headers });
      reply("👤 Friend request sent.");
    } catch {
      reply("❌ Failed to send friend request.");
    }
  }

  if (type === "acceptfriend") {
    try {
      await axios.post(`https://mbasic.facebook.com/friends/accept/?id=${body}`, {}, { headers });
      reply("✅ Friend request accepted.");
    } catch {
      reply("❌ Failed to accept request.");
    }
  }

  if (type === "declinefriend") {
    try {
      await axios.post(`https://mbasic.facebook.com/friends/decline/?id=${body}`, {}, { headers });
      reply("❌ Friend request declined.");
    } catch {
      reply("❌ Failed to decline request.");
    }
  }

  if (type === "unfriend") {
    try {
      await axios.post(`https://mbasic.facebook.com/removefriend.php?id=${body}`, {}, { headers });
      reply("👤 Unfriended.");
    } catch {
      reply("❌ Failed to unfriend.");
    }
  }

  if (type === "block") {
    try {
      await axios.post(`https://mbasic.facebook.com/privacy/block/add/${body}`, {}, { headers });
      reply("🚫 User blocked.");
    } catch {
      reply("❌ Failed to block user.");
    }
  }

  if (type === "unblock") {
    try {
      await axios.post(`https://mbasic.facebook.com/privacy/block/remove/${body}`, {}, { headers });
      reply("✅ User unblocked.");
    } catch {
      reply("❌ Failed to unblock user.");
    }
  }

  if (type === "logout") {
    try {
      await axios.get("https://mbasic.facebook.com/logout", { headers });
      reply("🚪 Logged out.");
    } catch {
      reply("❌ Failed to log out.");
    }
  }
};
