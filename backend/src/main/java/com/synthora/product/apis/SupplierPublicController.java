package com.synthora.product.apis;

import com.synthora.common.ResourceNotFoundException;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.product.SupplierSpecification;
import com.synthora.product.dto.SupplierPublicResponse;
import com.synthora.seller.SellerProfile;
import com.synthora.seller.SupplierIdentityResolver;
import com.synthora.identity.User;
import com.synthora.product.Product;
import com.synthora.product.ProductRepository;
import com.synthora.product.dto.SupplierProductPublicResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/suppliers")
public class SupplierPublicController {

    private final SupplierRepository supplierRepository;
    private final SupplierIdentityResolver identityResolver;
    private final ProductRepository productRepository;

    public SupplierPublicController(SupplierRepository supplierRepository,
                                    SupplierIdentityResolver identityResolver,
                                    ProductRepository productRepository) {
        this.supplierRepository = supplierRepository;
        this.identityResolver = identityResolver;
        this.productRepository = productRepository;
    }

    private static final java.util.Set<String> ALLOWED_SUPPLIER_SORT_FIELDS = java.util.Set.of(
            "name", "countryName", "yearsInBusiness", "responseRate", "createdAt", "id"
    );

    private Pageable sanitizePageable(Pageable pageable, String defaultSort) {
        int page = Math.max(0, pageable.getPageNumber());
        int size = Math.min(Math.max(1, pageable.getPageSize()), 100);
        Sort sort = pageable.getSort();
        List<Sort.Order> safeOrders = new ArrayList<>();
        for (Sort.Order order : sort) {
            if (ALLOWED_SUPPLIER_SORT_FIELDS.contains(order.getProperty())) {
                safeOrders.add(order);
            }
        }
        if (safeOrders.isEmpty()) {
            safeOrders.add(new Sort.Order(Sort.Direction.ASC, defaultSort));
        }
        return org.springframework.data.domain.PageRequest.of(page, size, Sort.by(safeOrders));
    }

    @GetMapping
    public ResponseEntity<Page<SupplierPublicResponse>> listPublicSuppliers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) Boolean verified,
            @RequestParam(required = false) Boolean exportReady,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {

        Pageable safePageable = sanitizePageable(pageable, "name");

        Page<Supplier> supplierPage = supplierRepository.findAll(
                SupplierSpecification.searchAndFilter(search, country, verified, exportReady),
                safePageable
        );

        List<User> users = supplierPage.getContent().stream()
                .map(Supplier::getUser)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        List<SellerProfile> profiles = identityResolver.resolveEditableProfiles(users);
        Map<User, SellerProfile> profileMap = profiles.stream()
                .collect(Collectors.toMap(SellerProfile::getUser, p -> p));

        Page<SupplierPublicResponse> responsePage = supplierPage.map(supplier ->
                mapToResponse(supplier, Optional.ofNullable(supplier.getUser() != null ? profileMap.get(supplier.getUser()) : null)));

        return ResponseEntity.ok(responsePage);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupplierPublicResponse> getPublicSupplier(@PathVariable Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));

        Optional<SellerProfile> profileOpt = Optional.empty();
        if (supplier.getUser() != null) {
            profileOpt = identityResolver.resolveEditableProfile(supplier.getUser());
        }

        return ResponseEntity.ok(mapToResponse(supplier, profileOpt));
    }

    private SupplierPublicResponse mapToResponse(Supplier supplier, Optional<SellerProfile> profileOpt) {
        return new SupplierPublicResponse(
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
                profileOpt.map(SellerProfile::getAboutCompany).orElse(null),
                profileOpt.map(SellerProfile::getWebsite).orElse(null),
                profileOpt.map(SellerProfile::getCertifications).orElse(null)
        );
    }

    private static final java.util.Set<String> ALLOWED_PRODUCT_SORT_FIELDS = java.util.Set.of(
            "name", "price", "stock", "createdAt", "updatedAt", "category", "leadTimeDays", "purity", "moqKg"
    );

    @GetMapping("/{id}/products")
    public ResponseEntity<Page<SupplierProductPublicResponse>> getSupplierProducts(
            @PathVariable Long id,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));

        int page = Math.max(0, pageable.getPageNumber());
        int size = Math.min(Math.max(1, pageable.getPageSize()), 100);
        Sort sort = pageable.getSort();
        List<Sort.Order> safeOrders = new ArrayList<>();
        for (Sort.Order order : sort) {
            if (ALLOWED_PRODUCT_SORT_FIELDS.contains(order.getProperty())) {
                safeOrders.add(order);
            }
        }
        if (safeOrders.isEmpty()) {
            safeOrders.add(new Sort.Order(Sort.Direction.DESC, "createdAt"));
        }
        Pageable safePageable = org.springframework.data.domain.PageRequest.of(page, size, Sort.by(safeOrders));

        if (supplier.getUser() == null ||
                supplier.getUser().getStatus() == com.synthora.identity.UserStatus.SUSPENDED ||
                supplier.getUser().getDeletedAt() != null) {
            return ResponseEntity.ok(Page.empty(safePageable));
        }

        Page<Product> products = productRepository.findBySellerId(supplier.getUser().getId(), safePageable);
        
        Page<SupplierProductPublicResponse> responsePage = products
            .map(product -> {
                if (product.getAvailabilityStatus() != null &&
                        ("HIDDEN".equalsIgnoreCase(product.getAvailabilityStatus()) ||
                         "DISCONTINUED".equalsIgnoreCase(product.getAvailabilityStatus()))) {
                    return null;
                }
                return new SupplierProductPublicResponse(
                    product.getId(),
                    product.getName(),
                    product.getDescription(),
                    product.getCategory(),
                    product.getCasNumber(),
                    product.getMolecularFormula(),
                    product.getPurity(),
                    product.getGrade(),
                    product.getMoqKg(),
                    product.getPackaging(),
                    product.getLeadTimeDays(),
                    product.getAvailabilityStatus(),
                    product.getExportReady()
                );
            });

        return ResponseEntity.ok(responsePage);
    }
}
