const { cmd } = require('../command');

// Map pou kenbe moun ki deja resevwa warning pou pa spam avètisman
let warnedUsers = new Map();

cmd({
    pattern: 'antistatus',
    alias: ['antimention'],
    desc: 'Auto warn & kick users who mention admins/owner in chat or WhatsApp status',
    category: 'group',
    react: '⚠️',
    filename: __filename
}, 
async (conn, mek, m, { from, isGroup, isAdmins, reply, groupMetadata }) => {
    if (!isGroup) return reply("❌ This command only works in groups.");
    if (!isAdmins) return reply("❌ Only group admins can enable anti-status.");

    await reply("✅ *Anti-Status System Enabled!* Non-admins will get warned once before kick if they mention admins/owner in chat or status.");

    // Event listener pou tout messages nan group
    conn.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;
        const sender = msg.key.participant || msg.key.remoteJid;

        // Skip si mesaj sòti nan bot
        if (sender === conn.user.jid) return;

        // Skip admin oswa owner
        const participant = groupMetadata.participants.find(p => p.id === sender);
        if (!participant) return;
        if (participant.admin === 'admin' || participant.admin === 'superadmin') return;

        // Detecte chat mentions
        const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        // Detecte status type (ephemeral story update)
        const isStatus = msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption || msg.message?.documentMessage?.caption || '';

        const containsMention = mentions.length > 0 || /@admin|@owner|@sudo/i.test(messageText + isStatus);

        if (containsMention) {
            if (!warnedUsers.has(sender)) {
                // Premye fwa: warning
                await conn.sendMessage(from, { text: `⚠️ ${participant.id.split('@')[0]}, you are not allowed to mention admins/owner in chat or status! This is your 1 warning.` });
                warnedUsers.set(sender, true);
            } else {
                // Kick moun ki kontinye
                try {
                    await conn.groupParticipantsUpdate(from, [sender], 'remove');
                    warnedUsers.delete(sender);
                    await conn.sendMessage(from, { text: `❌ ${participant.id.split('@')[0]} has been removed for mentioning admins/owner again.` });
                } catch (err) {
                    console.error("Kick error:", err);
                }
            }
        }
    });
});