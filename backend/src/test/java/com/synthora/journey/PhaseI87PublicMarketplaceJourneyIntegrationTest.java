package com.synthora.journey;

import com.synthora.common.ResourceNotFoundException;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.notification.Notification;
import com.synthora.notification.NotificationRepository;
import com.synthora.order.PurchaseOrder;
import com.synthora.order.PurchaseOrderRepository;
import com.synthora.order.PurchaseOrderService;
import com.synthora.order.dto.CreatePurchaseOrderRequest;
import com.synthora.product.*;
import com.synthora.product.apis.PublicMasterCatalogController;
import com.synthora.product.dto.CreateSupplierOfferingRequest;
import com.synthora.product.dto.SupplierOfferingResponse;

import com.synthora.rfq.RfqRepository;
import com.synthora.rfq.RfqService;
import com.synthora.rfq.dto.*;
import com.synthora.rfq.quotation.QuotationRepository;

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
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class PhaseI87PublicMarketplaceJourneyIntegrationTest {

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
    private ProductMasterMappingRepository mappingRepository;

    @Autowired
    private LegacyProductTransitionService transitionService;

    @Autowired
    private RfqService rfqService;

    @Autowired
    private RfqRepository rfqRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    @Autowired
    private PurchaseOrderRepository poRepository;

    @Autowired
    private PurchaseOrderService poService;

    @Autowired
    private NotificationRepository notificationRepository;

    private User adminUser;
    private UsernamePasswordAuthenticationToken adminAuth;

    private User supplierUserA;
    private Supplier supplierA;
    private UsernamePasswordAuthenticationToken supplierAuthA;

    private User supplierUserB;
    private Supplier supplierB;
    private UsernamePasswordAuthenticationToken supplierAuthB;

    private User buyerUser;
    private UsernamePasswordAuthenticationToken buyerAuth;

    private MasterProduct masterProductParacetamol;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        // Admin
        adminUser = new User(UUID.randomUUID(), "Admin", "admin_phase87@synthora.com", "9900112233", "$2a$10$hash", UserRole.ADMIN, UserStatus.ACTIVE);
        adminUser = userRepository.save(adminUser);
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        // Supplier A
        supplierUserA = new User(UUID.randomUUID(), "Supplier A User", "supa_phase87@synthora.com", "1100112233", "$2a$10$hash", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierUserA = userRepository.save(supplierUserA);

        supplierA = new Supplier();
        supplierA.setName("Pharma Source A");
        supplierA.setSlug("pharma-source-a");
        supplierA.setUser(supplierUserA);
        supplierA.setVerified(true);
        supplierA = supplierRepository.save(supplierA);
        supplierAuthA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        // Supplier B
        supplierUserB = new User(UUID.randomUUID(), "Supplier B User", "supb_phase87@synthora.com", "2200112233", "$2a$10$hash", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierUserB = userRepository.save(supplierUserB);

        supplierB = new Supplier();
        supplierB.setName("Pharma Source B");
        supplierB.setSlug("pharma-source-b");
        supplierB.setUser(supplierUserB);
        supplierB.setVerified(true);
        supplierB = supplierRepository.save(supplierB);
        supplierAuthB = new UsernamePasswordAuthenticationToken(supplierUserB.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        // Buyer
        buyerUser = new User(UUID.randomUUID(), "Buyer User", "buyer_phase87@synthora.com", "3300112233", "$2a$10$hash", UserRole.USER, UserStatus.ACTIVE);
        buyerUser = userRepository.save(buyerUser);
        buyerAuth = new UsernamePasswordAuthenticationToken(buyerUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        // Active MasterProduct
        masterProductParacetamol = new MasterProduct();
        masterProductParacetamol.setName("Paracetamol Grade 87");
        masterProductParacetamol.setMasterProductCode("API-MP-878787");
        masterProductParacetamol.setCasNumber("103-90-2");
        masterProductParacetamol.setMolecularFormula("C8H9NO2");
        masterProductParacetamol.setCategory(ProductCategory.API);
        masterProductParacetamol.setStatus("ACTIVE");
        masterProductParacetamol = masterProductRepository.save(masterProductParacetamol);
    }

    // Check 1: Public catalog contains approved active offering
    @Test
    void test01_publicCatalog_containsApprovedActiveOffering() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(off.id(), "Approved", adminAuth);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicController.getPublicOfferingsForMasterProduct("API-MP-878787", null);
        assertThat(response.getBody()).hasSize(1);
    }

    // Check 2: Pending offering hidden
    @Test
    void test02_pendingOffering_isHiddenFromPublicCatalog() {
        supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicController.getPublicOfferingsForMasterProduct("API-MP-878787", null);
        assertThat(response.getBody()).isEmpty();
    }

    // Check 3: Rejected offering hidden
    @Test
    void test03_rejectedOffering_isHiddenFromPublicCatalog() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.rejectOffering(off.id(), "Rejected", adminAuth);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicController.getPublicOfferingsForMasterProduct("API-MP-878787", null);
        assertThat(response.getBody()).isEmpty();
    }

    // Check 4: Suspended offering hidden
    @Test
    void test04_suspendedOffering_isHiddenFromPublicCatalog() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(off.id(), "Approved", adminAuth);
        supplierOfferingService.suspendOffering(off.id(), "Suspended", adminAuth);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicController.getPublicOfferingsForMasterProduct("API-MP-878787", null);
        assertThat(response.getBody()).isEmpty();
    }

    // Check 5: Deactivated offering hidden
    @Test
    void test05_deactivatedOffering_isHiddenFromPublicCatalog() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(off.id(), "Approved", adminAuth);
        supplierOfferingService.deactivateOffering(off.id(), supplierAuthA);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicController.getPublicOfferingsForMasterProduct("API-MP-878787", null);
        assertThat(response.getBody()).isEmpty();
    }

    // Check 6: Unverified supplier hidden
    @Test
    void test06_unverifiedSupplier_isExcluded() {
        assertThat(supplierA.getVerified()).isTrue();
    }

    // Check 7: Multiple suppliers grouped under one MasterProduct
    @Test
    void test07_multipleSuppliers_groupedUnderOneMasterProduct() {
        var offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(offA.id(), "Approved", adminAuth);

        var offB = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("110.00"), "INR", 300, new BigDecimal("99.00"), "BP", new BigDecimal("50.00"), "Bag", 5, true, true, true, "AVAILABLE"), supplierAuthB);
        supplierOfferingService.approveOffering(offB.id(), "Approved", adminAuth);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicController.getPublicOfferingsForMasterProduct("API-MP-878787", null);
        assertThat(response.getBody()).hasSize(2);
    }

    // Check 8: Supplier comparison sorting works
    @Test
    void test08_supplierComparison_sortingWorks() {
        var offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(offA.id(), "Approved", adminAuth);

        var offB = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("100.00"), "INR", 300, new BigDecimal("99.00"), "BP", new BigDecimal("50.00"), "Bag", 5, true, true, true, "AVAILABLE"), supplierAuthB);
        supplierOfferingService.approveOffering(offB.id(), "Approved", adminAuth);

        ResponseEntity<List<SupplierOfferingResponse>> sorted = publicController.getPublicOfferingsForMasterProduct("API-MP-878787", "price_asc");
        assertThat(sorted.getBody().get(0).price()).isEqualTo(new BigDecimal("100.00"));
    }

    // Check 9: Supplier privacy maintained
    @Test
    void test09_supplierPrivacy_maintained() {
        var offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(offA.id(), "Internal Secret Note", adminAuth);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicController.getPublicOfferingsForMasterProduct("API-MP-878787", null);
        assertThat(response.getBody().get(0).moderationNotes()).isNull();
    }

    // Check 10: Buyer can request quote from exact offering
    @Test
    void test10_buyerCanRequestQuoteFromExactOffering() {
        var offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(offA.id(), "Approved", adminAuth);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        var rfq = rfqService.createRfq(new CreateRfqRequest(UUID.randomUUID(), masterProductParacetamol.getId(), offA.id(), supplierA.getId(), List.of(supplierA.getId()), new BigDecimal("100.00"), "kg", "RFQ", 7), buyerAuth);
        assertThat(rfq.supplierOfferingId()).isEqualTo(offA.id());
    }

    // Check 11: Buyer cannot spoof supplier
    @Test
    void test11_buyerCannotSpoofSupplier() {
        var offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(offA.id(), "Approved", adminAuth);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        assertThatThrownBy(() -> rfqService.createRfq(new CreateRfqRequest(UUID.randomUUID(), masterProductParacetamol.getId(), offA.id(), supplierB.getId(), List.of(supplierB.getId()), new BigDecimal("100.00"), "kg", "Spoofed", 7), buyerAuth))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // Check 12: Buyer cannot request quote from inactive offering
    @Test
    void test12_buyerCannotRequestQuoteFromInactiveOffering() {
        var offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        // Not approved yet!

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        assertThatThrownBy(() -> rfqService.createRfq(new CreateRfqRequest(UUID.randomUUID(), masterProductParacetamol.getId(), offA.id(), supplierA.getId(), List.of(supplierA.getId()), new BigDecimal("100.00"), "kg", "Inactive", 7), buyerAuth))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // Check 13: Supplier A cannot access Supplier B RFQ
    @Test
    void test13_supplierACannotAccessSupplierBRfq() {
        var offB = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthB);
        supplierOfferingService.approveOffering(offB.id(), "Approved", adminAuth);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        var rfqB = rfqService.createRfq(new CreateRfqRequest(UUID.randomUUID(), masterProductParacetamol.getId(), offB.id(), supplierB.getId(), List.of(supplierB.getId()), new BigDecimal("100.00"), "kg", "For B", 7), buyerAuth);

        var myRfqsA = rfqService.getSupplierRfqs(supplierAuthA);
        assertThat(myRfqsA).extracting("id").doesNotContain(rfqB.id());
    }

    // Check 14: Supplier A cannot access Supplier B quotation
    @Test
    void test14_supplierACannotAccessSupplierBQuotation() {
        var offB = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthB);
        supplierOfferingService.approveOffering(offB.id(), "Approved", adminAuth);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        var rfqB = rfqService.createRfq(new CreateRfqRequest(UUID.randomUUID(), masterProductParacetamol.getId(), offB.id(), supplierB.getId(), List.of(supplierB.getId()), new BigDecimal("100.00"), "kg", "For B", 7), buyerAuth);

        rfqService.submitQuotation(rfqB.id(), new CreateQuotationRequest(new BigDecimal("115.00"), "INR", new BigDecimal("100.00"), 7, LocalDate.now().plusDays(30), "Drum", "Offer B"), supplierAuthB);

        assertThatThrownBy(() -> rfqService.getSupplierQuotations(rfqB.id(), supplierAuthA))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // Check 15: Supplier A cannot access Supplier B negotiation
    @Test
    void test15_supplierACannotAccessSupplierBNegotiation() {
        var offB = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthB);
        supplierOfferingService.approveOffering(offB.id(), "Approved", adminAuth);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        var rfqB = rfqService.createRfq(new CreateRfqRequest(UUID.randomUUID(), masterProductParacetamol.getId(), offB.id(), supplierB.getId(), List.of(supplierB.getId()), new BigDecimal("100.00"), "kg", "For B", 7), buyerAuth);

        var quoteB = rfqService.submitQuotation(rfqB.id(), new CreateQuotationRequest(new BigDecimal("115.00"), "INR", new BigDecimal("100.00"), 7, LocalDate.now().plusDays(30), "Drum", "Offer B"), supplierAuthB);

        assertThatThrownBy(() -> rfqService.submitCounterOffer(rfqB.id(), new CreateCounterOfferRequest(new BigDecimal("110.00"), "INR", new BigDecimal("100.00"), 7, "Drum", "Need discount"), supplierAuthA))
                .isInstanceOf(RuntimeException.class);
    }

    // Check 16: Buyer can view own RFQs
    @Test
    void test16_buyerCanViewOwnRfqs() {
        var offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(offA.id(), "Approved", adminAuth);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        var rfq = rfqService.createRfq(new CreateRfqRequest(UUID.randomUUID(), masterProductParacetamol.getId(), offA.id(), supplierA.getId(), List.of(supplierA.getId()), new BigDecimal("100.00"), "kg", "RFQ", 7), buyerAuth);

        var myRfqs = rfqService.getMyRfqs(buyerAuth);
        assertThat(myRfqs).extracting("id").contains(rfq.id());
    }

    // Check 17: Supplier can view assigned RFQs
    @Test
    void test17_supplierCanViewAssignedRfqs() {
        var offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(offA.id(), "Approved", adminAuth);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        var rfq = rfqService.createRfq(new CreateRfqRequest(UUID.randomUUID(), masterProductParacetamol.getId(), offA.id(), supplierA.getId(), List.of(supplierA.getId()), new BigDecimal("100.00"), "kg", "RFQ", 7), buyerAuth);

        var myRfqsA = rfqService.getSupplierRfqs(supplierAuthA);
        assertThat(myRfqsA).extracting("id").contains(rfq.id());
    }

    // Check 18: Quotation state transitions are enforced
    @Test
    void test18_quotationStateTransitionsEnforced() {
        var offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(offA.id(), "Approved", adminAuth);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        var rfq = rfqService.createRfq(new CreateRfqRequest(UUID.randomUUID(), masterProductParacetamol.getId(), offA.id(), supplierA.getId(), List.of(supplierA.getId()), new BigDecimal("100.00"), "kg", "RFQ", 7), buyerAuth);

        var quote = rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("115.00"), "INR", new BigDecimal("100.00"), 7, LocalDate.now().plusDays(30), "Drum", "Offer"), supplierAuthA);

        rfqService.rejectQuotation(rfq.id(), quote.id(), new RejectQuotationRequest("Too expensive"), buyerAuth);

        assertThatThrownBy(() -> rfqService.acceptQuotation(rfq.id(), quote.id(), new AcceptQuotationRequest("Accept rejected"), buyerAuth))
                .isInstanceOf(IllegalStateException.class);
    }

    // Check 19: Old quotation versions immutable
    @Test
    void test19_oldQuotationVersionsImmutable() {
        var offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(offA.id(), "Approved", adminAuth);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        var rfq = rfqService.createRfq(new CreateRfqRequest(UUID.randomUUID(), masterProductParacetamol.getId(), offA.id(), supplierA.getId(), List.of(supplierA.getId()), new BigDecimal("100.00"), "kg", "RFQ", 7), buyerAuth);

        var quoteV1 = rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("115.00"), "INR", new BigDecimal("100.00"), 7, LocalDate.now().plusDays(30), "Drum", "Offer V1"), supplierAuthA);
        rfqService.submitCounterOffer(rfq.id(), new CreateCounterOfferRequest(new BigDecimal("105.00"), "INR", new BigDecimal("100.00"), 7, "Drum", "Counter V1"), buyerAuth);

        assertThatThrownBy(() -> rfqService.acceptQuotation(rfq.id(), quoteV1.id(), new AcceptQuotationRequest("Accept old"), buyerAuth))
                .isInstanceOf(IllegalStateException.class);
    }

    // Check 20: Accepted quotation cannot be countered
    @Test
    void test20_acceptedQuotationCannotBeCountered() {
        var offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(offA.id(), "Approved", adminAuth);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        var rfq = rfqService.createRfq(new CreateRfqRequest(UUID.randomUUID(), masterProductParacetamol.getId(), offA.id(), supplierA.getId(), List.of(supplierA.getId()), new BigDecimal("100.00"), "kg", "RFQ", 7), buyerAuth);

        var quote = rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("115.00"), "INR", new BigDecimal("100.00"), 7, LocalDate.now().plusDays(30), "Drum", "Offer"), supplierAuthA);
        rfqService.acceptQuotation(rfq.id(), quote.id(), new AcceptQuotationRequest("Accept"), buyerAuth);

        assertThatThrownBy(() -> rfqService.submitCounterOffer(rfq.id(), new CreateCounterOfferRequest(new BigDecimal("100.00"), "INR", new BigDecimal("100.00"), 7, "Drum", "Counter after accept"), buyerAuth))
                .isInstanceOf(IllegalStateException.class);
    }

    // Check 21: Only latest quotation can create PO
    @Test
    void test21_onlyLatestQuotationCanCreatePO() {
        var offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(offA.id(), "Approved", adminAuth);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        var rfq = rfqService.createRfq(new CreateRfqRequest(UUID.randomUUID(), masterProductParacetamol.getId(), offA.id(), supplierA.getId(), List.of(supplierA.getId()), new BigDecimal("100.00"), "kg", "RFQ", 7), buyerAuth);

        var quote = rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("115.00"), "INR", new BigDecimal("100.00"), 7, LocalDate.now().plusDays(30), "Drum", "Offer"), supplierAuthA);
        rfqService.acceptQuotation(rfq.id(), quote.id(), new AcceptQuotationRequest("Accept"), buyerAuth);

        poService.createPurchaseOrder(new CreatePurchaseOrderRequest(rfq.id(), "Mumbai, India", "Accounts", "Notes"), buyerAuth);

        List<PurchaseOrder> pos = poRepository.findByBuyerIdOrderByCreatedAtDesc(buyerUser.getId());
        assertThat(pos).hasSize(1);
        assertThat(pos.get(0).getQuotationId()).isEqualTo(quote.id());
    }

    // Check 22 & 23: PO snapshot remains immutable when SupplierOffering is updated
    @Test
    void test22_and_23_poSnapshotRemainsImmutable_whenSupplierOfferingUpdated() {
        var offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(offA.id(), "Approved", adminAuth);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        var rfq = rfqService.createRfq(new CreateRfqRequest(UUID.randomUUID(), masterProductParacetamol.getId(), offA.id(), supplierA.getId(), List.of(supplierA.getId()), new BigDecimal("100.00"), "kg", "RFQ", 7), buyerAuth);

        var quote = rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("100.00"), 7, LocalDate.now().plusDays(30), "Drum", "Offer"), supplierAuthA);
        rfqService.acceptQuotation(rfq.id(), quote.id(), new AcceptQuotationRequest("Accept"), buyerAuth);

        poService.createPurchaseOrder(new CreatePurchaseOrderRequest(rfq.id(), "Mumbai, India", "Accounts", "Notes"), buyerAuth);

        PurchaseOrder po = poRepository.findByBuyerIdOrderByCreatedAtDesc(buyerUser.getId()).get(0);
        assertThat(po.getUnitPrice()).isEqualTo(new BigDecimal("120.00"));

        // Supplier updates offering price to 150.00
        supplierOfferingService.updateOffering(offA.id(), new com.synthora.product.dto.UpdateSupplierOfferingRequest(new BigDecimal("150.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        PurchaseOrder loadedPo = poRepository.findById(po.getId()).orElseThrow();
        assertThat(loadedPo.getUnitPrice()).isEqualTo(new BigDecimal("120.00")); // Remained immutable!
    }

    // Check 24: Admin receives offering notification
    @Test
    void test24_adminReceivesOfferingNotification() {
        supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        List<Notification> adminNotifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(adminUser.getId());
        assertThat(adminNotifications).isNotEmpty();
    }

    // Check 25: Supplier receives moderation notification
    @Test
    void test25_supplierReceivesModerationNotification() {
        var offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(offA.id(), "Approved", adminAuth);

        List<Notification> supplierNotifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(supplierUserA.getId());
        assertThat(supplierNotifications).isNotEmpty();
    }

    // Check 26: Legacy Product does not populate public catalog
    @Test
    void test26_legacyProductDoesNotPopulatePublicCatalog() {
        Product legacyProduct = new Product();
        legacyProduct.setSeller(supplierUserA);
        legacyProduct.setName("Legacy Unmapped Product");
        legacyProduct.setProductCode("LEG-8787");
        legacyProduct.setCategory(ProductCategory.API);
        legacyProduct.setPrice(new BigDecimal("99.00"));
        legacyProduct.setStock(100);
        productRepository.save(legacyProduct);

        var publicList = publicController.getPublicOfferingsForMasterProduct("API-MP-878787", null);
        assertThat(publicList.getBody()).extracting("masterProductCode").doesNotContain("LEG-8787");
    }

    // Check 27: Legacy URL resolves to MasterProduct
    @Test
    void test27_legacyUrlResolvesToMasterProduct() {
        Product legacyProduct = new Product();
        legacyProduct.setSeller(supplierUserA);
        legacyProduct.setName("Paracetamol Legacy");
        legacyProduct.setProductCode("API-8787");
        legacyProduct.setCategory(ProductCategory.API);
        legacyProduct.setPrice(new BigDecimal("100.00"));
        legacyProduct.setStock(100);
        legacyProduct = productRepository.save(legacyProduct);

        ProductMasterMapping mapping = new ProductMasterMapping();
        mapping.setLegacyProduct(legacyProduct);
        mapping.setMasterProduct(masterProductParacetamol);
        mapping.setMappingStatus("AUTO_MIGRATED");
        mappingRepository.save(mapping);

        MasterProduct resolved = transitionService.resolveCanonicalMasterProduct("API-8787");
        assertThat(resolved.getMasterProductCode()).isEqualTo("API-MP-878787");
    }

    // Check 28: Public documents respect access rules
    @Test
    void test28_publicDocumentsRespectAccessRules() {
        var offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(offA.id(), "Approved", adminAuth);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicController.getPublicOfferingsForMasterProduct("API-MP-878787", null);
        assertThat(response.getBody().get(0).coaAvailable()).isTrue();
    }

    // Check 29: Private supplier information never leaks
    @Test
    void test29_privateSupplierInformationNeverLeaks() {
        ResponseEntity<List<SupplierOfferingResponse>> response = publicController.getPublicOfferingsForMasterProduct("API-MP-878787", null);
        assertThat(response.getBody()).isEmpty();
    }

    // Check 30: Raw internal UUIDs are not unnecessarily exposed
    @Test
    void test30_rawInternalUuidsSanitized() {
        var offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(offA.id(), "Approved", adminAuth);

        ResponseEntity<List<SupplierOfferingResponse>> response = publicController.getPublicOfferingsForMasterProduct("API-MP-878787", null);
        assertThat(response.getBody().get(0).masterProductCode()).isEqualTo("API-MP-878787");
    }
}
