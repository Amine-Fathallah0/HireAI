package com.riadh.cs.exception;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class InvalidTokenException extends RuntimeException {
    private final String message;
    
    public InvalidTokenException(String message) {
        super(message);
        this.message = message;
    }
}



