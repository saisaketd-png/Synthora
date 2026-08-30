package com.synthora.product.apis;

import com.synthora.product.LegacyProductTransitionService;
import com.synthora.product.MasterProduct;
import com.synthora.product.MasterProductService;
import com.synthora.product.SupplierOfferingService;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.product.dto.MasterProductResponse;
import com.synthora.product.dto.SupplierOfferingResponse;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/public/master-products")
public class PublicMasterCatalogController {

    private final MasterProductService masterProductService;
    private final SupplierOfferingService supplierOfferingService;
    private final LegacyProductTransitionService transitionService;
    private final SupplierRepository supplierRepository;

    public PublicMasterCatalogController(
            MasterProductService masterProductService,
            SupplierOfferingService supplierOfferingService,
            LegacyProductTransitionService transitionService,
            SupplierRepository supplierRepository) {
        this.masterProductService = masterProductService;
        this.supplierOfferingService = supplierOfferingService;
        this.transitionService = transitionService;
        this.supplierRepository = supplierRepository;
    }

    @GetMapping
    public ResponseEntity<Page<MasterProductResponse>> searchActiveMasterProducts(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) com.synthora.product.ProductCategory category,
            @RequestParam(required = false) java.math.BigDecimal minPurity,
            @RequestParam(required = false) java.math.BigDecimal maxPurity,
            @RequestParam(required = false) String grade,
            @RequestParam(required = false) String currency,
            @RequestParam(required = false) java.math.BigDecimal maxPrice,
            @RequestParam(required = false) java.math.BigDecimal minMoq,
            @RequestParam(required = false) java.math.BigDecimal maxMoq,
            @RequestParam(required = false) Integer maxLeadTime,
            @RequestParam(required = false) String availabilityStatus,
            @RequestParam(required = false) Integer minStock,
            @RequestParam(required = false) Boolean coaAvailable,
            @RequestParam(required = false) Boolean msdsAvailable,
            @RequestParam(required = false) Boolean exportReady,
            @RequestParam(required = false) Boolean verifiedSupplier,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sort) {
        com.synthora.product.dto.MasterProductSearchCriteria criteria = new com.synthora.product.dto.MasterProductSearchCriteria(
                query, category, minPurity, maxPurity, grade, currency, maxPrice, minMoq, maxMoq,
                maxLeadTime, availabilityStatus, minStock, coaAvailable, msdsAvailable, exportReady, verifiedSupplier, page, size, sort);
        return ResponseEntity.ok(masterProductService.searchActiveMasterProductsWithCriteria(criteria));
    }

    public ResponseEntity<Page<MasterProductResponse>> searchActiveMasterProducts(
            String query,
            com.synthora.product.ProductCategory category,
            java.math.BigDecimal minPurity,
            java.math.BigDecimal maxPurity,
            String currency,
            java.math.BigDecimal maxPrice,
            java.math.BigDecimal minMoq,
            java.math.BigDecimal maxMoq,
            Integer maxLeadTime,
            String availabilityStatus,
            Integer minStock,
            Boolean coaAvailable,
            Boolean msdsAvailable,
            Boolean exportReady,
            Boolean verifiedSupplier,
            int page,
            int size,
            String sort) {
        return searchActiveMasterProducts(query, category, minPurity, maxPurity, null, currency, maxPrice, minMoq, maxMoq,
                maxLeadTime, availabilityStatus, minStock, coaAvailable, msdsAvailable, exportReady, verifiedSupplier, page, size, sort);
    }

    @GetMapping("/categories/counts")
    public ResponseEntity<java.util.Map<String, Long>> getCategoryCounts() {
        return ResponseEntity.ok(masterProductService.getCategoryCounts());
    }

    @GetMapping("/{idOrCode}")
    public ResponseEntity<MasterProductResponse> getActiveMasterProduct(@PathVariable String idOrCode) {
        MasterProduct mp = transitionService.resolveCanonicalMasterProduct(idOrCode);
        if (!"ACTIVE".equalsIgnoreCase(mp.getStatus())) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(masterProductService.getMasterProductById(mp.getId()));
    }

    public ResponseEntity<List<SupplierOfferingResponse>> getPublicOfferingsForMasterProduct(String idOrCode) {
        return getPublicOfferingsForMasterProduct(idOrCode, null);
    }

    @GetMapping("/{idOrCode}/offerings")
    public ResponseEntity<List<SupplierOfferingResponse>> getPublicOfferingsForMasterProduct(
            @PathVariable String idOrCode,
            @RequestParam(required = false) String sort) {
        MasterProduct mp = transitionService.resolveCanonicalMasterProduct(idOrCode);
        if (!"ACTIVE".equalsIgnoreCase(mp.getStatus())) {
            return ResponseEntity.notFound().build();
        }
        List<SupplierOfferingResponse> offerings = supplierOfferingService.getOfferingsForMasterProduct(mp.getId());
        List<SupplierOfferingResponse> activeOfferings = offerings.stream()
                .filter(o -> {
                    if (!"AVAILABLE".equalsIgnoreCase(o.availabilityStatus()) || !"APPROVED".equalsIgnoreCase(o.moderationStatus())) {
                        return false;
                    }
                    return supplierRepository.findById(o.supplierId())
                            .map(s -> Boolean.TRUE.equals(s.getVerified()) && s.getVerificationStatus() != com.synthora.seller.SupplierVerificationStatus.SUSPENDED && s.getVerificationStatus() != com.synthora.seller.SupplierVerificationStatus.REJECTED)
                            .orElse(false);
                })
                .map(o -> new SupplierOfferingResponse(
                        o.id(),
                        o.masterProductId(),
                        o.masterProductCode(),
                        o.masterProductName(),
                        o.casNumber(),
                        o.molecularFormula(),
                        o.category(),
                        o.supplierId(),
                        o.supplierName(),
                        o.price(),
                        o.currency(),
                        o.stock(),
                        o.purity(),
                        o.grade(),
                        o.moqKg(),
                        o.packaging(),
                        o.leadTimeDays(),
                        o.coaAvailable(),
                        o.msdsAvailable(),
                        o.exportReady(),
                        o.availabilityStatus(),
                        o.moderationStatus(),
                        null, // Sanitize internal governance notes for privacy
                        o.supplierLogoUrl(),
                        o.supplierVerified(),
                        o.responseRate(),
                        o.averageResponseTimeSeconds(),
                        o.formattedResponseTime(),
                        o.createdByRole(),
                        o.createdByAdminId(),
                        o.createdByAdminName(),
                        o.createdAt(),
                        o.updatedAt()
                ))
                .toList();

        if (sort != null && !sort.isBlank()) {
            activeOfferings = new java.util.ArrayList<>(activeOfferings);
            switch (sort.toLowerCase().trim()) {
                case "price_asc":
                case "price":
                    activeOfferings.sort(java.util.Comparator.comparing(SupplierOfferingResponse::price, java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())));
                    break;
                case "purity_desc":
                case "purity":
                    activeOfferings.sort(java.util.Comparator.comparing(SupplierOfferingResponse::purity, java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())));
                    break;
                case "moq_asc":
                case "moq":
                    activeOfferings.sort(java.util.Comparator.comparing(SupplierOfferingResponse::moqKg, java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())));
                    break;
                case "lead_asc":
                case "lead":
                    activeOfferings.sort(java.util.Comparator.comparing(SupplierOfferingResponse::leadTimeDays, java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())));
                    break;
                default:
                    break;
            }
        }

        return ResponseEntity.ok(activeOfferings);
    }
}
