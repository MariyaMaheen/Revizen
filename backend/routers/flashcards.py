from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel

from services.auth import get_current_user
from services.embedder import embed_query
from services.vector_store import query_collection, get_chroma_client
from services.study_features import generate_flashcards
from config import settings

router = APIRouter()


class FlashcardRequest(BaseModel):
    topic: str
    count: int = 10


@router.post("/flashcards")
async def flashcards(
    body: FlashcardRequest,
    request: Request,
    current_user=Depends(get_current_user),
):
    if body.count not in (5, 10, 15):
        body.count = 10

    embedder = request.app.state.embedder
    chroma_client = get_chroma_client(request)
    user_id = current_user["id"]

    query_emb = embed_query(embedder, body.topic)
    results = query_collection(chroma_client, user_id, query_emb, n_results=settings.top_k * 2)

    docs = results.get("documents", [[]])[0]

    if not docs:
        raise HTTPException(status_code=404, detail="No relevant content found for this topic")

    context = "\n\n".join(docs[:10])

    try:
        card_data = await generate_flashcards(context, body.topic, body.count)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to generate flashcards: {str(e)}")

    return {
        "cards": card_data.get("cards", []),
        "topic": body.topic,
        "count": len(card_data.get("cards", [])),
    }
