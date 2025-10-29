# 🚀 AI-Powered Career Platform - Microservices Architecture

> **An intelligent career platform leveraging AI to enhance resumes, match job opportunities, and provide personalized career insights.**

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688.svg)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Features Implemented](#-features-implemented)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Development Setup](#-development-setup)
- [Testing](#-testing)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Overview

The AI-Powered Career Platform is a **microservices-based** application designed to help job seekers create professional resumes with AI assistance, find matching job opportunities, and receive personalized career insights. The platform emphasizes **security**, **privacy (GDPR compliance)**, and **scalability**.

### Key Highlights

- 🔐 **Enterprise Security**: JWT authentication, Keycloak integration, OAuth2 flows
- 🛡️ **Rate Limiting**: Redis-backed rate limiting (5-10 req/sec) to protect resources
- 🔄 **Compensation Pattern**: Automatic rollback handling for distributed transactions
- 🚪 **API Gateway**: Spring Cloud Gateway with circuit breakers and fallback mechanisms
- 📊 **Monitoring**: Comprehensive audit logging and health checks
- 🌐 **CORS Handling**: Proper cross-origin configuration for frontend-backend communication

---

## 🏗️ System Architecture

### Current Implementation (✅ Completed)

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    Next.js 14 (React 18)                         │
│  - Custom Sign In/Sign Up Forms                                 │
│  - Session Management (NextAuth.js)                             │
│  - Profile Dashboard                                             │
│  - Real-time Error Handling                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Port 8090)                     │
│                  Spring Cloud Gateway 4.1.0                      │
│  ✅ Request Routing (Path-based)                                │
│  ✅ Rate Limiting (Redis-backed)                                │
│  ✅ Circuit Breaker (Resilience4j)                              │
│  ✅ CORS Configuration                                          │
│  ✅ Health Checks & Monitoring                                  │
└─────────────────────────────────────────────────────────────────┘
            ↓                    ↓                    ↓
┌─────────────────┐  ┌──────────────────────┐  ┌──────────────────┐
│  USER SERVICE   │  │   RESUME SERVICE     │  │   JOBS SERVICE   │
│ (Spring Boot)   │  │   (FastAPI/Python)   │  │ (FastAPI/Python) │
│  ✅ Port 8081   │  │   📅 Coming Soon     │  │   📅 Coming Soon │
│                 │  │                      │  │                  │
│ ✅ User CRUD    │  │ 📋 Resume CRUD       │  │ 🔍 Job Listings  │
│ ✅ JWT Auth     │  │ 📄 PDF Upload/Parse  │  │ 🎯 Job Matching  │
│ ✅ Keycloak     │  │ 🤖 AI Enhancement    │  │ 🤖 CrewAI Agents │
│ ✅ Registration │  │    (Groq API)        │  │ 💡 Career Insight│
│ ✅ Email Verify │  │ 📊 ATS Scoring       │  │                  │
│ ✅ GDPR Ready   │  │ 📝 Real-time Feedback│  │                  │
│ ✅ Audit Logs   │  │                      │  │                  │
│ ✅ Cleanup Jobs │  │                      │  │                  │
└─────────────────┘  └──────────────────────┘  └──────────────────┘
         ↓                      ↓                        ↓
┌─────────────────┐  ┌──────────────────────┐  ┌──────────────────┐
│   PostgreSQL    │  │      MongoDB         │  │     MongoDB      │
│   (Port 5432)   │  │   (Port 27017)       │  │  (Port 27018)    │
│   ✅ Running    │  │   📅 Coming Soon     │  │  📅 Coming Soon  │
│                 │  │                      │  │                  │
│ Tables:         │  │ Collections:         │  │ Collections:     │
│ ✅ users        │  │ - resumes            │  │ - jobs           │
│ ✅ user_tokens  │  │ - ai_analysis        │  │ - job_matches    │
│ ✅ audit_logs   │  │ - resume_versions    │  │ - master_skills  │
└─────────────────┘  └──────────────────────┘  └──────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    SUPPORTING SERVICES                           │
├─────────────────────────────────────────────────────────────────┤
│  ✅ Keycloak (Port 8080) - Identity & Access Management         │
│  ✅ Redis (Port 6379) - Rate Limiting & Caching                 │
│  ✅ MongoDB (Port 27017) - Resume Data (Coming Soon)            │
│  ✅ PgAdmin (Port 5050) - PostgreSQL Admin UI                   │
│  ✅ Mongo Express (Port 8082) - MongoDB Admin UI (Coming Soon)  │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Diagram

![Architecture Diagram](docs/architecture-diagram.png)

> **Generate this diagram using [Eraser.io](https://app.eraser.io/) with the prompt below** 👇

<details>
<summary><b>📐 Click to view Eraser.io Prompt</b></summary>

```
Create a professional microservices architecture diagram for an AI-Powered Career Platform with the following components:

FRONTEND LAYER (Top):
- Next.js 14 Application (React 18)
- Components: Custom Sign In/Up Forms, Session Management (NextAuth.js), Profile Dashboard
- Port: 3000
- Color: Blue gradient

API GATEWAY LAYER (Middle-Top):
- Spring Cloud Gateway
- Features: Request Routing, Rate Limiting (Redis-backed), Circuit Breaker (Resilience4j), CORS, Health Checks
- Port: 8090
- Color: Green

MICROSERVICES LAYER (Middle):
1. User Service (Spring Boot 3.2)
   - Port: 8081
   - Features: User CRUD, JWT Auth, Keycloak Integration, Registration, Email Verification, GDPR Endpoints, Audit Logging
   - Status: Implemented ✓
   - Color: Orange

2. Resume Service (FastAPI/Python)
   - Port: 8082 (planned)
   - Features: Resume CRUD, PDF Upload/Parse, AI Enhancement (Groq API), ATS Scoring, Real-time Feedback
   - Status: Coming Soon
   - Color: Purple (dashed border)

3. Jobs Service (FastAPI/Python)
   - Port: 8083 (planned)
   - Features: Job Listings, Job Matching, CrewAI Agents, Career Insights
   - Status: Coming Soon
   - Color: Teal (dashed border)

DATABASE LAYER (Bottom):
1. PostgreSQL (Port 5432)
   - Tables: users, user_tokens, audit_logs
   - Connected to: User Service
   - Status: Implemented ✓
   - Color: Blue

2. MongoDB (Port 27017)
   - Collections: resumes, ai_analysis, resume_versions
   - Connected to: Resume Service
   - Status: Planned
   - Color: Green (dashed border)

3. MongoDB (Port 27018)
   - Collections: jobs, job_matches, master_skills
   - Connected to: Jobs Service
   - Status: Planned
   - Color: Green (dashed border)

SUPPORTING SERVICES (Side Panel):
- Keycloak (Port 8080) - Identity Management - Implemented ✓
- Redis (Port 6379) - Rate Limiting & Caching - Implemented ✓
- PgAdmin (Port 5050) - PostgreSQL UI - Implemented ✓
- Mongo Express (Port 8082) - MongoDB UI - Planned

SECURITY LAYER (Overlay/Annotations):
- HTTPS/TLS everywhere
- JWT Token Flow (Frontend → Gateway → Services)
- Rate Limiting: 5 req/sec (Auth), 10 req/sec (User Management)
- CORS: localhost:3000 allowed
- Circuit Breaker: Fallback endpoints configured

DATA FLOWS (Arrows):
1. User Registration Flow: Frontend → Gateway → User Service → Keycloak → PostgreSQL
2. AI Enhancement Flow (future): Frontend → Gateway → Resume Service → Groq API → MongoDB
3. Job Matching Flow (future): Frontend → Gateway → Jobs Service → CrewAI → MongoDB

ANNOTATIONS:
- Show token bucket algorithm for rate limiting
- Indicate compensation pattern for distributed transactions
- Mark GDPR compliance endpoints
- Highlight audit logging flow

STYLE:
- Modern, clean design
- Use icons for services (Docker, Spring Boot, Next.js, FastAPI, PostgreSQL, MongoDB, Redis, Keycloak)
- Color-coded by implementation status (green for implemented, gray/dashed for planned)
- Show port numbers clearly
- Include security badges (JWT, OAuth2, HTTPS)
```

</details>

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Authentication**: NextAuth.js (Keycloak Provider + Credentials Provider)
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS (recommended for future)
- **Language**: TypeScript

### Backend - User Service
- **Framework**: Spring Boot 3.2
- **Language**: Java 17
- **Security**: Spring Security, JWT, Keycloak Admin Client
- **Database**: PostgreSQL 15
- **ORM**: Hibernate/JPA
- **Build Tool**: Maven

### Backend - API Gateway
- **Framework**: Spring Cloud Gateway 4.1.0
- **Rate Limiting**: Redis (Lettuce driver)
- **Circuit Breaker**: Resilience4j
- **Monitoring**: Spring Boot Actuator

### Future Services (Resume & Jobs)
- **Framework**: FastAPI (Python 3.11+)
- **AI Integration**: Groq API (Llama 3.1)
- **Agent Framework**: CrewAI (optional)
- **Database**: MongoDB 7.0

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Identity Management**: Keycloak 24.0.2
- **Caching**: Redis 7 Alpine
- **Databases**: PostgreSQL 15 Alpine, MongoDB 7 (planned)
- **Admin Tools**: PgAdmin 4, Mongo Express (planned)

---

## ✨ Features Implemented

### ✅ User Authentication & Authorization
- Custom sign-up/sign-in forms (Frontend → Backend → Keycloak)
- JWT-based authentication with Keycloak
- OAuth2 integration (Google sign-in ready)
- Session management with NextAuth.js
- Email verification (SMTP configurable)
- Secure password hashing (bcrypt)

### ✅ API Gateway
- Request routing to microservices
- **Rate Limiting**:
  - Auth endpoints: 5 req/sec, burst capacity 10
  - User management: 10 req/sec, burst capacity 20
  - IP-based rate limiting with Redis
- **Circuit Breaker**: Automatic fallback for failed services
- **CORS**: Configured for localhost:3000
- Health checks and monitoring

### ✅ User Service
- User CRUD operations
- Keycloak user synchronization
- **Compensation Pattern**: Automatic rollback for failed registrations
- **Cleanup Service**: Scheduled orphaned user cleanup
- Admin endpoints for data consistency checks
- Audit logging for all actions
- GDPR-ready (data export/delete endpoints ready)

### ✅ Data Consistency
- Automatic Keycloak user cleanup on database failure
- Transaction management with compensation
- Scheduled consistency verification
- Manual admin cleanup tools

### ✅ Security
- JWT token validation at Gateway level
- Keycloak integration for identity management
- CORS protection
- Rate limiting to prevent abuse
- Audit logging for compliance
- Secure Docker networking

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Docker Desktop** 4.20+ ([Download](https://www.docker.com/products/docker-desktop/))
- **Docker Compose** 2.20+ (included with Docker Desktop)
- **Git** 2.40+ ([Download](https://git-scm.com/downloads))
- **Node.js** 18+ and **npm** 9+ ([Download](https://nodejs.org/))
- **Java JDK** 17+ ([Download](https://adoptium.net/))
- **Maven** 3.9+ ([Download](https://maven.apache.org/download.cgi))

### Verify Installation

```bash
# Check Docker
docker --version          # Should show 20.10+
docker-compose --version  # Should show 2.20+

# Check Node.js
node --version            # Should show v18+
npm --version             # Should show 9+

# Check Java
java -version             # Should show 17+
mvn -version              # Should show 3.9+
```

---

## 🚀 Quick Start

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-org/career-platform.git
cd career-platform
```

### 2️⃣ Start Backend Services (Docker Compose)

```bash
# Start all backend services
docker-compose up -d

# Verify all containers are running
docker ps

# Expected containers:
# - keycloak-ms1 (Port 8080)
# - ms_gateway (Port 8090)
# - ms_user_service (Port 8081)
# - ms_sql (PostgreSQL - Port 5432)
# - ms-redis (Port 6379)
# - ms_pgadmin1 (Port 5050)
```

### 3️⃣ Configure Keycloak

```bash
# Access Keycloak Admin Console
# URL: http://localhost:8080/admin
# Username: admin
# Password: admin
```

**Steps:**
1. Create or select the `resume-platform` realm
2. Go to **Clients** → `user-service`
3. Copy the **Client Secret** from the **Credentials** tab
4. Enable **User Registration**:
   - Go to **Realm Settings** → **Login**
   - Enable "User registration"
   - Save

### 4️⃣ Configure Frontend Environment

```bash
cd frontend

# Create .env.local file
cat > .env.local << EOF
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here-generate-with-openssl

# Keycloak Configuration
KEYCLOAK_CLIENT_ID=user-service
KEYCLOAK_CLIENT_SECRET=<paste-from-keycloak>
KEYCLOAK_ISSUER=http://localhost:8080/realms/resume-platform

# Public Variables (accessible in browser)
NEXT_PUBLIC_KEYCLOAK_ISSUER=http://localhost:8080/realms/resume-platform
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=user-service
NEXT_PUBLIC_API_URL=http://localhost:8090
EOF

# Generate NextAuth secret
openssl rand -base64 32
```

### 5️⃣ Start Frontend

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Access at http://localhost:3000
```

### 6️⃣ Verify Setup

```bash
# Test User Service
curl http://localhost:8081/actuator/health
# Expected: {"status":"UP"}

# Test Gateway
curl http://localhost:8090/actuator/health
# Expected: {"status":"UP"}

# Test Rate Limiting
curl -X POST http://localhost:8090/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User","consentAiProcessing":true}'

# Check rate limit headers in response
```

---

## 🔧 Development Setup

### Backend Development (User Service)

```bash
cd Services/user

# Run locally (without Docker)
mvn spring-boot:run

# Run tests
mvn test

# Build
mvn clean package

# Access at http://localhost:8081
```

### Gateway Development

```bash
cd Services/gateway

# Run locally
mvn spring-boot:run

# Access at http://localhost:8090
```

### Frontend Development

```bash
cd frontend

# Run dev server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check
```

---

## 🧪 Testing

### Test Rate Limiting

```powershell
# PowerShell script to test rate limiting
Write-Host "🧪 Testing Rate Limiting Headers"

for ($i = 1; $i -le 5; $i++) {
    $email = "ratetest$i@example.com"
    $response = Invoke-WebRequest -Uri "http://localhost:8090/api/v1/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body "{`"email`": `"$email`", `"password`": `"Test123!`", `"firstName`": `"Rate`", `"lastName`": `"Test`", `"consentAiProcessing`": true}" `
        -UseBasicParsing
    
    Write-Host "Request $i`: Status $($response.StatusCode)"
    Write-Host "  - X-RateLimit-Remaining: $($response.Headers.'X-RateLimit-Remaining')"
    Write-Host "  - X-RateLimit-Burst-Capacity: $($response.Headers.'X-RateLimit-Burst-Capacity')"
    Write-Host ""
}
```

### Test Burst Capacity (25 requests to hit rate limit)

```powershell
Write-Host "🧪 Testing Burst Capacity (25 requests)"

for ($i = 1; $i -le 25; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8090/api/v1/users/profile" `
            -Headers @{'Authorization' = 'Bearer invalid-token'} `
            -UseBasicParsing
        Write-Host "Request $i`: Status $($response.StatusCode)"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 429) {
            Write-Host "Request $i`: Status 429 - Rate Limited! ✓"
        } else {
            Write-Host "Request $i`: Status $statusCode"
        }
    }
}
```

### Monitor Redis Rate Limiting

```bash
# Monitor Redis commands in real-time
docker exec -it ms-redis redis-cli MONITOR

# Check rate limiting keys
docker exec ms-redis redis-cli KEYS "*rate*"

# Check specific key
docker exec ms-redis redis-cli GET "request_rate_limiter.{user-auth-route.172.23.0.1}.tokens"
```

### Test User Registration Flow

```bash
# 1. Register a new user
curl -X POST http://localhost:8090/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "consentAiProcessing": true
  }'

# Expected: HTTP 201 Created with user details

# 2. Verify user in Keycloak
# Go to http://localhost:8080/admin → Users → Search "newuser@example.com"

# 3. Verify user in PostgreSQL
docker exec -it ms_sql psql -U resume_user -d resume_db -c "SELECT * FROM users WHERE email='newuser@example.com';"

# 4. Sign in on frontend
# Go to http://localhost:3000/auth/signin
# Use email: newuser@example.com, password: SecurePass123!
```

---

## 📚 API Documentation

### User Service Endpoints

#### Authentication

```bash
# Register new user
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "city": "New York",
  "country": "USA",
  "consentAiProcessing": true
}

# Response: 201 Created
{
  "userId": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user"
}
```

#### User Management

```bash
# Get current user profile (requires authentication)
GET /api/v1/users/profile
Authorization: Bearer <jwt-token>

# Response: 200 OK
{
  "id": 1,
  "keycloakId": "uuid-here",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "emailVerified": false,
  "role": "user"
}
```

#### Admin Endpoints

```bash
# Check data consistency (Admin only)
GET /api/v1/admin/consistency/check
Authorization: Bearer <admin-jwt-token>

# Cleanup orphaned users (Admin only)
POST /api/v1/admin/cleanup/orphaned?keycloakId=<uuid>
Authorization: Bearer <admin-jwt-token>

# System health check (Admin only)
GET /api/v1/admin/health
Authorization: Bearer <admin-jwt-token>
```

### Gateway Endpoints

```bash
# Gateway health check
GET /actuator/health

# Gateway metrics
GET /actuator/metrics

# Circuit breaker status
GET /actuator/circuitbreakers
```

### Rate Limiting Configuration

| Route | Replenish Rate | Burst Capacity | Scope |
|-------|----------------|----------------|-------|
| `/api/v1/auth/**` | 5 req/sec | 10 | Per IP |
| `/api/v1/users/**` | 10 req/sec | 20 | Per IP |
| `/api/v1/admin/**` | 2 req/sec | 5 | Per IP |

---

## 🐳 Docker Commands

### Container Management

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart user-service

# View logs
docker-compose logs -f user-service
docker-compose logs -f gateway

# Rebuild and start
docker-compose up -d --build

# Remove volumes (reset databases)
docker-compose down -v
```

### Database Access

```bash
# PostgreSQL CLI
docker exec -it ms_sql psql -U resume_user -d resume_db

# PgAdmin Web UI
# URL: http://localhost:5050
# Email: admin@admin.com
# Password: admin

# Redis CLI
docker exec -it ms-redis redis-cli

# MongoDB CLI (when implemented)
docker exec -it ms_mongo mongosh
```

---

## 🌍 Environment Variables

### Frontend (`.env.local`)

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Keycloak
KEYCLOAK_CLIENT_ID=user-service
KEYCLOAK_CLIENT_SECRET=<from-keycloak-admin>
KEYCLOAK_ISSUER=http://localhost:8080/realms/resume-platform

# Public (accessible in browser)
NEXT_PUBLIC_KEYCLOAK_ISSUER=http://localhost:8080/realms/resume-platform
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=user-service
NEXT_PUBLIC_API_URL=http://localhost:8090
```

### Backend (Docker Compose)

```yaml
# Gateway Service
SPRING_PROFILES_ACTIVE: dev
USER_SERVICE_URL: http://user-service:8081
REDIS_HOST: redis
REDIS_PORT: 6379
KEYCLOAK_ISSUER_URI: http://keycloak:8080/realms/resume-platform

# User Service
SPRING_PROFILES_ACTIVE: dev
KEYCLOAK_SERVER_URL: http://keycloak:8080
KEYCLOAK_REALM: resume-platform
KEYCLOAK_ADMIN_USERNAME: admin
KEYCLOAK_ADMIN_PASSWORD: admin
DATABASE_URL: jdbc:postgresql://postgresql:5432/resume_db
DATABASE_USERNAME: resume_user
DATABASE_PASSWORD: resume_password
```

---

## 🚢 Deployment

### Production Checklist

- [ ] Generate secure secrets (JWT, database passwords)
- [ ] Configure HTTPS/TLS certificates
- [ ] Set up external database (Azure PostgreSQL, MongoDB Atlas)
- [ ] Configure Redis cluster for high availability
- [ ] Set up monitoring (Prometheus, Grafana)
- [ ] Configure logging aggregation (ELK Stack)
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Configure Keycloak with production realm
- [ ] Set up email SMTP for verification
- [ ] Configure CORS for production domain
- [ ] Set up rate limiting based on production load
- [ ] Enable audit logging for compliance
- [ ] Configure backup and disaster recovery

### Azure Deployment (Planned)

```bash
# Azure Container Apps deployment (example)
az containerapp up \
  --name career-platform-gateway \
  --resource-group career-platform-rg \
  --location eastus \
  --image your-registry.azurecr.io/gateway:latest \
  --target-port 8090 \
  --ingress external \
  --query properties.configuration.ingress.fqdn
```

---

## 👥 Contributing

### For Team Members

1. **Clone and Setup**
   ```bash
   git clone https://github.com/your-org/career-platform.git
   cd career-platform
   docker-compose up -d
   cd frontend && npm install && npm run dev
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/resume-service
   ```

3. **Development Workflow**
   - Make your changes
   - Test locally
   - Commit with descriptive messages
   - Push and create Pull Request

4. **Coding Standards**
   - Follow existing code style
   - Write unit tests for new features
   - Update documentation
   - Run linters before committing

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Production hotfixes

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process -Force

# Linux/Mac
lsof -ti:8080 | xargs kill -9
```

#### 2. Docker Container Won't Start

```bash
# Check logs
docker logs ms_user_service
docker logs ms_gateway

# Recreate containers
docker-compose down -v
docker-compose up -d --build
```

#### 3. Frontend Can't Connect to Backend

```bash
# Verify API URL in .env.local
echo $NEXT_PUBLIC_API_URL  # Should be http://localhost:8090

# Test gateway directly
curl http://localhost:8090/actuator/health

# Restart frontend dev server
npm run dev
```

#### 4. Rate Limiting Not Working

```bash
# Check Redis connection
docker exec ms-redis redis-cli ping
# Expected: PONG

# Monitor Redis commands
docker exec -it ms-redis redis-cli MONITOR

# Check Gateway logs
docker logs ms_gateway --tail 50 | grep -i "rate"
```

#### 5. Keycloak Authentication Fails

```bash
# Verify Keycloak is running
curl http://localhost:8080/health
# Expected: {"status":"UP"}

# Check client secret in .env.local matches Keycloak
# Go to Keycloak Admin → Clients → user-service → Credentials

# Verify issuer URL
# Should be: http://localhost:8080/realms/resume-platform
```

#### 6. Database Connection Issues

```bash
# Test PostgreSQL connection
docker exec ms_sql psql -U resume_user -d resume_db -c "SELECT 1;"

# Check user service logs
docker logs ms_user_service | grep -i "database"

# Verify environment variables
docker exec ms_user_service printenv | grep DATABASE
```

---

## 📖 Additional Resources

- [Spring Cloud Gateway Documentation](https://spring.io/projects/spring-cloud-gateway)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Redis Rate Limiting](https://redis.io/docs/manual/patterns/rate-limiting/)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Spring Boot Team for excellent microservices framework
- Keycloak for comprehensive identity management
- Next.js Team for powerful React framework
- Redis Team for blazing-fast caching

---

## 📞 Contact

For questions or support, please reach out to:

- **Project Lead**: [Your Name](mailto:your.email@example.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/career-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/career-platform/discussions)

---

<div align="center">

**Made with ❤️ by the Career Platform Team**

⭐ Star us on GitHub — it helps!

</div>

