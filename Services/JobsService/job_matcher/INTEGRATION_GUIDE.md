# Job Matcher Service Integration

## Overview

The Job Matcher Service is an AI-powered microservice that analyzes job postings and matches them against candidate resumes, providing match scores and optimization recommendations.

## Architecture

### Service Design

The service is built with a **future-proof architecture** that supports integration with a separate Resume Service:

```
┌─────────────────┐
│   Frontend      │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│    Gateway      │ (Port 8090)
│  Spring Cloud   │
└────────┬────────┘
         │
         ├──────────────────────────┐
         │                          │
         ▼                          ▼
┌─────────────────┐        ┌─────────────────┐
│  User Service   │        │  Job Matcher    │
│  (Port 8081)    │        │  (Port 8010)    │
└─────────────────┘        └────────┬────────┘
                                    │
                      ┌─────────────┴─────────────┐
                      │                           │
                      ▼                           ▼
            ┌─────────────────┐         ┌─────────────────┐
            │ Resume Service  │         │  CrewAI Flow    │
            │  (Future)       │         │  - Job Scraper  │
            │  Port 8083      │         │  - Matcher      │
            └─────────────────┘         │  - Optimizer    │
                                        └─────────────────┘
```

### Key Features

1. **Dual CV Source Support**:
   - **Primary**: Fetch CV from Resume Service (when available)
   - **Fallback**: Accept CV data directly in request body
   - Configurable via `RESUME_SERVICE_ENABLED` environment variable

2. **Asynchronous Processing**:
   - Job matching runs in background tasks
   - Returns request ID immediately (202 Accepted)
   - Client polls for results using request ID

3. **AI-Powered Analysis**:
   - Uses CrewAI framework with multiple specialized agents
   - Scrapes job postings using Firecrawl
   - Generates detailed match reports with optimization tips

## API Endpoints

### Base URL
- **Development**: `http://localhost:8010`
- **Via Gateway**: `http://localhost:8090/api/v1/jobs`

### Endpoints

#### 1. Health Check
```http
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "service": "job-matcher",
  "timestamp": "2024-01-15T10:30:00Z",
  "resume_service_status": "disabled",
  "dependencies": {
    "mongodb": "connected",
    "gemini_api": "configured",
    "firecrawl_api": "configured"
  }
}
```

#### 2. Create Job Match Request
```http
POST /api/v1/jobs/match
Content-Type: application/json
```

**Request Body**:
```json
{
  "user_id": "user_123",
  "job_url": "https://www.linkedin.com/jobs/view/123456789",
  "cv_data": null  // Optional: if null, fetches from resume service
}
```

**With CV Data (Backward Compatible)**:
```json
{
  "user_id": "user_123",
  "job_url": "https://www.linkedin.com/jobs/view/123456789",
  "cv_data": {
    "personal_info": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "skills": ["Python", "FastAPI", "Docker"],
    "experience": [...],
    "education": [...]
  }
}
```

**Response** (202 Accepted):
```json
{
  "request_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user_id": "user_123",
  "job_url": "https://www.linkedin.com/jobs/view/123456789",
  "status": "queued",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### 3. Get Match Result
```http
GET /api/v1/jobs/match/{request_id}
```

**Response** (when processing):
```json
{
  "request_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user_id": "user_123",
  "job_url": "https://www.linkedin.com/jobs/view/123456789",
  "status": "processing",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Response** (when completed):
```json
{
  "request_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user_id": "user_123",
  "job_url": "https://www.linkedin.com/jobs/view/123456789",
  "status": "completed",
  "match_result": {
    "overall_match_score": 85,
    "skills_match": {
      "matched_skills": ["Python", "Docker", "PostgreSQL"],
      "missing_skills": ["Kubernetes", "AWS"],
      "score": 75
    },
    "experience_match": {
      "required_years": 3,
      "candidate_years": 5,
      "score": 100
    },
    "resume_optimization": {
      "keywords_to_add": ["cloud-native", "microservices", "CI/CD"],
      "sections_to_improve": ["summary", "skills"],
      "recommendations": [
        "Highlight your Docker experience more prominently",
        "Add specific examples of microservices projects"
      ]
    },
    "job_details": {
      "title": "Senior Backend Developer",
      "company": "Tech Corp",
      "location": "Remote",
      "requirements": [...]
    }
  },
  "created_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:32:30Z"
}
```

#### 4. List Match Requests
```http
GET /api/v1/jobs/match?user_id=user_123&limit=10
```

**Response**:
```json
{
  "total": 5,
  "results": [
    {
      "request_id": "...",
      "user_id": "user_123",
      "status": "completed",
      "created_at": "..."
    }
  ]
}
```

#### 5. Delete Match Request
```http
DELETE /api/v1/jobs/match/{request_id}
```

#### 6. Get Configuration
```http
GET /api/v1/jobs/config
```

**Response**:
```json
{
  "resume_service": {
    "url": "http://resume-service:8083",
    "enabled": false
  },
  "apis": {
    "gemini": "configured",
    "firecrawl": "configured"
  },
  "environment": "docker"
}
```

## Environment Variables

### Required
- `GEMINI_API_KEY`: Google Gemini API key for AI processing
- `FIRECRAWL_API_KEY`: Firecrawl API key for web scraping

### Optional
- `RESUME_SERVICE_URL`: URL of Resume Service (default: `http://resume-service:8083`)
- `RESUME_SERVICE_ENABLED`: Enable Resume Service integration (default: `false`)
- `MONGODB_URI`: MongoDB connection string (default: `mongodb://mongo:mongo@mongodb:27017`)
- `MONGODB_DATABASE`: MongoDB database name (default: `job_matcher_db`)
- `MODEL`: AI model to use (default: `gemini/gemini-flash-latest`)
- `ENVIRONMENT`: Environment name (default: `development`)

## Docker Configuration

### Dockerfile
The service uses a multi-stage Python build with UV package manager:

```dockerfile
FROM python:3.12-slim
# Install UV package manager
# Copy project files and install dependencies
# Expose port 8000
CMD ["uv", "run", "uvicorn", "src.job_matcher.api:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose
```yaml
job-matcher:
  container_name: ms_job_matcher
  build: ./Services/JobsService/job_matcher
  ports:
    - "8010:8000"
  environment:
    RESUME_SERVICE_ENABLED: "false"  # Enable when resume service is ready
  networks:
    - microservices
  depends_on:
    - mongodb
    - redis
```

## Gateway Integration

### Routes Configuration
Added to `Services/gateway/src/main/resources/application.yml`:

```yaml
routes:
  - id: job-matcher-route
    uri: ${JOB_MATCHER_SERVICE_URL:http://localhost:8010}
    predicates:
      - Path=/api/v1/jobs/**
    filters:
      - name: RequestRateLimiter
        args:
          redis-rate-limiter.replenishRate: 5  # 5 requests/sec
          redis-rate-limiter.burstCapacity: 10
      - name: CircuitBreaker
        args:
          name: jobMatcherCircuitBreaker
          fallbackUri: forward:/fallback/jobs
```

### Circuit Breaker
```yaml
resilience4j:
  circuitbreaker:
    instances:
      jobMatcherCircuitBreaker:
        baseConfig: default
        waitDurationInOpenState: 30s  # AI service needs longer recovery
```

## Integration Status

### ✅ Completed Services
1. **Gateway Service** (Port 8090) - Spring Cloud Gateway with routing
2. **User Service** (Port 8081) - User management and authentication
3. **Keycloak** (Port 8080) - Identity and access management
4. **PostgreSQL** (Port 5432) - Relational database for user data
5. **MongoDB** (Port 27017) - NoSQL database for job matching data
6. **Redis** (Port 6379) - Caching and rate limiting
7. **Job Matcher** (Port 8010) - AI-powered job matching ✅ NEW

### ⏳ Planned Services
8. **Resume Service** (Port 8083) - CV parsing and storage
   - Will provide `/api/v1/resumes/{user_id}` endpoint
   - Job Matcher will call this service to fetch CV data
   - Currently: Job Matcher accepts CV in request body as fallback

## Future Integration: Resume Service

When the Resume Service is implemented:

### 1. Update Environment Variables
```yaml
# In docker-compose.yml
job-matcher:
  environment:
    RESUME_SERVICE_URL: http://resume-service:8083
    RESUME_SERVICE_ENABLED: "true"  # Enable integration
```

### 2. Resume Service API Contract
The Resume Service should implement:

```http
GET /api/v1/resumes/{user_id}
Authorization: Bearer {token}
```

**Response**:
```json
{
  "user_id": "user_123",
  "cv_data": {
    "personal_info": {...},
    "skills": [...],
    "experience": [...],
    "education": [...]
  },
  "last_updated": "2024-01-15T10:00:00Z"
}
```

### 3. Gateway Route for Resume Service
```yaml
- id: resume-service-route
  uri: http://resume-service:8083
  predicates:
    - Path=/api/v1/resumes/**
```

### 4. Add Resume Service to docker-compose.yml
```yaml
resume-service:
  container_name: ms_resume_service
  build: ./Services/ResumeService
  ports:
    - "8083:8083"
  depends_on:
    - mongodb
    - postgresql
```

## Testing

### 1. Health Check
```bash
curl http://localhost:8090/api/v1/jobs/health
```

### 2. Create Match Request (with CV data)
```bash
curl -X POST http://localhost:8090/api/v1/jobs/match \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user_id": "user_123",
    "job_url": "https://www.linkedin.com/jobs/view/123456789",
    "cv_data": {
      "personal_info": {"name": "John Doe"},
      "skills": ["Python", "FastAPI", "Docker"],
      "experience": [],
      "education": []
    }
  }'
```

**Response**:
```json
{
  "request_id": "abc-123",
  "status": "queued"
}
```

### 3. Check Result
```bash
curl http://localhost:8090/api/v1/jobs/match/abc-123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Test Resume Service Integration (Future)
When `RESUME_SERVICE_ENABLED=true`:
```bash
curl -X POST http://localhost:8090/api/v1/jobs/match \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user_id": "user_123",
    "job_url": "https://www.linkedin.com/jobs/view/123456789"
  }'
```
The service will automatically fetch CV from resume service.

## Deployment

### Build and Start
```bash
# Build job-matcher image
docker-compose build job-matcher

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f job-matcher

# Check health
curl http://localhost:8010/health
```

### Stop and Clean
```bash
# Stop services
docker-compose down

# Clean volumes
docker-compose down -v
```

## Monitoring

### Service Health
- Job Matcher: `http://localhost:8010/health`
- Gateway: `http://localhost:8090/actuator/health`
- All Services: `docker-compose ps`

### Logs
```bash
# All services
docker-compose logs -f

# Job matcher only
docker-compose logs -f job-matcher

# Gateway only
docker-compose logs -f gateway
```

## Error Handling

### Resume Service Unavailable
When `RESUME_SERVICE_ENABLED=true` but service is down:

```json
{
  "detail": {
    "error": "Resume service not available",
    "message": "Resume service is not configured or enabled. Please provide cv_data in the request body.",
    "resume_service_url": "http://resume-service:8083",
    "resume_service_enabled": true
  }
}
```

**Solution**: Provide `cv_data` in request body as fallback.

### CV Not Found
```json
{
  "detail": "CV not found for user_id: user_123"
}
```

### Job Matching Failed
```json
{
  "request_id": "abc-123",
  "status": "failed",
  "error": "Failed to scrape job posting: Invalid URL"
}
```

## API Documentation

FastAPI automatically generates interactive documentation:

- **Swagger UI**: `http://localhost:8010/api/v1/jobs/docs`
- **ReDoc**: `http://localhost:8010/api/v1/jobs/redoc`
- **OpenAPI Schema**: `http://localhost:8010/api/v1/jobs/openapi.json`

Via Gateway:
- **Swagger UI**: `http://localhost:8090/api/v1/jobs/docs`

## Performance Considerations

1. **Rate Limiting**: Gateway limits to 5 requests/second (AI processing is expensive)
2. **Async Processing**: Job matching runs in background to avoid timeouts
3. **Circuit Breaker**: Gateway has 30s cooldown for job-matcher failures
4. **Caching**: Consider caching job scraping results (future enhancement)

## Security

1. **Authentication**: All endpoints should be protected via Gateway (add JWT validation)
2. **API Keys**: Gemini and Firecrawl keys stored as environment variables
3. **Rate Limiting**: Redis-based rate limiting via Gateway
4. **CORS**: Currently allows all origins (restrict in production)

## Next Steps

1. ✅ **Complete**: Job Matcher service integrated
2. ⏳ **Pending**: Implement Resume Service
3. ⏳ **Pending**: Add authentication middleware to Job Matcher endpoints
4. ⏳ **Pending**: Implement persistent storage for match results (MongoDB)
5. ⏳ **Pending**: Add job history and analytics features
6. ⏳ **Pending**: Implement webhook notifications for completed matches

## Support

For issues or questions:
- Check service logs: `docker-compose logs job-matcher`
- Check health: `curl http://localhost:8010/health`
- API documentation: `http://localhost:8010/api/v1/jobs/docs`
