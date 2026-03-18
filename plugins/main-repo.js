const config = require('../config');
const { cmd, commands } = require('../command');
const os = require("os");
const { runtime } = require('../lib/functions');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Cache for repo data (5 minutes)
let repoCache = {
    data: null,
    timestamp: 0,
    ttl: 300000 // 5 minutes
};

const REPO_URL = 'https://github.com/dave-store/JESUS-CRASH-V2';
const CHANNEL_URL = 'https://whatsapp.com/channel/0029Vb7J1Po4tRrqa88ZfQ3X';

// Pre-load audio buffer for speed
let audioBuffer = null;
const loadAudio = () => {
    if (audioBuffer) return audioBuffer;
    try {
        const audioPath = path.join(__dirname, '../all/menux.m4a');
        if (fs.existsSync(audioPath)) {
            audioBuffer = fs.readFileSync(audioPath);
            return audioBuffer;
        }
    } catch (e) {
        console.error('[REPO] Audio load error:', e);
    }
    return null;
};

// Initialize audio on startup
loadAudio();

cmd({
    pattern: "repo",
    alias: ["sc", "script", "repository", "git", "github", "source"],
    desc: "💎 Fetch GitHub repository information with diamond styling",
    react: "💎",
    category: "menu",
    filename: __filename,
}, 
async (conn, mek, m, { from, reply, pushname, sender }) => {
    const startTime = Date.now();
    
    try {
        // Fast cache check
        const now = Date.now();
        let repoData;
        
        if (repoCache.data && (now - repoCache.timestamp) < repoCache.ttl) {
            repoData = repoCache.data;
            console.log('[REPO] Served from cache');
        } else {
            // Extract username and repo name
            const [, username, repoName] = REPO_URL.match(/github\.com\/([^/]+)\/([^/]+)/);
            
            // Fetch with timeout and retry
            const fetchRepo = async (retries = 2) => {
                try {
                    const response = await axios.get(
                        `https://api.github.com/repos/${username}/${repoName}`,
                        {
                            timeout: 5000,
                            headers: {
                                'Accept': 'application/vnd.github.v3+json',
                                'User-Agent': 'JESUS-CRASH-Bot'
                            }
                        }
                    );
                    return response.data;
                } catch (e) {
                    if (retries > 0) return fetchRepo(retries - 1);
                    throw e;
                }
            };
            
            repoData = await fetchRepo();
            
            // Update cache
            repoCache = {
                data: repoData,
                timestamp: now,
                ttl: 300000
            };
        }

        // Calculate response time
        const responseTime = Date.now() - startTime;

        // Format numbers with commas
        const formatNum = (n) => n?.toLocaleString() || '0';
        
        // Get system info for extra flair
        const platform = os.platform();
        const arch = os.arch();

        // Diamond-styled message
        const formattedInfo = `
╭━━━❰ 💎 *𝐑𝐄𝐏𝐎𝐒𝐈𝐓𝐎𝐑𝐘 𝐈𝐍𝐅𝐎* 💎 ❱━━━╮
┃
┃ 📦 *${repoData.full_name || 'JESUS-CRASH'}*
┃ ━━━━━━━━━━━━━━━━━━━━━━━
┃ ⭐ *Stars:* ${formatNum(repoData.stargazers_count)} ⭐
┃ 🍴 *Forks:* ${formatNum(repoData.forks_count)} 🍴
┃ 👁️ *Watchers:* ${formatNum(repoData.watchers_count)} 👁️
┃ 📝 *Issues:* ${formatNum(repoData.open_issues_count)} 📝
┃
┃ 📋 *Description:*
┃ \`\`\`${repoData.description || 'World Best WhatsApp Bot'}\`\`\`
┃
┃ 🏷️ *Language:* ${repoData.language || 'JavaScript'} 📊
┃ 📅 *Created:* ${new Date(repoData.created_at).toLocaleDateString()} 📅
┃ 🔄 *Updated:* ${new Date(repoData.updated_at).toLocaleDateString()} 🔄
┃ 📏 *Size:* ${(repoData.size / 1024).toFixed(2)} MB 📏
┃
┃ 🔗 *Links:*
┃ ├ 📘 [GitHub](${repoData.html_url})
┃ ├ 📢 [Channel](${CHANNEL_URL})
┃ └ 🌐 [Website](${repoData.homepage || 'N/A'})
┃
┃ ⚡ *Fetched in ${responseTime}ms*
┃ 🖥️ ${platform}-${arch}
┃
╰━━━❰ ⚡ *${config.BOT_NAME || 'JESUS-CRASH'}* ⚡ ❱━━━╮
        `.trim();

        // Send image with caption (parallel preparation)
        const imagePromise = conn.sendMessage(from, {
            image: { url: `https://files.catbox.moe/5srfgj.png` },
            caption: formattedInfo,
            contextInfo: {
                mentionedJid: [sender],
                externalAdReply: {
                    title: `⭐ ${formatNum(repoData.stargazers_count)} Stars | 🍴 ${formatNum(repoData.forks_count)} Forks`,
                    body: repoData.description?.slice(0, 50) || 'WhatsApp Bot',
                    thumbnailUrl: repoData.owner?.avatar_url || 'https://github.com/github.png',
                    sourceUrl: REPO_URL,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    showAdAttribution: true
                },
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363419768812867@newsletter',
                    newsletterName: 'JESUS-CRASH',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        // Send audio in parallel if available
        const audioPromise = (async () => {
            const audio = loadAudio();
            if (audio) {
                await sleep(500); // Small delay for natural flow
                return conn.sendMessage(from, {
                    audio: audio,
                    mimetype: 'audio/mp4',
                    ptt: true,
                    contextInfo: {
                        externalAdReply: {
                            title: '🎵 Repository Info',
                            body: 'Listen to voice note',
                            thumbnailUrl: 'https://files.catbox.moe/5srfgj.png',
                            sourceUrl: CHANNEL_URL
                        }
                    }
                }, { quoted: mek });
            }
        })();

        // Execute both
        await Promise.all([imagePromise, audioPromise]);

    } catch (error) {
        console.error("[REPO] Error:", error.message);
        
        // Fallback message on error
        const fallbackMsg = `
╭━━━❰ ⚠️ *𝐑𝐄𝐏𝐎𝐒𝐈𝐓𝐎𝐑𝐘* ❱━━━╮
┃
┃ 📦 *MINI-JESUS-CRASH*
┃
┃ 🔗 *GitHub:*
┃ ${REPO_URL}
┃
┃ 📢 *Channel:*
┃ ${CHANNEL_URL}
┃
┃ ⚡ *Powered by DAWENS-TECHX*
┃
╰━━━━━━━━━━━━━━━━━━━╯
        `.trim();

        await conn.sendMessage(from, {
            image: { url: `https://files.catbox.moe/5srfgj.png` },
            caption: fallbackMsg
        }, { quoted: mek });
    }
});

// Bonus: Stats command
cmd({
    pattern: "repostat",
    alias: ["gitstat", "githubstat"],
    desc: "📊 Quick repository statistics",
    react: "📊",
    category: "menu",
    filename: __filename,
}, 
async (conn, mek, m, { from, reply }) => {
    try {
        const [, username, repoName] = REPO_URL.match(/github\.com\/([^/]+)\/([^/]+)/);
        
        const [repoRes, commitsRes] = await Promise.all([
            axios.get(`https://api.github.com/repos/${username}/${repoName}`, { timeout: 5000 }),
            axios.get(`https://api.github.com/repos/${username}/${repoName}/commits?per_page=1`, { timeout: 5000 })
        ]);

        const data = repoRes.data;
        const totalCommits = commitsRes.headers['link'] ? 
            commitsRes.headers['link'].match(/page=(\d+)>; rel="last"/)?.[1] || 'N/A' : 
            'N/A';

        const statMsg = `
╭━━━❰ 📊 *𝐑𝐄𝐏𝐎 𝐒𝐓𝐀𝐓𝐒* ❱━━━╮
┃
┃ ⭐ Stars: ${data.stargazers_count.toLocaleString()}
┃ 🍴 Forks: ${data.forks_count.toLocaleString()}
┃ 👁️ Watchers: ${data.watchers_count.toLocaleString()}
┃ 📝 Open Issues: ${data.open_issues_count.toLocaleString()}
┃ 💾 Size: ${(data.size / 1024).toFixed(2)} MB
┃ 🔄 Total Commits: ${totalCommits}
┃ 🏷️ Default Branch: ${data.default_branch}
┃
╰━━━❰ 🔥 ${data.name} 🔥 ❱━━━╮
        `.trim();

        reply(statMsg);

    } catch (err) {
        reply("❌ Failed to fetch stats. Try `.repo` instead.");
    }
});
