package com.riadh.cs.user.service;

import com.riadh.cs.user.dto.AuthRequest;
import com.riadh.cs.user.dto.AuthResponse;
import com.riadh.cs.user.dto.RegisterRequest;
import com.riadh.cs.user.entity.User;
import com.riadh.cs.user.entity.UserToken;
import com.riadh.cs.user.jwt.KeycloakUserDetails;
import com.riadh.cs.user.repository.UserRepository;
import com.riadh.cs.user.repository.UserTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final UserTokenRepository userTokenRepository;
    private final AuditService auditService;
    private final KeycloakAdminService keycloakAdminService;
    private final RestTemplate restTemplate;
    private final PasswordEncoder passwordEncoder;

    @Value("${keycloak.auth-server-url}")
    private String keycloakServerUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.resource}")
    private String clientId;

    @Value("${keycloak.credentials.secret}")
    private String clientSecret;

    public AuthResponse register(RegisterRequest request, String ipAddress, String userAgent) {
        // 1. Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("User with this email already exists");
        }

        String keycloakId = null;
        User user = null;
        
        try {
            // 2. Create user in Keycloak FIRST (outside transaction)
            keycloakId = keycloakAdminService.createUser(
                    request.getEmail(),
                    request.getPassword(),
                    request.getFirstName(),
                    request.getLastName()
            );
            log.info("User created in Keycloak: {}", keycloakId);

            // 3. Create user in local database (inside transaction)
            user = saveUserToDatabase(request, keycloakId);

            // 4. Send verification email (via Keycloak) - non-blocking
            try {
                keycloakAdminService.sendVerificationEmail(keycloakId);
                log.info("Verification email sent successfully to: {}", request.getEmail());
            } catch (Exception e) {
                log.warn("Failed to send verification email (SMTP not configured): {}", e.getMessage());
                // Continue registration even if email fails
            }

            // 5. Log audit
            auditService.logAction(user.getId(), "REGISTER", "user", user.getId(),
                    ipAddress, userAgent, "success", null);

            // 6. Return success response (user will manually sign in)
            log.info("User registered successfully: email={}, keycloakId={}", request.getEmail(), keycloakId);
            
            return AuthResponse.builder()
                    .success(true)
                    .message("Registration successful. Please check your email for verification.")
                    .userId(user.getId())
                    .keycloakId(keycloakId)
                    .build();

        } catch (Exception e) {
            log.error("Registration failed: {}", e.getMessage(), e);
            
            // COMPENSATION: Clean up Keycloak user if database save failed
            if (keycloakId != null && user == null) {
                try {
                    log.info("Cleaning up orphaned Keycloak user: {}", keycloakId);
                    keycloakAdminService.deleteUser(keycloakId);
                    log.info("Successfully cleaned up orphaned Keycloak user: {}", keycloakId);
                } catch (Exception cleanupEx) {
                    log.error("Failed to clean up orphaned Keycloak user: {}", keycloakId, cleanupEx);
                    // Log for manual cleanup - don't fail the original error
                }
            }
            
            throw new RuntimeException("Registration failed: " + e.getMessage(), e);
        }
    }

    @Transactional
    private User saveUserToDatabase(RegisterRequest request, String keycloakId) {
        try {
            User user = User.builder()
                    .email(request.getEmail())
                    .keycloakId(keycloakId)
                    .firstName(request.getFirstName())
                    .lastName(request.getLastName())
                    .phoneNumber(request.getPhoneNumber())
                    .city(request.getCity())
                    .country(request.getCountry())
                    .emailVerified(false)
                    .isActive(true)
                    .role("user")
                    .consentAiProcessing(request.getConsentAiProcessing())
                    .termsAcceptedAt(Instant.now())
                    .build();

            user = userRepository.save(user);
            log.info("User saved to database: {}", user.getId());
            return user;
            
        } catch (Exception e) {
            log.error("Failed to save user to database: {}", e.getMessage(), e);
            throw e; // Re-throw to trigger compensation
        }
    }

    @Transactional
    public AuthResponse login(AuthRequest request, String ipAddress, String userAgent) {
        try {
            // 1. Authenticate with Keycloak
            Map<String, Object> tokens = authenticateWithKeycloak(
                    request.getEmail(),
                    request.getPassword()
            );

            String accessToken = (String) tokens.get("access_token");
            String refreshToken = (String) tokens.get("refresh_token");
            Integer expiresIn = (Integer) tokens.get("expires_in");
            Integer refreshExpiresIn = (Integer) tokens.get("refresh_expires_in");

            // 2. Find or sync user in local database
            String keycloakId = extractKeycloakIdFromToken(accessToken);
            User user = findOrSyncUser(keycloakId, request.getEmail());

            // 3. Update last login
            user.setLastLogin(Instant.now());
            userRepository.save(user);

            // 4. Store refresh token
            storeRefreshToken(user, refreshToken, refreshExpiresIn);

            // 5. Log audit
            auditService.logAction(user.getId(), "LOGIN", "user", user.getId(),
                    ipAddress, userAgent, "success", null);

            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .expiresIn(expiresIn)
                    .userId(user.getId())
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .role(user.getRole())
                    .build();

        } catch (Exception e) {
            log.error("Login failed for user: {}", request.getEmail(), e);

            // Handle failed login attempts
            Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
            userOpt.ifPresent(user -> {
                auditService.logAction(user.getId(), "LOGIN", "user", user.getId(),
                        ipAddress, userAgent, "failed", e.getMessage());
            });

            throw new RuntimeException("Invalid credentials");
        }
    }

    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        try {
            Map<String, Object> tokens = refreshKeycloakToken(refreshToken);

            String newAccessToken = (String) tokens.get("access_token");
            String newRefreshToken = (String) tokens.get("refresh_token");
            Integer expiresIn = (Integer) tokens.get("expires_in");

            // Extract user info from new access token
            String keycloakId = extractKeycloakIdFromToken(newAccessToken);
            User user = userRepository.findByKeycloakId(keycloakId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Revoke old refresh token and store new one
            revokeRefreshTokenByHash(hashToken(refreshToken));
            storeRefreshToken(user, newRefreshToken, (Integer) tokens.get("refresh_expires_in"));

            return AuthResponse.builder()
                    .accessToken(newAccessToken)
                    .refreshToken(newRefreshToken)
                    .expiresIn(expiresIn)
                    .userId(user.getId())
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .role(user.getRole())
                    .build();

        } catch (Exception e) {
            log.error("Token refresh failed", e);
            throw new RuntimeException("Invalid refresh token");
        }
    }

    @Transactional
    public void logout(Jwt jwt, String refreshToken, String ipAddress) {
        String keycloakId = jwt.getSubject();

        // 1. Revoke refresh token in database
        if (refreshToken != null) {
            revokeRefreshTokenByHash(hashToken(refreshToken));
        }

        // 2. Logout from Keycloak (optional - invalidates session)
        logoutFromKeycloak(refreshToken);

        // 3. Log audit
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        auditService.logAction(user.getId(), "LOGOUT", "user", user.getId(),
                ipAddress, null, "success", null);
    }

    public KeycloakUserDetails getCurrentUserDetails(Jwt jwt) {
        String keycloakId = jwt.getSubject();
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return KeycloakUserDetails.builder()
                .keycloakId(keycloakId)
                .userId(user.getId())
                .email(user.getEmail())
                .emailVerified(user.getEmailVerified())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .username(user.getEmail())
                .build();
    }

    // ========== Private Helper Methods ==========

    private Map<String, Object> authenticateWithKeycloak(String username, String password) {
        String tokenUrl = String.format("%s/realms/%s/protocol/openid-connect/token",
                keycloakServerUrl, realm);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("username", username);
        body.add("password", password);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);

        return response.getBody();
    }

    private Map<String, Object> refreshKeycloakToken(String refreshToken) {
        String tokenUrl = String.format("%s/realms/%s/protocol/openid-connect/token",
                keycloakServerUrl, realm);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "refresh_token");
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("refresh_token", refreshToken);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);

        return response.getBody();
    }

    private void logoutFromKeycloak(String refreshToken) {
        if (refreshToken == null) return;

        try {
            String logoutUrl = String.format("%s/realms/%s/protocol/openid-connect/logout",
                    keycloakServerUrl, realm);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("client_id", clientId);
            body.add("client_secret", clientSecret);
            body.add("refresh_token", refreshToken);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(logoutUrl, request, String.class);
        } catch (Exception e) {
            log.error("Failed to logout from Keycloak", e);
        }
    }

    private User findOrSyncUser(String keycloakId, String email) {
        return userRepository.findByKeycloakId(keycloakId)
                .orElseGet(() -> {
                    // Sync user from Keycloak if not exists
                    Map<String, Object> keycloakUser = keycloakAdminService.getUser(keycloakId);
                    return createUserFromKeycloak(keycloakId, keycloakUser);
                });
    }

    private User createUserFromKeycloak(String keycloakId, Map<String, Object> keycloakUser) {
        User user = User.builder()
                .keycloakId(keycloakId)
                .email((String) keycloakUser.get("email"))
                .firstName((String) keycloakUser.get("firstName"))
                .lastName((String) keycloakUser.get("lastName"))
                .emailVerified((Boolean) keycloakUser.get("emailVerified"))
                .isActive(true)
                .role("user")
                .build();
        return userRepository.save(user);
    }

    private void storeRefreshToken(User user, String refreshToken, Integer expiresIn) {
        UserToken token = UserToken.builder()
                .user(user)
                .jtiHash(hashToken(refreshToken))
                .tokenType("refresh")
                .expiresAt(Instant.now().plusSeconds(expiresIn))
                .build();
        userTokenRepository.save(token);
    }

    private void revokeRefreshTokenByHash(String tokenHash) {
        userTokenRepository.findByJtiHashAndTokenTypeAndRevokedFalse(tokenHash, "refresh")
                .ifPresent(token -> {
                    token.setRevoked(true);
                    token.setRevokedAt(Instant.now());
                    userTokenRepository.save(token);
                });
    }

    private String hashToken(String token) {
        return passwordEncoder.encode(token);
    }

    private String extractKeycloakIdFromToken(String accessToken) {
        String[] parts = accessToken.split("\\.");
        if (parts.length < 2) {
            throw new RuntimeException("Invalid token format");
        }

        String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper =
                    new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> claims = mapper.readValue(payload, Map.class);
            return (String) claims.get("sub");
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract keycloak ID from token", e);
        }
    }
}



