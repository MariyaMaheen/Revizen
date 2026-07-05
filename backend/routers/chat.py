import json
from typing import List, Optional
from fastapi import APIRouter, Depends, Request, Query, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services.auth import get_current_user
from services.embedder import embed_query
from services.vector_store import query_collection, get_chroma_client
from services.llm import stream_llm, call_llm, build_rag_messages, compute_confidence
from services.insights import update_on_query
from config import settings

router = APIRouter()


class ChatRequest(BaseModel):
    question: str
    history: Optional[List[dict]] = []


def _get_history(request: Request, user_id: int) -> List[dict]:
    hist = request.app.state.chat_history.get(user_id, [])
    return hist[-(settings.chat_history_turns * 2):]


def _update_history(request: Request, user_id: int, question: str, answer: str):
    hist = request.app.state.chat_history.setdefault(user_id, [])
    hist.append({"role": "user", "content": question})
    hist.append({"role": "assistant", "content": answer})
    # Keep only last N turns
    max_msgs = settings.chat_history_turns * 2
    request.app.state.chat_history[user_id] = hist[-max_msgs:]


def _build_context_and_sources(results: dict):
    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    if not docs:
        return "", [], []

    context_parts = []
    sources = []
    for doc, meta, dist in zip(docs, metas, distances):
        context_parts.append(doc)
        fname = meta.get("filename", "document")
        if fname not in sources:
            sources.append(fname)

    return "\n\n---\n\n".join(context_parts), sources, distances


@router.get("/chat/stream")
async def chat_stream(
    request: Request,
    question: str = Query(...),
    current_user=Depends(get_current_user),
):
    user_id = current_user["id"]
    embedder = request.app.state.embedder
    chroma_client = get_chroma_client(request)

    query_emb = embed_query(embedder, question)
    results = query_collection(chroma_client, user_id, query_emb, n_results=settings.top_k)

    context, sources, distances = _build_context_and_sources(results)

    # Hallucination guard
    if not distances or (distances and min(distances) > settings.distance_threshold):
        async def refusal_stream():
            msg = "I couldn't find that in your documents. Please upload relevant study materials first."
            data = json.dumps({"token": msg, "done": False})
            yield f"data: {data}\n\n"
            final = json.dumps({"done": True, "confidence": "low", "sources": []})
            yield f"data: {final}\n\n"

        update_on_query(user_id, question, "low", answered=False)
        return StreamingResponse(refusal_stream(), media_type="text/event-stream")

    confidence = compute_confidence(distances)
    history = _get_history(request, user_id)
    messages = build_rag_messages(context, question, history)

    async def event_stream():
        full_answer = []
        try:
            async for token in stream_llm(messages):
                full_answer.append(token)
                data = json.dumps({"token": token, "done": False})
                yield f"data: {data}\n\n"
        except Exception as e:
            err_data = json.dumps({"token": f"\n[Error: {str(e)}]", "done": False})
            yield f"data: {err_data}\n\n"

        answer = "".join(full_answer)
        _update_history(request, user_id, question, answer)
        update_on_query(user_id, question, confidence)

        final = json.dumps({"done": True, "confidence": confidence, "sources": sources})
        yield f"data: {final}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/chat")
async def chat_post(
    body: ChatRequest,
    request: Request,
    current_user=Depends(get_current_user),
):
    user_id = current_user["id"]
    embedder = request.app.state.embedder
    chroma_client = get_chroma_client(request)

    query_emb = embed_query(embedder, body.question)
    results = query_collection(chroma_client, user_id, query_emb, n_results=settings.top_k)

    context, sources, distances = _build_context_and_sources(results)

    if not distances or (distances and min(distances) > settings.distance_threshold):
        update_on_query(user_id, body.question, "low", answered=False)
        return {
            "answer": "I couldn't find that in your documents. Please upload relevant study materials first.",
            "confidence": "low",
            "sources": [],
            "question": body.question,
        }

    confidence = compute_confidence(distances)
    history = body.history or _get_history(request, user_id)
    messages = build_rag_messages(context, body.question, history)

    answer = await call_llm(messages)
    _update_history(request, user_id, body.question, answer)
    update_on_query(user_id, body.question, confidence)

    return {
        "answer": answer,
        "confidence": confidence,
        "sources": sources,
        "question": body.question,
    }
