package com.kemkendra.notification;

import com.kemkendra.common.ResourceNotFoundException;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.notification.dto.NotificationResponse;
import com.kemkendra.notification.preference.NotificationPreferenceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationStreamService notificationStreamService;
    private final NotificationPreferenceService preferenceService;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            NotificationStreamService notificationStreamService,
            NotificationPreferenceService preferenceService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.notificationStreamService = notificationStreamService;
        this.preferenceService = preferenceService;
    }

    /**
     * Persists a new notification with full category and priority support.
     * Enforces user channel preferences before creating in-app notification records.
     */
    public Notification createNotification(
            UUID recipientId,
            NotificationType type,
            NotificationCategory category,
            NotificationPriority priority,
            String title,
            String message,
            NotificationEntityType entityType,
            UUID entityId) {

        if (recipientId == null) {
            log.warn("Cannot create notification: recipientId is null for type {}", type);
            return null;
        }

        NotificationCategory effectiveCategory = category != null ? category : Notification.deriveCategoryFromType(type);
        NotificationPriority effectivePriority = priority != null ? priority : Notification.derivePriorityFromType(type);

        // Check user notification preferences (mandatory categories are always enabled)
        if (!preferenceService.isInAppEnabled(recipientId, effectiveCategory)) {
            log.debug("In-app notification suppressed by user preference for recipient {} category {}", recipientId, effectiveCategory);
            return null;
        }

        Notification notification = new Notification();
        notification.setRecipientId(recipientId);
        notification.setType(type);
        notification.setCategory(effectiveCategory);
        notification.setPriority(effectivePriority);
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

    public Notification createNotification(
            UUID recipientId,
            NotificationType type,
            String title,
            String message,
            NotificationEntityType entityType,
            UUID entityId) {
        return createNotification(
                recipientId,
                type,
                Notification.deriveCategoryFromType(type),
                Notification.derivePriorityFromType(type),
                title,
                message,
                entityType,
                entityId
        );
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
     * Returns paginated notifications scoped strictly to the authenticated user's ID
     * with optional category and read status filtering.
     */
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(
            UUID recipientId,
            NotificationCategory category,
            Boolean read,
            Pageable pageable) {

        int pageNumber = Math.max(0, pageable.getPageNumber());
        int pageSize = Math.min(Math.max(1, pageable.getPageSize()), 100);
        Sort sort = pageable.getSort().isSorted() ? pageable.getSort() : Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id"));
        Pageable boundedPageable = PageRequest.of(pageNumber, pageSize, sort);

        Specification<Notification> spec = (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            predicates.add(cb.equal(root.get("recipientId"), recipientId));

            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }
            if (read != null) {
                predicates.add(cb.equal(root.get("read"), read));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        return notificationRepository.findAll(spec, boundedPageable)
                .map(NotificationResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(UUID recipientId, Pageable pageable) {
        return getNotifications(recipientId, null, null, pageable);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID recipientId) {
        return notificationRepository.countByRecipientIdAndReadFalse(recipientId);
    }

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
