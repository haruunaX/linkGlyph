# LinkGlyph

LinkGlyph is a React and TypeScript QR design studio with Tailwind CSS and a small Python/FastAPI quality-check service.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Python 3.11+ with FastAPI
- Browser-side QR rendering with PNG and SVG export

## Run locally

Install frontend dependencies:

```bash
npm install
```

Start the Python API in one terminal:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
npm run backend
```

Start the React app in another terminal:

```bash
npm run dev
```

Open the local URL printed by Vite. The Vite development server proxies `/api` to FastAPI on port `8000`.

## Deploy to Vercel

The frontend and backend deploy together as one Vercel project from this folder:

- `vite build` outputs the React app to `dist/`, which Vercel serves as static files.
- `api/index.py` exposes the FastAPI app from `backend/main.py` as a Python serverless function.
- `vercel.json` sends every `/api/*` request to that function. Because the app and API share one domain, CORS isn't needed in production.
- `requirements.txt` at the repo root lists the Python dependencies Vercel installs.

To deploy, import the repo in Vercel with **Add New → Project** (the settings come from `vercel.json`, so leave the defaults), or run `npx vercel` from this folder. Use `npx vercel --prod` for production.

## Features

- URL, text, email, phone, and Wi-Fi QR content
- Live React preview with color, size, margin, and error-correction controls
- Scan Proof reliability scoring from the Python API, with an offline browser fallback
- PNG and SVG downloads
- Browser-local project saving and recent project history
- Responsive, accessible Tailwind interface

## Privacy

QR codes are rendered in the browser. Saved projects stay in local storage on the current device. The optional Scan Proof API receives only the current QR configuration and does not persist it.
