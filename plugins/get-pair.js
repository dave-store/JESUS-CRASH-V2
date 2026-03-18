const { cmd } = require('../command');
const axios = require('axios');
const { performance } = require('perf_hooks');

// ==================== CONFIGURATION ====================
const PAIR_CONFIG = {
    // Multiple APIs for redundancy
    APIS: [
        { url: 'https://jesus-crash-pair.onrender.com/code', name: 'Primary', timeout: 8000 },
        { url: 'https://jesus-crash-pair.onrender.com/code', name: 'Backup1', timeout: 10000 },
        { url: 'https://pair-web-qr.onrender.com/code', name: 'Backup2', timeout: 10000 }
    ],
    CACHE_DURATION: 300000, // 5 minutes cache
    MAX_RETRIES: 2,
    RATE_LIMIT: new Map() // Per-user rate limiting
};

// ==================== CACHE SYSTEM ====================
const pairCache = new Map();

const getCachedCode = (number) => {
    const cached = pairCache.get(number);
    if (cached && (Date.now() - cached.timestamp) < PAIR_CONFIG.CACHE_DURATION) {
        return cached.code;
    }
    return null;
};

const setCachedCode = (number, code) => {
    pairCache.set(number, { code, timestamp: Date.now() });
    
    // Clean old entries periodically
    if (pairCache.size > 100) {
        const now = Date.now();
        for (const [key, value] of pairCache.entries()) {
            if (now - value.timestamp > PAIR_CONFIG.CACHE_DURATION) {
                pairCache.delete(key);
            }
        }
    }
};

// ==================== RATE LIMITER ====================
const checkRateLimit = (userId) => {
    const now = Date.now();
    const userLimit = PAIR_CONFIG.RATE_LIMIT.get(userId);
    
    if (!userLimit) {
        PAIR_CONFIG.RATE_LIMIT.set(userId, { count: 1, firstRequest: now });
        return { allowed: true, remaining: 4 };
    }
    
    // Reset after 1 hour
    if (now - userLimit.firstRequest > 3600000) {
        PAIR_CONFIG.RATE_LIMIT.set(userId, { count: 1, firstRequest: now });
        return { allowed: true, remaining: 4 };
    }
    
    // Max 5 requests per hour
    if (userLimit.count >= 5) {
        const waitTime = Math.ceil((3600000 - (now - userLimit.firstRequest)) / 60000);
        return { allowed: false, waitTime };
    }
    
    userLimit.count++;
    return { allowed: true, remaining: 5 - userLimit.count };
};

// ==================== API CLIENT ====================
async function fetchWithFallback(number) {
    const startTime = performance.now();
    
    // Check cache first
    const cached = getCachedCode(number);
    if (cached) {
        return { code: cached, source: 'cache', time: 0 };
    }
    
    // Try APIs in sequence with failover
    for (const api of PAIR_CONFIG.APIS) {
        try {
            const response = await axios.get(`${api.url}?number=${encodeURIComponent(number)}`, {
                timeout: api.timeout,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'MINI-JESUS-CRASH-Pair/2.0'
                }
            });
            
            if (response.data?.code) {
                const code = response.data.code;
                setCachedCode(number, code);
                
                return {
                    code,
                    source: api.name,
                    time: (performance.now() - startTime).toFixed(2)
                };
            }
        } catch (err) {
            console.log(`[PAIR] ${api.name} failed: ${err.message}`);
            continue; // Try next API
        }
    }
    
    throw new Error('All pairing APIs failed');
}

// ==================== FORMATTERS ====================
const formatNumber = (num) => {
    // Format: +92 300 0000000
    if (num.length >= 10) {
        const country = num.slice(0, -10);
        const rest = num.slice(-10);
        const formatted = rest.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
        return country ? `+${country} ${formatted}` : `+${formatted}`;
    }
    return `+${num}`;
};

const createQRLink = (number, code) => {
    // Generate QR code link for easy scanning
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://wa.me/pair?num=${number}&code=${code}`)}`;
};

// ==================== MAIN HANDLER ====================
async function handleDiamondPair(conn, mek, m, options) {
    const { q, sender, senderNumber, reply, from, isGroup, pushname } = options;
    let { botName, imageUrl, useQR = false } = options;
    
    const startTime = performance.now();
    
    // Extract and validate number
    const rawNumber = q ? q.trim().replace(/[^0-9]/g, '') : senderNumber.replace(/[^0-9]/g, '');
    
    if (!rawNumber || rawNumber.length < 10 || rawNumber.length > 15) {
        return reply(`❌ *Invalid Number Format*\n\n` +
                    `📱 Please provide a valid phone number\n` +
                    `📝 Example: \`.pair 923000000000\`\n` +
                    `⚠️ Do not include + or spaces`);
    }
    
    // Rate limit check
    const rateCheck = checkRateLimit(sender);
    if (!rateCheck.allowed) {
        return reply(`⏳ *Rate Limit Exceeded*\n\n` +
                    `Please wait ${rateCheck.waitTime} minutes before requesting another code.\n` +
                    `💡 Tip: Codes are cached for 5 minutes if you lost yours.`);
    }
    
    // Group restriction for image mode
    if (imageUrl && isGroup) {
        return reply(`🔒 *Private Only*\n\n` +
                    `For security, pairing codes with images are only sent in private chat.\n` +
                    `📩 Please message me directly: wa.me/${conn.user.id.split(':')[0]}`);
    }
    
    // Fetch with loading indicator
    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
    
    try {
        const result = await fetchWithFallback(rawNumber);
        const { code, source, time } = result;
        
        // Format the number nicely
        const displayNumber = formatNumber(rawNumber);
        const remaining = rateCheck.remaining;
        
        // Build diamond message
        const diamondMessage = `
╭━━━❰ 🔐 *${botName} PAIRING* ❱━━━╮
┃
┃ 👤 *User:* ${pushname || 'Unknown'}
┃ 📱 *Number:* ${displayNumber}
┃ 🔢 *Code:* \`${code}\`
┃
┃ ⚡ *Generated in ${time}ms*
┃ 🔄 *Source:* ${source}
┃ 🛡️ *Remaining:* ${remaining} codes/hour
┃ ⏱️ *Expires:* 2 minutes
┃
┃ 📋 *Instructions:*
┃ 1️⃣ Open WhatsApp on your phone
┃ 2️⃣ Go to Settings → Linked Devices
┃ 3️⃣ Tap "Link a Device"
┃ 4️⃣ Enter code: *${code}*
┃
┃ 🆘 *Need help?* Contact support
┃
╰━━━❰ 💎 *${botName}* 💎 ❱━━━╮
        `.trim();
        
        // Send based on mode
        if (imageUrl) {
            // Image + caption mode
            await conn.sendMessage(from, {
                image: { url: imageUrl },
                caption: diamondMessage,
                contextInfo: {
                    mentionedJid: [sender],
                    externalAdReply: {
                        title: `🔐 ${botName} Pairing Code`,
                        body: `Code: ${code}`,
                        thumbnailUrl: imageUrl,
                        sourceUrl: `https://wa.me/${rawNumber}`,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: mek });
        } else {
            // Text mode with optional QR
            if (useQR) {
                const qrUrl = createQRLink(rawNumber, code);
                await conn.sendMessage(from, {
                    image: { url: qrUrl },
                    caption: diamondMessage
                }, { quoted: mek });
            } else {
                await reply(diamondMessage);
            }
        }
        
        // Send clean code for easy copying
        await reply(`📋 *Copy Code:*\n\`\`\`${code}\`\`\``);
        
        // Success reaction
        await conn.sendMessage(from, { 
            react: { text: "✅", key: mek.key } 
        });
        
        // Log for analytics
        console.log(`[PAIR] Success: ${rawNumber.slice(-4)} | Source: ${source} | Time: ${time}ms`);
        
    } catch (err) {
        console.error('[PAIR] Error:', err);
        
        await conn.sendMessage(from, { 
            react: { text: "❌", key: mek.key } 
        });
        
        throw err;
    }
}

// ==================== COMMANDS ====================

// ----- DIAMOND PAIR -----
cmd({
    pattern: "pair",
    alias: ["getpair", "clone", "code", "paircode", "session"],
    react: "🔐",
    desc: "Get pairing code for GHAFFAR-MD (Fast Mode)",
    category: "main",
    use: ".pair 923000000000",
    filename: __filename
}, async (conn, mek, m, extra) => {
    try {
        await handleDiamondPair(conn, mek, m, { 
            ...extra, 
            botName: "GHAFFAR-MD",
            useQR: false
        });
    } catch (err) {
        extra.reply(`❌ *Pairing Failed*\n\n` +
                  `Reason: ${err.message}\n` +
                  `💡 Try again in a few moments or use \`.pair2\` for alternative.`);
    }
});

// ----- DIAMOND PAIR 2 (With Image) -----
cmd({
    pattern: "pair2",
    alias: ["getpair2", "clone2", "reqpair", "pairimg"],
    react: "💎",
    desc: "Get pairing code for MINI-JESUS-CRASH (Premium Mode)",
    category: "main",
    use: ".pair2 923000000000",
    filename: __filename
}, async (conn, mek, m, extra) => {
    try {
        await handleDiamondPair(conn, mek, m, { 
            ...extra, 
            botName: "MINI-JESUS-CRASH",
            imageUrl: "https://files.catbox.moe/qfi0h5.jpg"
        });
    } catch (err) {
        extra.reply(`❌ *Premium Pairing Failed*\n\n` +
                  `Reason: ${err.message}\n` +
                  `💡 Try \`.pair\` for standard mode.`);
    }
});

// ----- QR PAIR (With QR Code) -----
cmd({
    pattern: "qrpair",
    alias: ["qr", "qrcode", "scan"],
    react: "📱",
    desc: "Get pairing code with QR code",
    category: "main",
    use: ".qrpair 923000000000",
    filename: __filename
}, async (conn, mek, m, extra) => {
    try {
        await handleDiamondPair(conn, mek, m, { 
            ...extra, 
            botName: extra.q ? "Custom Bot" : "MINI-JESUS-CRASH",
            useQR: true
        });
    } catch (err) {
        extra.reply(`❌ *QR Pairing Failed*\n\n${err.message}`);
    }
});

// ----- PAIR STATUS -----
cmd({
    pattern: "pairstatus",
    alias: ["pairinfo", "pairlimit"],
    react: "📊",
    desc: "Check pairing rate limit status",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { sender, reply }) => {
    const limit = PAIR_CONFIG.RATE_LIMIT.get(sender);
    
    if (!limit) {
        return reply(`✅ *Pairing Status*\n\n` +
                    `📊 Codes used: 0/5 this hour\n` +
                    `🟢 Status: Ready to pair!`);
    }
    
    const used = limit.count;
    const remaining = 5 - used;
    const resetTime = new Date(limit.firstRequest + 3600000).toLocaleTimeString();
    
    reply(`📊 *Pairing Rate Limit*\n\n` +
          `├ Used: ${used}/5 codes\n` +
          `├ Remaining: ${remaining} codes\n` +
          `├ Resets at: ${resetTime}\n` +
          `└ Cache: ${pairCache.size} active codes`);
});

module.exports = {
    fetchWithFallback,
    getCachedCode,
    checkRateLimit
};
