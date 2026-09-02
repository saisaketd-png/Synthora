package com.kemkendra.admin.audit;

import com.kemkendra.admin.audit.dto.AdminAuditLogResponse;
import com.kemkendra.admin.audit.dto.AuditKpiSummaryResponse;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for recording and querying immutable administrative audit log entries.
 * Enforces defensive server-side role validation, extracts actor identities directly,
 * and executes dynamic multi-criteria searches without N+1 query overhead.
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
     * Records a governance audit log entry triggered by a user (such as appeal submission or evidence uploads).
     */
    public AuditLog recordUserAction(
            User user,
            AuditAction action,
            AuditTargetType targetType,
            String targetId,
            String details,
            HttpServletRequest request) {

        if (user == null) {
            throw new AccessDeniedException("User required to record audit log");
        }
        String ipAddress = extractClientIp(request);
        return recordInternal(user.getId(), action, targetType, targetId, details, ipAddress);
    }

    public AuditLog recordUserAction(
            User user,
            AuditAction action,
            AuditTargetType targetType,
            String targetId,
            String details) {

        if (user == null) {
            throw new AccessDeniedException("User required to record audit log");
        }
        return recordInternal(user.getId(), action, targetType, targetId, details, "127.0.0.1");
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
     * Helper to record administrative audit entries resolving actor by email.
     */
    public AuditLog recordByEmail(
            String actorEmail,
            AuditAction action,
            AuditTargetType targetType,
            String targetId,
            String details) {
        UUID actorId = null;
        if (actorEmail != null) {
            actorId = userRepository.findByEmail(actorEmail).map(User::getId).orElse(null);
        }
        if (actorId == null) {
            actorId = UUID.fromString("00000000-0000-0000-0000-000000000000");
        }
        return recordInternal(actorId, action, targetType, targetId, details, "127.0.0.1");
    }

    /**
     * Internal persistence method for recording an audit entry directly by admin/user UUID.
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
        log.info("AUDIT: Actor {} performed {} on {}::{} [IP: {}]",
                adminId, action, targetType, targetId, auditLog.getIpAddress());

        return saved;
    }

    /**
     * Dynamic multi-criteria search and pagination across platform audit records.
     * Prevents N+1 queries by batch-resolving actor user names and emails.
     */
    @Transactional(readOnly = true)
    public Page<AdminAuditLogResponse> searchAuditLogs(
            AuditAction action,
            UUID adminId,
            AuditTargetType targetType,
            String targetId,
            Instant from,
            Instant to,
            String query,
            int page,
            int size) {

        int boundedPage = Math.max(0, page);
        int boundedSize = Math.min(Math.max(1, size), 100);

        Pageable pageable = PageRequest.of(
                boundedPage,
                boundedSize,
                Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id"))
        );

        Specification<AuditLog> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (action != null) {
                predicates.add(cb.equal(root.get("action"), action));
            }
            if (adminId != null) {
                predicates.add(cb.equal(root.get("adminId"), adminId));
            }
            if (targetType != null) {
                predicates.add(cb.equal(root.get("targetType"), targetType));
            }
            if (targetId != null && !targetId.isBlank()) {
                predicates.add(cb.equal(root.get("targetId"), targetId.trim()));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), LocalDateTime.ofInstant(from, java.time.ZoneId.systemDefault())));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), LocalDateTime.ofInstant(to, java.time.ZoneId.systemDefault())));
            }
            if (query != null && !query.trim().isEmpty()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                Predicate detailsMatch = cb.like(cb.lower(root.get("details")), pattern);
                Predicate targetIdMatch = cb.like(cb.lower(root.get("targetId")), pattern);
                Predicate ipMatch = cb.like(cb.lower(root.get("ipAddress")), pattern);
                predicates.add(cb.or(detailsMatch, targetIdMatch, ipMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<AuditLog> pageResult = auditLogRepository.findAll(spec, pageable);

        // Batch resolve actor users to prevent N+1 queries
        Set<UUID> actorIds = pageResult.getContent().stream()
                .map(AuditLog::getAdminId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, User> actorMap = actorIds.isEmpty() ? Collections.emptyMap() :
                userRepository.findAllById(actorIds).stream()
                        .collect(Collectors.toMap(User::getId, u -> u));

        return pageResult.map(auditLog -> {
            User actor = actorMap.get(auditLog.getAdminId());
            String actorName = actor != null ? (actor.getName() != null ? actor.getName() : actor.getEmail()) : "System / Unknown";
            String actorEmail = actor != null ? actor.getEmail() : "system@kemkendra.com";

            return new AdminAuditLogResponse(
                    auditLog.getId(),
                    auditLog.getAdminId(),
                    actorName,
                    actorEmail,
                    auditLog.getAction(),
                    auditLog.getTargetType(),
                    auditLog.getTargetId(),
                    auditLog.getDetails(),
                    auditLog.getIpAddress(),
                    auditLog.getCreatedAt()
            );
        });
    }

    /**
     * Calculates summary KPI counts across governance categories using indexed count queries.
     */
    @Transactional(readOnly = true)
    public AuditKpiSummaryResponse getAuditKpiSummary() {
        long totalEvents = auditLogRepository.count();
        LocalDateTime todayStart = LocalDate.now(ZoneOffset.UTC).atStartOfDay();
        long todayEvents = auditLogRepository.countByCreatedAtGreaterThanEqual(todayStart);

        long userGovernanceEvents = auditLogRepository.countByActionIn(List.of(
                AuditAction.USER_CREATED,
                AuditAction.USER_SUSPENDED,
                AuditAction.USER_ACTIVATED,
                AuditAction.USER_REINSTATED,
                AuditAction.USER_ROLE_CHANGED,
                AuditAction.USER_DELETED,
                AuditAction.APPEAL_SUBMITTED,
                AuditAction.APPEAL_REVIEW_STARTED,
                AuditAction.APPEAL_INFORMATION_REQUESTED,
                AuditAction.APPEAL_INFORMATION_RESPONDED,
                AuditAction.APPEAL_APPROVED,
                AuditAction.APPEAL_REJECTED
        ));

        long supplierGovernanceEvents = auditLogRepository.countByActionIn(List.of(
                AuditAction.SUPPLIER_VERIFICATION_SUBMITTED,
                AuditAction.SUPPLIER_REVIEW_STARTED,
                AuditAction.SUPPLIER_INFORMATION_REQUESTED,
                AuditAction.SUPPLIER_VERIFIED,
                AuditAction.SUPPLIER_UNVERIFIED,
                AuditAction.SUPPLIER_REJECTED,
                AuditAction.SUPPLIER_EXPORT_READY_CHANGED,
                AuditAction.SUPPLIER_SUSPENDED,
                AuditAction.SUPPLIER_ACTIVATED,
                AuditAction.SUPPLIER_LOGO_UPLOADED,
                AuditAction.SUPPLIER_EVIDENCE_UPDATED
        ));

        long catalogGovernanceEvents = auditLogRepository.countByActionIn(List.of(
                AuditAction.PRODUCT_REQUEST_APPROVED,
                AuditAction.PRODUCT_REQUEST_REJECTED,
                AuditAction.MASTER_PRODUCT_CREATED,
                AuditAction.MASTER_PRODUCT_UPDATED,
                AuditAction.MASTER_PRODUCT_ACTIVATED,
                AuditAction.MASTER_PRODUCT_DEACTIVATED,
                AuditAction.MASTER_PRODUCT_MERGED,
                AuditAction.SUPPLIER_OFFERING_CREATED,
                AuditAction.SUPPLIER_OFFERING_CREATED_BY_ADMIN,
                AuditAction.SUPPLIER_OFFERING_UPDATED,
                AuditAction.SUPPLIER_OFFERING_ACTIVATED,
                AuditAction.SUPPLIER_OFFERING_DEACTIVATED,
                AuditAction.SUPPLIER_OFFERING_APPROVED,
                AuditAction.SUPPLIER_OFFERING_REJECTED,
                AuditAction.SUPPLIER_OFFERING_FLAGGED,
                AuditAction.PRODUCT_UPDATED,
                AuditAction.PRODUCT_DELETED
        ));

        return new AuditKpiSummaryResponse(
                totalEvents,
                todayEvents,
                userGovernanceEvents,
                supplierGovernanceEvents,
                catalogGovernanceEvents
        );
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
