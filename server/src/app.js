const path = require("path");
const cors = require("cors");
const express = require("express");
const multer = require("multer");
const config = require("./config");
const workflowsRouter = require("./routes/workflows");

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

app.use(express.static(config.webDir));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  return res.sendFile(path.join(config.webDir, "index.html"));
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      error: `File is too large. Maximum allowed is ${Math.floor(config.maxUploadSizeBytes / (1024 * 1024))}MB.`
    });
  }

  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({
    error: error.message || "Unexpected server error."
  });
});

module.exports = app;
