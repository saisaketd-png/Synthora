package com.synthora.identity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, UUID> {

    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);

    List<EmailVerificationToken> findByUserAndUsedAtIsNull(User user);

    Optional<EmailVerificationToken> findFirstByUserOrderByCreatedAtDesc(User user);

    @Modifying
    @Query("UPDATE EmailVerificationToken e SET e.usedAt = :usedAt WHERE e.user = :user AND e.usedAt IS NULL")
    void invalidateActiveTokensForUser(@Param("user") User user, @Param("usedAt") Instant usedAt);
}
