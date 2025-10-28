# Fix: unauthorized_client Error

## The Problem
When you try to sign in, you're getting: `unauthorized_client (Invalid client or Invalid client credentials)`

This means the Keycloak client `user-service` is not properly configured.

## Solution: Configure Keycloak Client

### Step 1: Access Keycloak Admin Console

1. Open your browser and go to: http://localhost:8080/admin
2. Login with:
   - Username: `admin`
   - Password: `admin`

### Step 2: Check/Create the Realm

1. In the top-left dropdown (next to "Master"), check if `resume-platform` realm exists
2. If it doesn't exist:
   - Click "Create Realm"
   - Name: `resume-platform`
   - Click "Create"
3. Make sure you're in the `resume-platform` realm (select it from dropdown)

### Step 3: Configure the Client

1. In the left sidebar, click **"Clients"**
2. Look for a client named `user-service`
   - If it doesn't exist, click **"Create client"**

#### If Creating New Client:

1. **General Settings:**
   - Client type: `OpenID Connect`
   - Client ID: `user-service`
   - Click "Next"

2. **Capability config:**
   - ✅ Client authentication: **ON** (this makes it confidential)
   - ✅ Authorization: **OFF**
   - Authentication flow:
     - ✅ Standard flow (Authorization Code Flow)
     - ✅ Direct access grants
   - Click "Next"

3. **Login settings:**
   - Valid redirect URIs: `http://localhost:3000/*`
   - Valid post logout redirect URIs: `http://localhost:3000/*`
   - Web origins: `http://localhost:3000`
   - Click "Save"

#### If Client Already Exists:

1. Click on `user-service` client
2. Go to **"Settings"** tab
3. Verify/Set these values:
   - Client authentication: **ON**
   - Valid redirect URIs: `http://localhost:3000/*`
   - Valid post logout redirect URIs: `http://localhost:3000/*`  
   - Web origins: `http://localhost:3000`
   - Click "Save" at the bottom

4. Go to **"Credentials"** tab
   - You'll see the Client Secret
   - **Copy this secret** - you'll need it!

### Step 4: Update Frontend Configuration

1. Open `frontend/.env.local` in a text editor
2. Update the client secret with the one from Keycloak:
   ```
   KEYCLOAK_CLIENT_SECRET=[paste-the-secret-from-keycloak]
   ```
3. Save the file

### Step 5: Restart Frontend

```powershell
# Stop the frontend (Ctrl+C in the terminal running npm)
# Then restart it:
cd frontend
npm run dev
```

### Step 6: Clear Browser Cache

1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Or manually:
   - Go to Application tab
   - Click "Clear storage"
   - Click "Clear site data"

### Step 7: Test Sign In

1. Go to http://localhost:3000
2. Click "Sign in with Keycloak"
3. You should see the Keycloak login page
4. Enter credentials or sign in with Google (if configured)
5. Should redirect back to your app successfully

## Optional: Configure Google Sign-In

If you want the "Sign in with Google" button to work:

### Step 1: Create Google OAuth Credentials

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing one
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add Authorized redirect URIs:
   - `http://localhost:8080/realms/resume-platform/broker/google/endpoint`
7. Copy the Client ID and Client Secret

### Step 2: Add Google Identity Provider in Keycloak

1. In Keycloak Admin Console (resume-platform realm)
2. Go to "Identity Providers" in the left menu
3. Click "Add provider" → Select "Google"
4. Enter:
   - Client ID: [Your Google OAuth Client ID]
   - Client Secret: [Your Google OAuth Client Secret]
5. Click "Save"

## Verification Checklist

Before testing, verify:

- [ ] Keycloak is running on http://localhost:8080
- [ ] `resume-platform` realm exists
- [ ] `user-service` client exists in that realm
- [ ] Client authentication is ON (confidential client)
- [ ] Valid redirect URIs includes `http://localhost:3000/*`
- [ ] Web origins includes `http://localhost:3000`
- [ ] Client secret in `.env.local` matches Keycloak
- [ ] Backend is running on http://localhost:8081
- [ ] Frontend is running on http://localhost:3000

## Still Not Working?

### Check the Console Logs

Open browser DevTools (F12) and look for errors. Common issues:

**"redirect_uri_mismatch":**
- Add more specific redirect URI in Keycloak: `http://localhost:3000/api/auth/callback/keycloak`

**"CORS errors":**
- Make sure Web origins is set to `http://localhost:3000` in Keycloak client

**"Network error":**
- Check if backend is running: http://localhost:8081/actuator/health
- Check if Keycloak is running: http://localhost:8080

### Reset Keycloak Client (Nuclear Option)

If nothing works:

1. Delete the `user-service` client in Keycloak
2. Recreate it following Step 3 exactly
3. Copy the new client secret
4. Update `.env.local`
5. Restart frontend
6. Clear browser cache completely
7. Try again

## Quick Test Commands

```powershell
# Test Keycloak is accessible
Invoke-WebRequest http://localhost:8080/realms/resume-platform/.well-known/openid-configuration

# Test Backend is running
Invoke-WebRequest http://localhost:8081/actuator/health

# Check what's running on port 3000
netstat -ano | findstr :3000
```

