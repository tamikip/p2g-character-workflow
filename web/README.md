# Web (Phase 1)

Static frontend for:
- image upload
- workflow stage status display
- previewing cutout / expressions / CG outputs
- GitHub Pages friendly deployment

## Stack
- plain `index.html`
- browser-side `app.js`
- `styles.css`
- Vite 5 for optional local dev/build only

## Local Development
1. `npm install`
2. `npm run dev`
3. Open `http://localhost:5173`
4. The static page talks to `http://localhost:3001` by default when running on localhost

## GitHub Pages
- Deploy the contents of `web/` or the build output from `web/dist`
- In Settings -> Backend, set the API root URL for your hosted server
- Asset URLs such as `/outputs/...` are resolved against that configured backend URL

## Build
1. `npm run build`
2. Static files are generated in `web/dist`
3. Backend serves `web/index.html`, `web/app.js`, and `web/styles.css` directly in local/server mode
