package com.riadh.cs.exception;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class KeycloakException extends RuntimeException {
    private final String message;
    
    public KeycloakException(String message) {
        super(message);
        this.message = message;
    }
    
    public KeycloakException(String message, Throwable cause) {
        super(message, cause);
        this.message = message;
    }
}



