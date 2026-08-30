package com.kemkendra.notification.api;

import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.notification.NotificationService;
import com.kemkendra.notification.dto.NotificationResponse;
import com.kemkendra.notification.dto.UnreadCountResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.kemkendra.notification.NotificationStreamService;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

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
    private final NotificationStreamService notificationStreamService;

    public NotificationController(
            NotificationService notificationService,
            UserRepository userRepository,
            NotificationStreamService notificationStreamService) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.notificationStreamService = notificationStreamService;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("User must be authenticated");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("Authenticated user not found"));
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return notificationStreamService.subscribe(user.getId());
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
