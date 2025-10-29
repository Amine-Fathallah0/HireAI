package com.riadh.cs.user.controller;

import com.riadh.cs.user.service.UserCleanupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin endpoints for user cleanup and maintenance operations.
 * These endpoints should be secured and only accessible by administrators.
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final UserCleanupService userCleanupService;

    /**
     * Manually trigger cleanup of orphaned users.
     * POST /api/v1/admin/cleanup/orphaned
     */
    @PostMapping("/cleanup/orphaned")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> cleanupOrphanedUsers(
            @RequestParam(required = false) String keycloakId,
            @RequestParam(required = false, defaultValue = "Manual cleanup") String reason) {
        
        log.info("Manual cleanup triggered by admin: keycloakId={}, reason={}", keycloakId, reason);
        
        try {
            if (keycloakId != null) {
                // Clean up specific user
                userCleanupService.cleanupOrphanedUser(keycloakId, reason);
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Orphaned user cleaned up successfully",
                    "keycloakId", keycloakId
                ));
            } else {
                // Clean up all failed registrations
                userCleanupService.cleanupFailedRegistrations();
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Failed registrations cleanup completed"
                ));
            }
            
        } catch (Exception e) {
            log.error("Cleanup failed", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    /**
     * Verify data consistency between Keycloak and PostgreSQL.
     * GET /api/v1/admin/consistency/check
     */
    @GetMapping("/consistency/check")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserCleanupService.ConsistencyReport> checkDataConsistency() {
        log.info("Data consistency check triggered by admin");
        
        try {
            UserCleanupService.ConsistencyReport report = userCleanupService.verifyDataConsistency();
            return ResponseEntity.ok(report);
            
        } catch (Exception e) {
            log.error("Consistency check failed", e);
            UserCleanupService.ConsistencyReport errorReport = new UserCleanupService.ConsistencyReport();
            errorReport.setError(e.getMessage());
            return ResponseEntity.internalServerError().body(errorReport);
        }
    }

    /**
     * Get system health information.
     * GET /api/v1/admin/health
     */
    @GetMapping("/health")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getSystemHealth() {
        log.info("System health check triggered by admin");
        
        try {
            UserCleanupService.ConsistencyReport consistencyReport = userCleanupService.verifyDataConsistency();
            
            Map<String, Object> health = Map.of(
                "status", consistencyReport.isConsistent() ? "HEALTHY" : "DEGRADED",
                "consistency", consistencyReport,
                "timestamp", System.currentTimeMillis()
            );
            
            return ResponseEntity.ok(health);
            
        } catch (Exception e) {
            log.error("Health check failed", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "UNHEALTHY",
                "error", e.getMessage(),
                "timestamp", System.currentTimeMillis()
            ));
        }
    }
}
