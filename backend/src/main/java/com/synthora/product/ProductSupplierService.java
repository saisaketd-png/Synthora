package com.synthora.product;

import com.synthora.common.ResourceNotFoundException;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.product.dto.ProductSupplierManageResponse;
import com.synthora.product.dto.ProductSupplierRequest;
import com.synthora.seller.SupplierIdentityResolver;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service owning all ProductSupplier mutation logic for Phase 2E.4.
 * <p>
 * Supplier identity is ALWAYS resolved from the authenticated principal —
 * never accepted from the request payload. Product ownership (Product.seller)
 * is never modified.
 * </p>
 */
@Service
@Transactional
public class ProductSupplierService {

    private final ProductSupplierRepository productSupplierRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final SupplierIdentityResolver identityResolver;

    public ProductSupplierService(
            ProductSupplierRepository productSupplierRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            SupplierIdentityResolver identityResolver) {
        this.productSupplierRepository = productSupplierRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.identityResolver = identityResolver;
    }

    /**
     * Creates a new offering for the authenticated supplier on the specified product.
     * Returns 404 if the product does not exist.
     * Returns 409 (via IllegalStateException → GlobalExceptionHandler) if the
     * supplier already has an offering for this product.
     */
    public ProductSupplierManageResponse createOffering(
            UUID productId,
            ProductSupplierRequest request,
            Authentication authentication) {

        User user = resolveUser(authentication);
        Supplier supplier = identityResolver.resolveOperationalSupplier(user);
        Product product = resolveProduct(productId);

        if (productSupplierRepository.existsByProductIdAndSupplierId(productId, supplier.getId())) {
            throw new IllegalStateException(
                    "You already have an offering for this product. Use PUT to update it.");
        }

        ProductSupplier ps = new ProductSupplier();
        ps.setProduct(product);
        ps.setSupplier(supplier);
        applyFields(ps, request);

        ProductSupplier saved = productSupplierRepository.save(ps);
        return toManageResponse(saved);
    }

    /**
     * Retrieves the authenticated supplier's own offering for the specified product.
     * Returns 404 if no offering exists (ownership-scoped query — information-hiding).
     */
    @Transactional(readOnly = true)
    public ProductSupplierManageResponse getMyOffering(UUID productId, Authentication authentication) {
        User user = resolveUser(authentication);
        Supplier supplier = identityResolver.resolveOperationalSupplier(user);

        ProductSupplier ps = productSupplierRepository
                .findByProductIdAndSupplierId(productId, supplier.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No offering found for this product"));

        return toManageResponse(ps);
    }

    /**
     * Updates the authenticated supplier's existing offering for the specified product.
     * Returns 404 if no offering exists (ownership-scoped — hides other suppliers' records).
     * Product.seller is NOT modified.
     */
    public ProductSupplierManageResponse updateOffering(
            UUID productId,
            ProductSupplierRequest request,
            Authentication authentication) {

        User user = resolveUser(authentication);
        Supplier supplier = identityResolver.resolveOperationalSupplier(user);

        ProductSupplier ps = productSupplierRepository
                .findByProductIdAndSupplierId(productId, supplier.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No offering found for this product"));

        applyFields(ps, request);
        ProductSupplier saved = productSupplierRepository.save(ps);
        return toManageResponse(saved);
    }

    /**
     * Deletes the authenticated supplier's offering for the specified product.
     * Returns 404 if no offering exists (ownership-scoped).
     */
    public void deleteOffering(UUID productId, Authentication authentication) {
        User user = resolveUser(authentication);
        Supplier supplier = identityResolver.resolveOperationalSupplier(user);

        ProductSupplier ps = productSupplierRepository
                .findByProductIdAndSupplierId(productId, supplier.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No offering found for this product"));

        productSupplierRepository.delete(ps);
    }

    /**
     * Returns all offerings the authenticated supplier has across all products.
     */
    @Transactional(readOnly = true)
    public List<ProductSupplierManageResponse> getMyOfferings(Authentication authentication) {
        User user = resolveUser(authentication);
        Supplier supplier = identityResolver.resolveOperationalSupplier(user);

        return productSupplierRepository.findBySupplierId(supplier.getId())
                .stream()
                .map(this::toManageResponse)
                .toList();
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private User resolveUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Product resolveProduct(UUID productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    /**
     * Applies request fields to the entity. All fields are optional —
     * only non-null values in the request overwrite existing values.
     * This allows both create (all nulls become entity defaults) and
     * partial update semantics.
     */
    private void applyFields(ProductSupplier ps, ProductSupplierRequest request) {
        if (request.purity() != null) ps.setPurity(request.purity());
        if (request.grade() != null) ps.setGrade(request.grade());
        if (request.moqKg() != null) ps.setMoqKg(request.moqKg());
        if (request.packaging() != null) ps.setPackaging(request.packaging());
        if (request.leadTimeDays() != null) ps.setLeadTimeDays(request.leadTimeDays());
        if (request.coaAvailable() != null) ps.setCoaAvailable(request.coaAvailable());
        if (request.msdsAvailable() != null) ps.setMsdsAvailable(request.msdsAvailable());
    }

    private ProductSupplierManageResponse toManageResponse(ProductSupplier ps) {
        return new ProductSupplierManageResponse(
                ps.getId(),
                ps.getProduct().getId(),
                ps.getProduct().getName(),
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
