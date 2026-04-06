const form = document.getElementById("upload-form");
const fileInput = document.getElementById("image");
const submitButton = document.getElementById("submit-btn");
const messageEl = document.getElementById("message");
const workflowIdEl = document.getElementById("workflow-id");
const stepsEl = document.getElementById("steps");
const outputsEl = document.getElementById("outputs");

let pollTimer = null;

function setMessage(text, kind = "info") {
  messageEl.textContent = text;
  messageEl.dataset.kind = kind;
}

function renderSteps(steps = {}) {
  stepsEl.innerHTML = "";

  Object.entries(steps).forEach(([stepName, step]) => {
    const item = document.createElement("li");
    item.className = `step ${step.status}`;

    const title = document.createElement("strong");
    title.textContent = stepName;

    const status = document.createElement("span");
    status.textContent = step.status;

    item.append(title, status);

    if (step.error) {
      const errorLine = document.createElement("small");
      errorLine.textContent = step.error;
      item.append(errorLine);
    }

    stepsEl.append(item);
  });
}

function renderOutputs(outputs) {
  outputsEl.innerHTML = "";

  if (!outputs) {
    return;
  }

  const items = [
    ["Cutout", outputs.cutout],
    ["Expression - Thinking", outputs.expressions?.thinking],
    ["Expression - Surprise", outputs.expressions?.surprise],
    ["Expression - Angry", outputs.expressions?.angry],
    ["CG - 01", outputs.cg_outputs?.[0]],
    ["CG - 02", outputs.cg_outputs?.[1]]
  ];

  items.forEach(([title, url]) => {
    if (!url) {
      return;
    }

    const card = document.createElement("article");
    card.className = "output-card";

    const heading = document.createElement("h3");
    heading.textContent = title;

    const image = document.createElement("img");
    image.src = url;
    image.alt = title;

    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "Open file";

    card.append(heading, image, link);
    outputsEl.append(card);
  });
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function fetchWorkflow(workflowId) {
  const response = await fetch(`/api/workflows/${workflowId}`);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Failed to load workflow status.");
  }

  return payload;
}

function startPolling(workflowId) {
  stopPolling();

  pollTimer = setInterval(async () => {
    try {
      const workflow = await fetchWorkflow(workflowId);
      renderSteps(workflow.steps);

      if (workflow.status === "completed") {
        setMessage("Workflow completed.", "success");
        renderOutputs(workflow.outputs);
        stopPolling();
        submitButton.disabled = false;
      }

      if (workflow.status === "failed") {
        setMessage(`Workflow failed: ${workflow.error || "unknown error"}`, "error");
        stopPolling();
        submitButton.disabled = false;
      }
    } catch (error) {
      setMessage(error.message, "error");
      stopPolling();
      submitButton.disabled = false;
    }
  }, 1000);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = fileInput.files?.[0];
  if (!file) {
    setMessage("Please choose an image first.", "error");
    return;
  }

  outputsEl.innerHTML = "";
  stepsEl.innerHTML = "";
  submitButton.disabled = true;
  setMessage("Uploading and starting workflow...", "info");

  try {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/workflows", {
      method: "POST",
      body: formData
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Failed to start workflow.");
    }

    const workflowId = payload.workflow_id;
    workflowIdEl.textContent = `Workflow ID: ${workflowId}`;
    renderSteps(payload.workflow.steps);
    setMessage("Workflow started. Processing...", "info");

    startPolling(workflowId);
  } catch (error) {
    setMessage(error.message, "error");
    submitButton.disabled = false;
  }
});
