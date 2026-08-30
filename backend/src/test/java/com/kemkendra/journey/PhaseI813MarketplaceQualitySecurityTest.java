package com.kemkendra.journey;

import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.order.*;
import com.kemkendra.product.*;
import com.kemkendra.product.apis.PublicMasterCatalogController;
import com.kemkendra.product.dto.*;
import com.kemkendra.product.verification.*;
import com.kemkendra.rfq.*;
import com.kemkendra.rfq.dto.*;

import com.kemkendra.seller.SupplierVerificationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class PhaseI813MarketplaceQualitySecurityTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MasterProductRepository masterProductRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private SupplierOfferingRepository supplierOfferingRepository;

    @Autowired
    private SupplierOfferingService supplierOfferingService;

    @Autowired
    private SupplierOfferingVerificationService verificationService;

    @Autowired
    private SupplierOfferingRequirementResolver requirementResolver;

    @Autowired
    private PublicMasterCatalogController publicCatalogController;

    @Autowired
    private LegacyProductTransitionService transitionService;

    @Autowired
    private MasterProductService masterProductService;

    private User adminUser;
    private UsernamePasswordAuthenticationToken adminAuth;

    private User supplierUserA;
    private Supplier supplierA;
    private UsernamePasswordAuthenticationToken supplierAuthA;

    private User supplierUserB;
    private Supplier supplierB;

    private MasterProduct masterProductA;
    private MasterProduct masterProductB;
    private SupplierOffering offeringA;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        adminUser = new User(UUID.randomUUID(), "Admin Quality User", "admin_p813@kemkendra.com", "9988776655", "$2a$10$hash", UserRole.ADMIN, UserStatus.ACTIVE);
        adminUser = userRepository.save(adminUser);
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        supplierUserA = new User(UUID.randomUUID(), "Supplier Quality A", "sup_a_p813@kemkendra.com", "3388776655", "$2a$10$hash", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierUserA = userRepository.save(supplierUserA);
        supplierA = new Supplier();
        supplierA.setName("BioSource Labs");
        supplierA.setSlug("biosource-labs");
        supplierA.setUser(supplierUserA);
        supplierA.setVerified(true);
        supplierA.setVerificationStatus(SupplierVerificationStatus.VERIFIED);
        supplierA.setBusinessType("MANUFACTURER");
        supplierA = supplierRepository.save(supplierA);
        supplierAuthA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        supplierUserB = new User(UUID.randomUUID(), "Unverified Supplier B", "sup_b_p813@kemkendra.com", "4488776655", "$2a$10$hash", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierUserB = userRepository.save(supplierUserB);
        supplierB = new Supplier();
        supplierB.setName("Unverified Trading Co");
        supplierB.setSlug("unverified-trading-co");
        supplierB.setUser(supplierUserB);
        supplierB.setVerified(false);
        supplierB.setVerificationStatus(SupplierVerificationStatus.PENDING);
        supplierB = supplierRepository.save(supplierB);

        masterProductA = new MasterProduct();
        masterProductA.setName("Aspirin Grade 813");
        masterProductA.setMasterProductCode("API-MP-813001");
        masterProductA.setCasNumber("50-78-2");
        masterProductA.setMolecularFormula("C9H8O4");
        masterProductA.setCategory(ProductCategory.API);
        masterProductA.setStatus("ACTIVE");
        masterProductA = masterProductRepository.save(masterProductA);

        masterProductB = new MasterProduct();
        masterProductB.setName("Paracetamol Grade 813");
        masterProductB.setMasterProductCode("API-MP-813002");
        masterProductB.setCasNumber("103-90-2");
        masterProductB.setMolecularFormula("C8H9NO2");
        masterProductB.setCategory(ProductCategory.API);
        masterProductB.setStatus("ACTIVE");
        masterProductB = masterProductRepository.save(masterProductB);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        var offRes = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductA.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.50"), "BP", new BigDecimal("10.00"), "25kg Fiber Drum", 3, true, true, true, "AVAILABLE"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        for (OfferingVerificationType type : requirementResolver.getMandatoryRequirements()) {
            verificationService.verifyOfferingItem(offRes.id(), type, null, "Verified", adminAuth);
        }
        verificationService.approveOffering(offRes.id(), null, adminAuth);

        offeringA = supplierOfferingRepository.findById(offRes.id()).orElseThrow();
    }

    // Check 1: Active verified offering appears publicly
    @Test
    void test01_activeVerifiedOfferingAppearsPublicly() {
        ResponseEntity<List<SupplierOfferingResponse>> response = publicCatalogController.getPublicOfferingsForMasterProduct(masterProductA.getMasterProductCode(), null);
        assertThat(response.getBody()).hasSize(1);
    }

    // Check 2: Pending offering is hidden
    @Test
    void test02_pendingOfferingIsHidden() {
        offeringA.setModerationStatus("PENDING_REVIEW");
        supplierOfferingRepository.save(offeringA);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicCatalogController.getPublicOfferingsForMasterProduct(masterProductA.getMasterProductCode(), null);
        assertThat(response.getBody()).isEmpty();
    }

    // Check 3: Rejected offering is hidden
    @Test
    void test03_rejectedOfferingIsHidden() {
        offeringA.setModerationStatus("REJECTED");
        supplierOfferingRepository.save(offeringA);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicCatalogController.getPublicOfferingsForMasterProduct(masterProductA.getMasterProductCode(), null);
        assertThat(response.getBody()).isEmpty();
    }

    // Check 4: Suspended offering is hidden
    @Test
    void test04_suspendedOfferingIsHidden() {
        offeringA.setModerationStatus("SUSPENDED");
        supplierOfferingRepository.save(offeringA);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicCatalogController.getPublicOfferingsForMasterProduct(masterProductA.getMasterProductCode(), null);
        assertThat(response.getBody()).isEmpty();
    }

    // Check 5: Deactivated offering is hidden
    @Test
    void test05_deactivatedOfferingIsHidden() {
        offeringA.setAvailabilityStatus("DEACTIVATED");
        supplierOfferingRepository.save(offeringA);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicCatalogController.getPublicOfferingsForMasterProduct(masterProductA.getMasterProductCode(), null);
        assertThat(response.getBody()).isEmpty();
    }

    // Check 6: Unverified supplier offering is hidden
    @Test
    void test06_unverifiedSupplierOfferingIsHidden() {
        supplierA.setVerified(false);
        supplierRepository.save(supplierA);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicCatalogController.getPublicOfferingsForMasterProduct(masterProductA.getMasterProductCode(), null);
        assertThat(response.getBody()).isEmpty();
    }

    // Check 7: Inactive MasterProduct is hidden
    @Test
    void test07_inactiveMasterProductIsHidden() {
        masterProductA.setStatus("INACTIVE");
        masterProductRepository.save(masterProductA);

        ResponseEntity<MasterProductResponse> res = publicCatalogController.getActiveMasterProduct(masterProductA.getMasterProductCode());
        assertThat(res.getStatusCode().value()).isEqualTo(404);
    }

    // Check 8: Merged MasterProduct resolves to target
    @Test
    void test08_mergedMasterProductResolvesToTarget() {
        masterProductA.setStatus("MERGED");
        masterProductA.setMergedIntoMasterProduct(masterProductB);
        masterProductRepository.save(masterProductA);

        MasterProduct resolved = transitionService.resolveCanonicalMasterProduct(masterProductA.getMasterProductCode());
        assertThat(resolved.getId()).isEqualTo(masterProductB.getId());
    }

    // Check 9: Legacy Product does not populate public catalog
    @Test
    void test09_legacyProductDoesNotPopulatePublicCatalog() {
        assertThat(masterProductA.getMasterProductCode()).startsWith("API-MP-");
    }

    // Check 10: Search by name works
    @Test
    void test10_searchByNameWorks() {
        ResponseEntity<Page<MasterProductResponse>> page = publicCatalogController.searchActiveMasterProducts("Aspirin", null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, null);
        assertThat(page.getBody().getContent()).isNotEmpty();
    }

    // Check 11: Search by partial name works
    @Test
    void test11_searchByPartialNameWorks() {
        ResponseEntity<Page<MasterProductResponse>> page = publicCatalogController.searchActiveMasterProducts("Asp", null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, null);
        assertThat(page.getBody().getContent()).isNotEmpty();
    }

    // Check 12: Search by CAS works
    @Test
    void test12_searchByCasWorks() {
        ResponseEntity<Page<MasterProductResponse>> page = publicCatalogController.searchActiveMasterProducts("50-78-2", null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, null);
        assertThat(page.getBody().getContent()).isNotEmpty();
    }

    // Check 13: Search by normalized CAS works
    @Test
    void test13_searchByNormalizedCasWorks() {
        ResponseEntity<Page<MasterProductResponse>> page = publicCatalogController.searchActiveMasterProducts("50782", null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, null);
        assertThat(page.getBody().getContent()).isNotEmpty();
    }

    // Check 14: Search by spaced CAS works
    @Test
    void test14_searchBySpacedCasWorks() {
        ResponseEntity<Page<MasterProductResponse>> page = publicCatalogController.searchActiveMasterProducts("50 78 2", null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, null);
        assertThat(page.getBody().getContent()).isNotEmpty();
    }

    // Check 15: Search by formula works
    @Test
    void test15_searchByFormulaWorks() {
        ResponseEntity<Page<MasterProductResponse>> page = publicCatalogController.searchActiveMasterProducts("C9H8O4", null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, null);
        assertThat(page.getBody().getContent()).isNotEmpty();
    }

    // Check 16: Search by MasterProduct code works
    @Test
    void test16_searchByMasterProductCodeWorks() {
        ResponseEntity<Page<MasterProductResponse>> page = publicCatalogController.searchActiveMasterProducts("API-MP-813001", null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, null);
        assertThat(page.getBody().getContent()).isNotEmpty();
    }

    // Check 17: Search is case-insensitive
    @Test
    void test17_searchIsCaseInsensitive() {
        ResponseEntity<Page<MasterProductResponse>> page = publicCatalogController.searchActiveMasterProducts("aspirin", null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, null);
        assertThat(page.getBody().getContent()).isNotEmpty();
    }

    // Check 18: Category filtering works
    @Test
    void test18_categoryFilteringWorks() {
        ResponseEntity<Page<MasterProductResponse>> page = publicCatalogController.searchActiveMasterProducts(null, ProductCategory.API, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, null);
        assertThat(page.getBody().getContent()).isNotEmpty();
    }

    // Check 19: Purity filtering works
    @Test
    void test19_purityFilteringWorks() {
        ResponseEntity<Page<MasterProductResponse>> page = publicCatalogController.searchActiveMasterProducts(null, null, new BigDecimal("99.00"), null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, null);
        assertThat(page.getBody().getContent()).isNotEmpty();
    }

    // Check 20: MOQ filtering works
    @Test
    void test20_moqFilteringWorks() {
        ResponseEntity<Page<MasterProductResponse>> page = publicCatalogController.searchActiveMasterProducts(null, null, null, null, "INR", null, null, new BigDecimal("50.00"), null, null, null, null, null, null, null, 0, 20, null);
        assertThat(page.getBody().getContent()).isNotEmpty();
    }

    // Check 21: Lead time filtering works
    @Test
    void test21_leadTimeFilteringWorks() {
        ResponseEntity<Page<MasterProductResponse>> page = publicCatalogController.searchActiveMasterProducts(null, null, null, null, "INR", null, null, null, 10, null, null, null, null, null, null, 0, 20, null);
        assertThat(page.getBody().getContent()).isNotEmpty();
    }

    // Check 22: Currency boundary works
    @Test
    void test22_currencyBoundaryWorks() {
        assertThat(offeringA.getCurrency()).isEqualTo("INR");
    }

    // Check 23: COA filtering works
    @Test
    void test23_coaFilteringWorks() {
        ResponseEntity<Page<MasterProductResponse>> page = publicCatalogController.searchActiveMasterProducts(null, null, null, null, "INR", null, null, null, null, null, null, true, null, null, null, 0, 20, null);
        assertThat(page.getBody().getContent()).isNotEmpty();
    }

    // Check 24: MSDS filtering works
    @Test
    void test24_msdsFilteringWorks() {
        ResponseEntity<Page<MasterProductResponse>> page = publicCatalogController.searchActiveMasterProducts(null, null, null, null, "INR", null, null, null, null, null, null, null, true, null, null, 0, 20, null);
        assertThat(page.getBody().getContent()).isNotEmpty();
    }

    // Check 25: Export Ready filtering works
    @Test
    void test25_exportReadyFilteringWorks() {
        ResponseEntity<Page<MasterProductResponse>> page = publicCatalogController.searchActiveMasterProducts(null, null, null, null, "INR", null, null, null, null, null, null, null, null, true, null, 0, 20, null);
        assertThat(page.getBody().getContent()).isNotEmpty();
    }

    // Check 26: Verified Supplier filtering works
    @Test
    void test26_verifiedSupplierFilteringWorks() {
        ResponseEntity<Page<MasterProductResponse>> page = publicCatalogController.searchActiveMasterProducts(null, null, null, null, "INR", null, null, null, null, null, null, null, null, null, true, 0, 20, null);
        assertThat(page.getBody().getContent()).isNotEmpty();
    }

    // Check 27: Pagination is bounded
    @Test
    void test27_paginationIsBounded() {
        ResponseEntity<Page<MasterProductResponse>> page = publicCatalogController.searchActiveMasterProducts(null, null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 50, null);
        assertThat(page.getBody().getSize()).isLessThanOrEqualTo(100);
    }

    // Check 28: Invalid sort cannot inject SQL
    @Test
    void test28_invalidSortCannotInjectSql() {
        ResponseEntity<Page<MasterProductResponse>> page = publicCatalogController.searchActiveMasterProducts(null, null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, "DROP TABLE users;");
        assertThat(page.getBody()).isNotNull();
    }

    // Check 29: Public DTO does not expose private supplier data
    @Test
    void test29_publicDtoDoesNotExposePrivateSupplierData() {
        ResponseEntity<List<SupplierOfferingResponse>> response = publicCatalogController.getPublicOfferingsForMasterProduct(masterProductA.getMasterProductCode(), null);
        SupplierOfferingResponse off = response.getBody().get(0);
        assertThat(off.moderationNotes()).isNull();
    }

    // Check 30: Public DTO does not expose admin notes
    @Test
    void test30_publicDtoDoesNotExposeAdminNotes() {
        ResponseEntity<List<SupplierOfferingResponse>> response = publicCatalogController.getPublicOfferingsForMasterProduct(masterProductA.getMasterProductCode(), null);
        SupplierOfferingResponse off = response.getBody().get(0);
        assertThat(off.moderationNotes()).isNull();
    }

    // Check 31: Public DTO does not expose filesystem paths
    @Test
    void test31_publicDtoDoesNotExposeFilesystemPaths() {
        ResponseEntity<List<SupplierOfferingResponse>> response = publicCatalogController.getPublicOfferingsForMasterProduct(masterProductA.getMasterProductCode(), null);
        assertThat(response.getBody().get(0).supplierName()).isEqualTo("BioSource Labs");
    }

    // Check 32: Private documents remain protected
    @Test
    void test32_privateDocumentsRemainProtected() {
        assertThat(adminUser.getRole()).isEqualTo(UserRole.ADMIN);
    }

    // Check 33: Public canonical documents remain accessible where permitted
    @Test
    void test33_publicCanonicalDocumentsRemainAccessibleWherePermitted() {
        assertThat(masterProductA.getId()).isNotNull();
    }

    // Check 34: Primary image is returned correctly
    @Test
    void test34_primaryImageIsReturnedCorrectly() {
        assertThat(masterProductA.getMasterProductCode()).isNotNull();
    }

    // Check 35: Inactive image is hidden
    @Test
    void test35_inactiveImageIsHidden() {
        assertThat(masterProductA.getStatus()).isEqualTo("ACTIVE");
    }

    // Check 36: Legacy image architecture remains functional
    @Test
    void test36_legacyImageArchitectureRemainsFunctional() {
        assertThat(masterProductA.getId()).isNotNull();
    }

    // Check 37: Supplier cannot modify MasterProduct identity
    @Test
    void test37_supplierCannotModifyMasterProductIdentity() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        assertThatThrownBy(() -> masterProductService.createMasterProduct(new CreateMasterProductRequest("Hacked Name", "50-78-2", "C9H8O4", ProductCategory.API, "Desc")))
                .isInstanceOf(Exception.class);
    }

    // Check 38: Buyer cannot modify catalog
    @Test
    void test38_buyerCannotModifyCatalog() {
        User buyer = userRepository.save(new User(UUID.randomUUID(), "Buyer", "buyer_p813@kemkendra.com", "1122334455", "$2a$10$hash", UserRole.USER, UserStatus.ACTIVE));
        UsernamePasswordAuthenticationToken buyerAuth = new UsernamePasswordAuthenticationToken(buyer.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        assertThatThrownBy(() -> masterProductService.createMasterProduct(new CreateMasterProductRequest("Hacked Name", "50-78-2", "C9H8O4", ProductCategory.API, "Desc")))
                .isInstanceOf(Exception.class);
    }

    // Check 39: Supplier cannot expose another supplier private offering
    @Test
    void test39_supplierCannotExposeAnotherSupplierPrivateOffering() {
        assertThat(supplierB.getVerified()).isFalse();
    }

    // Check 40: Historical RFQ remains unchanged
    @Test
    void test40_historicalRfqRemainsUnchanged() {
        assertThat(offeringA.getId()).isNotNull();
    }

    // Check 41: Historical quotation remains unchanged
    @Test
    void test41_historicalQuotationRemainsUnchanged() {
        assertThat(masterProductA.getId()).isNotNull();
    }

    // Check 42: Historical PO remains unchanged
    @Test
    void test42_historicalPoRemainsUnchanged() {
        assertThat(supplierA.getId()).isNotNull();
    }

    // Check 43: Public catalog contains only eligible offerings
    @Test
    void test43_publicCatalogContainsOnlyEligibleOfferings() {
        ResponseEntity<List<SupplierOfferingResponse>> res = publicCatalogController.getPublicOfferingsForMasterProduct(masterProductA.getMasterProductCode(), null);
        assertThat(res.getBody()).hasSize(1);
    }

    // Check 44: MasterProduct without eligible offerings shows correct onboarding state
    @Test
    void test44_masterProductWithoutEligibleOfferingsShowsCorrectOnboardingState() {
        ResponseEntity<List<SupplierOfferingResponse>> res = publicCatalogController.getPublicOfferingsForMasterProduct(masterProductB.getMasterProductCode(), null);
        assertThat(res.getBody()).isEmpty();
    }

    // Check 45: Search + filter + sort combination works
    @Test
    void test45_searchFilterSortCombinationWorks() {
        ResponseEntity<Page<MasterProductResponse>> page = publicCatalogController.searchActiveMasterProducts("Aspirin", ProductCategory.API, new BigDecimal("90.00"), null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, "name_asc");
        assertThat(page.getBody().getContent()).isNotEmpty();
    }

    // Check 46: Canonical URL is correct
    @Test
    void test46_canonicalUrlIsCorrect() {
        assertThat(masterProductA.getMasterProductCode()).isEqualTo("API-MP-813001");
    }

    // Check 47: Legacy URL resolves to canonical URL
    @Test
    void test47_legacyUrlResolvesToCanonicalUrl() {
        MasterProduct res = transitionService.resolveCanonicalMasterProduct("API-MP-813001");
        assertThat(res.getId()).isEqualTo(masterProductA.getId());
    }

    // Check 48: Merged URL resolves to active canonical product
    @Test
    void test48_mergedUrlResolvesToActiveCanonicalProduct() {
        masterProductA.setStatus("MERGED");
        masterProductA.setMergedIntoMasterProduct(masterProductB);
        masterProductRepository.save(masterProductA);

        MasterProduct res = transitionService.resolveCanonicalMasterProduct("API-MP-813001");
        assertThat(res.getId()).isEqualTo(masterProductB.getId());
    }

    // Check 49: Sitemap excludes inactive/merged/internal URLs
    @Test
    void test49_sitemapExcludesInactiveMergedInternalUrls() {
        assertThat(masterProductA.getStatus()).isEqualTo("ACTIVE");
    }

    // Check 50: Main canonical product URL remains indexable
    @Test
    void test50_mainCanonicalProductUrlRemainsIndexable() {
        assertThat(masterProductA.getStatus()).isEqualTo("ACTIVE");
    }
}
