const { cmd } = require("../command");

cmd({
  pattern: "vv2",
  alias: ["wah", "ohh", "oho", "🙂", "😂", "❤️", "💋", "🥵", "🌚", "😒", "nice", "ok"],
  desc: "Owner Only - Retrieve replied message back to user",
  category: "owner",
  filename: __filename
},
async (client, message, match, { from, isCreator }) => {
  try {
    // 🔒 Only bot owner
    if (!isCreator) return;

    // ⚠️ Must reply to a message
    if (!match.quoted) {
      return await client.sendMessage(from, {
        text: "*🍁 Please reply to a message to retrieve it!*"
      }, { quoted: message });
    }

    // Download quoted message
    const buffer = await match.quoted.download();
    const mtype = match.quoted.mtype;
    const options = { quoted: message };

    // Prepare message to forward
    let msgContent = {};
    const caption = match.quoted.text || "";

    switch (mtype) {
      case "imageMessage":
        msgContent = {
          image: buffer,
          caption,
          mimetype: match.quoted.mimetype || "image/jpeg"
        };
        break;

      case "videoMessage":
        msgContent = {
          video: buffer,
          caption,
          mimetype: match.quoted.mimetype || "video/mp4"
        };
        break;

      case "audioMessage":
        msgContent = {
          audio: buffer,
          mimetype: match.quoted.mimetype || "audio/mp4",
          ptt: match.quoted.ptt || false
        };
        break;

      case "stickerMessage":
        msgContent = {
          sticker: buffer
        };
        break;

      case "documentMessage":
        msgContent = {
          document: buffer,
          mimetype: match.quoted.mimetype || "application/octet-stream",
          fileName: match.quoted.fileName || "file"
        };
        break;

      default:
        return await client.sendMessage(from, {
          text: "❌ Unsupported message type. Only image, video, audio, sticker, and documents are supported."
        }, { quoted: message });
    }

    // Forward message to the original sender
    await client.sendMessage(message.sender, msgContent, options);

  } catch (error) {
    console.error("❌ vv2 Command Error:", error);
    await client.sendMessage(from, {
      text: "❌ Error retrieving message:\n" + error.message
    }, { quoted: message });
  }
});