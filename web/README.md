# Web (Phase 1)

Dynamic frontend for:
- image upload
- workflow stage status display
- previewing cutout / expressions / CG outputs

## Stack
- React 18
- Vite 5

## Local Development
1. `npm install`
2. `npm run dev`
3. Open `http://localhost:5173`

The Vite dev server proxies `/api`, `/uploads`, and `/outputs` to `http://localhost:3001`.

## Build
1. `npm run build`
2. The built files are generated in `web/dist`.
3. Backend serves `web/dist` automatically when available.
