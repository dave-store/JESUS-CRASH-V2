const os = require("os");
const { performance } = require("perf_hooks");
const { cmd } = require('../command');
const { execSync } = require('child_process');

// Cache for system info (updates every 30s)
const sysCache = {
    data: null,
    lastUpdate: 0,
    ttl: 30000
};

const getCachedSysInfo = () => {
    const now = Date.now();
    if (sysCache.data && (now - sysCache.lastUpdate) < sysCache.ttl) {
        return sysCache.data;
    }
    
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    
    sysCache.data = {
        cpuModel: cpus[0]?.model?.split(' ').slice(0, 3).join(' ') || "Unknown",
        cpuCores: cpus.length,
        totalMem: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2),
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        loadAvg: loadAvg.map(l => l.toFixed(2))
    };
    sysCache.lastUpdate = now;
    return sysCache.data;
};

const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (seconds) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
};

const getSpeedRating = (ping) => {
    if (ping < 50) return { emoji: '⚡', text: 'ULTRA FAST', color: '🔵' };
    if (ping < 100) return { emoji: '🚀', text: 'FAST', color: '🟢' };
    if (ping < 200) return { emoji: '✅', text: 'GOOD', color: '🟡' };
    if (ping < 500) return { emoji: '🐢', text: 'SLOW', color: '🟠' };
    return { emoji: '🐌', text: 'VERY SLOW', color: '🔴' };
};

cmd({
    pattern: "ping",
    alias: ["speed", "pong", "status", "stats", "system", "ram", "cpu"],
    desc: "💎 Check bot's diamond performance & system status",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, sender, pushname }) => {
    try {
        const startTime = performance.now();
        const sysInfo = getCachedSysInfo();
        
        // Multiple ping tests for accuracy
        const pings = [];
        for (let i = 0; i < 3; i++) {
            const s = performance.now();
            await new Promise(r => setTimeout(r, 10));
            pings.push(performance.now() - s);
        }
        const avgPing = (pings.reduce((a, b) => a + b, 0) / pings.length).toFixed(2);
        const rating = getSpeedRating(avgPing);
        
        // Memory details
        const memUsage = process.memoryUsage();
        const usedMemMB = (memUsage.rss / 1024 / 1024).toFixed(2);
        const heapUsed = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
        const heapTotal = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
        const external = (memUsage.external / 1024 / 1024).toFixed(2);
        const memPercent = ((memUsage.rss / os.totalmem()) * 100).toFixed(1);
        
        // Network stats (if available)
        let networkStats = '';
        try {
            const netStats = os.networkInterfaces();
            const activeInterfaces = Object.values(netStats).flat().filter(i => i.internal === false);
            networkStats = `📡 *Active Interfaces:* ${activeInterfaces.length}`;
        } catch (e) {
            networkStats = '📡 *Network:* N/A';
        }
        
        // Process info
        const pid = process.pid;
        const ppid = process.ppid;
        
        // Create progress bars
        const createBar = (percent, length = 10) => {
            const filled = Math.round((percent / 100) * length);
            const empty = length - filled;
            return '█'.repeat(filled) + '░'.repeat(empty);
        };
        
        const memBar = createBar(memPercent);
        const uptime = process.uptime();
        
        const statusMsg = `
╭━━━❰ 💎 *𝐃𝐈𝐀𝐌𝐎𝐍𝐃 𝐒𝐓𝐀𝐓𝐔𝐒* 💎 ❱━━━╮
┃
┃ ${rating.emoji} *Response Time*
┃ ━━━━━━━━━━━━━━━
┃ 🏓 *Ping:* ${avgPing} ms
┃ 📊 *Rating:* ${rating.color} ${rating.text}
┃
┃ 💾 *Memory Usage*
┃ ━━━━━━━━━━━━━━━
┃ ${memBar} ${memPercent}%
┃ 📦 *RSS:* ${usedMemMB} MB / ${sysInfo.totalMem} GB
┃ 🧠 *Heap:* ${heapUsed} MB / ${heapTotal} MB
┃ 🔗 *External:* ${external} MB
┃
┃ ⏱️ *System Uptime*
┃ ━━━━━━━━━━━━━━━
┃ 🕐 *Bot:* ${formatUptime(uptime)}
┃ 🖥️ *OS:* ${formatUptime(os.uptime())}
┃
┃ 🖥️ *Processor Info*
┃ ━━━━━━━━━━━━━━━
┃ ⚙️ *Model:* ${sysInfo.cpuModel}
┃ 🔢 *Cores:* ${sysInfo.cpuCores} cores
┃ 📈 *Load:* [${sysInfo.loadAvg.join(', ')}]
┃
┃ 🔧 *System Info*
┃ ━━━━━━━━━━━━━━━
┃ 💻 *Platform:* ${sysInfo.platform} (${sysInfo.arch})
┃ 🟢 *Node.js:* ${sysInfo.nodeVersion}
┃ 🆔 *PID:* ${pid}
┃ ${networkStats}
┃
╰━━━❰ 🤖 *${config.BOT_NAME || 'BOT'}* ❱━━━╯
        `.trim();

        // Send with fancy styling
        await conn.sendMessage(from, {
            text: statusMsg,
            contextInfo: {
                externalAdReply: {
                    title: `⚡ ${avgPing}ms - ${rating.text}`,
                    body: `💾 ${usedMemMB}MB RAM | ⏱️ ${formatUptime(uptime)}`,
                    thumbnailUrl: 'https://files.catbox.moe/gufckm.png',
                    sourceUrl: 'https://github.com/dave-store',
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

    } catch (err) {
        console.error("❌ Diamond Ping Error:", err);
        await conn.sendMessage(from, { 
            text: "❌ *System Check Failed*\nError: " + err.message 
        }, { quoted: mek });
    }
});

// Bonus: Real-time monitoring command
cmd({
    pattern: "monitor",
    alias: ["mon", "live", "rt"],
    desc: "📊 Real-time system monitoring",
    category: "main",
    react: "📈",
    filename: __filename
},
async (conn, mek, m, { from }) => {
    try {
        const samples = [];
        const duration = 5000; // 5 seconds
        const interval = 500;  // Sample every 500ms
        
        const msg = await conn.sendMessage(from, { 
            text: "📊 *Starting 5-second benchmark...*" 
        }, { quoted: mek });
        
        const startTime = Date.now();
        
        while (Date.now() - startTime < duration) {
            const memStart = process.memoryUsage().rss;
            const pingStart = performance.now();
            
            await new Promise(r => setTimeout(r, interval));
            
            const ping = performance.now() - pingStart;
            const mem = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
            
            samples.push({ ping: ping.toFixed(2), mem });
        }
        
        const avgPing = (samples.reduce((a, s) => a + parseFloat(s.ping), 0) / samples.length).toFixed(2);
        const maxPing = Math.max(...samples.map(s => parseFloat(s.ping))).toFixed(2);
        const minPing = Math.min(...samples.map(s => parseFloat(s.ping))).toFixed(2);
        const avgMem = (samples.reduce((a, s) => a + parseFloat(s.mem), 0) / samples.length).toFixed(2);
        
        const report = `
╭━━━❰ 📊 *𝐁𝐄𝐍𝐂𝐇𝐌𝐀𝐑𝐊 𝐑𝐄𝐒𝐔𝐋𝐓𝐒* ❱━━━╮
┃
┃ ⏱️ *Duration:* 5 seconds
┃ 📊 *Samples:* ${samples.length}
┃
┃ 🏓 *Ping Statistics*
┃ ━━━━━━━━━━━━━━━
┃ ⚡ *Average:* ${avgPing} ms
┃ 🐌 *Slowest:* ${maxPing} ms
┃ 🚀 *Fastest:* ${minPing} ms
┃
┃ 💾 *Memory Average:* ${avgMem} MB
┃
╰━━━❰ ✅ *Benchmark Complete* ❱━━━╯
        `.trim();
        
        await conn.sendMessage(from, { text: report }, { quoted: mek });
        
    } catch (err) {
        console.error("❌ Monitor Error:", err);
        reply("❌ Benchmark failed: " + err.message);
    }
});
