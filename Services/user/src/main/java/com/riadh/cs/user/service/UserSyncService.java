package com.riadh.cs.user.service;

import com.riadh.cs.user.entity.User;
import com.riadh.cs.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserSyncService {

    private final UserRepository userRepository;
    private final KeycloakAdminService keycloakAdminService;
    private final AuditService auditService;

    /**
     * Syncs user from Keycloak to PostgreSQL.
     * If user doesn't exist in PostgreSQL, creates a new record.
     * This is called automatically when a user authenticates with Keycloak.
     */
    @Transactional
    public User syncUserFromKeycloak(Jwt jwt, String ipAddress, String userAgent) {
        String keycloakId = jwt.getSubject();
        String email = jwt.getClaimAsString("email");
        
        log.info("Syncing user from Keycloak: keycloakId={}, email={}", keycloakId, email);

        // Check if user already exists in PostgreSQL
        return userRepository.findByKeycloakId(keycloakId)
                .orElseGet(() -> createUserFromKeycloak(jwt, keycloakId, email, ipAddress, userAgent));
    }

    /**
     * Creates a new user in PostgreSQL from Keycloak JWT data
     */
    private User createUserFromKeycloak(Jwt jwt, String keycloakId, String email, String ipAddress, String userAgent) {
        log.info("Creating new user in PostgreSQL for Keycloak ID: {}", keycloakId);

        try {
            // Extract user info from JWT first (more reliable than admin API for basic info)
            String firstName = jwt.getClaimAsString("given_name");
            String lastName = jwt.getClaimAsString("family_name");
            Boolean emailVerified = jwt.getClaimAsBoolean("email_verified");
            
            // Try to get from preferred_username if names are null
            if (firstName == null || firstName.isEmpty()) {
                String preferredUsername = jwt.getClaimAsString("preferred_username");
                if (preferredUsername != null && preferredUsername.contains("@")) {
                    firstName = preferredUsername.split("@")[0];
                } else {
                    firstName = email.split("@")[0]; // Fallback to email prefix
                }
            }
            
            if (lastName == null || lastName.isEmpty()) {
                lastName = ""; // Empty string instead of null
            }
            
            if (emailVerified == null) {
                emailVerified = false; // Default to false
            }

            log.info("User details - firstName: {}, lastName: {}, emailVerified: {}", firstName, lastName, emailVerified);

            // Create new user entity
            User user = User.builder()
                    .keycloakId(keycloakId)
                    .email(email)
                    .firstName(firstName)
                    .lastName(lastName)
                    .emailVerified(emailVerified)
                    .isActive(true)
                    .role("user") // Default role
                    .consentAiProcessing(false) // User needs to accept this separately
                    .termsAcceptedAt(Instant.now()) // Assuming terms are accepted at Keycloak registration
                    .lastLogin(Instant.now())
                    .build();

            log.info("Saving user to database...");
            user = userRepository.save(user);
            log.info("User saved successfully with ID: {}", user.getId());

            // Log audit event
            try {
                auditService.logAction(
                        user.getId(),
                        "USER_SYNC_FROM_KEYCLOAK",
                        "user",
                        user.getId(),
                        ipAddress,
                        userAgent,
                        "success",
                        null
                );
            } catch (Exception auditEx) {
                log.warn("Failed to log audit, but user created successfully: {}", auditEx.getMessage());
            }

            log.info("Successfully created user in PostgreSQL: id={}, keycloakId={}", user.getId(), keycloakId);
            return user;

        } catch (Exception e) {
            log.error("Failed to create user from Keycloak: keycloakId={}, error={}", keycloakId, e.getMessage(), e);
            throw new RuntimeException("Failed to sync user from Keycloak: " + e.getMessage(), e);
        }
    }

    /**
     * Updates the last login timestamp for a user
     */
    @Transactional
    public void updateLastLogin(String keycloakId) {
        userRepository.findByKeycloakId(keycloakId).ifPresent(user -> {
            user.setLastLogin(Instant.now());
            userRepository.save(user);
        });
    }
}

