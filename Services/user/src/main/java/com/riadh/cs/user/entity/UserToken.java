package com.riadh.cs.user.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "user_tokens", indexes = {
    @Index(name = "idx_user_tokens_user_id", columnList = "user_id"),
    @Index(name = "idx_user_tokens_jti_hash", columnList = "jti_hash", unique = true),
    @Index(name = "idx_user_tokens_expires_at", columnList = "expires_at")
})
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
public class UserToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Store hash of refresh token's JTI (JWT ID) from Keycloak
    @Column(name = "jti_hash", nullable = false, unique = true)
    private String jtiHash;

    // Token type: refresh, access (though we mainly track refresh tokens)
    @Column(name = "token_type", nullable = false, length = 50)
    private String tokenType;

    @Column(name = "client_id", length = 100)
    private String clientId;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "revoked")
    private Boolean revoked = false;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
