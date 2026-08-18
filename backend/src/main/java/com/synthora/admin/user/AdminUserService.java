package com.synthora.admin.user;

import com.synthora.admin.audit.AuditAction;
import com.synthora.admin.audit.AuditService;
import com.synthora.admin.audit.AuditTargetType;
import com.synthora.admin.user.dto.AdminUserDetailResponse;
import com.synthora.admin.user.dto.AdminUserResponse;
import com.synthora.admin.user.dto.UpdateUserRoleRequest;
import com.synthora.admin.user.dto.UpdateUserStatusRequest;
import com.synthora.common.ResourceNotFoundException;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
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

/**
 * Service for administrative user management, search, status moderation, role management, and soft deletion.
 * All mutations are transactionally bound to audit log entries.
 */
@Service
@Transactional
public class AdminUserService {

    private final UserRepository userRepository;
    private final AuditService auditService;

    public AdminUserService(UserRepository userRepository, AuditService auditService) {
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    /**
     * Retrieves a paginated list of users with optional substring search and role/status filtering.
     */
    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getUsers(
            int page,
            int size,
            String query,
            UserRole role,
            UserStatus status,
            boolean includeDeleted) {

        int boundedPage = Math.max(0, page);
        int boundedSize = Math.min(Math.max(1, size), 100);

        Pageable pageable = PageRequest.of(
                boundedPage,
                boundedSize,
                Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id"))
        );

        Specification<User> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (!includeDeleted) {
                predicates.add(cb.isNull(root.get("deletedAt")));
            }

            if (query != null && !query.trim().isEmpty()) {
                String searchPattern = "%" + query.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), searchPattern);
                Predicate emailMatch = cb.like(cb.lower(root.get("email")), searchPattern);
                predicates.add(cb.or(nameMatch, emailMatch));
            }

            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return userRepository.findAll(spec, pageable).map(this::toResponse);
    }

    /**
     * Retrieves detailed user record for administrative inspection.
     */
    @Transactional(readOnly = true)
    public AdminUserDetailResponse getUserDetail(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        return new AdminUserDetailResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                user.getDeletedAt(),
                user.getDeletedBy()
        );
    }

    /**
     * Updates a user's lifecycle status (ACTIVE <-> SUSPENDED) with self and last-admin protection.
     */
    public AdminUserResponse updateUserStatus(
            UUID targetId,
            UpdateUserStatusRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        User admin = resolveAdminActor(authentication);
        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetId));

        if (request.status() != UserStatus.ACTIVE && request.status() != UserStatus.SUSPENDED) {
            throw new IllegalArgumentException("Invalid administrative status transition: only ACTIVE and SUSPENDED are supported");
        }

        if (target.getStatus() == request.status()) {
            throw new IllegalArgumentException("User is already in status " + request.status());
        }

        // Self-protection: Admin cannot suspend their own account
        if (target.getId().equals(admin.getId()) && request.status() == UserStatus.SUSPENDED) {
            throw new IllegalArgumentException("Administrators cannot suspend their own account");
        }

        // Last-admin protection: Cannot suspend the last active administrator
        if (target.getRole() == UserRole.ADMIN && target.getStatus() == UserStatus.ACTIVE && request.status() == UserStatus.SUSPENDED) {
            long activeAdminCount = userRepository.countByRoleAndStatusAndDeletedAtIsNull(UserRole.ADMIN, UserStatus.ACTIVE);
            if (activeAdminCount <= 1) {
                throw new IllegalStateException("Cannot suspend the last active administrator");
            }
        }

        target.setStatus(request.status());
        User saved = userRepository.save(target);

        AuditAction action = (request.status() == UserStatus.SUSPENDED)
                ? AuditAction.USER_SUSPENDED
                : AuditAction.USER_ACTIVATED;

        String details = (request.reason() != null && !request.reason().trim().isEmpty())
                ? request.reason().trim()
                : ("Status changed to " + request.status());

        auditService.record(authentication, action, AuditTargetType.USER, targetId.toString(), details, servletRequest);

        return toResponse(saved);
    }

    /**
     * Updates a user's role with self-demotion and last-admin protection.
     */
    public AdminUserResponse updateUserRole(
            UUID targetId,
            UpdateUserRoleRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        User admin = resolveAdminActor(authentication);
        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetId));

        if (target.getRole() == request.role()) {
            throw new IllegalArgumentException("User already has role " + request.role());
        }

        // Self-protection: Admin cannot change their own role away from ADMIN
        if (target.getId().equals(admin.getId()) && request.role() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Administrators cannot change their own role away from ADMIN");
        }

        // Last-admin protection: Cannot demote the last active administrator
        if (target.getRole() == UserRole.ADMIN && target.getStatus() == UserStatus.ACTIVE && request.role() != UserRole.ADMIN) {
            long activeAdminCount = userRepository.countByRoleAndStatusAndDeletedAtIsNull(UserRole.ADMIN, UserStatus.ACTIVE);
            if (activeAdminCount <= 1) {
                throw new IllegalStateException("Cannot demote the last active administrator");
            }
        }

        UserRole oldRole = target.getRole();
        target.setRole(request.role());
        User saved = userRepository.save(target);

        auditService.record(
                authentication,
                AuditAction.USER_ROLE_CHANGED,
                AuditTargetType.USER,
                targetId.toString(),
                "Role changed from " + oldRole + " to " + request.role(),
                servletRequest
        );

        return toResponse(saved);
    }

    /**
     * Performs an auditable soft deletion on a user, marking status as SUSPENDED and setting deletedAt/deletedBy.
     */
    public AdminUserResponse softDeleteUser(
            UUID targetId,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        User admin = resolveAdminActor(authentication);
        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetId));

        if (target.getDeletedAt() != null) {
            throw new IllegalArgumentException("User is already deleted");
        }

        // Self-protection: Admin cannot delete their own account
        if (target.getId().equals(admin.getId())) {
            throw new IllegalArgumentException("Administrators cannot delete their own account");
        }

        // Last-admin protection: Cannot delete the last active administrator
        if (target.getRole() == UserRole.ADMIN && target.getStatus() == UserStatus.ACTIVE) {
            long activeAdminCount = userRepository.countByRoleAndStatusAndDeletedAtIsNull(UserRole.ADMIN, UserStatus.ACTIVE);
            if (activeAdminCount <= 1) {
                throw new IllegalStateException("Cannot delete the last active administrator");
            }
        }

        target.setDeletedAt(Instant.now());
        target.setDeletedBy(admin.getId());
        target.setStatus(UserStatus.SUSPENDED);
        User saved = userRepository.save(target);

        auditService.record(
                authentication,
                AuditAction.USER_DELETED,
                AuditTargetType.USER,
                targetId.toString(),
                "User soft-deleted by administrator",
                servletRequest
        );

        return toResponse(saved);
    }

    private User resolveAdminActor(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication required for administrative operations");
        }

        String email = authentication.getName();
        User admin = userRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Authenticated administrator not found: " + email));

        if (admin.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only users with role ADMIN can perform administrative user operations");
        }

        return admin;
    }

    private AdminUserResponse toResponse(User user) {
        return new AdminUserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                user.getDeletedAt()
        );
    }
}
