const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const os = require("os");

module.exports.config = {
  name: "image",
  aliases: ["img", "edit"],
  description: "Generate or edit images",
  credit: "ARI (api by ari)",
  usage: "[generate|edit] <prompt> (attach image optional for edit)",
};

function getTempFileName(prefix = "img") {
  return path.join(os.tmpdir(), `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`);
}

async function fetchImageToFile(url, tempFile) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  const buffer = Buffer.from(res.data);
  await fs.promises.writeFile(tempFile, buffer);
}

async function processImage({ api, event, prompt, type, mainImageUrl = null, maskUrl = null }) {
  try {
    let data;

    if (type === "generate") {
      const response = await axios.post("https://imageeditor-api.onrender.com/generate", { prompt });
      data = response.data;
      if (!data.file || !data.preview) throw new Error("Failed to generate image.");
    } 
    else if (type === "edit") {
      if (!mainImageUrl) throw new Error("No main image URL provided.");

      const form = new FormData();
      form.append("prompt", prompt);

      const mainBuffer = (await axios.get(mainImageUrl, { responseType: "arraybuffer" })).data;
      form.append("image", mainBuffer, { filename: "input.png" });

      if (maskUrl) {
        const maskBuffer = (await axios.get(maskUrl, { responseType: "arraybuffer" })).data;
        form.append("mask", maskBuffer, { filename: "mask.png" });
      }

      const response = await axios.post("https://imageeditor-api.onrender.com/edit", form, {
        headers: form.getHeaders(),
      });

      data = response.data;
      if (!data.file || !data.preview) throw new Error("Failed to edit image.");
    }

    const tempFile = getTempFileName(type === "generate" ? "gen" : "edit");
    await fetchImageToFile(data.preview, tempFile);

    await api.sendMessage(
      {
        body: type === "generate"
          ? `✅ Generated image for:\n"${prompt}"`
          : `✏️ Edited image with:\n"${prompt}"`,
        attachment: fs.createReadStream(tempFile),
      },
      event.threadID
    );

    fs.unlink(tempFile, () => {});
  } catch (err) {
    console.error(err);
    await api.sendMessage(
      `⚠️ Error while ${type === "generate" ? "generating" : "editing"} image: ${err.message}`,
      event.threadID
    );
  }
}

module.exports.run = async function ({ api, event, args }) {
  let subcommand = args[0]?.toLowerCase();
  const attachments = event.messageAttachments || [];

  if (!["generate", "gen", "edit"].includes(subcommand)) {
    subcommand = attachments.length ? "edit" : "generate";
  } else if (subcommand === "gen") {
    subcommand = "generate";
  }

  const promptStartIndex = ["generate", "gen", "edit"].includes(args[0]?.toLowerCase()) ? 1 : 0;
  const prompt = args.slice(promptStartIndex).join(" ").trim();

  if (!prompt) {
    return api.sendMessage(
      "❌ Please provide a prompt for generating or editing an image.\n📌 Usage:\n- image generate <prompt>\n- image edit <prompt> (attach image, optional mask)",
      event.threadID
    );
  }

  if (subcommand === "generate") {
    return processImage({ api, event, prompt, type: "generate" });
  } else if (subcommand === "edit") {
    if (!attachments.length) {
      return api.sendMessage("❌ Please attach an image to edit.", event.threadID);
    }

    const mainImageUrl = attachments[0].url;
    const maskUrl = attachments.length > 1 ? attachments[1].url : null;

    return processImage({ api, event, prompt, type: "edit", mainImageUrl, maskUrl });
  } else {
    return api.sendMessage(
      `📌 Usage:\n- image generate <prompt>\n- image edit <prompt> (attach image, optional mask)`,
      event.threadID
    );
  }
};
