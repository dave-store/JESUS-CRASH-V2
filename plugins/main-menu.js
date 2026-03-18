// commands/menu.js
const os = require('os');
const { cmd, commands } = require('../command');
const config = require('../config');

// Security & Rate Limiting
const securityDB = {
    cooldowns: new Map(),
    sessionLocks: new Set(),
    userRequests: new Map(),
    spamDetection: new Map()
};

// Configuration
const SECURITY_CONFIG = {
    COOLDOWN_MS: 10000,           // 10 seconds between menu requests
    MAX_REQUESTS_PER_MIN: 3,      // Max 3 menus per minute
    SESSION_LOCK_MS: 30000,       // 30s lock during menu session
    HACKING_SEQUENCE_DELAY: 800,  // Delay between hacking messages
    LOADING_STAGES_DELAY: 600     // Delay between loading stages
};

// Small caps function
function toSmallCaps(str) {
    const smallCaps = {
        A: 'ᴀ', B: 'ʙ', C: 'ᴄ', D: 'ᴅ', E: 'ᴇ', F: 'ғ', G: 'ɢ', H: 'ʜ',
        I: 'ɪ', J: 'ᴊ', K: 'ᴋ', L: 'ʟ', M: 'ᴍ', N: 'ɴ', O: 'ᴏ', P: 'ᴘ',
        Q: 'ǫ', R: 'ʀ', S: 's', T: 'ᴛ', U: 'ᴜ', V: 'ᴠ', W: 'ᴡ', X: 'x',
        Y: 'ʏ', Z: 'ᴢ', ' ': ' ', '.': '.', '-': '-', '_': '_', 
        '0': '𝟶', '1': '𝟷', '2': '𝟸', '3': '𝟹', '4': '𝟺',
        '5': '𝟻', '6': '𝟼', '7': '𝟽', '8': '𝟾', '9': '𝟿'
    };
    return str.toUpperCase().split('').map(c => smallCaps[c] || c).join('');
}

// Utility to sleep
const wait = ms => new Promise(res => setTimeout(res, ms));

// Check if user is spamming
function checkSpam(userId) {
    const now = Date.now();
    
    // Check cooldown
    const lastRequest = securityDB.cooldowns.get(userId);
    if (lastRequest && now - lastRequest < SECURITY_CONFIG.COOLDOWN_MS) {
        const remaining = Math.ceil((SECURITY_CONFIG.COOLDOWN_MS - (now - lastRequest)) / 1000);
        return { allowed: false, reason: 'cooldown', remaining };
    }
    
    // Check rate limit (per minute)
    if (!securityDB.userRequests.has(userId)) {
        securityDB.userRequests.set(userId, []);
    }
    
    const requests = securityDB.userRequests.get(userId).filter(ts => now - ts < 60000);
    securityDB.userRequests.set(userId, requests);
    
    if (requests.length >= SECURITY_CONFIG.MAX_REQUESTS_PER_MIN) {
        return { allowed: false, reason: 'rate_limit' };
    }
    
    // Check session lock
    if (securityDB.sessionLocks.has(userId)) {
        return { allowed: false, reason: 'session_active' };
    }
    
    // Record request
    requests.push(now);
    securityDB.cooldowns.set(userId, now);
    
    return { allowed: true };
}

// Hacking mode sequence messages
const HACKING_SEQUENCE = [
    {
        text: `🔓 *INITIATING BREACH PROTOCOL...*
        
╭━━━━━━━━━━━━━━━━━━━━━╮
┃ 🛡️ BYPASSING FIREWALL ┃
┃ ⏳ Progress: 23%       ┃
╰━━━━━━━━━━━━━━━━━━━━━╯

🌐 Establishing secure tunnel...`,
        react: '🔓'
    },
    {
        text: `💻 *INJECTING PAYLOAD...*
        
╭━━━━━━━━━━━━━━━━━━━━━╮
┃ 🦠 DECRYPTING DATA    ┃
┃ ⏳ Progress: 47%       ┃
╰━━━━━━━━━━━━━━━━━━━━━╯

📡 Uploading exploit modules...`,
        react: '💻'
    },
    {
        text: `⚡ *BYPASSING SECURITY LAYERS...*
        
╭━━━━━━━━━━━━━━━━━━━━━╮
┃ 🔓 CRACKING HASHES    ┃
┃ ⏳ Progress: 68%       ┃
╰━━━━━━━━━━━━━━━━━━━━━╯

🎯 Penetrating defense systems...`,
        react: '⚡'
    },
    {
        text: `🚀 *ROOT ACCESS ACQUIRED...*
        
╭━━━━━━━━━━━━━━━━━━━━━╮
┃ ✅ SYSTEM COMPROMISED ┃
┃ ⏳ Progress: 89%       ┃
╰━━━━━━━━━━━━━━━━━━━━━╯

📊 Extracting classified data...`,
        react: '🚀'
    },
    {
        text: `🎯 *INJECTION COMPLETE*
        
╭━━━━━━━━━━━━━━━━━━━━━╮
┃ 🔥 HACK SUCCESSFUL    ┃
┃ ⏳ Progress: 100%     ┃
╰━━━━━━━━━━━━━━━━━━━━━╯

⚡ Welcome to the mainframe...`,
        react: '🎯'
    }
];

// Loading stages with progress bar
const LOADING_STAGES = [
    { bar: '⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛', percent: '0%', icon: '⚫' },
    { bar: '🟥⬛⬛⬛⬛⬛⬛⬛⬛⬛', percent: '12%', icon: '🔴' },
    { bar: '🟥🟥⬛⬛⬛⬛⬛⬛⬛⬛', percent: '25%', icon: '🟠' },
    { bar: '🟧🟧🟧⬛⬛⬛⬛⬛⬛⬛', percent: '37%', icon: '🟡' },
    { bar: '🟨🟨🟨🟨⬛⬛⬛⬛⬛⬛', percent: '50%', icon: '💛' },
    { bar: '🟩🟩🟩🟩🟩⬛⬛⬛⬛⬛', percent: '62%', icon: '🟢' },
    { bar: '🟩🟩🟩🟩🟩🟩⬛⬛⬛⬛', percent: '75%', icon: '🔵' },
    { bar: '🟦🟦🟦🟦🟦🟦🟦⬛⬛⬛', percent: '87%', icon: '🔷' },
    { bar: '🟪🟪🟪🟪🟪🟪🟪🟪⬛⬛', percent: '94%', icon: '🟣' },
    { bar: '✅✅✅✅✅✅✅✅✅✅', percent: '100%', icon: '✨' }
];

cmd({
    pattern: 'menu',
    alias: ['allmenu', 'jesus', 'help', 'cmd'],
    desc: 'Show command menu with hacking sequence',
    category: 'menu',
    react: '📜',
    filename: __filename
}, async (conn, mek, m, { from, pushname, isOwner, reply }) => {
    
    const userId = m.sender;
    
    // 🛡️ ANTI-SPAM CHECK
    const spamCheck = checkSpam(userId);
    if (!spamCheck.allowed) {
        const warnings = {
            cooldown: `⏳ *CHILL MODE ACTIVATED*\n\nPlease wait *${spamCheck.remaining}s* before accessing the menu again.\n\n🛡️ Anti-spam protection active.`,
            rate_limit: `🚫 *RATE LIMIT EXCEEDED*\n\nYou've opened the menu too many times. Try again in 1 minute.\n\n⚡ Max 3 requests per minute allowed.`,
            session_active: `⚠️ *SESSION IN PROGRESS*\n\nPlease complete or cancel the current menu session.`
        };
        
        return reply(warnings[spamCheck.reason] || '⛔ Access temporarily denied.');
    }
    
    // Lock session
    securityDB.sessionLocks.add(userId);

  setTimeout(() => {
    securityDB.sessionLocks.delete(userId);
}, SECURITY_CONFIG.SESSION_LOCK_MS);
  
    // Helper for safe message sending
    const safeSend = async (content, options = {}) => {
        try {
            return await conn.sendMessage(from, content, options);
        } catch (e) {
            console.error('Send error:', e.message);
            return null;
        }
    };
    
    // Helper for safe reaction
    const safeReact = async (emoji, key) => {
        try {
            await conn.sendMessage(from, { react: { text: emoji, key } });
        } catch (e) { /* ignore */ }
    };

    try {
        const prefix = config.PREFIX || '.';
        const botName = config.BOT_NAME || 'JESUS-CRASH-V2';
        const ownerName = config.OWNER_NAME || '𝐃𝐀𝐖𝐄𝐍𝐒 𝐁𝐎𝐘';
        const menuImage = config.MENU_IMAGE_URL || 'https://files.catbox.moe/5srfgj.png';
        const userName = pushname || 'User';
        const mode = config.MODE || 'public';

        // 1️⃣ INITIAL PROMPT
        const promptMsg = await safeSend({
            text: `🎯 *ACCESS REQUEST DETECTED*

👤 User: @${userId.split('@')[0]}
🔐 Status: *PENDING AUTHORIZATION*

React with ✅ or reply "ready" within *30 seconds* to proceed.

🛡️ _Security verification required..._`,
            mentions: [userId]
        }, { quoted: mek });

        await safeReact('🔐', promptMsg?.key || mek.key);

        // 2️⃣ WAIT FOR CONFIRMATION
        const waitForConfirmation = (timeoutMs = 30000) => new Promise((resolve) => {
            let resolved = false;
            const handlers = [];

            const cleanup = () => {
                handlers.forEach(({ event, handler }) => {
                    try {
                        conn.ev?.off?.(event, handler);
                        conn.removeListener?.(event, handler);
                    } catch (e) {}
                });
            };

            const timeout = setTimeout(() => {
                if (!resolved) {
                    cleanup();
                    resolve(null);
                }
            }, timeoutMs);

            // Reaction handler
            const onReaction = (reaction) => {
                try {
                    const react = Array.isArray(reaction) ? reaction[0] : reaction;
                    if (!react?.key) return;

                    const isTargetMsg = react.key.remoteJid === from && 
                                       react.key.id === promptMsg?.key?.id;
                    const participant = String(react.participant || '').split(':')[0];
                    
                    if (!isTargetMsg || participant !== userId) return;

                    const emoji = react.text || react.reaction || '';
                    const accepted = ['✅', '👍', '✔️', '☑️', '🆗', '👌', '🔥', '💯'].includes(emoji);

                    if (accepted && !resolved) {
                        resolved = true;
                        cleanup();
                        clearTimeout(timeout);
                        resolve({ type: 'reaction', emoji });
                    }
                } catch (e) {}
            };

            // Text reply handler
            const onUpsert = (upsert) => {
                try {
                    const items = Array.isArray(upsert) ? upsert : [upsert];
                    
                    for (const item of items) {
                        const messages = item.messages || [];
                        
                        for (const msg of messages) {
                            if (!msg?.key || !msg?.message) continue;
                            
                            const isFromUser = msg.key.participant === userId || 
                                               msg.key.remoteJid === userId;
                            if (!isFromUser) continue;

                            const text = (msg.message.conversation || 
                                       msg.message.extendedTextMessage?.text || '').toLowerCase();
                            
                            const isReplyToPrompt = msg.message.extendedTextMessage?.contextInfo?.stanzaId === promptMsg?.key?.id;
                            const positiveWords = ['ready', 'yes', 'ok', 'go', 'start', 'proceed', '👍', '✅', '🔥'];
                            const matches = positiveWords.some(w => text.includes(w));

                            if ((isReplyToPrompt || matches) && !resolved) {
                                resolved = true;
                                cleanup();
                                clearTimeout(timeout);
                                resolve({ type: 'text', content: text });
                                return;
                            }
                        }
                    }
                } catch (e) {}
            };

            // Attach handlers
            if (conn.ev?.on) {
                conn.ev.on('messages.reaction', onReaction);
                conn.ev.on('messages.upsert', onUpsert);
                handlers.push({ event: 'messages.reaction', handler: onReaction });
                handlers.push({ event: 'messages.upsert', handler: onUpsert });
            }
        });

        const confirmation = await waitForConfirmation(30000);

        if (!confirmation) {
            securityDB.sessionLocks.delete(userId);
            await safeSend({
                text: '⏳ *SESSION EXPIRED*\n\nNo confirmation received. Access denied.\n\n🔒 Security protocol terminated.'
            }, { quoted: promptMsg });
            return;
        }

        // ✅ CONFIRMED - START SEQUENCE
        await safeReact('✅', promptMsg?.key);

        // 3️⃣ HACKING MODE SEQUENCE (5 Messages)
        let lastHackingMsg = promptMsg;
        
        for (let i = 0; i < HACKING_SEQUENCE.length; i++) {
            const step = HACKING_SEQUENCE[i];
            
            // Send hacking message
            const hackingMsg = await safeSend({
                text: step.text,
                edit: lastHackingMsg?.key // Try to edit if supported
            }, lastHackingMsg?.key ? {} : { quoted: lastHackingMsg });

            // If edit failed, send new message
            if (!hackingMsg && lastHackingMsg) {
                const newMsg = await safeSend({ text: step.text }, { quoted: lastHackingMsg });
                lastHackingMsg = newMsg || lastHackingMsg;
            } else {
                lastHackingMsg = hackingMsg || lastHackingMsg;
            }

            // Add reaction
            await safeReact(step.react, lastHackingMsg?.key);
            
            // Delay between messages
            await wait(SECURITY_CONFIG.HACKING_SEQUENCE_DELAY);
        }

        // 4️⃣ LOADING SEQUENCE (Progress Bar)
        let loadingMsg = lastHackingMsg;
        
        for (let i = 0; i < LOADING_STAGES.length; i++) {
            const stage = LOADING_STAGES[i];
            const loadingText = `${stage.icon} *SYSTEM INITIALIZATION*
            
╭━━━━━━━━━━━━━━━━━━━━━╮
┃ ${stage.bar} ┃
┃ ${stage.percent} COMPLETE    ┃
╰━━━━━━━━━━━━━━━━━━━━━╯

${i === LOADING_STAGES.length - 1 ? '🚀 Finalizing secure connection...' : '⏳ Loading modules...'}`;

            // Try to edit previous message
            try {
                await conn.sendMessage(from, {
                    text: loadingText,
                    edit: loadingMsg?.key
                });
            } catch (e) {
                // If edit fails, send new and update reference
                const newMsg = await safeSend({ text: loadingText }, { quoted: loadingMsg });
                if (newMsg) loadingMsg = newMsg;
            }
            
            await wait(SECURITY_CONFIG.LOADING_STAGES_DELAY);
        }

        // 5️⃣ FINAL LOADING COMPLETE
        await safeSend({
            text: `✨ *ACCESS GRANTED*
            
🔓 Secure connection established
🛡️ Anti-spam systems active
⚡ Menu loading complete...`
        }, { quoted: loadingMsg });

        await wait(500);

        // 6️⃣ BUILD AND SEND MENU
        const uptime = () => {
            const sec = process.uptime();
            const h = Math.floor(sec / 3600);
            const m = Math.floor((sec % 3600) / 60);
            const s = Math.floor(sec % 60);
            return `${h}h ${m}m ${s}s`;
        };

        const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
        const totalRam = (os.totalmem() / 1024 / 1024).toFixed(1);

        // Group commands
        const grouped = {};
        for (const plugin of commands) {
            const cat = (plugin.category || 'other').toUpperCase();
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(plugin);
        }

        // Build header
        let header = `╭━━━〔 🚀 ${botName} 〕━━━⬣
┃ 👑 Owner   : ${ownerName}
┃ 👤 User    : ${userName}
┃ ⚡ Mode    : ${mode}
┃ ⏳ Uptime  : ${uptime()}
┃ 🧠 Memory  : ${ramUsage}MB / ${totalRam}MB
┃ 📦 Total   : ${commands.length} cmds
┃ 🔰 Prefix  : ${prefix}
┃ 🛡️ Secure  : ${spamCheck.allowed ? '✅' : '⚠️'}
┃ 📅 ${new Date().toLocaleDateString()} | 🕒 ${new Date().toLocaleTimeString()}
╰━━━━━━━━━━━━━━━━━━━━⬣\n`;

        // Build menu body
        let menuBody = '';
        const categories = Object.keys(grouped).sort();
        
        for (const cat of categories) {
            const cmds = grouped[cat]
                .filter(c => c.pattern)
                .sort((a, b) => a.pattern.localeCompare(b.pattern));
            
            if (cmds.length === 0) continue;
            
            menuBody += `\n\n╔═══❖•ೋ 🌐 *${toSmallCaps(cat)}* ೋ•❖═══╗\n`;
            
            cmds.forEach((cmdItem, idx) => {
                const usage = cmdItem.pattern.split('|')[0];
                const desc = cmdItem.desc || 'No description';
                const line = idx % 2 === 0 ? '║' : '┃';
                menuBody += `${line} ${idx + 1}. ${prefix}${toSmallCaps(usage)}\n`;
                menuBody += `${line}    └─ ${desc.substring(0, 25)}${desc.length > 25 ? '...' : ''}\n`;
            });
            
            menuBody += `╚════════════════════╝`;
        }

        menuBody += `\n\n⚡ ${toSmallCaps('Powered by DAWENS BOY')}
🔒 ${toSmallCaps('Secure Session Active')}
🚫 ${toSmallCaps('Spam Protection: ON')}`;

        // Send final menu with image
        const finalMenu = await safeSend({
            image: { url: menuImage },
            caption: (header + menuBody).trim(),
            contextInfo: {
                mentionedJid: [userId],
                forwardingScore: 999,
                isForwarded: true,
                externalAdReply: {
                    title: `${botName} Command Center`,
                    body: `Secure Access | ${commands.length} Commands Available`,
                    thumbnailUrl: menuImage,
                    sourceUrl: 'https://github.com/JawadTechXD',
                    mediaType: 1
                }
            }
        }, { quoted: loadingMsg });

        // 7️⃣ BONUS: Send audio (random selection)
        const audioOptions = [
            'https://files.catbox.moe/3cj1e3.mp4',
            'https://files.catbox.moe/vq3odo.mp4',
            'https://files.catbox.moe/fo2kz0.mp4'
        ];
        
        const randomAudio = audioOptions[Math.floor(Math.random() * audioOptions.length)];
        
        try {
            await conn.sendMessage(from, {
                audio: { url: randomAudio },
                mimetype: 'audio/mp4'
                ptt: true, // Voice note format (safer)
                contextInfo: {
                    mentionedJid: [userId]
                }
            }, { quoted: finalMenu });
        } catch (e) {
            console.log('Audio send failed:', e.message);
        }

        // 8️⃣ SESSION CLEANUP
        await wait(5000); // Keep lock for 5 seconds after menu
        securityDB.sessionLocks.delete(userId);

        // Log successful access
        console.log(`[MENU] ${userId} accessed menu at ${new Date().toISOString()}`);

    } catch (error) {
        // Cleanup on error
        securityDB.sessionLocks.delete(userId);
        console.error('❌ Menu Error:', error);
        
        await safeSend({
            text: `❌ *SYSTEM ERROR*\n\nAn error occurred while loading the menu.\nPlease try again later.\n\n🆔 Error ID: ${Date.now().toString(36)}`
        });
    }
});

// Additional utility commands
cmd({
    pattern: 'menustats',
    alias: ['menuinfo', 'security'],
    desc: 'Show menu security statistics',
    category: 'menu',
    react: '🛡️',
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const stats = {
        activeCooldowns: securityDB.cooldowns.size,
        activeSessions: securityDB.sessionLocks.size,
        totalRequests: Array.from(securityDB.userRequests.values()).reduce((a, b) => a + b.length, 0),
        spamBlocked: Array.from(securityDB.spamDetection.values()).filter(Boolean).length
    };
    
    const text = `🛡️ *MENU SECURITY STATS*

📊 Current Status:
• Active Cooldowns: ${stats.activeCooldowns}
• Active Sessions: ${stats.activeSessions}
• Total Requests: ${stats.totalRequests}
• Spam Blocked: ${stats.spamBlocked}

⚙️ Configuration:
• Cooldown: ${SECURITY_CONFIG.COOLDOWN_MS / 1000}s
• Max/Min: ${SECURITY_CONFIG.MAX_REQUESTS_PER_MIN}
• Session Lock: ${SECURITY_CONFIG.SESSION_LOCK_MS / 1000}s

✅ System operational.`;
    
    return reply(text);
});

// Quick menu for trusted users (shorter sequence)
cmd({
    pattern: 'qmenu',
    alias: ['quickmenu', 'fastmenu'],
    desc: 'Quick menu access (no hacking sequence)',
    category: 'menu',
    react: '⚡',
    filename: __filename
}, async (conn, mek, m, { from, pushname, isOwner, reply }) => {
    // Only for owner or sudo users
    if (!isOwner && !config.SUDO?.includes(m.sender.split('@')[0])) {
        return reply('⛔ *PREMIUM ONLY*\n\nThis command is reserved for authorized users.\nUse .menu for standard access.');
    }
    
    // Skip directly to loading (faster)
    // ... (simplified version of main menu)
    return reply('⚡ Quick access granted! (Implement quick menu logic here)');
});
