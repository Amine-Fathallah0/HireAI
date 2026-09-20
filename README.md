# HireAI

AI-powered career platform built as a microservices system: upload a resume, have it parsed and enhanced by an LLM, then match it against a live job posting and get a scored, gap-aware report.

Built for the TSYP 13 CS Challenge.

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.11%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://www.docker.com/)

---

## Contents

- [What it does](#what-it-does)
- [Architecture](#architecture)
- [Services and ports](#services-and-ports)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Running services individually](#running-services-individually)
- [API reference](#api-reference)
- [Rate limiting](#rate-limiting)
- [Repository layout](#repository-layout)
- [Troubleshooting](#troubleshooting)
- [Known gaps](#known-gaps)

---

## What it does

Three user-facing flows, each backed by its own service:

1. **Account & profile** — registration and login through Keycloak, profile management, GDPR data export/delete, and audit logging. Handled by the Spring Boot **user service**.
2. **Resume upload & enhancement** — a PDF is uploaded, parsed with PyMuPDF, structured by Groq (`llama-3.3-70b-versatile`), scored for ATS fit, and versioned in MongoDB. Handled by the FastAPI **ai-resume-enhancer**.
3. **Job matching** — given a job posting URL, Firecrawl scrapes the page, a CrewAI flow extracts the structured job spec, and a matching agent compares it against the candidate's stored CV to produce a match score, missing skills, ATS keywords, and resume optimization advice. The recommendations are pushed back to the resume service. Handled by the FastAPI **job-matcher**.

Everything is fronted by a Spring Cloud Gateway that handles routing, Redis-backed rate limiting, circuit breaking, and CORS.

## Architecture

```
                        ┌────────────────────────────┐
                        │  Frontend — Next.js 14     │
                        │  NextAuth + Keycloak       │
                        │  localhost:3000            │
                        └──────────────┬─────────────┘
                                       │
                        ┌──────────────▼─────────────┐
                        │  API Gateway :8090         │
                        │  Spring Cloud Gateway      │
                        │  routing · rate limit ·    │
                        │  circuit breaker · CORS    │
                        └──┬─────────┬─────────────┬─┘
                           │         │             │
        /api/v1/auth/**    │         │             │  /api/v1/jobs/**
        /api/v1/users/**   │         │             │
        /api/v1/profile/** │         │ /api/v1/resumes/**
                           │         │             │
        ┌──────────────────▼──┐ ┌────▼───────────┐ ┌▼───────────────────┐
        │  user-service :8081 │ │ ai-resume-     │ │ job-matcher :8010  │
        │  Spring Boot 3.5    │ │ enhancer :8083 │ │ FastAPI + CrewAI   │
        │                     │ │ FastAPI        │ │                    │
        │  · auth / register  │ │ · PDF parse    │ │ · Firecrawl scrape │
        │  · profile CRUD     │ │ · Groq enhance │ │ · job extraction   │
        │  · GDPR export/del  │ │ · ATS scoring  │ │ · CV/job matching  │
        │  · audit logs       │ │ · versioning   │ │ · recommendations  │
        │  · Keycloak sync    │ │ · tier quotas  │ │                    │
        └──────────┬──────────┘ └────┬───────────┘ └─┬──────────────────┘
                   │                 │               │
                   │                 │   CV fetch ◄──┤
                   │                 └──► recommendations push
                   │                 │               │
        ┌──────────▼──────────┐ ┌────▼───────────────▼───┐ ┌──────────────┐
        │  PostgreSQL :5432   │ │  MongoDB :27017        │ │ Redis :6379  │
        │  user_db, keycloak  │ │  resume_db,            │ │ rate limits  │
        │                     │ │  job_matcher_db        │ │ + quotas     │
        └─────────────────────┘ └────────────────────────┘ └──────────────┘

   Supporting: Keycloak :8080 (realm Tsyp13CS) · PgAdmin :5050 · Mongo Express :8082
```

### Job matching sequence

```
Frontend ──► Gateway ──► job-matcher  POST /api/v1/jobs/match  { user_id, job_url }
                              │
                              ├──► ai-resume-enhancer  GET /api/resume/user/{id}/latest-cv
                              │       (skipped if cv_data is supplied inline)
                              │
                              ├──► Firecrawl           scrape the job posting
                              ├──► CrewAI job_scraper_agent   → structured job spec
                              ├──► CrewAI job_matching_agent  → score + gaps
                              │
                              └──► ai-resume-enhancer  POST /api/resume/recommendations

Frontend polls  GET /api/v1/jobs/match/{request_id}  until status = completed | failed
```

Job match requests are processed as FastAPI background tasks and tracked **in memory** — results do not survive a service restart.

## Services and ports

| Service | Container | Host port | Notes |
|---|---|---|---|
| Frontend (Next.js) | — | 3000 | Run with `npm run dev`, not in Compose |
| API Gateway | `ms_gateway` | 8090 | Spring Cloud Gateway |
| User service | `ms_user_service` | 8081 | Spring Boot 3.5, Java 17 |
| AI Resume Enhancer | `ms_ai_resume_enhancer` | 8083 | container listens on 8080 |
| Job Matcher | `ms_job_matcher` | 8010 | container listens on 8000 |
| Keycloak | `keycloak-ms1` | 8080 | realm `Tsyp13CS`, admin `admin`/`admin` |
| PostgreSQL | `ms_sql` | 5432 | `postgres`/`postgres`, DBs `user_db` + `keycloak` |
| MongoDB | `mongo_db1` | 27017 | `mongo`/`mongo` |
| Redis | `ms-redis` | 6379 | rate limiting + enhancement quotas |
| PgAdmin | `ms_pgadmin1` | 5050 | |
| Mongo Express | `mongo_express1` | 8082 | |

`Services/config-server` (Spring Cloud Config, port 8888) exists in the repo but is **not** part of `docker-compose.yml` — services read their configuration from environment variables instead.

## Tech stack

**Frontend** — Next.js 14 (Pages Router), React 18, TypeScript, Tailwind CSS, NextAuth.js (Keycloak + credentials providers), Axios, react-pdf.

**User service** — Spring Boot 3.5.6, Java 17, Spring Security + OAuth2 resource server, Keycloak Admin Client 23, Spring Data JPA, PostgreSQL 15.

**Gateway** — Spring Boot 3.5.7, Spring Cloud 2025.0.0, Spring Cloud Gateway, Resilience4j, Redis rate limiter, Actuator.

**AI Resume Enhancer** — Python 3.11, FastAPI, PyMuPDF, Motor (MongoDB), Redis, Groq API, structlog, Prometheus client, optional Pinecone and CrewAI.

**Job Matcher** — Python 3.12, FastAPI, CrewAI 1.4.1 (Flow + Crew), Firecrawl scraping tool, Groq (`groq/llama-3.3-70b-versatile`), httpx.

**Infrastructure** — Docker Compose, Keycloak 24.0.2, PostgreSQL 15 Alpine, MongoDB, Redis 7 Alpine.

## Prerequisites

- Docker Desktop 4.20+ with Compose 2.20+
- Node.js 18+ and npm 9+ (for the frontend)
- Java 17+ and Maven 3.9+ (only to run the Spring services outside Docker)
- Python 3.11+ (only to run the FastAPI services outside Docker)
- A [Groq API key](https://console.groq.com/) and a [Firecrawl API key](https://firecrawl.dev/) — the AI features do not work without them

## Quick start

### 1. Clone

```bash
git clone https://github.com/Amine-Fathallah0/HireAI.git
cd HireAI
```

### 2. Create the root `.env`

`docker-compose.yml` reads API keys from a root `.env` file. It is gitignored — create it yourself:

```bash
printf 'GROQ_API_KEY=your-groq-key\nFIRECRAWL_API_KEY=your-firecrawl-key\nPINECONE_API_KEY=\nPINECONE_ENV=\n' > .env
```

`docker-compose.yml` itself is also gitignored (see [Known gaps](#known-gaps)).

### 3. Start the backend

```bash
docker-compose up -d --build
docker ps
```

Keycloak takes a minute or two to become healthy on first boot; the gateway and user service wait on its healthcheck.

### 4. Configure Keycloak

Open http://localhost:8080/admin and log in with `admin` / `admin`.

1. Create the realm **`Tsyp13CS`** if it does not exist.
2. Create a confidential client `user-service` with **Direct access grants** and **Service accounts** enabled.
3. Under **Service account roles**, assign the `realm-management` roles `manage-users`, `view-users`, and `query-users` — the user service needs them to provision accounts.
4. Copy the client secret from the **Credentials** tab.
5. Under **Realm settings → Login**, enable **User registration**.

Then set `KEYCLOAK_CLIENT_SECRET` in `docker-compose.yml` (user service) and in `frontend/.env.local`, and restart the affected containers.

### 5. Configure and start the frontend

```bash
cd frontend
cp .env.local.example .env.local
# edit .env.local — see the table below
npm install
npm run dev
```

Generate a NextAuth secret with `openssl rand -base64 32`.

The app is at http://localhost:3000.

### 6. Verify

```bash
curl http://localhost:8090/actuator/health   # gateway  -> {"status":"UP"}
curl http://localhost:8081/actuator/health   # user     -> {"status":"UP"}
curl http://localhost:8083/healthz           # resume   -> {"status":"ok"}
curl http://localhost:8010/health            # jobs     -> dependency report
```

Interactive API docs: http://localhost:8010/api/v1/jobs/docs (job matcher) and http://localhost:8083/docs (resume enhancer).

## Environment variables

### Frontend — `frontend/.env.local`

| Variable | Example | Purpose |
|---|---|---|
| `NEXTAUTH_URL` | `http://localhost:3000` | NextAuth callback base |
| `NEXTAUTH_SECRET` | 32+ random chars | Session encryption |
| `KEYCLOAK_CLIENT_ID` | `user-service` | Server-side OIDC client |
| `KEYCLOAK_CLIENT_SECRET` | from Keycloak | Server-side OIDC secret |
| `KEYCLOAK_ISSUER` | `http://localhost:8080/realms/Tsyp13CS` | Server-side issuer |
| `NEXT_PUBLIC_KEYCLOAK_ISSUER` | same as above | Browser-side issuer |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | `user-service` | Browser-side client id |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8090` | Gateway base URL |
| `NEXT_PUBLIC_RESUME_SERVICE_URL` | `http://localhost:8083` | Resume service, called directly |
| `NEXT_PUBLIC_AI_RESUME_ENHANCER_API_URL` | `http://localhost:8083` | Used by `pages/resume/upload_new.tsx` |
| `NEXT_PUBLIC_JOB_MATCHER_URL` | `http://localhost:8010` | Job matcher, called directly |

The resume and job-matcher pages call those services directly rather than through the gateway, so the last three must be set for those flows to work.

### Root `.env` — consumed by Docker Compose

| Variable | Required | Purpose |
|---|---|---|
| `GROQ_API_KEY` | yes | LLM calls in both Python services |
| `FIRECRAWL_API_KEY` | yes | Job posting scraping |
| `PINECONE_API_KEY` | no | Optional vector storage for resume sections |
| `PINECONE_ENV` | no | Pinecone environment |

### Service-level variables

Set in `docker-compose.yml`; override there or in a per-service `.env` when running outside Docker.

**User service** — `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `KEYCLOAK_SERVER_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, `KEYCLOAK_ADMIN_USERNAME`, `KEYCLOAK_ADMIN_PASSWORD`, `KEYCLOAK_ISSUER_URI`, `KEYCLOAK_JWK_SET_URI`.

**Gateway** — `REDIS_HOST`, `REDIS_PORT`, `USER_SERVICE_URL`, `JOB_MATCHER_SERVICE_URL`, `AI_RESUME_SERVICE_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_ISSUER_URI`, `SERVER_PORT`.

**AI Resume Enhancer** — `MONGO_URL`, `MONGO_DB_NAME`, `REDIS_URL`, `GROQ_API_KEY`, `GROQ_API_URL`, `PINECONE_*`, `ENABLE_CREWAI`, `FASTAPI_HOST`, `FASTAPI_PORT`, `DEBUG`. See `Services/ai-resume-enhancer/.env.example`.

**Job Matcher** — `MODEL`, `GROQ_API_KEY`, `FIRECRAWL_API_KEY`, `RESUME_SERVICE_URL`, `RESUME_SERVICE_ENABLED`, `MONGODB_URI`, `MONGODB_DATABASE`, `ENVIRONMENT`.

## Running services individually

```bash
# User service
cd Services/user && ./mvnw spring-boot:run        # :8081

# Gateway
cd Services/gateway && ./mvnw spring-boot:run     # :8090

# AI Resume Enhancer
cd Services/ai-resume-enhancer
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8083

# Job Matcher
cd Services/JobsService/job_matcher
pip install -e .                                  # or: uv sync
uvicorn job_matcher.api:app --reload --port 8010

# Frontend
cd frontend && npm run dev                        # :3000
```

Running a service outside Docker still needs PostgreSQL, MongoDB, Redis, and Keycloak — start those with `docker-compose up -d postgresql mongodb redis keycloak` and point the service's URLs at `localhost`.

### Tests

```bash
cd Services/user    && ./mvnw test    # context-load test only
cd Services/gateway && ./mvnw test    # context-load test only
```

The Python services ship ad-hoc scripts rather than a suite: `Services/ai-resume-enhancer/test_enhancement_api.py`, `test_complete_api.ps1`, and `test_daily_limit.ps1`. There is no automated test coverage beyond these.

## API reference

All gateway-routed paths are prefixed with `http://localhost:8090`.

### Auth — `/api/v1/auth` (user service)

| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create a user in Keycloak and PostgreSQL |
| POST | `/login` | Exchange credentials for tokens |
| POST | `/refresh` | Refresh an access token |
| POST | `/logout` | Invalidate the session |
| GET | `/me` | Current authenticated user |

```bash
curl -X POST http://localhost:8090/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123!","firstName":"John","lastName":"Doe","consentAiProcessing":true}'
```

Registration uses a **compensation pattern**: if the PostgreSQL insert fails after the Keycloak user is created, the Keycloak user is deleted so the two stores stay consistent.

### Users — `/api/v1/users` (user service, authenticated)

| Method | Path | Description |
|---|---|---|
| GET | `/profile` | Current user's profile |
| PUT | `/profile` | Update profile |
| DELETE | `/profile` | Delete own account (GDPR) |
| GET | `/profile/export` | Export own data (GDPR) |
| PUT | `/profile/consent` | Update AI processing consent |
| GET | `/` | List users (admin) |
| GET | `/{userId}` | Fetch a user (admin) |
| DELETE | `/{userId}` | Delete a user (admin) |
| PUT | `/{userId}/activate` | Activate a user (admin) |
| PUT | `/{userId}/deactivate` | Deactivate a user (admin) |

### Admin — `/api/v1/admin` (user service, admin role)

| Method | Path | Description |
|---|---|---|
| POST | `/cleanup/orphaned` | Remove Keycloak users with no DB row |
| GET | `/consistency/check` | Compare Keycloak and PostgreSQL |
| GET | `/health` | Service health detail |

A scheduled `UserCleanupService` also runs this reconciliation automatically.

### Resume — AI Resume Enhancer (`http://localhost:8083`)

| Method | Path | Description |
|---|---|---|
| POST | `/api/resume/upload` | Upload a PDF; `?enhance=true` to enhance inline. `X-User-Id` header identifies the user |
| POST | `/api/resume/{resume_id}/enhance` | Enhance a stored resume |
| POST | `/api/resumes/{resume_id}/enhance` | Section-level enhancement |
| GET | `/api/resume/{resume_id}` | Fetch a parsed resume |
| GET | `/api/resume/{resume_id}/latest` | Latest version |
| GET | `/api/resume/{resume_id}/versions` | Version history |
| GET | `/api/resume/{resume_id}/cv-data` | Job-matcher-compatible CV payload |
| GET | `/api/resume/user/{user_id}/latest-cv` | Latest CV for a user (`?use_enhanced=true`) |
| POST | `/api/resume/recommendations` | Store job-specific recommendations |
| GET | `/api/resume/recommendations/{id}` | Fetch one recommendation set |
| GET | `/api/resume/recommendations/user/{user_id}` | All recommendations for a user |
| GET | `/api/resume/recommendations/resume/{resume_id}` | All for a resume |
| POST | `/api/resume/recommendations/{id}/apply` | Apply recommendations to a resume |
| DELETE | `/api/resume/recommendations/{id}` | Delete a recommendation set |
| GET | `/api/user/tier` | Subscription tier |
| GET | `/api/user/usage` | Remaining enhancement quota |
| GET | `/healthz` | Health check |
| GET | `/metrics` | Prometheus metrics |

### Jobs — Job Matcher (`/api/v1/jobs`, or `http://localhost:8010` directly)

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/jobs/match` | Start a match. Returns `202` with a `request_id` |
| GET | `/api/v1/jobs/match/{request_id}` | Poll status and result |
| GET | `/api/v1/jobs/match` | List requests (`?user_id=&limit=`) |
| DELETE | `/api/v1/jobs/match/{request_id}` | Delete a request |
| GET | `/api/v1/jobs/config` | Effective configuration (debug) |
| GET | `/health` | Health plus dependency status |

```bash
# Start a match — CV is fetched from the resume service
curl -X POST http://localhost:8090/api/v1/jobs/match \
  -H "Content-Type: application/json" \
  -d '{"user_id":"user_123","job_url":"https://example.com/jobs/123"}'

# Poll
curl http://localhost:8090/api/v1/jobs/match/<request_id>
```

Pass `cv_data` inline in the request body to skip the resume-service lookup entirely.

## Rate limiting

Two independent layers.

**Gateway** — Redis token bucket, per route (`Services/gateway/src/main/resources/application.yml`):

| Route | Replenish rate | Burst capacity |
|---|---|---|
| `/api/v1/auth/**` | 5 req/sec | 10 |
| `/api/v1/users/**` | 10 req/sec | 20 |
| `/api/v1/profile/**` | 20 req/sec | 40 |
| `/api/v1/jobs/**` | 5 req/sec | 10 |
| `/api/v1/resumes/**` | 3 req/sec | 5 |
| `/actuator/**` | 50 req/sec | 100 |

Circuit breakers (Resilience4j) wrap the auth, user, jobs, and resume routes with a 50% failure threshold; the two AI routes wait 30s before probing again instead of the default 10s. Trips forward to `/fallback/*`.

**Resume service** — per-user monthly enhancement quotas by tier, plus a daily cap, tracked in Redis (`Services/ai-resume-enhancer/app/middleware/rate_limiter.py`):

| Tier | Enhancements / month |
|---|---|
| free | 3 |
| basic | 10 |
| premium | 50 |
| enterprise | unlimited |

Daily cap: 10 section-level enhancements. If Redis is unreachable, quota enforcement is silently skipped.

Inspect the gateway's buckets:

```bash
docker exec ms-redis redis-cli KEYS "*rate*"
docker exec -it ms-redis redis-cli MONITOR
```

## Repository layout

```
.
├── docker-compose.yml              # full stack (gitignored — see Known gaps)
├── init-scripts/
│   └── 01-init-databases.sql       # creates user_db and keycloak databases
├── Services/
│   ├── gateway/                    # Spring Cloud Gateway
│   ├── user/                       # Spring Boot user service
│   ├── config-server/              # Spring Cloud Config (not wired into Compose)
│   ├── ai-resume-enhancer/         # FastAPI resume parsing + enhancement
│   │   ├── app/api/                # upload, enhance, cv_data, job_recommendations, user
│   │   ├── app/services/           # groq_client, ats_scoring, embeddings, crew_agents
│   │   └── app/middleware/         # rate_limiter, request_id
│   └── JobsService/job_matcher/    # FastAPI + CrewAI job matching
│       └── src/job_matcher/
│           ├── api.py              # FastAPI surface
│           ├── main.py             # JobMatcherFlow (CrewAI Flow)
│           └── crews/Job_Matcher/  # agents.yaml, tasks.yaml, crew definition
├── frontend/                       # Next.js 14 app
│   ├── pages/                      # index, auth/signin, dashboard, job-matcher, resume/*
│   ├── components/                 # dashboard, job-matcher, resume, ui
│   └── lib/hooks/                  # useProfile, useResumes, useDarkMode
└── docs/
```

### Further reading

- [`JOB_MATCHER_SETUP.md`](JOB_MATCHER_SETUP.md) — job matcher integration walkthrough
- [`frontend/SETUP_GUIDE.md`](frontend/SETUP_GUIDE.md) — Keycloak and Google OAuth2 setup
- [`Services/ai-resume-enhancer/API_REFERENCE.md`](Services/ai-resume-enhancer/API_REFERENCE.md) — detailed resume API
- [`Services/JobsService/job_matcher/INTEGRATION_GUIDE.md`](Services/JobsService/job_matcher/INTEGRATION_GUIDE.md) — resume ↔ job matcher contract

## Troubleshooting

**Keycloak never becomes healthy.** It boots against PostgreSQL and can take 2–3 minutes on first run. Check with `docker logs keycloak-ms1 --tail 50`. If PostgreSQL is not healthy, the `keycloak` database from `init-scripts/` was not created — `docker-compose down -v` and start again.

**Gateway returns 503.** A circuit breaker is open or a downstream service is down. Check `curl http://localhost:8090/actuator/health` and `docker logs ms_gateway --tail 50`.

**Rate limiting not applied.** `docker exec ms-redis redis-cli ping` should return `PONG`. Without Redis the gateway's limiter cannot operate.

**Job match stuck on `processing`.** Check `docker logs ms_job_matcher -f`. Most failures are a missing or exhausted `FIRECRAWL_API_KEY`, or a job URL Firecrawl cannot reach. `GET /api/v1/jobs/config` reports which keys the service actually sees.

**Job match returns 503 "Resume service not available".** Either `RESUME_SERVICE_ENABLED` is false, or the user has no uploaded resume. Upload one first, or pass `cv_data` inline.

**Frontend cannot reach a service.** The resume and job-matcher pages bypass the gateway — confirm `NEXT_PUBLIC_RESUME_SERVICE_URL` and `NEXT_PUBLIC_JOB_MATCHER_URL` are set in `.env.local`, and restart `npm run dev` after editing it.

**Port already in use.**

```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process -Force
```

```bash
lsof -ti:8080 | xargs kill -9
```

**Reset everything.**

```bash
docker-compose down -v && docker-compose up -d --build
```

## Known gaps

Current state of the project, stated plainly:

- **`docker-compose.yml` is gitignored.** A fresh clone will not contain it, so the stack cannot be started from the repository alone. It needs to be committed, with secrets moved out to `.env`.
- **A Keycloak client secret is hardcoded** in `docker-compose.yml` and in `frontend/.env.local.example`. Both should be rotated and read from the environment.
- **Job match results are in-memory.** `job_match_results` in `Services/JobsService/job_matcher/src/job_matcher/api.py` is a plain dict — results are lost on restart, and the service cannot be scaled horizontally. `MONGODB_URI` is configured but unused for this.
- **No LICENSE file**, despite the project being described as MIT elsewhere.
- **Health endpoints disagree.** Compose healthchecks the resume service at `/health`, but `app/main.py` only exposes `/healthz`, so that container never reports healthy.
- **`NEXT_PUBLIC_AI_RESUME_ENHANCER_API_URL` defaults to port 8082** in `frontend/pages/resume/upload_new.tsx`, which is Mongo Express. It should be 8083.
- **Test coverage is effectively nil** — the Java modules have context-load tests only, and the Python services have manual scripts.
- **CORS is `*`** on the job matcher, and the gateway's own security config is permissive. Both need tightening before any deployment.
- **`Services/config-server` is unused** — either wire it into Compose or remove it.
