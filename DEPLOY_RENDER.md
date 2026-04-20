# Deploy Full-Stack on Render + GitHub Pages

## 1) Deploy backend API on Render

1. Open Render and create a **Blueprint** from this repository.
2. Render will detect `render.yaml` and create service `itc-archive-pro-api`.
3. Wait for deploy to finish and copy API URL, for example:
   - `https://itc-archive-pro-api.onrender.com`

## 2) Configure frontend build variable in GitHub

1. Open GitHub repository settings.
2. Go to **Settings > Secrets and variables > Actions > Variables**.
3. Create variable:
   - Name: `REACT_APP_API_URL`
   - Value: your Render API URL (example `https://itc-archive-pro-api.onrender.com`)

## 3) Redeploy GitHub Pages from main

1. Push to `main` (or re-run workflow `Deploy frontend to GitHub Pages`).
2. The workflow injects `REACT_APP_API_URL` at build time.
3. Open app URL:
   - `https://joel87-hosy.github.io/itc-archive-pro/`

## Notes

- `gh-pages` hosts only frontend static files.
- Backend is hosted on Render and remains dynamic.
- Uploaded files and SQLite DB are persisted on Render disk (`/var/data`).
