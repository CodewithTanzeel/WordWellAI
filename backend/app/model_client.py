# app/model_client.py
"""
model_client.py
===============
Wraps the remote inference endpoint (LM Studio / HuggingFace Space) and
provides a rich local heuristic fallback for offline / dev use.

Set the environment variable MODEL_URL to the base URL of your LM Studio
server, e.g.:
    MODEL_URL=http://localhost:1234

The client will call  POST <MODEL_URL>/v1/chat/completions  (OpenAI-compatible
endpoint that LM Studio exposes out of the box).

If MODEL_URL is not set the local heuristic runs instead.
"""

from __future__ import annotations

import os
import re
from typing import Literal

import httpx

# ---------------------------------------------------------------------------
# Remote endpoint configuration
# ---------------------------------------------------------------------------
MODEL_URL: str = os.environ.get("MODEL_URL", "")  # e.g. http://localhost:1234
# Set to empty by default — base model doesn't follow JSON instructions well
# To enable, set HF_SPACE_URL environment variable
HF_SPACE_URL: str = os.environ.get("HF_SPACE_URL", "")  
HF_TOKEN: str = os.environ.get("HF_TOKEN", "")

_SYSTEM_PROMPT = """You are a mental-health signal detector.
Analyse the user's journal entry and respond with ONLY a JSON object on one line:
{"label": "<label>", "confidence": <float 0-1>}

Valid labels (pick the single best fit):
  low_stress_signals      – clearly positive, settled, content
  mild_stress_signals     – mild worry, tiredness, or low mood; not alarming
  mixed_signals           – genuine mix of positive and distress cues
  neutral                 – no clear emotional signal
  elevated_stress_signals – clear distress, anxiety, burnout, or persistent low mood

Be conservative: prefer mild_stress_signals or mixed_signals over elevated when uncertain.
Never output anything other than the JSON object."""


def _call_hf_space(text: str) -> dict | None:
    """Try the Hugging Face Space via gradio-client. Returns None on any failure."""
    if not HF_SPACE_URL:
        return None
    try:
        from gradio_client import Client
        
        client = None
        # Try multiple constructor signatures for compatibility
        for kwargs in (
            {"hf_token": HF_TOKEN} if HF_TOKEN else {},
            {"api_key": HF_TOKEN} if HF_TOKEN else {},
            {},
        ):
            try:
                client = Client(HF_SPACE_URL, **kwargs)
                break
            except TypeError:
                continue
        
        if client is None:
            return None
        
        # Try multiple function names with explicit api_name
        result = None
        for api_name in ("/generate_response", "/generate"):
            try:
                result = client.predict(
                    prompt=text,
                    max_new_tokens=128,
                    temperature=0.1,  # Lower temp for more deterministic classification
                    api_name=api_name,
                )
                break
            except Exception:
                continue
        
        if not result:
            # Fallback: call without explicit api_name
            result = client.predict(
                prompt=text,
                max_new_tokens=128,
                temperature=0.1,
            )
        
        # Parse JSON response from model
        if isinstance(result, str):
            import json
            # Clean up markdown code fences if present
            clean_result = re.sub(r"```[a-z]*\n?", "", result).strip().rstrip("`").strip()
            data = json.loads(clean_result)
            label = str(data.get("label", "neutral"))
            confidence = float(data.get("confidence", 0.6))
            confidence = max(0.0, min(1.0, confidence))
            return {"label": label, "confidence": round(confidence, 2)}
    except Exception:
        return None


def _call_lm_studio(text: str) -> dict | None:
    """Try the OpenAI-compatible chat endpoint.  Returns None on any failure."""
    if not MODEL_URL:
        return None
    try:
        response = httpx.post(
            f"{MODEL_URL}/v1/chat/completions",
            json={
                "messages": [
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {"role": "user", "content": text},
                ],
                "temperature": 0.1,
                "max_tokens": 60,
            },
            timeout=15.0,
        )
        payload = response.json()
        raw = payload["choices"][0]["message"]["content"].strip()
        # Strip markdown fences if the model wraps in ```json … ```
        raw = re.sub(r"```[a-z]*\n?", "", raw).strip().rstrip("`").strip()
        import json
        data = json.loads(raw)
        label = str(data.get("label", "neutral"))
        confidence = float(data.get("confidence", 0.6))
        confidence = max(0.0, min(1.0, confidence))
        return {"label": label, "confidence": round(confidence, 2)}
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Local heuristic – phrase patterns
# ---------------------------------------------------------------------------

# Each entry: (pattern_string, valence, base_score)
#   valence  = "stress" | "positive" | "grey"
#   base_score = raw contribution weight (1.0 = normal keyword, 2.0 = strong phrase)
#
# Phrases are matched before single-word keywords so they take priority.
_PHRASE_PATTERNS: list[tuple[str, str, float]] = [
    # ── High-confidence STRESS phrases ──────────────────────────────────────
    (r"\bcan'?t\s+sleep\b",                     "stress", 2.0),
    (r"\bcan'?t\s+focus\b",                     "stress", 1.8),
    (r"\bcan'?t\s+stop\s+(crying|thinking)\b",  "stress", 2.2),
    (r"\blost\s+(all\s+)?interest\b",            "stress", 2.0),
    (r"\blost\s+motivation\b",                   "stress", 1.8),
    (r"\bfeel(ing)?\s+empty\b",                  "stress", 2.0),
    (r"\bfeel(ing)?\s+numb\b",                   "stress", 2.0),
    (r"\bfeel(ing)?\s+stuck\b",                  "stress", 1.6),
    (r"\bfeel(ing)?\s+hopeless\b",               "stress", 2.2),
    (r"\bfeel(ing)?\s+worthless\b",              "stress", 2.2),
    (r"\bfeel(ing)?\s+like\s+a\s+burden\b",      "stress", 2.4),
    (r"\bfeel(ing)?\s+invisible\b",              "stress", 1.8),
    (r"\bdon'?t\s+(want|see)\s+the\s+point\b",  "stress", 2.4),
    (r"\bno\s+(energy|motivation|point)\b",      "stress", 1.8),
    (r"\bpanic\s+attack\b",                      "stress", 2.4),
    (r"\bburned?\s+out\b",                       "stress", 2.0),
    (r"\bbreaking\s+down\b",                     "stress", 2.2),
    (r"\bfall(ing)?\s+apart\b",                  "stress", 2.2),
    (r"\bhard\s+to\s+(breathe|get\s+up|focus)\b","stress", 1.8),
    (r"\beverything\s+(feels?\s+)?too\s+much\b", "stress", 2.0),
    (r"\bcan'?t\s+(cope|handle)\b",              "stress", 2.0),
    (r"\bso\s+tired\s+of\b",                     "stress", 1.8),
    (r"\ball\s+(the\s+)?time\s+(anxious|sad|worried)\b", "stress", 2.0),
    (r"\bcrying\s+(for\s+no\s+reason|a\s+lot|all\s+the\s+time)\b", "stress", 2.2),
    (r"\bnot\s+eating\b",                        "stress", 1.8),
    (r"\bnot\s+sleeping\b",                      "stress", 1.8),
    (r"\boverwhelmed\s+by\b",                    "stress", 1.8),
    # ── High-confidence POSITIVE phrases ────────────────────────────────────
    (r"\bfeeling\s+(really\s+)?good\b",          "positive", 1.8),
    (r"\bhad\s+a\s+(great|wonderful|amazing)\b", "positive", 1.8),
    (r"\blooking\s+forward\s+to\b",              "positive", 1.6),
    (r"\bso\s+(happy|grateful|excited|proud)\b", "positive", 2.0),
    (r"\bfeel(ing)?\s+at\s+peace\b",             "positive", 1.8),
    (r"\bfeel(ing)?\s+loved\b",                  "positive", 1.8),
    (r"\bfeel(ing)?\s+motivated\b",              "positive", 1.6),
    (r"\bfeel(ing)?\s+confident\b",              "positive", 1.6),
    (r"\blife\s+is\s+(good|great|wonderful)\b",  "positive", 2.0),
    (r"\bthings?\s+(are\s+)?coming\s+together\b","positive", 1.8),
    (r"\bcan'?t\s+wait\b",                       "positive", 1.4),
    (r"\breally\s+enjoyed\b",                    "positive", 1.6),
    (r"\btruly\s+(happy|grateful|blessed)\b",    "positive", 2.0),
    # ── GREY-AREA phrases (low confidence, ambiguous) ───────────────────────
    (r"\bi'?m\s+(fine|okay|ok|alright)\b",       "grey", 1.0),
    (r"\bcould\s+be\s+worse\b",                  "grey", 1.0),
    (r"\bjust\s+tired\b",                        "grey", 1.0),
    (r"\bnot\s+(great|good)\b",                  "grey", 1.2),
    (r"\bkind\s+of\s+(okay|stressed|sad)\b",     "grey", 1.0),
    (r"\bsort\s+of\b",                           "grey", 0.8),
    (r"\bi\s+guess\s+(i'?m|so|okay)\b",          "grey", 1.0),
    (r"\bgetting\s+by\b",                        "grey", 1.0),
    (r"\bjust\s+managing\b",                     "grey", 1.0),
    (r"\bsurviving\b",                           "grey", 1.2),
    (r"\bnot\s+sure\s+how\s+i\s+feel\b",         "grey", 1.0),
    (r"\bdon'?t\s+know\s+how\s+to\s+feel\b",     "grey", 1.0),
    (r"\bits?\s+complicated\b",                  "grey", 0.8),
    (r"\bmixed\s+feelings\b",                    "grey", 1.2),
]

# Single-word keyword tables: {word: (valence, score)}
_STRESS_KEYWORDS: dict[str, float] = {
    "anxious": 1.4, "anxiety": 1.4, "stressed": 1.4, "stress": 1.2,
    "overwhelmed": 1.6, "panic": 1.6, "panicking": 1.6,
    "worried": 1.2, "worry": 1.2, "worrying": 1.2,
    "nervous": 1.0, "dread": 1.4, "tense": 1.0, "pressure": 1.0,
    "exhausted": 1.4, "burnout": 1.8, "depressed": 1.6, "depression": 1.6,
    "hopeless": 2.0, "helpless": 1.8, "numb": 1.6,
    "scared": 1.2, "fear": 1.2, "fearful": 1.2,
    "angry": 1.0, "anger": 1.0, "furious": 1.4,
    "frustrated": 1.2, "frustration": 1.2,
    "sad": 1.2, "sadness": 1.2, "grief": 1.6, "grieving": 1.6,
    "lonely": 1.4, "loneliness": 1.4, "isolated": 1.4, "alone": 0.8,
    "tired": 0.8, "fatigue": 1.2, "drained": 1.4,
    "crying": 1.2, "cry": 1.0,
    "irritable": 1.2, "irritated": 1.2,
    "miserable": 1.6, "awful": 1.4, "terrible": 1.4, "horrible": 1.4,
    "worthless": 2.0, "useless": 1.6, "failure": 1.4,
    "unmotivated": 1.4, "withdrawn": 1.4, "disconnected": 1.4,
    "restless": 1.0, "agitated": 1.2,
}

_POSITIVE_KEYWORDS: dict[str, float] = {
    "happy": 1.4, "happiness": 1.4, "joy": 1.4, "joyful": 1.4,
    "excited": 1.4, "excitement": 1.4,
    "grateful": 1.4, "gratitude": 1.4, "thankful": 1.2,
    "content": 1.2, "contentment": 1.2,
    "peaceful": 1.4, "peace": 1.2, "calm": 1.0, "calmer": 1.0,
    "relaxed": 1.2, "relaxing": 1.0,
    "good": 0.8, "great": 1.0, "wonderful": 1.4,
    "amazing": 1.4, "fantastic": 1.4, "excellent": 1.2,
    "love": 1.0, "loved": 1.4, "loving": 1.0,
    "hopeful": 1.4, "hope": 1.2,
    "motivated": 1.4, "energized": 1.4, "energetic": 1.2,
    "confident": 1.4, "confidence": 1.2,
    "proud": 1.4, "pride": 1.2,
    "cheerful": 1.4, "delighted": 1.4, "pleased": 1.0,
    "blessed": 1.2, "fulfilled": 1.4, "thriving": 1.6,
    "positive": 0.8, "optimistic": 1.2,
    "refreshed": 1.2, "rested": 1.0, "recovered": 1.2,
}

# Negation words that flip the valence of the next 1–3 tokens
_NEGATIONS = re.compile(
    r"\b(not|no|never|don'?t|doesn'?t|didn'?t|won'?t|can'?t|cannot|"
    r"hardly|barely|neither|nor)\b"
)

# Intensifiers (multiply score by this factor)
_INTENSIFIERS: dict[str, float] = {
    "very": 1.5, "extremely": 1.8, "incredibly": 1.8, "terribly": 1.6,
    "absolutely": 1.6, "so": 1.3, "really": 1.4, "deeply": 1.5,
    "profoundly": 1.6, "utterly": 1.7, "completely": 1.6, "totally": 1.4,
    "genuinely": 1.3, "truly": 1.4, "awfully": 1.4,
}

# Diminishers (multiply score by this factor)
_DIMINISHERS: dict[str, float] = {
    "little": 0.5, "bit": 0.5, "slightly": 0.5, "somewhat": 0.6,
    "kind": 0.6, "sort": 0.6, "mildly": 0.5, "barely": 0.4,
    "almost": 0.6, "quite": 0.7, "rather": 0.7, "fairly": 0.7,
    "a bit": 0.5, "a little": 0.5,
}


def _negation_window(tokens: list[str], idx: int, window: int = 3) -> bool:
    """Return True if a negation word appears within `window` tokens before idx."""
    start = max(0, idx - window)
    for i in range(start, idx):
        if _NEGATIONS.match(tokens[i]):
            return True
    return False


def _modifier_at(tokens: list[str], idx: int) -> float:
    """
    Look at the 1–2 tokens before idx for an intensifier or diminisher.
    Returns a multiplier (default 1.0).
    """
    multiplier = 1.0
    for look_back in (1, 2):
        i = idx - look_back
        if i < 0:
            break
        word = tokens[i]
        if word in _INTENSIFIERS:
            multiplier *= _INTENSIFIERS[word]
        elif word in _DIMINISHERS:
            multiplier *= _DIMINISHERS[word]
    return multiplier


def _local_heuristic(text: str) -> dict:  # noqa: C901 – intentionally thorough
    """
    Multi-stage heuristic that handles:
    • Phrase-level patterns (higher precision than single words)
    • Negation ("not anxious" should not count as stress)
    • Intensifiers / diminishers ("very stressed" vs "a little stressed")
    • Grey-area language ("I'm fine", "could be worse")
    • Mixed signals (positive + stress present together)
    • Confidence calibration (short texts, heavy hedging → lower confidence)
    """
    lower = text.lower()
    tokens = lower.split()

    stress_score: float = 0.0
    positive_score: float = 0.0
    grey_score: float = 0.0
    phrase_matched_spans: list[tuple[int, int]] = []

    # ── Stage 1: phrase patterns ─────────────────────────────────────────────
    for pattern, valence, base in _PHRASE_PATTERNS:
        for m in re.finditer(pattern, lower):
            phrase_matched_spans.append((m.start(), m.end()))
            # Check if a negation immediately precedes the phrase (≤4 chars gap)
            preceding = lower[max(0, m.start() - 20): m.start()]
            negated = bool(_NEGATIONS.search(preceding))
            effective = base * (0.0 if negated else 1.0)
            if valence == "stress":
                stress_score += effective
            elif valence == "positive":
                positive_score += effective
            else:  # grey
                grey_score += effective

    # ── Stage 2: individual keywords (skip chars covered by phrases) ─────────
    for i, token in enumerate(tokens):
        # Rough position in string – good enough for span exclusion
        char_pos = lower.find(token, sum(len(t) + 1 for t in tokens[:i]))

        # Skip if this token is inside an already-matched phrase
        in_phrase = any(s <= char_pos < e for s, e in phrase_matched_spans)
        if in_phrase:
            continue

        negated = _negation_window(tokens, i)
        modifier = _modifier_at(tokens, i)

        if token in _STRESS_KEYWORDS:
            weight = _STRESS_KEYWORDS[token] * modifier
            stress_score += 0.0 if negated else weight
            if negated:
                positive_score += weight * 0.3  # "not stressed" adds a little positive

        elif token in _POSITIVE_KEYWORDS:
            weight = _POSITIVE_KEYWORDS[token] * modifier
            positive_score += 0.0 if negated else weight
            if negated:
                stress_score += weight * 0.3  # "not happy" adds a little stress

    # ── Stage 3: text-level signals ──────────────────────────────────────────
    word_count = max(len(tokens), 1)

    # Very short texts → lower confidence overall
    length_factor = min(1.0, word_count / 15)

    # Heavy hedging language lowers confidence
    hedge_words = sum(1 for w in ["maybe", "perhaps", "probably", "might",
                                   "guess", "suppose", "seem", "think", "feel like"]
                      if w in lower)
    hedge_penalty = 1.0 - min(0.25, hedge_words * 0.08)

    # ── Stage 4: classify ────────────────────────────────────────────────────
    total = stress_score + positive_score + grey_score

    if total < 0.4:
        # Almost no signal at all
        raw_conf = 0.55 * length_factor
        return {"label": "neutral", "confidence": round(max(0.5, raw_conf), 2)}

    # Dominance ratios
    stress_ratio   = stress_score  / total
    positive_ratio = positive_score / total
    grey_ratio     = grey_score    / total

    # Significant grey area → ambiguous/grey result
    if grey_ratio > 0.5 and total < 2.5:
        raw_conf = (0.50 + grey_score * 0.05) * length_factor * hedge_penalty
        return {"label": "neutral", "confidence": round(min(max(raw_conf, 0.48), 0.70), 2)}

    # Both stress and positive are meaningfully present → mixed signals
    if stress_score >= 1.0 and positive_score >= 1.0:
        stronger_ratio = max(stress_ratio, positive_ratio)
        raw_conf = (0.50 + stronger_ratio * 0.20) * length_factor * hedge_penalty
        return {"label": "mixed_signals", "confidence": round(min(raw_conf, 0.80), 2)}

    # Clear positive dominance
    if positive_ratio > 0.6:
        raw_conf = (0.55 + positive_score * 0.07) * length_factor * hedge_penalty
        return {"label": "low_stress_signals", "confidence": round(min(raw_conf, 0.95), 2)}

    # Clear stress dominance
    if stress_ratio > 0.6:
        # Mild vs elevated threshold
        if stress_score < 2.0:
            raw_conf = (0.52 + stress_score * 0.06) * length_factor * hedge_penalty
            return {"label": "mild_stress_signals", "confidence": round(min(raw_conf, 0.82), 2)}
        else:
            raw_conf = (0.58 + stress_score * 0.05) * length_factor * hedge_penalty
            return {"label": "elevated_stress_signals", "confidence": round(min(raw_conf, 0.95), 2)}

    # Remaining grey/balanced cases
    raw_conf = (0.50 + total * 0.03) * length_factor * hedge_penalty
    return {"label": "neutral", "confidence": round(min(max(raw_conf, 0.48), 0.72), 2)}


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def call_model(text: str) -> dict:
    """Analyse text and return ``{"label": str, "confidence": float}``.

    Call order:
    1. Hugging Face Space (via gradio-client) if ``HF_SPACE_URL`` is set.
    2. LM Studio (or any OpenAI-compatible endpoint) if ``MODEL_URL`` is set.
    3. Local heuristic as fallback.
    """
    result = _call_hf_space(text)
    if result is not None:
        return result
    result = _call_lm_studio(text)
    if result is not None:
        return result
    return _local_heuristic(text)