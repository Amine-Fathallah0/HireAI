import asyncio
from typing import Optional, Dict, Any, List
import json
from app.services.llm import call_llm
from app.services.templates import (
    build_resume_writer_prompt,
    build_ats_prompt,
    build_industry_prompt,
)
from app.services.prometheus_metrics import LLM_LATENCY, LLM_CALLS
from app.utils.anonymize import anonymize
import time
import re


async def _call_agent(prompt: str, agent_name: str) -> Dict:
    # Wrap LLM call for agent; returns dict with keys: text, suggestions, confidence
    # call LLM and ensure returned shape
    resp = await call_llm(prompt=prompt, agent=agent_name)
    normalized = _normalize_llm_output(resp)
    agent_meta = {"raw": resp}
    normalized["meta"] = agent_meta
    return normalized


def _looks_like_json(s: str) -> bool:
    s = s.strip()
    return (s.startswith("{") and s.endswith("}")) or (s.startswith("[") and s.endswith("]"))


def _flatten_sections_to_text(sections: List[Dict[str, Any]]) -> str:
    parts: List[str] = []
    for sec in sections:
        title = sec.get("title") or sec.get("type") or ""
        text = sec.get("text") or ""
        title_line = title.upper().strip()
        if title_line:
            parts.append(title_line)
        if text:
            parts.append(str(text).strip())
        parts.append("")
    return "\n".join(p for p in parts).strip()


def _ensure_suggestions(x: Any) -> List[str]:
    if isinstance(x, list):
        items = [str(i).strip() for i in x if str(i).strip()]
    elif isinstance(x, str):
        # split by newlines or bullets
        items = [i.strip("-• \t") for i in re.split(r"[\n\r]+", x) if i.strip()]
    else:
        items = []
    # de-dup preserve order
    seen = set()
    uniq: List[str] = []
    for it in items:
        if it not in seen:
            seen.add(it)
            uniq.append(it)
    return uniq[:6]


def _normalize_llm_output(resp: Any) -> Dict[str, Any]:
    # Accepts dict or string, returns dict with text, suggestions, confidence
    text = ""
    suggestions: List[str] = []
    confidence = 0.0

    if isinstance(resp, dict):
        raw_text = resp.get("text", "")
        # If text itself looks like JSON, try to parse it
        if isinstance(raw_text, str) and _looks_like_json(raw_text):
            try:
                parsed_text = json.loads(raw_text)
                if isinstance(parsed_text, dict) and isinstance(parsed_text.get("sections"), list):
                    text = _flatten_sections_to_text(parsed_text["sections"]) or ""
                elif isinstance(parsed_text, dict) and "text" in parsed_text:
                    text = str(parsed_text.get("text") or "").strip()
                else:
                    text = str(raw_text)
            except Exception:
                text = str(raw_text)
        elif isinstance(raw_text, dict) and isinstance(raw_text.get("sections"), list):
            text = _flatten_sections_to_text(raw_text["sections"]) or ""
        else:
            text = str(raw_text or "").strip()

        suggestions = _ensure_suggestions(resp.get("suggestions"))
        try:
            c = float(resp.get("confidence", 0.0))
            confidence = max(0.0, min(1.0, c))
        except Exception:
            confidence = 0.0
    else:
        # plain string
        s = str(resp)
        if _looks_like_json(s):
            try:
                obj = json.loads(s)
                return _normalize_llm_output(obj)
            except Exception:
                pass
        text = s.strip()
        suggestions = []
        confidence = 0.0

    return {"text": text, "suggestions": suggestions, "confidence": confidence}


async def orchestrate_enhancement(text: str, section_type: str, context: Optional[dict] = None) -> dict:
    """
    Simple orchestration: call Resume Writer, ATS Optimizer, Industry Expert sequentially,
    then synthesize a final result.
    PII (emails, phones, URLs, names, addresses) is anonymized before LLM calls and NOT restored.
    """
    # Anonymize PII before sending to LLM
    anonymized_text, pii_mapping = anonymize(text)
    
    # Build prompts (in production use templates)
    writer_prompt = build_resume_writer_prompt(section_type, anonymized_text, context or {})
    ats_prompt = build_ats_prompt(section_type, anonymized_text, context or {})
    industry_prompt = build_industry_prompt(context.get('industry') if context else 'general', anonymized_text, context or {})

    # Call agents (these are async and may call external APIs)
    # Call resume writer
    start = time.time()
    try:
        with LLM_LATENCY.labels(agent="resume_writer").time():
            writer_out = await _call_agent(writer_prompt, agent_name="resume_writer")
        LLM_CALLS.labels(agent="resume_writer", status="success").inc()
    except Exception:
        LLM_CALLS.labels(agent="resume_writer", status="error").inc()
        writer_out = {"text": text, "suggestions": [], "confidence": 0.0}

    # Call ATS optimizer
    try:
        with LLM_LATENCY.labels(agent="ats_optimizer").time():
            ats_out = await _call_agent(ats_prompt, agent_name="ats_optimizer")
        LLM_CALLS.labels(agent="ats_optimizer", status="success").inc()
    except Exception:
        LLM_CALLS.labels(agent="ats_optimizer", status="error").inc()
        ats_out = {"text": writer_out.get("text", text), "suggestions": [], "confidence": 0.0}

    # Call industry expert
    try:
        with LLM_LATENCY.labels(agent="industry_expert").time():
            industry_out = await _call_agent(industry_prompt, agent_name="industry_expert")
        LLM_CALLS.labels(agent="industry_expert", status="success").inc()
    except Exception:
        LLM_CALLS.labels(agent="industry_expert", status="error").inc()
        industry_out = {"text": writer_out.get("text", text), "suggestions": [], "confidence": 0.0}

    # Synthesize: prefer writer_out text, then apply ATS and industry suggestions
    # Do NOT restore PII; keep placeholders
    final_text = (writer_out.get("text") or anonymized_text or text).strip()
    industry_sugg = industry_out.get("suggestions") or []
    ats_sugg = ats_out.get("suggestions") or []
    writer_sugg = writer_out.get("suggestions") or []

    # merge unique suggestions preserving order
    suggestions = []
    for s in (writer_sugg + ats_sugg + industry_sugg):
        if s and s not in suggestions:
            suggestions.append(s)

    # compute confidence as weighted average (writer more weight)
    w_writer, w_ats, w_ind = 0.5, 0.3, 0.2
    confs = [writer_out.get("confidence") or 0.0, ats_out.get("confidence") or 0.0, industry_out.get("confidence") or 0.0]
    confidence = (w_writer * confs[0] + w_ats * confs[1] + w_ind * confs[2])

    # return structured result including individual agent outputs and metadata
    return {
        "enhancedText": final_text,
        "suggestions": suggestions[:6],
        "confidence": round(confidence, 2),
        "agent_outputs": {
            "resume_writer": {
                "text": writer_out.get("text", ""),
                "suggestions": writer_out.get("suggestions", []),
                "confidence": writer_out.get("confidence", 0.0)
            },
            "ats_optimizer": {
                "text": ats_out.get("text", ""),
                "suggestions": ats_out.get("suggestions", []),
                "confidence": ats_out.get("confidence", 0.0)
            },
            "industry_expert": {
                "text": industry_out.get("text", ""),
                "suggestions": industry_out.get("suggestions", []),
                "confidence": industry_out.get("confidence", 0.0)
            }
        },
        "agent_metadata": {"writer": writer_out.get("meta"), "ats": ats_out.get("meta"), "industry": industry_out.get("meta")},
        "pii_protected": True,  # Flag indicating PII was anonymized during processing
    }
