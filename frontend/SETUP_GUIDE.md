# Complete Setup Guide

## Step 1: Configure Google OAuth2 in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Navigate to **"APIs & Services"** > **"Credentials"**
4. Click **"Create Credentials"** > **"OAuth 2.0 Client ID"**
5. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type
   - Fill in App name: "Resume Platform"
   - Add your email as support email
   - Add authorized domains if needed
   - Save and continue through the steps
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: "Resume Platform"
   - Authorized redirect URIs: `http://localhost:8080/realms/resume-platform/broker/google/endpoint`
   - Click **Create**
7. Copy the **Client ID** and **Client Secret** (you'll need these for Keycloak)

## Step 2: Configure Keycloak Identity Provider

1. Open Keycloak Admin Console: http://localhost:8080
2. Login with admin/admin
3. Select the **resume-platform** realm
4. Go to **"Identity Providers"** in the left menu
5. Click **"Add provider"** dropdown and select **"Google"**
6. Configure the Google Identity Provider:
   - **Alias:** `google` (important! must be exactly "google")
   - **Display Name:** Google
   - **Client ID:** [Paste from Google Console]
   - **Client Secret:** [Paste from Google Console]
   - **Default Scopes:** `openid profile email`
   - Leave other settings as default
7. Click **Save**

## Step 3: Update Keycloak Client Settings

1. Still in Keycloak Admin Console
2. Go to **"Clients"** in the left menu
3. Click on **"user-service"** client
4. Update the following settings:
   - **Valid redirect URIs:** Add:
     ```
     http://localhost:3000/*
     http://localhost:3000/api/auth/callback/keycloak
     ```
   - **Web origins:** Add:
     ```
     http://localhost:3000
     ```
   - **Valid post logout redirect URIs:** Add:
     ```
     http://localhost:3000/*
     ```
5. Click **Save**

## Step 4: Install Frontend Dependencies

```bash
cd frontend
npm install
```

## Step 5: Update Environment Variables

Generate a secure secret for NextAuth:

```bash
openssl rand -base64 32
```

Update `frontend/.env.local` with the generated secret:

```env
NEXTAUTH_SECRET=your-generated-secret-here
```

## Step 6: Start All Services

### Terminal 1: Docker Services (Keycloak, PostgreSQL)

```bash
cd CsChallenge
docker compose up -d
```

### Terminal 2: Spring Boot Backend

```bash
cd Services/user
./mvnw spring-boot:run
```

Or on Windows:

```bash
cd Services/user
mvnw.cmd spring-boot:run
```

### Terminal 3: Next.js Frontend

```bash
cd frontend
npm run dev
```

## Step 7: Test the Application

1. Open http://localhost:3000 in your browser
2. You should be redirected to the sign-in page
3. Try **"Sign in with Google"**:
   - Click the Google button
   - You'll be redirected to Google's login
   - Select your Google account
   - Consent to sharing your information
   - You'll be redirected back to the app
4. You should see the home page with your profile information
5. Verify the user was created in PostgreSQL:
   ```bash
   docker exec ms_sql psql -U postgres -d user_db -c "SELECT id, email, first_name, last_name FROM users;"
   ```

## Step 8: Test Regular Keycloak Login

1. Sign out from the app
2. Click **"Sign in with Keycloak"**
3. On Keycloak login page, click **"Register"**
4. Fill in registration form
5. After registration, you'll be logged in and redirected to the app
6. Verify this user also appears in PostgreSQL

## Troubleshooting

### Google OAuth Issues

- **Error: redirect_uri_mismatch**
  - Make sure the redirect URI in Google Console exactly matches: `http://localhost:8080/realms/resume-platform/broker/google/endpoint`
  - Check there are no trailing slashes

- **Error: invalid_client**
  - Double-check Client ID and Client Secret in Keycloak match those from Google Console

### Keycloak Issues

- **Can't access Keycloak Admin Console**
  - Check if Keycloak container is running: `docker ps | grep keycloak`
  - Check logs: `docker logs keycloak-ms1`

- **Invalid redirect_uri from Next.js**
  - Make sure you added `http://localhost:3000/*` to Valid redirect URIs in user-service client

### Backend API Issues

- **CORS errors**
  - Backend SecurityConfig already includes `http://localhost:3000` in allowed origins
  - Check if backend is running on port 8081

- **401 Unauthorized**
  - JWT token might be expired, try logging out and back in
  - Check if `KEYCLOAK_CLIENT_SECRET` in `application.yml` matches the client secret in Keycloak

### Frontend Issues

- **next-auth Error: Check server logs**
  - Make sure all environment variables are set in `.env.local`
  - Restart the Next.js dev server after changing environment variables

- **User profile not loading**
  - Check browser console for errors
  - Verify backend is running and accessible at http://localhost:8081
  - Check network tab to see the API request/response

## Architecture Overview

```
User Browser
    ↓
Next.js (localhost:3000)
    ↓ (redirects to)
Keycloak (localhost:8080)
    ↓ (redirects to)
Google OAuth (if Google sign-in)
    ↓ (returns JWT to)
Next.js Frontend
    ↓ (calls API with JWT)
Spring Boot Backend (localhost:8081)
    ↓ (validates JWT & syncs)
PostgreSQL Database
```

## Next Steps

- Test user profile updates
- Add more protected routes
- Customize the UI
- Add error boundary components
- Implement token refresh logic
- Add loading states and better error handling



