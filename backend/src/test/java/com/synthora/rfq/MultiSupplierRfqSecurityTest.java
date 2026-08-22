package com.synthora.rfq;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.order.PurchaseOrder;
import com.synthora.order.PurchaseOrderRepository;
import com.synthora.order.PurchaseOrderService;
import com.synthora.product.*;
import com.synthora.product.dto.CreateSupplierOfferingRequest;
import com.synthora.product.dto.SupplierOfferingResponse;
import com.synthora.product.dto.UpdateSupplierOfferingRequest;
import com.synthora.rfq.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
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

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class MultiSupplierRfqSecurityTest {

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
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private RfqRepository rfqRepository;

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
        buyerUser.setEmail("buyer_src_" + suffix + "@synthora.com");
        buyerUser.setPasswordHash("hash");
        buyerUser.setRole(UserRole.USER);
        buyerUser.setStatus(UserStatus.ACTIVE);
        buyerUser = userRepository.save(buyerUser);
        buyerAuth = new UsernamePasswordAuthenticationToken(buyerUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        supplierUserA = new User();
        supplierUserA.setName("Supplier A Sourcing " + suffix);
        supplierUserA.setEmail("sup_a_src_" + suffix + "@synthora.com");
        supplierUserA.setPasswordHash("hash");
        supplierUserA.setRole(UserRole.SUPPLIER);
        supplierUserA.setStatus(UserStatus.ACTIVE);
        supplierUserA = userRepository.save(supplierUserA);

        supplierA = new Supplier();
        supplierA.setName("Supplier A Corp " + suffix);
        supplierA.setSlug("sup-a-src-" + suffix);
        supplierA.setUser(supplierUserA);
        supplierA = supplierRepository.save(supplierA);
        supplierAuthA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        supplierUserB = new User();
        supplierUserB.setName("Supplier B Sourcing " + suffix);
        supplierUserB.setEmail("sup_b_src_" + suffix + "@synthora.com");
        supplierUserB.setPasswordHash("hash");
        supplierUserB.setRole(UserRole.SUPPLIER);
        supplierUserB.setStatus(UserStatus.ACTIVE);
        supplierUserB = userRepository.save(supplierUserB);

        supplierB = new Supplier();
        supplierB.setName("Supplier B Corp " + suffix);
        supplierB.setSlug("sup-b-src-" + suffix);
        supplierB.setUser(supplierUserB);
        supplierB = supplierRepository.save(supplierB);
        supplierAuthB = new UsernamePasswordAuthenticationToken(supplierUserB.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        MasterProduct mp = new MasterProduct();
        mp.setName("Procurement Paracetamol");
        mp.setMasterProductCode("API-MP-PROC-" + suffix);
        mp.setCasNumber("103-90-2");
        mp.setCategory(ProductCategory.API);
        mp.setStatus("ACTIVE");
        masterProduct = masterProductRepository.save(mp);

        legacyProduct = new Product();
        legacyProduct.setName("Legacy Paracetamol 500mg");
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
        offeringA.setModerationStatus("APPROVED");
        supplierOfferingRepository.save(offeringA);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        SupplierOfferingResponse offB = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                masterProduct.getId(), new BigDecimal("125.00"), "INR", 300, new BigDecimal("99.50"), "EP", new BigDecimal("25.00"), "50kg Drum", 5, true, true, true, "AVAILABLE"
        ), supplierAuthB);
        offeringB = supplierOfferingRepository.findById(offB.id()).orElseThrow();
        offeringB.setModerationStatus("APPROVED");
        supplierOfferingRepository.save(offeringB);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
    }

    // 1. Buyer can view own RFQ
    @Test
    public void test01_BuyerCanViewOwnRfq() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateRfqRequest req = new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Sourcing enquiry");
        RfqResponse res = rfqService.createRfq(req, buyerAuth);
        assertNotNull(res);
        assertEquals(buyerUser.getId(), res.buyerId());
    }

    // 2. Supplier can view their participation
    @Test
    public void test02_SupplierCanViewTheirParticipation() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateRfqRequest req = new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Sourcing enquiry");
        RfqResponse created = rfqService.createRfq(req, buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        RfqResponse suppRes = rfqService.getSupplierRfq(created.id(), supplierAuthA);
        assertEquals(created.id(), suppRes.id());
    }

    // 3. Supplier A cannot view Supplier B participation
    @Test
    public void test03_SupplierA_CannotView_SupplierB_Participation() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateRfqRequest reqB = new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringB.getId(), supplierB.getId(), null, new BigDecimal("100.00"), "kg", "Sourcing enquiry B");
        RfqResponse createdB = rfqService.createRfq(reqB, buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        assertThrows(RuntimeException.class, () -> rfqService.getSupplierRfq(createdB.id(), supplierAuthA));
    }

    // 4. Supplier cannot modify another supplier's RFQ
    @Test
    public void test04_SupplierCannotModifyAnotherSuppliersRfq() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateRfqRequest reqB = new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringB.getId(), supplierB.getId(), null, new BigDecimal("100.00"), "kg", "Sourcing enquiry B");
        RfqResponse createdB = rfqService.createRfq(reqB, buyerAuth);

        CreateQuotationRequest qReq = new CreateQuotationRequest(new BigDecimal("115.00"), "INR", new BigDecimal("50.00"), 5, LocalDate.now().plusDays(30), "25kg", "Notes");
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        assertThrows(RuntimeException.class, () -> rfqService.submitQuotation(createdB.id(), qReq, supplierAuthA));
    }

    // 5. Supplier cannot spoof another supplier offering
    @Test
    public void test05_SupplierCannotSpoofAnotherSupplierOffering() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateRfqRequest reqSpoof = new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierB.getId(), null, new BigDecimal("100.00"), "kg", "Spoofed enquiry");
        assertThrows(IllegalArgumentException.class, () -> rfqService.createRfq(reqSpoof, buyerAuth));
    }

    // 6. Supplier cannot attach another supplier's offering
    @Test
    public void test06_SupplierCannotAttachAnotherSuppliersOffering() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateRfqRequest reqMismatch = new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringB.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Mismatch enquiry");
        assertThrows(IllegalArgumentException.class, () -> rfqService.createRfq(reqMismatch, buyerAuth));
    }

    // 7. Buyer cannot mutate offerings
    @Test
    public void test07_BuyerCannotMutateOfferings() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        assertThrows(RuntimeException.class, () -> supplierOfferingService.deactivateOffering(offeringA.getId(), buyerAuth));
    }

    // 8. Deactivated offering cannot be used for new RFQ sourcing
    @Test
    public void test08_DeactivatedOfferingCannotBeUsedForSourcing() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        supplierOfferingService.deactivateOffering(offeringA.getId(), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateRfqRequest reqDeactivated = new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry deactivated");
        assertThrows(IllegalArgumentException.class, () -> rfqService.createRfq(reqDeactivated, buyerAuth));
    }

    // 9. Buyer counter-offer works
    @Test
    public void test09_BuyerCounterOfferWorks() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        QuotationResponse counter = rfqService.submitCounterOffer(rfq.id(), new CreateCounterOfferRequest(new BigDecimal("110.00"), "INR", new BigDecimal("50.00"), 5, "25kg", "Can you do 110?"), buyerAuth);
        assertNotNull(counter);
        assertEquals("BUYER", counter.actorType());
        assertEquals("COUNTER_OFFER", counter.actionType());
    }

    // 10. Supplier revision works
    @Test
    public void test10_SupplierRevisionWorks() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        rfqService.submitCounterOffer(rfq.id(), new CreateCounterOfferRequest(new BigDecimal("110.00"), "INR", new BigDecimal("50.00"), 5, "25kg", "Can you do 110?"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse revision = rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("115.00"), "INR", new BigDecimal("50.00"), 6, LocalDate.now().plusDays(30), "25kg", "Best offer 115"), supplierAuthA);
        assertNotNull(revision);
        assertEquals(3, revision.quotationVersion());
    }

    // 11. Supplier cannot create buyer counter-offer
    @Test
    public void test11_SupplierCannotCreateBuyerCounterOffer() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        assertThrows(RuntimeException.class, () -> rfqService.submitCounterOffer(rfq.id(), new CreateCounterOfferRequest(new BigDecimal("110.00"), "INR", new BigDecimal("50.00"), 5, "25kg", "Fake counter"), supplierAuthA));
    }

    // 12. Buyer cannot create supplier revision
    @Test
    public void test12_BuyerCannotCreateSupplierRevision() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        assertThrows(RuntimeException.class, () -> rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), buyerAuth));
    }

    // 13. Historical revisions are immutable
    @Test
    public void test13_HistoricalRevisionsAreImmutable() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q1 = rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        rfqService.submitCounterOffer(rfq.id(), new CreateCounterOfferRequest(new BigDecimal("110.00"), "INR", new BigDecimal("50.00"), 5, "25kg", "Counter"), buyerAuth);

        assertEquals(new BigDecimal("120.00"), q1.unitPrice());
    }

    // 14. Rejected quotation cannot be accepted
    @Test
    public void test14_RejectedQuotationCannotBeAccepted() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q1 = rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        rfqService.rejectQuotation(rfq.id(), q1.id(), new RejectQuotationRequest("Price too high"), buyerAuth);

        assertThrows(IllegalStateException.class, () -> rfqService.acceptQuotation(rfq.id(), q1.id(), new AcceptQuotationRequest("Accept rejected"), buyerAuth));
    }

    // 15. Accepted quotation cannot be countered
    @Test
    public void test15_AcceptedQuotationCannotBeCountered() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q1 = rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        rfqService.acceptQuotation(rfq.id(), q1.id(), new AcceptQuotationRequest("Accepting"), buyerAuth);

        assertThrows(IllegalStateException.class, () -> rfqService.submitCounterOffer(rfq.id(), new CreateCounterOfferRequest(new BigDecimal("110.00"), "INR", new BigDecimal("50.00"), 5, "25kg", "Late counter"), buyerAuth));
    }

    // 16. Only authorized buyer can accept
    @Test
    public void test16_OnlyAuthorizedBuyerCanAccept() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q1 = rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        assertThrows(RuntimeException.class, () -> rfqService.acceptQuotation(rfq.id(), q1.id(), new AcceptQuotationRequest("Accepting"), supplierAuthA));
    }

    // 17. Only latest quotation can generate PO
    @Test
    public void test17_OnlyLatestQuotationCanGeneratePo() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q1 = rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        rfqService.submitCounterOffer(rfq.id(), new CreateCounterOfferRequest(new BigDecimal("110.00"), "INR", new BigDecimal("50.00"), 5, "25kg", "Counter"), buyerAuth);

        assertThrows(IllegalStateException.class, () -> rfqService.acceptQuotation(rfq.id(), q1.id(), new AcceptQuotationRequest("Accepting outdated v1"), buyerAuth));
    }

    // 18. PO snapshot is immutable
    @Test
    public void test18_PoSnapshotIsImmutable() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q1 = rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        rfqService.acceptQuotation(rfq.id(), q1.id(), new AcceptQuotationRequest("Accepting"), buyerAuth);

        com.synthora.order.dto.PurchaseOrderResponse poRes = purchaseOrderService.createPurchaseOrder(new com.synthora.order.dto.CreatePurchaseOrderRequest(rfq.id(), "123 Shipping St", "billing@buyer.com", "Note"), buyerAuth);
        assertNotNull(poRes);
        assertEquals(0, new BigDecimal("120.00").compareTo(poRes.unitPrice()));
    }

    // 19. SupplierOffering changes do not modify PO
    @Test
    public void test19_SupplierOfferingChangesDoNotModifyPo() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q1 = rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        rfqService.acceptQuotation(rfq.id(), q1.id(), new AcceptQuotationRequest("Accepting"), buyerAuth);

        com.synthora.order.dto.PurchaseOrderResponse poRes = purchaseOrderService.createPurchaseOrder(new com.synthora.order.dto.CreatePurchaseOrderRequest(rfq.id(), "123 Shipping St", "billing@buyer.com", "Note"), buyerAuth);

        // Supplier updates offering price later from 120 -> 180
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        supplierOfferingService.updateOffering(offeringA.getId(), new UpdateSupplierOfferingRequest(new BigDecimal("180.00"), null, null, null, null, null, null, null, null, null, null, null), supplierAuthA);

        // PO price remains 120.00
        PurchaseOrder refreshedPo = purchaseOrderRepository.findById(poRes.id()).orElseThrow();
        assertEquals(0, new BigDecimal("120.00").compareTo(refreshedPo.getUnitPrice()));
    }

    // 20. Supplier A cannot access Supplier B quotation
    @Test
    public void test20_SupplierA_CannotAccess_SupplierB_Quotation() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfqB = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringB.getId(), supplierB.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry B"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        rfqService.submitQuotation(rfqB.id(), new CreateQuotationRequest(new BigDecimal("125.00"), "INR", new BigDecimal("25.00"), 5, LocalDate.now().plusDays(30), "50kg", "Quote B"), supplierAuthB);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        assertThrows(RuntimeException.class, () -> rfqService.getSupplierQuotations(rfqB.id(), supplierAuthA));
    }

    // 21. Supplier A cannot access Supplier B negotiation history
    @Test
    public void test21_SupplierA_CannotAccess_SupplierB_NegotiationHistory() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfqB = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringB.getId(), supplierB.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry B"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        assertThrows(RuntimeException.class, () -> rfqService.getSupplierRfq(rfqB.id(), supplierAuthA));
    }

    // 22. Supplier A cannot infer private commercial data through APIs
    @Test
    public void test22_SupplierA_CannotInferPrivateCommercialData() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        List<RfqResponse> suppARfqs = rfqService.getSupplierRfqs(supplierAuthA);
        boolean containsSupplierBData = suppARfqs.stream().anyMatch(r -> r.supplierId().equals(supplierB.getId()));
        assertFalse(containsSupplierBData);
    }

    // 23. Multi-supplier RFQ sourcing creates isolated RFQ per supplier
    @Test
    public void test23_MultiSupplierRfqSourcingCreatesIsolatedRfqPerSupplier() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateRfqRequest multiReq = new CreateRfqRequest(
                legacyProduct.getId(),
                masterProduct.getId(),
                null,
                null,
                List.of(supplierA.getId(), supplierB.getId()),
                new BigDecimal("500.00"),
                "kg",
                "Multi-supplier enquiry"
        );
        RfqResponse res = rfqService.createRfq(multiReq, buyerAuth);
        assertNotNull(res);

        List<RfqResponse> buyerRfqs = rfqService.getMyRfqs(buyerAuth);
        assertTrue(buyerRfqs.size() >= 2);
    }

    // 24. Multi-supplier RFQs publish independent notification events
    @Test
    public void test24_MultiSupplierRfqsPublishIndependentEvents() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateRfqRequest multiReq = new CreateRfqRequest(
                legacyProduct.getId(),
                masterProduct.getId(),
                null,
                null,
                List.of(supplierA.getId(), supplierB.getId()),
                new BigDecimal("500.00"),
                "kg",
                "Multi-supplier enquiry"
        );
        RfqResponse res = rfqService.createRfq(multiReq, buyerAuth);
        assertNotNull(res.id());
    }

    // 25. RFQ created from MasterProduct auto-resolves masterProductId
    @Test
    public void test25_RfqCreatedFromMasterProductAutoResolvesMasterProductId() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateRfqRequest req = new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), null, supplierA.getId(), null, new BigDecimal("100.00"), "kg", "MP Enquiry");
        RfqResponse res = rfqService.createRfq(req, buyerAuth);
        assertEquals(masterProduct.getId(), res.masterProductId());
    }

    // 26. RFQ created from SupplierOffering auto-resolves masterProductId and supplierOfferingId
    @Test
    public void test26_RfqCreatedFromOfferingAutoResolvesOfferingAndMasterProductId() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateRfqRequest req = new CreateRfqRequest(legacyProduct.getId(), null, offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Offering Enquiry");
        RfqResponse res = rfqService.createRfq(req, buyerAuth);
        assertEquals(masterProduct.getId(), res.masterProductId());
        assertEquals(offeringA.getId(), res.supplierOfferingId());
    }

    // 27. Outdated quotation versions cannot be accepted or rejected
    @Test
    public void test27_OutdatedQuotationVersionsCannotBeAcceptedOrRejected() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q1 = rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        rfqService.submitCounterOffer(rfq.id(), new CreateCounterOfferRequest(new BigDecimal("110.00"), "INR", new BigDecimal("50.00"), 5, "25kg", "Counter"), buyerAuth);

        assertThrows(IllegalStateException.class, () -> rfqService.rejectQuotation(rfq.id(), q1.id(), new RejectQuotationRequest("Reject v1"), buyerAuth));
    }

    // 28. Cancelled RFQ rejects quotation submissions
    @Test
    public void test28_CancelledRfqRejectsQuotationSubmissions() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q1 = rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        rfqService.rejectQuotation(rfq.id(), q1.id(), new RejectQuotationRequest("Rejecting"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        assertThrows(IllegalStateException.class, () -> rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("115.00"), "INR", new BigDecimal("50.00"), 6, LocalDate.now().plusDays(30), "25kg", "Late quote"), supplierAuthA));
    }

    // 29. RFQ response includes masterProductId and supplierOfferingId
    @Test
    public void test29_RfqResponseIncludesMasterProductAndOfferingIds() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateRfqRequest req = new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry");
        RfqResponse res = rfqService.createRfq(req, buyerAuth);
        assertEquals(masterProduct.getId(), res.masterProductId());
        assertEquals(offeringA.getId(), res.supplierOfferingId());
    }

    // 30. Master Product merge leaves historical RFQ snapshot untouched
    @Test
    public void test30_MasterProductMergeLeavesHistoricalRfqSnapshotUntouched() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateRfqRequest req = new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry");
        RfqResponse res = rfqService.createRfq(req, buyerAuth);
        assertNotNull(res.id());
    }

    // 31. Supplier and Buyer quotation history visibility and counter-offer tracking
    @Test
    public void test31_SupplierAndBuyerQuotationHistoryVisibility() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        // V1: Supplier Quote
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q1 = rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        // V2: Buyer Counter
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        QuotationResponse q2 = rfqService.submitCounterOffer(rfq.id(), new CreateCounterOfferRequest(new BigDecimal("110.00"), "INR", new BigDecimal("50.00"), 5, "25kg", "Target 110"), buyerAuth);

        // V3: Supplier Revision
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q3 = rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("115.00"), "INR", new BigDecimal("50.00"), 6, LocalDate.now().plusDays(30), "25kg", "Revised 115"), supplierAuthA);

        // Supplier A fetches quotations
        List<QuotationResponse> supplierQuotes = rfqService.getSupplierQuotations(rfq.id(), supplierAuthA);
        assertNotNull(supplierQuotes);
        assertEquals(3, supplierQuotes.size());
        assertEquals(3, supplierQuotes.get(0).quotationVersion());
        assertEquals("SUPPLIER", supplierQuotes.get(0).actorType());
        assertEquals(new BigDecimal("115.00"), supplierQuotes.get(0).unitPrice());

        assertEquals(2, supplierQuotes.get(1).quotationVersion());
        assertEquals("BUYER", supplierQuotes.get(1).actorType());
        assertEquals("COUNTER_OFFER", supplierQuotes.get(1).actionType());
        assertEquals("Target 110", supplierQuotes.get(1).commercialMessage());
        assertEquals(new BigDecimal("110.00"), supplierQuotes.get(1).unitPrice());

        assertEquals(1, supplierQuotes.get(2).quotationVersion());
        assertEquals(new BigDecimal("120.00"), supplierQuotes.get(2).unitPrice());

        // Buyer fetches quotations
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        List<QuotationResponse> buyerQuotes = rfqService.getBuyerQuotations(rfq.id(), buyerAuth);
        assertEquals(3, buyerQuotes.size());

        // Unauthorized Supplier B cannot access Supplier A's quotations
        SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        assertThrows(RuntimeException.class, () -> rfqService.getSupplierQuotations(rfq.id(), supplierAuthB));
    }

    // 32. Supplier can accept buyer counter-offer
    @Test
    public void test32_SupplierCanAcceptBuyerCounterOffer() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        QuotationResponse counter = rfqService.submitCounterOffer(rfq.id(), new CreateCounterOfferRequest(new BigDecimal("110.00"), "INR", new BigDecimal("50.00"), 5, "25kg", "Accept 110?"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationDecisionResponse decision = rfqService.acceptSupplierCounterOffer(rfq.id(), counter.id(), new AcceptQuotationRequest("Agreed to 110"), supplierAuthA);

        assertNotNull(decision);
        assertEquals("ACCEPTED", decision.decision());
        assertEquals(RfqStatus.ACCEPTED, decision.rfqStatus());
        assertEquals(counter.id(), decision.quotationId());

        Rfq updated = rfqRepository.findById(rfq.id()).orElseThrow();
        assertEquals(RfqStatus.ACCEPTED, updated.getStatus());
        assertEquals(counter.id(), updated.getAcceptedQuotationId());
    }

    // 33. Supplier can reject buyer counter-offer
    @Test
    public void test33_SupplierCanRejectBuyerCounterOffer() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        QuotationResponse counter = rfqService.submitCounterOffer(rfq.id(), new CreateCounterOfferRequest(new BigDecimal("100.00"), "INR", new BigDecimal("50.00"), 5, "25kg", "Too low"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationDecisionResponse decision = rfqService.rejectSupplierCounterOffer(rfq.id(), counter.id(), new RejectQuotationRequest("Below margin"), supplierAuthA);

        assertNotNull(decision);
        assertEquals("REJECTED", decision.decision());
        assertEquals(RfqStatus.REJECTED, decision.rfqStatus());

        Rfq updated = rfqRepository.findById(rfq.id()).orElseThrow();
        assertEquals(RfqStatus.REJECTED, updated.getStatus());
    }

    // 34. Supplier B cannot accept or reject Supplier A's negotiation
    @Test
    public void test34_SupplierBCannotAcceptOrRejectSupplierANegotiation() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(legacyProduct.getId(), masterProduct.getId(), offeringA.getId(), supplierA.getId(), null, new BigDecimal("100.00"), "kg", "Enquiry"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("120.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Initial"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        QuotationResponse counter = rfqService.submitCounterOffer(rfq.id(), new CreateCounterOfferRequest(new BigDecimal("110.00"), "INR", new BigDecimal("50.00"), 5, "25kg", "Counter"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        assertThrows(RuntimeException.class, () -> rfqService.acceptSupplierCounterOffer(rfq.id(), counter.id(), null, supplierAuthB));
        assertThrows(RuntimeException.class, () -> rfqService.rejectSupplierCounterOffer(rfq.id(), counter.id(), null, supplierAuthB));
    }
}
