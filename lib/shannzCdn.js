const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const pathModule = require("path");

async function shannzCdn(filePath, options = {}) {
  const fileStream = fs.createReadStream(filePath);
  
  try {
    // ✅ Verifye fichye egziste
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }

    // ✅ Verifye gwosè (default: 100MB)
    const stats = fs.statSync(filePath);
    const maxSize = options.maxSize || 100 * 1024 * 1024;
    if (stats.size > maxSize) {
      throw new Error(`File too large: ${(stats.size/1024/1024).toFixed(2)}MB`);
    }

    // ✅ Verifye tip fichye (optional)
    if (options.allowedTypes) {
      const ext = pathModule.extname(filePath).toLowerCase();
      if (!options.allowedTypes.includes(ext)) {
        throw new Error(`File type not allowed: ${ext}`);
      }
    }

    const form = new FormData();
    form.append("file", fileStream, {
      filename: pathModule.basename(filePath),
    });

    const response = await axios.post(
      "https://endpoint.web.id/server/upload",
      form,
      {
        headers: form.getHeaders(),
        timeout: options.timeout || 20000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        // Retry 1 fwa si echwe
        validateStatus: (status) => status < 500
      }
    );

    // ✅ Validé repons
    if (!response.data || response.data.status !== 'success') {
      throw new Error(response.data?.message || 'Upload failed');
    }

    return {
      status: true,
      url: response.data.url, // Ekstrè URL sèlman
      data: response.data
    };

  } catch (error) {
    console.error('CDN Upload Error:', error.message);
    return {
      status: false,
      message: error.message,
      ...(error.response?.data && { serverError: error.response.data })
    };
  } finally {
    // ✅ Netwaye stream toujou
    fileStream.destroy();
  }
}

module.exports = { shannzCdn };
