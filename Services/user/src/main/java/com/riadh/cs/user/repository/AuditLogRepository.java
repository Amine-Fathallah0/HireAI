package com.riadh.cs.user.repository;

import com.riadh.cs.user.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    List<AuditLog> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<AuditLog> findByUserIdAndCreatedAtBetween(Long userId, Instant startDate, Instant endDate);
    
    List<AuditLog> findByActionAndStatus(String action, String status);
    
    long countByUserIdAndActionAndStatus(Long userId, String action, String status);
}



