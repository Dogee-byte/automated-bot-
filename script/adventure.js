module.exports.config = {
  name: "adventure",
  version: "2.0.0",
  role: 0,
  credits: "Ari",
  description: "Embark on RPG-style adventure 🏔️",
  aliases: ["adv", "quest"],
  cooldown: 5
};

const adventures = {}; 

const monsters = [
  { name: "Goblin", hp: 60, atk: [5, 12], exp: 15, loot: "Rusty Dagger 🗡️" },
  { name: "Wolf", hp: 80, atk: [6, 14], exp: 20, loot: "Wolf Pelt 🐺" },
  { name: "Orc", hp: 100, atk: [8, 18], exp: 30, loot: "Orcish Axe 🪓" },
  { name: "Skeleton Knight", hp: 120, atk: [10, 20], exp: 40, loot: "Bone Shield 🛡️" },
  { name: "Dragon", hp: 180, atk: [15, 30], exp: 100, loot: "Dragon Scale 🐉" }
];

function createPlayer() {
  return {
    hp: 120,
    mp: 50,
    level: 1,
    exp: 0,
    inventory: []
  };
}

function randomBetween([min, max]) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.onCall = async function ({ message, args, api }) {
  const sender = message.senderID;

  if (adventures[sender]) {
    return message.reply("⚠️ You're already in an adventure! Use `attack`, `skill`, `heal`, or `run`.");
  }
  
  if (!adventures[sender]) adventures[sender] = { player: createPlayer() };
  const monster = monsters[Math.floor(Math.random() * monsters.length)];

  adventures[sender].monster = { ...monster };
  adventures[sender].playerTurn = true;

  message.reply(
    `🧭 You begin your adventure...\nSuddenly, a **${monster.name}** appears!\n\n` +
    `❤️ Your HP: ${adventures[sender].player.hp} | 🔵 MP: ${adventures[sender].player.mp}\n` +
    `💀 ${monster.name} HP: ${monster.hp}\n\n` +
    `Commands: "attack", "skill", "heal", "run"`
  );
  
  const listener = api.listenMqtt(async (err, event) => {
    if (err) return;
    if (event.senderID !== sender) return;
    const adv = adventures[sender];
    if (!adv) return;

    const player = adv.player;
    const monster = adv.monster;
    let msg = "";

    if (event.body?.toLowerCase() === "attack") {
      const dmg = randomBetween([10, 20]) + player.level * 2;
      monster.hp -= dmg;
      msg += `⚔️ You slash the ${monster.name} for ${dmg} damage!\n💀 ${monster.name} HP: ${monster.hp}\n`;

      if (monster.hp <= 0) {
        player.exp += monster.exp;
        player.inventory.push(monster.loot);
        msg += `\n🏆 You defeated the ${monster.name}!\n🎁 Loot: ${monster.loot}\n⭐ +${monster.exp} EXP\n`;

        if (player.exp >= player.level * 50) {
          player.level++;
          player.hp += 20;
          player.mp += 10;
          player.exp = 0;
          msg += `🎉 LEVEL UP! You are now level ${player.level}.\n❤️ HP increased!\n🔵 MP increased!\n`;
        }

        delete adventures[sender];
        listener();
        return api.sendMessage(msg, event.threadID);
      }
    }
    
    if (event.body?.toLowerCase() === "skill") {
      if (player.mp < 15) {
        return api.sendMessage("⚠️ Not enough MP to use a skill!", event.threadID);
      }
      player.mp -= 15;
      const dmg = randomBetween([20, 35]) + player.level * 3;
      monster.hp -= dmg;
      msg += `🔥 You cast Fireball! It deals ${dmg} damage!\n💀 ${monster.name} HP: ${monster.hp}\n`;

      if (monster.hp <= 0) {
        player.exp += monster.exp;
        player.inventory.push(monster.loot);
        msg += `\n🏆 The ${monster.name} is burned to ashes!\n🎁 Loot: ${monster.loot}\n⭐ +${monster.exp} EXP\n`;

        if (player.exp >= player.level * 50) {
          player.level++;
          player.hp += 20;
          player.mp += 10;
          player.exp = 0;
          msg += `🎉 LEVEL UP! You are now level ${player.level}.\n`;
        }

        delete adventures[sender];
        listener();
        return api.sendMessage(msg, event.threadID);
      }
    }

    if (event.body?.toLowerCase() === "heal") {
      if (player.mp < 10) {
        return api.sendMessage("⚠️ Not enough MP to heal!", event.threadID);
      }
      player.mp -= 10;
      const heal = randomBetween([15, 30]);
      player.hp += heal;
      msg += `✨ You healed yourself for ${heal} HP!\n❤️ Current HP: ${player.hp}\n`;
    }

    if (event.body?.toLowerCase() === "run") {
      msg += "🏃 You ran away safely from the monster!";
      delete adventures[sender];
      listener();
      return api.sendMessage(msg, event.threadID);
    }

    if (monster.hp > 0) {
      const mdmg = randomBetween(monster.atk);
      player.hp -= mdmg;
      msg += `\n💥 The ${monster.name} strikes you for ${mdmg} damage!\n❤️ Your HP: ${player.hp}`;

      if (player.hp <= 0) {
        msg += `\n\n💀 You were slain by the ${monster.name}... Game Over.`;
        delete adventures[sender];
        listener();
      }
    }

    return api.sendMessage(msg, event.threadID);
  });
};
