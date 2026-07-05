import json
import os
import re
from datetime import datetime, timezone, date
from typing import Dict, Any, List

from config import settings

STOPWORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "used", "i", "you", "he", "she", "it", "we", "they", "what", "which",
    "who", "whom", "whose", "this", "that", "these", "those", "am", "of",
    "in", "on", "at", "by", "for", "with", "about", "against", "between",
    "into", "through", "during", "before", "after", "above", "below", "to",
    "from", "up", "down", "out", "off", "over", "under", "again", "further",
    "then", "once", "and", "or", "but", "if", "when", "where", "how",
    "me", "my", "your", "his", "her", "its", "our", "their", "them",
}


def _get_path(user_id: int) -> str:
    return os.path.join(settings.insights_path, f"session_{user_id}.json")


def _default_state(user_id: int) -> Dict:
    return {
        "user_id": user_id,
        "streak": 0,
        "last_study_date": None,
        "total_questions": 0,
        "topics": {},
        "quiz_scores": [],
        "quiz_history": [],
        "low_confidence_questions": [],
        "unanswered_count": 0,
        "documents": [],
    }


def load_insights(user_id: int) -> Dict:
    path = _get_path(user_id)
    if not os.path.exists(path):
        return _default_state(user_id)
    try:
        with open(path, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return _default_state(user_id)


def save_insights(user_id: int, data: Dict):
    os.makedirs(settings.insights_path, exist_ok=True)
    path = _get_path(user_id)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def extract_topic(question: str) -> str:
    words = re.findall(r"\b[a-zA-Z]{3,}\b", question.lower())
    keywords = [w for w in words if w not in STOPWORDS]
    return " ".join(keywords[:2]) if keywords else "general"


def update_on_query(user_id: int, question: str, confidence: str, answered: bool = True):
    data = load_insights(user_id)
    today = date.today().isoformat()

    # Streak
    last = data.get("last_study_date")
    if last == today:
        pass
    elif last and (date.fromisoformat(today) - date.fromisoformat(last)).days == 1:
        data["streak"] = data.get("streak", 0) + 1
    else:
        data["streak"] = 1
    data["last_study_date"] = today

    data["total_questions"] = data.get("total_questions", 0) + 1
    if not answered:
        data["unanswered_count"] = data.get("unanswered_count", 0) + 1

    topic = extract_topic(question)
    topics = data.setdefault("topics", {})
    if topic not in topics:
        topics[topic] = {"count": 0, "low_confidence": 0}
    topics[topic]["count"] += 1
    if confidence == "low":
        topics[topic]["low_confidence"] += 1

    save_insights(user_id, data)


def update_on_quiz(user_id: int, topic: str, score: float, total: int, correct: int):
    data = load_insights(user_id)
    today = date.today().isoformat()

    data.setdefault("quiz_scores", []).append(score)
    data.setdefault("quiz_history", []).append({
        "date": today,
        "topic": topic,
        "score": score,
        "correct": correct,
        "total": total,
    })

    save_insights(user_id, data)


def add_document(user_id: int, filename: str, chunks: int):
    data = load_insights(user_id)
    docs = data.setdefault("documents", [])
    # Update or add
    for doc in docs:
        if doc["filename"] == filename:
            doc["chunks"] = chunks
            doc["upload_date"] = date.today().isoformat()
            save_insights(user_id, data)
            return
    docs.append({
        "filename": filename,
        "chunks": chunks,
        "upload_date": date.today().isoformat(),
        "queries": 0,
    })
    save_insights(user_id, data)


def remove_document(user_id: int, filename: str):
    data = load_insights(user_id)
    data["documents"] = [d for d in data.get("documents", []) if d["filename"] != filename]
    save_insights(user_id, data)


def get_insights(user_id: int) -> Dict:
    data = load_insights(user_id)

    topics = data.get("topics", {})
    sorted_topics = sorted(topics.items(), key=lambda x: x[1]["count"], reverse=True)
    top_topics = [{"topic": k, "count": v["count"]} for k, v in sorted_topics[:8]]

    weak_topics = []
    for topic, info in topics.items():
        count = info["count"]
        low = info["low_confidence"]
        if count > 0 and (low / count) > 0.4:
            weak_topics.append({"topic": topic, "low_confidence_count": low, "total": count})

    suggested_review = [{"topic": w["topic"], "reason": "Frequently low confidence answers"} for w in weak_topics[:3]]

    quiz_scores = data.get("quiz_scores", [])
    avg_quiz_score = round(sum(quiz_scores) / len(quiz_scores), 1) if quiz_scores else 0

    return {
        "streak": data.get("streak", 0),
        "total_questions": data.get("total_questions", 0),
        "quizzes_taken": len(data.get("quiz_history", [])),
        "avg_quiz_score": avg_quiz_score,
        "top_topics": top_topics,
        "weak_topics": weak_topics,
        "suggested_review": suggested_review,
        "quiz_history": data.get("quiz_history", [])[-10:],
        "documents": data.get("documents", []),
        "unanswered_count": data.get("unanswered_count", 0),
    }
