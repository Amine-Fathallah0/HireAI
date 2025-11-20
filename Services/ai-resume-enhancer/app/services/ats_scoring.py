"""
ATS Scoring Module
Provides rule-based ATS scoring (0.0 - 1.0) for resume text.
Considers keyword density, action verbs, metrics, formatting quality.
"""
import re
from typing import Set, List

# Common action verbs for resumes
ACTION_VERBS = {
    "achieved", "led", "managed", "developed", "created", "designed", "implemented",
    "improved", "increased", "decreased", "reduced", "optimized", "streamlined",
    "launched", "delivered", "built", "established", "initiated", "coordinated",
    "executed", "analyzed", "resolved", "transformed", "spearheaded", "drove",
    "accelerated", "generated", "negotiated", "collaborated", "mentored", "trained",
    "supervised", "directed", "architected", "engineered", "automated", "scaled"
}

# Common tech keywords (extend as needed)
TECH_KEYWORDS = {
    "python", "java", "javascript", "typescript", "react", "angular", "vue",
    "node", "sql", "mongodb", "postgresql", "aws", "azure", "gcp", "docker",
    "kubernetes", "ci/cd", "agile", "scrum", "git", "api", "rest", "graphql",
    "microservices", "machine learning", "ai", "data", "analytics", "cloud"
}


def compute_ats_score(text: str, context: dict = None) -> dict:
    """
    Compute ATS score (0.0-1.0) based on multiple factors.
    
    Returns:
        {
            "score": float,  # 0.0 - 1.0
            "factors": {
                "action_verbs": float,
                "metrics": float,
                "keyword_density": float,
                "formatting": float
            },
            "keywords_found": List[str],
            "action_verbs_found": List[str]
        }
    """
    if not text or not text.strip():
        return {
            "score": 0.0,
            "factors": {"action_verbs": 0.0, "metrics": 0.0, "keyword_density": 0.0, "formatting": 0.0},
            "keywords_found": [],
            "action_verbs_found": []
        }
    
    text_lower = text.lower()
    words = re.findall(r'\b\w+\b', text_lower)
    word_count = len(words)
    
    # Factor 1: Action verbs (0-1)
    action_verbs_found = [w for w in words if w in ACTION_VERBS]
    action_verb_score = min(1.0, len(set(action_verbs_found)) / 8.0)  # 8+ unique verbs = 1.0
    
    # Factor 2: Metrics/numbers (0-1)
    # Look for percentages, numbers, currency
    metrics_pattern = r'\b\d+%|\b\d+[kKmMbB]?\b|\$\d+|\d+\+?'
    metrics_found = re.findall(metrics_pattern, text)
    metrics_score = min(1.0, len(metrics_found) / 5.0)  # 5+ metrics = 1.0
    
    # Factor 3: Keyword density (0-1)
    # Check for tech keywords or job-specific keywords from context
    target_keywords = set(TECH_KEYWORDS)
    if context and context.get("industry"):
        # Could extend with industry-specific keywords
        pass
    if context and context.get("job_title"):
        # Extract keywords from job title
        job_words = set(re.findall(r'\b\w+\b', context["job_title"].lower()))
        target_keywords.update(job_words)
    
    keywords_found = [w for w in words if w in target_keywords]
    keyword_score = min(1.0, len(set(keywords_found)) / 6.0)  # 6+ keywords = 1.0
    
    # Factor 4: Formatting quality (0-1)
    # Check for proper capitalization, bullet usage, no excessive punctuation
    formatting_score = 0.0
    # Proper sentences (capital at start)
    sentences = re.split(r'[.!?]\s+', text)
    capitalized = sum(1 for s in sentences if s and s[0].isupper())
    if sentences:
        formatting_score += min(0.5, capitalized / len(sentences))
    
    # Bullet points or line breaks (organized structure)
    if '•' in text or '-' in text or '\n' in text:
        formatting_score += 0.3
    
    # No excessive punctuation
    punct_ratio = len(re.findall(r'[!?]{2,}', text)) / max(1, word_count)
    if punct_ratio < 0.01:
        formatting_score += 0.2
    
    formatting_score = min(1.0, formatting_score)
    
    # Weighted overall score
    weights = {"action_verbs": 0.35, "metrics": 0.25, "keyword_density": 0.25, "formatting": 0.15}
    overall_score = (
        weights["action_verbs"] * action_verb_score +
        weights["metrics"] * metrics_score +
        weights["keyword_density"] * keyword_score +
        weights["formatting"] * formatting_score
    )
    
    return {
        "score": round(overall_score, 3),
        "factors": {
            "action_verbs": round(action_verb_score, 3),
            "metrics": round(metrics_score, 3),
            "keyword_density": round(keyword_score, 3),
            "formatting": round(formatting_score, 3)
        },
        "keywords_found": sorted(list(set(keywords_found)))[:10],
        "action_verbs_found": sorted(list(set(action_verbs_found)))[:10]
    }


def compute_keywords_added(before_text: str, after_text: str) -> List[str]:
    """
    Identify new keywords/action verbs added in the enhanced version.
    """
    before_words = set(re.findall(r'\b\w+\b', before_text.lower()))
    after_words = set(re.findall(r'\b\w+\b', after_text.lower()))
    
    new_words = after_words - before_words
    
    # Filter to meaningful additions (keywords + action verbs)
    all_target = ACTION_VERBS.union(TECH_KEYWORDS)
    added = [w for w in new_words if w in all_target]
    
    return sorted(added)[:10]  # Return top 10
