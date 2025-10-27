package com.riadh.cs.user.service;

import com.riadh.cs.user.entity.AuditLog;
import com.riadh.cs.user.entity.User;
import com.riadh.cs.user.repository.AuditLogRepository;
import com.riadh.cs.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Transactional
    public void logAction(Long userId, String action, String resourceType, Long resourceId,
                          String ipAddress, String userAgent, String status, String errorMessage) {
        try {
            User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

            AuditLog auditLog = AuditLog.builder()
                    .user(user)
                    .action(action)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .status(status)
                    .errorMessage(errorMessage)
                    .build();

            auditLogRepository.save(auditLog);
            log.info("Audit log created: action={}, userId={}, status={}", action, userId, status);
        } catch (Exception e) {
            log.error("Failed to create audit log", e);
            // Don't throw exception - audit logging should not break main flow
        }
    }

    public List<AuditLog> getUserAuditLogs(Long userId) {
        return auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<AuditLog> getUserAuditLogsByDateRange(Long userId, Instant startDate, Instant endDate) {
        return auditLogRepository.findByUserIdAndCreatedAtBetween(userId, startDate, endDate);
    }

    public long countFailedLoginAttempts(Long userId) {
        return auditLogRepository.countByUserIdAndActionAndStatus(userId, "LOGIN", "failed");
    }
}



