from pydantic import BaseModel, Field
from typing import Optional, Literal, List


class EnhanceTextRequest(BaseModel):
    text: str = Field(..., min_length=1)
    sectionType: Literal["summary", "experience", "education", "skills"]
    context: Optional[dict] = None


class EnhanceTextResponse(BaseModel):
    enhancedText: str
    suggestions: List[str]
    confidence: float
