package com.riadh.cs.user.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.ws.rs.core.Response;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakAdminService {

    @Value("${keycloak.auth-server-url}")
    private String keycloakServerUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.admin-realm:master}")
    private String adminRealm;

    @Value("${keycloak.admin-client-id}")
    private String adminClientId;

    @Value("${keycloak.admin-username}")
    private String adminUsername;

    @Value("${keycloak.admin-password}")
    private String adminPassword;

    private Keycloak keycloak;

    @PostConstruct
    public void init() {
        try {
            keycloak = Keycloak.getInstance(
                    keycloakServerUrl,
                    adminRealm,
                    adminUsername,
                    adminPassword,
                    adminClientId
            );
            log.info("Keycloak admin client initialized successfully");
        } catch (Exception e) {
            log.error("Failed to initialize Keycloak admin client", e);
        }
    }

    public String createUser(String email, String password, String firstName, String lastName) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UsersResource usersResource = realmResource.users();

            // Create user representation
            UserRepresentation user = new UserRepresentation();
            user.setUsername(email);
            user.setEmail(email);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setEnabled(true);
            user.setEmailVerified(false);

            // Create user
            Response response = usersResource.create(user);
            
            if (response.getStatus() != 201) {
                throw new RuntimeException("Failed to create user in Keycloak: " + response.getStatusInfo());
            }

            // Extract user ID from location header
            String locationHeader = response.getHeaderString("Location");
            String userId = locationHeader.substring(locationHeader.lastIndexOf('/') + 1);

            // Set password
            CredentialRepresentation credential = new CredentialRepresentation();
            credential.setType(CredentialRepresentation.PASSWORD);
            credential.setValue(password);
            credential.setTemporary(false);

            UserResource userResource = usersResource.get(userId);
            userResource.resetPassword(credential);

            log.info("User created in Keycloak: {}", userId);
            return userId;

        } catch (Exception e) {
            log.error("Failed to create user in Keycloak", e);
            throw new RuntimeException("Failed to create user in Keycloak: " + e.getMessage());
        }
    }

    public Map<String, Object> getUser(String keycloakId) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(keycloakId);
            UserRepresentation user = userResource.toRepresentation();

            Map<String, Object> userMap = new HashMap<>();
            userMap.put("email", user.getEmail());
            userMap.put("firstName", user.getFirstName());
            userMap.put("lastName", user.getLastName());
            userMap.put("emailVerified", user.isEmailVerified());
            userMap.put("enabled", user.isEnabled());

            return userMap;
        } catch (Exception e) {
            log.error("Failed to get user from Keycloak", e);
            throw new RuntimeException("Failed to get user from Keycloak: " + e.getMessage());
        }
    }

    public void updateUser(String keycloakId, String firstName, String lastName) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(keycloakId);
            UserRepresentation user = userResource.toRepresentation();

            user.setFirstName(firstName);
            user.setLastName(lastName);

            userResource.update(user);
            log.info("User updated in Keycloak: {}", keycloakId);
        } catch (Exception e) {
            log.error("Failed to update user in Keycloak", e);
            throw new RuntimeException("Failed to update user in Keycloak: " + e.getMessage());
        }
    }

    public void deleteUser(String keycloakId) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            realmResource.users().delete(keycloakId);
            log.info("User deleted from Keycloak: {}", keycloakId);
        } catch (Exception e) {
            log.error("Failed to delete user from Keycloak", e);
            throw new RuntimeException("Failed to delete user from Keycloak: " + e.getMessage());
        }
    }

    public void sendVerificationEmail(String keycloakId) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(keycloakId);
            userResource.sendVerifyEmail();
            log.info("Verification email sent to user: {}", keycloakId);
        } catch (Exception e) {
            log.error("Failed to send verification email", e);
            throw new RuntimeException("Failed to send verification email: " + e.getMessage());
        }
    }

    public void sendPasswordResetEmail(String keycloakId) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(keycloakId);
            userResource.executeActionsEmail(Arrays.asList("UPDATE_PASSWORD"));
            log.info("Password reset email sent to user: {}", keycloakId);
        } catch (Exception e) {
            log.error("Failed to send password reset email", e);
            throw new RuntimeException("Failed to send password reset email: " + e.getMessage());
        }
    }

    public void enableUser(String keycloakId, boolean enabled) {
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(keycloakId);
            UserRepresentation user = userResource.toRepresentation();
            user.setEnabled(enabled);
            userResource.update(user);
            log.info("User {} status changed to: {}", keycloakId, enabled);
        } catch (Exception e) {
            log.error("Failed to change user status in Keycloak", e);
            throw new RuntimeException("Failed to change user status in Keycloak: " + e.getMessage());
        }
    }
}



