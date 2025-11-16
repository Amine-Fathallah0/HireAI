n# Job Matcher Integration - Setup Guide

## What Has Been Created

### 1. **Job Matcher Microservice**
- **Backend API**: `Services/JobsService/job_matcher/src/job_matcher/api_server.py`
  - FastAPI service that wraps your JobMatcherFlow
  - Endpoint: `POST /api/v1/jobs/extract`
  - Health check: `GET /api/v1/health`
  
- **Docker Setup**: 
  - `Services/JobsService/job_matcher/Dockerfile`
  - `Services/JobsService/job_matcher/requirements.txt`
  - Added to `docker-compose.yml` as `job-matcher` service (port 8010)

### 2. **Frontend UI Components**
- **Main Page**: `frontend/pages/job-matcher.tsx`
  - Protected route (requires authentication)
  - Job URL input
  - Resume upload (file or text)
  - Real-time analysis
  - Beautiful results display

- **Components**:
  - `frontend/components/job-matcher/ResumeUpload.tsx`
    - Drag & drop file upload
    - Paste resume text option
    - File validation (PDF, DOC, DOCX, TXT)
    - Size limit (5MB)
  
  - `frontend/components/job-matcher/JobMatchResults.tsx`
    - Match score display (with color-coded feedback)
    - Score breakdown by category
    - Matching skills badges
    - Missing skills recommendations
    - Resume optimization tips
    - Print/save report functionality

### 3. **Design System Integration**
- Updated `tailwind.config.ts` with design system colors:
  - Talent green (#22C55E)
  - Purple accent (#A855F7)
  - Custom fonts (Lato, Bricolage Grotesque)
  
- Updated `globals.css` with Google Fonts imports

- Dashboard quick actions on home page

### 4. **Environment Configuration**
- Updated `frontend/.env.local`:
  ```
  NEXT_PUBLIC_JOB_MATCHER_URL=http://localhost:8010
  ```

## How to Run

### Option 1: Start Everything with Docker Compose

1. **Start all services** (from project root):
   ```powershell
   docker-compose up -d
   ```
   
   This will start:
   - Redis (port 6379)
   - MongoDB (port 27017)
   - Job-matcher microservice (port 8010)
   - Gateway (port 8090) - if builds succeed
   - User service (port 8081) - if builds succeed
   - Keycloak (port 8080)
   - PostgreSQL (port 5432)

2. **Start frontend separately**:
   ```powershell
   cd frontend
   npm run dev
   ```
   
   Access at: http://localhost:3000

### Option 2: Start Job Matcher Locally (Recommended for Testing)

1. **Start infrastructure only**:
   ```powershell
   docker-compose up -d redis mongodb
   ```

2. **Start job-matcher locally**:
   ```powershell
   cd Services/JobsService/job_matcher
   
   # Set API keys (REQUIRED)
   $env:GEMINI_API_KEY = 'your_gemini_key_here'
   $env:FIRECRAWL_API_KEY = 'your_firecrawl_key_here'
   
   # Install dependencies (if not done)
   pip install -r requirements.txt
   
   # Start the service
   python -m uvicorn job_matcher.api_server:app --host 0.0.0.0 --port 8000
   ```
   
   Service will be at: http://localhost:8000

3. **Start frontend**:
   ```powershell
   cd frontend
   npm run dev
   ```

## How to Use the Interface

1. **Login** at http://localhost:3000
   - Use your Keycloak credentials
   - Or register a new account

2. **Access Job Matcher**:
   - Click the "AI Job Matcher" card on the dashboard
   - Or navigate to: http://localhost:3000/job-matcher

3. **Analyze a Job**:
   - Paste a job URL (Indeed, LinkedIn, Glassdoor, etc.)
   - Upload your resume (PDF, DOC, DOCX) OR paste resume text
   - Click "Analyze Match"
   - Wait for AI processing (10-30 seconds)

4. **View Results**:
   - Overall match score (percentage)
   - Score breakdown by category
   - Skills you have (green badges)
   - Skills to develop (amber badges)
   - Personalized resume optimization tips
   - Save/print report

## Design System Features Implemented

✅ **Color Palette**:
- Primary green (#22C55E) for CTAs and success states
- Purple accent (#A855F7) for secondary actions
- Semantic colors for status (success, warning, error, info)

✅ **Typography**:
- Headings: Bricolage Grotesque (font-display class)
- Body: Lato (default sans)
- Proper type scale (text-3xl, text-xl, text-base, etc.)

✅ **Components**:
- Rounded corners (12px, 16px, 20px)
- Proper spacing (8px grid system)
- Hover effects (scale, shadow, color transitions)
- Glass morphism cards
- Status badges with semantic colors
- Gradient backgrounds for CTAs

✅ **Interactions**:
- 300ms transitions
- Hover scale effects
- Loading spinners
- Success/error feedback
- Smooth animations

✅ **Accessibility**:
- High contrast text (WCAG AA+)
- Focus rings on interactive elements
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support

## Troubleshooting

### Frontend won't start
```powershell
# Try using cmd instead of PowerShell
cmd
cd frontend
npm run dev
```

### Job matcher returns 500 error
- Check API keys are set (GEMINI_API_KEY, FIRECRAWL_API_KEY)
- Check job-matcher logs: `docker-compose logs job-matcher`
- Verify job URL is valid and accessible

### CORS errors
- Ensure NEXT_PUBLIC_JOB_MATCHER_URL points to correct service
- If using Docker: http://localhost:8010
- If using local: http://localhost:8000

### Fonts not loading
- Clear browser cache
- Check Network tab in DevTools for font requests
- Fonts load from Google Fonts CDN

## API Documentation

### POST /api/v1/jobs/extract

**Request**:
```json
{
  "job_url": "https://www.indeed.com/viewjob?jk=...",
  "cv_data": {
    "text": "Resume content here...",
    "fileName": "resume.pdf"
  },
  "candidate_id": "user@example.com"
}
```

**Response** (success):
```json
{
  "scraped_job": {
    "title": "Software Engineer",
    "company": "Tech Corp",
    "requirements": [...],
    "skills": [...]
  },
  "match_result": {
    "overall_match_score": 85,
    "score_breakdown": {
      "skills_match": 90,
      "experience_match": 80
    },
    "matching_skills": ["Python", "React", "AWS"],
    "missing_skills": ["Kubernetes", "GraphQL"],
    "resume_optimization": {
      "summary": "Highlight your cloud experience...",
      "keywords_to_add": ["DevOps", "CI/CD"],
      "sections_to_improve": ["Technical Skills"]
    }
  }
}
```

**Response** (error):
```json
{
  "detail": {
    "error": "Failed to scrape job URL",
    "trace": "..."
  }
}
```

## Next Steps

1. **Test end-to-end** with real job URLs
2. **Add PDF parsing** for uploaded resumes (currently uses placeholder)
3. **Persist results** to MongoDB for history
4. **Add export formats** (PDF report generation)
5. **Integrate with gateway** for centralized routing
6. **Add rate limiting** to prevent API abuse
7. **Implement caching** for repeated job URL requests
