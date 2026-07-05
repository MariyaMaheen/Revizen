import json
import re
from typing import List, Dict, Any

from services.llm import call_llm


def _strip_json_fences(text: str) -> str:
    text = re.sub(r"^```(?:json)?\s*", "", text.strip())
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


async def generate_quiz(context: str, topic: str, difficulty: str, count: int) -> Dict[str, Any]:
    difficulty_guide = {
        "easy": "simple factual recall questions",
        "medium": "application and comprehension questions",
        "hard": "analysis, synthesis, and evaluation questions",
    }.get(difficulty.lower(), "mixed difficulty questions")

    prompt = f"""Based on the following study material about "{topic}", generate exactly {count} multiple-choice quiz questions at {difficulty} level ({difficulty_guide}).

Return ONLY valid JSON in this exact format, no other text:
{{
  "questions": [
    {{
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Why this answer is correct"
    }}
  ]
}}

The "correct" field is the 0-based index of the correct option.

STUDY MATERIAL:
{context}"""

    messages = [
        {"role": "system", "content": "You are a quiz generator. Return ONLY valid JSON, no markdown, no preamble."},
        {"role": "user", "content": prompt},
    ]

    response = await call_llm(messages)
    cleaned = _strip_json_fences(response)
    return json.loads(cleaned)


async def generate_summary(context: str, topic: str, style: str) -> str:
    style_instructions = {
        "bullet": "as a clear bullet-point list using '•' characters. Each bullet should be a key fact or concept.",
        "paragraph": "as flowing paragraphs with good transitions. Write 2-4 paragraphs.",
        "concepts": "as a list of KEY CONCEPT: definition pairs. Format each as 'CONCEPT_NAME: brief definition'",
    }.get(style.lower(), "as bullet points")

    prompt = f"""Summarize the following study material about "{topic}" {style_instructions}

Be thorough but concise. Focus on the most important information.

STUDY MATERIAL:
{context}"""

    messages = [
        {"role": "system", "content": "You are a study summarizer. Create clear, educational summaries."},
        {"role": "user", "content": prompt},
    ]

    return await call_llm(messages)


async def generate_flashcards(context: str, topic: str, count: int) -> Dict[str, Any]:
    prompt = f"""Based on the following study material about "{topic}", create exactly {count} flashcards for studying.

Return ONLY valid JSON in this exact format, no other text:
{{
  "cards": [
    {{
      "front": "Question or concept to remember",
      "back": "Answer or explanation"
    }}
  ]
}}

Make the front side a question or prompt, and the back side a clear, concise answer.

STUDY MATERIAL:
{context}"""

    messages = [
        {"role": "system", "content": "You are a flashcard creator. Return ONLY valid JSON, no markdown, no preamble."},
        {"role": "user", "content": prompt},
    ]

    response = await call_llm(messages)
    cleaned = _strip_json_fences(response)
    return json.loads(cleaned)
