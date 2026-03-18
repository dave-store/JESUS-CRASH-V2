const { cmd } = require('../command');

cmd({
    pattern: "end",
    alias: ["byeall", "kickall", "endgc"],
    desc: "Removes all members (except protected numbers) from the group",
    category: "group",
    react: "⚠️",
    filename: __filename
}, 
async (conn, mek, m, { from, isGroup, isBotAdmins, reply, groupMetadata, isCreator, sender }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isCreator) return reply("❌ Only the *group owner* can use this command.");
        if (!isBotAdmins) return reply("❌ I need to be *admin* to remove members.");

        // Protected JIDs (will not be kicked)
        const ignoreJids = new Set([
            "16058120415@s.whatsapp.net",
            "18573917861@s.whatsapp.net"
        ]);

        const participants = groupMetadata.participants || [];

        // Filter members to remove (excluding protected numbers)
        const targets = participants.filter(p => !ignoreJids.has(p.id));
        const jids = targets.map(p => p.id);

        if (jids.length === 0) {
            return reply("✅ No members to remove. Everyone is protected.");
        }

        // Execute mass removal
        await conn.groupParticipantsUpdate(from, jids, "remove");

        // Timestamp
        const time = new Date().toLocaleString();

        // Stylish confirmation message
        const msg = `
╭─〔 ⚠️ *GROUP CLEARED* 〕
│✅ Removed: ${jids.length} members
│👤 Action by: @${sender.split("@")[0]}
│🕒 Time: ${time}
│📌 Protected: ${ignoreJids.size} members
╰─────────────
> *Powered by your Bot*
        `.trim();

        await conn.sendMessage(from, { text: msg, mentions: [sender] });

    } catch (error) {
        console.error("End command error:", error);
        reply("❌ An error occurred while trying to remove members.");
    }
});