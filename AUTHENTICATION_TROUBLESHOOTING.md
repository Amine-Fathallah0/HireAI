# Authentication Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: Network Error on Sign In

**Symptoms:**
- Getting network errors when trying to sign in
- Can't connect to backend API

**Solutions:**

1. **Check if Backend is Running:**
   ```bash
   # Make sure the user service is running on port 8081
   curl http://localhost:8081/actuator/health
   ```

2. **Check if Keycloak is Running:**
   ```bash
   # Keycloak should be running on port 8080
   curl http://localhost:8080/realms/resume-platform/.well-known/openid-configuration
   ```

3. **Verify Environment Variables:**
   - Check `frontend/.env.local` exists and has correct values
   - Verify `NEXT_PUBLIC_API_URL=http://localhost:8081`
   - Verify `KEYCLOAK_ISSUER=http://localhost:8080/realms/resume-platform`

4. **Start All Services:**
   ```bash
   # Start Docker services
   docker-compose up -d
   
   # Wait for services to be healthy
   docker-compose ps
   
   # Start the user service (in Services/user directory)
   mvn spring-boot:run
   
   # Start the frontend (in frontend directory)
   npm run dev
   ```

### Issue 2: Token Errors

**Symptoms:**
- "No access token available" error
- Profile fetch fails with 401 Unauthorized

**Solutions:**

1. **Clear Browser Cache and Cookies:**
   - Open DevTools (F12)
   - Go to Application tab
   - Clear Storage for localhost:3000
   - Refresh the page

2. **Check NextAuth Session:**
   - Open browser console
   - Look for "Fetching profile with token..." messages
   - Check if accessToken is present in session

3. **Verify Keycloak Token:**
   - Go to http://localhost:8080/admin
   - Login with admin/admin
   - Check the `resume-platform` realm
   - Verify the `user-service` client exists
   - Check client settings:
     - Client ID: `user-service`
     - Client Secret: `bWumC1b38BfV4n00QlNskAduOgq3eYG9`
     - Valid Redirect URIs: `http://localhost:3000/*`
     - Web Origins: `http://localhost:3000`

4. **Check Backend JWT Configuration:**
   - Verify `Services/user/src/main/resources/application.yml`
   - Ensure issuer-uri matches Keycloak: `http://localhost:8080/realms/resume-platform`
   - Ensure jwk-set-uri is correct

### Issue 3: Sign Out Loop / Auto Sign In

**Symptoms:**
- After signing out, immediately redirected back in
- Keycloak doesn't ask for credentials again

**Solutions:**

1. **Clear Keycloak Session:**
   - The updated logout now properly clears Keycloak session
   - Make sure you're using the latest code
   - The logout URL now includes `id_token_hint` parameter

2. **Manual Keycloak Session Clear:**
   ```bash
   # Navigate to Keycloak logout URL manually
   # http://localhost:8080/realms/resume-platform/protocol/openid-connect/logout
   ```

3. **Check Browser Sessions:**
   - Clear all cookies for localhost
   - Close all browser tabs
   - Restart browser

### Issue 4: CORS Errors

**Symptoms:**
- "CORS policy: No 'Access-Control-Allow-Origin' header" errors
- Preflight request failures

**Solutions:**

1. **Verify Backend CORS Configuration:**
   - Check `SecurityConfig.java`
   - Ensure `http://localhost:3000` is in allowed origins
   - Restart backend service after changes

2. **Check Keycloak CORS:**
   - In Keycloak Admin Console
   - Go to Clients → user-service
   - Check "Web Origins" includes `http://localhost:3000`

### Issue 5: Database Connection Issues

**Symptoms:**
- Backend fails to start
- "Connection refused" database errors

**Solutions:**

1. **Check PostgreSQL:**
   ```bash
   # Verify PostgreSQL is running
   docker-compose ps postgresql
   
   # Check logs
   docker-compose logs postgresql
   ```

2. **Verify Database Exists:**
   ```bash
   # Connect to PostgreSQL
   docker exec -it ms_sql psql -U postgres
   
   # List databases
   \l
   
   # Should see: user_db, keycloak
   ```

3. **Initialize Databases:**
   - Check `init-scripts` directory has database initialization scripts
   - Recreate containers if needed:
     ```bash
     docker-compose down -v
     docker-compose up -d
     ```

## Complete Setup Steps

### 1. Start Infrastructure Services

```bash
# From project root
docker-compose up -d

# Wait for all services to be healthy (about 30-60 seconds)
docker-compose ps

# Check Keycloak is ready
curl http://localhost:8080/health/ready
```

### 2. Configure Keycloak

1. Go to http://localhost:8080/admin
2. Login: `admin` / `admin`
3. Create realm: `resume-platform`
4. Create client: `user-service`
   - Client Protocol: openid-connect
   - Access Type: confidential
   - Valid Redirect URIs: `http://localhost:3000/*`
   - Web Origins: `http://localhost:3000`
   - Get Client Secret from Credentials tab

5. Configure Google Identity Provider (for Google Sign-In):
   - Go to Identity Providers
   - Add provider: Google
   - Enter your Google OAuth Client ID and Secret
   - Save

### 3. Configure Backend

```bash
# Go to user service
cd Services/user

# Verify application.yml has correct settings
# Check:
# - keycloak.auth-server-url: http://localhost:8080
# - spring.security.oauth2.resourceserver.jwt.issuer-uri: http://localhost:8080/realms/resume-platform

# Start the service
mvn spring-boot:run
```

### 4. Configure Frontend

```bash
# Go to frontend
cd frontend

# Copy environment file (if not already done)
cp .env.local.example .env.local

# Verify .env.local has:
# - KEYCLOAK_CLIENT_ID=user-service
# - KEYCLOAK_CLIENT_SECRET=[your-client-secret]
# - KEYCLOAK_ISSUER=http://localhost:8080/realms/resume-platform
# - NEXT_PUBLIC_API_URL=http://localhost:8081

# Install dependencies
npm install

# Start frontend
npm run dev
```

### 5. Test Authentication Flow

1. Open http://localhost:3000
2. Should redirect to /auth/signin
3. Click "Sign in with Google" or "Sign in with Keycloak"
4. Complete authentication
5. Should see your profile on homepage
6. Click Sign Out
7. Should be logged out and redirected to signin page

## Debug Mode

To see detailed authentication logs:

**Frontend:**
- Open browser DevTools (F12)
- Go to Console tab
- Look for NextAuth debug logs
- Check Network tab for API calls

**Backend:**
```yaml
# In application.yml, set:
logging:
  level:
    org.springframework.security: DEBUG
    com.riadh.cs: DEBUG
```

**Keycloak:**
- In Admin Console → Events
- Enable "Login Events" and "Admin Events"
- Check event logs for authentication issues

## Common Configuration Mistakes

1. **Mismatched Client Secret:**
   - Frontend `.env.local` must match Keycloak client secret
   - Backend `application.yml` must match if using client credentials

2. **Wrong URLs:**
   - Keycloak URL must be accessible from both browser AND backend
   - Use `localhost` consistently (not 127.0.0.1 or hostname)

3. **Missing Realm:**
   - Ensure `resume-platform` realm exists in Keycloak
   - Check realm name spelling in all configs

4. **Port Conflicts:**
   - Backend: 8081
   - Keycloak: 8080
   - Frontend: 3000
   - PostgreSQL: 5432
   - Ensure no other services use these ports

## Still Having Issues?

1. **Check All Service Logs:**
   ```bash
   # Docker services
   docker-compose logs -f
   
   # Backend service
   # Look in terminal where mvn spring-boot:run is running
   
   # Frontend
   # Look in terminal where npm run dev is running
   ```

2. **Verify Network Connectivity:**
   ```bash
   # From backend, can it reach Keycloak?
   curl http://localhost:8080/realms/resume-platform/.well-known/openid-configuration
   
   # From frontend, can browser reach backend?
   curl http://localhost:8081/actuator/health
   ```

3. **Reset Everything:**
   ```bash
   # Stop all services
   docker-compose down -v
   
   # Remove node_modules and reinstall
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   
   # Clean Maven build
   cd ../Services/user
   mvn clean install
   
   # Start fresh
   docker-compose up -d
   # Wait 60 seconds
   # Reconfigure Keycloak
   # Start backend
   # Start frontend
   ```

## Key Files to Check

- `frontend/.env.local` - Frontend environment config
- `frontend/pages/api/auth/[...nextauth].ts` - NextAuth configuration
- `Services/user/src/main/resources/application.yml` - Backend config
- `Services/user/src/main/java/com/riadh/cs/user/config/SecurityConfig.java` - Security settings
- `docker-compose.yml` - Infrastructure services

## Support

If you continue to have issues, collect the following information:
1. Browser console logs (F12 → Console)
2. Network tab showing failed requests (F12 → Network)
3. Backend logs (from mvn spring-boot:run terminal)
4. Keycloak event logs
5. Docker service status (`docker-compose ps`)

