const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

function readPositiveNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const port = readPositiveNumber("PORT", 3001);

const config = Object.freeze({
  port,
  allowedOrigins: (process.env.ALLOWED_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  maxChatFileSizeBytes:
    readPositiveNumber("MAX_CHAT_FILE_SIZE_MB", 100) * 1024 * 1024,
  maxExportFileSizeBytes:
    readPositiveNumber("MAX_EXPORT_FILE_SIZE_MB", 500) * 1024 * 1024,
  maxExportAssets: readPositiveNumber("MAX_EXPORT_ASSETS", 32),
  maxConcurrentRenders: readPositiveNumber("MAX_CONCURRENT_RENDERS", 1),
  renderAssetOrigin:
    process.env.RENDER_ASSET_ORIGIN || `http://127.0.0.1:${port}`,
});

module.exports = { config };
