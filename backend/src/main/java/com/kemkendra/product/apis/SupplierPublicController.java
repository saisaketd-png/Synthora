package com.kemkendra.product.apis;

import com.kemkendra.common.ResourceNotFoundException;
import com.kemkendra.product.Supplier;
import com.kemkendra.product.SupplierRepository;
import com.kemkendra.product.SupplierSpecification;
import com.kemkendra.product.dto.SupplierPerformanceResponse;
import com.kemkendra.product.dto.SupplierPublicResponse;
import com.kemkendra.seller.SellerProfile;
import com.kemkendra.seller.SupplierIdentityResolver;
import com.kemkendra.seller.SupplierPerformanceService;
import com.kemkendra.identity.User;
import com.kemkendra.product.Product;
import com.kemkendra.product.ProductRepository;
import com.kemkendra.product.MasterProduct;
import com.kemkendra.product.ProductCategory;
import com.kemkendra.product.SupplierOffering;
import com.kemkendra.product.dto.SupplierProductPublicResponse;
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
    private final com.kemkendra.product.SupplierOfferingRepository supplierOfferingRepository;
    private final com.kemkendra.document.storage.StorageService storageService;
    private final SupplierPerformanceService supplierPerformanceService;

    public SupplierPublicController(SupplierRepository supplierRepository,
                                    SupplierIdentityResolver identityResolver,
                                    ProductRepository productRepository,
                                    com.kemkendra.product.SupplierOfferingRepository supplierOfferingRepository,
                                    com.kemkendra.document.storage.StorageService storageService,
                                    SupplierPerformanceService supplierPerformanceService) {
        this.supplierRepository = supplierRepository;
        this.identityResolver = identityResolver;
        this.productRepository = productRepository;
        this.supplierOfferingRepository = supplierOfferingRepository;
        this.storageService = storageService;
        this.supplierPerformanceService = supplierPerformanceService;
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

        List<Long> supplierIds = supplierPage.getContent().stream()
                .map(Supplier::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        Map<Long, SupplierPerformanceResponse> performanceMap = supplierPerformanceService.getBulkSupplierPerformance(supplierIds);

        Page<SupplierPublicResponse> responsePage = supplierPage.map(supplier -> {
            Optional<SellerProfile> profileOpt = Optional.ofNullable(supplier.getUser() != null ? profileMap.get(supplier.getUser()) : null);
            SupplierPerformanceResponse perf = performanceMap.get(supplier.getId());
            return mapToResponse(supplier, profileOpt, perf);
        });

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

        SupplierPerformanceResponse perf = supplierPerformanceService.getSupplierPerformance(id);
        return ResponseEntity.ok(mapToResponse(supplier, profileOpt, perf));
    }

    @GetMapping("/{id}/performance")
    public ResponseEntity<SupplierPerformanceResponse> getSupplierPerformance(@PathVariable Long id) {
        if (!supplierRepository.existsById(id)) {
            throw new ResourceNotFoundException("Supplier not found: " + id);
        }
        return ResponseEntity.ok(supplierPerformanceService.getSupplierPerformance(id));
    }

    @GetMapping("/{id}/logo")
    public ResponseEntity<org.springframework.core.io.Resource> getSupplierLogo(@PathVariable Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + id));

        if (supplier.getLogoStoragePath() == null || supplier.getLogoStoragePath().isBlank()) {
            throw new ResourceNotFoundException("Supplier logo not found for supplier: " + id);
        }

        if (!storageService.exists(supplier.getLogoStoragePath())) {
            throw new ResourceNotFoundException("Supplier logo file does not exist in storage: " + id);
        }

        org.springframework.core.io.Resource resource = storageService.loadAsResource(supplier.getLogoStoragePath());
        String contentType = supplier.getLogoContentType() != null && !supplier.getLogoContentType().isBlank()
                ? supplier.getLogoContentType()
                : org.springframework.http.MediaType.IMAGE_PNG_VALUE;

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .header("X-Content-Type-Options", "nosniff")
                .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                .body(resource);
    }

    private SupplierPublicResponse mapToResponse(Supplier supplier, Optional<SellerProfile> profileOpt, SupplierPerformanceResponse perf) {
        Integer calculatedRate = perf != null ? perf.responseRate() : supplier.getResponseRate();
        Long avgResponseTime = perf != null ? perf.averageResponseTimeSeconds() : null;
        String formattedTime = perf != null ? perf.formattedResponseTime() : null;
        Long eligible = perf != null ? perf.eligibleRfqs() : null;
        Long responded = perf != null ? perf.respondedRfqs() : null;

        return new SupplierPublicResponse(
                supplier.getId(),
                supplier.getName(),
                supplier.getSlug(),
                supplier.getCountryCode(),
                supplier.getCountryName(),
                supplier.getLogoUrl(),
                supplier.getVerified(),
                supplier.getYearsInBusiness(),
                calculatedRate,
                avgResponseTime,
                formattedTime,
                eligible,
                responded,
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

        // 1. Check active SupplierOffering records first
        Page<SupplierOffering> offerings = supplierOfferingRepository.findBySupplierId(id, safePageable);
        if (offerings.hasContent()) {
            Page<SupplierProductPublicResponse> responsePage = offerings.map(offering -> {
                MasterProduct mp = offering.getMasterProduct();
                ProductCategory cat = mp != null && mp.getCategory() != null ? mp.getCategory() : ProductCategory.API;
                return new SupplierProductPublicResponse(
                        mp.getId(),
                        mp.getName(),
                        mp.getDescription(),
                        cat,
                        mp.getCasNumber(),
                        mp.getMolecularFormula(),
                        offering.getPurity(),
                        offering.getGrade(),
                        offering.getMoqKg(),
                        offering.getPackaging(),
                        offering.getLeadTimeDays(),
                        offering.getAvailabilityStatus(),
                        offering.getExportReady()
                );
            });
            return ResponseEntity.ok(responsePage);
        }

        // 2. Legacy fallback
        if (supplier.getUser() == null ||
                supplier.getUser().getStatus() == com.kemkendra.identity.UserStatus.SUSPENDED ||
                supplier.getUser().getDeletedAt() != null) {
            return ResponseEntity.ok(Page.empty(safePageable));
        }

        Page<Product> products = productRepository.findBySellerId(supplier.getUser().getId(), safePageable);
        
        Page<SupplierProductPublicResponse> responsePage = products
            .map(product -> new SupplierProductPublicResponse(
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
            ));

        return ResponseEntity.ok(responsePage);
    }
}
