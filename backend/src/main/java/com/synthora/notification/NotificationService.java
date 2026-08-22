package com.synthora.notification;

import com.synthora.common.ResourceNotFoundException;
import com.synthora.notification.dto.NotificationResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;

@Service
@Transactional
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationStreamService notificationStreamService;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            NotificationStreamService notificationStreamService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.notificationStreamService = notificationStreamService;
    }

    /**
     * Persists a new notification for a specific recipient user UUID.
     */
    public Notification createNotification(
            UUID recipientId,
            NotificationType type,
            String title,
            String message,
            NotificationEntityType entityType,
            UUID entityId) {

        if (recipientId == null) {
            log.warn("Cannot create notification: recipientId is null for type {}", type);
            return null;
        }

        Notification notification = new Notification();
        notification.setRecipientId(recipientId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setEntityType(entityType);
        notification.setEntityId(entityId);
        notification.setRead(false);

        Notification saved = notificationRepository.save(notification);
        log.debug("Created notification {} for recipient {}", saved.getId(), recipientId);

        try {
            long unreadCount = notificationRepository.countByRecipientIdAndReadFalse(recipientId);
            notificationStreamService.sendNotification(recipientId, NotificationResponse.from(saved), unreadCount);
        } catch (Exception e) {
            log.debug("Failed to push real-time notification stream event: {}", e.getMessage());
        }

        return saved;
    }

    /**
     * Persists a notification for all active admin users.
     */
    public void notifyAdmins(
            NotificationType type,
            String title,
            String message,
            NotificationEntityType entityType,
            UUID entityId) {
        List<User> admins = userRepository.findByRoleAndStatusAndDeletedAtIsNull(UserRole.ADMIN, UserStatus.ACTIVE);
        for (User admin : admins) {
            createNotification(admin.getId(), type, title, message, entityType, entityId);
        }
    }

    public Notification notifyUser(
            UUID userId,
            NotificationType type,
            String title,
            String message,
            NotificationEntityType entityType,
            UUID entityId) {
        return createNotification(userId, type, title, message, entityType, entityId);
    }

    public Notification notifyBuyer(
            UUID buyerUserId,
            NotificationType type,
            String title,
            String message,
            NotificationEntityType entityType,
            UUID entityId) {
        return createNotification(buyerUserId, type, title, message, entityType, entityId);
    }

    public Notification notifySupplier(
            UUID supplierUserId,
            NotificationType type,
            String title,
            String message,
            NotificationEntityType entityType,
            UUID entityId) {
        return createNotification(supplierUserId, type, title, message, entityType, entityId);
    }

    /**
     * Returns paginated notifications scoped strictly to the authenticated user's ID.
     * Enforces bounded pagination limits (max size 100) to protect against DoS.
     */
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(UUID recipientId, Pageable pageable) {
        int pageNumber = Math.max(0, pageable.getPageNumber());
        int pageSize = Math.min(Math.max(1, pageable.getPageSize()), 100);
        Sort sort = pageable.getSort().isSorted() ? pageable.getSort() : Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id"));
        Pageable boundedPageable = PageRequest.of(pageNumber, pageSize, sort);
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId, boundedPageable)
                .map(NotificationResponse::from);
    }

    /**
     * Returns unread count scoped strictly to the authenticated user's ID.
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID recipientId) {
        return notificationRepository.countByRecipientIdAndReadFalse(recipientId);
    }

    /**
     * Marks a single notification as read, ensuring ownership by the authenticated user.
     * Returns 404 (ResourceNotFoundException) if the notification does not exist or belongs to another user.
     */
    public NotificationResponse markAsRead(UUID notificationId, UUID recipientId) {
        Notification notification = notificationRepository.findByIdAndRecipientId(notificationId, recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notification = notificationRepository.save(notification);
        }

        return NotificationResponse.from(notification);
    }

    /**
     * Marks all unread notifications for the authenticated user as read.
     * Returns the count of notifications marked as read.
     */
    public int markAllAsRead(UUID recipientId) {
        List<Notification> unreadList = notificationRepository.findByRecipientIdAndReadFalse(recipientId);
        if (unreadList.isEmpty()) {
            return 0;
        }

        LocalDateTime now = LocalDateTime.now();
        for (Notification n : unreadList) {
            n.setRead(true);
            n.setReadAt(now);
        }

        notificationRepository.saveAll(unreadList);
        return unreadList.size();
    }
}
