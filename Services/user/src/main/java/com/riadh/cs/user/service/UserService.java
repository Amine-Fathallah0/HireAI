package com.riadh.cs.user.service;

import com.riadh.cs.user.dto.UserResponse;
import com.riadh.cs.user.dto.UserUpdateRequest;
import com.riadh.cs.user.entity.User;
import com.riadh.cs.user.repository.UserRepository;
import com.riadh.cs.user.repository.UserTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final UserTokenRepository userTokenRepository;
    private final KeycloakAdminService keycloakAdminService;
    private final AuditService auditService;

    public UserResponse getUserByKeycloakId(String keycloakId) {
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToUserResponse(user);
    }

    public UserResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToUserResponse(user);
    }

    public List<UserResponse> getAllUsers(int page, int size) {
        return userRepository.findAll(PageRequest.of(page, size))
                .stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse updateUser(String keycloakId, UserUpdateRequest request) {
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update local database
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getCity() != null) {
            user.setCity(request.getCity());
        }
        if (request.getCountry() != null) {
            user.setCountry(request.getCountry());
        }

        user = userRepository.save(user);

        // Update Keycloak if name changed
        if (request.getFirstName() != null || request.getLastName() != null) {
            keycloakAdminService.updateUser(
                    keycloakId,
                    user.getFirstName(),
                    user.getLastName()
            );
        }

        auditService.logAction(user.getId(), "UPDATE_PROFILE", "user", user.getId(),
                null, null, "success", null);

        return mapToUserResponse(user);
    }

    @Transactional
    public void deleteUser(String keycloakId) {
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Delete from Keycloak
        keycloakAdminService.deleteUser(keycloakId);

        // Delete tokens
        userTokenRepository.deleteByUserIdAndRevoked(user.getId(), false);

        // Delete user from local database
        userRepository.delete(user);

        auditService.logAction(user.getId(), "DELETE_ACCOUNT", "user", user.getId(),
                null, null, "success", null);

        log.info("User deleted: {}", user.getId());
    }

    @Transactional
    public void deleteUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        deleteUser(user.getKeycloakId());
    }

    @Transactional
    public void updateConsent(String keycloakId, Boolean consentAiProcessing) {
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setConsentAiProcessing(consentAiProcessing);
        user.setConsentVersion(user.getConsentVersion() + 1);
        userRepository.save(user);

        auditService.logAction(user.getId(), "UPDATE_CONSENT", "user", user.getId(),
                null, null, "success", "AI consent: " + consentAiProcessing);
    }

    @Transactional
    public void activateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setIsActive(true);
        userRepository.save(user);

        keycloakAdminService.enableUser(user.getKeycloakId(), true);

        auditService.logAction(user.getId(), "ACTIVATE_USER", "user", user.getId(),
                null, null, "success", null);
    }

    @Transactional
    public void deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setIsActive(false);
        userRepository.save(user);

        keycloakAdminService.enableUser(user.getKeycloakId(), false);

        auditService.logAction(user.getId(), "DEACTIVATE_USER", "user", user.getId(),
                null, null, "success", null);
    }

    public Map<String, Object> exportUserData(String keycloakId) {
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> data = new HashMap<>();
        data.put("id", user.getId());
        data.put("email", user.getEmail());
        data.put("firstName", user.getFirstName());
        data.put("lastName", user.getLastName());
        data.put("phoneNumber", user.getPhoneNumber());
        data.put("city", user.getCity());
        data.put("country", user.getCountry());
        data.put("consentAiProcessing", user.getConsentAiProcessing());
        data.put("createdAt", user.getCreatedAt());
        data.put("lastLogin", user.getLastLogin());

        // Add audit logs
        data.put("auditLogs", auditService.getUserAuditLogs(user.getId()));

        auditService.logAction(user.getId(), "EXPORT_DATA", "user", user.getId(),
                null, null, "success", null);

        return data;
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .keycloakId(user.getKeycloakId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .city(user.getCity())
                .country(user.getCountry())
                .emailVerified(user.getEmailVerified())
                .isActive(user.getIsActive())
                .role(user.getRole())
                .consentAiProcessing(user.getConsentAiProcessing())
                .consentVersion(user.getConsentVersion())
                .termsAcceptedAt(user.getTermsAcceptedAt())
                .createdAt(user.getCreatedAt())
                .lastLogin(user.getLastLogin())
                .build();
    }
}



