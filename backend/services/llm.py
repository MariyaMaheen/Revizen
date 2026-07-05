import json
import asyncio
from typing import AsyncGenerator, List, Dict, Optional
import httpx

from config import settings

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

BASE_HEADERS = {
    "Content-Type": "application/json",
    "HTTP-Referer": "https://revizen.app",
    "X-Title": "Revizen",
}


def _build_headers() -> Dict:
    return {**BASE_HEADERS, "Authorization": f"Bearer {settings.openrouter_api_key}"}


def _build_body(messages: List[Dict], stream: bool = False) -> Dict:
    return {
        "model": settings.llm_model,
        "max_tokens": settings.llm_max_tokens,
        "stream": stream,
        "messages": messages,
    }


async def stream_llm(messages: List[Dict]) -> AsyncGenerator[str, None]:
    """Stream tokens from OpenRouter. Yields token strings."""
    body = _build_body(messages, stream=True)
    headers = _build_headers()

    retries = 0
    delays = [2, 4, 8]

    while True:
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", OPENROUTER_URL, json=body, headers=headers) as response:
                    if response.status_code == 429 and retries < len(delays):
                        await asyncio.sleep(delays[retries])
                        retries += 1
                        continue
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        data = line[6:]
                        if data.strip() == "[DONE]":
                            return
                        try:
                            chunk = json.loads(data)
                            delta = chunk["choices"][0].get("delta", {})
                            content = delta.get("content")
                            if content:
                                yield content
                        except (json.JSONDecodeError, KeyError, IndexError):
                            continue
            return
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429 and retries < len(delays):
                await asyncio.sleep(delays[retries])
                retries += 1
            else:
                raise


async def call_llm(messages: List[Dict]) -> str:
    """Non-streaming call. Returns full response text."""
    body = _build_body(messages, stream=False)
    headers = _build_headers()

    retries = 0
    delays = [2, 4, 8]

    while True:
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(OPENROUTER_URL, json=body, headers=headers)
                if response.status_code == 429 and retries < len(delays):
                    await asyncio.sleep(delays[retries])
                    retries += 1
                    continue
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429 and retries < len(delays):
                await asyncio.sleep(delays[retries])
                retries += 1
            else:
                raise


def build_rag_messages(context: str, question: str, history: List[Dict]) -> List[Dict]:
    system_prompt = f"""You are Revizen, an AI study assistant. You MUST answer ONLY using the context passages provided below. Do NOT use any outside knowledge.

RULES:
- If the answer is fully in the context: answer clearly and completely
- If partially: answer what you can, note what's missing
- If not in context at all: say "I couldn't find that in your documents."
- Do NOT mention filenames, chunk numbers, or metadata
- Be concise but complete. Use bullet points for lists.

CONTEXT:
{context}"""

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": question})
    return messages


def compute_confidence(distances: List[float]) -> str:
    if not distances:
        return "low"
    avg = sum(distances) / len(distances)
    if avg < 0.4:
        return "high"
    elif avg < 0.65:
        return "medium"
    return "low"
