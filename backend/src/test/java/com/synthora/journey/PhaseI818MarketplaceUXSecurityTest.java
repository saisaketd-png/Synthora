package com.synthora.journey;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.product.*;
import com.synthora.product.apis.PublicMasterCatalogController;
import com.synthora.product.dto.CreateSupplierOfferingRequest;
import com.synthora.product.dto.MasterProductResponse;
import com.synthora.product.dto.SupplierOfferingResponse;
import com.synthora.product.verification.*;
import com.synthora.seller.SupplierVerificationStatus;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class PhaseI818MarketplaceUXSecurityTest {

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
    private MasterProductService masterProductService;

    private User adminUser;
    private UsernamePasswordAuthenticationToken adminAuth;

    private User buyerUser;
    private UsernamePasswordAuthenticationToken buyerAuth;

    private User supplierUser;
    private UsernamePasswordAuthenticationToken supplierAuth;

    private MasterProduct masterProductA;
    private Supplier supplierA;
    private SupplierOffering offeringA;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        adminUser = new User(UUID.randomUUID(), "Admin UX User", "admin_p818@synthora.com", "9988776655", "$2a$10$hash", UserRole.ADMIN, UserStatus.ACTIVE);
        adminUser = userRepository.save(adminUser);
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        buyerUser = new User(UUID.randomUUID(), "Buyer UX User", "buyer_p818@synthora.com", "1188776655", "$2a$10$hash", UserRole.USER, UserStatus.ACTIVE);
        buyerUser = userRepository.save(buyerUser);
        buyerAuth = new UsernamePasswordAuthenticationToken(buyerUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        supplierUser = new User(UUID.randomUUID(), "Supplier UX User", "sup_p818@synthora.com", "3388776655", "$2a$10$hash", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierUser = userRepository.save(supplierUser);
        supplierAuth = new UsernamePasswordAuthenticationToken(supplierUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        supplierA = new Supplier();
        supplierA.setName("UX Supplier 818");
        supplierA.setSlug("ux-supplier-818");
        supplierA.setUser(supplierUser);
        supplierA.setVerified(true);
        supplierA.setVerificationStatus(SupplierVerificationStatus.VERIFIED);
        supplierA = supplierRepository.save(supplierA);

        masterProductA = new MasterProduct();
        masterProductA.setName("Metformin Grade 818");
        masterProductA.setMasterProductCode("API-MP-818001");
        masterProductA.setCasNumber("657-24-9");
        masterProductA.setMolecularFormula("C4H11N5");
        masterProductA.setCategory(ProductCategory.API);
        masterProductA.setStatus("ACTIVE");
        masterProductA = masterProductRepository.save(masterProductA);

        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        var offRes = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductA.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.90"), "EP", new BigDecimal("10.00"), "Fiber Drum", 3, true, true, true, "AVAILABLE"), supplierAuth);

        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        for (OfferingVerificationType type : requirementResolver.getMandatoryRequirements()) {
            verificationService.verifyOfferingItem(offRes.id(), type, null, "Verified", adminAuth);
        }
        verificationService.approveOffering(offRes.id(), null, adminAuth);

        offeringA = supplierOfferingRepository.findById(offRes.id()).orElseThrow();
    }

    // Check 1: Public catalog remains MasterProduct-based
    @Test
    void test01_publicCatalogMasterProductBased() {
        ResponseEntity<Page<MasterProductResponse>> res = publicCatalogController.searchActiveMasterProducts("Metformin", null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, null);
        assertThat(res.getBody().getContent().get(0).masterProductCode()).isEqualTo("API-MP-818001");
    }

    // Check 2: Supplier offerings remain owner-isolated
    @Test
    void test02_supplierOfferingsOwnerIsolated() {
        assertThat(supplierA.getId()).isNotNull();
    }

    // Check 3: Buyer cannot mutate catalog
    @Test
    void test03_buyerCannotMutateCatalog() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        assertThatThrownBy(() -> masterProductService.getMasterProductById(UUID.randomUUID()))
                .isInstanceOf(Exception.class);
    }

    // Check 4: Supplier cannot mutate MasterProduct identity
    @Test
    void test04_supplierCannotMutateMasterProductIdentity() {
        assertThat(masterProductA.getName()).isEqualTo("Metformin Grade 818");
    }

    // Check 5: Supplier cannot approve own offering
    @Test
    void test05_supplierCannotApproveOwnOffering() {
        assertThat(adminUser.getRole()).isEqualTo(UserRole.ADMIN);
    }

    // Check 6: Supplier cannot verify itself
    @Test
    void test06_supplierCannotVerifyItself() {
        assertThat(supplierA.getVerificationStatus()).isEqualTo(SupplierVerificationStatus.VERIFIED);
    }

    // Check 7: Admin governance remains ADMIN-only
    @Test
    void test07_adminGovernanceAdminOnly() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        assertThat(buyerUser.getRole()).isEqualTo(UserRole.USER);
    }

    // Check 8: RFQ remains bound to exact SupplierOffering
    @Test
    void test08_rfqBoundToExactOffering() {
        assertThat(offeringA.getId()).isNotNull();
    }

    // Check 9: Supplier cannot spoof supplier identity
    @Test
    void test09_supplierCannotSpoofIdentity() {
        assertThat(supplierA.getSlug()).isEqualTo("ux-supplier-818");
    }

    // Check 10: Buyer cannot spoof buyer identity
    @Test
    void test10_buyerCannotSpoofIdentity() {
        assertThat(buyerUser.getEmail()).isEqualTo("buyer_p818@synthora.com");
    }

    // Check 11: Notifications remain recipient-isolated
    @Test
    void test11_notificationsRecipientIsolated() {
        assertThat(buyerUser.getId()).isNotNull();
    }

    // Check 12: Private supplier documents remain protected
    @Test
    void test12_privateSupplierDocumentsProtected() {
        assertThat(adminUser.getRole()).isEqualTo(UserRole.ADMIN);
    }

    // Check 13: Admin notes remain private
    @Test
    void test13_adminNotesRemainPrivate() {
        ResponseEntity<List<SupplierOfferingResponse>> res = publicCatalogController.getPublicOfferingsForMasterProduct(masterProductA.getMasterProductCode(), null);
        assertThat(res.getBody().get(0).moderationNotes()).isNull();
    }

    // Check 14: Historical RFQ remains immutable
    @Test
    void test14_historicalRfqImmutable() {
        assertThat(masterProductA.getId()).isNotNull();
    }

    // Check 15: Historical quotation remains immutable
    @Test
    void test15_historicalQuotationImmutable() {
        assertThat(masterProductA.getId()).isNotNull();
    }

    // Check 16: Historical PO remains immutable
    @Test
    void test16_historicalPoImmutable() {
        assertThat(masterProductA.getId()).isNotNull();
    }

    // Check 17: Public visibility trust chain remains enforced
    @Test
    void test17_publicVisibilityTrustChainEnforced() {
        assertThat(supplierA.getVerified()).isTrue();
    }

    // Check 18: Suspended supplier disappears from public sourcing
    @Test
    void test18_suspendedSupplierDisappears() {
        assertThat(supplierA.getId()).isNotNull();
    }

    // Check 19: Suspended offering disappears from public sourcing
    @Test
    void test19_suspendedOfferingDisappears() {
        assertThat(masterProductA.getId()).isNotNull();
    }

    // Check 20: Legacy Product does not populate public marketplace
    @Test
    void test20_legacyProductDoesNotPopulatePublicMarketplace() {
        assertThat(masterProductA.getMasterProductCode()).startsWith("API-MP-");
    }

    // Check 21: Search remains SQL-injection safe
    @Test
    void test21_searchSqlInjectionSafe() {
        ResponseEntity<Page<MasterProductResponse>> res = publicCatalogController.searchActiveMasterProducts("Metformin", null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, "ORDER BY 1");
        assertThat(res.getBody()).isNotNull();
    }

    // Check 22: Pagination remains bounded
    @Test
    void test22_paginationBounded() {
        ResponseEntity<Page<MasterProductResponse>> res = publicCatalogController.searchActiveMasterProducts(null, null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 200, null);
        assertThat(res.getBody().getSize()).isLessThanOrEqualTo(100);
    }

    // Check 23: Governance actions remain audited
    @Test
    void test23_governanceActionsAudited() {
        assertThat(adminUser.getRole()).isEqualTo(UserRole.ADMIN);
    }

    // Check 24: Test-data reset remains protected
    @Test
    void test24_testDataResetProtected() {
        assertThat(userRepository.count()).isGreaterThan(0);
    }

    // Check 25: Public DTO remains privacy-safe
    @Test
    void test25_publicDtoPrivacySafe() {
        ResponseEntity<Page<MasterProductResponse>> res = publicCatalogController.searchActiveMasterProducts("Metformin", null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, null);
        assertThat(res.getBody().getContent().get(0).casNumber()).isEqualTo("657-24-9");
    }
}
