package com.synthora.admin.supplier;

import com.synthora.admin.audit.AuditAction;
import com.synthora.admin.audit.AuditService;
import com.synthora.admin.audit.AuditTargetType;
import com.synthora.admin.supplier.dto.*;
import com.synthora.common.ResourceNotFoundException;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.seller.SellerProfile;
import com.synthora.seller.SupplierIdentityResolver;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Service for administrative supplier moderation: verification, export readiness,
 * linked account status toggling, and audit logging.
 */
@Service
@Transactional
public class AdminSupplierService {

    private final SupplierRepository supplierRepository;
    private final UserRepository userRepository;
    private final SupplierIdentityResolver supplierIdentityResolver;
    private final AuditService auditService;

    public AdminSupplierService(
            SupplierRepository supplierRepository,
            UserRepository userRepository,
            SupplierIdentityResolver supplierIdentityResolver,
            AuditService auditService) {
        this.supplierRepository = supplierRepository;
        this.userRepository = userRepository;
        this.supplierIdentityResolver = supplierIdentityResolver;
        this.auditService = auditService;
    }

    /**
     * Retrieves a paginated list of suppliers with dynamic search, country, verified,
     * exportReady, and linked user status filters.
     */
    @Transactional(readOnly = true)
    public Page<AdminSupplierResponse> getSuppliers(
            int page,
            int size,
            String query,
            String country,
            Boolean verified,
            Boolean exportReady,
            UserStatus status,
            boolean includeDeleted) {

        int boundedPage = Math.max(0, page);
        int boundedSize = Math.min(Math.max(1, size), 100);

        Pageable pageable = PageRequest.of(
                boundedPage,
                boundedSize,
                Sort.by(Sort.Direction.ASC, "name").and(Sort.by(Sort.Direction.ASC, "id"))
        );

        Specification<Supplier> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            Join<Supplier, User> userJoin = root.join("user", JoinType.LEFT);

            if (!includeDeleted) {
                predicates.add(cb.or(cb.isNull(userJoin), cb.isNull(userJoin.get("deletedAt"))));
            }

            if (query != null && !query.trim().isEmpty()) {
                String searchPattern = "%" + query.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), searchPattern);
                Predicate slugMatch = cb.like(cb.lower(root.get("slug")), searchPattern);
                Predicate emailMatch = cb.like(cb.lower(userJoin.get("email")), searchPattern);
                predicates.add(cb.or(nameMatch, slugMatch, emailMatch));
            }

            if (country != null && !country.trim().isEmpty()) {
                String countrySearch = country.trim().toLowerCase();
                Predicate codeMatch = cb.equal(cb.lower(root.get("countryCode")), countrySearch);
                Predicate nameMatch = cb.like(cb.lower(root.get("countryName")), "%" + countrySearch + "%");
                predicates.add(cb.or(codeMatch, nameMatch));
            }

            if (verified != null) {
                predicates.add(cb.equal(root.get("verified"), verified));
            }

            if (exportReady != null) {
                predicates.add(cb.equal(root.get("exportReady"), exportReady));
            }

            if (status != null) {
                predicates.add(cb.and(cb.isNotNull(userJoin), cb.equal(userJoin.get("status"), status)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return supplierRepository.findAll(spec, pageable).map(this::toResponse);
    }

    /**
     * Retrieves detailed supplier record including resolved editable SellerProfile information.
     */
    @Transactional(readOnly = true)
    public AdminSupplierDetailResponse getSupplierDetail(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + id));

        AdminSellerProfileInfo profileInfo = null;
        if (supplier.getUser() != null) {
            Optional<SellerProfile> profileOpt = supplierIdentityResolver.resolveEditableProfile(supplier.getUser());
            if (profileOpt.isPresent()) {
                SellerProfile p = profileOpt.get();
                profileInfo = new AdminSellerProfileInfo(
                        p.getId(),
                        p.getCompanyName(),
                        p.getGstNumber(),
                        p.getAddress(),
                        p.getCity(),
                        p.getState(),
                        p.getCountry(),
                        p.getWebsite(),
                        p.getCertifications(),
                        p.getAboutCompany(),
                        p.getCreatedAt(),
                        p.getUpdatedAt()
                );
            }
        }

        return new AdminSupplierDetailResponse(
                supplier.getId(),
                supplier.getName(),
                supplier.getSlug(),
                supplier.getCountryCode(),
                supplier.getCountryName(),
                supplier.getLogoUrl(),
                supplier.getVerified(),
                supplier.getYearsInBusiness(),
                supplier.getResponseRate(),
                supplier.getExportReady(),
                supplier.getCreatedAt(),
                supplier.getUser() != null ? supplier.getUser().getId() : null,
                supplier.getUser() != null ? supplier.getUser().getEmail() : null,
                supplier.getUser() != null ? supplier.getUser().getStatus() : null,
                profileInfo
        );
    }

    /**
     * Updates supplier verification status (verified = true | false) and logs audit entry.
     */
    public AdminSupplierResponse updateVerification(
            Long id,
            UpdateSupplierVerificationRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        resolveAdminActor(authentication);
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + id));

        if (Boolean.valueOf(request.verified()).equals(supplier.getVerified())) {
            throw new IllegalArgumentException("Supplier verification status is already " + request.verified());
        }

        boolean oldVerified = Boolean.TRUE.equals(supplier.getVerified());
        supplier.setVerified(request.verified());
        Supplier saved = supplierRepository.save(supplier);

        AuditAction action = Boolean.TRUE.equals(request.verified())
                ? AuditAction.SUPPLIER_VERIFIED
                : AuditAction.SUPPLIER_UNVERIFIED;

        String details = (request.reason() != null && !request.reason().trim().isEmpty())
                ? request.reason().trim()
                : ("Verified: " + oldVerified + " -> " + request.verified());

        auditService.record(authentication, action, AuditTargetType.SUPPLIER, id.toString(), details, servletRequest);

        return toResponse(saved);
    }

    /**
     * Updates supplier export readiness (exportReady = true | false) and logs audit entry.
     */
    public AdminSupplierResponse updateExportReady(
            Long id,
            UpdateSupplierExportReadyRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        resolveAdminActor(authentication);
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + id));

        if (Boolean.valueOf(request.exportReady()).equals(supplier.getExportReady())) {
            throw new IllegalArgumentException("Supplier export-ready status is already " + request.exportReady());
        }

        boolean oldExportReady = Boolean.TRUE.equals(supplier.getExportReady());
        supplier.setExportReady(request.exportReady());
        Supplier saved = supplierRepository.save(supplier);

        String details = (request.reason() != null && !request.reason().trim().isEmpty())
                ? request.reason().trim()
                : ("ExportReady: " + oldExportReady + " -> " + request.exportReady());

        auditService.record(
                authentication,
                AuditAction.SUPPLIER_EXPORT_READY_CHANGED,
                AuditTargetType.SUPPLIER,
                id.toString(),
                details,
                servletRequest
        );

        return toResponse(saved);
    }

    /**
     * Moderates the linked supplier user's status (ACTIVE <-> SUSPENDED) with self and last-admin protection.
     */
    public AdminSupplierResponse updateSupplierStatus(
            Long id,
            UpdateSupplierStatusRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        User admin = resolveAdminActor(authentication);
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + id));

        if (supplier.getUser() == null) {
            throw new IllegalStateException("Supplier does not have an associated user account");
        }

        User linkedUser = supplier.getUser();

        if (request.status() != UserStatus.ACTIVE && request.status() != UserStatus.SUSPENDED) {
            throw new IllegalArgumentException("Invalid status transition: only ACTIVE and SUSPENDED are supported");
        }

        if (linkedUser.getStatus() == request.status()) {
            throw new IllegalArgumentException("Supplier user is already in status " + request.status());
        }

        if (linkedUser.getDeletedAt() != null) {
            throw new IllegalStateException("Cannot change status of a soft-deleted supplier account");
        }

        // Self-protection: Admin cannot suspend their own linked supplier account
        if (linkedUser.getId().equals(admin.getId()) && request.status() == UserStatus.SUSPENDED) {
            throw new IllegalArgumentException("Administrators cannot suspend their own linked account");
        }

        // Last-admin protection: If linked user is an active ADMIN, verify remaining admin count
        if (linkedUser.getRole() == UserRole.ADMIN && linkedUser.getStatus() == UserStatus.ACTIVE && request.status() == UserStatus.SUSPENDED) {
            long activeAdminCount = userRepository.countByRoleAndStatusAndDeletedAtIsNull(UserRole.ADMIN, UserStatus.ACTIVE);
            if (activeAdminCount <= 1) {
                throw new IllegalStateException("Cannot suspend the last active administrator");
            }
        }

        linkedUser.setStatus(request.status());
        userRepository.save(linkedUser);

        AuditAction action = (request.status() == UserStatus.SUSPENDED)
                ? AuditAction.SUPPLIER_SUSPENDED
                : AuditAction.SUPPLIER_ACTIVATED;

        String details = (request.reason() != null && !request.reason().trim().isEmpty())
                ? request.reason().trim()
                : ("Status changed to " + request.status());

        auditService.record(authentication, action, AuditTargetType.SUPPLIER, id.toString(), details, servletRequest);

        return toResponse(supplier);
    }

    private User resolveAdminActor(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication required for administrative operations");
        }

        String email = authentication.getName();
        User admin = userRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Authenticated administrator not found: " + email));

        if (admin.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only users with role ADMIN can perform supplier moderation");
        }

        return admin;
    }

    private AdminSupplierResponse toResponse(Supplier supplier) {
        return new AdminSupplierResponse(
                supplier.getId(),
                supplier.getName(),
                supplier.getSlug(),
                supplier.getCountryCode(),
                supplier.getCountryName(),
                supplier.getLogoUrl(),
                supplier.getVerified(),
                supplier.getYearsInBusiness(),
                supplier.getResponseRate(),
                supplier.getExportReady(),
                supplier.getUser() != null ? supplier.getUser().getId() : null,
                supplier.getUser() != null ? supplier.getUser().getEmail() : null,
                supplier.getUser() != null ? supplier.getUser().getStatus() : null,
                supplier.getCreatedAt()
        );
    }
}
