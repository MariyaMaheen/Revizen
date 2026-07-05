from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.auth import get_current_user
from services.embedder import embed_query
from services.vector_store import query_collection, get_chroma_client
from services.study_features import generate_quiz
from services.insights import update_on_quiz
from config import settings

router = APIRouter()


class QuizRequest(BaseModel):
    topic: str
    difficulty: str = "medium"
    count: int = 5


@router.post("/quiz")
async def quiz(
    body: QuizRequest,
    request: Request,
    current_user=Depends(get_current_user),
):
    if body.count not in (3, 5, 10):
        body.count = 5

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
        quiz_data = await generate_quiz(context, body.topic, body.difficulty, body.count)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to generate quiz: {str(e)}")

    return {
        "questions": quiz_data.get("questions", []),
        "topic": body.topic,
        "difficulty": body.difficulty,
    }


class QuizScoreRequest(BaseModel):
    topic: str
    score: float
    correct: int
    total: int


@router.post("/quiz/score")
async def save_quiz_score(
    body: QuizScoreRequest,
    current_user=Depends(get_current_user),
):
    update_on_quiz(current_user["id"], body.topic, body.score, body.total, body.correct)
    return {"message": "Score saved"}
