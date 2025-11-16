package com.riadh.cs.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private Integer expiresIn;
    private String tokenType = "Bearer";

    // User details
    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    
    // Registration/Operation response fields
    private Boolean success;
    private String message;
    private String keycloakId;
}
