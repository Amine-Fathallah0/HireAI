package com.riadh.cs.handler;

import com.riadh.cs.exception.InvalidTokenException;
import com.riadh.cs.exception.KeycloakException;
import com.riadh.cs.exception.UserNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.http.HttpStatus.*;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleUserNotFoundException(RuntimeException exception) {
        log.error("User not found: {}", exception.getMessage());
        return ResponseEntity
                .status(NOT_FOUND)
                .body(Map.of("error", "User not found", "message", exception.getMessage()));
    }

    @ExceptionHandler(KeycloakException.class)
    public ResponseEntity<Map<String, String>> handleKeycloakException(KeycloakException exception) {
        log.error("Keycloak error: {}", exception.getMessage(), exception);
        return ResponseEntity
                .status(BAD_REQUEST)
                .body(Map.of("error", "Authentication service error", "message", exception.getMessage()));
    }

    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<Map<String, String>> handleInvalidTokenException(InvalidTokenException exception) {
        log.error("Invalid token: {}", exception.getMessage());
        return ResponseEntity
                .status(UNAUTHORIZED)
                .body(Map.of("error", "Invalid token", "message", exception.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentialsException(BadCredentialsException exception) {
        log.error("Bad credentials: {}", exception.getMessage());
        return ResponseEntity
                .status(UNAUTHORIZED)
                .body(Map.of("error", "Invalid credentials", "message", "Email or password is incorrect"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDeniedException(AccessDeniedException exception) {
        log.error("Access denied: {}", exception.getMessage());
        return ResponseEntity
                .status(FORBIDDEN)
                .body(Map.of("error", "Access denied", "message", "You don't have permission to access this resource"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(MethodArgumentNotValidException exp) {
        var errors = new HashMap<String, String>();
        exp.getBindingResult().getAllErrors()
                .forEach(error -> {
                    var fieldName = ((FieldError) error).getField();
                    var errorMessage = error.getDefaultMessage();
                    errors.put(fieldName, errorMessage);
                });

        return ResponseEntity
                .status(BAD_REQUEST)
                .body(new ErrorResponse(errors));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception exception) {
        log.error("Unexpected error: {}", exception.getMessage(), exception);
        return ResponseEntity
                .status(INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Internal server error", "message", "An unexpected error occurred"));
    }
}


