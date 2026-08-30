package com.kemkendra.admin.product;

import com.kemkendra.admin.audit.AuditAction;
import com.kemkendra.admin.audit.AuditService;
import com.kemkendra.admin.audit.AuditTargetType;
import com.kemkendra.admin.product.dto.*;
import com.kemkendra.common.ResourceNotFoundException;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.product.*;
import com.kemkendra.product.dto.ProductSupplierRequest;
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
import java.util.Set;
import java.util.UUID;

/**
 * Service owning administrative moderation for Product catalog and ProductSupplier offerings.
 */
@Service
@Transactional
public class AdminProductService {

    public static final Set<String> ALLOWED_AVAILABILITY_STATUSES = Set.of(
            "AVAILABLE",
            "OUT_OF_STOCK",
            "HIDDEN",
            "DISCONTINUED"
    );

    private final ProductRepository productRepository;
    private final ProductSupplierRepository productSupplierRepository;
    private final SupplierRepository supplierRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public AdminProductService(
            ProductRepository productRepository,
            ProductSupplierRepository productSupplierRepository,
            SupplierRepository supplierRepository,
            UserRepository userRepository,
            AuditService auditService) {
        this.productRepository = productRepository;
        this.productSupplierRepository = productSupplierRepository;
        this.supplierRepository = supplierRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    /**
     * Paginated product catalog search and filtering for administrators.
     */
    @Transactional(readOnly = true)
    public Page<AdminProductResponse> getProducts(
            int page,
            int size,
            String query,
            ProductCategory category,
            UUID sellerId,
            String availabilityStatus) {

        int boundedPage = Math.max(0, page);
        int boundedSize = Math.min(Math.max(1, size), 100);

        Pageable pageable = PageRequest.of(
                boundedPage,
                boundedSize,
                Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id"))
        );

        Specification<Product> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (query != null && !query.trim().isEmpty()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), pattern);
                Predicate casMatch = cb.like(cb.lower(root.get("casNumber")), pattern);
                predicates.add(cb.or(nameMatch, casMatch));
            }

            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }

            if (sellerId != null) {
                predicates.add(cb.equal(root.get("seller").get("id"), sellerId));
            }

            if (availabilityStatus != null && !availabilityStatus.trim().isEmpty()) {
                predicates.add(cb.equal(cb.upper(root.get("availabilityStatus")), availabilityStatus.trim().toUpperCase()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return productRepository.findAll(spec, pageable).map(this::toResponse);
    }

    /**
     * Detailed product lookup with seller info and supplier offering count.
     */
    @Transactional(readOnly = true)
    public AdminProductDetailResponse getProductDetail(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));

        int offeringCount = productSupplierRepository.findByProductId(id).size();

        return new AdminProductDetailResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStock(),
                product.getCategory(),
                product.getCasNumber(),
                product.getMolecularFormula(),
                product.getPurity(),
                product.getGrade(),
                product.getPackaging(),
                product.getMoqKg(),
                product.getLeadTimeDays(),
                product.getCoaAvailable(),
                product.getMsdsAvailable(),
                product.getExportReady(),
                product.getAvailabilityStatus(),
                product.getSeller() != null ? product.getSeller().getId() : null,
                product.getSeller() != null ? product.getSeller().getName() : null,
                product.getSeller() != null ? product.getSeller().getEmail() : null,
                product.getCreatedAt(),
                product.getUpdatedAt(),
                offeringCount
        );
    }

    /**
     * Administrative product metadata correction.
     */
    public AdminProductResponse updateProduct(
            UUID id,
            UpdateAdminProductRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        resolveAdminActor(authentication);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));

        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setStock(request.stock());
        product.setCategory(request.category());
        product.setCasNumber(request.casNumber());
        product.setMolecularFormula(request.molecularFormula());
        product.setPurity(request.purity());
        product.setGrade(request.grade());
        product.setPackaging(request.packaging());
        product.setMoqKg(request.moqKg());
        product.setLeadTimeDays(request.leadTimeDays());

        if (request.coaAvailable() != null) product.setCoaAvailable(request.coaAvailable());
        if (request.msdsAvailable() != null) product.setMsdsAvailable(request.msdsAvailable());
        if (request.exportReady() != null) product.setExportReady(request.exportReady());

        if (request.availabilityStatus() != null && !request.availabilityStatus().trim().isEmpty()) {
            String norm = request.availabilityStatus().trim().toUpperCase();
            if (!ALLOWED_AVAILABILITY_STATUSES.contains(norm)) {
                throw new IllegalArgumentException("Invalid availability status: " + request.availabilityStatus());
            }
            product.setAvailabilityStatus(norm);
        }

        Product saved = productRepository.save(product);

        String details = (request.reason() != null && !request.reason().trim().isEmpty())
                ? request.reason().trim()
                : "Admin updated product metadata";

        auditService.record(
                authentication,
                AuditAction.PRODUCT_UPDATED,
                AuditTargetType.PRODUCT,
                id.toString(),
                details,
                servletRequest
        );

        return toResponse(saved);
    }

    /**
     * Administrative product availability moderation (AVAILABLE, OUT_OF_STOCK, HIDDEN, DISCONTINUED).
     */
    public AdminProductResponse updateAvailability(
            UUID id,
            UpdateProductAvailabilityRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        resolveAdminActor(authentication);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));

        String norm = request.availabilityStatus().trim().toUpperCase();
        if (!ALLOWED_AVAILABILITY_STATUSES.contains(norm)) {
            throw new IllegalArgumentException("Invalid availability status: " + request.availabilityStatus()
                    + ". Must be one of: " + ALLOWED_AVAILABILITY_STATUSES);
        }

        String oldStatus = product.getAvailabilityStatus();
        if (norm.equalsIgnoreCase(oldStatus)) {
            throw new IllegalArgumentException("Product availability status is already " + norm);
        }

        product.setAvailabilityStatus(norm);
        Product saved = productRepository.save(product);

        String details = "Product availability changed from " + oldStatus + " to " + norm
                + ((request.reason() != null && !request.reason().trim().isEmpty()) ? (": " + request.reason().trim()) : "");

        auditService.record(
                authentication,
                AuditAction.PRODUCT_UPDATED,
                AuditTargetType.PRODUCT,
                id.toString(),
                details,
                servletRequest
        );

        return toResponse(saved);
    }

    /**
     * Non-destructive product deactivation (sets availabilityStatus = "DISCONTINUED" and records PRODUCT_DELETED audit).
     */
    public AdminProductResponse deactivateProduct(
            UUID id,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        resolveAdminActor(authentication);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));

        product.setAvailabilityStatus("DISCONTINUED");
        Product saved = productRepository.save(product);

        auditService.record(
                authentication,
                AuditAction.PRODUCT_DELETED,
                AuditTargetType.PRODUCT,
                id.toString(),
                "Product deactivated by administrator (marked DISCONTINUED)",
                servletRequest
        );

        return toResponse(saved);
    }

    /**
     * Lists all ProductSupplier offerings associated with a product.
     */
    @Transactional(readOnly = true)
    public List<AdminProductSupplierResponse> getProductSuppliers(UUID productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found: " + productId);
        }

        return productSupplierRepository.findByProductId(productId)
                .stream()
                .map(this::toOfferingResponse)
                .toList();
    }

    /**
     * Updates an existing ProductSupplier offering's technical/commercial specs.
     */
    public AdminProductSupplierResponse updateProductSupplierOffering(
            UUID productId,
            Long supplierId,
            ProductSupplierRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        resolveAdminActor(authentication);

        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found: " + productId);
        }
        if (!supplierRepository.existsById(supplierId)) {
            throw new ResourceNotFoundException("Supplier not found: " + supplierId);
        }

        ProductSupplier ps = productSupplierRepository.findByProductIdAndSupplierId(productId, supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Offering not found for product " + productId + " and supplier " + supplierId));

        if (request.purity() != null) ps.setPurity(request.purity());
        if (request.grade() != null) ps.setGrade(request.grade());
        if (request.moqKg() != null) ps.setMoqKg(request.moqKg());
        if (request.packaging() != null) ps.setPackaging(request.packaging());
        if (request.leadTimeDays() != null) ps.setLeadTimeDays(request.leadTimeDays());
        if (request.coaAvailable() != null) ps.setCoaAvailable(request.coaAvailable());
        if (request.msdsAvailable() != null) ps.setMsdsAvailable(request.msdsAvailable());

        ProductSupplier saved = productSupplierRepository.save(ps);

        auditService.record(
                authentication,
                AuditAction.PRODUCT_UPDATED,
                AuditTargetType.PRODUCT_SUPPLIER,
                saved.getId().toString(),
                "Admin updated offering for supplier " + supplierId + " on product " + productId,
                servletRequest
        );

        return toOfferingResponse(saved);
    }

    /**
     * Deletes a ProductSupplier offering association without touching the Product, Supplier, or User.
     */
    public void deleteProductSupplierOffering(
            UUID productId,
            Long supplierId,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        resolveAdminActor(authentication);

        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found: " + productId);
        }
        if (!supplierRepository.existsById(supplierId)) {
            throw new ResourceNotFoundException("Supplier not found: " + supplierId);
        }

        ProductSupplier ps = productSupplierRepository.findByProductIdAndSupplierId(productId, supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Offering not found for product " + productId + " and supplier " + supplierId));

        Long offeringId = ps.getId();
        productSupplierRepository.delete(ps);

        auditService.record(
                authentication,
                AuditAction.PRODUCT_DELETED,
                AuditTargetType.PRODUCT_SUPPLIER,
                offeringId.toString(),
                "Admin removed supplier " + supplierId + " offering from product " + productId,
                servletRequest
        );
    }

    private User resolveAdminActor(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication required for administrative operations");
        }

        String email = authentication.getName();
        User admin = userRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Authenticated administrator not found: " + email));

        if (admin.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only users with role ADMIN can perform product moderation");
        }

        return admin;
    }

    private AdminProductResponse toResponse(Product product) {
        return new AdminProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStock(),
                product.getCategory(),
                product.getCasNumber(),
                product.getMolecularFormula(),
                product.getPurity(),
                product.getGrade(),
                product.getPackaging(),
                product.getMoqKg(),
                product.getLeadTimeDays(),
                product.getCoaAvailable(),
                product.getMsdsAvailable(),
                product.getExportReady(),
                product.getAvailabilityStatus(),
                product.getSeller() != null ? product.getSeller().getId() : null,
                product.getSeller() != null ? product.getSeller().getName() : null,
                product.getSeller() != null ? product.getSeller().getEmail() : null,
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }

    private AdminProductSupplierResponse toOfferingResponse(ProductSupplier ps) {
        return new AdminProductSupplierResponse(
                ps.getId(),
                ps.getProduct().getId(),
                ps.getProduct().getName(),
                ps.getSupplier().getId(),
                ps.getSupplier().getName(),
                ps.getSupplier().getCountryName(),
                ps.getSupplier().getVerified(),
                (ps.getSupplier().getUser() != null) ? ps.getSupplier().getUser().getStatus() : null,
                ps.getPurity(),
                ps.getGrade(),
                ps.getMoqKg(),
                ps.getPackaging(),
                ps.getLeadTimeDays(),
                ps.getCoaAvailable(),
                ps.getMsdsAvailable(),
                ps.getCreatedAt()
        );
    }
}
