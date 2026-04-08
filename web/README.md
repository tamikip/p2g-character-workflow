# Web (Phase 1)

This folder now only keeps frontend notes.

The actual GitHub Pages friendly frontend source has been moved to the project root:
- `/index.html`
- `/app.js`
- `/styles.css`
- `/vite.config.js`

## Current Direction
- Root static frontend for GitHub Pages
- Backend API remains in `server/`
- This `web/` directory can be removed later once all tooling/docs no longer reference it

## GitHub Pages
- Deploy the root static frontend or the root build output from `/dist`
- In Settings -> Backend, set the API root URL for your hosted server
- Asset URLs such as `/outputs/...` are resolved against that configured backend URL

## Build
1. Run `npm run build` from the project root
2. Static files are generated in `/dist`
3. Backend serves `/index.html`, `/app.js`, and `/styles.css` directly in local/server mode
