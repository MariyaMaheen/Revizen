from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    os.makedirs(settings.insights_path, exist_ok=True)
    os.makedirs(settings.chroma_path, exist_ok=True)

    from services.embedder import get_model
    get_model()
    app.state.embedder = None

    import chromadb
    app.state.chroma_client = chromadb.PersistentClient(path=settings.chroma_path)
    app.state.chat_history = {}

    yield


app = FastAPI(title="Revizen API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://5173-i0h5tiiyv6lcsgh4ugn8g-5b262517.sg1.manus.computer", "http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import auth, chat, ingest, quiz, summarize, flashcards, documents, insights

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(chat.router, prefix="/api/v1", tags=["chat"])
app.include_router(ingest.router, prefix="/api/v1", tags=["ingest"])
app.include_router(quiz.router, prefix="/api/v1", tags=["quiz"])
app.include_router(summarize.router, prefix="/api/v1", tags=["summarize"])
app.include_router(flashcards.router, prefix="/api/v1", tags=["flashcards"])
app.include_router(documents.router, prefix="/api/v1", tags=["documents"])
app.include_router(insights.router, prefix="/api/v1", tags=["insights"])


@app.get("/health")
async def health():
    return {"status": "ok"}#cors fix 


