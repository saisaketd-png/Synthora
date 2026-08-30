package com.kemkendra.governance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GovernanceAuditLogRepository extends JpaRepository<GovernanceAuditLog, UUID> {
    List<GovernanceAuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, String entityId);
    List<GovernanceAuditLog> findByActorIdOrderByTimestampDesc(UUID actorId);
    List<GovernanceAuditLog> findTop100ByOrderByTimestampDesc();
}
