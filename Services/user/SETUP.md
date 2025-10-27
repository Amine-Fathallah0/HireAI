# User Service - Keycloak Integration Setup Guide

## Overview

This is a Spring Boot-based user authentication and management service integrated with Keycloak for OAuth2/OIDC authentication. It's designed as part of an AI Resume Building and Job Matching platform.

## Architecture

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
└────────┬────────┘
         │ HTTPS
┌────────▼────────┐
│  API Gateway    │
└────────┬────────┘
         │
┌────────▼──────────────┐
│   USER SERVICE        │
│  (Spring Boot)        │
│                       │
│ ┌─────────────────┐   │
│ │   Keycloak      │   │
│ │ (Auth Provider) │   │
│ └─────────────────┘   │
└────────┬──────────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │
└─────────────────┘
```

## Database Schema

### Core Tables

1. **users** - User profile information
   - `id`: Primary key
   - `keycloak_id`: Unique Keycloak user ID (mandatory)
   - `email`: User email (unique)
   - `first_name`, `last_name`: User name
   - `phone_number`, `city`, `country`: Contact info
   - `email_verified`, `is_active`, `role`: Status fields
   - `consent_ai_processing`, `consent_version`: GDPR compliance
   - `terms_accepted_at`: Terms acceptance timestamp
   - `created_at`, `updated_at`, `last_login`: Timestamps

2. **user_tokens** - Refresh token tracking
   - `id`: Primary key
   - `user_id`: Foreign key to users
   - `jti_hash`: Hashed JWT ID from refresh token
   - `token_type`: Token type (refresh, access)
   - `expires_at`: Token expiration
   - `revoked`: Token revocation status

3. **audit_logs** - Audit trail for compliance
   - `id`: Primary key
   - `user_id`: Foreign key to users
   - `action`: Action performed (LOGIN, LOGOUT, etc.)
   - `resource_type`, `resource_id`: Resource affected
   - `ip_address`, `user_agent`: Request metadata
   - `status`: Success/failure
   - `created_at`: Action timestamp

## Prerequisites

- Java 17+
- Docker & Docker Compose
- Maven 3.8+

## Quick Start

### 1. Start Infrastructure Services

```bash
# Start PostgreSQL and Keycloak
docker-compose up -d postgresql keycloak

# Wait for services to be healthy (check logs)
docker-compose logs -f keycloak
```

### 2. Configure Keycloak

Access Keycloak at http://localhost:8080 and login with:
- Username: `admin`
- Password: `admin`

#### Create Realm
1. Click on the dropdown at the top left (says "master")
2. Click "Create Realm"
3. Name: `resume-platform`
4. Click "Create"

#### Create Client
1. Go to "Clients" → "Create Client"
2. Client ID: `user-service`
3. Client Type: `OpenID Connect`
4. Click "Next"
5. Enable:
   - Client authentication: `ON`
   - Authorization: `OFF`
   - Standard flow: `ON`
   - Direct access grants: `ON`
6. Click "Save"
7. Go to "Credentials" tab
8. Copy the "Client Secret" (you'll need this)

#### Configure Client Settings
1. In the client settings:
   - Valid redirect URIs: `http://localhost:3000/*`, `http://localhost:8082/*`
   - Web origins: `http://localhost:3000`, `http://localhost:8082`
2. Save

#### Create Realm Roles
1. Go to "Realm roles" → "Create role"
2. Create two roles:
   - `user` (default role)
   - `admin`

#### Set Default Role
1. Go to "Realm settings" → "User registration"
2. Set default roles to include `user`

### 3. Configure Application

Create `.env` file in the root directory:

```bash
cp .env.example .env
```

Update the `.env` file with your Keycloak client secret:

```env
KEYCLOAK_CLIENT_SECRET=your-actual-client-secret-from-keycloak
```

### 4. Run the Application

```bash
cd Services/user
./mvnw spring-boot:run
```

Or build and run:

```bash
./mvnw clean package
java -jar target/user-0.0.1-SNAPSHOT.jar
```

## API Endpoints

### Public Endpoints (No Authentication Required)

#### Register User
```http
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
```

Response:
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "expiresIn": 300,
  "tokenType": "Bearer",
  "userId": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGci..."
}
```

### Protected Endpoints (Authentication Required)

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

#### Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
X-Refresh-Token: <refresh_token>
```

#### Get User Profile
```http
GET /api/v1/users/profile
Authorization: Bearer <access_token>
```

#### Update Profile
```http
PUT /api/v1/users/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "phoneNumber": "+1234567890",
  "city": "San Francisco",
  "country": "USA"
}
```

#### Delete Account (GDPR)
```http
DELETE /api/v1/users/profile
Authorization: Bearer <access_token>
```

#### Export Data (GDPR)
```http
GET /api/v1/users/profile/export
Authorization: Bearer <access_token>
```

#### Update AI Processing Consent
```http
PUT /api/v1/users/profile/consent?consentAiProcessing=true
Authorization: Bearer <access_token>
```

### Admin Endpoints (Admin Role Required)

#### Get All Users
```http
GET /api/v1/users?page=0&size=20
Authorization: Bearer <admin_access_token>
```

#### Get User by ID
```http
GET /api/v1/users/{userId}
Authorization: Bearer <admin_access_token>
```

#### Activate/Deactivate User
```http
PUT /api/v1/users/{userId}/activate
Authorization: Bearer <admin_access_token>

PUT /api/v1/users/{userId}/deactivate
Authorization: Bearer <admin_access_token>
```

#### Delete User (Admin)
```http
DELETE /api/v1/users/{userId}
Authorization: Bearer <admin_access_token>
```

## Key Features

### 1. Keycloak Integration
- User authentication delegated to Keycloak
- JWT token validation
- Refresh token management
- User synchronization between Keycloak and local DB

### 2. Security
- OAuth2 Resource Server
- JWT-based authentication
- Role-based access control (RBAC)
- Secure password hashing (handled by Keycloak)

### 3. GDPR Compliance
- User consent tracking for AI processing
- Data export functionality
- Account deletion with cascade
- Audit logging for all actions

### 4. Audit Logging
- All user actions are logged
- IP address and user agent tracking
- Success/failure tracking
- Queryable audit trail

## Configuration

### Environment Variables

All configuration can be overridden via environment variables:

- `DB_HOST`, `DB_PORT`, `DB_NAME` - Database connection
- `KEYCLOAK_SERVER_URL` - Keycloak server URL
- `KEYCLOAK_REALM` - Keycloak realm name
- `KEYCLOAK_CLIENT_ID` - OAuth2 client ID
- `KEYCLOAK_CLIENT_SECRET` - OAuth2 client secret
- `SERVER_PORT` - Application port

### Production Considerations

1. **Database**:
   - Change `spring.jpa.hibernate.ddl-auto` to `validate`
   - Use migration tools (Flyway/Liquibase)
   - Enable TDE (Transparent Data Encryption)

2. **Keycloak**:
   - Use production-mode Keycloak
   - Configure SSL/TLS
   - Set up proper realm and client configurations
   - Enable MFA

3. **Security**:
   - Use strong client secrets
   - Enable HTTPS
   - Configure CORS properly
   - Rate limiting (implement in API Gateway)

4. **Monitoring**:
   - Enable Actuator endpoints with security
   - Configure Zipkin for distributed tracing
   - Set up metrics collection

## Troubleshooting

### Keycloak Connection Issues
- Ensure Keycloak is running: `docker-compose ps`
- Check Keycloak logs: `docker-compose logs keycloak`
- Verify realm and client configuration

### Database Connection Issues
- Check PostgreSQL is running: `docker-compose ps postgresql`
- Verify database credentials in application.yml
- Check if database `user_db` exists

### JWT Validation Errors
- Verify issuer-uri matches Keycloak realm
- Check JWK set URI is accessible
- Ensure client secret is correct

## Next Steps

1. **Implement Rate Limiting** - Add Redis-backed rate limiting in API Gateway
2. **Email Verification** - Configure SMTP in Keycloak for email verification
3. **Password Reset** - Implement forgot password flow
4. **Social Login** - Add OAuth2 providers (Google, GitHub, etc.)
5. **2FA/MFA** - Enable two-factor authentication in Keycloak
6. **API Gateway Integration** - Connect with Spring Cloud Gateway
7. **Service Discovery** - Configure Eureka client (already added)

## Additional Resources

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Spring Security OAuth2](https://spring.io/projects/spring-security-oauth)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Support

For issues or questions, please refer to the main project documentation or create an issue in the project repository.



