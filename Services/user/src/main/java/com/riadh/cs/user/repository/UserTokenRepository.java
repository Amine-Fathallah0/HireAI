package com.riadh.cs.user.repository;

import com.riadh.cs.user.entity.UserToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserTokenRepository extends JpaRepository<UserToken, Long> {
    
    Optional<UserToken> findByJtiHashAndTokenTypeAndRevokedFalse(String jtiHash, String tokenType);
    
    List<UserToken> findByUserIdAndRevokedFalse(Long userId);
    
    @Query("SELECT t FROM UserToken t WHERE t.expiresAt < :now AND t.revoked = false")
    List<UserToken> findExpiredTokens(Instant now);
    
    void deleteByUserIdAndRevoked(Long userId, Boolean revoked);
}



