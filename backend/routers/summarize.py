from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel

from services.auth import get_current_user
from services.embedder import embed_query
from services.vector_store import query_collection, get_chroma_client
from services.study_features import generate_summary
from config import settings

router = APIRouter()


class SummarizeRequest(BaseModel):
    topic: str
    style: str = "bullet"


@router.post("/summarize")
async def summarize(
    body: SummarizeRequest,
    request: Request,
    current_user=Depends(get_current_user),
):
    if body.style not in ("bullet", "paragraph", "concepts"):
        body.style = "bullet"

    embedder = request.app.state.embedder
    chroma_client = get_chroma_client(request)
    user_id = current_user["id"]

    query_emb = embed_query(embedder, body.topic)
    results = query_collection(chroma_client, user_id, query_emb, n_results=settings.top_k * 2)

    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]

    if not docs:
        raise HTTPException(status_code=404, detail="No relevant content found for this topic")

    context = "\n\n".join(docs[:10])
    sources = list({m.get("filename", "document") for m in metas})

    try:
        summary = await generate_summary(context, body.topic, body.style)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to generate summary: {str(e)}")

    return {
        "summary": summary,
        "style": body.style,
        "topic": body.topic,
        "sources": sources,
    }
