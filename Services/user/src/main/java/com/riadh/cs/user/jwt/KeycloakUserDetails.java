package com.riadh.cs.user.jwt;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents user details extracted from Keycloak JWT
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KeycloakUserDetails {
    
    private String keycloakId;
    private Long userId; // Local database user ID
    private String username;
    private String email;
    private Boolean emailVerified;
    private String firstName;
    private String lastName;
    private String preferredUsername;
}



