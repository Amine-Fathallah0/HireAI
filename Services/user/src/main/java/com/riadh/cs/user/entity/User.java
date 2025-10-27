package com.riadh.cs.user.entity;

import lombok.*;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_email", columnList = "email", unique = true),
    @Index(name = "idx_users_keycloak_id", columnList = "keycloak_id", unique = true)
})
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "keycloak_id", unique = true, nullable = false)
    private String keycloakId;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String country;

    // Auth fields - some managed by Keycloak
    @Column(name = "email_verified")
    private Boolean emailVerified = false;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(length = 50)
    private String role = "user";

    // GDPR & Consent (business-specific, not in Keycloak)
    @Column(name = "terms_accepted_at")
    private Instant termsAcceptedAt;

    @Column(name = "consent_ai_processing")
    private Boolean consentAiProcessing = false;

    @Column(name = "consent_version")
    private Integer consentVersion = 1;

    // Timestamps
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "last_login")
    private Instant lastLogin;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
