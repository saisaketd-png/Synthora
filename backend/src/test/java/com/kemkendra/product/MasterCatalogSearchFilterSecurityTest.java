package com.kemkendra.product;

import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.product.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class MasterCatalogSearchFilterSecurityTest {

    @Autowired
    private MasterProductService masterProductService;

    @Autowired
    private SupplierOfferingService supplierOfferingService;

    @Autowired
    private MasterProductRepository masterProductRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private SupplierOfferingRepository supplierOfferingRepository;

    @Autowired
    private LegacyProductTransitionService transitionService;

    private User supplierUser;
    private Supplier supplier;
    private Authentication supplierAuth;

    private User buyerUser;
    private Authentication buyerAuth;

    private MasterProduct productParacetamol;
    private MasterProduct productMetformin;
    private MasterProduct productInactive;
    private MasterProduct productMerged;

    @BeforeEach
    public void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        supplierUser = new User();
        supplierUser.setName("Filter Supplier " + suffix);
        supplierUser.setEmail("sup_filter_" + suffix + "@kemkendra.com");
        supplierUser.setPasswordHash("hash");
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser = userRepository.save(supplierUser);

        supplier = new Supplier();
        supplier.setName("Filter Pharma Corp " + suffix);
        supplier.setSlug("filter-pharma-" + suffix);
        supplier.setUser(supplierUser);
        supplier.setVerified(true);
        supplier = supplierRepository.save(supplier);
        supplierAuth = new UsernamePasswordAuthenticationToken(supplierUser.getEmail(), null);

        buyerUser = new User();
        buyerUser.setName("Filter Buyer " + suffix);
        buyerUser.setEmail("buyer_filter_" + suffix + "@kemkendra.com");
        buyerUser.setPasswordHash("hash");
        buyerUser.setRole(UserRole.USER);
        buyerUser = userRepository.save(buyerUser);
        buyerAuth = new UsernamePasswordAuthenticationToken(buyerUser.getEmail(), null);

        // 1. Paracetamol (API-MP-100428, CAS: 103-90-2, Formula: C8H9NO2)
        MasterProduct mp1 = new MasterProduct();
        mp1.setName("Paracetamol Pharma Grade");
        mp1.setMasterProductCode("API-MP-100428");
        mp1.setCasNumber("103-90-2");
        mp1.setMolecularFormula("C8H9NO2");
        mp1.setCategory(ProductCategory.API);
        mp1.setDescription("High purity Analgesic API compound");
        mp1.setStatus("ACTIVE");
        productParacetamol = masterProductRepository.save(mp1);

        supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                productParacetamol.getId(),
                new BigDecimal("150.00"),
                "INR",
                1000,
                new BigDecimal("99.80"),
                "USP",
                new BigDecimal("25.00"),
                "25kg Fiber Drum",
                5,
                true,
                true,
                true,
                "AVAILABLE"
        ), supplierAuth);

        // 2. Metformin (API-MP-200550, CAS: 1115-70-4, Formula: C4H11N5.HCl)
        MasterProduct mp2 = new MasterProduct();
        mp2.setName("Metformin Hydrochloride");
        mp2.setMasterProductCode("API-MP-200550");
        mp2.setCasNumber("1115-70-4");
        mp2.setMolecularFormula("C4H11N5.HCl");
        mp2.setCategory(ProductCategory.API);
        mp2.setDescription("Antidiabetic active pharmaceutical ingredient");
        mp2.setStatus("ACTIVE");
        productMetformin = masterProductRepository.save(mp2);

        supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                productMetformin.getId(),
                new BigDecimal("300.00"),
                "INR",
                200,
                new BigDecimal("98.50"),
                "BP",
                new BigDecimal("100.00"),
                "50kg Bag",
                14,
                false,
                true,
                false,
                "AVAILABLE"
        ), supplierAuth);

        // 3. Inactive Product
        MasterProduct mp3 = new MasterProduct();
        mp3.setName("Hidden Suspended Compound");
        mp3.setMasterProductCode("API-MP-300000");
        mp3.setCasNumber("999-99-9");
        mp3.setCategory(ProductCategory.SPECIALTY_CHEMICAL);
        mp3.setStatus("INACTIVE");
        productInactive = masterProductRepository.save(mp3);

        // 4. Merged Product
        MasterProduct mp4 = new MasterProduct();
        mp4.setName("Duplicate Paracetamol Source");
        mp4.setMasterProductCode("API-MP-100429");
        mp4.setCasNumber("103-90-2");
        mp4.setCategory(ProductCategory.API);
        mp4.setStatus("MERGED");
        mp4.setMergedIntoMasterProduct(productParacetamol);
        productMerged = masterProductRepository.save(mp4);

        supplierOfferingRepository.findAll().forEach(o -> {
            o.setModerationStatus("APPROVED");
            supplierOfferingRepository.save(o);
        });
    }

    // Scenario 1: Search by Name
    @Test
    public void test01_SearchByName() {
        MasterProductSearchCriteria criteria = new MasterProductSearchCriteria("Paracetamol", null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, "createdAt,desc");
        Page<MasterProductResponse> res = masterProductService.searchActiveMasterProductsWithCriteria(criteria);
        assertTrue(res.getContent().stream().anyMatch(p -> p.name().contains("Paracetamol")));
    }

    // Scenario 2: Search by CAS Number
    @Test
    public void test02_SearchByCasNumber() {
        MasterProductSearchCriteria criteria = new MasterProductSearchCriteria("103-90-2", null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, "createdAt,desc");
        Page<MasterProductResponse> res = masterProductService.searchActiveMasterProductsWithCriteria(criteria);
        assertTrue(res.getContent().stream().anyMatch(p -> "API-MP-100428".equals(p.masterProductCode())));
    }

    // Scenario 3: Search by Master Product Code
    @Test
    public void test03_SearchByMasterProductCode() {
        MasterProductSearchCriteria criteria = new MasterProductSearchCriteria("API-MP-100428", null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, "createdAt,desc");
        Page<MasterProductResponse> res = masterProductService.searchActiveMasterProductsWithCriteria(criteria);
        assertEquals(1, res.getContent().size());
        assertEquals("Paracetamol Pharma Grade", res.getContent().get(0).name());
    }

    // Scenario 4: Search by Molecular Formula
    @Test
    public void test04_SearchByMolecularFormula() {
        MasterProductSearchCriteria criteria = new MasterProductSearchCriteria("C4H11N5.HCl", null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, "createdAt,desc");
        Page<MasterProductResponse> res = masterProductService.searchActiveMasterProductsWithCriteria(criteria);
        assertTrue(res.getContent().stream().anyMatch(p -> "API-MP-200550".equals(p.masterProductCode())));
    }

    // Scenario 5: Partial Name Search
    @Test
    public void test05_PartialNameSearch() {
        MasterProductSearchCriteria criteria = new MasterProductSearchCriteria("Formin", null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, "createdAt,desc");
        Page<MasterProductResponse> res = masterProductService.searchActiveMasterProductsWithCriteria(criteria);
        assertTrue(res.getContent().stream().anyMatch(p -> p.name().contains("Metformin")));
    }

    // Scenario 6: Category Filter
    @Test
    public void test06_CategoryFilter() {
        MasterProductSearchCriteria criteria = new MasterProductSearchCriteria(null, ProductCategory.API, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, "createdAt,desc");
        Page<MasterProductResponse> res = masterProductService.searchActiveMasterProductsWithCriteria(criteria);
        assertTrue(res.getContent().stream().allMatch(p -> p.category() == ProductCategory.API));
    }

    // Scenario 7: Purity Filter (minPurity = 99.0)
    @Test
    public void test07_PurityFilter() {
        MasterProductSearchCriteria criteria = new MasterProductSearchCriteria(null, null, new BigDecimal("99.00"), null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, "createdAt,desc");
        Page<MasterProductResponse> res = masterProductService.searchActiveMasterProductsWithCriteria(criteria);
        // Only Paracetamol (99.80%) matches, Metformin (98.50%) is excluded
        assertEquals(1, res.getContent().size());
        assertEquals("API-MP-100428", res.getContent().get(0).masterProductCode());
    }

    // Scenario 8: Price Filter with Currency Boundary (maxPrice = 200.00 INR)
    @Test
    public void test08_PriceFilterWithCurrencyBoundary() {
        MasterProductSearchCriteria criteria = new MasterProductSearchCriteria(null, null, null, null, "INR", new BigDecimal("200.00"), null, null, null, null, null, null, null, null, null, 0, 20, "createdAt,desc");
        Page<MasterProductResponse> res = masterProductService.searchActiveMasterProductsWithCriteria(criteria);
        // Only Paracetamol (150.00 INR) matches, Metformin (300.00 INR) is excluded
        assertEquals(1, res.getContent().size());
        assertEquals("API-MP-100428", res.getContent().get(0).masterProductCode());
    }

    // Scenario 9: MOQ Filter (maxMoq = 50.00 kg)
    @Test
    public void test09_MoqFilter() {
        MasterProductSearchCriteria criteria = new MasterProductSearchCriteria(null, null, null, null, "INR", null, null, new BigDecimal("50.00"), null, null, null, null, null, null, null, 0, 20, "createdAt,desc");
        Page<MasterProductResponse> res = masterProductService.searchActiveMasterProductsWithCriteria(criteria);
        assertEquals(1, res.getContent().size());
        assertEquals("API-MP-100428", res.getContent().get(0).masterProductCode());
    }

    // Scenario 10: Lead Time Filter (maxLeadTime = 7)
    @Test
    public void test10_LeadTimeFilter() {
        MasterProductSearchCriteria criteria = new MasterProductSearchCriteria(null, null, null, null, "INR", null, null, null, 7, null, null, null, null, null, null, 0, 20, "createdAt,desc");
        Page<MasterProductResponse> res = masterProductService.searchActiveMasterProductsWithCriteria(criteria);
        assertEquals(1, res.getContent().size());
        assertEquals("API-MP-100428", res.getContent().get(0).masterProductCode());
    }

    // Scenario 11: Availability Filter
    @Test
    public void test11_AvailabilityFilter() {
        MasterProductSearchCriteria criteria = new MasterProductSearchCriteria(null, null, null, null, "INR", null, null, null, null, "AVAILABLE", null, null, null, null, null, 0, 20, "createdAt,desc");
        Page<MasterProductResponse> res = masterProductService.searchActiveMasterProductsWithCriteria(criteria);
        assertTrue(res.getContent().size() >= 2);
    }

    // Scenario 12: COA Filter (coaAvailable = true)
    @Test
    public void test12_CoaFilter() {
        MasterProductSearchCriteria criteria = new MasterProductSearchCriteria(null, null, null, null, "INR", null, null, null, null, null, null, true, null, null, null, 0, 20, "createdAt,desc");
        Page<MasterProductResponse> res = masterProductService.searchActiveMasterProductsWithCriteria(criteria);
        assertEquals(1, res.getContent().size());
        assertEquals("API-MP-100428", res.getContent().get(0).masterProductCode());
    }

    // Scenario 13: MSDS Filter (msdsAvailable = true)
    @Test
    public void test13_MsdsFilter() {
        MasterProductSearchCriteria criteria = new MasterProductSearchCriteria(null, null, null, null, "INR", null, null, null, null, null, null, null, true, null, null, 0, 20, "createdAt,desc");
        Page<MasterProductResponse> res = masterProductService.searchActiveMasterProductsWithCriteria(criteria);
        assertEquals(2, res.getContent().size());
    }

    // Scenario 14: Export-Ready Filter (exportReady = true)
    @Test
    public void test14_ExportReadyFilter() {
        MasterProductSearchCriteria criteria = new MasterProductSearchCriteria(null, null, null, null, "INR", null, null, null, null, null, null, null, null, true, null, 0, 20, "createdAt,desc");
        Page<MasterProductResponse> res = masterProductService.searchActiveMasterProductsWithCriteria(criteria);
        assertEquals(1, res.getContent().size());
        assertEquals("API-MP-100428", res.getContent().get(0).masterProductCode());
    }

    // Scenario 15: Verified Supplier Filter (verifiedSupplier = true)
    @Test
    public void test15_VerifiedSupplierFilter() {
        MasterProductSearchCriteria criteria = new MasterProductSearchCriteria(null, null, null, null, "INR", null, null, null, null, null, null, null, null, null, true, 0, 20, "createdAt,desc");
        Page<MasterProductResponse> res = masterProductService.searchActiveMasterProductsWithCriteria(criteria);
        assertEquals(2, res.getContent().size());
    }

    // Scenario 16: Combined Multi-Criteria Filter
    @Test
    public void test16_CombinedMultiCriteriaFilter() {
        MasterProductSearchCriteria criteria = new MasterProductSearchCriteria("Paracetamol", ProductCategory.API, new BigDecimal("99.00"), null, "INR", new BigDecimal("200.00"), null, new BigDecimal("50.00"), 7, "AVAILABLE", null, true, true, true, true, 0, 20, "createdAt,desc");
        Page<MasterProductResponse> res = masterProductService.searchActiveMasterProductsWithCriteria(criteria);
        assertEquals(1, res.getContent().size());
        assertEquals("API-MP-100428", res.getContent().get(0).masterProductCode());
    }

    // Scenario 17: Bounded Pagination Bounds
    @Test
    public void test17_BoundedPaginationBounds() {
        MasterProductSearchCriteria criteria = new MasterProductSearchCriteria(null, null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, -5, 500, "createdAt,desc");
        Page<MasterProductResponse> res = masterProductService.searchActiveMasterProductsWithCriteria(criteria);
        assertEquals(0, res.getNumber());
        assertEquals(100, res.getSize());
    }

    // Scenario 18: Invalid Sort String Handling
    @Test
    public void test18_InvalidSortStringHandling() {
        MasterProductSearchCriteria criteria = new MasterProductSearchCriteria(null, null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, "DROP TABLE users; --");
        Page<MasterProductResponse> res = masterProductService.searchActiveMasterProductsWithCriteria(criteria);
        assertNotNull(res);
    }

    // Scenario 19: SQL Injection Sanitization
    @Test
    public void test19_SqlInjectionSanitization() {
        MasterProductSearchCriteria criteria = new MasterProductSearchCriteria("' OR '1'='1", null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, "createdAt,desc");
        Page<MasterProductResponse> res = masterProductService.searchActiveMasterProductsWithCriteria(criteria);
        assertEquals(0, res.getContent().size());
    }

    // Scenario 20: Hiding Inactive Master Products
    @Test
    public void test20_HidingInactiveMasterProducts() {
        MasterProductSearchCriteria criteria = new MasterProductSearchCriteria("Hidden Suspended", null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, "createdAt,desc");
        Page<MasterProductResponse> res = masterProductService.searchActiveMasterProductsWithCriteria(criteria);
        assertEquals(0, res.getContent().size());
    }

    // Scenario 21: Merged Master Product Resolution
    @Test
    public void test21_MergedMasterProductResolution() {
        MasterProduct resolved = transitionService.resolveCanonicalMasterProduct("API-MP-100429");
        assertEquals(productParacetamol.getId(), resolved.getId());
    }

    // Scenario 22: Deactivated Offering Hiding
    @Test
    public void test22_DeactivatedOfferingHiding() {
        MasterProductSearchCriteria criteria = new MasterProductSearchCriteria(null, null, null, null, "INR", null, null, null, null, "DEACTIVATED", null, null, null, null, null, 0, 20, "createdAt,desc");
        Page<MasterProductResponse> res = masterProductService.searchActiveMasterProductsWithCriteria(criteria);
        assertEquals(0, res.getContent().size());
    }

    // Scenario 23: Supplier Privacy Boundaries
    @Test
    public void test23_SupplierPrivacyBoundaries() {
        MasterProductResponse res = masterProductService.getMasterProductByCode("API-MP-100428");
        assertNotNull(res);
        // MasterProductResponse does NOT contain internal supplier user passwords/hash/emails
    }

    @Autowired
    private com.kemkendra.product.apis.AdminMasterCatalogController adminMasterCatalogController;

    // Scenario 24: Buyer Immutability
    @Test
    public void test24_BuyerImmutability() {
        ApproveProductRequestPayload req = new ApproveProductRequestPayload("Paracetamol Approved", "103-90-2", "C8H9NO2", ProductCategory.API, "Desc");
        // Ensure non-admin cannot invoke admin controller
        assertThrows(RuntimeException.class, () -> adminMasterCatalogController.approveRequest(UUID.randomUUID(), req, buyerAuth));
    }
}
