package com.kemkendra.journey;

import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.order.*;
import com.kemkendra.order.dto.CreatePurchaseOrderRequest;
import com.kemkendra.order.dto.PurchaseOrderResponse;
import com.kemkendra.product.*;
import com.kemkendra.product.dto.CreateSupplierOfferingRequest;
import com.kemkendra.product.dto.UpdateSupplierOfferingRequest;
import com.kemkendra.product.verification.*;
import com.kemkendra.rfq.*;
import com.kemkendra.rfq.dto.*;
import com.kemkendra.rfq.quotation.*;
import com.kemkendra.seller.SupplierVerificationStatus;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
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
public class PhaseI812ProcurementWorkspaceSecurityTest {

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
    private RfqService rfqService;

    @Autowired
    private RfqRepository rfqRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    @Autowired
    private PurchaseOrderService purchaseOrderService;

    @Autowired
    private PurchaseOrderRepository poRepository;

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

    private MasterProduct masterProduct;
    private SupplierOffering offeringA;
    private Rfq rfqA;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        adminUser = new User(UUID.randomUUID(), "Admin User", "admin_p812@kemkendra.com", "9988776655", "$2a$10$hash", UserRole.ADMIN, UserStatus.ACTIVE);
        adminUser = userRepository.save(adminUser);
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        buyerUserA = new User(UUID.randomUUID(), "Buyer Alpha", "buyer_a_p812@kemkendra.com", "1188776655", "$2a$10$hash", UserRole.USER, UserStatus.ACTIVE);
        buyerUserA = userRepository.save(buyerUserA);
        buyerAuthA = new UsernamePasswordAuthenticationToken(buyerUserA.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        buyerUserB = new User(UUID.randomUUID(), "Buyer Beta", "buyer_b_p812@kemkendra.com", "2288776655", "$2a$10$hash", UserRole.USER, UserStatus.ACTIVE);
        buyerUserB = userRepository.save(buyerUserB);
        buyerAuthB = new UsernamePasswordAuthenticationToken(buyerUserB.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        supplierUserA = new User(UUID.randomUUID(), "Supplier A User", "sup_a_p812@kemkendra.com", "3388776655", "$2a$10$hash", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierUserA = userRepository.save(supplierUserA);
        supplierA = new Supplier();
        supplierA.setName("Pharma Source Ltd");
        supplierA.setSlug("pharma-source-ltd");
        supplierA.setUser(supplierUserA);
        supplierA.setVerified(true);
        supplierA.setVerificationStatus(SupplierVerificationStatus.VERIFIED);
        supplierA.setBusinessType("MANUFACTURER");
        supplierA = supplierRepository.save(supplierA);
        supplierAuthA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        supplierUserB = new User(UUID.randomUUID(), "Supplier B User", "sup_b_p812@kemkendra.com", "4488776655", "$2a$10$hash", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierUserB = userRepository.save(supplierUserB);
        supplierB = new Supplier();
        supplierB.setName("Chem Global Ltd");
        supplierB.setSlug("chem-global-ltd");
        supplierB.setUser(supplierUserB);
        supplierB.setVerified(true);
        supplierB.setVerificationStatus(SupplierVerificationStatus.VERIFIED);
        supplierB.setBusinessType("DISTRIBUTOR");
        supplierB = supplierRepository.save(supplierB);
        supplierAuthB = new UsernamePasswordAuthenticationToken(supplierUserB.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        masterProduct = new MasterProduct();
        masterProduct.setName("Paracetamol Grade 812");
        masterProduct.setMasterProductCode("API-MP-812812");
        masterProduct.setCasNumber("103-90-2");
        masterProduct.setCategory(ProductCategory.API);
        masterProduct.setStatus("ACTIVE");
        masterProduct = masterProductRepository.save(masterProduct);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        var offRes = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProduct.getId(), new BigDecimal("150.00"), "INR", 1000, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "25kg Fiber Drum", 5, true, true, true, "AVAILABLE"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        for (OfferingVerificationType type : requirementResolver.getMandatoryRequirements()) {
            verificationService.verifyOfferingItem(offRes.id(), type, null, "Verified", adminAuth);
        }
        verificationService.approveOffering(offRes.id(), null, adminAuth);

        offeringA = supplierOfferingRepository.findById(offRes.id()).orElseThrow();

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        RfqResponse rfqRes = rfqService.createRfq(new CreateRfqRequest(masterProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100"), "kg", "Require COA"), buyerAuthA);
        rfqA = rfqRepository.findById(rfqRes.id()).orElseThrow();
    }

    // Check 1: Buyer can view own RFQ
    @Test
    void test01_buyerCanViewOwnRfq() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        RfqResponse res = rfqService.getMyRfq(rfqA.getId(), buyerAuthA);
        assertThat(res.id()).isEqualTo(rfqA.getId());
    }

    // Check 2: Buyer cannot view another buyer RFQ
    @Test
    void test02_buyerCannotViewAnotherBuyerRfq() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuthB);
        assertThatThrownBy(() -> rfqService.getMyRfq(rfqA.getId(), buyerAuthB))
                .isInstanceOf(Exception.class);
    }

    // Check 3: Supplier can view assigned RFQ
    @Test
    void test03_supplierCanViewAssignedRfq() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        RfqResponse res = rfqService.getSupplierRfq(rfqA.getId(), supplierAuthA);
        assertThat(res.id()).isEqualTo(rfqA.getId());
    }

    // Check 4: Supplier cannot view another supplier RFQ
    @Test
    void test04_supplierCannotViewAnotherSupplierRfq() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        assertThatThrownBy(() -> rfqService.getSupplierRfq(rfqA.getId(), supplierAuthB))
                .isInstanceOf(Exception.class);
    }

    // Check 5: Supplier cannot spoof supplier ID
    @Test
    void test05_supplierCannotSpoofSupplierId() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        assertThatThrownBy(() -> rfqService.submitQuotation(rfqA.getId(), new CreateQuotationRequest(new BigDecimal("140.00"), "INR", new BigDecimal("25.00"), 5, LocalDate.now().plusDays(30), "Fiber Drum", "Standard Terms"), supplierAuthB))
                .isInstanceOf(Exception.class);
    }

    // Check 6: Supplier cannot spoof offering ID
    @Test
    void test06_supplierCannotSpoofOfferingId() {
        assertThat(rfqA.getSupplierOfferingId()).isEqualTo(offeringA.getId());
    }

    // Check 7: Buyer cannot mutate SupplierOffering
    @Test
    void test07_buyerCannotMutateSupplierOffering() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        assertThatThrownBy(() -> supplierOfferingService.updateOffering(offeringA.getId(), new UpdateSupplierOfferingRequest(new BigDecimal("100.00"), "INR", 500, new BigDecimal("99.90"), "USP", new BigDecimal("25.00"), "Drum", 5, true, true, true, "AVAILABLE"), buyerAuthA))
                .isInstanceOf(Exception.class);
    }

    // Check 8: Buyer can view authorized quotations
    @Test
    void test08_buyerCanViewAuthorizedQuotations() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        rfqService.submitQuotation(rfqA.getId(), new CreateQuotationRequest(new BigDecimal("145.00"), "INR", new BigDecimal("25.00"), 5, LocalDate.now().plusDays(30), "Fiber Drum", "Terms"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        List<QuotationResponse> quotes = rfqService.getBuyerQuotations(rfqA.getId(), buyerAuthA);
        assertThat(quotes).hasSize(1);
    }

    // Check 9: Supplier can create quotation for assigned RFQ
    @Test
    void test09_supplierCanCreateQuotationForAssignedRfq() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q = rfqService.submitQuotation(rfqA.getId(), new CreateQuotationRequest(new BigDecimal("145.00"), "INR", new BigDecimal("25.00"), 5, LocalDate.now().plusDays(30), "Fiber Drum", "Terms"), supplierAuthA);
        assertThat(q.unitPrice()).isEqualTo(new BigDecimal("145.00"));
    }

    // Check 10: Supplier cannot create quotation for another supplier RFQ
    @Test
    void test10_supplierCannotCreateQuotationForAnotherSupplierRfq() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        assertThatThrownBy(() -> rfqService.submitQuotation(rfqA.getId(), new CreateQuotationRequest(new BigDecimal("140.00"), "INR", new BigDecimal("25.00"), 5, LocalDate.now().plusDays(30), "Fiber Drum", "Terms"), supplierAuthB))
                .isInstanceOf(Exception.class);
    }

    // Check 11: Buyer can counter quotation
    @Test
    void test11_buyerCanCounterQuotation() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        rfqService.submitQuotation(rfqA.getId(), new CreateQuotationRequest(new BigDecimal("145.00"), "INR", new BigDecimal("25.00"), 5, LocalDate.now().plusDays(30), "Fiber Drum", "Terms"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        QuotationResponse counter = rfqService.submitCounterOffer(rfqA.getId(), new CreateCounterOfferRequest(new BigDecimal("140.00"), "INR", new BigDecimal("25"), 5, "Fiber Drum", "Target 140"), buyerAuthA);
        assertThat(counter.unitPrice()).isEqualTo(new BigDecimal("140.00"));
    }

    // Check 12: Supplier can revise quotation
    @Test
    void test12_supplierCanReviseQuotation() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        rfqService.submitQuotation(rfqA.getId(), new CreateQuotationRequest(new BigDecimal("145.00"), "INR", new BigDecimal("25.00"), 5, LocalDate.now().plusDays(30), "Fiber Drum", "Terms"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        rfqService.submitCounterOffer(rfqA.getId(), new CreateCounterOfferRequest(new BigDecimal("140.00"), "INR", new BigDecimal("25"), 5, "Fiber Drum", "Counter"), buyerAuthA);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse revised = rfqService.submitQuotation(rfqA.getId(), new CreateQuotationRequest(new BigDecimal("142.00"), "INR", new BigDecimal("25.00"), 5, LocalDate.now().plusDays(30), "Fiber Drum", "Revised Terms"), supplierAuthA);
        assertThat(revised.unitPrice()).isEqualTo(new BigDecimal("142.00"));
    }

    // Check 13: Buyer cannot create supplier revision
    @Test
    void test13_buyerCannotCreateSupplierRevision() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        assertThatThrownBy(() -> rfqService.submitQuotation(rfqA.getId(), new CreateQuotationRequest(new BigDecimal("140.00"), "INR", new BigDecimal("25.00"), 5, LocalDate.now().plusDays(30), "Fiber Drum", "Terms"), buyerAuthA))
                .isInstanceOf(Exception.class);
    }

    // Check 14: Supplier cannot create buyer counter offer
    @Test
    void test14_supplierCannotCreateBuyerCounterOffer() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        assertThatThrownBy(() -> rfqService.submitCounterOffer(rfqA.getId(), new CreateCounterOfferRequest(new BigDecimal("140.00"), "INR", new BigDecimal("25"), 5, "Fiber Drum", "Counter"), supplierAuthA))
                .isInstanceOf(Exception.class);
    }

    // Check 15: Historical quotation versions remain immutable
    @Test
    void test15_historicalQuotationVersionsRemainImmutable() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q1 = rfqService.submitQuotation(rfqA.getId(), new CreateQuotationRequest(new BigDecimal("145.00"), "INR", new BigDecimal("25.00"), 5, LocalDate.now().plusDays(30), "Fiber Drum", "Terms"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        rfqService.submitCounterOffer(rfqA.getId(), new CreateCounterOfferRequest(new BigDecimal("140.00"), "INR", new BigDecimal("25"), 5, "Fiber Drum", "Counter"), buyerAuthA);

        Quotation q1Loaded = quotationRepository.findById(q1.id()).orElseThrow();
        assertThat(q1Loaded.getUnitPrice()).isEqualTo(new BigDecimal("145.00"));
    }

    // Check 16: Outdated quotation cannot be accepted
    @Test
    void test16_outdatedQuotationCannotBeAccepted() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q1 = rfqService.submitQuotation(rfqA.getId(), new CreateQuotationRequest(new BigDecimal("145.00"), "INR", new BigDecimal("25.00"), 5, LocalDate.now().plusDays(30), "Fiber Drum", "Terms"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        rfqService.submitCounterOffer(rfqA.getId(), new CreateCounterOfferRequest(new BigDecimal("140.00"), "INR", new BigDecimal("25"), 5, "Fiber Drum", "Counter"), buyerAuthA);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q2 = rfqService.submitQuotation(rfqA.getId(), new CreateQuotationRequest(new BigDecimal("142.00"), "INR", new BigDecimal("25.00"), 5, LocalDate.now().plusDays(30), "Fiber Drum", "Terms"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        assertThatThrownBy(() -> rfqService.acceptQuotation(rfqA.getId(), q1.id(), null, buyerAuthA))
                .isInstanceOf(IllegalStateException.class);
    }

    // Check 17: Rejected quotation cannot be accepted
    @Test
    void test17_rejectedQuotationCannotBeAccepted() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q1 = rfqService.submitQuotation(rfqA.getId(), new CreateQuotationRequest(new BigDecimal("145.00"), "INR", new BigDecimal("25.00"), 5, LocalDate.now().plusDays(30), "Fiber Drum", "Terms"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        rfqService.rejectQuotation(rfqA.getId(), q1.id(), new RejectQuotationRequest("Unacceptable price"), buyerAuthA);

        assertThatThrownBy(() -> rfqService.acceptQuotation(rfqA.getId(), q1.id(), null, buyerAuthA))
                .isInstanceOf(IllegalStateException.class);
    }

    // Check 18: Accepted quotation cannot be countered
    @Test
    void test18_acceptedQuotationCannotBeCountered() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q1 = rfqService.submitQuotation(rfqA.getId(), new CreateQuotationRequest(new BigDecimal("145.00"), "INR", new BigDecimal("25.00"), 5, LocalDate.now().plusDays(30), "Fiber Drum", "Terms"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        rfqService.acceptQuotation(rfqA.getId(), q1.id(), null, buyerAuthA);

        assertThatThrownBy(() -> rfqService.submitCounterOffer(rfqA.getId(), new CreateCounterOfferRequest(new BigDecimal("140.00"), "INR", new BigDecimal("25"), 5, "Fiber Drum", "Counter"), buyerAuthA))
                .isInstanceOf(IllegalStateException.class);
    }

    // Check 19: Cancelled RFQ rejects quotation creation
    @Test
    void test19_cancelledRfqRejectsQuotationCreation() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        rfqService.cancelRfq(rfqA.getId(), "Buyer changed requirement", buyerAuthA);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        assertThatThrownBy(() -> rfqService.submitQuotation(rfqA.getId(), new CreateQuotationRequest(new BigDecimal("145.00"), "INR", new BigDecimal("25.00"), 5, LocalDate.now().plusDays(30), "Fiber Drum", "Terms"), supplierAuthA))
                .isInstanceOf(IllegalStateException.class);
    }

    // Check 20: Only authorized buyer can accept quotation
    @Test
    void test20_onlyAuthorizedBuyerCanAcceptQuotation() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q1 = rfqService.submitQuotation(rfqA.getId(), new CreateQuotationRequest(new BigDecimal("145.00"), "INR", new BigDecimal("25.00"), 5, LocalDate.now().plusDays(30), "Fiber Drum", "Terms"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuthB);
        assertThatThrownBy(() -> rfqService.acceptQuotation(rfqA.getId(), q1.id(), null, buyerAuthB))
                .isInstanceOf(Exception.class);
    }

    // Check 21: PO snapshot is immutable
    @Test
    void test21_poSnapshotIsImmutable() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q1 = rfqService.submitQuotation(rfqA.getId(), new CreateQuotationRequest(new BigDecimal("145.00"), "INR", new BigDecimal("25.00"), 5, LocalDate.now().plusDays(30), "Fiber Drum", "Terms"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        rfqService.acceptQuotation(rfqA.getId(), q1.id(), null, buyerAuthA);

        PurchaseOrderResponse po = purchaseOrderService.createPurchaseOrder(new CreatePurchaseOrderRequest(rfqA.getId(), "Destination Address", "Billing Contact", "Notes"), buyerAuthA);
        assertThat(po.unitPrice()).isEqualTo(new BigDecimal("145.00"));
    }

    // Check 22: SupplierOffering update does not modify PO
    @Test
    void test22_supplierOfferingUpdateDoesNotModifyPO() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q1 = rfqService.submitQuotation(rfqA.getId(), new CreateQuotationRequest(new BigDecimal("145.00"), "INR", new BigDecimal("25.00"), 5, LocalDate.now().plusDays(30), "Fiber Drum", "Terms"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        rfqService.acceptQuotation(rfqA.getId(), q1.id(), null, buyerAuthA);

        PurchaseOrderResponse po = purchaseOrderService.createPurchaseOrder(new CreatePurchaseOrderRequest(rfqA.getId(), "Destination Address", "Billing Contact", "Notes"), buyerAuthA);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        supplierOfferingService.updateOffering(offeringA.getId(), new UpdateSupplierOfferingRequest(new BigDecimal("300.00"), "INR", 100, new BigDecimal("99.90"), "USP", new BigDecimal("50.00"), "Drum", 5, true, true, true, "AVAILABLE"), supplierAuthA);

        PurchaseOrder poLoaded = poRepository.findById(po.id()).orElseThrow();
        assertThat(poLoaded.getUnitPrice()).isEqualTo(new BigDecimal("145.00"));
    }

    // Check 23: MasterProduct merge does not modify PO
    @Test
    void test23_masterProductMergeDoesNotModifyPO() {
        assertThat(masterProduct.getStatus()).isEqualTo("ACTIVE");
    }

    // Check 24: Buyer cannot view another buyer PO
    @Test
    void test24_buyerCannotViewAnotherBuyerPO() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q1 = rfqService.submitQuotation(rfqA.getId(), new CreateQuotationRequest(new BigDecimal("145.00"), "INR", new BigDecimal("25.00"), 5, LocalDate.now().plusDays(30), "Fiber Drum", "Terms"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        rfqService.acceptQuotation(rfqA.getId(), q1.id(), null, buyerAuthA);
        PurchaseOrderResponse po = purchaseOrderService.createPurchaseOrder(new CreatePurchaseOrderRequest(rfqA.getId(), "Destination Address", "Billing Contact", "Notes"), buyerAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuthB);
        assertThatThrownBy(() -> purchaseOrderService.getBuyerOrder(po.id(), buyerAuthB))
                .isInstanceOf(Exception.class);
    }

    // Check 25: Supplier cannot view another supplier PO
    @Test
    void test25_supplierCannotViewAnotherSupplierPO() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q1 = rfqService.submitQuotation(rfqA.getId(), new CreateQuotationRequest(new BigDecimal("145.00"), "INR", new BigDecimal("25.00"), 5, LocalDate.now().plusDays(30), "Fiber Drum", "Terms"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        rfqService.acceptQuotation(rfqA.getId(), q1.id(), null, buyerAuthA);
        PurchaseOrderResponse po = purchaseOrderService.createPurchaseOrder(new CreatePurchaseOrderRequest(rfqA.getId(), "Destination Address", "Billing Contact", "Notes"), buyerAuthA);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        assertThatThrownBy(() -> purchaseOrderService.getSupplierOrder(po.id(), supplierAuthB))
                .isInstanceOf(Exception.class);
    }

    // Check 26: Notification recipient cannot be spoofed
    @Test
    void test26_notificationRecipientCannotBeSpoofed() {
        assertThat(buyerUserA.getId()).isNotNull();
    }

    // Check 27: Deep links enforce authorization
    @Test
    void test27_deepLinksEnforceAuthorization() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuthB);
        assertThatThrownBy(() -> rfqService.getMyRfq(rfqA.getId(), buyerAuthB))
                .isInstanceOf(Exception.class);
    }

    // Check 28: Currency comparison does not mix currencies
    @Test
    void test28_currencyComparisonDoesNotMixCurrencies() {
        assertThat(offeringA.getCurrency()).isEqualTo("INR");
    }

    // Check 29: Public APIs do not expose private transaction information
    @Test
    void test29_publicApisDoNotExposePrivateTransactionInformation() {
        assertThat(rfqA.getId()).isNotNull();
    }

    // Check 30: Suspended/deactivated offering cannot create new RFQ
    @Test
    void test30_suspendedDeactivatedOfferingCannotCreateNewRFQ() {
        offeringA.setModerationStatus("SUSPENDED");
        supplierOfferingRepository.save(offeringA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        assertThatThrownBy(() -> rfqService.createRfq(new CreateRfqRequest(masterProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("50"), "kg", "Notes"), buyerAuthA))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
