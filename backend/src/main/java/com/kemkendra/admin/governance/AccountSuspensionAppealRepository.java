package com.kemkendra.admin.governance;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountSuspensionAppealRepository extends JpaRepository<AccountSuspensionAppeal, UUID>, JpaSpecificationExecutor<AccountSuspensionAppeal> {

    @Query("SELECT a FROM AccountSuspensionAppeal a WHERE a.suspension.id = :suspensionId AND a.status IN :statuses ORDER BY a.createdAt DESC")
    List<AccountSuspensionAppeal> findActiveAppealsForSuspension(
            @Param("suspensionId") UUID suspensionId,
            @Param("statuses") Collection<AppealStatus> statuses
    );

    default Optional<AccountSuspensionAppeal> findActiveAppealForSuspension(UUID suspensionId, Collection<AppealStatus> statuses) {
        return findActiveAppealsForSuspension(suspensionId, statuses).stream().findFirst();
    }

    @Query("SELECT a FROM AccountSuspensionAppeal a WHERE a.user.id = :userId ORDER BY a.createdAt DESC")
    List<AccountSuspensionAppeal> findByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId);

    @Query("SELECT a FROM AccountSuspensionAppeal a WHERE a.suspension.id = :suspensionId ORDER BY a.createdAt DESC")
    List<AccountSuspensionAppeal> findBySuspensionIdOrderByCreatedAtDesc(@Param("suspensionId") UUID suspensionId);

    long countByStatus(AppealStatus status);

    long countByStatusIn(Collection<AppealStatus> statuses);

    @Query("SELECT COUNT(a) FROM AccountSuspensionAppeal a WHERE a.createdAt >= :since AND a.createdAt <= :until")
    long countAppealsBetween(@Param("since") Instant since, @Param("until") Instant until);
}
