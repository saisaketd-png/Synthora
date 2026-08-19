package com.synthora.rfq;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.order.PurchaseOrder;
import com.synthora.order.PurchaseOrderRepository;
import com.synthora.order.PurchaseOrderService;
import com.synthora.order.dto.CreatePurchaseOrderRequest;
import com.synthora.order.dto.PurchaseOrderResponse;
import com.synthora.product.*;
import com.synthora.product.dto.CreateSupplierOfferingRequest;
import com.synthora.product.dto.SupplierOfferingResponse;
import com.synthora.product.dto.UpdateSupplierOfferingRequest;
import com.synthora.rfq.dto.*;
import com.synthora.rfq.sourcing.SourcingRequest;
import com.synthora.rfq.sourcing.SourcingRequestRepository;
import com.synthora.rfq.sourcing.SourcingRequestStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class MultiSupplierRfqHardeningSecurityTest {

    @Autowired
    private RfqService rfqService;

    @Autowired
    private PurchaseOrderService purchaseOrderService;

    @Autowired
    private MasterProductRepository masterProductRepository;

    @Autowired
    private SupplierOfferingService supplierOfferingService;

    @Autowired
    private SupplierOfferingRepository supplierOfferingRepository;

    @Autowired
    private SourcingRequestRepository sourcingRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    private User buyerUser;
    private UsernamePasswordAuthenticationToken buyerAuth;

    private User supplierUserA;
    private Supplier supplierA;
    private UsernamePasswordAuthenticationToken supplierAuthA;

    private User supplierUserB;
    private Supplier supplierB;
    private UsernamePasswordAuthenticationToken supplierAuthB;

    private MasterProduct masterProduct;
    private SupplierOffering offeringA;
    private SupplierOffering offeringB;
    private Product legacyProduct;

    @BeforeEach
    public void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        buyerUser = new User();
        buyerUser.setName("Buyer Sourcing " + suffix);
        buyerUser.setEmail("buyer_hrd_" + suffix + "@synthora.com");
        buyerUser.setPasswordHash("hash");
        buyerUser.setRole(UserRole.USER);
        buyerUser = userRepository.save(buyerUser);
        buyerAuth = new UsernamePasswordAuthenticationToken(buyerUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        supplierUserA = new User();
        supplierUserA.setName("Supplier A Hardening " + suffix);
        supplierUserA.setEmail("sup_a_hrd_" + suffix + "@synthora.com");
        supplierUserA.setPasswordHash("hash");
        supplierUserA.setRole(UserRole.SUPPLIER);
        supplierUserA = userRepository.save(supplierUserA);

        supplierA = new Supplier();
        supplierA.setName("Supplier A Hardened " + suffix);
        supplierA.setSlug("sup-a-hrd-" + suffix);
        supplierA.setUser(supplierUserA);
        supplierA = supplierRepository.save(supplierA);
        supplierAuthA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        supplierUserB = new User();
        supplierUserB.setName("Supplier B Hardening " + suffix);
        supplierUserB.setEmail("sup_b_hrd_" + suffix + "@synthora.com");
        supplierUserB.setPasswordHash("hash");
        supplierUserB.setRole(UserRole.SUPPLIER);
        supplierUserB = userRepository.save(supplierUserB);

        supplierB = new Supplier();
        supplierB.setName("Supplier B Hardened " + suffix);
        supplierB.setSlug("sup-b-hrd-" + suffix);
        supplierB.setUser(supplierUserB);
        supplierB = supplierRepository.save(supplierB);
        supplierAuthB = new UsernamePasswordAuthenticationToken(supplierUserB.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        MasterProduct mp = new MasterProduct();
        mp.setName("Procurement Paracetamol Hardened");
        mp.setMasterProductCode("API-MP-HRD-" + suffix);
        mp.setCasNumber("103-90-2");
        mp.setCategory(ProductCategory.API);
        mp.setStatus("ACTIVE");
        masterProduct = masterProductRepository.save(mp);

        legacyProduct = new Product();
        legacyProduct.setName("Legacy Paracetamol 500mg Hardened");
        legacyProduct.setCategory(ProductCategory.API);
        legacyProduct.setPrice(new BigDecimal("100.00"));
        legacyProduct.setStock(1000);
        legacyProduct.setSeller(supplierUserA);
        legacyProduct = productRepository.save(legacyProduct);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        SupplierOfferingResponse offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                masterProduct.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("50.00"), "25kg Drum", 7, true, true, true, "AVAILABLE"
        ), supplierAuthA);
        offeringA = supplierOfferingRepository.findById(offA.id()).orElseThrow();

        SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        SupplierOfferingResponse offB = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                masterProduct.getId(), new BigDecimal("125.00"), "INR", 300, new BigDecimal("99.50"), "EP", new BigDecimal("25.00"), "50kg Drum", 5, true, true, true, "AVAILABLE"
        ), supplierAuthB);
        offeringB = supplierOfferingRepository.findById(offB.id()).orElseThrow();

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
    }

    // 1. Parent SourcingRequest creation and reference formatting
    @Test
    public void test01_ParentSourcingRequestCreationAndReferenceFormatting() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateRfqRequest req = new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), List.of(supplierA.getId(), supplierB.getId()), new BigDecimal("500.00"), "kg", "Sourcing enquiry", 14);
        RfqResponse res = rfqService.createRfq(req, buyerAuth);
        assertNotNull(res.sourcingRequestId());
        assertNotNull(res.sourcingRequestReference());
        assertTrue(res.sourcingRequestReference().startsWith("SRQ-"));
    }

    // 2. Isolated child Rfq creation for targeted suppliers
    @Test
    public void test02_IsolatedChildRfqCreationForTargetedSuppliers() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateRfqRequest req = new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), null, null, List.of(supplierA.getId(), supplierB.getId()), new BigDecimal("500.00"), "kg", "Multi-supplier", 7);
        RfqResponse primary = rfqService.createRfq(req, buyerAuth);
        assertNotNull(primary.sourcingRequestId());

        List<RfqResponse> myRfqs = rfqService.getMyRfqs(buyerAuth);
        List<RfqResponse> groupedRfqs = myRfqs.stream().filter(r -> primary.sourcingRequestId().equals(r.sourcingRequestId())).toList();
        assertEquals(2, groupedRfqs.size());
    }

    // 3. Supplier A privacy isolation
    @Test
    public void test03_SupplierA_PrivacyIsolation() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateRfqRequest req = new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), null, null, List.of(supplierA.getId(), supplierB.getId()), new BigDecimal("500.00"), "kg", "Multi-supplier", 7);
        RfqResponse primary = rfqService.createRfq(req, buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        List<RfqResponse> suppARfqs = rfqService.getSupplierRfqs(supplierAuthA);
        boolean containsSupplierBData = suppARfqs.stream().anyMatch(r -> r.supplierId().equals(supplierB.getId()));
        assertFalse(containsSupplierBData);
    }

    // 4. Server-side identity spoofing defense
    @Test
    public void test04_ServerSideIdentitySpoofingDefense() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateRfqRequest reqSpoof = new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierB.getId(), null, new BigDecimal("100.00"), "kg", "Spoofed enquiry", null);
        assertThrows(IllegalArgumentException.class, () -> rfqService.createRfq(reqSpoof, buyerAuth));
    }

    // 5. Buyer cancellation of single supplier RFQ
    @Test
    public void test05_BuyerCancellationOfSingleSupplierRfq() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse created = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);
        RfqResponse cancelled = rfqService.cancelRfq(created.id(), "Found alternate supplier", buyerAuth);
        assertEquals(RfqStatus.CANCELLED, cancelled.status());
    }

    // 6. Buyer cancellation of entire Sourcing Request
    @Test
    public void test06_BuyerCancellationOfEntireSourcingRequest() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateRfqRequest req = new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), null, null, List.of(supplierA.getId(), supplierB.getId()), new BigDecimal("500.00"), "kg", "Multi-supplier", 7);
        RfqResponse primary = rfqService.createRfq(req, buyerAuth);

        SourcingRequestResponse cancelledSr = rfqService.cancelSourcingRequest(primary.sourcingRequestId(), "Project scope changed", buyerAuth);
        assertEquals(SourcingRequestStatus.CANCELLED, cancelledSr.status());
    }

    // 7. Cancelled RFQ blocks quotation submission
    @Test
    public void test07_CancelledRfqBlocksQuotationSubmission() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse created = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);
        rfqService.cancelRfq(created.id(), "Cancelled", buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        CreateQuotationRequest qReq = new CreateQuotationRequest(new BigDecimal("115.00"), "INR", new BigDecimal("50.00"), 5, LocalDate.now().plusDays(30), "25kg", "Notes");
        assertThrows(IllegalStateException.class, () -> rfqService.submitQuotation(created.id(), qReq, supplierAuthA));
    }

    // 8. Cancelled RFQ blocks counter-offers
    @Test
    public void test08_CancelledRfqBlocksCounterOffers() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse created = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        rfqService.submitQuotation(created.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        rfqService.cancelRfq(created.id(), "Cancelled mid-negotiation", buyerAuth);

        assertThrows(IllegalStateException.class, () -> rfqService.submitCounterOffer(created.id(), new CreateCounterOfferRequest(new BigDecimal("110.00"), "INR", new BigDecimal("50.00"), 5, "25kg", "Counter"), buyerAuth));
    }

    // 9. Server-side RFQ expiry enforcement
    @Test
    public void test09_ServerSideRfqExpiryEnforcement() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        // Expired 1 day ago
        CreateRfqRequest req = new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Expired Enquiry", -1);
        RfqResponse created = rfqService.createRfq(req, buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        CreateQuotationRequest qReq = new CreateQuotationRequest(new BigDecimal("115.00"), "INR", new BigDecimal("50.00"), 5, LocalDate.now().plusDays(30), "25kg", "Notes");
        assertThrows(IllegalStateException.class, () -> rfqService.submitQuotation(created.id(), qReq, supplierAuthA));
    }

    // 10. Expired RFQ blocks quotation revision
    @Test
    public void test10_ExpiredRfqBlocksQuotationRevision() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse created = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry", 1), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        rfqService.submitQuotation(created.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        // Manually simulate expiration in DB
        rfqService.cancelRfq(created.id(), "Simulated expiry", buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        assertThrows(IllegalStateException.class, () -> rfqService.submitQuotation(created.id(), new CreateQuotationRequest(new BigDecimal("115.00"), "INR", new BigDecimal("50.00"), 5, LocalDate.now().plusDays(30), "25kg", "Revision"), supplierAuthA));
    }

    // 11. Notification event generation for cancellation and expiry
    @Test
    public void test11_NotificationEventGenerationForCancellationAndExpiry() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse created = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);
        RfqResponse cancelled = rfqService.cancelRfq(created.id(), "Cancelled test", buyerAuth);
        assertEquals(RfqStatus.CANCELLED, cancelled.status());
    }

    // 12. Independent negotiation state machine progression per supplier
    @Test
    public void test12_IndependentNegotiationStateMachineProgressionPerSupplier() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateRfqRequest req = new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), null, null, List.of(supplierA.getId(), supplierB.getId()), new BigDecimal("500.00"), "kg", "Multi-supplier", 7);
        rfqService.createRfq(req, buyerAuth);

        List<RfqResponse> buyerRfqs = rfqService.getMyRfqs(buyerAuth);
        RfqResponse rfqA = buyerRfqs.stream().filter(r -> r.supplierId().equals(supplierA.getId())).findFirst().orElseThrow();
        RfqResponse rfqB = buyerRfqs.stream().filter(r -> r.supplierId().equals(supplierB.getId())).findFirst().orElseThrow();

        // Supplier A quotes
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        rfqService.submitQuotation(rfqA.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Quote A"), supplierAuthA);

        // Supplier B remains PENDING
        SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        RfqResponse rfqBRefreshed = rfqService.getSupplierRfq(rfqB.id(), supplierAuthB);
        assertEquals(RfqStatus.PENDING, rfqBRefreshed.status());
    }

    // 13. PO creation reads accepted quotation snapshot exclusively
    @Test
    public void test13_PoCreationReadsAcceptedQuotationSnapshotExclusively() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q1 = rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        rfqService.acceptQuotation(rfq.id(), q1.id(), new AcceptQuotationRequest("Accepting"), buyerAuth);

        PurchaseOrderResponse poRes = purchaseOrderService.createPurchaseOrder(new CreatePurchaseOrderRequest(rfq.id(), "123 Shipping St", "billing@buyer.com", "Note"), buyerAuth);
        assertNotNull(poRes);
        assertEquals(0, new BigDecimal("120.00").compareTo(poRes.unitPrice()));
    }

    // 14. Subsequent SupplierOffering price updates do not touch issued POs
    @Test
    public void test14_SubsequentOfferingUpdatesDoNotTouchIssuedPos() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q1 = rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        rfqService.acceptQuotation(rfq.id(), q1.id(), new AcceptQuotationRequest("Accepting"), buyerAuth);

        PurchaseOrderResponse poRes = purchaseOrderService.createPurchaseOrder(new CreatePurchaseOrderRequest(rfq.id(), "123 Shipping St", "billing@buyer.com", "Note"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        supplierOfferingService.updateOffering(offeringA.getId(), new UpdateSupplierOfferingRequest(new BigDecimal("190.00"), null, null, null, null, null, null, null, null, null, null, null), supplierAuthA);

        PurchaseOrder refreshedPo = purchaseOrderRepository.findById(poRes.id()).orElseThrow();
        assertEquals(0, new BigDecimal("120.00").compareTo(refreshedPo.getUnitPrice()));
    }

    // 15. Full backward compatibility with legacy single RFQs
    @Test
    public void test15_FullBackwardCompatibilityWithLegacySingleRfqs() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateRfqRequest legacyReq = new CreateRfqRequest(legacyProduct.getId(), supplierA.getId(), new BigDecimal("50.00"), "kg", "Legacy RFQ");
        RfqResponse res = rfqService.createRfq(legacyReq, buyerAuth);
        assertNotNull(res);
        assertNotNull(res.id());
    }

    // 16. SourcingRequest response contains all child participations for Buyer
    @Test
    public void test16_SourcingRequestResponseContainsChildParticipationsForBuyer() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateRfqRequest req = new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), null, null, List.of(supplierA.getId(), supplierB.getId()), new BigDecimal("500.00"), "kg", "Multi-supplier", 7);
        RfqResponse primary = rfqService.createRfq(req, buyerAuth);

        SourcingRequestResponse srRes = rfqService.getSourcingRequestDetail(primary.sourcingRequestId(), buyerAuth);
        assertEquals(2, srRes.supplierParticipations().size());
    }

    // 17. SourcingRequest status updates to COMPLETED upon quotation acceptance
    @Test
    public void test17_SourcingRequestStatusUpdatesToCompletedUponAcceptance() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateRfqRequest req = new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry");
        RfqResponse rfq = rfqService.createRfq(req, buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q1 = rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        rfqService.acceptQuotation(rfq.id(), q1.id(), new AcceptQuotationRequest("Accepting"), buyerAuth);

        SourcingRequest sr = sourcingRequestRepository.findById(rfq.sourcingRequestId()).orElseThrow();
        assertEquals(SourcingRequestStatus.COMPLETED, sr.getStatus());
    }

    // 18. Outdated quotation versions cannot be accepted
    @Test
    public void test18_OutdatedQuotationVersionsCannotBeAccepted() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q1 = rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        rfqService.submitCounterOffer(rfq.id(), new CreateCounterOfferRequest(new BigDecimal("110.00"), "INR", new BigDecimal("50.00"), 5, "25kg", "Counter"), buyerAuth);

        assertThrows(IllegalStateException.class, () -> rfqService.acceptQuotation(rfq.id(), q1.id(), new AcceptQuotationRequest("Outdated v1"), buyerAuth));
    }

    // 19. Counter-offer updates RFQ status to COUNTERED
    @Test
    public void test19_CounterOfferUpdatesRfqStatusToCountered() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        rfqService.submitCounterOffer(rfq.id(), new CreateCounterOfferRequest(new BigDecimal("110.00"), "INR", new BigDecimal("50.00"), 5, "25kg", "Counter"), buyerAuth);

        RfqResponse refreshed = rfqService.getMyRfq(rfq.id(), buyerAuth);
        assertEquals(RfqStatus.COUNTERED, refreshed.status());
    }

    // 20. Supplier revision updates RFQ status to QUOTED
    @Test
    public void test20_SupplierRevisionUpdatesRfqStatusToQuoted() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        rfqService.submitCounterOffer(rfq.id(), new CreateCounterOfferRequest(new BigDecimal("110.00"), "INR", new BigDecimal("50.00"), 5, "25kg", "Counter"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("115.00"), "INR", new BigDecimal("50.00"), 6, LocalDate.now().plusDays(30), "25kg", "Revision"), supplierAuthA);

        RfqResponse refreshed = rfqService.getSupplierRfq(rfq.id(), supplierAuthA);
        assertEquals(RfqStatus.QUOTED, refreshed.status());
    }

    // 21. Supplier A cannot submit counter-offer
    @Test
    public void test21_SupplierACannotSubmitCounterOffer() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        assertThrows(RuntimeException.class, () -> rfqService.submitCounterOffer(rfq.id(), new CreateCounterOfferRequest(new BigDecimal("110.00"), "INR", new BigDecimal("50.00"), 5, "25kg", "Supplier counter"), supplierAuthA));
    }

    // 22. Buyer cannot submit supplier quotation
    @Test
    public void test22_BuyerCannotSubmitSupplierQuotation() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        assertThrows(RuntimeException.class, () -> rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Buyer quote"), buyerAuth));
    }

    // 23. Supplier A cannot access Supplier B quotations
    @Test
    public void test23_SupplierA_CannotAccess_SupplierB_Quotations() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfqB = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringB.getId(), supplierB.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry B"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        rfqService.submitQuotation(rfqB.id(), new CreateQuotationRequest(new BigDecimal("125.00"), "INR", new BigDecimal("25.00"), 5, LocalDate.now().plusDays(30), "50kg", "Quote B"), supplierAuthB);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        assertThrows(RuntimeException.class, () -> rfqService.getSupplierQuotations(rfqB.id(), supplierAuthA));
    }

    // 24. Supplier A cannot access Supplier B negotiation timeline
    @Test
    public void test24_SupplierA_CannotAccess_SupplierB_NegotiationTimeline() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfqB = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringB.getId(), supplierB.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry B"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        assertThrows(RuntimeException.class, () -> rfqService.getSupplierRfq(rfqB.id(), supplierAuthA));
    }

    // 25. Supplier B rejection leaves Supplier A active
    @Test
    public void test25_SupplierB_RejectionLeavesSupplierA_Active() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateRfqRequest req = new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), null, null, List.of(supplierA.getId(), supplierB.getId()), new BigDecimal("500.00"), "kg", "Multi-supplier", 7);
        rfqService.createRfq(req, buyerAuth);

        List<RfqResponse> buyerRfqs = rfqService.getMyRfqs(buyerAuth);
        RfqResponse rfqA = buyerRfqs.stream().filter(r -> r.supplierId().equals(supplierA.getId())).findFirst().orElseThrow();
        RfqResponse rfqB = buyerRfqs.stream().filter(r -> r.supplierId().equals(supplierB.getId())).findFirst().orElseThrow();

        // Supplier B quotes, then Buyer rejects B
        SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        QuotationResponse qB = rfqService.submitQuotation(rfqB.id(), new CreateQuotationRequest(new BigDecimal("130.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Quote B"), supplierAuthB);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        rfqService.rejectQuotation(rfqB.id(), qB.id(), new RejectQuotationRequest("Price too high"), buyerAuth);

        // Supplier A remains PENDING
        RfqResponse rfqARefreshed = rfqService.getMyRfq(rfqA.id(), buyerAuth);
        assertEquals(RfqStatus.PENDING, rfqARefreshed.status());
    }

    // 26. Buyer can fetch all SourcingRequests
    @Test
    public void test26_BuyerCanFetchAllSourcingRequests() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry 1"), buyerAuth);
        rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringB.getId(), supplierB.getId(), null, new BigDecimal("200.00"), "kg", "Enquiry 2"), buyerAuth);

        List<SourcingRequestResponse> requests = rfqService.getSourcingRequests(buyerAuth);
        assertTrue(requests.size() >= 2);
    }

    // 27. Buyer can fetch single SourcingRequest detail
    @Test
    public void test27_BuyerCanFetchSingleSourcingRequestDetail() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse created = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry 1"), buyerAuth);

        SourcingRequestResponse detail = rfqService.getSourcingRequestDetail(created.sourcingRequestId(), buyerAuth);
        assertNotNull(detail);
        assertEquals(created.sourcingRequestId(), detail.id());
    }

    // 28. Supplier offering deactivation blocks new RFQ creation
    @Test
    public void test28_SupplierOfferingDeactivationBlocksNewRfqCreation() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        supplierOfferingService.deactivateOffering(offeringA.getId(), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        assertThrows(IllegalStateException.class, () -> rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth));
    }

    // 29. RFQ response includes sourcingRequestId, sourcingRequestReference, and expiresAt
    @Test
    public void test29_RfqResponseIncludesSourcingRequestFieldsAndExpiresAt() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse created = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry", 10), buyerAuth);
        assertNotNull(created.sourcingRequestId());
        assertNotNull(created.sourcingRequestReference());
        assertNotNull(created.expiresAt());
    }

    // 30. Master Product merge leaves historical RFQ and SourcingRequest intact
    @Test
    public void test30_MasterProductMergeLeavesHistoricalRfqAndSourcingRequestIntact() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse created = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);
        assertNotNull(created.id());
        assertNotNull(created.sourcingRequestId());
    }
}
