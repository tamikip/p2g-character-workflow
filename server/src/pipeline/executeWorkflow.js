const path = require("path");
const fs = require("fs/promises");
const {
  getWorkflow,
  markStepStatus,
  setWorkflowOutputs,
  setWorkflowStatus
} = require("../services/workflowStore");
const {
  mockGenerateCg,
  mockGenerateExpression,
  mockRemoveBackground
} = require("../adapters/mockImageAdapter");

function toPublicOutputUrl(workflowId, fileName) {
  return `/outputs/${workflowId}/${fileName}`;
}

async function runStep(workflowId, stepName, runFn) {
  markStepStatus(workflowId, stepName, "running");
  setWorkflowStatus(workflowId, "running", stepName, null);

  const result = await runFn();

  markStepStatus(workflowId, stepName, "success");
  return result;
}

async function executeWorkflow(workflowId, config) {
  const workflow = getWorkflow(workflowId);
  if (!workflow) {
    return null;
  }

  try {
    const sourcePath = workflow.source_image.upload_path;
    const sourceExt = path.extname(sourcePath) || ".png";
    const outputDir = path.join(config.outputDir, workflowId);

    await fs.mkdir(outputDir, { recursive: true });

    await runStep(workflowId, "validate_input", async () => true);

    const cutoutName = `cutout${sourceExt}`;
    await runStep(workflowId, "remove_background", async () => {
      await mockRemoveBackground({
        sourcePath,
        destinationPath: path.join(outputDir, cutoutName)
      });
    });

    const expressionMap = {
      thinking: "expression_thinking",
      surprise: "expression_surprise",
      angry: "expression_angry"
    };

    for (const [expressionName, stepName] of Object.entries(expressionMap)) {
      const outputName = `expression-${expressionName}${sourceExt}`;

      await runStep(workflowId, stepName, async () => {
        await mockGenerateExpression({
          sourcePath,
          destinationPath: path.join(outputDir, outputName)
        });
      });
    }

    for (const [stepName, outputName] of [
      ["cg_01", `cg-01${sourceExt}`],
      ["cg_02", `cg-02${sourceExt}`]
    ]) {
      await runStep(workflowId, stepName, async () => {
        await mockGenerateCg({
          sourcePath,
          destinationPath: path.join(outputDir, outputName)
        });
      });
    }

    const outputs = {
      cutout: toPublicOutputUrl(workflowId, cutoutName),
      expressions: {
        thinking: toPublicOutputUrl(workflowId, `expression-thinking${sourceExt}`),
        surprise: toPublicOutputUrl(workflowId, `expression-surprise${sourceExt}`),
        angry: toPublicOutputUrl(workflowId, `expression-angry${sourceExt}`)
      },
      cg_outputs: [
        toPublicOutputUrl(workflowId, `cg-01${sourceExt}`),
        toPublicOutputUrl(workflowId, `cg-02${sourceExt}`)
      ]
    };

    setWorkflowOutputs(workflowId, outputs);
    setWorkflowStatus(workflowId, "completed", "done", null);
  } catch (error) {
    setWorkflowStatus(workflowId, "failed", workflow.current_step, error.message);
  }

  return getWorkflow(workflowId);
}

module.exports = {
  executeWorkflow
};
