# character-workflow-agent

Open-source workflow agent for turning one character image into reusable character assets.

## Why This Project Exists
Most users do not struggle with "clicking generate". They struggle with:
- writing stable prompts
- describing visual details clearly
- keeping character identity consistent across outputs
- getting a usable asset pack instead of random one-off images

`character-workflow-agent` is designed as a workflow product, not a generic image playground.

## Phase 1 Goal
Convert:

`single image input -> cutout -> 3 expressions -> 2 CG outputs`

into a structured and repeatable pipeline.

## Phase 1 Workflow
1. Upload one character image (background allowed)
2. Validate input file (type, size, dimensions)
3. Remove background and produce transparent character cutout
4. Generate expression variant: `thinking`
5. Generate expression variant: `surprise`
6. Generate expression variant: `angry`
7. Generate `2` CG-style outputs while keeping the same character identity
8. Return a bundled result set suitable for downstream creative use

## Included In Phase 1
- Single image upload
- Basic image validation
- Background removal step
- 3 expression outputs (`thinking`, `surprise`, `angry`)
- 2 CG outputs
- Simple web UI for upload + workflow progress + outputs
- Server-side pipeline orchestration with mock/stub adapters

## Not Included In Phase 1
- Character element decomposition
- Face customization / pre-generation face editing
- LoRA training
- Multi-character support
- Animation rigging
- Advanced accounts / billing / quotas
- Production deployment hardening

## Architecture Direction (Prototype-Friendly)
- `web/`: lightweight frontend for upload, status, and output preview
- `server/`: API + orchestration pipeline + provider adapters
- `workflows/`: pipeline definition and stage contracts
- `prompts/`: reusable prompt templates for expression and CG generation
- Mock-first adapters so we can ship Phase 1 before wiring production APIs

## Repository Structure

```text
character-workflow-agent/
├── README.md
├── LICENSE
├── .gitignore
├── .env.example
├── docs/
│   ├── phase-1-spec.md
│   └── roadmap.md
├── prompts/
│   ├── expression-thinking.md
│   ├── expression-surprise.md
│   ├── expression-angry.md
│   └── cg-generation.md
├── examples/
│   └── sample-input-output.md
├── workflows/
│   └── pipeline-overview.md
├── tmp/                         # generated at runtime (gitignored)
├── web/
│   ├── README.md
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       └── styles.css
└── server/
    ├── README.md
    ├── package.json
    └── src/
        ├── app.js
        ├── config.js
        ├── index.js
        ├── routes/
        ├── pipeline/
        ├── adapters/
        ├── services/
        └── utils/
```

## Current Status
Phase 1 prototype code is now included:
- upload API (`POST /api/workflows`)
- workflow status API (`GET /api/workflows/:id`)
- pipeline that produces:
  - `cutout`
  - `expression-thinking`
  - `expression-surprise`
  - `expression-angry`
  - `cg-01`
  - `cg-02`
- mock mode by default
- Banana2 live provider integration for:
  - background removal edit
  - 3 expression edits
  - 2 CG generations
- simple web UI served by the server

## Roadmap
See:
- [`docs/phase-1-spec.md`](docs/phase-1-spec.md)
- [`docs/roadmap.md`](docs/roadmap.md)

## Quick Start
1. Install dependencies
```bash
npm --prefix server install
npm --prefix web install
```
2. Create environment file
```bash
cp .env.example .env
```
3. Start backend
```bash
npm --prefix server run dev
```
4. Start frontend (new terminal)
```bash
npm --prefix web run dev
```
5. Open dynamic site
```text
http://localhost:5173
```

## Live Provider Setup
If you want the workflow to behave closer to the current `p2g` flow, switch the pipeline to Banana2:

```bash
cp .env.example .env
```

Then set:

```dotenv
PIPELINE_MODE=live
BG_REMOVAL_PROVIDER=banana2
EXPRESSION_PROVIDER=banana2
CG_PROVIDER=banana2
BANANA2_API_KEY=sk-your-key
BANANA2_BASE_URL=https://api.apiyi.com
BANANA2_MODEL=gemini-3.1-flash-image-preview
BANANA2_IMAGE_SIZE=1K
BANANA2_ASPECT_RATIO=1:1
```

Notes:
- Banana2 live mode currently accepts `PNG` and `JPG/JPEG` uploads.
- If Banana2 is selected but no API key is configured, the server falls back to mock mode automatically.
- Expressions and CG are generated from the cutout result, not directly from the raw upload.

## Build And Serve
1. Build frontend bundle
```bash
npm --prefix web run build
```
2. Start backend
```bash
npm --prefix server run start
```
3. Open app at `http://localhost:3001`

## API (Phase 1 Prototype)
- `POST /api/workflows`
  - `multipart/form-data`
  - field name: `image`
  - returns `202 Accepted` with `workflow_id`
- `GET /api/workflows/:id`
  - returns workflow status, per-step progress, and output URLs
- `GET /outputs/:workflowId/manifest.json`
  - returns packaged workflow manifest for the finished run
- `GET /outputs/:workflowId/:fileName`
  - serves generated mock assets

## Contributing (Early Stage)
1. Keep changes focused on current phase scope
2. Preserve clear separation between UI, orchestration logic, and provider adapters
3. Prefer mock-compatible design to keep local development fast
