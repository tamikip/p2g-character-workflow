const path = require("path");
const fs = require("fs/promises");
const {
  getWorkflow,
  markStepStatus,
  setWorkflowOutputs,
  setWorkflowStatus
} = require("../services/workflowStore");
const {
  createBackgroundRemovalPrompt,
  getCgPrompts,
  getExpressionPrompt
} = require("../services/promptLoader");
const {
  getBackgroundRemovalRunner,
  getCgRunner,
  getExpressionRunner,
  getMimeTypeFromPath
} = require("../services/providerRegistry");

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
    let currentSourcePath = workflow.source_image.upload_path;
    let currentSourceMimeType = workflow.source_image.mime_type;
    const outputDir = path.join(config.outputDir, workflowId);
    const backgroundRemovalRunner = getBackgroundRemovalRunner(config);
    const expressionRunner = getExpressionRunner(config);
    const cgRunner = getCgRunner(config);

    await fs.mkdir(outputDir, { recursive: true });

    await runStep(workflowId, "validate_input", async () => true);

    const cutoutResult = await runStep(workflowId, "remove_background", async () => {
      return backgroundRemovalRunner.run({
        config,
        sourcePath: currentSourcePath,
        sourceMimeType: currentSourceMimeType,
        destinationPath: path.join(outputDir, "cutout.png"),
        prompt: createBackgroundRemovalPrompt()
      });
    });
    currentSourcePath = cutoutResult.output_path;
    currentSourceMimeType = getMimeTypeFromPath(cutoutResult.output_path);

    const expressionMap = {
      thinking: "expression_thinking",
      surprise: "expression_surprise",
      angry: "expression_angry"
    };
    const expressionOutputs = {};
    const promptPack = {
      remove_background: createBackgroundRemovalPrompt(),
      expressions: {},
      cg: []
    };

    for (const [expressionName, stepName] of Object.entries(expressionMap)) {
      const expressionPrompt = await getExpressionPrompt(expressionName);
      promptPack.expressions[expressionName] = expressionPrompt;
      const expressionResult = await runStep(workflowId, stepName, async () => {
        return expressionRunner.run({
          config,
          sourcePath: currentSourcePath,
          sourceMimeType: currentSourceMimeType,
          destinationPath: path.join(outputDir, `expression-${expressionName}.png`),
          prompt: expressionPrompt
        });
      });

      expressionOutputs[expressionName] = toPublicOutputUrl(
        workflowId,
        path.basename(expressionResult.output_path)
      );
    }

    const cgPromptEntries = await getCgPrompts();
    const cgOutputs = [];

    for (const [index, [stepName, outputName]] of [
      ["cg_01", "cg-01.png"],
      ["cg_02", "cg-02.png"]
    ].entries()) {
      const cgPromptEntry = cgPromptEntries[index];
      promptPack.cg.push(cgPromptEntry);

      const cgResult = await runStep(workflowId, stepName, async () => {
        return cgRunner.run({
          config,
          sourcePath: currentSourcePath,
          sourceMimeType: currentSourceMimeType,
          destinationPath: path.join(outputDir, outputName),
          prompt: cgPromptEntry.prompt
        });
      });

      cgOutputs.push(toPublicOutputUrl(workflowId, path.basename(cgResult.output_path)));
    }

    const outputs = {
      cutout: toPublicOutputUrl(workflowId, path.basename(cutoutResult.output_path)),
      providers: {
        remove_background: backgroundRemovalRunner.provider,
        expressions: expressionRunner.provider,
        cg: cgRunner.provider
      },
      expressions: expressionOutputs,
      cg_outputs: cgOutputs
    };

    const currentWorkflow = getWorkflow(workflowId);
    const manifest = {
      workflow_id: workflowId,
      status: "completed",
      generated_at: new Date().toISOString(),
      steps: Object.fromEntries(
        Object.entries(currentWorkflow.steps).map(([stepName, step]) => [stepName, step.status])
      ),
      prompts: promptPack,
      outputs
    };

    const manifestFileName = "manifest.json";
    await fs.writeFile(
      path.join(outputDir, manifestFileName),
      JSON.stringify(manifest, null, 2),
      "utf8"
    );

    outputs.manifest = toPublicOutputUrl(workflowId, manifestFileName);

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
