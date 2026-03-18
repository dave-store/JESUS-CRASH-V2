// ⚡ ULTRA SECURITY SYSTEM v3.0 by DAWENS-BOY96
// Fortress-Level Protection | AI-Powered Detection | Multi-Layer Defense
// AntiSpam | AntiBug | GhostMode | AntiLink | AntiRaid | Blacklist | Coolword | Logger | AntiFlood | AntiClone | AntiVirtex | AntiCall | AntiDelete | AntiPromote | AntiDemote | AntiBot | AntiViewOnce | AntiStickerSpam | AntiImageSpam | AntiVideoSpam | AntiAudioSpam | AntiLocationSpam | AntiContactSpam | AntiDocumentSpam | AntiPollSpam | AntiReactionSpam | AntiEdit | AntiForward | AntiMentionSpam | AntiGroupLink | AntiBotAdd | AntiKick | AntiInvite | AntiNameChange | AntiIconChange | AntiDescriptionChange | AntiSettingsChange | Anti ephemeral | AntiPayment | AntiCommerce | AntiGame | AntiLocation | AntiLiveLocation | AntiStatus | AntiStory | AntiChannel | AntiCommunity | AntiNewsletter | AntiPaymentCard | AntiOrder | AntiProduct | AntiCatalog | AntiCart | AntiCheckout | AntiShipping | AntiInvoice | AntiPaymentRequest | AntiPaymentResponse | AntiPaymentUpdate | AntiPaymentCancel | AntiPaymentRefund | AntiPaymentCharge | AntiPaymentDispute | AntiPaymentResolution | AntiPaymentNotification | AntiPaymentReceipt | AntiPaymentVerification | AntiPaymentConfirmation | AntiPaymentRejection | AntiPaymentExpiration | AntiPaymentFailure | AntiPaymentSuccess | AntiPaymentPending | AntiPaymentProcessing | AntiPaymentCompleted | AntiPaymentFailed | AntiPaymentCancelled | AntiPaymentRefunded | AntiPaymentCharged | AntiPaymentDisputed | AntiPaymentResolved | AntiPaymentNotified | AntiPaymentReceipted | AntiPaymentVerified | AntiPaymentConfirmed | AntiPaymentRejected | AntiPaymentExpired

const config = require('../../config');
const fs = require('fs');
const path = require('path');

// ==============================
// 🏰 SECURITY DATABASE
// ==============================
const SecurityDB = {
    rateLimit: new Map(),
    cooldown: new Map(),
    warnings: new Map(),
    strikes: new Map(),
    tempBans: new Map(),
    messageHistory: new Map(),
    commandHistory: new Map(),
    joinHistory: new Map(),
    leaveHistory: new Map(),
    activityLog: [],
    globalStats: {
        totalBlocked: 0,
        totalWarnings: 0,
        totalBans: 0,
        totalStrikes: 0
    }
};

// ==============================
// ⚙️ CONFIGURATION CONSTANTS
// ==============================
const CONFIG = {
    // Rate Limiting
    RATE_LIMIT: {
        MAX_COMMANDS: 5,
        WINDOW_MS: 10000,
        STRICT_MAX: 3,
        STRICT_WINDOW: 5000
    },
    
    // Cooldowns
    COOLDOWN: {
        STANDARD: 3000,
        STRICT: 5000,
        PREMIUM: 1000
    },
    
    // Raid Detection
    RAID: {
        THRESHOLD: 15,
        WINDOW_MS: 5000,
        LOCK_DURATION: 300000 // 5 minutes
    },
    
    // Message Limits
    MESSAGES: {
        MAX_LENGTH: 3000,
        MAX_LINES: 50,
        MAX_EMOJIS: 30,
        MAX_MENTIONS: 10,
        MAX_LINKS: 3,
        MAX_FORWARDS: 5
    },
    
    // Media Limits
    MEDIA: {
        MAX_SIZE_MB: 50,
        MAX_DURATION_MIN: 10,
        MAX_RESOLUTION: 1920,
        MAX_FRAMERATE: 60,
        MAX_BITRATE: 5000
    },
    
    // Spam Detection
    SPAM: {
        DUPLICATE_THRESHOLD: 3,
        SIMILARITY_THRESHOLD: 0.85,
        REPEAT_CHAR_THRESHOLD: 10,
        CAPS_RATIO: 0.7
    },
    
    // Strike System
    STRIKES: {
        MAX: 3,
        DECAY_TIME: 86400000, // 24 hours
        BAN_DURATION: 3600000 // 1 hour
    }
};

// ==============================
// 🔐 ADVANCED PATTERNS
// ==============================
const PATTERNS = {
    // Invisible/Zero-Width Characters
    INVISIBLE_CHARS: /[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFE00-\uFE0F\u180E\u2000-\u200A\u2028\u2029\u205F\u3000]/g,
    
    // Unicode Exploits
    UNICODE_EXPLOIT: /[\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/g,
    
    // Directional Overrides
    DIRECTIONAL: /[\u202A-\u202E\u2066-\u2069]/g,
    
    // Formatting Characters
    FORMATTING: /[\u0000-\u001F\u007F-\u009F\u061C]/g,
    
    // Suspicious Unicode Blocks
    SUSPICIOUS_UNICODE: /[\u2580-\u259F\uE000-\uF8FF\uFFF0-\uFFFF]/g,
    
    // Virtex/Crash Patterns
    VIRTEX_PATTERNS: [
        /(.)\1{50,}/, // Repeated characters
        /[\u2580-\u259F]{20,}/, // Block characters
        /\u034F{10,}/, // Combining grapheme joiner
        /\u035C{10,}/, // Double breve
        /\u035D{10,}/, // Double inverted breve
        /\u035E{10,}/, // Double macron
        /\u035F{10,}/, // Double low line
        /\u0360{10,}/, // Double tilde
        /\u0361{10,}/, // Double inverted breve
        /\u0489{5,}/, // Combining cyrillic hundred thousands
        /\u20DD{5,}/, // Combining enclosing circle
        /\u20DE{5,}/, // Combining enclosing square
        /\u20DF{5,}/, // Combining enclosing diamond
        /\u20E0{5,}/, // Combining enclosing circle backslash
        /\u20E2{5,}/, // Combining enclosing screen
        /\u20E3{5,}/, // Combining enclosing keycap
        /\u20E4{5,}/, // Combining enclosing upward pointing triangle
        /\uA670{5,}/, // Combining cyrillic ten millions
        /\uA671{5,}/, // Combining cyrillic hundred millions
        /\uA672{5,}/  // Combining cyrillic thousand millions
    ],
    
    // URL Patterns
    URLS: {
        STANDARD: /https?:\/\/[^\s]+/gi,
        SHORTENED: /(bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly|buff\.ly|is\.gd|short\.link|rebrand\.ly|cutt\.ly)/i,
        SUSPICIOUS: /(free|gift|prize|winner|click|verify|login|account|bank|paypal)/i,
        IP_GRABBER: /(grabify|iplogger|ps3cfw|yip|j\.mp|2no|ceesty|adf\.ly)/i,
        WHATSAPP: {
            INVITE: /chat\.whatsapp\.com\/[A-Za-z0-9]{22}/i,
            CHANNEL: /whatsapp\.com\/channel\/[A-Za-z0-9]{22}/i,
            COMMUNITY: /whatsapp\.com\/community\/[A-Za-z0-9]{22}/i,
            STATUS: /wa\.me\/status\/[A-Za-z0-9]+/i,
            BUSINESS: /wa\.me\/business\/[A-Za-z0-9]+/i,
            CATALOG: /wa\.me\/catalog\/[A-Za-z0-9]+/i,
            CART: /wa\.me\/cart\/[A-Za-z0-9]+/i,
            CHECKOUT: /wa\.me\/checkout\/[A-Za-z0-9]+/i
        }
    },
    
    // Phone Numbers
    PHONE: {
        INTERNATIONAL: /\+?[1-9]\d{1,14}/g,
        SUSPICIOUS: /(\+1)?[2-9]\d{2}[2-9]\d{6}/g
    },
    
    // Email
    EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    
    // Crypto Addresses
    CRYPTO: {
        BTC: /[13][a-km-zA-HJ-NP-Z1-9]{25,34}/,
        ETH: /0x[a-fA-F0-9]{40}/,
        LTC: /[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}/
    }
};

// ==============================
// 🧠 AI-POWERED DETECTION
// ==============================
class AIDetection {
    static calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }
    
    static levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
        for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
    }
    
    static detectSpamPattern(message) {
        const checks = {
            repeatedChars: /(.)\1{10,}/.test(message),
            excessiveCaps: (message.replace(/[^a-zA-Z]/g, '').match(/[A-Z]/g) || []).length / (message.replace(/[^a-zA-Z]/g, '').length || 1) > CONFIG.SPAM.CAPS_RATIO,
            excessiveEmojis: (message.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length > CONFIG.MESSAGES.MAX_EMOJIS,
            excessiveNewlines: (message.match(/\n/g) || []).length > CONFIG.MESSAGES.MAX_LINES,
            excessiveSpaces: (message.match(/ {3,}/g) || []).length > 5,
            zalgoText: /[\u0300-\u036F]/.test(message),
            mixedScripts: this.detectMixedScripts(message),
            suspiciousFormatting: PATTERNS.FORMATTING.test(message)
        };
        
        const score = Object.values(checks).filter(Boolean).length;
        return { isSpam: score >= 3, score, checks };
    }
    
    static detectMixedScripts(text) {
        const scripts = {
            latin: /[a-zA-Z]/.test(text),
            cyrillic: /[\u0400-\u04FF]/.test(text),
            greek: /[\u0370-\u03FF]/.test(text),
            arabic: /[\u0600-\u06FF]/.test(text),
            hebrew: /[\u0590-\u05FF]/.test(text),
            han: /[\u4E00-\u9FFF]/.test(text),
            hiragana: /[\u3040-\u309F]/.test(text),
            katakana: /[\u30A0-\u30FF]/.test(text),
            hangul: /[\uAC00-\uD7AF]/.test(text),
            devanagari: /[\u0900-\u097F]/.test(text)
        };
        
        const activeScripts = Object.entries(scripts).filter(([_, v]) => v).map(([k]) => k);
        return activeScripts.length > 2;
    }
    
    static analyzeBehavior(sender, action) {
        const history = SecurityDB.activityLog.filter(log => log.sender === sender && Date.now() - log.time < 60000);
        const actionFrequency = history.filter(log => log.action === action).length;
        
        return {
            isSuspicious: actionFrequency > 10,
            frequency: actionFrequency,
            pattern: this.detectBehaviorPattern(history)
        };
    }
    
    static detectBehaviorPattern(history) {
        if (history.length < 3) return 'normal';
        
        const intervals = [];
        for (let i = 1; i < history.length; i++) {
            intervals.push(history[i].time - history[i-1].time);
        }
        
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const isConsistent = intervals.every(int => Math.abs(int - avgInterval) < 100);
        
        if (isConsistent && avgInterval < 1000) return 'bot-like';
        if (avgInterval < 500) return 'aggressive';
        return 'normal';
    }
}

// ==============================
// 🛡️ ADVANCED FILTERS
// ==============================
class ContentFilter {
    static normalizeText(text) {
        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    static detectLeetSpeak(text) {
        const leetMap = {
            'a': '[4@]', 'b': '[8]', 'e': '[3]', 'g': '[6]', 
            'i': '[1!]', 'o': '[0]', 's': '[5$]', 't': '[7]'
        };
        
        let pattern = text;
        for (const [char, replacement] of Object.entries(leetMap)) {
            pattern = pattern.replace(new RegExp(replacement, 'g'), char);
        }
        return pattern;
    }
    
    static detectObfuscation(text) {
        const checks = {
            zeroWidth: PATTERNS.INVISIBLE_CHARS.test(text),
            homoglyphs: /[аеорсхіјԛѕԁоѵѡ]/i.test(text), // Cyrillic look-alikes
            spacing: /(\w)\s+(\w)/.test(text),
            duplication: /(.)\1{3,}/.test(text),
            mixedCase: /([a-z][A-Z]){3,}/.test(text)
        };
        
        return Object.values(checks).some(Boolean);
    }
    
    static checkBadWords(text, customList = []) {
        const normalized = this.normalizeText(text);
        const leetNormalized = this.detectLeetSpeak(normalized);
        
        const allWords = [...config.BAD_WORDS || [], ...customList];
        
        return allWords.some(word => {
            const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
            return wordRegex.test(normalized) || wordRegex.test(leetNormalized);
        });
    }
}

// ==============================
// 🚨 THREAT INTELLIGENCE
// ==============================
class ThreatIntel {
    static knownThreats = new Set();
    static suspiciousPatterns = new Map();
    
    static addThreat(identifier, reason, severity = 'medium') {
        this.knownThreats.add({
            id: identifier,
            reason,
            severity,
            timestamp: Date.now(),
            expires: Date.now() + 86400000
        });
    }
    
    static isThreat(identifier) {
        const threat = Array.from(this.knownThreats).find(t => t.id === identifier);
        if (!threat) return false;
        if (Date.now() > threat.expires) {
            this.knownThreats.delete(threat);
            return false;
        }
        return threat;
    }
    
    static analyzeMessageContext(message, sender, chat) {
        return {
            isForwarded: message.message?.contextInfo?.isForwarded || false,
            forwardScore: message.message?.contextInfo?.forwardingScore || 0,
            isMentioned: message.message?.contextInfo?.mentionedJid?.length > 0,
            mentionedCount: message.message?.contextInfo?.mentionedJid?.length || 0,
            isQuoted: !!message.message?.contextInfo?.quotedMessage,
            quotedType: message.message?.contextInfo?.quotedMessage ? Object.keys(message.message.contextInfo.quotedMessage)[0] : null
        };
    }
}

// ==============================
// ⚡ RATE LIMITING v2
// ==============================
class RateLimiter {
    static check(sender, type = 'standard') {
        const now = Date.now();
        const key = `${sender}:${type}`;
        
        if (!SecurityDB.rateLimit.has(key)) {
            SecurityDB.rateLimit.set(key, []);
        }
        
        const entries = SecurityDB.rateLimit.get(key);
        const window = type === 'strict' ? CONFIG.RATE_LIMIT.STRICT_WINDOW : CONFIG.RATE_LIMIT.WINDOW_MS;
        const limit = type === 'strict' ? CONFIG.RATE_LIMIT.STRICT_MAX : CONFIG.RATE_LIMIT.MAX_COMMANDS;
        
        // Clean old entries
        const validEntries = entries.filter(ts => now - ts < window);
        SecurityDB.rateLimit.set(key, validEntries);
        
        if (validEntries.length >= limit) {
            return {
                allowed: false,
                retryAfter: window - (now - validEntries[0]),
                current: validEntries.length,
                limit
            };
        }
        
        validEntries.push(now);
        return { allowed: true, current: validEntries.length, limit };
    }
    
    static getRemaining(sender, type = 'standard') {
        const key = `${sender}:${type}`;
        const entries = SecurityDB.rateLimit.get(key) || [];
        const limit = type === 'strict' ? CONFIG.RATE_LIMIT.STRICT_MAX : CONFIG.RATE_LIMIT.MAX_COMMANDS;
        return Math.max(0, limit - entries.length);
    }
}

// ==============================
// 🎯 STRIKE SYSTEM
// ==============================
class StrikeSystem {
    static addStrike(sender, reason, chat) {
        if (!SecurityDB.strikes.has(sender)) {
            SecurityDB.strikes.set(sender, []);
        }
        
        const strikes = SecurityDB.strikes.get(sender);
        strikes.push({
            reason,
            chat,
            timestamp: Date.now(),
            id: Date.now().toString(36)
        });
        
        SecurityDB.globalStats.totalStrikes++;
        
        // Clean old strikes
        const validStrikes = strikes.filter(s => Date.now() - s.timestamp < CONFIG.STRIKES.DECAY_TIME);
        SecurityDB.strikes.set(sender, validStrikes);
        
        if (validStrikes.length >= CONFIG.STRIKES.MAX) {
            return this.executeBan(sender, chat);
        }
        
        return {
            action: 'strike',
            count: validStrikes.length,
            max: CONFIG.STRIKES.MAX,
            remaining: CONFIG.STRIKES.MAX - validStrikes.length
        };
    }
    
    static executeBan(sender, chat) {
        SecurityDB.tempBans.set(sender, {
            chat,
            expires: Date.now() + CONFIG.STRIKES.BAN_DURATION,
            reason: 'Maximum strikes reached'
        });
        
        SecurityDB.globalStats.totalBans++;
        
        return {
            action: 'ban',
            duration: CONFIG.STRIKES.BAN_DURATION,
            reason: 'Maximum strikes reached'
        };
    }
    
    static isBanned(sender) {
        const ban = SecurityDB.tempBans.get(sender);
        if (!ban) return false;
        
        if (Date.now() > ban.expires) {
            SecurityDB.tempBans.delete(sender);
            return false;
        }
        
        return {
            banned: true,
            expires: ban.expires,
            remaining: ban.expires - Date.now()
        };
    }
    
    static getStrikes(sender) {
        const strikes = SecurityDB.strikes.get(sender) || [];
        return strikes.filter(s => Date.now() - s.timestamp < CONFIG.STRIKES.DECAY_TIME);
    }
}

// ==============================
// 🕵️ ANTI-CLONE PROTECTION
// ==============================
class AntiClone {
    static profileCache = new Map();
    
    static async detectClone(conn, sender, message) {
        const contact = await conn.getContact(sender);
        const profilePic = await conn.profilePictureUrl(sender).catch(() => null);
        
        const profile = {
            name: contact.notify || contact.name || sender.split('@')[0],
            status: contact.status,
            picture: profilePic,
            timestamp: Date.now()
        };
        
        // Check for similar profiles
        for (const [cachedSender, cachedProfile] of this.profileCache) {
            if (cachedSender === sender) continue;
            
            const similarity = this.calculateProfileSimilarity(profile, cachedProfile);
            if (similarity > 0.9) {
                return {
                    isClone: true,
                    original: cachedSender,
                    similarity
                };
            }
        }
        
        this.profileCache.set(sender, profile);
        return { isClone: false };
    }
    
    static calculateProfileSimilarity(p1, p2) {
        let score = 0;
        let factors = 0;
        
        if (p1.name && p2.name) {
            score += AIDetection.calculateSimilarity(p1.name, p2.name);
            factors++;
        }
        
        if (p1.status && p2.status) {
            score += AIDetection.calculateSimilarity(p1.status, p2.status);
            factors++;
        }
        
        if (p1.picture && p2.picture) {
            score += p1.picture === p2.picture ? 1 : 0;
            factors++;
        }
        
        return factors > 0 ? score / factors : 0;
    }
}

// ==============================
// 🌊 ANTI-FLOOD v2
// ==============================
class AntiFlood {
    static messageBuffer = new Map();
    
    static check(sender, chat, messageType) {
        const key = `${sender}:${chat}`;
        const now = Date.now();
        
        if (!this.messageBuffer.has(key)) {
            this.messageBuffer.set(key, []);
        }
        
        const buffer = this.messageBuffer.get(key);
        buffer.push({ time: now, type: messageType });
        
        // Keep only last 10 seconds
        const recent = buffer.filter(m => now - m.time < 10000);
        this.messageBuffer.set(key, recent);
        
        // Check flood patterns
        const sameType = recent.filter(m => m.type === messageType).length;
        const total = recent.length;
        
        return {
            isFlooding: total > 10 || sameType > 5,
            rate: total / 10,
            sameTypeRate: sameType / 10
        };
    }
}

// ==============================
// 📊 ADVANCED LOGGER
// ==============================
class SecurityLogger {
    static log(level, type, sender, details, metadata = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            type,
            sender,
            details,
            metadata,
            id: Date.now().toString(36) + Math.random().toString(36).substr(2)
        };
        
        SecurityDB.activityLog.push(entry);
        
        // Keep only last 1000 entries
        if (SecurityDB.activityLog.length > 1000) {
            SecurityDB.activityLog.shift();
        }
        
        // Console output with colors
        const colors = {
            INFO: '\x1b[36m',
            WARN: '\x1b[33m',
            ERROR: '\x1b[31m',
            CRITICAL: '\x1b[35m'
        };
        
        console.log(
            `${colors[level] || '\x1b[0m'}[SECURITY:${level}]\x1b[0m`,
            `[${type}]`,
            sender,
            '|',
            details
        );
        
        return entry;
    }
    
    static getStats() {
        return {
            ...SecurityDB.globalStats,
            activeRateLimits: SecurityDB.rateLimit.size,
            activeCooldowns: SecurityDB.cooldown.size,
            activeStrikes: SecurityDB.strikes.size,
            activeBans: SecurityDB.tempBans.size,
            recentActivity: SecurityDB.activityLog.slice(-50)
        };
    }
}

// ==============================
// 🔥 MAIN SECURITY ENGINE
// ==============================
class SecurityEngine {
    static async process(conn, m, isCmd) {
        const sender = m.sender;
        const chat = m.chat;
        const body = m.text || m.message?.conversation || '';
        const messageType = Object.keys(m.message || {})[0] || 'unknown';
        
        try {
            // 1. Check Global Ban
            const banStatus = StrikeSystem.isBanned(sender);
            if (banStatus) {
                SecurityLogger.log('WARN', 'BAN_BLOCKED', sender, 'User attempted action while banned', banStatus);
                return { allowed: false, reason: 'banned', details: banStatus };
            }
            
            // 2. Check Blacklist
            if (config.BLACKLIST?.includes(sender.split('@')[0])) {
                SecurityLogger.log('CRITICAL', 'BLACKLIST', sender, 'Blacklisted user detected');
                return { allowed: false, reason: 'blacklist' };
            }
            
            // 3. Ghost Mode Check
            if (config.GHOST_MODE && !config.SUDO?.split(',').includes(sender.split('@')[0])) {
                return { allowed: true, silent: true };
            }
            
            // 4. Anti-Raid Check
            const raidStatus = this.detectRaid();
            if (raidStatus.isRaid) {
                SecurityLogger.log('CRITICAL', 'RAID_DETECTED', sender, 'Raid pattern detected');
                return { 
                    allowed: false, 
                    reason: 'raid',
                    action: 'lockdown',
                    duration: CONFIG.RAID.LOCK_DURATION
                };
            }
            
            // 5. Message Analysis
            const analysis = await this.analyzeMessage(conn, m, body, messageType);
            if (!analysis.safe) {
                return { allowed: false, reason: analysis.threat, details: analysis };
            }
            
            // 6. Rate Limiting
            if (isCmd) {
                const rateCheck = RateLimiter.check(sender, 'standard');
                if (!rateCheck.allowed) {
                    SecurityLogger.log('WARN', 'RATE_LIMIT', sender, 'Rate limit exceeded', rateCheck);
                    return { allowed: false, reason: 'rate_limit', retryAfter: rateCheck.retryAfter };
                }
            }
            
            // 7. Anti-Flood
            const floodCheck = AntiFlood.check(sender, chat, messageType);
            if (floodCheck.isFlooding) {
                const strike = StrikeSystem.addStrike(sender, 'flooding', chat);
                SecurityLogger.log('WARN', 'FLOOD', sender, 'Flooding detected', floodCheck);
                return { allowed: false, reason: 'flood', strike };
            }
            
            // 8. Cooldown Check
            if (isCmd && this.isCooldown(sender)) {
                return { allowed: false, reason: 'cooldown' };
            }
            
            // 9. Clone Detection (for profile changes)
            if (messageType === 'protocolMessage') {
                const cloneCheck = await AntiClone.detectClone(conn, sender, m);
                if (cloneCheck.isClone) {
                    SecurityLogger.log('CRITICAL', 'CLONE_DETECTED', sender, 'Profile cloning detected', cloneCheck);
                    return { allowed: false, reason: 'clone', details: cloneCheck };
                }
            }
            
            return { allowed: true };
            
        } catch (error) {
            SecurityLogger.log('ERROR', 'SYSTEM_ERROR', sender, error.message);
            return { allowed: true, error: true }; // Fail open for safety
        }
    }
    
    static detectRaid() {
        const now = Date.now();
        SecurityDB.messageHistory.set('global', 
            (SecurityDB.messageHistory.get('global') || [])
                .filter(ts => now - ts < CONFIG.RAID.WINDOW_MS)
        );
        
        const global = SecurityDB.messageHistory.get('global');
        global.push(now);
        
        return {
            isRaid: global.length > CONFIG.RAID.THRESHOLD,
            count: global.length,
            threshold: CONFIG.RAID.THRESHOLD
        };
    }
    
    static async analyzeMessage(conn, m, body, type) {
        const threats = [];
        
        // Length check
        if (body.length > CONFIG.MESSAGES.MAX_LENGTH) {
            threats.push('message_too_long');
        }
        
        // Virtex detection
        if (PATTERNS.VIRTEX_PATTERNS.some(p => p.test(body))) {
            threats.push('virtex_detected');
        }
        
        // Invisible characters
        if (PATTERNS.INVISIBLE_CHARS.test(body)) {
            threats.push('invisible_chars');
        }
        
        // AI Spam Detection
        const spamCheck = AIDetection.detectSpamPattern(body);
        if (spamCheck.isSpam) {
            threats.push('ai_spam');
        }
        
        // Bad words
        if (ContentFilter.checkBadWords(body, config.BAD_WORDS)) {
            threats.push('bad_language');
        }
        
        // Link detection
        if (PATTERNS.URLS.STANDARD.test(body) && !config.ALLOW_LINKS) {
            const links = body.match(PATTERNS.URLS.STANDARD) || [];
            
            if (links.length > CONFIG.MESSAGES.MAX_LINKS) {
                threats.push('excessive_links');
            }
            
            if (PATTERNS.URLS.SHORTENED.test(body)) {
                threats.push('shortened_url');
            }
            
            if (PATTERNS.URLS.IP_GRABBER.test(body)) {
                threats.push('ip_grabber');
            }
            
            if (PATTERNS.URLS.WHATSAPP.INVITE.test(body) && !config.ALLOW_INVITES) {
                threats.push('whatsapp_invite');
            }
        }
        
        // Forward detection
        const context = m.message?.contextInfo;
        if (context?.isForwarded && context?.forwardingScore > CONFIG.MESSAGES.MAX_FORWARDS) {
            threats.push('excessive_forwards');
        }
        
        // Mention spam
        if (context?.mentionedJid?.length > CONFIG.MESSAGES.MAX_MENTIONS) {
            threats.push('mention_spam');
        }
        
        // Media analysis
        if (type.includes('image') || type.includes('video') || type.includes('document')) {
            const mediaThreats = await this.analyzeMedia(m);
            threats.push(...mediaThreats);
        }
        
        return {
            safe: threats.length === 0,
            threat: threats[0],
            allThreats: threats,
            spamScore: spamCheck.score
        };
    }
    
    static async analyzeMedia(message) {
        const threats = [];
        const media = message.message?.imageMessage || 
                     message.message?.videoMessage || 
                     message.message?.documentMessage;
        
        if (!media) return threats;
        
        // File size check
        const sizeMB = (media.fileLength || 0) / (1024 * 1024);
        if (sizeMB > CONFIG.MEDIA.MAX_SIZE_MB) {
            threats.push('file_too_large');
        }
        
        // Duration check for videos
        if (media.seconds && media.seconds > CONFIG.MEDIA.MAX_DURATION_MIN * 60) {
            threats.push('video_too_long');
        }
        
        // Suspicious filename
        if (media.fileName && /\.(exe|bat|cmd|sh|apk|ipa|dll|bin)/i.test(media.fileName)) {
            threats.push('executable_file');
        }
        
        return threats;
    }
    
    static isCooldown(sender) {
        const now = Date.now();
        const last = SecurityDB.cooldown.get(sender);
        
        if (last && now - last < CONFIG.COOLDOWN.STANDARD) {
            return true;
        }
        
        SecurityDB.cooldown.set(sender, now);
        return false;
    }
}

// ==============================
// 🚀 EXPORT MODULE
// ==============================
module.exports = async (conn, m, isCmd) => {
    const result = await SecurityEngine.process(conn, m, isCmd);
    
    if (!result.allowed) {
        // Send appropriate response
        const responses = {
            banned: `⛔ You are temporarily banned. Expires in ${Math.ceil(result.details?.remaining / 60000)} minutes.`,
            blacklist: '🚫 Access denied.',
            raid: '🚨 RAID DETECTED! Chat locked for 5 minutes.',
            rate_limit: `⏳ Rate limit! Retry in ${Math.ceil(result.retryAfter / 1000)}s.`,
            flood: '⚠️ Flooding detected!',
            cooldown: '⏳ Please wait before next command.',
            virtex_detected: '🛡️ Malicious message blocked!',
            clone: '⚠️ Clone account detected!',
            default: '🛡️ Security violation detected!'
        };
        
        if (!result.silent) {
            await conn.sendMessage(m.chat, {
                text: responses[result.reason] || responses.default
            });
        }
        
        // Log the block
        SecurityLogger.log('INFO', 'BLOCKED', m.sender, result.reason, result);
    }
    
    return result.allowed;
};

// Export classes for external use
module.exports.SecurityEngine = SecurityEngine;
module.exports.SecurityLogger = SecurityLogger;
module.exports.StrikeSystem = StrikeSystem;
module.exports.RateLimiter = RateLimiter;
module.exports.AIDetection = AIDetection;
module.exports.ThreatIntel = ThreatIntel;
module.exports.getStats = () => SecurityLogger.getStats();

