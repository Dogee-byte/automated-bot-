const fs = require("fs");
const fetch = require("node-fetch");
const FormData = require("form-data");

module.exports.config = {
  name: "image",
  aliases: ["img", "edit"],
  description: "Generate or edit images",
  credit: "ARI (api by ari)",
  usage: "[generate <prompt>] | [edit <prompt> (with image)]",
};

module.exports.run = async function ({ api, event, args }) {
  const subcommand = args[0];
  const prompt = args.slice(1).join(" ") || "A beautiful painting";

  if (subcommand === "generate" || subcommand === "gen") {
    try {
      const response = await fetch("https://imageeditor-api.onrender.com/generate", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ prompt }),
      });

      const data = await response.json();
      if (!data.file) return message.reply("❌ Failed to generate image.");

      const imgStream = fs.createWriteStream("gen.png");
      const fileRes = await fetch(data.preview);
      fileRes.body.pipe(imgStream);

      imgStream.on("finish", async () => {
        await message.reply({
          body: `✅ Generated image for:\n"${prompt}"`,
          attachment: fs.createReadStream("gen.png"),
        });
      });
    } catch (err) {
      console.error(err);
      return message.reply("⚠️ Error while generating image.");
    }
  }

  else if (subcommand === "edit") {
    if (!message.attachments || message.attachments.length === 0) {
      return message.reply("❌ Please attach an image to edit.");
    }

    try {
      const imageUrl = message.attachments[0].url;
      const imageBuffer = await (await fetch(imageUrl)).arrayBuffer();

      const form = new FormData();
      form.append("prompt", prompt);
      form.append("image", Buffer.from(imageBuffer), { filename: "input.png" });

      const response = await fetch("https://imageeditor-api.onrender.com/edit", {
        method: "POST",
        body: form,
      });

      const data = await response.json();
      if (!data.file) return message.reply("❌ Failed to edit image.");

      const imgStream = fs.createWriteStream("edit.png");
      const fileRes = await fetch(data.preview);
      fileRes.body.pipe(imgStream);

      imgStream.on("finish", async () => {
        await message.reply({
          body: `✏️ Edited image with:\n"${prompt}"`,
          attachment: fs.createReadStream("edit.png"),
        });
      });
    } catch (err) {
      console.error(err);
      return message.reply("⚠️ Error while editing image.");
    }
  }

  else {
    return message.reply(
      `📌 Usage:\n- image generate <prompt>\n- image edit <prompt> (with attached image)`
    );
  }
};
