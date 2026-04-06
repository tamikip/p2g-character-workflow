const { v4: uuidv4 } = require("uuid");

const store = new Map();

const WORKFLOW_STEPS = [
  "validate_input",
  "remove_background",
  "expression_thinking",
  "expression_surprise",
  "expression_angry",
  "cg_01",
  "cg_02"
];

function nowIso() {
  return new Date().toISOString();
}

function makeStepMap() {
  return WORKFLOW_STEPS.reduce((acc, step) => {
    acc[step] = {
      status: "queued",
      error: null,
      started_at: null,
      finished_at: null
    };
    return acc;
  }, {});
}

function touch(workflow) {
  workflow.updated_at = nowIso();
  return workflow;
}

function createWorkflow({ sourceImage }) {
  const id = `wf_${uuidv4().replace(/-/g, "").slice(0, 12)}`;
  const timestamp = nowIso();

  const workflow = {
    id,
    status: "queued",
    current_step: null,
    error: null,
    created_at: timestamp,
    updated_at: timestamp,
    source_image: sourceImage,
    steps: makeStepMap(),
    outputs: null
  };

  store.set(id, workflow);
  return workflow;
}

function getWorkflow(id) {
  return store.get(id) || null;
}

function setWorkflowStatus(id, status, currentStep = null, errorMessage = null) {
  const workflow = getWorkflow(id);
  if (!workflow) {
    return null;
  }

  workflow.status = status;
  workflow.current_step = currentStep;
  workflow.error = errorMessage;
  touch(workflow);
  return workflow;
}

function setWorkflowOutputs(id, outputs) {
  const workflow = getWorkflow(id);
  if (!workflow) {
    return null;
  }

  workflow.outputs = outputs;
  touch(workflow);
  return workflow;
}

function markStepStatus(id, step, status, errorMessage = null) {
  const workflow = getWorkflow(id);
  if (!workflow || !workflow.steps[step]) {
    return null;
  }

  const stepRecord = workflow.steps[step];

  if (status === "running" && !stepRecord.started_at) {
    stepRecord.started_at = nowIso();
  }

  if ((status === "success" || status === "failed") && !stepRecord.started_at) {
    stepRecord.started_at = nowIso();
  }

  if (status === "success" || status === "failed") {
    stepRecord.finished_at = nowIso();
  }

  stepRecord.status = status;
  stepRecord.error = errorMessage;
  touch(workflow);
  return workflow;
}

module.exports = {
  WORKFLOW_STEPS,
  createWorkflow,
  getWorkflow,
  markStepStatus,
  setWorkflowOutputs,
  setWorkflowStatus
};
