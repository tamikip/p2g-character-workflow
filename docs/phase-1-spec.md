# Phase 1 Specification

## 1. Product Goal
Build a usable prototype that converts a single character image into a structured character asset set with minimal user input.

Primary outcome:
`1 input image -> transparent cutout + 3 expressions + 2 CG outputs`

## 2. Target User Problem
Target users (creators, indie teams, hobbyists) often:
- cannot write high-quality prompts
- cannot describe character details precisely
- fail to keep character identity consistent across generations
- need reusable assets, not isolated random images

Phase 1 reduces cognitive load by packaging this into one guided workflow.

## 3. Input And Output Contract

### Input
- One image file upload
- Accepted formats: PNG, JPG, JPEG, WEBP (exact list configurable)
- Image may contain background

### Output
A structured result package containing:
- `cutout`: background-removed character image (transparent background)
- `expressions`:
  - `thinking`
  - `surprise`
  - `angry`
- `cg_outputs`:
  - `cg_01`
  - `cg_02`
- Basic metadata:
  - workflow id
  - processing status per step
  - generated timestamp

## 4. Functional Requirements
- `FR-1` Upload one image through web UI.
- `FR-2` Validate file type, file size, and minimum dimensions.
- `FR-3` Persist source image for the workflow session.
- `FR-4` Execute background removal stage.
- `FR-5` Execute expression generation for three fixed expressions: thinking, surprise, angry.
- `FR-6` Execute CG generation for two outputs with identity consistency intent.
- `FR-7` Return progress and stage status to UI (queued, running, success, failed).
- `FR-8` Support mock mode for all generation stages so the full pipeline can run without external APIs.

## 5. Non-Functional Requirements
- Simple local setup for open-source contributors.
- Clear modular separation:
  - UI layer
  - orchestration pipeline
  - provider adapters
- Deterministic stage contracts (input/output schema per stage).
- Basic observability via structured logs and workflow IDs.
- Prototype-level performance target: end-to-end mock run should complete quickly on local machine.

## 6. Limitations (Phase 1)
- Single character only.
- No editing UI for facial details.
- No style training / LoRA.
- No account system, billing, quotas, or multi-tenant controls.
- No production infra guarantees (HA, autoscaling, hardened security posture).

## 7. Future Extension Points
- Swap mock adapters with real providers:
  - background removal API
  - image generation API
- Add prompt template selection strategy.
- Add workflow memory and agentic planning layer.
- Add pre-generation character control (face shaping, accessory consistency).
- Add style-consistent model strategy (e.g., LoRA path) in later phases.

## 8. Acceptance Criteria (Phase 1)
A Phase 1 implementation is complete when:
- User can upload one image through the web UI.
- Pipeline executes all required stages in order.
- User can view/download one cutout, three expression outputs, and two CG outputs.
- Mock mode can run end-to-end locally without paid external services.
