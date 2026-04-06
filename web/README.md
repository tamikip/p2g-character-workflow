# Web (Phase 1)

Prototype frontend for:
- image upload
- workflow stage status display
- previewing cutout / expressions / CG outputs

## Current Implementation
- Static web UI (`index.html` + `app.js` + `styles.css`)
- Served directly by the backend at `http://localhost:3001`
- Polls workflow status and renders all six output assets

## Why Static First
Phase 1 prioritizes workflow validation speed and open-source onboarding simplicity.
We can move to React + Vite once the pipeline contracts stabilize.
