package com.kemkendra.identity.service;

import com.kemkendra.admin.audit.AuditAction;
import com.kemkendra.admin.audit.AuditService;
import com.kemkendra.admin.audit.AuditTargetType;
import com.kemkendra.identity.RefreshToken;
import com.kemkendra.identity.RefreshTokenRepository;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.identity.dto.RefreshTokenResponse;
import com.kemkendra.identity.dto.RefreshTokenRotateResult;
import com.kemkendra.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int RAW_TOKEN_BYTE_LENGTH = 32;

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuditService auditService;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpiration; // 7 days in ms = 604,800,000

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
                               UserRepository userRepository,
                               JwtService jwtService,
                               AuditService auditService) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.auditService = auditService;
    }

    public static String hashToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new BadCredentialsException("Invalid or expired session");
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", e);
        }
    }

    public String generateRawToken() {
        byte[] randomBytes = new byte[RAW_TOKEN_BYTE_LENGTH];
        SECURE_RANDOM.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    @Transactional
    public CreatedSession createSession(User user, String ip, String userAgent) {
        UUID familyId = UUID.randomUUID();
        Instant now = Instant.now();
        Instant sessionAbsoluteExpiresAt = now.plusMillis(refreshExpiration);
        Instant tokenExpiresAt = sessionAbsoluteExpiresAt;

        String rawToken = generateRawToken();
        String tokenHash = hashToken(rawToken);

        RefreshToken refreshToken = new RefreshToken(
                UUID.randomUUID(),
                user,
                tokenHash,
                familyId,
                sessionAbsoluteExpiresAt,
                tokenExpiresAt,
                ip,
                userAgent
        );

        refreshTokenRepository.save(refreshToken);

        try {
            auditService.recordUserAction(
                    user,
                    AuditAction.AUTH_LOGIN_SUCCESS,
                    AuditTargetType.USER,
                    user.getId().toString(),
                    "New login session family created: " + familyId
            );
        } catch (Exception e) {
            log.warn("Failed to audit login session creation: {}", e.getMessage());
        }

        long refreshExpiresInSeconds = (tokenExpiresAt.toEpochMilli() - now.toEpochMilli()) / 1000;
        return new CreatedSession(rawToken, refreshExpiresInSeconds);
    }

    @Transactional(noRollbackFor = BadCredentialsException.class)
    public RefreshTokenRotateResult rotate(String rawToken, String ip, String userAgent) {
        String tokenHash = hashToken(rawToken);

        // 1. Look up token row with pessimistic write lock (SELECT FOR UPDATE)
        RefreshToken token = refreshTokenRepository.findByTokenHashForUpdate(tokenHash)
                .orElseThrow(() -> {
                    log.warn("Refresh failed: Token hash not found");
                    return new BadCredentialsException("Invalid or expired session");
                });

        // 2. Strict Reuse Detection: If token is already revoked, an attacker or compromised client replayed an old token!
        if (token.isRevoked()) {
            log.warn("SECURITY ALERT: Refresh token reuse detected! Family: {}, Token ID: {}", token.getFamilyId(), token.getId());
            refreshTokenRepository.revokeFamily(token.getFamilyId(), Instant.now());

            try {
                auditService.recordUserAction(
                        token.getUser(),
                        AuditAction.AUTH_REFRESH_REUSE_DETECTED,
                        AuditTargetType.USER,
                        token.getUser().getId().toString(),
                        "Refresh token reuse detected; entire token family revoked: " + token.getFamilyId()
                );
            } catch (Exception e) {
                log.warn("Failed to record reuse detection audit: {}", e.getMessage());
            }

            throw new BadCredentialsException("Invalid or expired session");
        }

        // 3. Expiration checks (individual token expiration & absolute session expiration)
        if (token.isExpired() || token.isAbsoluteExpired()) {
            log.warn("Refresh failed: Token or session absolute expired for family: {}", token.getFamilyId());
            throw new BadCredentialsException("Invalid or expired session");
        }

        // 4. Linked User validation
        User user = token.getUser();
        if (user.getDeletedAt() != null || user.getStatus() == UserStatus.SUSPENDED) {
            log.warn("Refresh blocked: User is deleted or suspended ({})", user.getEmail());
            throw new BadCredentialsException("Invalid or expired session");
        }

        // 5. Invalidation timestamp checks (passwordChangedAt & sessionsInvalidatedAt)
        if (user.getPasswordChangedAt() != null && token.getCreatedAt().isBefore(user.getPasswordChangedAt())) {
            log.warn("Refresh blocked: Session created before password change for user: {}", user.getEmail());
            refreshTokenRepository.revokeFamily(token.getFamilyId(), Instant.now());
            throw new BadCredentialsException("Invalid or expired session");
        }

        if (user.getSessionsInvalidatedAt() != null && token.getCreatedAt().isBefore(user.getSessionsInvalidatedAt())) {
            log.warn("Refresh blocked: Session created before global logout for user: {}", user.getEmail());
            refreshTokenRepository.revokeFamily(token.getFamilyId(), Instant.now());
            throw new BadCredentialsException("Invalid or expired session");
        }

        // 6. Strict Single-Use Rotation
        Instant now = Instant.now();
        token.setRevokedAt(now);

        String newRawToken = generateRawToken();
        String newHash = hashToken(newRawToken);

        // Child token inherits the exact absolute session expiration
        Instant childExpiresAt = now.plusMillis(refreshExpiration);
        if (childExpiresAt.isAfter(token.getSessionAbsoluteExpiresAt())) {
            childExpiresAt = token.getSessionAbsoluteExpiresAt();
        }

        RefreshToken childToken = new RefreshToken(
                UUID.randomUUID(),
                user,
                newHash,
                token.getFamilyId(),
                token.getSessionAbsoluteExpiresAt(),
                childExpiresAt,
                ip,
                userAgent
        );

        refreshTokenRepository.save(childToken);
        token.setReplacedByTokenId(childToken.getId());
        refreshTokenRepository.save(token);

        try {
            auditService.recordUserAction(
                    user,
                    AuditAction.AUTH_REFRESH_SUCCESS,
                    AuditTargetType.USER,
                    user.getId().toString(),
                    "Refresh token rotated successfully for family: " + token.getFamilyId()
            );
        } catch (Exception e) {
            log.warn("Failed to audit refresh success: {}", e.getMessage());
        }

        String newAccessJwt = jwtService.generateToken(user);
        long accessExpiresIn = jwtService.getJwtExpiration() / 1000;
        long refreshExpiresIn = (childExpiresAt.toEpochMilli() - now.toEpochMilli()) / 1000;

        return new RefreshTokenRotateResult(newAccessJwt, accessExpiresIn, newRawToken, refreshExpiresIn);
    }

    @Transactional
    public void logout(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }

        try {
            String tokenHash = hashToken(rawToken);
            Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByTokenHash(tokenHash);

            if (tokenOpt.isPresent()) {
                RefreshToken token = tokenOpt.get();
                refreshTokenRepository.revokeFamily(token.getFamilyId(), Instant.now());

                try {
                    auditService.recordUserAction(
                            token.getUser(),
                            AuditAction.AUTH_LOGOUT,
                            AuditTargetType.USER,
                            token.getUser().getId().toString(),
                            "Logout revoked token family: " + token.getFamilyId()
                    );
                } catch (Exception e) {
                    log.warn("Failed to audit single logout: {}", e.getMessage());
                }
            }
        } catch (Exception ex) {
            log.debug("Logout handled quietly: {}", ex.getMessage());
        }
    }

    @Transactional
    public void logoutAll(User user) {
        Instant now = Instant.now();
        refreshTokenRepository.revokeAllForUser(user.getId(), now);
        user.setSessionsInvalidatedAt(now);
        userRepository.save(user);

        try {
            auditService.recordUserAction(
                    user,
                    AuditAction.AUTH_LOGOUT_ALL,
                    AuditTargetType.USER,
                    user.getId().toString(),
                    "Global session termination (logout-all) completed"
            );
        } catch (Exception e) {
            log.warn("Failed to audit logout-all: {}", e.getMessage());
        }
    }

    @Transactional
    public void revokeAllUserSessions(UUID userId) {
        refreshTokenRepository.revokeAllForUser(userId, Instant.now());
    }

    @Transactional
    public int purgeExpiredTokens(Instant cutoff) {
        return refreshTokenRepository.purgeExpiredRevokedTokens(cutoff);
    }

    public long getRefreshExpiration() {
        return refreshExpiration;
    }

    public record CreatedSession(String rawRefreshToken, long refreshExpiresIn) {
    }
}
