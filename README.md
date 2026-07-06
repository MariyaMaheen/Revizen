# Revizen — Revise without chaos

An AI-powered study assistant that lets students upload lecture notes or textbooks (PDF/TXT), then ask questions, generate quizzes, create flashcards, get summaries, and track their weak topics — all grounded in their own documents via RAG.

---

## Architecture

```
revizen/
├── Backend (FastAPI + Python 3.11)
│   ├── RAG pipeline: PyMuPDF → chunker → sentence-transformers → ChromaDB
│   ├── LLM: OpenRouter API (default: google/gemini-2.5-flash)
│   ├── Auth: JWT (python-jose) + bcrypt
│   └── Storage: SQLite (users) + ChromaDB (vectors) + JSON (insights)
└── Frontend (React 18 + Vite + Tailwind CSS)
    └── Deployed to Vercel
```

---

## Local Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- An OpenRouter API key (see below)

### Backend

```bash
# 1. Clone and enter the repo
cd revizen

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY

# 5. Start the backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.
Health check: `http://localhost:8000/health`
Interactive docs: `http://localhost:8000/docs`

### Frontend

```bash
# In a separate terminal
cd revizen/frontend

# 1. Install dependencies
npm install

# 2. Create environment file
echo "VITE_API_URL=http://localhost:8000" > .env.local

# 3. Start the dev server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## Environment Variables

### Backend (.env)

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENROUTER_API_KEY` | **YES** | — | Your OpenRouter API key |
| `LLM_MODEL` | No | `google/gemini-2.5-flash` | OpenRouter model ID |
| `LLM_MAX_TOKENS` | No | `2048` | Max tokens per LLM response |
| `EMBEDDING_MODEL` | No | `all-MiniLM-L6-v2` | Sentence-transformers model |
| `CHROMA_PATH` | No | `./chroma_db` | ChromaDB persistence directory |
| `CHUNK_SIZE` | No | `512` | Words per text chunk |
| `CHUNK_OVERLAP` | No | `64` | Overlap words between chunks |
| `TOP_K` | No | `5` | Number of chunks to retrieve |
| `DISTANCE_THRESHOLD` | No | `0.8` | Max cosine distance (hallucination guard) |
| `CHAT_HISTORY_TURNS` | No | `5` | Conversation turns to keep in context |
| `JWT_SECRET` | No | `revizen-secret-...` | **Change this in production!** |
| `JWT_EXPIRE_MINUTES` | No | `480` | JWT token lifetime (8 hours) |
| `DB_PATH` | No | `./revizen.db` | SQLite database file path |
| `INSIGHTS_PATH` | No | `./insights` | Directory for insights JSON files |
| `CORS_ORIGINS` | No | `http://localhost:5173,...` | Comma-separated allowed origins |

### Frontend (.env.local or Vercel)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | **YES** | Full URL of your backend (no trailing slash) |

---

## Getting an OpenRouter API Key

1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up and log in
3. Navigate to **Keys** in your dashboard
4. Click **Create Key** and copy the key
5. Add it to your `.env` as `OPENROUTER_API_KEY=sk-or-...`

The default model `google/gemini-2.5-flash` is very affordable. You can change `LLM_MODEL` to any model available on OpenRouter.

---

## Render Deployment (Backend)

The repo includes a `render.yaml` for one-click deployment.

### Option A: One-click via render.yaml

1. Fork this repo to your GitHub account
2. Go to [render.com](https://render.com) → **New** → **Blueprint**
3. Connect your GitHub repo
4. Render will detect `render.yaml` and configure the service
5. Set your secret env vars in the Render dashboard:
   - `OPENROUTER_API_KEY` — your API key
   - `JWT_SECRET` — a long random string (use a password generator)
   - `CORS_ORIGINS` — include your Vercel URL (add after deploying frontend)

### Option B: Manual

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Root Directory**: `revizen` (or leave blank if at root)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`
4. Add environment variables (see table above)
5. Deploy

> **Important Render paths**: The `render.yaml` sets persistent paths under `/opt/render/project/src/` for the database, ChromaDB, and insights. These survive deploys on Render's persistent disk.

---

## Vercel Deployment (Frontend)

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   - `VITE_API_URL` = your Render backend URL (e.g., `https://revizen-backend.onrender.com`)
5. Deploy

The `frontend/vercel.json` handles SPA routing so direct URL navigation works correctly.

After deploying:
- Copy your Vercel URL (e.g., `https://your-app.vercel.app`)
- Add it to your Render service's `CORS_ORIGINS` env var
- Redeploy the backend so the CORS change takes effect

---

## Troubleshooting

### CORS errors in the browser

**Symptom**: Requests fail with "CORS policy" errors in the console.

**Fix**: Ensure your Vercel frontend URL is in the `CORS_ORIGINS` environment variable on Render. It must be comma-separated with no trailing slashes:
```
CORS_ORIGINS=http://localhost:5173,https://your-app.vercel.app
```
After updating, redeploy the backend.

---

### PDF text not extracted

**Symptom**: Upload succeeds but "No text could be extracted" error, or 0 chunks indexed.

**Cause**: The PDF is a scanned image (bitmap) rather than a text-layer PDF. Revizen uses PyMuPDF's text layer extraction and does **not** perform OCR.

**Fix**: Use a PDF that was created digitally (exported from Word, Google Docs, LaTeX, etc.). If you only have a scanned PDF, run it through an OCR tool first (e.g., Adobe Acrobat, Google Docs, or `ocrmypdf`) to create a searchable PDF.

---

### ChromaDB errors on Render

**Symptom**: `500` errors mentioning ChromaDB, or data lost between deploys.

**Fix**:
1. Ensure `CHROMA_PATH` is set to `/opt/render/project/src/chroma_db` on Render
2. Ensure your Render service has a **Persistent Disk** attached (Render free tier has limited disk; paid tiers have persistent disks)
3. The directory must be writable by the app process

---

### 401 Unauthorized errors

**Symptom**: All API calls return 401 after changing environment variables.

**Fix**: The JWT `JWT_SECRET` must be the same between all deploys. If you regenerate it, all existing tokens become invalid and users must log in again. Store it securely and don't change it without reason.

---

### Slow first response on Render free tier

**Symptom**: First request after a period of inactivity takes 30–60 seconds.

**Cause**: Render free tier spins down inactive services. The first request wakes it up and also loads the sentence-transformers model (~90MB).

**Fix**: Upgrade to a paid Render tier, or use a cron service (e.g., cron-job.org) to ping `/health` every 10 minutes to keep it warm.

---

### "No relevant content found" for valid topics

**Symptom**: Quiz/Summary/Flashcard generation returns 404 even though you uploaded a document about that topic.

**Fix**:
1. Make sure you uploaded a document first (check the sidebar document list)
2. Try rephrasing the topic to match terminology in your document
3. Check that the document was successfully indexed (look for chunk count in the upload success toast)
4. Try lowering `DISTANCE_THRESHOLD` in env vars (default 0.8; try 0.9 for more permissive retrieval)

---

## Tech Stack

**Backend**: Python 3.11, FastAPI, sentence-transformers, ChromaDB, PyMuPDF, python-jose, passlib, aiosqlite, httpx

**Frontend**: React 18, Vite 5, Tailwind CSS v3, Framer Motion v11, lucide-react

**LLM**: OpenRouter API (model configurable, default: google/gemini-2.5-flash)

**Deployment**: Render (backend), Vercel (frontend)
