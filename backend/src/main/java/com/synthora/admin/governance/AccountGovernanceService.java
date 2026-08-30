package com.synthora.admin.governance;

import com.synthora.admin.audit.AuditAction;
import com.synthora.admin.audit.AuditService;
import com.synthora.admin.audit.AuditTargetType;
import com.synthora.admin.governance.dto.*;
import com.synthora.admin.user.AdminUserService;
import com.synthora.admin.user.dto.AdminUserDetailResponse;
import com.synthora.common.ResourceNotFoundException;
import com.synthora.identity.*;
import com.synthora.notification.NotificationEntityType;
import com.synthora.notification.NotificationService;
import com.synthora.notification.NotificationType;
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
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AccountGovernanceService {

    private static final Logger log = LoggerFactory.getLogger(AccountGovernanceService.class);

    private final UserRepository userRepository;
    private final AccountSuspensionRepository suspensionRepository;
    private final AccountSuspensionAppealRepository appealRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final AdminUserService adminUserService;

    public AccountGovernanceService(
            UserRepository userRepository,
            AccountSuspensionRepository suspensionRepository,
            AccountSuspensionAppealRepository appealRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            EmailVerificationTokenRepository emailVerificationTokenRepository,
            AuditService auditService,
            NotificationService notificationService,
            AdminUserService adminUserService) {
        this.userRepository = userRepository;
        this.suspensionRepository = suspensionRepository;
        this.appealRepository = appealRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.adminUserService = adminUserService;
    }

    /**
     * Lists account suspensions with pagination, search, and active/reinstated filter.
     */
    @Transactional(readOnly = true)
    public Page<AccountSuspensionResponse> getSuspensions(
            int page,
            int size,
            String query,
            Boolean activeOnly,
            UserRole role) {

        int boundedPage = Math.max(0, page);
        int boundedSize = Math.min(Math.max(1, size), 100);

        Pageable pageable = PageRequest.of(
                boundedPage,
                boundedSize,
                Sort.by(Sort.Direction.DESC, "suspendedAt").and(Sort.by(Sort.Direction.DESC, "id"))
        );

        Specification<AccountSuspension> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (Boolean.TRUE.equals(activeOnly)) {
                predicates.add(cb.isNull(root.get("reinstatedAt")));
            } else if (Boolean.FALSE.equals(activeOnly)) {
                predicates.add(cb.isNotNull(root.get("reinstatedAt")));
            }

            if (query != null && !query.trim().isEmpty()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("user").get("name")), pattern);
                Predicate emailMatch = cb.like(cb.lower(root.get("user").get("email")), pattern);
                Predicate reasonMatch = cb.like(cb.lower(root.get("reason")), pattern);
                predicates.add(cb.or(nameMatch, emailMatch, reasonMatch));
            }

            if (role != null) {
                predicates.add(cb.equal(root.get("user").get("role"), role));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return suspensionRepository.findAll(spec, pageable).map(this::toSuspensionResponse);
    }

    /**
     * Gets suspension record detail.
     */
    @Transactional(readOnly = true)
    public AccountSuspensionResponse getSuspensionDetail(UUID id) {
        AccountSuspension suspension = suspensionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Suspension record not found: " + id));
        return toSuspensionResponse(suspension);
    }

    /**
     * Retrieves a full governance profile for a user including active suspension, history, and appeals.
     */
    @Transactional(readOnly = true)
    public AdminGovernanceUserDetailResponse getUserGovernanceDetail(UUID userId) {
        AdminUserDetailResponse userDetail = adminUserService.getUserDetail(userId);
        AccountSuspensionResponse currentSuspension = suspensionRepository.findActiveSuspensionByUserId(userId)
                .map(this::toSuspensionResponse)
                .orElse(null);

        List<AccountSuspensionResponse> suspensionHistory = suspensionRepository.findHistoryByUserId(userId)
                .stream()
                .map(this::toSuspensionResponse)
                .toList();

        List<AdminAppealResponse> appealsHistory = appealRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toAppealResponse)
                .toList();

        return new AdminGovernanceUserDetailResponse(
                userDetail,
                currentSuspension,
                suspensionHistory,
                appealsHistory
        );
    }

    /**
     * Suspends a user account with mandatory reason, optional internal notes, token invalidation, and audit tracking.
     */
    public AccountSuspensionResponse suspendUser(
            UUID targetUserId,
            SuspendUserRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        User admin = resolveAdminActor(authentication);
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUserId));

        if (target.getId().equals(admin.getId())) {
            throw new IllegalArgumentException("Administrators cannot suspend their own account");
        }

        if (target.getRole() == UserRole.ADMIN) {
            throw new IllegalArgumentException("Administrators cannot suspend other administrators under the current governance policy");
        }

        if (target.getStatus() == UserStatus.SUSPENDED) {
            throw new IllegalArgumentException("User is already in SUSPENDED status");
        }

        // 1. Update user lifecycle status
        target.setStatus(UserStatus.SUSPENDED);
        userRepository.save(target);

        // 2. Create historical suspension record
        AccountSuspension suspension = new AccountSuspension(
                target,
                admin,
                request.reason().trim(),
                request.internalNotes() != null ? request.internalNotes().trim() : null
        );
        AccountSuspension savedSuspension = suspensionRepository.save(suspension);

        // 3. Invalidate active password reset and email verification tokens
        try {
            passwordResetTokenRepository.invalidateActiveTokensForUser(target, Instant.now());
            emailVerificationTokenRepository.invalidateActiveTokensForUser(target, Instant.now());
        } catch (Exception ex) {
            log.warn("Token invalidation notice for suspended user {}: {}", target.getEmail(), ex.getMessage());
        }

        // 4. Record audit event
        auditService.record(
                authentication,
                AuditAction.USER_SUSPENDED,
                AuditTargetType.USER,
                target.getId().toString(),
                "Account suspended. Reason: " + request.reason().trim(),
                servletRequest
        );

        // 5. Dispatch non-blocking user notification
        try {
            notificationService.createNotification(
                    target.getId(),
                    NotificationType.USER_SUSPENDED,
                    "Account Suspended",
                    "Your Synthora account has been suspended: " + request.reason().trim(),
                    NotificationEntityType.ACCOUNT_SUSPENSION,
                    savedSuspension.getId()
            );
        } catch (Exception ex) {
            log.warn("Non-blocking notification dispatch failed for user suspension {}: {}", target.getEmail(), ex.getMessage());
        }

        return toSuspensionResponse(savedSuspension);
    }

    /**
     * Reinstates a suspended user account, closing active suspension history.
     */
    public AccountSuspensionResponse reinstateUser(
            UUID targetUserId,
            ReinstateUserRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        User admin = resolveAdminActor(authentication);
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUserId));

        if (target.getStatus() != UserStatus.SUSPENDED) {
            throw new IllegalArgumentException("Only accounts in SUSPENDED status can be reinstated");
        }

        // Find active suspension record
        AccountSuspension activeSuspension = suspensionRepository.findActiveSuspensionByUserId(target.getId())
                .orElse(null);

        if (activeSuspension != null) {
            activeSuspension.setReinstatedAt(Instant.now());
            activeSuspension.setReinstatedByAdmin(admin);
            activeSuspension.setReinstatementNotes(request != null && request.notes() != null ? request.notes().trim() : "Reinstated by administrator");
            activeSuspension = suspensionRepository.save(activeSuspension);
        }

        // Restore user to ACTIVE status
        target.setStatus(UserStatus.ACTIVE);
        userRepository.save(target);

        String notes = (request != null && request.notes() != null && !request.notes().isBlank())
                ? request.notes().trim()
                : "Account reinstated by administrator";

        // Audit log
        auditService.record(
                authentication,
                AuditAction.USER_REINSTATED,
                AuditTargetType.USER,
                target.getId().toString(),
                notes,
                servletRequest
        );

        // Non-blocking notification
        try {
            notificationService.createNotification(
                    target.getId(),
                    NotificationType.USER_REINSTATED,
                    "Account Reinstated",
                    "Your Synthora account has been reinstated. You may now access your account normally.",
                    NotificationEntityType.ACCOUNT_SUSPENSION,
                    activeSuspension != null ? activeSuspension.getId() : target.getId()
            );
        } catch (Exception ex) {
            log.warn("Non-blocking notification dispatch failed for reinstatement {}: {}", target.getEmail(), ex.getMessage());
        }

        return activeSuspension != null ? toSuspensionResponse(activeSuspension) : null;
    }

    /**
     * Lists formal appeals for administrators with pagination and status filtering.
     */
    @Transactional(readOnly = true)
    public Page<AdminAppealResponse> getAppeals(
            int page,
            int size,
            AppealStatus status,
            String query) {

        int boundedPage = Math.max(0, page);
        int boundedSize = Math.min(Math.max(1, size), 100);

        Pageable pageable = PageRequest.of(
                boundedPage,
                boundedSize,
                Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id"))
        );

        Specification<AccountSuspensionAppeal> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (query != null && !query.trim().isEmpty()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("user").get("name")), pattern);
                Predicate emailMatch = cb.like(cb.lower(root.get("user").get("email")), pattern);
                Predicate reasonMatch = cb.like(cb.lower(root.get("submittedReason")), pattern);
                predicates.add(cb.or(nameMatch, emailMatch, reasonMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return appealRepository.findAll(spec, pageable).map(this::toAppealResponse);
    }

    /**
     * Retrieves specific appeal detail for administrative review.
     */
    @Transactional(readOnly = true)
    public AdminAppealResponse getAppealDetail(UUID appealId) {
        AccountSuspensionAppeal appeal = appealRepository.findById(appealId)
                .orElseThrow(() -> new ResourceNotFoundException("Appeal not found: " + appealId));
        return toAppealResponse(appeal);
    }

    /**
     * Admin begins formal review on a submitted appeal: SUBMITTED -> UNDER_REVIEW.
     */
    public AdminAppealResponse startReview(
            UUID appealId,
            AdminAppealActionRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        User admin = resolveAdminActor(authentication);
        AccountSuspensionAppeal appeal = appealRepository.findById(appealId)
                .orElseThrow(() -> new ResourceNotFoundException("Appeal not found: " + appealId));

        if (appeal.getStatus() != AppealStatus.SUBMITTED && appeal.getStatus() != AppealStatus.INFORMATION_REQUIRED) {
            throw new IllegalArgumentException("Cannot start review for appeal in status: " + appeal.getStatus());
        }

        appeal.setStatus(AppealStatus.UNDER_REVIEW);
        appeal.setReviewedAt(Instant.now());
        appeal.setReviewedByAdmin(admin);
        if (request != null && request.internalNotes() != null) {
            appeal.setAdminInternalNotes(request.internalNotes().trim());
        }

        AccountSuspensionAppeal saved = appealRepository.save(appeal);

        auditService.record(
                authentication,
                AuditAction.APPEAL_REVIEW_STARTED,
                AuditTargetType.ACCOUNT_SUSPENSION_APPEAL,
                saved.getId().toString(),
                "Appeal review started by admin",
                servletRequest
        );

        return toAppealResponse(saved);
    }

    /**
     * Admin requests additional information from the user: UNDER_REVIEW -> INFORMATION_REQUIRED.
     */
    public AdminAppealResponse requestInformation(
            UUID appealId,
            AdminRequestInfoRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        User admin = resolveAdminActor(authentication);
        AccountSuspensionAppeal appeal = appealRepository.findById(appealId)
                .orElseThrow(() -> new ResourceNotFoundException("Appeal not found: " + appealId));

        if (appeal.getStatus() != AppealStatus.UNDER_REVIEW && appeal.getStatus() != AppealStatus.SUBMITTED) {
            throw new IllegalArgumentException("Cannot request information for appeal in status: " + appeal.getStatus());
        }

        appeal.setStatus(AppealStatus.INFORMATION_REQUIRED);
        appeal.setAdminResponse(request.message().trim());
        appeal.setRequestedAt(Instant.now());
        appeal.setReviewedAt(Instant.now());
        appeal.setReviewedByAdmin(admin);
        if (request.internalNotes() != null) {
            appeal.setAdminInternalNotes(request.internalNotes().trim());
        }

        AccountSuspensionAppeal saved = appealRepository.save(appeal);

        auditService.record(
                authentication,
                AuditAction.APPEAL_INFORMATION_REQUESTED,
                AuditTargetType.ACCOUNT_SUSPENSION_APPEAL,
                saved.getId().toString(),
                "Additional information requested: " + request.message().trim(),
                servletRequest
        );

        // Notify user
        try {
            notificationService.createNotification(
                    appeal.getUser().getId(),
                    NotificationType.APPEAL_INFORMATION_REQUIRED,
                    "Information Required for Appeal",
                    "Additional information required for your Synthora account review request.",
                    NotificationEntityType.ACCOUNT_SUSPENSION_APPEAL,
                    saved.getId()
            );
        } catch (Exception ex) {
            log.warn("Non-blocking notification dispatch failed: {}", ex.getMessage());
        }

        return toAppealResponse(saved);
    }

    /**
     * Admin approves formal appeal: UNDER_REVIEW -> APPROVED. Automatically reinstates the suspended account.
     */
    public AdminAppealResponse approveAppeal(
            UUID appealId,
            AdminAppealActionRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        User admin = resolveAdminActor(authentication);
        AccountSuspensionAppeal appeal = appealRepository.findById(appealId)
                .orElseThrow(() -> new ResourceNotFoundException("Appeal not found: " + appealId));

        if (appeal.getStatus() == AppealStatus.APPROVED) {
            throw new IllegalArgumentException("Appeal is already approved");
        }

        if (appeal.getStatus() == AppealStatus.REJECTED) {
            throw new IllegalArgumentException("Cannot approve a rejected appeal directly");
        }

        appeal.setStatus(AppealStatus.APPROVED);
        appeal.setAdminResponse(request != null && request.reason() != null ? request.reason().trim() : "Appeal approved by administrator");
        appeal.setReviewedAt(Instant.now());
        appeal.setReviewedByAdmin(admin);
        if (request != null && request.internalNotes() != null) {
            appeal.setAdminInternalNotes(request.internalNotes().trim());
        }

        AccountSuspensionAppeal saved = appealRepository.save(appeal);

        // Transactionally reinstate the user and close the active suspension
        reinstateUser(
                appeal.getUser().getId(),
                new ReinstateUserRequest("Reinstated upon approval of appeal " + appealId),
                authentication,
                servletRequest
        );

        auditService.record(
                authentication,
                AuditAction.APPEAL_APPROVED,
                AuditTargetType.ACCOUNT_SUSPENSION_APPEAL,
                saved.getId().toString(),
                "Appeal approved: " + appeal.getAdminResponse(),
                servletRequest
        );

        // Notify user
        try {
            notificationService.createNotification(
                    appeal.getUser().getId(),
                    NotificationType.APPEAL_APPROVED,
                    "Appeal Approved",
                    "Your Synthora account review appeal has been approved and your account is now reinstated.",
                    NotificationEntityType.ACCOUNT_SUSPENSION_APPEAL,
                    saved.getId()
            );
        } catch (Exception ex) {
            log.warn("Non-blocking notification dispatch failed: {}", ex.getMessage());
        }

        return toAppealResponse(saved);
    }

    /**
     * Admin rejects formal appeal: UNDER_REVIEW -> REJECTED. User remains SUSPENDED.
     */
    public AdminAppealResponse rejectAppeal(
            UUID appealId,
            AdminAppealActionRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        User admin = resolveAdminActor(authentication);
        AccountSuspensionAppeal appeal = appealRepository.findById(appealId)
                .orElseThrow(() -> new ResourceNotFoundException("Appeal not found: " + appealId));

        if (appeal.getStatus() == AppealStatus.REJECTED) {
            throw new IllegalArgumentException("Appeal is already rejected");
        }

        if (appeal.getStatus() == AppealStatus.APPROVED) {
            throw new IllegalArgumentException("Cannot reject an already approved appeal");
        }

        String rejectionReason = (request != null && request.reason() != null && !request.reason().isBlank())
                ? request.reason().trim()
                : "Appeal rejected by governance administrator";

        appeal.setStatus(AppealStatus.REJECTED);
        appeal.setAdminResponse(rejectionReason);
        appeal.setReviewedAt(Instant.now());
        appeal.setReviewedByAdmin(admin);
        if (request != null && request.internalNotes() != null) {
            appeal.setAdminInternalNotes(request.internalNotes().trim());
        }

        AccountSuspensionAppeal saved = appealRepository.save(appeal);

        auditService.record(
                authentication,
                AuditAction.APPEAL_REJECTED,
                AuditTargetType.ACCOUNT_SUSPENSION_APPEAL,
                saved.getId().toString(),
                "Appeal rejected: " + rejectionReason,
                servletRequest
        );

        // Notify user
        try {
            notificationService.createNotification(
                    appeal.getUser().getId(),
                    NotificationType.APPEAL_REJECTED,
                    "Appeal Decision",
                    "Your account review appeal was reviewed and rejected: " + rejectionReason,
                    NotificationEntityType.ACCOUNT_SUSPENSION_APPEAL,
                    saved.getId()
            );
        } catch (Exception ex) {
            log.warn("Non-blocking notification dispatch failed: {}", ex.getMessage());
        }

        return toAppealResponse(saved);
    }

    private User resolveAdminActor(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication required for administrative operations");
        }

        String email = authentication.getName();
        User admin = userRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Authenticated administrator not found: " + email));

        if (admin.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only administrators can perform account governance operations");
        }

        return admin;
    }

    private AccountSuspensionResponse toSuspensionResponse(AccountSuspension s) {
        return new AccountSuspensionResponse(
                s.getId(),
                s.getUser().getId(),
                s.getUser().getName(),
                s.getUser().getEmail(),
                s.getUser().getRole(),
                s.getSuspendedByAdmin() != null ? s.getSuspendedByAdmin().getId() : null,
                s.getSuspendedByAdmin() != null ? s.getSuspendedByAdmin().getName() : null,
                s.getReason(),
                s.getInternalNotes(),
                s.getSuspendedAt(),
                s.getReinstatedAt(),
                s.getReinstatedByAdmin() != null ? s.getReinstatedByAdmin().getId() : null,
                s.getReinstatedByAdmin() != null ? s.getReinstatedByAdmin().getName() : null,
                s.getReinstatementNotes(),
                s.isActive()
        );
    }

    private AdminAppealResponse toAppealResponse(AccountSuspensionAppeal a) {
        return new AdminAppealResponse(
                a.getId(),
                a.getSuspension().getId(),
                a.getUser().getId(),
                a.getUser().getName(),
                a.getUser().getEmail(),
                a.getUser().getRole(),
                a.getStatus(),
                a.getSubmittedReason(),
                a.getUserResponse(),
                a.getAdminResponse(),
                a.getAdminInternalNotes(),
                a.getRequestedAt(),
                a.getReviewedAt(),
                a.getReviewedByAdmin() != null ? a.getReviewedByAdmin().getId() : null,
                a.getReviewedByAdmin() != null ? a.getReviewedByAdmin().getName() : null,
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}
