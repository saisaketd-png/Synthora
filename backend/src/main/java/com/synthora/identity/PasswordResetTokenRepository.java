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
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    List<PasswordResetToken> findByUserAndUsedAtIsNull(User user);

    @Modifying
    @Query("UPDATE PasswordResetToken p SET p.usedAt = :usedAt WHERE p.user = :user AND p.usedAt IS NULL")
    void invalidateActiveTokensForUser(@Param("user") User user, @Param("usedAt") Instant usedAt);
}
