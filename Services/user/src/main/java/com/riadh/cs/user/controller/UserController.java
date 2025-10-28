package com.riadh.cs.user.controller;

import com.riadh.cs.user.dto.UserResponse;
import com.riadh.cs.user.dto.UserUpdateRequest;
import com.riadh.cs.user.entity.User;
import com.riadh.cs.user.service.UserService;
import com.riadh.cs.user.service.UserSyncService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;
    private final UserSyncService userSyncService;

    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getProfile(
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest httpRequest) {
        
        try {
            log.info("=== Getting user profile ===");
            
            // Auto-sync user from Keycloak if not exists in PostgreSQL
            String ipAddress = getClientIpAddress(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");
            
            log.info("Syncing user from Keycloak...");
            User user = userSyncService.syncUserFromKeycloak(jwt, ipAddress, userAgent);
            log.info("User synced: id={}, email={}", user.getId(), user.getEmail());
            
            // Update last login
            log.info("Updating last login...");
            userSyncService.updateLastLogin(user.getKeycloakId());
            log.info("Last login updated");
            
            // Return user profile
            log.info("Building user response...");
            UserResponse response = userService.getUserByKeycloakId(user.getKeycloakId());
            log.info("User response ready");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting user profile: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get user profile: " + e.getMessage(), e);
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UserUpdateRequest request) {
        
        String keycloakId = jwt.getSubject();
        UserResponse response = userService.updateUser(keycloakId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/profile")
    public ResponseEntity<Void> deleteAccount(@AuthenticationPrincipal Jwt jwt) {
        String keycloakId = jwt.getSubject();
        userService.deleteUser(keycloakId);
        return ResponseEntity.noContent().build();
    }

    // GDPR endpoints
    @GetMapping("/profile/export")
    public ResponseEntity<?> exportData(@AuthenticationPrincipal Jwt jwt) {
        String keycloakId = jwt.getSubject();
        return ResponseEntity.ok(userService.exportUserData(keycloakId));
    }

    @PutMapping("/profile/consent")
    public ResponseEntity<Void> updateConsent(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam Boolean consentAiProcessing) {
        
        String keycloakId = jwt.getSubject();
        userService.updateConsent(keycloakId, consentAiProcessing);
        return ResponseEntity.ok().build();
    }

    // Admin endpoints
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        List<UserResponse> users = userService.getAllUsers(page, size);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long userId) {
        UserResponse response = userService.getUserById(userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId) {
        userService.deleteUserById(userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{userId}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> activateUser(@PathVariable Long userId) {
        userService.activateUser(userId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{userId}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivateUser(@PathVariable Long userId) {
        userService.deactivateUser(userId);
        return ResponseEntity.ok().build();
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}



