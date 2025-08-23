export const config = {
  name: "adventure",
  version: "3.0.0",
  credits: "ARI",
  description: "Full RPG adventure game with battles, leveling, and inventory",
  usage: "{p}adventure | {p}status",
  cooldown: 5
};

let players = {};

function initPlayer(id) {
  if (!players[id]) {
    players[id] = {
      level: 1,
      exp: 0,
      hp: 100,
      maxHp: 100,
      inventory: [],
      inBattle: false,
      bossHp: 0
    };
  }
}

function gainExp(player, amount) {
  player.exp += amount;
  if (player.exp >= player.level * 50) {
    player.exp = 0;
    player.level++;
    player.maxHp += 20;
    player.hp = player.maxHp;
    return `🎉 You leveled up! Now Level ${player.level} 🔥\n(HP restored to ${player.maxHp} ❤️)`;
  }
  return "";
}

const scenarios = [
  {
    text: "🌲 You find a hidden path. Do you…\n1️⃣ Explore deeper\n2️⃣ Ignore it",
    choices: {
      "1": { text: "🔦 You discover a hidden shrine. +10 EXP 🏮", exp: 10, item: "Sacred Charm" },
      "2": { text: "🚶 You move on safely, but nothing happens. +2 EXP", exp: 2 }
    }
  },
  {
    text: "🧙 A wizard offers you a potion. Do you…\n1️⃣ Drink it\n2️⃣ Refuse politely",
    choices: {
      "1": { text: "✨ It heals you fully! +5 EXP ❤️", exp: 5, hp: 100 },
      "2": { text: "😅 The wizard curses you for refusing. -10 HP ⚡", hp: -10, exp: 2 }
    }
  }
];

const bosses = [
  { name: "🐉 Dragon", hp: 80, atk: 15 },
  { name: "👹 Demon Lord", hp: 100, atk: 20 },
  { name: "🦴 Skeleton King", hp: 70, atk: 12 }
];

export async function onCall({ message, args }) {
  const userId = message.senderID;
  initPlayer(userId);

  const player = players[userId];

  if (args[0] === "status") {
    return message.reply(
      `📊 STATUS\n\n🏅 Level: ${player.level}\n⭐ EXP: ${player.exp}/${player.level * 50}\n❤️ HP: ${player.hp}/${player.maxHp}\n🎒 Inventory: ${player.inventory.length > 0 ? player.inventory.join(", ") : "Empty"}`
    );
  }

  if (Math.random() < 0.2 && !player.inBattle) {
    const boss = bosses[Math.floor(Math.random() * bosses.length)];
    player.inBattle = true;
    player.bossHp = boss.hp;
    player.currentBoss = boss;

    return message.reply(
      `⚔️ A wild ${boss.name} appears!\nHP: ${boss.hp}\n\nChoose your move:\n1️⃣ Attack\n2️⃣ Defend\n3️⃣ Heal`
    , (err, info) => {
      global.utils.handleReply.push({
        name: config.name,
        messageID: info.messageID,
        author: userId,
        type: "battle"
      });
    });
  }

  const scene = scenarios[Math.floor(Math.random() * scenarios.length)];
  message.reply(scene.text, (err, info) => {
    global.utils.handleReply.push({
      name: config.name,
      messageID: info.messageID,
      author: userId,
      type: "story",
      choices: scene.choices
    });
  });
}

export async function onReply({ message, event, Reply }) {
  const userId = event.senderID;
  if (userId !== Reply.author) return;

  const player = players[userId];
  const choice = event.body.trim();

  // Battle System
  if (Reply.type === "battle") {
    const boss = player.currentBoss;
    let msg = "";

    if (choice === "1") { // Attack
      let damage = Math.floor(Math.random() * 20) + 10;
      if (Math.random() < 0.2) {
        damage *= 2;
        msg += "💥 Critical Hit!\n";
      }
      player.bossHp -= damage;
      msg += `⚔️ You attacked ${boss.name} for ${damage} damage!\n`;

    } else if (choice === "2") { // Defend
      msg += "🛡️ You brace yourself, reducing incoming damage.\n";
      player.defending = true;

    } else if (choice === "3") { // Heal
      let heal = Math.floor(Math.random() * 20) + 10;
      player.hp = Math.min(player.maxHp, player.hp + heal);
      msg += `✨ You healed for ${heal} HP!\n`;

    } else {
      return message.reply("❌ Invalid choice. Reply with 1, 2, or 3.");
    }

    if (player.bossHp > 0) {
      let bossDmg = boss.atk;
      if (player.defending) {
        bossDmg = Math.floor(bossDmg / 2);
        player.defending = false;
      }
      player.hp -= bossDmg;
      msg += `${boss.name} hits you for ${bossDmg} damage! 💢\n`;
    }

    if (player.hp <= 0) {
      players[userId] = null;
      return message.reply(`${msg}\n💀 You were defeated by ${boss.name}! Game Over. Type 'adventure' to restart.`);
    } else if (player.bossHp <= 0) {
      player.inBattle = false;
      const expGain = 30 + Math.floor(Math.random() * 20);
      const levelUpMsg = gainExp(player, expGain);
      return message.reply(`${msg}\n🏆 You defeated ${boss.name}!\n⭐ Gained ${expGain} EXP\n${levelUpMsg}`);
    } else {
      return message.reply(`${msg}\n\n❤️ Your HP: ${player.hp}/${player.maxHp}\n👹 ${boss.name}'s HP: ${player.bossHp}`);
    }
  }

  // Story Choices
  if (Reply.type === "story") {
    if (Reply.choices[choice]) {
      const outcome = Reply.choices[choice];
      player.hp += outcome.hp || 0;
      if (outcome.hp === 100) player.hp = player.maxHp;
      if (outcome.item) player.inventory.push(outcome.item);
      const levelUpMsg = gainExp(player, outcome.exp || 0);

      if (player.hp <= 0) {
        players[userId] = null;
        return message.reply("💀 You fainted... Game Over! Type 'adventure' to restart.");
      }

      let replyMsg = `${outcome.text}\n\n⭐ EXP: ${player.exp}/${player.level * 50}\n❤️ HP: ${player.hp}/${player.maxHp}\n🏅 Level: ${player.level}`;
      if (outcome.item) replyMsg += `\n🎒 You obtained: ${outcome.item}`;
      if (levelUpMsg) replyMsg += `\n\n${levelUpMsg}`;

      return message.reply(replyMsg);
    } else {
      return message.reply("❌ Invalid choice. Reply with the correct number.");
    }
  }
}
