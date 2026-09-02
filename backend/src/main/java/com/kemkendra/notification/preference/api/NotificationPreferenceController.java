package com.kemkendra.notification.preference.api;

import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.notification.preference.NotificationPreferenceService;
import com.kemkendra.notification.preference.dto.NotificationPreferenceDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users/me/notification-preferences")
public class NotificationPreferenceController {

    private final NotificationPreferenceService preferenceService;
    private final UserRepository userRepository;

    public NotificationPreferenceController(
            NotificationPreferenceService preferenceService,
            UserRepository userRepository) {
        this.preferenceService = preferenceService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("User must be authenticated");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("Authenticated user not found"));
    }

    @GetMapping
    public ResponseEntity<NotificationPreferencesResponse> getPreferences(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(preferenceService.getPreferencesForUser(user.getId()));
    }

    @PutMapping
    public ResponseEntity<NotificationPreferencesResponse> updatePreferences(
            @Valid @RequestBody BulkUpdateNotificationPreferencesRequest request,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(preferenceService.updatePreferences(user.getId(), request));
    }
}
