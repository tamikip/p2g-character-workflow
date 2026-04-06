# Project Roadmap

## Phase 1: Usable Workflow Prototype (Current)
Goal: deliver an end-to-end workflow from single image upload to structured character asset outputs.

Scope:
- Single image upload + validation
- Background removal
- 3 expression outputs (thinking, surprise, angry)
- 2 CG outputs
- Simple UI for workflow execution and result display
- Server-side orchestration with mock-first adapters

Success signal:
Contributors can run the full workflow locally and get predictable outputs, even in mock mode.

## Phase 2: Guided Quality & Consistency Upgrade (Roadmap Only)
Potential additions:
- Reference image collection for pose/action guidance
- Open-source character element decomposition experiments
- Face customization / pre-creation face shaping step
- Style-consistent generation approach (including LoRA exploration)
- Better guidance for users who cannot describe prompts clearly

## Future Ideas
- Multi-character workflows
- Storyboard / scene-level generation
- Animation-ready exports and rigging handoff
- Collaboration workflows for teams
- Hosted SaaS capabilities (accounts, quotas, billing) if project direction requires

## Roadmap Principles
- Keep each phase demo-able and testable.
- Do not add future-phase complexity into current implementation.
- Preserve clean interfaces so future capabilities can plug in without major rewrites.
