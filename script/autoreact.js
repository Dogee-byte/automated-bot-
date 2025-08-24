const fs = require("fs");

module.exports.config = {
  name: "autoreact",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "Ari",
  description: "tite lang",
  commandCategory: "no prefix",
  usages: "noprefix",
  cooldowns: 0
};

module.exports.handleEvent = function({ api, event }) {
  if (!event.body) return;
  const text = event.body.toLowerCase();

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  const reactions = [
    { keywords: ["lol","😂","ughh","haha","pagal","mental","oye","love","jani","bc","busy","group","kis","kuta","jan","oh"], emojis: ["😆","🤣","😂"] },
    { keywords: ["death","mar","udas","☹️","hurt","please","pls","😢","😔","🥺","sad"], emojis: ["😢","😭","🥀"] },
    { keywords: ["🥵","umah","💋","kiss","babu","baby","wow","wah","relationship","gf","omg"], emojis: ["😘","😍","😚"] }
  ];

  for (let r of reactions) {
    if (r.keywords.some(word => text.includes(word))) {
      return api.setMessageReaction(pick(r.emojis), event.messageID, () => {}, true);
    }
  }

  const replies = {
    "tite": [
      "Tite ka nang tite, lika dito subuin mo ’to. 🤣",
      "Puro ka tite, wala nabang ibang laman yang utak mo?",
      "bad yan"
    ],
    "umay": [
      "Umay talaga, wala kang tatay eh 😏",
      "Ril",
      "Umay sayo lods 😓"
    ],
    "bot": [
      "Oo na, bot na. Kinginamo ka",
      "Tama na, bot lang ako pero mas useful pa rin kesa sayo 🤖",
      "Pwede tama na kaka-bot nakakarindi na eh!! 😠"
    ],
    "burat": [
      "Si Ari pogi, malake burat 💪",
      "Tingin ako burat",
      "Burat means tite diba? tingin nga rate ko lang"
    ],
    "kick": [
      "Ikaw dapat kinikick eh, wala ka namang ambag.",
      "ikaw dapat kinikick eh wala ka namang dulot sa pinas putanginamo di ka mahal ng magulang mo bobo ka",
      "sige ganyan ka naman eh, hindi ka na naawa sakin 😞💔"
    ],
    "hahaha": [
      "Tawang-tawa ampota, saksakin ko ngalangala mo 🔪",
      "Tawa ng nirebound ba yan?",
      "Happy?"
    ]
  };

  for (let key in replies) {
    if (text.includes(key)) {
      return api.sendMessage(pick(replies[key]), event.threadID, event.messageID);
    }
  }
};

module.exports.run = () => {};
