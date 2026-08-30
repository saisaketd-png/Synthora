package com.kemkendra.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for {@link Notification} persistence.
 * <p>
 * All query methods are recipient-scoped to support the IDOR protection model
 * defined in Phase 2F.1: a recipient can only retrieve notifications where
 * {@code recipient_id = authenticatedUser.id}. Service-layer enforcement is
 * added in Phase 2F.3.
 * </p>
 */
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    /**
     * Returns paginated notifications for a recipient, most recent first.
     * Backed by {@code idx_notifications_recipient_read_created}.
     */
    Page<Notification> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId, Pageable pageable);

    /**
     * Returns paginated unread notifications for a recipient.
     * Backed by {@code idx_notifications_recipient_read_created}.
     */
    Page<Notification> findByRecipientIdAndReadFalseOrderByCreatedAtDesc(UUID recipientId, Pageable pageable);

    /**
     * Returns the count of unread notifications for a recipient.
     * Backed by {@code idx_notifications_recipient_unread} (partial index).
     */
    long countByRecipientIdAndReadFalse(UUID recipientId);

    /**
     * Ownership-scoped lookup for a single notification.
     * Returns empty if the notification does not exist OR belongs to a
     * different recipient — used for IDOR protection in Phase 2F.3.
     */
    Optional<Notification> findByIdAndRecipientId(UUID id, UUID recipientId);

    /**
     * Retrieves all unread notifications for a recipient (non-paginated).
     * Used internally for "mark all as read" bulk operations in Phase 2F.3.
     */
    java.util.List<Notification> findByRecipientIdAndReadFalse(UUID recipientId);

    /**
     * Retrieves all notifications for a recipient ordered by creation date desc.
     */
    java.util.List<Notification> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId);
}
