package com.kemkendra.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for {@link Notification} persistence.
 * All query methods are recipient-scoped to enforce IDOR protection.
 */
public interface NotificationRepository extends JpaRepository<Notification, UUID>, JpaSpecificationExecutor<Notification> {

    Page<Notification> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId, Pageable pageable);

    Page<Notification> findByRecipientIdAndReadFalseOrderByCreatedAtDesc(UUID recipientId, Pageable pageable);

    Page<Notification> findByRecipientIdAndCategoryOrderByCreatedAtDesc(UUID recipientId, NotificationCategory category, Pageable pageable);

    Page<Notification> findByRecipientIdAndCategoryAndReadOrderByCreatedAtDesc(UUID recipientId, NotificationCategory category, boolean read, Pageable pageable);

    long countByRecipientIdAndReadFalse(UUID recipientId);

    Optional<Notification> findByIdAndRecipientId(UUID id, UUID recipientId);

    List<Notification> findByRecipientIdAndReadFalse(UUID recipientId);

    List<Notification> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.createdAt >= :since")
    long countNotificationsSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.read = false")
    long countTotalUnreadNotifications();
}
