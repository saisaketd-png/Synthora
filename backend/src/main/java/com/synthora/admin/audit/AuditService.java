package com.synthora.admin.audit;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Service for recording immutable administrative audit log entries.
 * Enforces defensive server-side role validation and resolves the actor identity directly from UserRepository.
 */
@Service
@Transactional
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditService(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    /**
     * Records an administrative audit log entry from an authenticated HTTP request context.
     *
     * @param authentication The Spring Security authentication object of the actor.
     * @param action         The administrative action performed.
     * @param targetType     The type of entity targeted by the action.
     * @param targetId       The identifier of the target entity.
     * @param details        Non-sensitive summary description of the action.
     * @param request        The current HTTP servlet request (used for IP address resolution).
     * @return The persisted AuditLog entity.
     * @throws AccessDeniedException If authentication is missing, user is not found, or user is not ADMIN.
     */
    public AuditLog record(
            Authentication authentication,
            AuditAction action,
            AuditTargetType targetType,
            String targetId,
            String details,
            HttpServletRequest request) {

        String ipAddress = extractClientIp(request);
        return record(authentication, action, targetType, targetId, details, ipAddress);
    }

    /**
     * Records an administrative audit log entry with an explicit IP address string.
     */
    public AuditLog record(
            Authentication authentication,
            AuditAction action,
            AuditTargetType targetType,
            String targetId,
            String details,
            String ipAddress) {

        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication required to record administrative audit log");
        }

        String email = authentication.getName();
        User actor = userRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Authenticated administrator not found: " + email));

        if (actor.getRole() != UserRole.ADMIN) {
            log.warn("Non-admin user {} (role {}) attempted administrative action {}", email, actor.getRole(), action);
            throw new AccessDeniedException("Only users with role ADMIN can perform administrative actions");
        }

        return recordInternal(actor.getId(), action, targetType, targetId, details, ipAddress);
    }

    /**
     * Internal persistence method for recording an audit entry directly by admin UUID.
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public AuditLog recordInternal(
            UUID adminId,
            AuditAction action,
            AuditTargetType targetType,
            String targetId,
            String details,
            String ipAddress) {

        if (adminId == null) {
            throw new IllegalArgumentException("adminId cannot be null");
        }
        if (action == null) {
            throw new IllegalArgumentException("action cannot be null");
        }
        if (targetType == null) {
            throw new IllegalArgumentException("targetType cannot be null");
        }
        if (targetId == null || targetId.trim().isEmpty()) {
            throw new IllegalArgumentException("targetId cannot be blank");
        }

        AuditLog auditLog = new AuditLog(
                adminId,
                action,
                targetType,
                targetId.trim(),
                details,
                sanitizeIp(ipAddress)
        );

        AuditLog saved = auditLogRepository.save(auditLog);
        log.info("AUDIT: Admin {} performed {} on {}::{} [IP: {}]",
                adminId, action, targetType, targetId, auditLog.getIpAddress());

        return saved;
    }

    /**
     * Safely extracts the client IP address from HttpServletRequest.
     */
    public static String extractClientIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.trim().isEmpty()) {
            // In a proxy chain, the first IP is the original client
            String[] parts = xForwardedFor.split(",");
            if (parts.length > 0) {
                return sanitizeIp(parts[0].trim());
            }
        }

        return sanitizeIp(request.getRemoteAddr());
    }

    private static String sanitizeIp(String ip) {
        if (ip == null || ip.trim().isEmpty()) {
            return null;
        }
        String trimmed = ip.trim();
        return trimmed.length() > 45 ? trimmed.substring(0, 45) : trimmed;
    }
}
