package com.kemkendra.account;

import com.kemkendra.account.dto.AppealResponseRequest;
import com.kemkendra.account.dto.SubmitAppealRequest;
import com.kemkendra.account.dto.UserAppealResponse;
import com.kemkendra.account.dto.UserSuspensionDetailResponse;
import com.kemkendra.admin.audit.AuditAction;
import com.kemkendra.admin.audit.AuditService;
import com.kemkendra.admin.audit.AuditTargetType;
import com.kemkendra.admin.governance.AccountSuspension;
import com.kemkendra.admin.governance.AccountSuspensionAppeal;
import com.kemkendra.admin.governance.AccountSuspensionAppealRepository;
import com.kemkendra.admin.governance.AccountSuspensionRepository;
import com.kemkendra.admin.governance.AppealStatus;
import com.kemkendra.common.ResourceNotFoundException;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.notification.NotificationEntityType;
import com.kemkendra.notification.NotificationService;
import com.kemkendra.notification.NotificationType;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class UserAppealService {

    private static final Logger log = LoggerFactory.getLogger(UserAppealService.class);

    private final UserRepository userRepository;
    private final AccountSuspensionRepository suspensionRepository;
    private final AccountSuspensionAppealRepository appealRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public UserAppealService(
            UserRepository userRepository,
            AccountSuspensionRepository suspensionRepository,
            AccountSuspensionAppealRepository appealRepository,
            AuditService auditService,
            NotificationService notificationService) {
        this.userRepository = userRepository;
        this.suspensionRepository = suspensionRepository;
        this.appealRepository = appealRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    /**
     * Retrieves current user's active suspension details and active appeal tracker.
     * Guaranteed to never expose internal admin notes or other users' data.
     */
    @Transactional(readOnly = true)
    public UserSuspensionDetailResponse getMySuspensionDetail(Authentication authentication) {
        User user = resolveAuthenticatedUser(authentication);

        if (user.getStatus() != UserStatus.SUSPENDED) {
            return new UserSuspensionDetailResponse(false, null, null, null, null);
        }

        AccountSuspension activeSuspension = suspensionRepository.findActiveSuspensionByUserId(user.getId())
                .orElse(null);

        if (activeSuspension == null) {
            return new UserSuspensionDetailResponse(true, null, null, "Account suspended by platform governance", null);
        }

        UserAppealResponse activeAppeal = appealRepository.findActiveAppealForSuspension(
                activeSuspension.getId(),
                List.of(AppealStatus.SUBMITTED, AppealStatus.UNDER_REVIEW, AppealStatus.INFORMATION_REQUIRED)
        ).map(this::toUserAppealResponse).orElse(null);

        return new UserSuspensionDetailResponse(
                true,
                activeSuspension.getId(),
                activeSuspension.getSuspendedAt(),
                activeSuspension.getReason(),
                activeAppeal
        );
    }

    /**
     * Retrieves all appeals submitted by the authenticated user with IDOR isolation.
     */
    @Transactional(readOnly = true)
    public List<UserAppealResponse> getMyAppeals(Authentication authentication) {
        User user = resolveAuthenticatedUser(authentication);
        return appealRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toUserAppealResponse)
                .toList();
    }

    /**
     * Retrieves a single appeal by ID, enforcing that it belongs to the authenticated user.
     */
    @Transactional(readOnly = true)
    public UserAppealResponse getMyAppealDetail(UUID appealId, Authentication authentication) {
        User user = resolveAuthenticatedUser(authentication);
        AccountSuspensionAppeal appeal = appealRepository.findById(appealId)
                .orElseThrow(() -> new ResourceNotFoundException("Appeal not found: " + appealId));

        if (!appeal.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied: you do not own this appeal");
        }

        return toUserAppealResponse(appeal);
    }

    /**
     * Submits a formal appeal against the user's active suspension.
     */
    public UserAppealResponse submitAppeal(
            SubmitAppealRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        User user = resolveAuthenticatedUser(authentication);

        if (user.getStatus() != UserStatus.SUSPENDED) {
            throw new IllegalArgumentException("Only suspended accounts can submit a suspension appeal");
        }

        AccountSuspension activeSuspension = suspensionRepository.findActiveSuspensionByUserId(user.getId())
                .orElseThrow(() -> new IllegalStateException("No active suspension record found for user"));

        // Anti-spam & duplicate active appeal check
        Optional<AccountSuspensionAppeal> existingActiveAppeal = appealRepository.findActiveAppealForSuspension(
                activeSuspension.getId(),
                List.of(AppealStatus.SUBMITTED, AppealStatus.UNDER_REVIEW, AppealStatus.INFORMATION_REQUIRED)
        );

        if (existingActiveAppeal.isPresent()) {
            throw new IllegalStateException("An active appeal is already in progress for this suspension");
        }

        AccountSuspensionAppeal appeal = new AccountSuspensionAppeal(
                activeSuspension,
                user,
                request.reason().trim()
        );
        AccountSuspensionAppeal savedAppeal = appealRepository.save(appeal);

        // Audit log
        auditService.recordUserAction(
                user,
                AuditAction.APPEAL_SUBMITTED,
                AuditTargetType.ACCOUNT_SUSPENSION_APPEAL,
                savedAppeal.getId().toString(),
                "Appeal submitted by user " + user.getEmail(),
                servletRequest
        );

        // Non-blocking notification
        try {
            notificationService.createNotification(
                    user.getId(),
                    NotificationType.APPEAL_SUBMITTED,
                    "Appeal Submitted",
                    "Your KemKendra account review request has been submitted for administrative review.",
                    NotificationEntityType.ACCOUNT_SUSPENSION_APPEAL,
                    savedAppeal.getId()
            );
        } catch (Exception ex) {
            log.warn("Non-blocking notification dispatch failed: {}", ex.getMessage());
        }

        return toUserAppealResponse(savedAppeal);
    }

    /**
     * User responds to an administrative request for additional information: INFORMATION_REQUIRED -> UNDER_REVIEW.
     */
    public UserAppealResponse respondToInformationRequest(
            UUID appealId,
            AppealResponseRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        User user = resolveAuthenticatedUser(authentication);
        AccountSuspensionAppeal appeal = appealRepository.findById(appealId)
                .orElseThrow(() -> new ResourceNotFoundException("Appeal not found: " + appealId));

        if (!appeal.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied: you do not own this appeal");
        }

        if (appeal.getStatus() != AppealStatus.INFORMATION_REQUIRED) {
            throw new IllegalArgumentException("Appeal is currently in status " + appeal.getStatus() + " and is not awaiting information response");
        }

        appeal.setUserResponse(request.response().trim());
        appeal.setStatus(AppealStatus.UNDER_REVIEW);
        appeal.setUpdatedAt(Instant.now());

        AccountSuspensionAppeal savedAppeal = appealRepository.save(appeal);

        auditService.recordUserAction(
                user,
                AuditAction.APPEAL_INFORMATION_RESPONDED,
                AuditTargetType.ACCOUNT_SUSPENSION_APPEAL,
                savedAppeal.getId().toString(),
                "User provided requested information for appeal",
                servletRequest
        );

        return toUserAppealResponse(savedAppeal);
    }

    private User resolveAuthenticatedUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication required");
        }

        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Authenticated user not found: " + email));
    }

    private UserAppealResponse toUserAppealResponse(AccountSuspensionAppeal a) {
        if (a == null) return null;
        return new UserAppealResponse(
                a.getId(),
                a.getSuspension().getId(),
                a.getStatus(),
                a.getSubmittedReason(),
                a.getUserResponse(),
                a.getAdminResponse(),
                a.getRequestedAt(),
                a.getReviewedAt(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}
