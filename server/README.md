# Server (Phase 1)

Prototype backend for:
- upload endpoint
- workflow orchestration
- mock adapter switching
- result manifest API

## Implemented Endpoints
- `GET /api/health`
- `POST /api/workflows`
- `GET /api/workflows/:id`
- `GET /outputs/:workflowId/manifest.json` (generated workflow manifest)

## Architecture
- `src/routes/` request handling
- `src/pipeline/` workflow orchestration
- `src/adapters/` generation provider adapters (mock for now)
- `src/services/` workflow state + validation
- `src/utils/` shared helpers

## Notes
- Current generation behavior is mock mode (file-copy based) for rapid prototype validation.
- Provider integration points are isolated in `src/adapters/`.
- If `web/dist/index.html` exists, backend serves built frontend automatically.
- Banana2 live mode is supported through environment variables in `.env`.
