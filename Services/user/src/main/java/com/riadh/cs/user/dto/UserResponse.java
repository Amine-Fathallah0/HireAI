package com.riadh.cs.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    
    private Long id;
    private String keycloakId;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String city;
    private String country;
    private Boolean emailVerified;
    private Boolean isActive;
    private String role;
    private Boolean consentAiProcessing;
    private Integer consentVersion;
    private Instant termsAcceptedAt;
    private Instant createdAt;
    private Instant lastLogin;
}



