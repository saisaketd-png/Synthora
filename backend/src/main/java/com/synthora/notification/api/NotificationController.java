package com.synthora.notification.api;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.notification.NotificationService;
import com.synthora.notification.dto.NotificationResponse;
import com.synthora.notification.dto.UnreadCountResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST API for user notifications.
 * All operations are strictly scoped to the authenticated user.
 */
@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public NotificationController(NotificationService notificationService, UserRepository userRepository) {
        this.notificationService = notificationService;
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
    public Page<NotificationResponse> getNotifications(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return notificationService.getNotifications(user.getId(), pageable);
    }

    @GetMapping("/unread-count")
    public UnreadCountResponse getUnreadCount(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return new UnreadCountResponse(notificationService.getUnreadCount(user.getId()));
    }

    @PutMapping("/{id}/read")
    public NotificationResponse markAsRead(@PathVariable UUID id, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return notificationService.markAsRead(id, user.getId());
    }

    @PutMapping("/read-all")
    public UnreadCountResponse markAllAsRead(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        int count = notificationService.markAllAsRead(user.getId());
        return new UnreadCountResponse(count);
    }
}
