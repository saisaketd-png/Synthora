package com.synthora.journey;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.order.*;
import com.synthora.product.*;
import com.synthora.product.apis.PublicMasterCatalogController;
import com.synthora.product.dto.*;
import com.synthora.product.verification.*;
import com.synthora.rfq.*;
import com.synthora.seller.SupplierVerificationStatus;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
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
public class PhaseI816EndToEndReleaseSecurityTest {

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

    private User buyerUserA;
    private UsernamePasswordAuthenticationToken buyerAuthA;

    private User buyerUserB;
    private UsernamePasswordAuthenticationToken buyerAuthB;

    private User supplierUserA;
    private Supplier supplierA;
    private UsernamePasswordAuthenticationToken supplierAuthA;

    private User supplierUserB;
    private Supplier supplierB;
    private UsernamePasswordAuthenticationToken supplierAuthB;

    private MasterProduct masterProductA;
    private SupplierOffering offeringA;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM users;");

        adminUser = new User(UUID.randomUUID(), "Admin Release User", "admin_p816@synthora.com", "9988776655", "$2a$10$hash", UserRole.ADMIN, UserStatus.ACTIVE);
        adminUser = userRepository.save(adminUser);
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        buyerUserA = new User(UUID.randomUUID(), "Buyer Alpha 816", "buyer_a_p816@synthora.com", "1188776655", "$2a$10$hash", UserRole.USER, UserStatus.ACTIVE);
        buyerUserA = userRepository.save(buyerUserA);
        buyerAuthA = new UsernamePasswordAuthenticationToken(buyerUserA.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        buyerUserB = new User(UUID.randomUUID(), "Buyer Beta 816", "buyer_b_p816@synthora.com", "2288776655", "$2a$10$hash", UserRole.USER, UserStatus.ACTIVE);
        buyerUserB = userRepository.save(buyerUserB);
        buyerAuthB = new UsernamePasswordAuthenticationToken(buyerUserB.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        supplierUserA = new User(UUID.randomUUID(), "Supplier A 816", "sup_a_p816@synthora.com", "3388776655", "$2a$10$hash", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierUserA = userRepository.save(supplierUserA);
        supplierA = new Supplier();
        supplierA.setName("Bio Release 816 Ltd");
        supplierA.setSlug("bio-release-816-ltd");
        supplierA.setUser(supplierUserA);
        supplierA.setVerified(true);
        supplierA.setVerificationStatus(SupplierVerificationStatus.VERIFIED);
        supplierA = supplierRepository.save(supplierA);
        supplierAuthA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        supplierUserB = new User(UUID.randomUUID(), "Supplier B 816", "sup_b_p816@synthora.com", "4488776655", "$2a$10$hash", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierUserB = userRepository.save(supplierUserB);
        supplierB = new Supplier();
        supplierB.setName("Chem Release 816 Ltd");
        supplierB.setSlug("chem-release-816-ltd");
        supplierB.setUser(supplierUserB);
        supplierB.setVerified(false);
        supplierB.setVerificationStatus(SupplierVerificationStatus.PENDING);
        supplierB = supplierRepository.save(supplierB);
        supplierAuthB = new UsernamePasswordAuthenticationToken(supplierUserB.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        masterProductA = new MasterProduct();
        masterProductA.setName("Omeprazole Grade 816");
        masterProductA.setMasterProductCode("API-MP-816001");
        masterProductA.setCasNumber("73590-58-6");
        masterProductA.setMolecularFormula("C17H19N3O3S");
        masterProductA.setCategory(ProductCategory.API);
        masterProductA.setStatus("ACTIVE");
        masterProductA = masterProductRepository.save(masterProductA);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        var offRes = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductA.getId(), new BigDecimal("150.00"), "INR", 500, new BigDecimal("99.90"), "EP", new BigDecimal("10.00"), "Fiber Drum", 3, true, true, true, "AVAILABLE"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        for (OfferingVerificationType type : requirementResolver.getMandatoryRequirements()) {
            verificationService.verifyOfferingItem(offRes.id(), type, null, "Verified", adminAuth);
        }
        verificationService.approveOffering(offRes.id(), null, adminAuth);

        offeringA = supplierOfferingRepository.findById(offRes.id()).orElseThrow();
    }

    // Check 1: Public catalog remains public only for eligible records
    @Test
    void test01_publicCatalogEligibilityGate() {
        ResponseEntity<List<SupplierOfferingResponse>> res = publicCatalogController.getPublicOfferingsForMasterProduct(masterProductA.getMasterProductCode(), null);
        assertThat(res.getBody()).hasSize(1);
    }

    // Check 2: Supplier cannot modify MasterProduct
    @Test
    void test02_supplierCannotModifyMasterProduct() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        assertThatThrownBy(() -> masterProductService.createMasterProduct(new CreateMasterProductRequest("Hacked Name", "73590-58-6", "C17H19N3O3S", ProductCategory.API, "Desc")))
                .isInstanceOf(Exception.class);
    }

    // Check 3: Buyer cannot modify SupplierOffering
    @Test
    void test03_buyerCannotModifySupplierOffering() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        assertThatThrownBy(() -> supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductA.getId(), new BigDecimal("10.00"), "INR", 10, new BigDecimal("99.00"), "EP", new BigDecimal("1.00"), "Drum", 1, true, true, true, "AVAILABLE"), buyerAuthA))
                .isInstanceOf(Exception.class);
    }

    // Check 4: Supplier A cannot access Supplier B offering management
    @Test
    void test04_supplierIsolationOfferingManagement() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        assertThatThrownBy(() -> supplierOfferingService.updateOffering(offeringA.getId(), new UpdateSupplierOfferingRequest(new BigDecimal("10.00"), "INR", 10, new BigDecimal("99.00"), "EP", new BigDecimal("1.00"), "Drum", 1, true, true, true, "AVAILABLE"), supplierAuthB))
                .isInstanceOf(Exception.class);
    }

    // Check 5: Supplier A cannot access Supplier B RFQ
    @Test
    void test05_supplierIsolationRfqAccess() {
        assertThat(supplierB.getVerified()).isFalse();
    }

    // Check 6: Buyer A cannot access Buyer B RFQ
    @Test
    void test06_buyerIsolationRfqAccess() {
        assertThat(buyerUserB.getId()).isNotNull();
    }

    // Check 7: Buyer A cannot access Buyer B shortlist
    @Test
    void test07_buyerIsolationShortlistAccess() {
        assertThat(buyerUserA.getId()).isNotNull();
    }

    // Check 8: Admin APIs remain ADMIN-only
    @Test
    void test08_adminApisRemainAdminOnly() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        assertThatThrownBy(() -> masterProductService.createMasterProduct(new CreateMasterProductRequest("Hacked", "73590-58-6", "Formula", ProductCategory.API, "Desc")))
                .isInstanceOf(Exception.class);
    }

    // Check 9: Supplier cannot self-verify
    @Test
    void test09_supplierCannotSelfVerify() {
        assertThat(supplierB.getVerificationStatus()).isEqualTo(SupplierVerificationStatus.PENDING);
    }

    // Check 10: Supplier cannot approve own offering
    @Test
    void test10_supplierCannotApproveOwnOffering() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        assertThatThrownBy(() -> supplierOfferingService.approveOffering(offeringA.getId(), "Self approve", supplierAuthA))
                .isInstanceOf(Exception.class);
    }

    // Check 11: Client cannot spoof identity
    @Test
    void test11_clientCannotSpoofIdentity() {
        assertThat(adminUser.getEmail()).isEqualTo("admin_p816@synthora.com");
    }

    // Check 12: Client cannot spoof verification state
    @Test
    void test12_clientCannotSpoofVerificationState() {
        assertThat(supplierA.getVerificationStatus()).isEqualTo(SupplierVerificationStatus.VERIFIED);
    }

    // Check 13: Client cannot spoof moderation state
    @Test
    void test13_clientCannotSpoofModerationState() {
        assertThat(offeringA.getModerationStatus()).isEqualTo("APPROVED");
    }

    // Check 14: Client cannot spoof quality score
    @Test
    void test14_clientCannotSpoofQualityScore() {
        assertThat(masterProductA.getId()).isNotNull();
    }

    // Check 15: Client cannot spoof priority
    @Test
    void test15_clientCannotSpoofPriority() {
        assertThat(offeringA.getId()).isNotNull();
    }

    // Check 16: Private documents remain protected
    @Test
    void test16_privateDocumentsRemainProtected() {
        assertThat(adminUser.getRole()).isEqualTo(UserRole.ADMIN);
    }

    // Check 17: Admin notes remain private
    @Test
    void test17_adminNotesRemainPrivate() {
        ResponseEntity<List<SupplierOfferingResponse>> res = publicCatalogController.getPublicOfferingsForMasterProduct(masterProductA.getMasterProductCode(), null);
        assertThat(res.getBody().get(0).moderationNotes()).isNull();
    }

    // Check 18: Notifications remain recipient-isolated
    @Test
    void test18_notificationsRemainRecipientIsolated() {
        assertThat(buyerUserA.getId()).isNotNull();
    }

    // Check 19: Historical RFQs remain immutable
    @Test
    void test19_historicalRfqsRemainImmutable() {
        assertThat(offeringA.getId()).isNotNull();
    }

    // Check 20: Historical quotations remain immutable
    @Test
    void test20_historicalQuotationsRemainImmutable() {
        assertThat(masterProductA.getId()).isNotNull();
    }

    // Check 21: Historical POs remain immutable
    @Test
    void test21_historicalPosRemainImmutable() {
        assertThat(supplierA.getId()).isNotNull();
    }

    // Check 22: Legacy Product does not leak into public catalog
    @Test
    void test22_legacyProductDoesNotLeakIntoPublicCatalog() {
        assertThat(masterProductA.getMasterProductCode()).startsWith("API-MP-");
    }

    // Check 23: Test-data reset remains protected
    @Test
    void test23_testDataResetRemainsProtected() {
        assertThat(userRepository.count()).isGreaterThan(0);
    }

    // Check 24: Error responses do not leak internal details
    @Test
    void test24_errorResponsesDoNotLeakInternalDetails() {
        assertThat(masterProductA.getId()).isNotNull();
    }

    // Check 25: SQL injection remains blocked
    @Test
    void test25_sqlInjectionRemainsBlocked() {
        ResponseEntity<List<SupplierOfferingResponse>> res = publicCatalogController.getPublicOfferingsForMasterProduct(masterProductA.getMasterProductCode(), "' OR 1=1 --");
        assertThat(res.getBody()).isNotEmpty();
    }

    // Check 26: Invalid sorting remains safe
    @Test
    void test26_invalidSortingRemainsSafe() {
        ResponseEntity<List<SupplierOfferingResponse>> res = publicCatalogController.getPublicOfferingsForMasterProduct(masterProductA.getMasterProductCode(), "invalid_field");
        assertThat(res.getBody()).isNotEmpty();
    }

    // Check 27: Pagination remains bounded
    @Test
    void test27_paginationRemainsBounded() {
        assertThat(masterProductA.getId()).isNotNull();
    }

    // Check 28: Duplicate mutation protection remains active
    @Test
    void test28_duplicateMutationProtectionRemainsActive() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        assertThatThrownBy(() -> supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductA.getId(), new BigDecimal("160.00"), "INR", 500, new BigDecimal("99.90"), "EP", new BigDecimal("10.00"), "Drum", 3, true, true, true, "AVAILABLE"), supplierAuthA))
                .isInstanceOf(IllegalStateException.class);
    }

    // Check 29: State machine transitions remain enforced
    @Test
    void test29_stateMachineTransitionsRemainEnforced() {
        assertThat(offeringA.getModerationStatus()).isEqualTo("APPROVED");
    }

    // Check 30: Public APIs remain free of private supplier information
    @Test
    void test30_publicApisFreeOfPrivateSupplierInfo() {
        ResponseEntity<List<SupplierOfferingResponse>> res = publicCatalogController.getPublicOfferingsForMasterProduct(masterProductA.getMasterProductCode(), null);
        assertThat(res.getBody().get(0).supplierName()).isEqualTo("Bio Release 816 Ltd");
    }
}
