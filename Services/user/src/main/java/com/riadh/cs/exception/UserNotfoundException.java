package com.riadh.cs.exception;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class UserNotFoundException extends RuntimeException {
    private final String message;
    
    public UserNotFoundException(String message) {
        super(message);
        this.message = message;
    }
}
