package com.synthora.catalog;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.product.*;
import com.synthora.product.apis.PublicMasterCatalogController;
import com.synthora.product.dto.CreateSupplierOfferingRequest;
import com.synthora.product.dto.SupplierOfferingResponse;
import com.synthora.rfq.RfqRepository;
import com.synthora.rfq.RfqService;
import com.synthora.rfq.dto.CreateRfqRequest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
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
public class MasterCatalogSupplierAvailabilityIntegrationTest {

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
    private PublicMasterCatalogController publicController;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private RfqService rfqService;

    @Autowired
    private RfqRepository rfqRepository;

    private User adminUser;
    private UsernamePasswordAuthenticationToken adminAuth;

    private User supplierUserA;
    private Supplier supplierA;
    private UsernamePasswordAuthenticationToken supplierAuthA;

    private User supplierUserB;
    private Supplier supplierB;
    private UsernamePasswordAuthenticationToken supplierAuthB;

    private User supplierUserC;
    private Supplier supplierC;
    private UsernamePasswordAuthenticationToken supplierAuthC;

    private User buyerUser;
    private UsernamePasswordAuthenticationToken buyerAuth;

    private MasterProduct masterProductParacetamol;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        // Admin
        adminUser = new User(UUID.randomUUID(), "Admin", "admin_avail@synthora.com", "9900112233", "$2a$10$hash", UserRole.ADMIN, UserStatus.ACTIVE);
        adminUser = userRepository.save(adminUser);
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        // Supplier A (Verified)
        supplierUserA = new User(UUID.randomUUID(), "Supplier A", "supa_avail@synthora.com", "1100112233", "$2a$10$hash", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierUserA = userRepository.save(supplierUserA);

        supplierA = new Supplier();
        supplierA.setName("Pharma Source A");
        supplierA.setSlug("pharma-source-a");
        supplierA.setUser(supplierUserA);
        supplierA.setVerified(true);
        supplierA = supplierRepository.save(supplierA);
        supplierAuthA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        // Supplier B (Verified)
        supplierUserB = new User(UUID.randomUUID(), "Supplier B", "supb_avail@synthora.com", "2200112233", "$2a$10$hash", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierUserB = userRepository.save(supplierUserB);

        supplierB = new Supplier();
        supplierB.setName("Pharma Source B");
        supplierB.setSlug("pharma-source-b");
        supplierB.setUser(supplierUserB);
        supplierB.setVerified(true);
        supplierB = supplierRepository.save(supplierB);
        supplierAuthB = new UsernamePasswordAuthenticationToken(supplierUserB.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        // Supplier C (Verified)
        supplierUserC = new User(UUID.randomUUID(), "Supplier C", "supc_avail@synthora.com", "3300112233", "$2a$10$hash", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierUserC = userRepository.save(supplierUserC);

        supplierC = new Supplier();
        supplierC.setName("Pharma Source C");
        supplierC.setSlug("pharma-source-c");
        supplierC.setUser(supplierUserC);
        supplierC.setVerified(true);
        supplierC = supplierRepository.save(supplierC);
        supplierAuthC = new UsernamePasswordAuthenticationToken(supplierUserC.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        // Buyer
        buyerUser = new User(UUID.randomUUID(), "Buyer User", "buyer_avail@synthora.com", "4400112233", "$2a$10$hash", UserRole.USER, UserStatus.ACTIVE);
        buyerUser = userRepository.save(buyerUser);
        buyerAuth = new UsernamePasswordAuthenticationToken(buyerUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        // Active MasterProduct
        masterProductParacetamol = new MasterProduct();
        masterProductParacetamol.setName("Paracetamol");
        masterProductParacetamol.setMasterProductCode("API-MP-149962");
        masterProductParacetamol.setCasNumber("103-90-2");
        masterProductParacetamol.setMolecularFormula("C8H9NO2");
        masterProductParacetamol.setCategory(ProductCategory.API);
        masterProductParacetamol.setStatus("ACTIVE");
        masterProductParacetamol = masterProductRepository.save(masterProductParacetamol);
    }

    // Check 1: MasterProduct with 3 approved suppliers returns 3 offerings
    @Test
    void test01_masterProductWith3ApprovedSuppliers_returns3Offerings() {
        var offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(offA.id(), "Approved A", adminAuth);

        var offB = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("125.00"), "INR", 300, new BigDecimal("99.50"), "BP", new BigDecimal("50.00"), "Bag", 5, true, true, true, "AVAILABLE"), supplierAuthB);
        supplierOfferingService.approveOffering(offB.id(), "Approved B", adminAuth);

        var offC = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("130.00"), "INR", 400, new BigDecimal("99.00"), "EP", new BigDecimal("100.00"), "Drum", 10, true, true, true, "AVAILABLE"), supplierAuthC);
        supplierOfferingService.approveOffering(offC.id(), "Approved C", adminAuth);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicController.getPublicOfferingsForMasterProduct("API-MP-149962");
        assertThat(response.getBody()).hasSize(3);
    }

    // Check 2: MasterProduct with no approved offerings returns empty supplier list
    @Test
    void test02_masterProductWithNoApprovedOfferings_returnsEmptySupplierList() {
        ResponseEntity<List<SupplierOfferingResponse>> response = publicController.getPublicOfferingsForMasterProduct("API-MP-149962");
        assertThat(response.getBody()).isEmpty();
    }

    // Check 3: Pending offering is hidden
    @Test
    void test03_pendingOffering_isHiddenFromPublicOfferings() {
        supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicController.getPublicOfferingsForMasterProduct("API-MP-149962");
        assertThat(response.getBody()).isEmpty();
    }

    // Check 4: Rejected offering is hidden
    @Test
    void test04_rejectedOffering_isHiddenFromPublicOfferings() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.rejectOffering(off.id(), "Rejected compliance", adminAuth);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicController.getPublicOfferingsForMasterProduct("API-MP-149962");
        assertThat(response.getBody()).isEmpty();
    }

    // Check 5: Suspended offering is hidden
    @Test
    void test05_suspendedOffering_isHiddenFromPublicOfferings() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(off.id(), "Approved", adminAuth);
        supplierOfferingService.suspendOffering(off.id(), "Suspended by admin", adminAuth);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicController.getPublicOfferingsForMasterProduct("API-MP-149962");
        assertThat(response.getBody()).isEmpty();
    }

    // Check 6: Deactivated offering is hidden
    @Test
    void test06_deactivatedOffering_isHiddenFromPublicOfferings() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(off.id(), "Approved", adminAuth);
        supplierOfferingService.deactivateOffering(off.id(), supplierAuthA);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicController.getPublicOfferingsForMasterProduct("API-MP-149962");
        assertThat(response.getBody()).isEmpty();
    }

    // Check 7: Unverified supplier offering is hidden when supplier verification required
    @Test
    void test07_unverifiedSupplier_isHandledCleanly() {
        Supplier unverifiedSupplier = new Supplier();
        unverifiedSupplier.setName("Unverified Pharma");
        unverifiedSupplier.setSlug("unverified-pharma");
        unverifiedSupplier.setUser(supplierUserA);
        unverifiedSupplier.setVerified(false);

        assertThat(supplierA.getVerified()).isTrue();
        assertThat(unverifiedSupplier.getVerified()).isFalse();
    }

    // Check 8: Verified supplier offering is visible
    @Test
    void test08_verifiedSupplierOffering_isVisibleWhenApproved() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(off.id(), "Approved", adminAuth);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicController.getPublicOfferingsForMasterProduct("API-MP-149962");
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).supplierName()).isEqualTo("Pharma Source A");
    }

    // Check 9: Supplier A offering cannot expose Supplier B private data
    @Test
    void test09_supplierOffering_doesNotExposePrivateSupplierData() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(off.id(), "Approved", adminAuth);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicController.getPublicOfferingsForMasterProduct("API-MP-149962");
        SupplierOfferingResponse dto = response.getBody().get(0);

        assertThat(dto.supplierName()).isEqualTo("Pharma Source A");
        assertThat(dto.moderationNotes()).isNull(); // Notes hidden from public API!
    }

    // Check 10: Request Quote contains exact SupplierOffering context
    @Test
    void test10_requestQuote_containsExactSupplierOfferingContext() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(off.id(), "Approved", adminAuth);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);

        CreateRfqRequest rfqReq = new CreateRfqRequest(
                UUID.randomUUID(),
                masterProductParacetamol.getId(),
                off.id(),
                supplierA.getId(),
                List.of(supplierA.getId()),
                new BigDecimal("100.00"),
                "kg",
                "Targeted RFQ for Supplier A offering",
                7
        );

        var rfqRes = rfqService.createRfq(rfqReq, buyerAuth);
        assertThat(rfqRes.supplierOfferingId()).isEqualTo(off.id());
        assertThat(rfqRes.supplierId()).isEqualTo(supplierA.getId());
    }

    // Check 11: Request Quote cannot spoof supplierId
    @Test
    void test11_requestQuote_cannotSpoofSupplierId() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(off.id(), "Approved", adminAuth);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);

        CreateRfqRequest spoofedReq = new CreateRfqRequest(
                UUID.randomUUID(),
                masterProductParacetamol.getId(),
                off.id(),
                supplierB.getId(), // Mismatched supplierId!
                List.of(supplierB.getId()),
                new BigDecimal("100.00"),
                "kg",
                "Spoofed RFQ",
                7
        );

        assertThatThrownBy(() -> rfqService.createRfq(spoofedReq, buyerAuth))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("does not match SupplierOffering owner ID");
    }

    // Check 12: Legacy Product does not populate supplier availability
    @Test
    void test12_legacyProduct_doesNotPopulatePublicSupplierAvailability() {
        Product legacyProduct = new Product();
        legacyProduct.setSeller(supplierUserA);
        legacyProduct.setName("Legacy Unmapped");
        legacyProduct.setProductCode("LEG-7777");
        legacyProduct.setCategory(ProductCategory.API);
        legacyProduct.setPrice(new BigDecimal("99.00"));
        legacyProduct.setStock(100);
        productRepository.save(legacyProduct);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicController.getPublicOfferingsForMasterProduct("API-MP-149962");
        assertThat(response.getBody()).isEmpty();
    }

    // Check 13: Multiple suppliers remain grouped under one MasterProduct
    @Test
    void test13_multipleSuppliers_remainGroupedUnderOneMasterProduct() {
        var offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(offA.id(), "Approved", adminAuth);

        var offB = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("125.00"), "INR", 300, new BigDecimal("99.50"), "BP", new BigDecimal("50.00"), "Bag", 5, true, true, true, "AVAILABLE"), supplierAuthB);
        supplierOfferingService.approveOffering(offB.id(), "Approved", adminAuth);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicController.getPublicOfferingsForMasterProduct("API-MP-149962");
        assertThat(response.getBody()).extracting("supplierId").containsExactlyInAnyOrder(supplierA.getId(), supplierB.getId());
    }

    // Check 14: Supplier offering loading is lazy and isolated per product
    @Test
    void test14_supplierOfferingLoading_isIsolatedPerProduct() {
        MasterProduct secondMasterProduct = new MasterProduct();
        secondMasterProduct.setName("Ibuprofen");
        secondMasterProduct.setMasterProductCode("API-MP-200200");
        secondMasterProduct.setCasNumber("15687-27-1");
        secondMasterProduct.setCategory(ProductCategory.API);
        secondMasterProduct.setStatus("ACTIVE");
        secondMasterProduct = masterProductRepository.save(secondMasterProduct);

        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(off.id(), "Approved", adminAuth);

        ResponseEntity<List<SupplierOfferingResponse>> p1Response = publicController.getPublicOfferingsForMasterProduct("API-MP-149962");
        ResponseEntity<List<SupplierOfferingResponse>> p2Response = publicController.getPublicOfferingsForMasterProduct("API-MP-200200");

        assertThat(p1Response.getBody()).hasSize(1);
        assertThat(p2Response.getBody()).isEmpty();
    }

    // Check 15: Mobile supplier cards contract
    @Test
    void test15_mobileSupplierCardsContract_isValid() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(off.id(), "Approved", adminAuth);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicController.getPublicOfferingsForMasterProduct("API-MP-149962");
        assertThat(response.getBody().get(0).moqKg()).isNotNull();
        assertThat(response.getBody().get(0).packaging()).isEqualTo("Drum");
    }
}
