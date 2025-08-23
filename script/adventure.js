module.exports.config = {
    name: "adventure",
    version: "3.0.0",
    credits: "ARI",
    description: "Full RPG adventure game with battles, leveling, inventory, and PvP!",
    usage: "{p}adventure | {p}adventure status | {p}adventure pvp <@mention>",
    cooldown: 5,
    hasPrefix: false,
    role: 0
  },

  players: {},

  initPlayer(id) {
    if (!this.players[id]) {
      this.players[id] = {
        level: 1,
        exp: 0,
        hp: 100,
        maxHp: 100,
        inventory: [],
        inBattle: false,
        bossHp: 0,
        defending: false,
        currentBoss: null,
        pvp: null
      };
    }
  },

  gainExp(player, amount) {
    player.exp += amount;
    if (player.exp >= player.level * 50) {
      player.exp = 0;
      player.level++;
      player.maxHp += 20;
      player.hp = player.maxHp;
      return `🎉 You leveled up! Now Level ${player.level} 🔥\n(HP restored to ${player.maxHp} ❤️)`;
    }
    return "";
  },

  scenarios: [
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
  ],

  bosses: [
    { name: "🐉 Dragon", hp: 80, atk: 15 },
    { name: "👹 Demon Lord", hp: 100, atk: 20 },
    { name: "🦴 Skeleton King", hp: 70, atk: 12 }
  ],

  async onCall({ message, args }) {
    const userId = message.senderID;
    this.initPlayer(userId);

    const player = this.players[userId];

    if (args[0] === "status") {
      return message.reply(
        `📊 STATUS\n\n🏅 Level: ${player.level}\n⭐ EXP: ${player.exp}/${player.level * 50}\n❤️ HP: ${player.hp}/${player.maxHp}\n🎒 Inventory: ${player.inventory.length > 0 ? player.inventory.join(", ") : "Empty"}`
      );
    }

    // PvP System
    if (args[0] === "pvp") {
      if (!message.mentions[0]) {
        return message.reply("❌ Mention a player to challenge in PvP!");
      }
      const opponentId = message.mentions[0];
      this.initPlayer(opponentId);

      if (opponentId === userId) return message.reply("❌ You can't fight yourself!");

      player.pvp = opponentId;
      this.players[opponentId].pvp = userId;

      return message.reply(
        `⚔️ PvP Battle Started!\n${userId} VS ${opponentId}\n\nBoth players reply with:\n1️⃣ Attack\n2️⃣ Defend\n3️⃣ Heal`,
        (err, info) => {
          global.utils.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            type: "pvp",
            players: [userId, opponentId]
          });
        }
      );
    }

    // Random Boss Encounter
    if (Math.random() < 0.2 && !player.inBattle) {
      const boss = this.bosses[Math.floor(Math.random() * this.bosses.length)];
      player.inBattle = true;
      player.bossHp = boss.hp;
      player.currentBoss = boss;

      return message.reply(
        `⚔️ A wild ${boss.name} appears!\nHP: ${boss.hp}\n\nChoose your move:\n1️⃣ Attack\n2️⃣ Defend\n3️⃣ Heal`,
        (err, info) => {
          global.utils.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: userId,
            type: "battle"
          });
        }
      );
    }

    // Normal Scenario
    const scene = this.scenarios[Math.floor(Math.random() * this.scenarios.length)];
    message.reply(scene.text, (err, info) => {
      global.utils.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: userId,
        type: "story",
        choices: scene.choices
      });
    });
  },

  async onReply({ message, event, Reply }) {
    const userId = event.senderID;
    this.initPlayer(userId);
    const player = this.players[userId];
    const choice = event.body.trim();

    // BOSS BATTLE
    if (Reply.type === "battle" && userId === Reply.author) {
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
        delete this.players[userId];
        return message.reply(`${msg}\n💀 You were defeated by ${boss.name}! Game Over. Type 'adventure' to restart.`);
      } else if (player.bossHp <= 0) {
        player.inBattle = false;
        const expGain = 30 + Math.floor(Math.random() * 20);
        const levelUpMsg = this.gainExp(player, expGain);
        return message.reply(`${msg}\n🏆 You defeated ${boss.name}!\n⭐ Gained ${expGain} EXP\n${levelUpMsg}`);
      } else {
        return message.reply(`${msg}\n\n❤️ Your HP: ${player.hp}/${player.maxHp}\n👹 ${boss.name}'s HP: ${player.bossHp}`);
      }
    }

    // STORY MODE
    if (Reply.type === "story" && userId === Reply.author) {
      if (Reply.choices[choice]) {
        const outcome = Reply.choices[choice];
        player.hp += outcome.hp || 0;
        if (outcome.hp === 100) player.hp = player.maxHp;
        if (outcome.item) player.inventory.push(outcome.item);
        const levelUpMsg = this.gainExp(player, outcome.exp || 0);

        if (player.hp <= 0) {
          delete this.players[userId];
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

    // PVP MODE
    if (Reply.type === "pvp" && Reply.players.includes(userId)) {
      const opponentId = Reply.players.find(id => id !== userId);
      const opponent = this.players[opponentId];
      let msg = "";

      if (!opponent) return message.reply("⚠️ Opponent not found.");

      if (choice === "1") { // Attack
        let dmg = Math.floor(Math.random() * 15) + 5;
        if (Math.random() < 0.2) {
          dmg *= 2;
          msg += "💥 Critical Hit!\n";
        }
        opponent.hp -= dmg;
        msg += `⚔️ You hit your opponent for ${dmg} damage!\n`;

      } else if (choice === "2") { // Defend
        msg += "🛡️ You prepare to defend!\n";
        player.defending = true;

      } else if (choice === "3") { // Heal
        let heal = Math.floor(Math.random() * 15) + 5;
        player.hp = Math.min(player.maxHp, player.hp + heal);
        msg += `✨ You healed for ${heal} HP!\n`;

      } else {
        return message.reply("❌ Invalid choice. Reply with 1, 2, or 3.");
      }

      if (opponent.hp <= 0) {
        const expGain = 40;
        const levelUpMsg = this.gainExp(player, expGain);
        delete opponent.pvp;
        delete player.pvp;
        return message.reply(`${msg}\n🏆 You defeated your opponent!\n⭐ Gained ${expGain} EXP\n${levelUpMsg}`);
      } else if (player.hp <= 0) {
        delete player.pvp;
        delete opponent.pvp;
        return message.reply("💀 You were defeated in PvP!");
      } else {
        return message.reply(
          `${msg}\n\n❤️ Your HP: ${player.hp}/${player.maxHp}\n👤 Opponent HP: ${opponent.hp}/${opponent.maxHp}`
        );
      }
    }
  }
};
