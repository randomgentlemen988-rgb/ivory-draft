"""AI judging via OpenRouter with robust JSON extraction/fallback."""
import json
import os
from typing import Dict, Optional

import httpx

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
JUDGE_MODELS = [
    "nvidia/nemotron-nano-9b-v2:free",
    "meta-llama/llama-3.3-70b-instruct:free",
]

JUDGE_SYSTEM = (
    "You are an impartial writing judge. Score a submission with integer scores 1-10 for "
    "grammar, engagement, creativity, and accuracy. Return JSON only with keys: grammar, "
    "engagement, creativity, accuracy, feedback."
)


def _clamp_score(v) -> int:
    try:
        return max(1, min(10, int(round(float(v)))))
    except Exception:
        return 7


def _extract_first_json_object(text: str) -> Optional[Dict]:
    start = text.find("{")
    while start != -1:
        depth = 0
        for i in range(start, len(text)):
            ch = text[i]
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    snippet = text[start:i + 1]
                    try:
                        obj = json.loads(snippet)
                        if isinstance(obj, dict):
                            return obj
                    except Exception:
                        break
        start = text.find("{", start + 1)
    return None


def _safe_fallback(reason: str = "fallback used") -> Dict:
    return {
        "grammar": 7,
        "engagement": 7,
        "creativity": 7,
        "accuracy": 7,
        "feedback": f"AI parse failed; {reason}.",
        "_fallback": True,
    }


async def judge_submission(prompt_text: str, submission_text: str) -> Dict:
    api_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if not api_key:
        print("[ai_judging] AI parse failed/fallback used: OPENROUTER_API_KEY missing")
        return _safe_fallback("service unavailable")

    user_msg = (
        f"Prompt:\n{prompt_text}\n\nSubmission:\n{submission_text}\n\n"
        "Return scores now."
    )
    async with httpx.AsyncClient(timeout=45.0) as client:
        for model in JUDGE_MODELS:
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
                            {"role": "system", "content": JUDGE_SYSTEM},
                            {"role": "user", "content": user_msg},
                        ],
                        "temperature": 0.3,
                        "max_tokens": 800,
                    },
                )
                if r.status_code != 200:
                    continue
                data = r.json()
                choice = (data.get("choices") or [{}])[0]
                msg = choice.get("message") or {}
                raw = (msg.get("content") or "").strip()
                obj = _extract_first_json_object(raw)
                if not obj:
                    print("[ai_judging] AI parse failed/fallback used: no JSON object found")
                    return _safe_fallback("unable to parse model output")
                return {
                    "grammar": _clamp_score(obj.get("grammar")),
                    "engagement": _clamp_score(obj.get("engagement")),
                    "creativity": _clamp_score(obj.get("creativity")),
                    "accuracy": _clamp_score(obj.get("accuracy")),
                    "feedback": str(obj.get("feedback") or "AI feedback unavailable.").strip()[:500],
                    "_fallback": False,
                }
            except Exception as e:
                print(f"[ai_judging] model error: {model}: {e}")
                continue
    print("[ai_judging] AI parse failed/fallback used: all models failed")
    return _safe_fallback("all models failed")
