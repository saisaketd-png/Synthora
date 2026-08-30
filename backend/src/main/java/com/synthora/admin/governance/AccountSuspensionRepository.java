package com.synthora.admin.governance;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountSuspensionRepository extends JpaRepository<AccountSuspension, UUID>, JpaSpecificationExecutor<AccountSuspension> {

    @Query("SELECT s FROM AccountSuspension s WHERE s.user.id = :userId AND s.reinstatedAt IS NULL ORDER BY s.suspendedAt DESC")
    Optional<AccountSuspension> findActiveSuspensionByUserId(@Param("userId") UUID userId);

    @Query("SELECT s FROM AccountSuspension s WHERE s.user.id = :userId ORDER BY s.suspendedAt DESC")
    List<AccountSuspension> findHistoryByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(s) FROM AccountSuspension s WHERE s.reinstatedAt IS NULL")
    long countActiveSuspensions();

    @Query("SELECT COUNT(s) FROM AccountSuspension s WHERE s.suspendedAt >= :since AND s.suspendedAt <= :until")
    long countSuspensionsBetween(@Param("since") Instant since, @Param("until") Instant until);

    @Query("SELECT COUNT(s) FROM AccountSuspension s WHERE s.reinstatedAt IS NOT NULL")
    long countTotalReinstated();
}
