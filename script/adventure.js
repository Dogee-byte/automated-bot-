let adventures = {};

function randomEvent(adv) {
  const events = [
    {
      text: "🌧️ It suddenly rains heavily! You get soaked and lose energy.",
      effect: () => { adv.energy -= 10; adv.thirst += 10; }
    },
    {
      text: "🐺 A wild animal appears in the distance. Luckily, it doesn’t notice you.",
      effect: () => { adv.energy -= 5; }
    },
    {
      text: "🍎 You found a small apple tree! You eat and feel better.",
      effect: () => { adv.hunger += 20; adv.energy += 10; }
    },
    {
      text: "🚶 You meet a lost traveler. He shares some water with you.",
      effect: () => { adv.thirst += 20; }
    },
    {
      text: "🕷️ You got bitten by an insect. You feel weaker.",
      effect: () => { adv.energy -= 15; }
    }
  ];

  if (Math.random() < 0.4) { // 40% chance
    const event = events[Math.floor(Math.random() * events.length)];
    event.effect();
    return "\n\n⚡ Random Event: " + event.text;
  }
  return "";
}

module.exports.config = {
  name: "adventure",
  aliases: ["adv", "survival"],
  version: "3.0.0",
  credits: "AJ + GPT-5",
  description: "Realistic survival adventure with random events",
  cooldown: 5
};

module.exports.onCall = async function ({ message }) {
  const userID = message.senderID;

  if (adventures[userID]) {
    return message.reply("⚠️ You already have an ongoing adventure! Reply to continue.");
  }

  adventures[userID] = {
    stage: 1,
    hunger: 50,   
    thirst: 50,   
    energy: 50,   
    inventory: ["water", "chocolate"]
  };

  const intro = `🌍 **Welcome to Survival Adventure!**

You wake up stranded in a dense forest after your bus broke down.  
📊 Status: 🍖 Hunger: 50 | 💧 Thirst: 50 | ⚡ Energy: 50  
🎒 Inventory: Water, Chocolate

What will you do first?  
1️⃣ Look for a road  
2️⃣ Search for other people  
3️⃣ Explore deeper into the forest  

👉 Reply with 1, 2, or 3 to choose.`;

  message.reply(intro);
};

module.exports.onReply = async function ({ message, args }) {
  const userID = message.senderID;
  const choice = args[0]?.trim();

  if (!adventures[userID]) return;
  let adv = adventures[userID];
  let replyText = "";

  function status() {
    return `\n\n📊 Status:\n🍖 Hunger: ${adv.hunger}\n💧 Thirst: ${adv.thirst}\n⚡ Energy: ${adv.energy}`;
  }

  if (adv.stage === 1) {
    if (choice === "1") {
      adv.energy -= 10;
      adv.thirst -= 5;
      replyText = "🚶 You walk along a dirt path. After an hour, you find an old road sign but no cars in sight.\nNext step?\n1️⃣ Keep walking\n2️⃣ Rest and eat your chocolate";
      adv.stage = 2;
    } else if (choice === "2") {
      adv.energy -= 5;
      replyText = "📢 You call out for help... only silence. Suddenly, a stray dog approaches. It looks hungry.\nNext step?\n1️⃣ Share your chocolate\n2️⃣ Ignore and walk away";
      adv.stage = 3;
    } else if (choice === "3") {
      adv.energy -= 15;
      adv.thirst -= 10;
      replyText = "🌲 You head deeper into the forest. You hear rushing water... maybe a river nearby.\nNext step?\n1️⃣ Follow the sound\n2️⃣ Climb a tree to scout";
      adv.stage = 4;
    } else {
      replyText = "❌ Invalid choice. Reply with 1, 2, or 3.";
    }
  }

  else if (adv.stage === 2) {
    if (choice === "1") {
      adv.energy -= 15;
      adv.thirst -= 10;
      replyText = "🚷 You keep walking but it’s endless… the sun is setting. You feel tired.\nNext step?\n1️⃣ Look for shelter\n2️⃣ Keep moving despite exhaustion";
      adv.stage = 5;
    } else if (choice === "2") {
      adv.hunger += 20;
      adv.energy += 15;
      replyText = "🍫 You eat your chocolate and regain some energy.\nBut now you have less food left.\nNext step?\n1️⃣ Keep walking\n2️⃣ Sit and wait for help";
      adv.stage = 6;
    } else {
      replyText = "❌ Invalid choice.";
    }
  }

  replyText += randomEvent(adv);

  if (adv.hunger <= 0 || adv.thirst <= 0 || adv.energy <= 0) {
    replyText = "💀 You collapsed from exhaustion. Game Over.";
    delete adventures[userID];
  }

  message.reply(replyText + status());
  adventures[userID] = adv;
};
