const { cmd } = require('../command');
const os = require("os");
const { runtime } = require('../lib/functions');
const config = require('../config');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// ==================== CACHE SYSTEM ====================
const aliveCache = {
    data: null,
    timestamp: 0,
    ttl: 10000 // 10 seconds cache for dynamic data
};

// Pre-load audio for instant response
let aliveAudio = null;
const loadAliveAudio = () => {
    if (aliveAudio) return aliveAudio;
    try {
        const paths = [
            path.join(__dirname, '../all/alive.m4a'),
            path.join(__dirname, '../all/menux.m4a'),
            path.join(__dirname, '../all/bot.mp3')
        ];
        for (const p of paths) {
            if (fs.existsSync(p)) {
                aliveAudio = fs.readFileSync(p);
                return aliveAudio;
            }
        }
    } catch (e) {}
    return null;
};
loadAliveAudio();

// System info cache (updates every 30s)
const sysCache = {
    cpu: null,
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    lastUpdate: 0
};

const getSysInfo = () => {
    const now = Date.now();
    if (now - sysCache.lastUpdate > 30000) {
        const cpus = os.cpus();
        sysCache.cpu = {
            model: cpus[0]?.model?.split(' ').slice(0, 3).join(' ') || 'Unknown',
            cores: cpus.length,
            speed: cpus[0]?.speed || 0
        };
        sysCache.lastUpdate = now;
    }
    return sysCache;
};

// Fast memory formatter
const formatBytes = (bytes) => {
    const mb = bytes / 1024 / 1024;
    const gb = mb / 1024;
    return gb > 1 ? `${gb.toFixed(2)} GB` : `${mb.toFixed(0)} MB`;
};

// Animated status bars
const createBar = (percent, length = 12) => {
    const filled = Math.round((percent / 100) * length);
    const empty = length - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const emoji = percent > 80 ? '🔴' : percent > 50 ? '🟡' : '🟢';
    return `${emoji} ${bar} ${percent.toFixed(0)}%`;
};

// Random alive quotes
const aliveQuotes = [
    "⚡ I'm faster than your internet!",
    "🤖 Always online, always ready!",
    "💎 Diamond performance activated!",
    "🔥 Running at maximum efficiency!",
    "🚀 Ready to serve you, boss!",
    "👑 Your wish is my command!",
    "💪 Stronger than yesterday!",
    "✨ Powered by pure energy!"
];

cmd({
    pattern: "alive",
    alias: ["bot", "online", "status", "ping", "up", "ready", "active"],
    desc: "💎 Check bot's diamond status with ultra speed",
    category: "main",
    react: "💎",
    filename: __filename
},
async (conn, mek, m, { from, sender, pushname, reply }) => {
    const startTime = performance.now();
    
    try {
        // Fast cache check for repeated calls
        const now = Date.now();
        let statusText;
        
        if (aliveCache.data && (now - aliveCache.timestamp) < aliveCache.ttl) {
            statusText = aliveCache.data;
        } else {
            // Gather system info (cached)
            const sys = getSysInfo();
            const memUsage = process.memoryUsage();
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMemPercent = ((totalMem - freeMem) / totalMem) * 100;
            const processMemPercent = (memUsage.heapUsed / totalMem) * 100;
            
            // Calculate load
            const loadAvg = os.loadavg();
            const cpuLoad = (loadAvg[0] / sys.cpu.cores * 100).toFixed(1);
            
            // Random quote
            const quote = aliveQuotes[Math.floor(Math.random() * aliveQuotes.length)];
            
            // Format uptime beautifully
            const upTime = runtime(process.uptime());
            const nodeVersion = process.version;
            const botVersion = config.VERSION || '4.0.0';
            
            // Build diamond status
            statusText = `
╭━━━❰ 💎 *𝐃𝐈𝐀𝐌𝐎𝐍𝐃 𝐒𝐓𝐀𝐓𝐔𝐒* 💎 ❱━━━╮
┃
┃ ${quote}
┃
┃ 🤖 *${config.BOT_NAME || 'JESUS-CRASH'}* v${botVersion}
┃ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ 👑 *Owner:* ${config.OWNER_NAME || 'DAWENS BOY'}
┃ 📝 *Prefix:* ${Array.isArray(config.PREFIX) ? config.PREFIX.join(', ') : config.PREFIX}
┃ 📳 *Mode:* ${config.MODE || 'public'}
┃ 🟢 *Status:* OPERATIONAL ⚡
┃
┃ 💾 *Memory Status*
┃ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ ${createBar(usedMemPercent)}
┃ 📦 Process: ${formatBytes(memUsage.heapUsed)}
┃ 💻 System: ${formatBytes(totalMem - freeMem)} / ${formatBytes(totalMem)}
┃
┃ ⚙️ *Processor Info*
┃ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ 🔧 ${sys.cpu.model}
┃ 🔢 ${sys.cpu.cores} Cores @ ${sys.cpu.speed}MHz
┃ 📊 Load: ${cpuLoad}% [${loadAvg.map(l => l.toFixed(1)).join(', ')}]
┃
┃ ⏱️ *System Uptime*
┃ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ 🕐 Bot: ${upTime}
┃ 🖥️ OS: ${runtime(os.uptime())}
┃ 📅 Platform: ${sys.platform}-${sys.arch}
┃ 🟢 Node.js: ${nodeVersion}
┃
┃ 🔗 *Quick Links*
┃ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ 📢 Channel: https://whatsapp.com/channel/0029Vb7J1Po4tRrqa88ZfQ3X
┃ 🐙 GitHub: https://github.com/dave-store/JESUS-CRASH-V2
┃
╰━━━❰ ⚡ *${((performance.now() - startTime)).toFixed(2)}ms* ⚡ ❱━━━╮
            `.trim();
            
            // Update cache
            aliveCache.data = statusText;
            aliveCache.timestamp = now;
        }

        // Send with diamond styling (parallel operations)
        const imagePromise = conn.sendMessage(from, {
            image: { url: 'https://files.catbox.moe/gufckm.png' },
            caption: statusText,
            contextInfo: {
                mentionedJid: [sender],
                externalAdReply: {
                    title: `💎 ${config.BOT_NAME || 'JESUS-CRASH'} is ONLINE`,
                    body: `⚡ ${runtime(process.uptime())} uptime | 🟢 Active`,
                    thumbnailUrl: 'https://files.catbox.moe/gufckm.png',
                    sourceUrl: 'https://whatsapp.com/channel/0029Vb7J1Po4tRrqa88ZfQ3X',
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    showAdAttribution: true
                },
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363419768812867@newsletter',
                    newsletterName: 'JESUS CRASH',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        // Send voice note in parallel (if available)
        const audioPromise = (async () => {
            const audio = aliveAudio || loadAliveAudio();
            if (audio) {
                await new Promise(r => setTimeout(r, 300)); // Natural flow
                return conn.sendMessage(from, {
                    audio: audio,
                    mimetype: 'audio/mp4',
                    ptt: true,
                    contextInfo: {
                        externalAdReply: {
                            title: '🎵 I\'m Alive!',
                            body: 'Tap to hear status',
                            thumbnailUrl: 'https://files.catbox.moe/gufckm.png'
                        }
                    }
                }, { quoted: mek });
            }
        })();

        // Execute both
        await Promise.all([imagePromise, audioPromise]);

    } catch (e) {
        console.error("[ALIVE] Error:", e);
        
        // Ultra-fast fallback
        const fallback = `
╭━━━❰ 🤖 *𝐁𝐎𝐓 𝐒𝐓𝐀𝐓𝐔𝐒* ❱━━━╮
┃
┃ 🟢 *ONLINE & READY*
┃ ⏱️ Uptime: ${runtime(process.uptime())}
┃ 📝 Prefix: ${config.PREFIX}
┃
╰━━━❰ ⚡ *${config.BOT_NAME || 'JESUS-CRASH'}* ⚡ ❱━━━╮
        `.trim();
        
        await conn.sendMessage(from, { text: fallback }, { quoted: mek });
    }
});

// Bonus: Detailed system command
cmd({
    pattern: "system",
    alias: ["sys", "specs", "hardware", "server"],
    desc: "🔧 Detailed system specifications",
    category: "main",
    react: "🔧",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const sys = getSysInfo();
        const cpus = os.cpus();
        
        // Detailed CPU info
        const cpuInfo = cpus.map((cpu, i) => {
            const speed = cpu.speed;
            const times = cpu.times;
            const total = Object.values(times).reduce((a, b) => a + b, 0);
            const idle = times.idle;
            const usage = ((1 - idle / total) * 100).toFixed(1);
            return `┃ Core ${i + 1}: ${usage}% @ ${speed}MHz`;
        }).slice(0, 4).join('\n'); // Show first 4 cores only

        const detailed = `
╭━━━❰ 🔧 *𝐒𝐘𝐒𝐓𝐄𝐌 𝐒𝐏𝐄𝐂𝐒* ❱━━━╮
┃
┃ 🖥️ *CPU Architecture*
┃ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ ${cpuInfo}
┃
┃ 💾 *Memory Details*
┃ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ 📦 Total: ${formatBytes(os.totalmem())}
┃ 💚 Free: ${formatBytes(os.freemem())}
┃ 📊 Usage: ${((1 - os.freemem() / os.totalmem()) * 100).toFixed(1)}%
┃
┃ 🌐 *Network Interfaces*
┃ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ ${Object.keys(os.networkInterfaces()).join(', ')}
┃
┃ 📂 *Process Info*
┃ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ 🆔 PID: ${process.pid}
┃ 📊 Threads: ${process.title}
┃ 🟢 Node: ${process.version}
┃
╰━━━❰ 💎 ${os.hostname()} 💎 ❱━━━╮
        `.trim();

        reply(detailed);

    } catch (e) {
        reply("❌ Failed to fetch system specs.");
    }
});
