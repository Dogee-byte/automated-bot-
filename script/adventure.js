module.exports.config = {
  name: "adventure",
  version: "2.0.0",
  role: 0,
  credits: "Ari",
  description: "RPG style adventure with battles, loot and HP!",
  cooldown: 5,
  aliases: ["rpg", "quest", "battle"]
};

let players = {}; 

const enemies = [
  { name: "🐉 Dragon", hp: 30, dmg: [5, 12], loot: "🔥 Dragon Scale" },
  { name: "👹 Goblin", hp: 15, dmg: [2, 6], loot: "💰 Gold Pouch" },
  { name: "🧟 Zombie", hp: 20, dmg: [3, 8], loot: "🧠 Rotten Brain" },
  { name: "🦄 Cursed Unicorn", hp: 25, dmg: [4, 10], loot: "🌈 Unicorn Horn" }
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.run = async function ({ api, event }) {
  const userID = event.senderID;

  if (!players[userID]) {
    players[userID] = { hp: 40, inventory: [] };
  }

  const enemy = { ...enemies[Math.floor(Math.random() * enemies.length)] };

  players[userID].enemy = enemy;

  let message = `⚔️ A wild ${enemy.name} appears!\n\n❤️ Your HP: ${players[userID].hp}\n💀 Enemy HP: ${enemy.hp}\n\nChoose your action:\n1️⃣ Attack\n2️⃣ Defend\n3️⃣ Run`;

  return api.sendMessage(message, event.threadID, (err, info) => {
    global.client.handleReply.push({
      type: "adventure",
      name: this.config.name,
      author: userID,
      messageID: info.messageID
    });
  });
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const userID = event.senderID;
  if (userID !== handleReply.author) return;

  const player = players[userID];
  const enemy = player.enemy;
  const choice = event.body.trim();

  if (!["1", "2", "3"].includes(choice)) {
    return api.sendMessage("❗ Please choose 1, 2 or 3.", event.threadID);
  }

  let message = "";

  if (choice === "1") { 
    const dmg = getRandomInt(4, 10);
    enemy.hp -= dmg;
    message += `🗡️ You hit the ${enemy.name} for ${dmg} damage!\n`;

    if (enemy.hp <= 0) {
      message += `✅ You defeated the ${enemy.name}!\n🎁 Loot gained: ${enemy.loot}`;
      player.inventory.push(enemy.loot);
      delete player.enemy;
    } else {
      const enemyDmg = getRandomInt(enemy.dmg[0], enemy.dmg[1]);
      player.hp -= enemyDmg;
      message += `💥 The ${enemy.name} strikes back for ${enemyDmg} damage!\n❤️ Your HP: ${player.hp}\n💀 Enemy HP: ${enemy.hp}`;
    }
  }

  else if (choice === "2") { 
    const blocked = getRandomInt(1, 6);
    const enemyDmg = Math.max(0, getRandomInt(enemy.dmg[0], enemy.dmg[1]) - blocked);
    player.hp -= enemyDmg;
    message += `🛡️ You defend! Blocked ${blocked} damage.\n💥 The ${enemy.name} hits you for ${enemyDmg} damage.\n❤️ Your HP: ${player.hp}\n💀 Enemy HP: ${enemy.hp}`;
  }

  else if (choice === "3") { 
    const chance = getRandomInt(1, 100);
    if (chance <= 50) {
      message += `🏃 You escaped safely from the ${enemy.name}!`;
      delete player.enemy;
    } else {
      const enemyDmg = getRandomInt(enemy.dmg[0], enemy.dmg[1]);
      player.hp -= enemyDmg;
      message += `❌ Failed to escape!\n💥 The ${enemy.name} hits you for ${enemyDmg} damage.\n❤️ Your HP: ${player.hp}\n💀 Enemy HP: ${enemy.hp}`;
    }
  }

  if (player.hp <= 0) {
    message += `\n💀 You were defeated by the ${enemy.name}! Inventory lost...`;
    players[userID] = { hp: 40, inventory: [] }; // Reset
  }

  return api.sendMessage(message, event.threadID);
};
