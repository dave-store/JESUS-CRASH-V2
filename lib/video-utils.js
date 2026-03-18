const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const Crypto = require('crypto');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegPath);

async function videoToWebp(videoBuffer, options = {}) {
  // Validasyon
  if (!Buffer.isBuffer(videoBuffer)) {
    throw new TypeError('Input must be a Buffer');
  }
  if (videoBuffer.length === 0) {
    throw new Error('Buffer is empty');
  }
  
  // Limit 10MB default
  const maxSize = options.maxSize || 10 * 1024 * 1024;
  if (videoBuffer.length > maxSize) {
    throw new Error(`Video too large: ${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB (max: ${maxSize / 1024 / 1024}MB)`);
  }

  const uniqueId = `${Date.now()}-${Crypto.randomBytes(3).toString('hex')}`;
  const outputPath = path.join(tmpdir(), `${uniqueId}.webp`);
  const inputPath = path.join(tmpdir(), `${uniqueId}.mp4`);

  try {
    fs.writeFileSync(inputPath, videoBuffer);

    await new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .on('error', (err) => reject(new Error(`Conversion failed: ${err.message}`)))
        .on('end', () => resolve(true))
        .addOutputOptions([
          '-vcodec', 'libwebp',
          '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0,split [a][b];[a] palettegen=reserve_transparent=on:transparency_color=ffffff [p];[b][p] paletteuse",
          '-loop', '0',
          '-t', options.duration || '00:00:05', // Customizable duration
          '-preset', 'default',
          '-an',
          '-vsync', '0'
        ])
        .toFormat('webp')
        .save(outputPath);
      
      // Timeout 30 secondes
      setTimeout(() => {
        command.kill('SIGKILL');
        reject(new Error('Conversion timeout (30s)'));
      }, 30000);
    });

    const webpBuffer = fs.readFileSync(outputPath);
    
    // Verify output
    if (webpBuffer.length === 0) {
      throw new Error('Output file is empty');
    }
    
    return webpBuffer;
    
  } finally {
    // Cleanup always
    try { fs.existsSync(outputPath) && fs.unlinkSync(outputPath); } catch (e) { /* ignore */ }
    try { fs.existsSync(inputPath) && fs.unlinkSync(inputPath); } catch (e) { /* ignore */ }
  }
}

module.exports = { videoToWebp };
