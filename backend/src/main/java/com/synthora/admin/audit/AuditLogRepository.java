package com.synthora.admin.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID>, JpaSpecificationExecutor<AuditLog> {

    /**
     * Retrieves paginated audit logs for a specific administrator, newest first.
     */
    Page<AuditLog> findByAdminIdOrderByCreatedAtDesc(UUID adminId, Pageable pageable);

    /**
     * Retrieves paginated audit logs for a specific target entity, newest first.
     */
    Page<AuditLog> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(
            AuditTargetType targetType,
            String targetId,
            Pageable pageable
    );

    /**
     * Retrieves unpaginated list of audit logs for a specific target entity, newest first.
     */
    List<AuditLog> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(
            AuditTargetType targetType,
            String targetId
    );

    /**
     * Retrieves paginated audit logs filtered by a specific action, newest first.
     */
    Page<AuditLog> findByActionOrderByCreatedAtDesc(AuditAction action, Pageable pageable);

    /**
     * Retrieves global chronological audit log feed.
     */
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Counts audit events recorded since a specific timestamp.
     */
    long countByCreatedAtGreaterThanEqual(LocalDateTime from);

    /**
     * Counts audit events for a specific set of actions.
     */
    long countByActionIn(Collection<AuditAction> actions);
}
