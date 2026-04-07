const path = require("path");
const fs = require("fs");
const cors = require("cors");
const express = require("express");
const multer = require("multer");
const config = require("./config");
const workflowsRouter = require("./routes/workflows");
const { formatErrorDetails } = require("./utils/errors");

const app = express();

app.use(
  cors({
    origin: config.corsOrigin === "*" ? true : config.corsOrigin
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/uploads", express.static(config.uploadDir));
app.use("/outputs", express.static(config.outputDir));
app.use("/api/workflows", workflowsRouter);
app.use("/api/*", (_req, res) => {
  res.status(404).json({ error: "API route not found" });
});

const hasBuiltWeb = fs.existsSync(path.join(config.webDistDir, "index.html"));
if (hasBuiltWeb) {
  app.use(express.static(config.webDistDir));
}

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  if (!hasBuiltWeb) {
    return res.status(503).json({
      error: "Web bundle not found. Use Vite dev server on http://localhost:5173 or run `npm --prefix web run build`."
    });
  }

  return res.sendFile(path.join(config.webDistDir, "index.html"));
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      error: `File is too large. Maximum allowed is ${Math.floor(config.maxUploadSizeBytes / (1024 * 1024))}MB.`,
      details: {
        code: error.code,
        max_upload_size_bytes: config.maxUploadSizeBytes
      }
    });
  }

  const statusCode = error.statusCode || 500;
  const detailed = formatErrorDetails(error, {
    route: _req.originalUrl,
    method: _req.method
  });

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({
    error: detailed.message,
    details: detailed.debug
  });
});

module.exports = app;
