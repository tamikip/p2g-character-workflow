const path = require("path");
const fs = require("fs/promises");
const {
  getWorkflow,
  markStepStatus,
  mergeWorkflowOutputs,
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
const { formatErrorDetails } = require("../utils/errors");

function shouldFallbackToOriginalReference(quality, minCoverageRatio) {
  if (!quality || typeof quality !== "object") {
    return false;
  }

  return Number(quality.non_transparent_ratio || 0) < minCoverageRatio;
}

function shouldRetryPlatoWithOriginal(error) {
  return Boolean(
    error &&
      (error.code === "PLATO_IMAGE_PAYLOAD_MISSING" || error.code === "PLATO_REQUEST_FAILED")
  );
}

async function runGeneratedImageStep({
  runner,
  config,
  prompt,
  destinationPath,
  primaryReference,
  fallbackReference
}) {
  const attemptRunner = async (reference, fallbackReason = null) => {
    const result = await runner.run({
      config,
      sourcePath: reference.path,
      sourceMimeType: reference.mimeType,
      destinationPath,
      prompt
    });

    return {
      ...result,
      debug: {
        ...(result?.debug || {}),
        reference_source: reference.label,
        reference_path: reference.path,
        reference_mime_type: reference.mimeType,
        fallback_reason: fallbackReason
      }
    };
  };

  try {
    return await attemptRunner(primaryReference, primaryReference.fallbackReason || null);
  } catch (error) {
    if (
      fallbackReference &&
      primaryReference.path !== fallbackReference.path &&
      shouldRetryPlatoWithOriginal(error)
    ) {
      return attemptRunner(fallbackReference, primaryReference.fallbackReason || "plato_retry");
    }

    throw error;
  }
}

function toPublicOutputUrl(workflowId, fileName) {
  return `/outputs/${workflowId}/${fileName}`;
}

async function writeManifestSnapshot(workflowId, outputDir, promptPack) {
  const workflow = getWorkflow(workflowId);
  if (!workflow) {
    return null;
  }

  const manifest = {
    workflow_id: workflowId,
    status: workflow.status,
    current_step: workflow.current_step,
    generated_at: new Date().toISOString(),
    error: workflow.error,
    error_details: workflow.error_details,
    steps: workflow.steps,
    prompts: promptPack,
    outputs: workflow.outputs
  };

  const manifestFileName = "manifest.json";
  await fs.writeFile(path.join(outputDir, manifestFileName), JSON.stringify(manifest, null, 2), "utf8");
  mergeWorkflowOutputs(workflowId, {
    manifest: toPublicOutputUrl(workflowId, manifestFileName)
  });

  return manifest;
}

async function runStep(workflowId, stepName, provider, runFn, onSuccess) {
  markStepStatus(workflowId, stepName, "running", null, { provider });
  setWorkflowStatus(workflowId, "running", stepName, null, null);

  try {
    const result = await runFn();
    const outputUrl = result?.output_path
      ? toPublicOutputUrl(workflowId, path.basename(result.output_path))
      : null;

    markStepStatus(workflowId, stepName, "success", null, {
      provider,
      output_url: outputUrl,
      debug: result?.debug || null
    });

    if (typeof onSuccess === "function") {
      await onSuccess(result, outputUrl);
    }

    return result;
  } catch (error) {
    const detailed = formatErrorDetails(error, {
      step: stepName,
      provider,
      workflow_id: workflowId
    });

    markStepStatus(workflowId, stepName, "failed", detailed.message, {
      provider,
      debug: detailed.debug
    });
    setWorkflowStatus(workflowId, "failed", stepName, detailed.message, detailed.debug);
    throw error;
  }
}

async function executeWorkflow(workflowId, config) {
  const workflow = getWorkflow(workflowId);
  if (!workflow) {
    return null;
  }

  const promptPack = {
    remove_background: createBackgroundRemovalPrompt(),
    expressions: {},
    cg: []
  };

  try {
    let currentSourcePath = workflow.source_image.upload_path;
    let currentSourceMimeType = workflow.source_image.mime_type;
    const originalSourcePath = workflow.source_image.upload_path;
    const originalSourceMimeType = workflow.source_image.mime_type;
    const outputDir = path.join(config.outputDir, workflowId);
    const backgroundRemovalRunner = getBackgroundRemovalRunner(config);
    const expressionRunner = getExpressionRunner(config);
    const cgRunner = getCgRunner(config);

    await fs.mkdir(outputDir, { recursive: true });

    mergeWorkflowOutputs(workflowId, {
      providers: {
        remove_background: backgroundRemovalRunner.provider,
        expressions: expressionRunner.provider,
        cg: cgRunner.provider
      }
    });

    await runStep(workflowId, "validate_input", "system", async () => true);
    await writeManifestSnapshot(workflowId, outputDir, promptPack);

    const cutoutResult = await runStep(
      workflowId,
      "remove_background",
      backgroundRemovalRunner.provider,
      async () =>
        backgroundRemovalRunner.run({
          config,
          sourcePath: currentSourcePath,
          sourceMimeType: currentSourceMimeType,
          destinationPath: path.join(outputDir, "cutout.png"),
          prompt: promptPack.remove_background
        }),
      async (result, outputUrl) => {
        currentSourcePath = result.output_path;
        currentSourceMimeType = getMimeTypeFromPath(result.output_path);
        mergeWorkflowOutputs(workflowId, {
          cutout: outputUrl,
          providers: {
            remove_background: backgroundRemovalRunner.provider
          }
        });
        await writeManifestSnapshot(workflowId, outputDir, promptPack);
      }
    );

    currentSourcePath = cutoutResult.output_path;
    currentSourceMimeType = getMimeTypeFromPath(cutoutResult.output_path);

    let preferredReference = {
      label: "cutout",
      path: currentSourcePath,
      mimeType: currentSourceMimeType,
      fallbackReason: null
    };
    const originalReference = {
      label: "original_upload",
      path: originalSourcePath,
      mimeType: originalSourceMimeType
    };

    if (
      (expressionRunner.provider === "plato" || cgRunner.provider === "plato") &&
      shouldFallbackToOriginalReference(cutoutResult?.debug?.quality, config.rembgMinCoverageRatio)
    ) {
      preferredReference = {
        ...originalReference,
        fallbackReason: "cutout_low_coverage"
      };
    }

    const expressionMap = {
      thinking: "expression_thinking",
      surprise: "expression_surprise",
      angry: "expression_angry"
    };

    for (const [expressionName, stepName] of Object.entries(expressionMap)) {
      const expressionPrompt = await getExpressionPrompt(expressionName);
      promptPack.expressions[expressionName] = expressionPrompt;

      await runStep(
        workflowId,
        stepName,
        expressionRunner.provider,
        async () => {
          const destinationPath = path.join(outputDir, `expression-${expressionName}.png`);

          if (expressionRunner.provider === "plato") {
            return runGeneratedImageStep({
              runner: expressionRunner,
              config,
              prompt: expressionPrompt,
              destinationPath,
              primaryReference: preferredReference,
              fallbackReference: originalReference
            });
          }

          return expressionRunner.run({
            config,
            sourcePath: currentSourcePath,
            sourceMimeType: currentSourceMimeType,
            destinationPath,
            prompt: expressionPrompt
          });
        },
        async (_result, outputUrl) => {
          mergeWorkflowOutputs(workflowId, {
            expressions: {
              [expressionName]: outputUrl
            },
            providers: {
              expressions: expressionRunner.provider
            }
          });
          await writeManifestSnapshot(workflowId, outputDir, promptPack);
        }
      );
    }

    const cgPromptEntries = await getCgPrompts();

    for (const [index, [stepName, outputName]] of [
      ["cg_01", "cg-01.png"],
      ["cg_02", "cg-02.png"]
    ].entries()) {
      const cgPromptEntry = cgPromptEntries[index];
      promptPack.cg[index] = cgPromptEntry;

      await runStep(
        workflowId,
        stepName,
        cgRunner.provider,
        async () => {
          const destinationPath = path.join(outputDir, outputName);

          if (cgRunner.provider === "plato") {
            return runGeneratedImageStep({
              runner: cgRunner,
              config,
              prompt: cgPromptEntry.prompt,
              destinationPath,
              primaryReference: preferredReference,
              fallbackReference: originalReference
            });
          }

          return cgRunner.run({
            config,
            sourcePath: currentSourcePath,
            sourceMimeType: currentSourceMimeType,
            destinationPath,
            prompt: cgPromptEntry.prompt
          });
        },
        async (_result, outputUrl) => {
          const nextCgOutputs = getWorkflow(workflowId)?.outputs?.cg_outputs || [null, null];
          nextCgOutputs[index] = outputUrl;

          mergeWorkflowOutputs(workflowId, {
            cg_outputs: nextCgOutputs,
            providers: {
              cg: cgRunner.provider
            }
          });
          await writeManifestSnapshot(workflowId, outputDir, promptPack);
        }
      );
    }

    const currentWorkflow = getWorkflow(workflowId);
    const outputs = {
      ...currentWorkflow.outputs,
      providers: {
        remove_background: backgroundRemovalRunner.provider,
        expressions: expressionRunner.provider,
        cg: cgRunner.provider
      }
    };

    setWorkflowOutputs(workflowId, outputs);
    setWorkflowStatus(workflowId, "completed", "done", null, null);
    await writeManifestSnapshot(workflowId, outputDir, promptPack);
  } catch (error) {
    const currentWorkflow = getWorkflow(workflowId);
    const outputDir = path.join(config.outputDir, workflowId);

    if (currentWorkflow) {
      await writeManifestSnapshot(workflowId, outputDir, promptPack).catch(() => null);
    }
  }

  return getWorkflow(workflowId);
}

module.exports = {
  executeWorkflow
};
