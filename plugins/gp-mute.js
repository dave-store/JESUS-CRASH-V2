const config = require('../config');
const { cmd } = require('../command');
const { runtime } = require('../lib/functions');

cmd({
    pattern: "mute",
    alias: ["groupmute"],
    react: "🔇",
    desc: "Mute the group (Only admins can send messages).",
    category: "group",
    filename: __filename
},           
async (conn, mek, m, { from, isGroup, senderNumber, isAdmins, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isAdmins) return reply("❌ Only group admins can use this command.");
        if (!isBotAdmins) return reply("❌ I need to be an admin to mute the group.");

        // Apply group announcement mode
        await conn.groupSettingUpdate(from, "announcement");

        // Dynamic timestamp
        const time = new Date().toLocaleString();

        const mutedMsg = `
╭─〔 🔇 *GROUP MUTED* 〕
│✅ Group is now in *announcement mode*.
│ Only admins can send messages.
│
│👤 Action by: @${senderNumber.split("@")[0]}
│🕒 Time: ${time}
╰─────────────
> *Powered by ${config.OWNER_NAME}*
`;

        await conn.sendMessage(from, {
            text: mutedMsg,
            mentions: [m.sender]
        });

    } catch (e) {
        console.error("Error muting group:", e);
        reply("❌ Failed to mute the group. Please try again.");
    }
});