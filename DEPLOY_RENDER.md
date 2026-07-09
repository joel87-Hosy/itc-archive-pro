# Deploy Full-Stack on Render + GitHub Pages

## 1) Deploy backend API on Render

1. Open Render and create a **Blueprint** from this repository.
2. Render will detect `render.yaml` and create service `itc-archive-pro-api`.
3. Wait for deploy to finish and copy API URL, for example:
   - `https://itc-archive-pro-api.onrender.com`

## 2) Configure Firebase CORS (⚠️ IMPORTANT!)

This step **must be done before** users can upload files from GitHub Pages.

```bash
# Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install-sdk
gcloud auth login
gcloud config set project archive-itc
gsutil cors set cors.json gs://archive-itc.appspot.com
```

See [FIREBASE_CORS_SETUP.md](FIREBASE_CORS_SETUP.md) for detailed steps.

## 3) Configure frontend build variable in GitHub

1. Open GitHub repository settings.
2. Go to **Settings > Secrets and variables > Actions > Variables**.
3. Create variable:
   - Name: `REACT_APP_API_URL`
   - Value: your Render API URL (example `https://itc-archive-pro-api.onrender.com`)

## 4) Redeploy GitHub Pages from main

1. Push to `main` (or re-run workflow `Deploy frontend to GitHub Pages`).
2. The workflow injects `REACT_APP_API_URL` at build time.
3. Open app URL:
   - `https://joel87-hosy.github.io/itc-archive-pro/`

## 5) Test uploads

1. Log in to the app
2. Try uploading a document
3. If you see "CORS not configured" error → See [FIREBASE_CORS_SETUP.md](FIREBASE_CORS_SETUP.md)
4. If upload works → ✅ You're done!

## Troubleshooting

### Upload fails with "CORS policy blocked"
- CORS not configured on Firebase Storage
- Run: `gsutil cors set cors.json gs://archive-itc.appspot.com`
- See [FIREBASE_CORS_SETUP.md](FIREBASE_CORS_SETUP.md)

### Upload works locally but fails on GitHub Pages
- Probably CORS issue
- Verify: `gsutil cors get gs://archive-itc.appspot.com`
- Should show your GitHub Pages origin

### Need different domain for CORS
- Edit `cors.json` to add your domain
- Run: `gsutil cors set cors.json gs://archive-itc.appspot.com`

## Notes

- `gh-pages` hosts only frontend static files.
- Backend is hosted on Render and remains dynamic.
- Uploaded files and SQLite DB are persisted on Render disk (`/var/data`).
- Firebase Storage CORS must be manually configured via Google Cloud SDK.
