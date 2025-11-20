from typing import Any, Dict


def normalize_response(provider: str, resp: Any) -> Dict:
    """Normalize various provider response shapes into a canonical dict.

    Returns: {text: str, suggestions: list[str], confidence: float, raw: Any}
    """
    # default fallback
    out = {"text": "", "suggestions": [], "confidence": 0.0, "raw": resp}

    if resp is None:
        return out

    # If provider already returns dict with expected keys
    if isinstance(resp, dict):
        # common keys
        text = resp.get("text") or resp.get("output") or resp.get("result")
        # some providers return choices: [{text:...}]
        if text is None and resp.get("choices"):
            try:
                text = resp["choices"][0].get("text")
            except Exception:
                text = None

        suggestions = resp.get("suggestions") or resp.get("advice") or resp.get("hints") or []
        # numeric confidence may appear in different keys
        confidence = resp.get("confidence") or resp.get("score") or resp.get("probability") or 0.0
        try:
            confidence = float(confidence)
        except Exception:
            confidence = 0.0

        out.update({"text": text or "", "suggestions": suggestions, "confidence": confidence, "raw": resp})
        return out

    # If provider returned a string/plain text
    if isinstance(resp, str):
        out["text"] = resp
        return out

    # For other types, stringify
    out["text"] = str(resp)
    return out
