const express = require("express");
const fs = require("fs/promises");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const config = require("../config");
const { AppError } = require("../utils/errors");
const { validateUploadedFile } = require("../services/fileValidation");
const { createWorkflow, getWorkflow } = require("../services/workflowStore");
const { executeWorkflow } = require("../pipeline/executeWorkflow");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, config.uploadDir);
  },
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname) || ".png";
    const id = uuidv4().replace(/-/g, "").slice(0, 10);
    callback(null, `${Date.now()}-${id}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.maxUploadSizeBytes
  }
});

router.post("/", upload.single("image"), async (req, res, next) => {
  try {
    const sourceImage = validateUploadedFile(req.file, config);
    const workflow = createWorkflow({ sourceImage });

    setImmediate(() => {
      executeWorkflow(workflow.id, config).catch((error) => {
        console.error(`[workflow:${workflow.id}] pipeline execution failed`, error);
      });
    });

    res.status(202).json({
      workflow_id: workflow.id,
      status: workflow.status,
      message: "Workflow accepted and started.",
      workflow
    });
  } catch (error) {
    if (req.file?.path) {
      await fs.rm(req.file.path, { force: true });
    }
    next(error);
  }
});

router.get("/:id", (req, res, next) => {
  try {
    const workflow = getWorkflow(req.params.id);
    if (!workflow) {
      throw new AppError("Workflow not found.", 404);
    }

    res.json(workflow);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
