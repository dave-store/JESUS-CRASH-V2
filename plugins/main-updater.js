const { cmd } = require("../command");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const { setCommitHash, getCommitHash } = require("../data/updateDB");

// ==================== CONFIGURATION ====================
const REPO_API = "https://api.github.com/repos/dave-store/JESUS-CRASH-V2/commits/main";
const REPO_ZIP = "https://github.com/dave-store/JESUS-CRASH-V2/archive/main.zip";

const UPDATE_CONFIG = {
    PHASE_1_INTERVAL: 5 * 60 * 1000,    // 5 minutes
    PHASE_1_COUNT: 5,                    // 5 times
    PHASE_2_INTERVAL: 60 * 60 * 1000,  // 1 hour
    AUTO_UPDATE: true,                   // Enable auto-update
    CHECK_ON_STARTUP: true,              // Check on boot
    SILENT_MODE: true,                   // No spam in chat
    BACKUP_BEFORE_UPDATE: true,          // Create backup
    MAX_RETRY: 3,
    TIMEOUT: 15000
};

// ==================== STATE MANAGEMENT ====================
let updateState = {
    phase: 1,           // 1 = initial (5min), 2 = maintenance (1hr)
    count: 0,           // Counter for phase 1
    lastCheck: 0,
    lastUpdate: 0,
    isUpdating: false,
    timer: null,
    stats: {
        totalChecks: 0,
        updatesFound: 0,
        lastVersion: null
    }
};

// ==================== CORE FUNCTIONS ====================

// 🔁 Retry helper with exponential backoff
async function fetchWithRetry(url, options = {}, retries = UPDATE_CONFIG.MAX_RETRY) {
    for (let i = 0; i < retries; i++) {
        try {
            return await axios.get(url, { 
                timeout: UPDATE_CONFIG.TIMEOUT, 
                headers: {
                    'User-Agent': 'JESUS-CRASH-Updater/1.0'
                },
                ...options 
            });
        } catch (e) {
            if (i === retries - 1) throw e;
            await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
        }
    }
}

// 📦 Download with progress
async function downloadUpdate(url, destPath, onProgress = null) {
    const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
        timeout: 60000
    });

    const totalLength = response.headers['content-length'];
    let downloadedLength = 0;

    const writer = fs.createWriteStream(destPath);

    return new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => {
            downloadedLength += chunk.length;
            if (totalLength && onProgress) {
                const percent = Math.round((downloadedLength / totalLength) * 100);
                onProgress(percent);
            }
        });

        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

// 💾 Create backup
function createBackup() {
    if (!UPDATE_CONFIG.BACKUP_BEFORE_UPDATE) return null;
    
    try {
        const backupDir = path.join(__dirname, '../backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `backup-${timestamp}.zip`);
        
        const zip = new AdmZip();
        const sourceDir = path.join(__dirname, '..');
        
        const skipItems = ['node_modules', 'backups', '.git', 'latest.zip', 'latest'];
        
        function addDirectory(dirPath, zipPath) {
            const items = fs.readdirSync(dirPath);
            for (const item of items) {
                if (skipItems.includes(item)) continue;
                
                const fullPath = path.join(dirPath, item);
                const relativePath = path.join(zipPath, item);
                
                if (fs.lstatSync(fullPath).isDirectory()) {
                    addDirectory(fullPath, relativePath);
                } else {
                    zip.addLocalFile(fullPath, zipPath);
                }
            }
        }
        
        addDirectory(sourceDir, '');
        zip.writeZip(backupPath);
        
        // Keep only last 5 backups
        const backups = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('backup-'))
            .sort()
            .reverse();
        
        if (backups.length > 5) {
            backups.slice(5).forEach(f => {
                fs.unlinkSync(path.join(backupDir, f));
            });
        }
        
        return backupPath;
    } catch (e) {
        console.error('[AUTO-UPDATE] Backup failed:', e);
        return null;
    }
}

// 📁 Smart copy with merge strategy
function copyFolderSync(source, target, merge = true) {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }

    const skipFiles = [
        "config.js",
        "app.json",
        ".env",
        "sessions",
        "node_modules",
        "package-lock.json"
    ];

    const protectedContent = ['.env', 'config.js']; // Never overwrite these

    for (const item of fs.readdirSync(source)) {
        if (skipFiles.includes(item)) continue;

        const src = path.join(source, item);
        const dest = path.join(target, item);

        // Don't overwrite protected files
        if (protectedContent.includes(item) && fs.existsSync(dest)) {
            console.log(`[AUTO-UPDATE] Skipping protected file: ${item}`);
            continue;
        }

        if (fs.lstatSync(src).isDirectory()) {
            copyFolderSync(src, dest, merge);
        } else {
            // If merging and both are JSON, attempt merge
            if (merge && item.endsWith('.json') && fs.existsSync(dest)) {
                try {
                    const srcObj = JSON.parse(fs.readFileSync(src, 'utf8'));
                    const destObj = JSON.parse(fs.readFileSync(dest, 'utf8'));
                    const merged = { ...destObj, ...srcObj };
                    fs.writeFileSync(dest, JSON.stringify(merged, null, 2));
                    continue;
                } catch (e) {
                    // Fall through to normal copy
                }
            }
            fs.copyFileSync(src, dest);
        }
    }
}

// ==================== UPDATE ENGINE ====================

async function performUpdate(client = null, silent = UPDATE_CONFIG.SILENT_MODE) {
    if (updateState.isUpdating) {
        console.log('[AUTO-UPDATE] Update already in progress');
        return { success: false, reason: 'in_progress' };
    }

    updateState.isUpdating = true;
    const zipPath = path.join(__dirname, "latest.zip");
    const extractPath = path.join(__dirname, "latest");

    try {
        // Check for updates
        const { data } = await fetchWithRetry(REPO_API);
        const latestHash = data?.sha;

        if (!latestHash) {
            updateState.isUpdating = false;
            return { success: false, reason: 'fetch_failed' };
        }

        const currentHash = await getCommitHash();
        updateState.stats.lastVersion = currentHash;

        if (latestHash === currentHash) {
            updateState.isUpdating = false;
            updateState.stats.totalChecks++;
            return { success: false, reason: 'up_to_date', hash: currentHash };
        }

        // Notify if not silent
        if (client && !silent) {
            await client.sendMessage(client.user.id, { 
                text: `🚀 *Auto-update starting...*\nNew version: \`${latestHash.slice(0, 7)}\`` 
            });
        }

        console.log(`[AUTO-UPDATE] New version found: ${latestHash.slice(0, 7)}`);

        // Create backup
        const backupPath = createBackup();
        if (backupPath) {
            console.log(`[AUTO-UPDATE] Backup created: ${backupPath}`);
        }

        // Download
        await downloadUpdate(REPO_ZIP, zipPath, (percent) => {
            if (percent % 25 === 0) {
                console.log(`[AUTO-UPDATE] Download: ${percent}%`);
            }
        });

        // Extract
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        const source = path.join(extractPath, "JESUS-CRASH-main");
        const target = path.join(__dirname, "..");

        // Apply update
        copyFolderSync(source, target, true);

        // Save commit
        await setCommitHash(latestHash);

        // Cleanup
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
        if (fs.existsSync(extractPath)) {
            fs.rmSync(extractPath, { recursive: true, force: true });
        }

        updateState.stats.updatesFound++;
        updateState.lastUpdate = Date.now();

        // Notify completion
        if (client && !silent) {
            await client.sendMessage(client.user.id, { 
                text: `✅ *Auto-update complete!*\nVersion: \`${latestHash.slice(0, 7)}\`\nRestarting...` 
            });
        }

        console.log('[AUTO-UPDATE] Update successful, restarting...');
        
        // Graceful restart
        setTimeout(() => process.exit(0), 2000);

        return { success: true, hash: latestHash };

    } catch (err) {
        console.error('[AUTO-UPDATE] Error:', err.message);
        
        // Cleanup on error
        try {
            if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
            if (fs.existsSync(extractPath)) {
                fs.rmSync(extractPath, { recursive: true, force: true });
            }
        } catch {}

        if (client && !silent) {
            await client.sendMessage(client.user.id, { 
                text: `❌ *Auto-update failed:* ${err.message}` 
            });
        }

        updateState.isUpdating = false;
        return { success: false, reason: 'error', error: err.message };
    }
}

// ==================== SCHEDULER ====================

function getNextInterval() {
    if (updateState.phase === 1) {
        if (updateState.count < UPDATE_CONFIG.PHASE_1_COUNT) {
            return UPDATE_CONFIG.PHASE_1_INTERVAL; // 5 minutes
        } else {
            updateState.phase = 2;
            console.log('[AUTO-UPDATE] Switching to hourly maintenance mode');
            return UPDATE_CONFIG.PHASE_2_INTERVAL; // 1 hour
        }
    }
    return UPDATE_CONFIG.PHASE_2_INTERVAL; // 1 hour
}

function scheduleNext(client) {
    const delay = getNextInterval();
    const nextTime = new Date(Date.now() + delay).toLocaleTimeString();
    
    console.log(`[AUTO-UPDATE] Next check in ${delay/60000}min at ${nextTime}`);
    
    updateState.timer = setTimeout(async () => {
        if (updateState.phase === 1) {
            updateState.count++;
        }
        
        const result = await performUpdate(client, UPDATE_CONFIG.SILENT_MODE);
        
        // If update was performed or up-to-date, continue scheduling
        if (!result.success && result.reason !== 'in_progress') {
            scheduleNext(client);
        }
        // If successful, process will restart and reinitialize
        
    }, delay);
}

function initAutoUpdate(client) {
    if (!UPDATE_CONFIG.AUTO_UPDATE) return;
    
    console.log('[AUTO-UPDATE] Initializing...');
    console.log(`[AUTO-UPDATE] Phase 1: ${UPDATE_CONFIG.PHASE_1_COUNT} checks every 5min`);
    console.log('[AUTO-UPDATE] Phase 2: Hourly maintenance');
    
    // Initial check on startup (with delay)
    if (UPDATE_CONFIG.CHECK_ON_STARTUP) {
        setTimeout(() => {
            performUpdate(client, true).then(() => {
                scheduleNext(client);
            });
        }, 30000); // 30s after startup
    } else {
        scheduleNext(client);
    }
}

// ==================== COMMANDS ====================

cmd({
    pattern: "update",
    alias: ["upgrade", "sync", "up", "force-update"],
    react: "🆕",
    desc: "Manual update check and install",
    category: "system",
    filename: __filename
}, async (client, message, args, { reply, isOwner, from }) => {

    if (!isOwner) return reply("❌ Owner only command.");

    const force = args[0] === '--force';
    
    try {
        await reply("🔍 *Checking for updates...*");

        const { data } = await fetchWithRetry(REPO_API);
        const latestHash = data?.sha;

        if (!latestHash) {
            return reply("❌ Failed to fetch latest version.");
        }

        const currentHash = await getCommitHash();

        if (latestHash === currentHash && !force) {
            return reply("✅ *Already up-to-date!*\nUse `.update --force` to reinstall.");
        }

        if (force && latestHash === currentHash) {
            await reply("⚠️ *Force update requested...*");
        }

        await reply("🚀 *Starting update...*");

        const result = await performUpdate(client, false);
        
        if (!result.success && result.reason === 'up_to_date') {
            return reply("✅ No updates available.");
        }

        // If we get here, restart is happening
        await reply("⏳ *Finalizing...*");

    } catch (err) {
        console.error("Manual Update Error:", err);
        reply("❌ *Update failed:* " + err.message);
    }
});

cmd({
    pattern: "update-status",
    alias: ["upstatus", "version", "ver"],
    react: "📊",
    desc: "Check update system status",
    category: "system",
    filename: __filename
}, async (client, message, args, { reply, isOwner }) => {

    if (!isOwner) return reply("❌ Owner only.");

    try {
        const currentHash = await getCommitHash();
        const { data } = await fetchWithRetry(REPO_API);
        const latestHash = data?.sha;
        
        const nextCheck = updateState.timer ? 
            new Date(Date.now() + (updateState.timer._idleStart || 0)).toLocaleTimeString() : 
            'Not scheduled';

        const statusMsg = `
╭━━━❰ 📊 *UPDATE SYSTEM STATUS* ❱━━━╮
┃
┃ 🔄 *Auto-Update:* ${UPDATE_CONFIG.AUTO_UPDATE ? '✅ ON' : '❌ OFF'}
┃ 📍 *Current Phase:* ${updateState.phase === 1 ? 'Initial (5min)' : 'Maintenance (1hr)'}
┃ 🔢 *Phase 1 Count:* ${updateState.count}/${UPDATE_CONFIG.PHASE_1_COUNT}
┃
┃ 💾 *Version Info*
┃ ━━━━━━━━━━━━━━━
┃ 📦 Current: \`${currentHash?.slice(0, 7) || 'Unknown'}\`
┃ 🌐 Latest: \`${latestHash?.slice(0, 7) || 'Unknown'}\`
┃ 📊 Status: ${currentHash === latestHash ? '✅ Up-to-date' : '⚠️ Update available'}
┃
┃ 📈 *Statistics*
┃ ━━━━━━━━━━━━━━━
┃ 🔍 Total Checks: ${updateState.stats.totalChecks}
┃ ⬆️ Updates Applied: ${updateState.stats.updatesFound}
┃ 🕐 Last Check: ${updateState.lastCheck ? new Date(updateState.lastCheck).toLocaleString() : 'Never'}
┃ ⏱️ Next Check: ${nextCheck}
┃
╰━━━❰ 🤖 ${config.BOT_NAME || 'BOT'} ❱━━━╮
        `.trim();

        reply(statusMsg);

    } catch (err) {
        reply("❌ Failed to fetch status: " + err.message);
    }
});

cmd({
    pattern: "toggle-autoupdate",
    alias: ["autoupdate", "toggleup"],
    react: "⚙️",
    desc: "Enable/disable auto-updates",
    category: "system",
    filename: __filename
}, async (client, message, args, { reply, isOwner }) => {

    if (!isOwner) return reply("❌ Owner only.");

    UPDATE_CONFIG.AUTO_UPDATE = !UPDATE_CONFIG.AUTO_UPDATE;
    
    if (UPDATE_CONFIG.AUTO_UPDATE) {
        reply("✅ *Auto-update ENABLED*\nBot will check every 5min × 5, then hourly.");
        if (!updateState.timer) initAutoUpdate(client);
    } else {
        if (updateState.timer) {
            clearTimeout(updateState.timer);
            updateState.timer = null;
        }
        reply("❌ *Auto-update DISABLED*\nUse `.update` for manual checks.");
    }
});

// Export for external use
module.exports = {
    initAutoUpdate,
    performUpdate,
    getUpdateState: () => updateState,
    UPDATE_CONFIG
};
