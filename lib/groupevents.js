// Credits: DAWENS-BOY96 - jesus-crash-v1 💜
// Channel: https://whatsapp.com/channel/0029VbCHd5V1dAw132PB7M1B

const { isJidGroup } = require('@whiskeysockets/baileys');
const config = require('../config');

// Cache for group metadata to avoid repeated calls
const groupCache = new Map();
const CACHE_DURATION = 60000; // 1 minute

// Fallback profile pictures
const fallbackPPs = [
    'https://i.ibb.co/KhYC4FY/1221bc0bc0bdd2354b42b293317ff2adbcf-icon.png',
];

// Audio URLs for different events
const eventAudios = {
    welcome: 'https://files.catbox.moe/welcome.mp3',      // New member
    goodbye: 'https://files.catbox.moe/goodbye.mp3',      // Member left
    promote: 'https://files.catbox.moe/promote.mp3',      // Admin promoted
    demote: 'https://files.catbox.moe/demote.mp3',        // Admin demoted
    alert: 'https://files.catbox.moe/alert.mp3'           // Security alert
};

// Quick cache getter
const getCachedMetadata = async (conn, jid) => {
    const now = Date.now();
    const cached = groupCache.get(jid);
    
    if (cached && (now - cached.time) < CACHE_DURATION) {
        return cached.data;
    }
    
    const metadata = await conn.groupMetadata(jid);
    groupCache.set(jid, { data: metadata, time: now });
    return metadata;
};

// Fast profile picture getter
const getPP = (conn, jid) => {
    return conn.profilePictureUrl(jid, 'image').catch(() => 
        fallbackPPs[Math.floor(Math.random() * fallbackPPs.length)]
    );
};

// Quick time formatter
const getTime = () => new Date().toLocaleTimeString();

// Optimized sudo check with Set
const sudoSet = new Set((config.SUDO || '').split(',').map(n => n.trim()));
const isSudo = (num) => sudoSet.has(num);

// Message templates - pre-built for speed
const templates = {
    welcome: (user, meta, count, time, desc) => 
        `╭━━━〔 🎉 *WELCOME* 〕━━━⬣\n┃ 👤 @${user}\n┃ 🏠 *${meta.subject}*\n┃ 👥 Member: *#${count}*\n┃ ⏰ ${time}\n┣━━━━━━━━━━━━━━━\n┃ 📜 *Group Info*\n┃ ${desc}\n┣━━━━━━━━━━━━━━━\n┃ 🚀 *${config.BOT_NAME}*\n╰━━━━━━━━━━━━━━━⬣`,

    goodbye: (user, time, count) => 
        `╭━━━〔 😔 *GOODBYE* 〕━━━⬣\n┃ 👤 @${user}\n┃ ⏰ ${time}\n┃ 👥 Left • Members: *${count}*\n┣━━━━━━━━━━━━━━━\n┃ 💔 We will miss you...\n┃ 🚀 *${config.BOT_NAME}*\n╰━━━━━━━━━━━━━━━⬣`,

    demoteAlert: (user, actor, time) => 
        `╭━━━〔 🚨 *SECURITY ALERT* 〕━━━⬣\n┃ ⚠️ Unauthorized DEMOTE\n┃ 🎯 Target: @${user}\n┃ 🛑 By: @${actor}\n┃ ⏰ ${time}\n┣━━━━━━━━━━━━━━━\n┃ 🔒 Action: Removed\n┃ 🚀 *${config.BOT_NAME}*\n╰━━━━━━━━━━━━━━━⬣`,

    demoteLog: (actor, user, time, subject) => 
        `╭━━━〔 ⚠️ *ADMIN LOG* 〕━━━⬣\n┃ 👤 @${actor}\n┃ 📉 Demoted @${user}\n┃ ⏰ ${time}\n┃ 📍 ${subject}\n╰━━━━━━━━━━━━━━━⬣`,

    promoteAlert: (user, actor, time) => 
        `╭━━━〔 🚨 *SECURITY ALERT* 〕━━━⬣
┃ ⚠️ Unauthorized PROMOTE
┃ 🎯 Target: @${user}
┃ 🛑 By: @${actor}
┃ ⏰ ${time}
┣━━━━━━━━━━━━━━━
┃ 🔒 Action: Removed
┃ 🚀 *${config.BOT_NAME}*
╰━━━━━━━━━━━━━━━⬣`,

    promoteLog: (actor, user, time, subject) => 
        `╭━━━〔 🎉 *ADMIN LOG* 〕━━━⬣
┃ 👤 @${actor}
┃ 📈 Promoted @${user}
┃ ⏰ ${time}
┃ 📍 ${metadata.subject}
╰━━━━━━━━━━━━━━━⬣`
};

const GroupEvents = async (conn, update) => {
    try {
        if (!isJidGroup(update.id)) return;

        const { id, participants, action, author } = update;
        if (!participants?.length) return;

        // Parallel fetching for speed
        const [metadata, groupPP] = await Promise.all([
            getCachedMetadata(conn, id),
            getPP(conn, id)
        ]);

        const desc = metadata.desc || "No description available.";
        const memberCount = metadata.participants.length;
        const time = getTime();
        const actor = author?.split("@")[0];

        // Process all participants in parallel
        const promises = participants.map(async (jid) => {
            const user = jid.split("@")[0];
            const mentions = [jid];
            if (author) mentions.push(author);

            switch (action) {
                case "add":
                    if (!config.WELCOME) return;
                    await conn.sendMessage(id, {
                        image: { url: groupPP },
                        caption: templates.welcome(user, metadata, memberCount, time, desc),
                        mentions
                    });
                    // Send welcome audio
                    await conn.sendMessage(id, {
                        audio: { url: eventAudios.welcome },
                        mimetype: 'audio/mp4',
                        ptt: true // Voice note
                    });
                    break;

                case "remove":
                    if (!config.GOODBYE) return;
                    await conn.sendMessage(id, {
                        image: { url: groupPP },
                        caption: templates.goodbye(user, time, memberCount),
                        mentions
                    });
                    // Send goodbye audio
                    await conn.sendMessage(id, {
                        audio: { url: eventAudios.goodbye },
                        mimetype: 'audio/mp4',
                        ptt: true
                    });
                    break;

                case "demote":
                    if (!isSudo(actor) && config.SECURITY_ALERT) {
                        await conn.sendMessage(id, {
                            text: templates.demoteAlert(user, actor, time),
                            mentions
                        });
                        // Send alert audio
                        await conn.sendMessage(id, {
                            audio: { url: eventAudios.alert },
                            mimetype: 'audio/mp4',
                            ptt: true
                        });
                        // Remove unauthorized actor
                        await conn.groupParticipantsUpdate(id, [author], "remove");
                    } else if (config.ADMIN_EVENTS) {
                        await conn.sendMessage(id, {
                            text: templates.demoteLog(actor, user, time, metadata.subject),
                            mentions
                        });
                        // Send demote audio
                        await conn.sendMessage(id, {
                            audio: { url: eventAudios.demote },
                            mimetype: 'audio/mp4',
                            ptt: true
                        });
                    }
                    break;

                case "promote":
                    if (!isSudo(actor) && config.SECURITY_ALERT) {
                        await conn.sendMessage(id, {
                            text: templates.promoteAlert(user, actor, time),
                            mentions
                        });
                        // Send alert audio
                        await conn.sendMessage(id, {
                            audio: { url: eventAudios.alert },
                            mimetype: 'audio/mp4',
                            ptt: true
                        });
                        // Remove unauthorized actor
                        await conn.groupParticipantsUpdate(id, [author], "remove");
                    } else if (config.ADMIN_EVENTS) {
                        await conn.sendMessage(id, {
                            text: templates.promoteLog(actor, user, time, metadata.subject),
                            mentions
                        });
                        // Send promote audio
                        await conn.sendMessage(id, {
                            audio: { url: eventAudios.promote },
                            mimetype: 'audio/mp4',
                            ptt: true
                        });
                    }
                    break;
            }
        });

        await Promise.all(promises);

    } catch (err) {
        console.error('❌ GroupEvents Error:', err.message);
    }
};

// Clean cache periodically
setInterval(() => {
    const now = Date.now();
    for (const [jid, data] of groupCache.entries()) {
        if ((now - data.time) > CACHE_DURATION) {
            groupCache.delete(jid);
        }
    }
}, CACHE_DURATION);

module.exports = GroupEvents;
