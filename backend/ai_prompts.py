"""AI prompt generation via OpenRouter (NVIDIA Nemotron 3 Super, free)."""
import os
import httpx
from typing import Optional

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
# OpenRouter free Nemotron variants. Order = preference.
NEMOTRON_MODELS = [
    "nvidia/nemotron-nano-9b-v2:free",
    "nvidia/llama-3.1-nemotron-ultra-253b-v1:free",
]


SYSTEM_PROMPT = (
    "You are a literary prompt generator for a competitive creative-writing game called "
    "Ivory Draft. Generate a single, evocative, original writing prompt in 1-2 sentences. "
    "Do NOT include any preamble, numbering, quotes, or commentary. Just the prompt itself."
)


async def generate_prompt(genre: str = "Fantasy", difficulty: str = "medium") -> Optional[str]:
    api_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if not api_key:
        return None
    user_msg = (
        f"Generate ONE original writing prompt in the {genre} genre "
        f"at {difficulty} difficulty. Keep it 1-2 sentences."
    )
    last_err: Optional[Exception] = None
    async with httpx.AsyncClient(timeout=30.0) as client:
        for model in NEMOTRON_MODELS:
            try:
                r = await client.post(
                    OPENROUTER_URL,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://ivory-draft.app",
                        "X-Title": "Ivory Draft",
                    },
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": user_msg},
                        ],
                        "max_tokens": 120,
                        "temperature": 0.95,
                    },
                )
                if r.status_code == 200:
                    data = r.json()
                    text = data["choices"][0]["message"]["content"].strip()
                    # Clean leading/trailing quotes
                    text = text.strip('"\'')
                    return text
                last_err = Exception(f"{model}: {r.status_code} {r.text[:200]}")
            except Exception as e:
                last_err = e
    if last_err:
        print(f"[ai_prompts] All models failed: {last_err}")
    return None
