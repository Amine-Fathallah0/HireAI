import re
from typing import Tuple, Dict

EMAIL_RE = re.compile(r"\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,6}\b")
PHONE_RE = re.compile(r"\b(?:\+\d{1,3}[\s-]?)?(?:\(\d{2,4}\)[\s-]?)?\d{3,4}[\s-]?\d{3,4}\b")
URL_RE = re.compile(r"https?://\S+|www\.\S+")
# Naive address: number + words + common street tokens
ADDRESS_RE = re.compile(r"\b\d+\s+[^\n,]+\b(?:street|st\.|avenue|ave\.|road|rd\.|boulevard|blvd\.|lane|ln\.|drive|dr\.)\b", re.IGNORECASE)
# Naive name: Firstname Lastname (both capitalized, >=2 letters)
NAME_RE = re.compile(r"\b([A-Z][a-z]{1,}\s+[A-Z][a-z]{1,})(?:\s+[A-Z][a-z]{1,})?\b")


def anonymize(text: str) -> Tuple[str, Dict[str, str]]:
    """Replace common PII with tokens and return mapping.

    Returns (anonymized_text, mapping) where mapping maps token->original
    """
    mapping = {}
    def _replace_email(m):
        token = "[EMAIL]"
        mapping.setdefault(token, set()).add(m.group(0))
        return token

    def _replace_phone(m):
        token = "[PHONE]"
        mapping.setdefault(token, set()).add(m.group(0))
        return token

    def _replace_url(m):
        token = "[URL]"
        mapping.setdefault(token, set()).add(m.group(0))
        return token

    s = EMAIL_RE.sub(_replace_email, text)
    s = PHONE_RE.sub(_replace_phone, s)
    s = URL_RE.sub(_replace_url, s)
    # Replace addresses
    def _replace_address(m):
        token = "[ADDRESS]"
        mapping.setdefault(token, set()).add(m.group(0))
        return token
    s = ADDRESS_RE.sub(_replace_address, s)
    # Replace probable full names (best-effort)
    def _replace_name(m):
        token = "[NAME]"
        mapping.setdefault(token, set()).add(m.group(0))
        return token
    s = NAME_RE.sub(_replace_name, s)

    # Normalize mapping sets to lists for JSON-compatibility
    mapping = {k: list(v) for k, v in mapping.items()}
    return s, mapping


def simple_name_mask(text: str, names: list[str]) -> str:
    """Replace obvious names in text with [NAME]. Optional helper.

    Note: naive; intended as optional enhancement.
    """
    for n in names:
        if not n:
            continue
        text = re.sub(rf"\b{re.escape(n)}\b", "[NAME]", text, flags=re.IGNORECASE)
    return text
