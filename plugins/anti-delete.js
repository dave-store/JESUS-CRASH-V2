const { cmd } = require('../command');
const { getAnti, setAnti } = require('../data/antidel');

cmd({
    pattern: "antidelete",
    alias: ['antidel', 'ad'],
    desc: "Toggle anti-delete feature",
    category: "misc",
    filename: __filename
},
async (conn, mek, m, { from, reply, text, isCreator }) => {
    // 🔒 Only bot owner
    if (!isCreator) 
        return reply('❌ *This command is only for the bot owner.*');

    try {
        const currentStatus = await getAnti();
        const action = (text || '').toLowerCase().trim();

        // 📝 Show current status
        if (!action || action === 'status') {
            return reply(
`╭─〔 🤖 *AntiDelete Status* 〕
├ Status: ${currentStatus ? '✅ ON' : '❌ OFF'}
├ Usage:
│ • .antidelete on  → Enable
│ • .antidelete off → Disable
│ • .antidelete status → Show status
╰─────────────────`
            );
        }

        // ✅ Turn ON
        if (action === 'on') {
            if (currentStatus) return reply('✅ Anti-delete is already enabled');
            await setAnti(true);
            return reply('✅ Anti-delete has been *enabled*');
        }

        // ❌ Turn OFF
        if (action === 'off') {
            if (!currentStatus) return reply('❌ Anti-delete is already disabled');
            await setAnti(false);
            return reply('❌ Anti-delete has been *disabled*');
        }

        // ⚠️ Invalid input
        return reply(
`❌ Invalid command.
Usage:
• .antidelete on
• .antidelete off
• .antidelete status`
        );

    } catch (e) {
        console.error("❌ Error in antidelete command:", e);
        return reply("⚠️ An error occurred while processing your request.");
    }
});