const Canvas = require("canvas");
const fs = require("fs");
const axios = require("axios");

module.exports.config = {
  name: "welcome",
  eventType: ["log:subscribe"], // Trigger kapag may bagong pasok sa GC
  version: "1.0.0",
  credits: "ari",
  description: "Magpapadala ng welcome card kapag may bagong pasok sa GC"
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    for (let participant of event.logMessageData.addedParticipants) {
      const userID = participant.userFbId;
      const userName = participant.fullName || "Bagong Member";

      // Kunin profile picture ng bagong member
      const pfpURL = `https://graph.facebook.com/${userID}/picture?width=512&height=512`;
      const response = await axios.get(pfpURL, { responseType: "arraybuffer" });
      const avatar = await Canvas.loadImage(response.data);

      // Canvas setup (gumamit ng sukat ng template mo)
      const canvas = Canvas.createCanvas(1536, 675);
      const ctx = canvas.getContext("2d");

      // Background (yung template mo)
      const background = await Canvas.loadImage("https://i.imgur.com/YDhYS33.png");
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      // Profile picture sa circle (exact coords for your template)
      const x = 1310; // circle center X
      const y = 460;  // circle center Y
      const radius = 95;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(avatar, x - radius, y - radius, radius * 2, radius * 2);

      // Save output
      const filePath = __dirname + "/cache/welcome.png";
      const out = fs.createWriteStream(filePath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);

      out.on("finish", () => {
        api.sendMessage(
          {
            body: `🎉 Welcome to the group, ${userName}!`,
            attachment: fs.createReadStream(filePath),
          },
          event.threadID,
          () => fs.unlinkSync(filePath) // delete after sending
        );
      });
    }
  } catch (err) {
    console.error(err);
    api.sendMessage("❌ Nagka-error sa paggawa ng welcome card.", event.threadID);
  }
};
