package com.kemkendra.product;

import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.product.apis.PublicMasterCatalogController;
import com.kemkendra.product.dto.MasterProductResponse;
import com.kemkendra.seller.SupplierVerificationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class CatalogFilterSecurityTest {

    @Autowired
    private PublicMasterCatalogController publicCatalogController;

    @Autowired
    private MasterProductRepository masterProductRepository;

    @Autowired
    private SupplierOfferingRepository supplierOfferingRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private MasterProduct productA; // API, Paracetamol
    private MasterProduct productB; // LAB_CHEMICAL, Acetone
    private MasterProduct productC; // EXCIPIENT, Microcrystalline Cellulose

    private Supplier verifiedSupplier;
    private Supplier unverifiedSupplier;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        // 1. Create Users & Suppliers
        User userV = new User();
        userV.setId(UUID.randomUUID());
        userV.setEmail("verified-supplier-" + UUID.randomUUID() + "@kemkendra.com");
        userV.setPasswordHash("hash");
        userV.setName("Verified Chem Corp");
        userV.setRole(UserRole.SUPPLIER);
        userRepository.save(userV);

        verifiedSupplier = new Supplier();
        verifiedSupplier.setUser(userV);
        verifiedSupplier.setName("Verified Chem Corp");
        verifiedSupplier.setCountryName("India");
        verifiedSupplier.setCountryCode("IN");
        verifiedSupplier.setVerified(true);
        verifiedSupplier.setVerificationStatus(SupplierVerificationStatus.VERIFIED);
        supplierRepository.save(verifiedSupplier);

        User userU = new User();
        userU.setId(UUID.randomUUID());
        userU.setEmail("unverified-supplier-" + UUID.randomUUID() + "@kemkendra.com");
        userU.setPasswordHash("hash");
        userU.setName("Unverified Traders");
        userU.setRole(UserRole.SUPPLIER);
        userRepository.save(userU);

        unverifiedSupplier = new Supplier();
        unverifiedSupplier.setUser(userU);
        unverifiedSupplier.setName("Unverified Traders");
        unverifiedSupplier.setCountryName("Germany");
        unverifiedSupplier.setCountryCode("DE");
        unverifiedSupplier.setVerified(false);
        unverifiedSupplier.setVerificationStatus(SupplierVerificationStatus.UNDER_REVIEW);
        supplierRepository.save(unverifiedSupplier);

        // 2. Create Master Products
        productA = new MasterProduct();
        productA.setMasterProductCode("MP-API-001");
        productA.setName("Paracetamol IP/USP");
        productA.setCategory(ProductCategory.API);
        productA.setCasNumber("103-90-2");
        productA.setMolecularFormula("C8H9NO2");
        productA.setDescription("High purity analgesic and antipyretic active pharmaceutical ingredient.");
        productA.setStatus("ACTIVE");
        masterProductRepository.save(productA);

        productB = new MasterProduct();
        productB.setMasterProductCode("MP-LAB-002");
        productB.setName("Acetone Analytical Grade");
        productB.setCategory(ProductCategory.LAB_CHEMICAL);
        productB.setCasNumber("67-64-1");
        productB.setMolecularFormula("C3H6O");
        productB.setDescription("High purity organic solvent for chromatography and synthesis.");
        productB.setStatus("ACTIVE");
        masterProductRepository.save(productB);

        productC = new MasterProduct();
        productC.setMasterProductCode("MP-EXC-003");
        productC.setName("Microcrystalline Cellulose");
        productC.setCategory(ProductCategory.EXCIPIENT);
        productC.setCasNumber("9004-34-6");
        productC.setMolecularFormula("(C6H10O5)n");
        productC.setDescription("Direct compression tableting binder and excipient.");
        productC.setStatus("ACTIVE");
        masterProductRepository.save(productC);

        // 3. Create Offerings
        // Offering for Product A (Verified Supplier, 99.5% purity, USP, INR 120, MOQ 25kg, Lead 5 days, In Stock 500, COA, MSDS, Export Ready)
        SupplierOffering offeringA = new SupplierOffering();
        offeringA.setMasterProduct(productA);
        offeringA.setSupplier(verifiedSupplier);
        offeringA.setPrice(new BigDecimal("120.00"));
        offeringA.setCurrency("INR");
        offeringA.setPurity(new BigDecimal("99.50"));
        offeringA.setGrade("USP Grade");
        offeringA.setMoqKg(new BigDecimal("25.00"));
        offeringA.setStock(500);
        offeringA.setLeadTimeDays(5);
        offeringA.setCoaAvailable(true);
        offeringA.setMsdsAvailable(true);
        offeringA.setExportReady(true);
        offeringA.setAvailabilityStatus("AVAILABLE");
        offeringA.setModerationStatus("APPROVED");
        supplierOfferingRepository.save(offeringA);

        // Offering for Product B (Verified Supplier, 95.0% purity, Technical, INR 450, MOQ 100kg, Lead 14 days, In Stock 0, no COA)
        SupplierOffering offeringB = new SupplierOffering();
        offeringB.setMasterProduct(productB);
        offeringB.setSupplier(verifiedSupplier);
        offeringB.setPrice(new BigDecimal("450.00"));
        offeringB.setCurrency("INR");
        offeringB.setPurity(new BigDecimal("95.00"));
        offeringB.setGrade("Technical Grade");
        offeringB.setMoqKg(new BigDecimal("100.00"));
        offeringB.setStock(0);
        offeringB.setLeadTimeDays(14);
        offeringB.setCoaAvailable(false);
        offeringB.setMsdsAvailable(true);
        offeringB.setExportReady(false);
        offeringB.setAvailabilityStatus("AVAILABLE");
        offeringB.setModerationStatus("APPROVED");
        supplierOfferingRepository.save(offeringB);
    }

    @Test
    @DisplayName("1. Search by chemical name returns correct matching products")
    public void testSearchByName() {
        ResponseEntity<Page<MasterProductResponse>> resp = publicCatalogController.searchActiveMasterProducts(
                "Paracetamol", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 20, null);

        assertNotNull(resp.getBody());
        assertEquals(1, resp.getBody().getTotalElements());
        assertEquals("Paracetamol IP/USP", resp.getBody().getContent().get(0).name());
    }

    @Test
    @DisplayName("2. Search by CAS number returns correct matching products")
    public void testSearchByCasNumber() {
        ResponseEntity<Page<MasterProductResponse>> resp = publicCatalogController.searchActiveMasterProducts(
                "67-64-1", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 20, null);

        assertNotNull(resp.getBody());
        assertEquals(1, resp.getBody().getTotalElements());
        assertEquals("Acetone Analytical Grade", resp.getBody().getContent().get(0).name());
    }

    @Test
    @DisplayName("3. Search by Molecular Formula returns correct matching products")
    public void testSearchByMolecularFormula() {
        ResponseEntity<Page<MasterProductResponse>> resp = publicCatalogController.searchActiveMasterProducts(
                "C8H9NO2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 20, null);

        assertNotNull(resp.getBody());
        assertEquals(1, resp.getBody().getTotalElements());
        assertEquals("Paracetamol IP/USP", resp.getBody().getContent().get(0).name());
    }

    @Test
    @DisplayName("4. Category filter restricts strictly to the requested category")
    public void testCategoryFilter() {
        ResponseEntity<Page<MasterProductResponse>> respApi = publicCatalogController.searchActiveMasterProducts(
                null, ProductCategory.API, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 20, null);

        assertNotNull(respApi.getBody());
        assertEquals(1, respApi.getBody().getTotalElements());
        assertEquals(ProductCategory.API, respApi.getBody().getContent().get(0).category());

        ResponseEntity<Page<MasterProductResponse>> respLab = publicCatalogController.searchActiveMasterProducts(
                null, ProductCategory.LAB_CHEMICAL, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 20, null);

        assertNotNull(respLab.getBody());
        assertEquals(1, respLab.getBody().getTotalElements());
        assertEquals(ProductCategory.LAB_CHEMICAL, respLab.getBody().getContent().get(0).category());
    }

    @Test
    @DisplayName("5. Minimum purity filter correctly excludes offerings below the purity threshold")
    public void testMinPurityFilter() {
        // Minimum Purity 98% -> Only Product A (99.5%) should match, Product B (95%) should be excluded
        ResponseEntity<Page<MasterProductResponse>> resp = publicCatalogController.searchActiveMasterProducts(
                null, null, new BigDecimal("98.00"), null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 20, null);

        assertNotNull(resp.getBody());
        assertEquals(1, resp.getBody().getTotalElements());
        assertEquals(productA.getId(), resp.getBody().getContent().get(0).id());
    }

    @Test
    @DisplayName("6. Grade filter matches offering grade substring")
    public void testGradeFilter() {
        ResponseEntity<Page<MasterProductResponse>> resp = publicCatalogController.searchActiveMasterProducts(
                null, null, null, null, "USP", null, null, null, null, null, null, null, null, null, null, null, 0, 20, null);

        assertNotNull(resp.getBody());
        assertEquals(1, resp.getBody().getTotalElements());
        assertEquals(productA.getId(), resp.getBody().getContent().get(0).id());
    }

    @Test
    @DisplayName("7. Max Price filter returns only products with offerings within budget")
    public void testMaxPriceFilter() {
        // Max Price 200 -> Product A is 120 (matches), Product B is 450 (excluded)
        ResponseEntity<Page<MasterProductResponse>> resp = publicCatalogController.searchActiveMasterProducts(
                null, null, null, null, null, "INR", new BigDecimal("200.00"), null, null, null, null, null, null, null, null, null, 0, 20, null);

        assertNotNull(resp.getBody());
        assertEquals(1, resp.getBody().getTotalElements());
        assertEquals(productA.getId(), resp.getBody().getContent().get(0).id());
    }

    @Test
    @DisplayName("8. MOQ filter respects maximum order quantity constraint")
    public void testMaxMoqFilter() {
        // Max MOQ 50kg -> Product A (25kg) matches, Product B (100kg) excluded
        ResponseEntity<Page<MasterProductResponse>> resp = publicCatalogController.searchActiveMasterProducts(
                null, null, null, null, null, null, null, null, new BigDecimal("50.00"), null, null, null, null, null, null, null, 0, 20, null);

        assertNotNull(resp.getBody());
        assertEquals(1, resp.getBody().getTotalElements());
        assertEquals(productA.getId(), resp.getBody().getContent().get(0).id());
    }

    @Test
    @DisplayName("9. In Stock filter excludes products with zero inventory")
    public void testInStockFilter() {
        // In Stock (minStock >= 1) -> Product A (stock 500) matches, Product B (stock 0) excluded
        ResponseEntity<Page<MasterProductResponse>> resp = publicCatalogController.searchActiveMasterProducts(
                null, null, null, null, null, null, null, null, null, null, null, 1, null, null, null, null, 0, 20, null);

        assertNotNull(resp.getBody());
        assertEquals(1, resp.getBody().getTotalElements());
        assertEquals(productA.getId(), resp.getBody().getContent().get(0).id());
    }

    @Test
    @DisplayName("10. Verified Suppliers Only filter returns only offerings from verified sellers")
    public void testVerifiedSuppliersFilter() {
        ResponseEntity<Page<MasterProductResponse>> resp = publicCatalogController.searchActiveMasterProducts(
                null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, true, 0, 20, null);

        assertNotNull(resp.getBody());
        assertEquals(2, resp.getBody().getTotalElements());
    }

    @Test
    @DisplayName("11. Documentation COA filter returns only offerings with attached COA")
    public void testCoaAvailableFilter() {
        ResponseEntity<Page<MasterProductResponse>> resp = publicCatalogController.searchActiveMasterProducts(
                null, null, null, null, null, null, null, null, null, null, null, null, true, null, null, null, 0, 20, null);

        assertNotNull(resp.getBody());
        assertEquals(1, resp.getBody().getTotalElements());
        assertEquals(productA.getId(), resp.getBody().getContent().get(0).id());
    }

    @Test
    @DisplayName("12. Combined multi-criteria filter tests full boolean intersection")
    public void testCombinedMultiFilter() {
        // Category = API + Min Purity = 98 + Verified Supplier = true + In Stock = 1
        ResponseEntity<Page<MasterProductResponse>> resp = publicCatalogController.searchActiveMasterProducts(
                null, ProductCategory.API, new BigDecimal("98.00"), null, "USP", "INR", new BigDecimal("500.00"),
                null, new BigDecimal("50.00"), 7, null, 1, true, true, true, true, 0, 20, "name_asc");

        assertNotNull(resp.getBody());
        assertEquals(1, resp.getBody().getTotalElements());
        assertEquals(productA.getId(), resp.getBody().getContent().get(0).id());

        // Category = EXCIPIENT with verified supplier offering requirement -> 0 results
        ResponseEntity<Page<MasterProductResponse>> respEmpty = publicCatalogController.searchActiveMasterProducts(
                null, ProductCategory.EXCIPIENT, new BigDecimal("98.00"), null, null, null, null,
                null, null, null, null, null, null, null, null, true, 0, 20, null);

        assertNotNull(respEmpty.getBody());
        assertEquals(0, respEmpty.getBody().getTotalElements());
    }

    @Test
    @DisplayName("13. Sorting options correctly orders results")
    public void testSortingOptions() {
        // Name A-Z
        ResponseEntity<Page<MasterProductResponse>> respAsc = publicCatalogController.searchActiveMasterProducts(
                null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 20, "name_asc");
        assertNotNull(respAsc.getBody());
        List<MasterProductResponse> listAsc = respAsc.getBody().getContent();
        assertTrue(listAsc.size() >= 2);
        assertTrue(listAsc.get(0).name().compareToIgnoreCase(listAsc.get(1).name()) <= 0);

        // Name Z-A
        ResponseEntity<Page<MasterProductResponse>> respDesc = publicCatalogController.searchActiveMasterProducts(
                null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 20, "name_desc");
        assertNotNull(respDesc.getBody());
        List<MasterProductResponse> listDesc = respDesc.getBody().getContent();
        assertTrue(listDesc.size() >= 2);
        assertTrue(listDesc.get(0).name().compareToIgnoreCase(listDesc.get(1).name()) >= 0);
    }

    @Test
    @DisplayName("14. New offering created with all compliance options false/unchecked persists false in DB")
    public void testNewOfferingDefaultsToFalse() {
        SupplierOffering offeringNone = new SupplierOffering();
        offeringNone.setMasterProduct(productC);
        offeringNone.setSupplier(verifiedSupplier);
        offeringNone.setPrice(new BigDecimal("95.00"));
        offeringNone.setCurrency("INR");
        offeringNone.setPurity(new BigDecimal("99.00"));
        offeringNone.setGrade("Pharma");
        offeringNone.setMoqKg(new BigDecimal("10.00"));
        offeringNone.setStock(200);
        offeringNone.setLeadTimeDays(3);
        // Explicitly false / unchecked as required by new offering behavior
        offeringNone.setCoaAvailable(false);
        offeringNone.setMsdsAvailable(false);
        offeringNone.setExportReady(false);
        offeringNone.setAvailabilityStatus("AVAILABLE");
        offeringNone.setModerationStatus("APPROVED");
        SupplierOffering saved = supplierOfferingRepository.save(offeringNone);

        SupplierOffering fetched = supplierOfferingRepository.findById(saved.getId()).orElseThrow();
        assertFalse(fetched.getCoaAvailable(), "COA must be false");
        assertFalse(fetched.getMsdsAvailable(), "MSDS must be false");
        assertFalse(fetched.getExportReady(), "Export Ready must be false");
    }

    @Test
    @DisplayName("15. New offering created with COA=true, MSDS=true, ExportReady=false persists exact selection")
    public void testNewOfferingExplicitSelections() {
        SupplierOffering offeringMixed = new SupplierOffering();
        offeringMixed.setMasterProduct(productC);
        offeringMixed.setSupplier(verifiedSupplier);
        offeringMixed.setPrice(new BigDecimal("110.00"));
        offeringMixed.setCurrency("INR");
        offeringMixed.setPurity(new BigDecimal("99.80"));
        offeringMixed.setGrade("Pharma");
        offeringMixed.setMoqKg(new BigDecimal("50.00"));
        offeringMixed.setStock(500);
        offeringMixed.setLeadTimeDays(7);
        // Explicit supplier selections: COA=true, MSDS=true, ExportReady=false
        offeringMixed.setCoaAvailable(true);
        offeringMixed.setMsdsAvailable(true);
        offeringMixed.setExportReady(false);
        offeringMixed.setAvailabilityStatus("AVAILABLE");
        offeringMixed.setModerationStatus("APPROVED");
        SupplierOffering saved = supplierOfferingRepository.save(offeringMixed);

        SupplierOffering fetched = supplierOfferingRepository.findById(saved.getId()).orElseThrow();
        assertTrue(fetched.getCoaAvailable(), "COA must be true");
        assertTrue(fetched.getMsdsAvailable(), "MSDS must be true");
        assertFalse(fetched.getExportReady(), "Export Ready must be false");
    }
}
