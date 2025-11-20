import asyncio
from typing import Dict, Optional
import httpx
import json
import structlog
from app.core.config import settings
from app.services.provider_adapter import normalize_response
from app.services.prometheus_metrics import LLM_LATENCY, LLM_CALLS


async def call_llm(prompt: str, agent: str = "default") -> Dict:
    """Call Groq chat completions API for agent LLM inference.

    Uses agent-specific system prompts and returns structured output with text, suggestions, confidence.
    Falls back to a minimal response if no provider configured.
    """
    logger = structlog.get_logger()
    
    # If no Groq configured, fallback to stub
    if not settings.groq_api_key or not settings.groq_api_url:
        await asyncio.sleep(0.05)
        return {"text": prompt[:1000], "suggestions": [], "confidence": 0.5}

    # System prompts that emphasize returning plain text in the "text" field
    agent_prompts = {
        "resume_writer": "You are a resume writer. Improve resume text and return JSON with a 'text' field containing PLAIN TEXT (not JSON structure). Follow user instructions exactly.",
        "ats_optimizer": "You are an ATS specialist. Optimize resume text and return JSON with a 'text' field containing PLAIN TEXT (not JSON). Follow user instructions exactly.",
        "industry_expert": "You are an industry expert. Enhance resume text and return JSON with a 'text' field containing PLAIN TEXT (not JSON structure). Follow user instructions exactly.",
        "default": "You are a helpful AI assistant."
    }
    system_prompt = agent_prompts.get(agent, agent_prompts["default"])
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 1024
    }
    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json"
    }

    timeout = settings.llm_timeout_seconds
    retries = 3
    backoff = 0.5
    last_exc: Optional[Exception] = None

    async with httpx.AsyncClient(timeout=timeout) as client:
        for attempt in range(1, retries + 1):
            try:
                resp = await client.post(settings.groq_api_url, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
                
                # Extract from OpenAI-style response
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                
                # Try to parse JSON from content if LLM returned structured output
                import json
                import re
                
                # Remove markdown code blocks if present
                cleaned_content = re.sub(r'^```(?:json)?\s*\n?', '', content, flags=re.MULTILINE)
                cleaned_content = re.sub(r'\n?```\s*$', '', cleaned_content, flags=re.MULTILINE)
                
                try:
                    parsed = json.loads(cleaned_content.strip())
                    if isinstance(parsed, dict):
                        # Extract text field, which might itself be JSON or contain escape sequences
                        text_value = parsed.get("text", content)
                        
                        # Clean up the text value - remove leading/trailing whitespace and quotes
                        if isinstance(text_value, str):
                            text_value = text_value.strip()
                            
                            # Check if it's a JSON string (might have leading whitespace or escaped quotes)
                            # Look for patterns like: "  { or {\n
                            if '{' in text_value[:50]:  # Check first 50 chars for opening brace
                                try:
                                    # Try to extract JSON from the string
                                    # Remove leading whitespace and find the actual JSON
                                    json_start = text_value.find('{')
                                    if json_start >= 0:
                                        potential_json = text_value[json_start:].strip()
                                        nested = json.loads(potential_json)
                                        
                                        if isinstance(nested, dict) and "sections" in nested:
                                            # Flatten sections to plain text
                                            sections_text = []
                                            for sec in nested["sections"]:
                                                if sec.get("title"):
                                                    sections_text.append(sec["title"].upper())
                                                if sec.get("text"):
                                                    sections_text.append(sec["text"])
                                                sections_text.append("")  # blank line between sections
                                            text_value = "\n".join(sections_text).strip()
                                except (json.JSONDecodeError, ValueError):
                                    # Not valid JSON, keep as-is
                                    pass
                        
                        result = {
                            "text": text_value,
                            "suggestions": parsed.get("suggestions", []),
                            "confidence": float(parsed.get("confidence", 0.8)),
                            "raw": data
                        }
                    else:
                        result = {
                            "text": content,
                            "suggestions": [],
                            "confidence": 0.8,
                            "raw": data
                        }
                except (json.JSONDecodeError, ValueError):
                    # If not JSON, use raw content as text
                    result = {
                        "text": content,
                        "suggestions": [],
                        "confidence": 0.8,
                        "raw": data
                    }
                
                logger.info("llm.call.response", provider="groq", agent=agent, status=resp.status_code, attempt=attempt)
                return result

            except Exception as exc:
                last_exc = exc
                if attempt < retries:
                    await asyncio.sleep(backoff * attempt)
                    continue
                else:
                    logger.error("llm.call.failed", provider="groq", agent=agent, error=str(last_exc))
                    return {"text": prompt[:1000], "suggestions": [], "confidence": 0.0, "raw": None}

