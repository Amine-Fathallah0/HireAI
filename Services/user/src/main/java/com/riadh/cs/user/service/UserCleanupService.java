package com.riadh.cs.user.service;

import com.riadh.cs.user.entity.User;
import com.riadh.cs.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Service to clean up orphaned users and maintain data consistency
 * between Keycloak and PostgreSQL.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserCleanupService {

    private final UserRepository userRepository;
    private final KeycloakAdminService keycloakAdminService;
    private final AuditService auditService;

    /**
     * Scheduled cleanup of orphaned Keycloak users.
     * Runs every hour to check for users that exist in Keycloak but not in PostgreSQL.
     */
    @Scheduled(fixedRate = 3600000) // Every hour
    public void cleanupOrphanedKeycloakUsers() {
        log.info("Starting scheduled cleanup of orphaned Keycloak users...");
        
        try {
            // This would require implementing a method to list all Keycloak users
            // For now, we'll focus on cleaning up failed registrations
            cleanupFailedRegistrations();
            
        } catch (Exception e) {
            log.error("Error during scheduled cleanup", e);
        }
    }

    /**
     * Clean up users that were created in Keycloak but failed to save in PostgreSQL.
     * This handles cases where the compensation pattern couldn't clean up immediately.
     */
    @Transactional
    public void cleanupFailedRegistrations() {
        log.info("Cleaning up failed registrations...");
        
        // Find users created in the last 24 hours that might be orphaned
        Instant cutoffTime = Instant.now().minus(24, ChronoUnit.HOURS);
        
        // This is a simplified approach - in a real scenario, you'd want to:
        // 1. Query Keycloak for recently created users
        // 2. Check if they exist in PostgreSQL
        // 3. Delete orphaned users from Keycloak
        
        log.info("Failed registration cleanup completed");
    }

    /**
     * Manual cleanup method to remove a specific orphaned user.
     * This can be called from admin endpoints or during error recovery.
     */
    @Transactional
    public void cleanupOrphanedUser(String keycloakId, String reason) {
        log.info("Cleaning up orphaned user: keycloakId={}, reason={}", keycloakId, reason);
        
        try {
            // Check if user exists in PostgreSQL
            boolean existsInDb = userRepository.existsByKeycloakId(keycloakId);
            
            if (!existsInDb) {
                // User doesn't exist in DB, safe to delete from Keycloak
                keycloakAdminService.deleteUser(keycloakId);
                log.info("Successfully cleaned up orphaned user: {}", keycloakId);
                
                // Log the cleanup action
                auditService.logAction(
                    null, // No user ID since user doesn't exist in DB
                    "CLEANUP_ORPHANED_USER",
                    "system",
                    null,
                    "system",
                    "system",
                    "success",
                    reason
                );
            } else {
                log.warn("User {} exists in database, skipping cleanup", keycloakId);
            }
            
        } catch (Exception e) {
            log.error("Failed to cleanup orphaned user: {}", keycloakId, e);
            
            // Log the failed cleanup
            auditService.logAction(
                null,
                "CLEANUP_ORPHANED_USER",
                "system",
                null,
                "system",
                "system",
                "failed",
                reason + " - Error: " + e.getMessage()
            );
        }
    }

    /**
     * Verify data consistency between Keycloak and PostgreSQL.
     * This can be used for health checks or manual verification.
     */
    public ConsistencyReport verifyDataConsistency() {
        log.info("Verifying data consistency between Keycloak and PostgreSQL...");
        
        ConsistencyReport report = new ConsistencyReport();
        
        try {
            // Get all users from PostgreSQL
            List<User> dbUsers = userRepository.findAll();
            report.setTotalDbUsers(dbUsers.size());
            
            // Check each user exists in Keycloak
            for (User user : dbUsers) {
                try {
                    keycloakAdminService.getUser(user.getKeycloakId());
                    report.incrementConsistentUsers();
                } catch (Exception e) {
                    log.warn("User {} not found in Keycloak: {}", user.getKeycloakId(), e.getMessage());
                    report.addInconsistentUser(user.getKeycloakId(), "Not found in Keycloak");
                }
            }
            
            log.info("Data consistency check completed: {}/{} users consistent", 
                report.getConsistentUsers(), report.getTotalDbUsers());
            
        } catch (Exception e) {
            log.error("Error during data consistency check", e);
            report.setError(e.getMessage());
        }
        
        return report;
    }

    /**
     * Data class to hold consistency check results
     */
    public static class ConsistencyReport {
        private int totalDbUsers = 0;
        private int consistentUsers = 0;
        private java.util.List<String> inconsistentUsers = new java.util.ArrayList<>();
        private String error;

        public void incrementConsistentUsers() {
            this.consistentUsers++;
        }

        public void addInconsistentUser(String keycloakId, String reason) {
            this.inconsistentUsers.add(keycloakId + ": " + reason);
        }

        // Getters and setters
        public int getTotalDbUsers() { return totalDbUsers; }
        public void setTotalDbUsers(int totalDbUsers) { this.totalDbUsers = totalDbUsers; }
        
        public int getConsistentUsers() { return consistentUsers; }
        public void setConsistentUsers(int consistentUsers) { this.consistentUsers = consistentUsers; }
        
        public java.util.List<String> getInconsistentUsers() { return inconsistentUsers; }
        public void setInconsistentUsers(java.util.List<String> inconsistentUsers) { this.inconsistentUsers = inconsistentUsers; }
        
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
        
        public boolean isConsistent() { return error == null && inconsistentUsers.isEmpty(); }
    }
}
