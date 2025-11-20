from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from app.api import upload, user, enhance, cv_data, job_recommendations
from app.logging_config import configure_logging
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from app.middleware.request_id import RequestIDMiddleware

configure_logging()


app = FastAPI(title="AI Resume Enhancer")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RequestIDMiddleware)

app.include_router(upload.router, prefix="/api/resume", tags=["resume"])
app.include_router(user.router, prefix="/api/user", tags=["user"])
app.include_router(enhance.router, prefix="/api", tags=["enhance"])  # /api/resumes/{id}/enhance
app.include_router(cv_data.router, prefix="/api/resume", tags=["cv-data"])  # /api/resume/{id}/cv-data
app.include_router(job_recommendations.router, prefix="/api/resume", tags=["job-recommendations"])  # /api/resume/recommendations

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    data = generate_latest()
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)
