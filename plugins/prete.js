const { cmd } = require('../command');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const Crypto = require('crypto');

// ==================== 4K STICKER ENGINE ====================

const STICKER_CONFIG = {
  MAX_SIZE: 512, // WhatsApp max sticker size
  MAX_FILE_SIZE: 1024 * 1024, // 1MB max output
  QUALITY_TIERS: {
    ULTRA: { quality: 100, effort: 6, smartSubsample: false },
    HIGH: { quality: 95, effort: 4, smartSubsample: true },
    MEDIUM: { quality: 85, effort: 2, smartSubsample: true }
  }
};

/**
 * Pre-process image for maximum quality
 */
async function preprocess4K(mediaBuffer, isAnimated = false) {
  try {
    const image = sharp(mediaBuffer, {
      animated: isAnimated,
      pages: isAnimated ? -1 : 1
    });

    const metadata = await image.metadata();
    
    // Calculate dimensions maintaining aspect ratio
    const maxDim = STICKER_CONFIG.MAX_SIZE;
    let width = metadata.width;
    let height = metadata.height;
    
    if (width > maxDim || height > maxDim) {
      const ratio = Math.min(maxDim / width, maxDim / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    // Ensure minimum quality threshold
    width = Math.max(width, 64);
    height = Math.max(height, 64);

    const processed = await image
      .resize(width, height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        kernel: sharp.kernel.lanczos3, // High-quality downscaling
        withoutEnlargement: false
      })
      .webp({
        quality: 100,
        lossless: true, // Maximum quality
        effort: 6,
        smartSubsample: false,
        nearLossless: false
      })
      .toBuffer();

    return processed;
  } catch (err) {
    console.error('Pre-process error:', err);
    return mediaBuffer; // Fallback to original
  }
}

/**
 * Optimize animated stickers (GIF/Video to WebP)
 */
async function optimizeAnimated(mediaBuffer) {
  const tempId = Crypto.randomBytes(8).toString('hex');
  const inputPath = path.join(tmpdir(), `${tempId}-input.webp`);
  const outputPath = path.join(tmpdir(), `${tempId}-output.webp`);

  try {
    fs.writeFileSync(inputPath, mediaBuffer);

    await sharp(inputPath, { animated: true })
      .webp({
        quality: 100,
        lossless: true,
        effort: 4,
        pageHeight: 512,
        loop: 0
      })
      .toFile(outputPath);

    const optimized = fs.readFileSync(outputPath);
    return optimized;
  } catch (err) {
    return mediaBuffer;
  } finally {
    try { fs.unlinkSync(inputPath); } catch (e) {}
    try { fs.unlinkSync(outputPath); } catch (e) {}
  }
}

// ==================== MAIN COMMAND ====================

cmd({
  pattern: '4k',
  alias: ["🤚🏻", "😭", "👀", "😒", "sticker4k", "s4k", "hq"],
  desc: 'Convert image/sticker to ultra-HD 4K quality sticker',
  category: 'converter',
  react: '✨',
  filename: __filename
}, async (bot, mek, m, { reply, from, sender }) => {
  try {
    const quoted = mek.quoted || mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    // Validate quoted message
    if (!quoted) {
      return reply('❌ *Reply to an image or sticker!*\n\nExample: Reply to image with `4k`');
    }

    // Detect media type
    const mtype = quoted.mtype || quoted.type || Object.keys(quoted)[0];
    const validTypes = ['imageMessage', 'stickerMessage', 'videoMessage', 'gifMessage'];
    
    if (!validTypes.includes(mtype)) {
      return reply('❌ *Invalid media!*\nSupported: Images, Stickers, GIFs, Videos');
    }

    // Download with progress indication
    await bot.sendMessage(from, { react: { text: '⏳', key: mek.key } });
    
    const media = await bot.downloadMediaMessage(quoted);
    if (!media || media.length === 0) {
      return reply('❌ *Download failed!* Media might be corrupted.');
    }

    // Check file size
    if (media.length > 10 * 1024 * 1024) {
      return reply('❌ *File too large!* Maximum size: 10MB');
    }

    // Determine if animated
    const isAnimated = ['stickerMessage', 'videoMessage', 'gifMessage'].includes(mtype) && 
      (quoted.isAnimated || mtype === 'videoMessage' || mtype === 'gifMessage');

    // Process media
    await bot.sendMessage(from, { react: { text: '🎨', key: mek.key } });

    let processedBuffer = media;
    
    // Pre-process for maximum quality
    if (!isAnimated && mtype === 'imageMessage') {
      processedBuffer = await preprocess4K(media, false);
    } else if (isAnimated) {
      processedBuffer = await optimizeAnimated(media);
    }

    // Create 4K sticker
    const packname = '𓄂⍣⃝𝐃𝐈𝐄༒𝄟✮͢≛𝐃𝐀𝐖𝐄𝐍𝐒🥀';
    const author = '𝐃𝐈𝐄༒☠️𝟒𝐊☠️';

    const stickerOptions = {
      pack: packname,
      author: author,
      type: StickerTypes.FULL,
      quality: 100,
      categories: ['✨', '🎭'],
      background: '#00000000' // Force transparent
    };

    // Add animation flag if needed
    if (isAnimated) {
      stickerOptions.animated = true;
      stickerOptions.fps = 60; // Max smoothness
      stickerOptions.startTime = '00:00:00.000';
      stickerOptions.endTime = '00:00:10.000'; // Max 10 seconds
    }

    const sticker = new Sticker(processedBuffer, stickerOptions);
    const stickerBuffer = await sticker.toBuffer();

    // Verify output quality
    if (stickerBuffer.length > STICKER_CONFIG.MAX_FILE_SIZE) {
      // Re-encode with slightly lower quality if too big
      const compressedSticker = new Sticker(processedBuffer, {
        ...stickerOptions,
        quality: 90
      });
      const compressedBuffer = await compressedSticker.toBuffer();
      
      await bot.sendMessage(from, { 
        sticker: compressedBuffer 
      }, { quoted: mek });
    } else {
      await bot.sendMessage(from, { 
        sticker: stickerBuffer 
      }, { quoted: mek });
    }

    // Success reaction
    await bot.sendMessage(from, { react: { text: '✅', key: mek.key } });

    // Stats logging
    console.log(`[4K STICKER] User: ${sender}, Size: ${(stickerBuffer.length / 1024).toFixed(2)}KB, Animated: ${isAnimated}`);

  } catch (err) {
    console.error('[4K STICKER ERROR]', err);
    await bot.sendMessage(from, { react: { text: '❌', key: mek.key } });
    
    let errorMsg = '❌ *Conversion failed!*\n';
    if (err.message.includes('sharp')) {
      errorMsg += 'Image processing error. Try a different image.';
    } else if (err.message.includes 'timeout') {
      errorMsg += 'Processing timeout. File may be too complex.';
    } else {
      errorMsg += 'Please try again with a different media.';
    }
    
    reply(errorMsg);
  }
});

// ==================== BONUS: AUTO 4K STICKER (Reply with emoji) ====================

cmd({
  on: 'text',
  pattern: null // Trigger on any text
}, async (bot, mek, m, { reply, from, body }) => {
  try {
    // Only trigger for specific emojis when replying to media
    const triggerEmojis = ['🤚🏻', '😭', '👀', '😒', '✨', '🎭', '💎'];
    if (!triggerEmojis.includes(body.trim())) return;
    
    const quoted = mek.quoted;
    if (!quoted) return;
    
    const mtype = quoted.mtype || quoted.type;
    if (!['imageMessage', 'stickerMessage'].includes(mtype)) return;

    // Reuse the 4k command logic
    const fakeMek = { ...mek, text: '4k' };
    require('./4ksticker')(bot, fakeMek, m, { reply, from, sender: m.sender });

  } catch (err) {
    // Silent fail for auto-trigger
  }
});
