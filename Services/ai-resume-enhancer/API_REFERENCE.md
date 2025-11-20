# Enhancement API Quick Reference

## Endpoint
```
POST /api/resumes/{resume_id}/enhance
```

## Request Headers
```
x-user-id: string (required)
Content-Type: application/json
```

## Request Body
```typescript
{
  section: "summary" | "experience" | "education" | "skills" | "projects" | "certifications" | "other",
  text: string,  // 10-5000 characters
  context?: {
    job_title?: string,    // max 200 chars
    industry?: string,     // max 100 chars
    section_index?: number // >= 0
  }
}
```

## Response (200 OK)
```typescript
{
  enhanced_text: string,           // With [PII] placeholders
  suggestions: string[],           // Top 5 improvement tips
  ats_score_before: {
    score: number,                 // 0.0 - 1.0
    factors: {
      action_verbs: number,
      metrics: number,
      keyword_density: number,
      formatting: number
    },
    keywords_found: string[],
    action_verbs_found: string[]
  },
  ats_score_after: {
    score: number,
    factors: { ... },
    keywords_found: string[],
    action_verbs_found: string[]
  },
  keywords_added: string[],        // New valuable terms
  confidence: number,              // 0.0 - 1.0
  pii_anonymized: boolean,         // Always true
  processing_time_ms: number
}
```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Text cannot be empty or whitespace only"
}
```
**Causes:**
- Invalid section type
- Text length < 10 or > 5000 chars
- Empty/whitespace-only text

### 403 Forbidden
```json
{
  "detail": "Not authorized to enhance this resume"
}
```
**Cause:** Resume user_id doesn't match x-user-id header

### 404 Not Found
```json
{
  "detail": "Resume not found"
}
```
**Cause:** resume_id doesn't exist in database

### 429 Too Many Requests
```json
{
  "detail": "Daily enhancement limit exceeded (10/day)"
}
```
**Headers:** `Retry-After: 86400` (seconds)
**Cause:** Exceeded 10 enhancements in current day

### 500 Internal Server Error
```json
{
  "detail": "Enhancement failed: <error message>"
}
```
**Causes:**
- Database connection error
- LLM service unavailable
- Internal processing error

## Rate Limits

| Limit Type | Quota | Reset Period | Applies To |
|------------|-------|--------------|------------|
| Daily | 10 | 24 hours | All users, section enhancement |
| Monthly (Free) | 3 | End of month | Upload + enhance |
| Monthly (Basic) | 10 | End of month | Upload + enhance |
| Monthly (Premium) | 50 | End of month | Upload + enhance |
| Monthly (Enterprise) | Unlimited | - | Upload + enhance |

## PII Placeholders

Enhanced text contains these placeholders:

| Placeholder | Original Pattern |
|-------------|------------------|
| `[EMAIL]` | john@example.com |
| `[PHONE]` | (555) 123-4567 |
| `[URL]` | https://linkedin.com/in/john |
| `[NAME]` | John Smith |
| `[ADDRESS]` | 123 Main Street |

**Important:** PII is NOT restored. Handle placeholders client-side if needed.

## cURL Examples

### Basic Enhancement
```bash
curl -X POST http://localhost:8000/api/resumes/abc123/enhance \
  -H "x-user-id: user@example.com" \
  -H "Content-Type: application/json" \
  -d '{
    "section": "summary",
    "text": "I am a software engineer with experience in Python and web development."
  }'
```

### With Context
```bash
curl -X POST http://localhost:8000/api/resumes/abc123/enhance \
  -H "x-user-id: user@example.com" \
  -H "Content-Type: application/json" \
  -d '{
    "section": "experience",
    "text": "Led team of developers building microservices. Improved system performance and reduced costs.",
    "context": {
      "job_title": "Senior Backend Engineer",
      "industry": "fintech"
    }
  }'
```

### JavaScript/Fetch
```javascript
const response = await fetch(`http://localhost:8000/api/resumes/${resumeId}/enhance`, {
  method: 'POST',
  headers: {
    'x-user-id': userId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    section: 'skills',
    text: 'Python, JavaScript, SQL, Git',
    context: {
      job_title: 'Full Stack Developer',
      industry: 'technology'
    }
  })
});

const result = await response.json();
console.log('ATS improvement:', result.ats_score_after.score - result.ats_score_before.score);
console.log('Keywords added:', result.keywords_added);
```

### Python/Requests
```python
import requests

response = requests.post(
    f'http://localhost:8000/api/resumes/{resume_id}/enhance',
    headers={'x-user-id': user_id},
    json={
        'section': 'projects',
        'text': 'Built a web app for managing tasks. Used React and Node.js.',
        'context': {
            'job_title': 'Frontend Engineer',
            'industry': 'saas'
        }
    }
)

data = response.json()
print(f"Enhanced: {data['enhanced_text']}")
print(f"ATS before: {data['ats_score_before']['score']:.2f}")
print(f"ATS after: {data['ats_score_after']['score']:.2f}")
print(f"Suggestions: {', '.join(data['suggestions'])}")
```

## ATS Score Interpretation

| Score Range | Quality | Action |
|-------------|---------|--------|
| 0.0 - 0.3 | Poor | Major rewrite needed |
| 0.3 - 0.5 | Fair | Significant improvements possible |
| 0.5 - 0.7 | Good | Minor enhancements recommended |
| 0.7 - 0.9 | Excellent | Well-optimized, minor tweaks only |
| 0.9 - 1.0 | Outstanding | Best-in-class, ready for ATS |

## Factor Weights

- **Action Verbs:** 35% - Strong, active language (led, architected, optimized)
- **Metrics:** 25% - Quantified achievements (%, $, numbers, scale)
- **Keywords:** 25% - Tech terms, industry jargon, job-specific words
- **Formatting:** 15% - Structure, capitalization, organization

## Best Practices

1. **Provide Context:** Include job_title and industry for better targeting
2. **One Section at a Time:** Enhance sections individually for best results
3. **Review Suggestions:** Use returned suggestions for manual refinement
4. **Monitor ATS Scores:** Track before/after to measure improvement
5. **Handle Rate Limits:** Cache results, batch operations appropriately
6. **PII Handling:** Implement client-side placeholder replacement if needed

## Common Issues

**Issue:** 429 Rate Limit
**Solution:** Wait for retry_after seconds or upgrade tier

**Issue:** Low ATS improvement
**Solution:** Provide more detailed context, ensure text has substance to enhance

**Issue:** Missing keywords
**Solution:** Add industry/job_title context for better keyword targeting

**Issue:** PII in response
**Solution:** Expected behavior - placeholders returned, not original PII

## Database Schema

Enhancement creates/updates this structure in MongoDB:

```javascript
{
  _id: "resume_id",
  user_id: "user@example.com",
  // ... other resume fields
  ai_analysis: {
    enhancement_history: [
      {
        timestamp: ISODate("2025-11-14T12:34:56Z"),
        section: "summary",
        ats_score_before: 0.35,
        ats_score_after: 0.78,
        confidence: 0.85,
        keywords_added: ["docker", "kubernetes"],
        context: { job_title: "DevOps Engineer", industry: "cloud" }
      }
      // ... up to 50 most recent
    ],
    section_scores: {
      summary: 0.78,
      experience: 0.82,
      skills: 0.65
    },
    overall_ats_score: 0.75,
    last_analyzed: ISODate("2025-11-14T12:34:56Z")
  },
  updated_at: ISODate("2025-11-14T12:34:56Z")
}
```

## Monitoring

Check rate limit status:
```bash
curl http://localhost:8000/api/user/usage \
  -H "x-user-id: user@example.com"
```

Response:
```json
{
  "user_id": "user@example.com",
  "tier": "free",
  "usage": 2,
  "limit": 10,
  "remaining": 8
}
```
