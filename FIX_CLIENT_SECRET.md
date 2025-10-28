# Fix: Invalid Client Credentials Error

## The Error
```
error="invalid_client_credentials", grant_type="authorization_code"
```

This means the client secret in your frontend doesn't match Keycloak.

## Solution

### Step 1: Get the Real Client Secret from Keycloak

1. Open browser: http://localhost:8080/admin
2. Login: `admin` / `admin`
3. Select the `resume-platform` realm (top-left dropdown)
4. Click **"Clients"** in left sidebar
5. Click on **"user-service"**
6. Click the **"Credentials"** tab
7. You'll see **"Client secret"**
8. Click the **eye icon** to reveal it or click **"Regenerate"** to create a new one
9. **Copy this secret** (select and Ctrl+C)

### Step 2: Update Frontend Configuration

Open `frontend/.env.local` and update this line with the secret you just copied:

```env
KEYCLOAK_CLIENT_SECRET=[paste-the-secret-here]
```

**Important:** Make sure there are no spaces, quotes, or extra characters!

### Step 3: Restart the Frontend

```powershell
# In the terminal running npm run dev, press Ctrl+C to stop it
# Then restart:
cd frontend
npm run dev
```

### Step 4: Clear Browser Cache & Test

1. Open browser DevTools (F12)
2. Go to Application tab → Clear Storage → Clear site data
3. Close DevTools
4. Go to http://localhost:3000
5. Click "Sign in with Keycloak"
6. Should work now!

## Alternative: Use the Backend's Client Secret

I noticed your backend config has this client secret:
```
bWumC1b38BfV4n00QlNskAduOgq3eYG9
```

If you want to use this secret:

### Option A: Update Keycloak to match this secret

1. In Keycloak Admin Console → Clients → user-service → Credentials
2. Turn off "Client Authenticator" temporarily
3. Change "Client Authenticator" back to "Client Id and Secret"
4. In the "Client Secret" field, paste: `bWumC1b38BfV4n00QlNskAduOgq3eYG9`
5. Click "Save"

### Option B: Generate new secret and update both backend and frontend

1. In Keycloak, click "Regenerate" to get a new secret
2. Copy the new secret
3. Update `frontend/.env.local`:
   ```
   KEYCLOAK_CLIENT_SECRET=[new-secret]
   ```
4. Update `Services/user/src/main/resources/application.yml`:
   ```yaml
   keycloak:
     credentials:
       secret: [new-secret]
   ```
5. Restart both frontend and backend

## Verify It's Fixed

After updating the secret and restarting:

1. Go to http://localhost:3000
2. Click "Sign in with Keycloak"
3. You should see the Keycloak login page (not an error)
4. Enter credentials
5. Should redirect back to your app successfully

## Still Getting Errors?

Check the Keycloak logs again:
```powershell
docker logs keycloak-ms1 -f
```

If you still see `invalid_client_credentials`, the secret still doesn't match. Double-check:
- No extra spaces in `.env.local`
- You saved the file
- You restarted the frontend
- You're looking at the correct client in Keycloak (`user-service` in `resume-platform` realm)

