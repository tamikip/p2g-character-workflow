const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const projectRoot = path.resolve(__dirname, "../..");

function resolvePath(value, fallback) {
  const raw = value || fallback;
  return path.isAbsolute(raw) ? raw : path.resolve(projectRoot, raw);
}

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

module.exports = {
  port: parseInteger(process.env.PORT, 3001),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  maxUploadSizeBytes: parseInteger(process.env.MAX_UPLOAD_SIZE_BYTES, 10 * 1024 * 1024),
  minImageWidth: parseInteger(process.env.MIN_IMAGE_WIDTH, 256),
  minImageHeight: parseInteger(process.env.MIN_IMAGE_HEIGHT, 256),
  uploadDir: resolvePath(process.env.UPLOAD_DIR, "./tmp/uploads"),
  outputDir: resolvePath(process.env.OUTPUT_DIR, "./tmp/outputs"),
  webDir: path.resolve(projectRoot, "web")
};
