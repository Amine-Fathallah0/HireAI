# Resume Platform Frontend

This is the frontend for the Resume Platform built with Next.js, NextAuth.js, and Keycloak.

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend services running (Keycloak, Spring Boot API)
- Google OAuth2 credentials configured in Keycloak

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.local` and update the values:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-to-random-string

KEYCLOAK_CLIENT_ID=user-service
KEYCLOAK_CLIENT_SECRET=your-keycloak-client-secret
KEYCLOAK_ISSUER=http://localhost:8080/realms/resume-platform

NEXT_PUBLIC_API_URL=http://localhost:8081
```

To generate a secure `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Features

- Keycloak Authentication
- Google OAuth2 Sign-in (via Keycloak Identity Provider)
- Protected Routes
- User Profile Display
- Automatic User Synchronization with PostgreSQL

## Authentication Flow

1. User visits the app
2. Redirected to sign-in page if not authenticated
3. Click "Sign in with Google" or "Sign in with Keycloak"
4. Keycloak handles authentication
5. User redirected back with JWT token
6. Frontend calls backend API with JWT
7. Backend validates JWT and syncs user to PostgreSQL
8. User profile displayed

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Keycloak Documentation](https://www.keycloak.org/documentation)



