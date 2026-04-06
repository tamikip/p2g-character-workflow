import { useEffect, useMemo, useState } from "react";

const STEP_ORDER = [
  "validate_input",
  "remove_background",
  "expression_thinking",
  "expression_surprise",
  "expression_angry",
  "cg_01",
  "cg_02"
];

const STATUS_LABELS = {
  queued: "Queued",
  running: "Running",
  success: "Success",
  failed: "Failed"
};

const POLL_INTERVAL_MS = 1000;

function toAssetUrl(url) {
  if (!url) {
    return "";
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${window.location.origin}${url}`;
}

async function startWorkflow(file) {
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

  return payload.workflow;
}

async function fetchWorkflow(workflowId) {
  const response = await fetch(`/api/workflows/${workflowId}`);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Failed to fetch workflow.");
  }

  return payload;
}

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [message, setMessage] = useState({ type: "info", text: "Upload one image to start." });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!workflow?.id) {
      return undefined;
    }

    if (workflow.status === "completed" || workflow.status === "failed") {
      return undefined;
    }

    const timer = setInterval(async () => {
      try {
        const latest = await fetchWorkflow(workflow.id);
        setWorkflow(latest);

        if (latest.status === "completed") {
          setMessage({ type: "success", text: "Workflow completed." });
        }

        if (latest.status === "failed") {
          setMessage({ type: "error", text: latest.error || "Workflow failed." });
        }
      } catch (error) {
        setMessage({ type: "error", text: error.message });
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [workflow?.id, workflow?.status]);

  const outputs = workflow?.outputs;

  const outputCards = useMemo(() => {
    if (!outputs) {
      return [];
    }

    return [
      { title: "Cutout", url: outputs.cutout },
      { title: "Expression - Thinking", url: outputs.expressions?.thinking },
      { title: "Expression - Surprise", url: outputs.expressions?.surprise },
      { title: "Expression - Angry", url: outputs.expressions?.angry },
      { title: "CG - 01", url: outputs.cg_outputs?.[0] },
      { title: "CG - 02", url: outputs.cg_outputs?.[1] }
    ].filter((item) => Boolean(item.url));
  }, [outputs]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile) {
      setMessage({ type: "error", text: "Please choose one image file first." });
      return;
    }

    try {
      setSubmitting(true);
      setMessage({ type: "info", text: "Starting workflow..." });
      const created = await startWorkflow(selectedFile);
      setWorkflow(created);
      setMessage({ type: "info", text: "Workflow started. Processing..." });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <section className="panel">
        <h1>Character Workflow Agent</h1>
        <p className="subtitle">
          Upload one character image and generate cutout, 3 expressions, and 2 CG outputs.
        </p>

        <form className="upload-form" onSubmit={handleSubmit}>
          <label htmlFor="image">Character Image</label>
          <input
            id="image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            disabled={submitting}
          />
          <button type="submit" disabled={submitting}>
            {submitting ? "Starting..." : "Start Workflow"}
          </button>
        </form>

        <p className={`message ${message.type}`}>{message.text}</p>
      </section>

      <section className="panel">
        <h2>Workflow</h2>
        {!workflow ? <p className="muted">No workflow yet.</p> : null}
        {workflow ? (
          <>
            <p className="workflow-id">Workflow ID: {workflow.id}</p>
            <ul className="steps">
              {STEP_ORDER.map((stepName) => {
                const step = workflow.steps?.[stepName] || { status: "queued" };

                return (
                  <li className={`step ${step.status}`} key={stepName}>
                    <strong>{stepName}</strong>
                    <span>{STATUS_LABELS[step.status] || step.status}</span>
                    {step.error ? <small>{step.error}</small> : null}
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </section>

      <section className="panel">
        <h2>Outputs</h2>
        {outputCards.length === 0 ? <p className="muted">Outputs will appear after completion.</p> : null}
        {outputs?.providers ? (
          <div className="provider-row">
            <span className="provider-pill">Cutout: {outputs.providers.remove_background}</span>
            <span className="provider-pill">Expressions: {outputs.providers.expressions}</span>
            <span className="provider-pill">CG: {outputs.providers.cg}</span>
          </div>
        ) : null}
        {outputs?.manifest ? (
          <p className="manifest-link">
            Result manifest:{" "}
            <a href={toAssetUrl(outputs.manifest)} target="_blank" rel="noreferrer">
              Open manifest.json
            </a>
          </p>
        ) : null}
        <div className="grid">
          {outputCards.map((card) => (
            <article className="output-card" key={card.title}>
              <h3>{card.title}</h3>
              <img src={toAssetUrl(card.url)} alt={card.title} />
              <a href={toAssetUrl(card.url)} target="_blank" rel="noreferrer">
                Open file
              </a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
