from datetime import datetime, timezone
import re
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request
from pydantic import BaseModel

from services.auth import get_current_user
from services.extractor import extract_pdf, extract_txt
from services.chunker import chunk_text
from services.embedder import embed_texts
from services.vector_store import upsert_chunks, get_chroma_client
from services.insights import add_document

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024


@router.post("/ingest")
async def ingest(
    request: Request,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    filename = file.filename or "upload"
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    if ext not in ("pdf", "txt"):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported")

    file_bytes = await file.read()

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB")

    pages_processed = 0
    try:
        if ext == "pdf":
            text, pages_processed = extract_pdf(file_bytes)
        else:
            text = extract_txt(file_bytes)
            pages_processed = 1
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to extract text: {str(e)}")

    if not text.strip():
        raise HTTPException(status_code=422, detail="No text could be extracted from this file")

    chunks = chunk_text(text)
    if not chunks:
        raise HTTPException(status_code=422, detail="No content chunks produced from this file")

    embedder = request.app.state.embedder
    embeddings = embed_texts(embedder, chunks)

    timestamp = datetime.now(timezone.utc).isoformat()
    metadatas = []
    ids = []
    for i, chunk in enumerate(chunks):
        meta = {"filename": filename, "chunk_index": i, "upload_timestamp": timestamp}
        if ext == "pdf":
            meta["pages_processed"] = pages_processed
        metadatas.append(meta)
        ids.append(f"{filename}_chunk_{i}")

    chroma_client = get_chroma_client(request)
    user_id = current_user["id"]
    upsert_chunks(chroma_client, user_id, chunks, embeddings, metadatas, ids)
    add_document(user_id, filename, len(chunks))

    return {"filename": filename, "chunks_indexed": len(chunks), "pages_processed": pages_processed}


class YouTubeRequest(BaseModel):
    url: str


def extract_video_id(url: str) -> str:
    patterns = [
        r'(?:v=|/)([0-9A-Za-z_-]{11})',
        r'(?:youtu\.be/)([0-9A-Za-z_-]{11})',
        r'(?:embed/)([0-9A-Za-z_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError("Invalid YouTube URL")


@router.post("/ingest/youtube")
async def ingest_youtube(
    body: YouTubeRequest,
    request: Request,
    current_user=Depends(get_current_user),
):
    try:
        video_id = extract_video_id(body.url)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        text = " ".join([t["text"] for t in transcript_list])
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Could not fetch transcript: {str(e)}. Make sure the video has captions enabled."
        )

    if not text.strip():
        raise HTTPException(status_code=422, detail="No transcript found for this video")

    filename = f"youtube_{video_id}.txt"
    chunks = chunk_text(text)
    if not chunks:
        raise HTTPException(status_code=422, detail="No content could be extracted from transcript")

    embedder = request.app.state.embedder
    embeddings = embed_texts(embedder, chunks)

    timestamp = datetime.now(timezone.utc).isoformat()
    metadatas = []
    ids = []
    for i, chunk in enumerate(chunks):
        metadatas.append({
            "filename": filename,
            "chunk_index": i,
            "upload_timestamp": timestamp,
            "source": body.url
        })
        ids.append(f"{filename}_chunk_{i}")

    chroma_client = get_chroma_client(request)
    user_id = current_user["id"]
    upsert_chunks(chroma_client, user_id, chunks, embeddings, metadatas, ids)
    add_document(user_id, filename, len(chunks))

    return {"filename": filename, "chunks_indexed": len(chunks), "video_id": video_id}
