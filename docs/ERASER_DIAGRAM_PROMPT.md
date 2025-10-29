# 🎨 Architecture Diagram Generator - Eraser.io Prompt

Use this prompt in [Eraser.io](https://app.eraser.io/) to generate a professional architecture diagram for the Career Platform.

---

## 📋 How to Use

1. Go to [Eraser.io](https://app.eraser.io/)
2. Click "New Diagram"
3. Select "AI Diagram" or use the prompt feature
4. Copy and paste the prompt below
5. Click "Generate"
6. Refine and export as PNG/SVG

---

## 🎯 Eraser.io Diagram Code (Paste Directly)

**Copy and paste this code directly into [Eraser.io](https://app.eraser.io/) → New Diagram → Diagram as Code**

```eraser
// AI-Powered Career Platform - Microservices Architecture

title AI-Powered Career Platform - Microservices Architecture

// Frontend Layer
Frontend [icon: nextjs, color: blue] {
  Next.js 14 (React 18)
  Port: 3000
  Status: ✅ IMPLEMENTED
  
  Components:
  - Custom Sign In/Up Forms
  - Session Management (NextAuth.js)
  - Profile Dashboard
  - Real-time Error Handling
}

// API Gateway Layer
API Gateway [icon: api, color: green] {
  Spring Cloud Gateway 4.1.0
  Port: 8090
  Status: ✅ IMPLEMENTED
  
  Features:
  - Request Routing
  - Rate Limiting (Redis)
    • Auth: 5 req/sec, burst 10
    • Users: 10 req/sec, burst 20
  - Circuit Breaker (Resilience4j)
  - CORS Configuration
  - Health Checks
}

// Microservices Layer
User Service [icon: spring, color: orange] {
  Spring Boot 3.2 (Java 17)
  Port: 8081
  Status: ✅ IMPLEMENTED
  
  Features:
  ✅ User CRUD
  ✅ JWT Auth
  ✅ Keycloak Integration
  ✅ Registration & Email Verify
  ✅ GDPR Endpoints
  ✅ Audit Logging
  ✅ Compensation Pattern
  ✅ Cleanup Jobs
}

Resume Service [icon: python, color: purple, style: dashed] {
  FastAPI (Python 3.11+)
  Port: 8082
  Status: 📅 COMING SOON
  
  Planned Features:
  📋 Resume CRUD
  📄 PDF Upload/Parse
  🤖 AI Enhancement (Groq)
  📊 ATS Scoring
  📝 Real-time Feedback
}

Jobs Service [icon: python, color: teal, style: dashed] {
  FastAPI (Python 3.11+)
  Port: 8083
  Status: 📅 COMING SOON
  
  Planned Features:
  🔍 Job Listings
  🎯 Job Matching
  🤖 CrewAI Agents
  💡 Career Insights
}

// Database Layer
PostgreSQL [icon: database, color: blue] {
  Version: 15 Alpine
  Port: 5432
  Status: ✅ IMPLEMENTED
  
  Tables:
  - users
  - user_tokens
  - audit_logs
  - consent_data
  
  🔒 TDE Enabled
}

MongoDB Resume [icon: database, color: green, style: dashed] {
  Version: 7.0
  Port: 27017
  Status: 📅 PLANNED
  
  Collections:
  - resumes
  - ai_analysis
  - resume_versions
  - templates
  
  🔒 At-rest Encryption
}

MongoDB Jobs [icon: database, color: green, style: dashed] {
  Version: 7.0
  Port: 27018
  Status: 📅 PLANNED
  
  Collections:
  - jobs
  - job_matches
  - master_skills
  - user_preferences
}

// Supporting Services
Keycloak [icon: security, color: red] {
  Port: 8080
  Status: ✅ IMPLEMENTED
  
  Identity & Access Management
  - OAuth2 Provider
  - User Management
  - JWT Token Issuance
  - Role Management
}

Redis [icon: redis, color: red] {
  Version: 7 Alpine
  Port: 6379
  Status: ✅ IMPLEMENTED
  
  Rate Limiting & Caching
  - Token Bucket Algorithm
  - Request Counting
  - Session Caching
}

Groq AI [icon: cloud, color: purple, style: dashed] {
  External Service
  
  Llama 3.1 70B
  - Content Enhancement
  - ATS Analysis
  - Smart Rewrite
}

// Connections - User Registration Flow
Frontend > API Gateway: HTTPS
API Gateway > User Service: Route /api/v1/auth/**
User Service > Keycloak: Create User
User Service > PostgreSQL: Save User
Keycloak <> User Service: JWT Validation

// Connections - Rate Limiting Flow
API Gateway <> Redis: Check Rate Limit
API Gateway > User Service: Forward if allowed

// Connections - Future AI Flow (dashed)
API Gateway ..> Resume Service: Route /api/v1/resumes/**
Resume Service ..> Groq AI: AI Enhancement Request
Resume Service ..> MongoDB Resume: Save Resume

API Gateway ..> Jobs Service: Route /api/v1/jobs/**
Jobs Service ..> MongoDB Jobs: Query Jobs

// Security Annotations
note "Security Layer" [color: yellow] {
  🔐 Authentication:
  - JWT Tokens
  - OAuth2 (Keycloak)
  - bcrypt Password Hashing
  
  🛡️ Protection:
  - HTTPS/TLS
  - Rate Limiting (Redis)
  - CORS
  - Input Validation
  - Audit Logging
  
  📋 GDPR Compliance:
  - Consent Management
  - Data Deletion API
  - Data Export API
  - Encryption at Rest
}

// Compensation Pattern Detail
note "Compensation Pattern" [color: orange] {
  Distributed Transaction Handling:
  
  1. Create user in Keycloak ✓
  2. Try to save in PostgreSQL
     → If SUCCESS: Complete ✓
     → If FAILURE: Delete from Keycloak
  
  Benefits:
  • Prevents orphaned users
  • Automatic rollback
  • Data consistency guaranteed
}

// Rate Limiting Detail
note "Rate Limiting Configuration" [color: green] {
  Token Bucket Algorithm (Redis)
  
  Auth Endpoints (/api/v1/auth/**):
  - Replenish: 5 req/sec
  - Burst: 10 requests
  
  User Management (/api/v1/users/**):
  - Replenish: 10 req/sec
  - Burst: 20 requests
  
  IP-based rate limiting
  HTTP 429 when limit exceeded
}

// Deployment Note
note "Deployment" [color: blue] {
  Current: 🐳 Docker Compose
  - All services containerized
  - Development environment
  
  Future: ☁️ Azure
  - Container Apps
  - Managed PostgreSQL
  - Cosmos DB (MongoDB API)
  - Azure Cache (Redis)
  - Key Vault (Secrets)
}
```

---

## 🎨 Alternative: Visual Prompt for AI Generation

If you prefer using Eraser's AI generation feature, use this natural language prompt:

```
Create a professional microservices architecture diagram for an "AI-Powered Career Platform" with these specifications:

LAYOUT: Top-to-bottom flow with 4 main layers

====================
LAYER 1: CLIENT LAYER (Top)
====================

Component: FRONTEND
- Technology: Next.js 14 (React 18)
- Port: 3000 (localhost)
- Icon: Browser/Next.js logo
- Color: Blue (#0070F3)
- Status: ✅ IMPLEMENTED

Sub-components inside Frontend:
  • Custom Sign In/Sign Up Forms
  • Session Management (NextAuth.js)
  • Profile Dashboard
  • Real-time Error Handling
  • OAuth2 Integration

Connection: Solid arrow DOWN labeled "HTTPS" to API Gateway

====================
LAYER 2: API GATEWAY LAYER
====================

Component: API GATEWAY
- Technology: Spring Cloud Gateway 4.1.0
- Port: 8090
- Icon: Gateway/Router icon
- Color: Green (#10B981)
- Status: ✅ IMPLEMENTED

Features (display as tags/badges):
  • Request Routing
  • Rate Limiting (Redis)
    - Auth: 5 req/sec, burst 10
    - Users: 10 req/sec, burst 20
  • Circuit Breaker (Resilience4j)
  • CORS Configuration
  • Health Checks

Connections: 
- Arrow DOWN to User Service (solid, green)
- Arrow DOWN to Resume Service (dashed, gray)
- Arrow DOWN to Jobs Service (dashed, gray)

====================
LAYER 3: MICROSERVICES LAYER
====================

Component 1: USER SERVICE
- Technology: Spring Boot 3.2 (Java 17)
- Port: 8081
- Icon: User/Shield icon
- Color: Orange (#F97316)
- Status: ✅ IMPLEMENTED
- Border: Solid green

Features:
  ✅ User CRUD Operations
  ✅ JWT Authentication
  ✅ Keycloak Integration
  ✅ User Registration
  ✅ Email Verification
  ✅ GDPR Endpoints (Export/Delete)
  ✅ Audit Logging
  ✅ Compensation Pattern
  ✅ Cleanup Jobs

Connection: Arrow DOWN to PostgreSQL (solid)

---

Component 2: RESUME SERVICE
- Technology: FastAPI (Python 3.11+)
- Port: 8082 (planned)
- Icon: Document/PDF icon
- Color: Purple (#A855F7)
- Status: 📅 COMING SOON
- Border: Dashed gray

Planned Features:
  📋 Resume CRUD
  📄 PDF Upload/Parse (PyMuPDF)
  🤖 AI Enhancement (Groq API)
  📊 ATS Scoring
  📝 Real-time Feedback
  🔄 Version Control

External Integration:
  Sub-component: Groq AI (Llama 3.1)
    - Content Enhancement
    - ATS Analysis
    - Smart Rewrite
  (Draw this as a cloud/external service connected to Resume Service)

Connection: Arrow DOWN to MongoDB (dashed)

---

Component 3: JOBS SERVICE
- Technology: FastAPI (Python 3.11+)
- Port: 8083 (planned)
- Icon: Briefcase/Job icon
- Color: Teal (#14B8A6)
- Status: 📅 COMING SOON
- Border: Dashed gray

Planned Features:
  🔍 Job Listings
  🎯 Job Matching Algorithm
  🤖 CrewAI Multi-Agent System
  💡 Career Insights
  📈 Skill Gap Analysis

Optional Integration:
  Sub-component: CrewAI Agents
    - Resume Analyzer Agent
    - Job Matcher Agent
    - Insights Generator Agent
  (Draw as nested components)

Connection: Arrow DOWN to MongoDB (dashed)

====================
LAYER 4: DATABASE LAYER
====================

Database 1: PostgreSQL
- Version: 15 Alpine
- Port: 5432
- Icon: PostgreSQL elephant
- Color: Blue (#336791)
- Status: ✅ IMPLEMENTED

Tables (show as list):
  • users
  • user_tokens
  • audit_logs
  • consent_data

Encryption: TDE enabled (show badge)

---

Database 2: MongoDB (Resume DB)
- Version: 7.0
- Port: 27017 (planned)
- Icon: MongoDB leaf
- Color: Green (#47A248)
- Status: 📅 PLANNED

Collections (show as list):
  • resumes
  • ai_analysis
  • resume_versions
  • templates

Encryption: At-rest enabled (show badge)

---

Database 3: MongoDB (Jobs DB)
- Version: 7.0
- Port: 27018 (planned)
- Icon: MongoDB leaf
- Color: Green (#47A248)
- Status: 📅 PLANNED

Collections (show as list):
  • jobs
  • job_matches
  • master_skills
  • user_preferences

====================
SIDE PANEL: SUPPORTING SERVICES
====================

Supporting Service 1: KEYCLOAK
- Port: 8080
- Icon: Key/Shield icon
- Color: Red (#DC2626)
- Status: ✅ IMPLEMENTED
- Purpose: Identity & Access Management
- Features:
  • OAuth2 Provider
  • User Management
  • JWT Token Issuance
  • Role Management

Connection: Bidirectional arrow to User Service (solid)

---

Supporting Service 2: REDIS
- Version: 7 Alpine
- Port: 6379
- Icon: Redis logo
- Color: Red (#DC2626)
- Status: ✅ IMPLEMENTED
- Purpose: Rate Limiting & Caching

Uses:
  • Token bucket algorithm
  • Request counting
  • Session caching

Connection: Bidirectional arrow to API Gateway (solid)

---

Supporting Service 3: PGADMIN
- Port: 5050
- Icon: Database admin icon
- Color: Blue (#3B82F6)
- Status: ✅ IMPLEMENTED
- Purpose: PostgreSQL Admin UI

---

Supporting Service 4: MONGO EXPRESS
- Port: 8082 (planned)
- Icon: Database admin icon
- Color: Green (#22C55E)
- Status: 📅 PLANNED
- Purpose: MongoDB Admin UI

====================
SECURITY OVERLAY (Top-right annotation box)
====================

Title: SECURITY MEASURES

Authentication:
  🔐 JWT Tokens
  🔐 OAuth2 with Keycloak
  🔐 bcrypt Password Hashing

Privacy (GDPR):
  ✅ Consent Management
  ✅ Data Deletion API
  ✅ Data Export API
  ✅ Encryption at Rest
  ✅ Anonymized AI Processing

Security:
  🛡️ HTTPS/TLS Everywhere
  🛡️ Input Validation
  🛡️ Rate Limiting (Redis)
  🛡️ Audit Logging
  🛡️ CORS Protection

====================
DATA FLOWS (Annotated arrows)
====================

Flow 1: USER REGISTRATION
Path: Frontend → Gateway → User Service → Keycloak → PostgreSQL
Annotation: "1. Register → 2. Verify → 3. Create in Keycloak → 4. Save to DB"
Arrow style: Solid, numbered steps

Flow 2: JWT VALIDATION (Security flow)
Path: Frontend → Gateway → User Service → Keycloak (JWT validation)
Annotation: "Token validation on every request"
Arrow style: Dashed, orange

Flow 3: AI ENHANCEMENT (Future)
Path: Frontend → Gateway → Resume Service → Groq API → MongoDB
Annotation: "Real-time AI feedback (2s debounce)"
Arrow style: Dashed, purple

Flow 4: RATE LIMITING CHECK
Path: Gateway → Redis (check) → Service
Annotation: "Token bucket: 5-10 req/sec per IP"
Arrow style: Dotted, red

====================
COMPENSATION PATTERN DETAIL (Bottom-right annotation)
====================

Title: DISTRIBUTED TRANSACTION HANDLING

Sequence diagram style annotation:
1. Create user in Keycloak ✓
2. Try to save in PostgreSQL
   - If SUCCESS: Complete ✓
   - If FAILURE: Delete from Keycloak (compensation)

Benefits:
  • Prevents orphaned users
  • Automatic rollback
  • Data consistency

====================
DEPLOYMENT NOTE (Bottom banner)
====================

Current Deployment:
  🐳 Docker Compose (Development)
  📦 All services containerized

Future Deployment (Planned):
  ☁️ Azure Container Apps
  ☁️ Azure PostgreSQL (Managed)
  ☁️ Azure Cosmos DB (MongoDB API)
  ☁️ Azure Cache for Redis
  ☁️ Azure Key Vault (Secrets)

====================
STYLE GUIDELINES
====================

Overall theme:
- Modern, clean design
- Use Material Design or AWS Architecture style
- Professional color palette
- Clear iconography

Component styling:
- Rounded rectangles for services
- Solid border for implemented (green)
- Dashed border for planned (gray)
- Drop shadows for depth

Arrows:
- Solid for active connections
- Dashed for planned connections
- Dotted for optional/conditional
- Color-coded by purpose (green=data, orange=auth, red=security)

Text:
- Service names in BOLD
- Ports in (parentheses)
- Status badges: ✅ IMPLEMENTED, 📅 PLANNED
- Feature lists with bullet points or checkmarks

Icons:
- Use industry-standard logos (Spring Boot, Next.js, PostgreSQL, MongoDB, Redis, Keycloak)
- Consistent size and style
- Color-matched to brand colors

Annotations:
- Boxes with light background
- Dashed borders for notes
- Use arrows to point to relevant components

Legend (include at bottom):
  ✅ Implemented  |  📅 Coming Soon  |  🔐 Security Feature  |  🤖 AI Integration
```

---

## 🎨 Alternative Simplified Prompt (For Quick Generation)

If the above is too detailed, use this shorter version:

```
Create a microservices architecture diagram with:

1. Frontend Layer: Next.js (port 3000) - Blue
2. API Gateway: Spring Cloud Gateway (port 8090) with rate limiting - Green
3. Microservices:
   - User Service (Spring Boot, port 8081) → PostgreSQL - Orange (Implemented)
   - Resume Service (FastAPI, port 8082) → MongoDB - Purple (Planned)
   - Jobs Service (FastAPI, port 8083) → MongoDB - Teal (Planned)
4. Supporting Services: Keycloak (8080), Redis (6379), PgAdmin (5050)
5. Show data flows: Registration, JWT auth, AI enhancement
6. Highlight security: Rate limiting, CORS, JWT, compensation pattern
7. Use solid lines for implemented, dashed for planned
8. Include status badges: ✅ Implemented, 📅 Coming Soon
```

---

## 📸 Expected Output

The diagram should show:

- ✅ Clear separation of layers (Frontend, Gateway, Services, Databases)
- ✅ Technology icons and port numbers
- ✅ Implementation status (implemented vs planned)
- ✅ Data flow arrows with annotations
- ✅ Security and privacy features highlighted
- ✅ Rate limiting configuration
- ✅ Supporting services (Keycloak, Redis)
- ✅ Future services (Resume, Jobs) with dashed borders

---

## 🔄 After Generation

1. **Review** the diagram for accuracy
2. **Adjust** component positions if needed
3. **Add** any missing annotations
4. **Export** as PNG (recommended: 2400x1800px for README)
5. **Save** to `docs/architecture-diagram.png`
6. **Update** README.md with the image link

---

## 💡 Pro Tips

- **Use layers**: Group related components visually
- **Color coding**: Consistent colors for service types
- **Icons**: Use recognizable brand icons
- **Arrows**: Different styles for different connection types
- **Status badges**: Make it clear what's implemented vs planned
- **Annotations**: Add context where needed
- **Legend**: Include a legend for symbols and colors

---

## 📚 Additional Diagrams to Generate

Consider creating these supplementary diagrams:

1. **Sequence Diagram**: User registration flow with compensation
2. **Rate Limiting Flow**: Token bucket algorithm visualization
3. **JWT Validation Flow**: Step-by-step auth process
4. **Deployment Diagram**: Docker Compose → Azure transition
5. **Database Schema**: ERD for PostgreSQL and MongoDB

---

<div align="center">

**Happy Diagramming! 🎨**

For questions, reach out to the Architecture Team

</div>

