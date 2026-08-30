package com.synthora.order;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.product.*;
import com.synthora.rfq.Rfq;
import com.synthora.rfq.RfqRepository;
import com.synthora.rfq.RfqStatus;
import com.synthora.rfq.quotation.Quotation;
import com.synthora.rfq.quotation.QuotationRepository;
import com.synthora.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class PurchaseOrderWorkflowSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private MasterProductRepository masterProductRepository;

    @Autowired
    private SupplierOfferingRepository supplierOfferingRepository;

    @Autowired
    private RfqRepository rfqRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private ShipmentRepository shipmentRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private User buyer1;
    private String buyer1Token;

    private User buyer2;
    private String buyer2Token;

    private User supplierUser1;
    private Supplier supplier1;
    private String supplier1Token;

    private User supplierUser2;
    private Supplier supplier2;
    private String supplier2Token;

    private MasterProduct masterProduct;
    private SupplierOffering offering1;

    @BeforeEach
    public void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        // 1. Buyer 1
        buyer1 = new User();
        buyer1.setEmail("buyer1@synthora.com");
        buyer1.setName("Buyer One Corporation");
        buyer1.setPasswordHash("hash123");
        buyer1.setRole(UserRole.USER);
        buyer1.setStatus(UserStatus.ACTIVE);
        buyer1 = userRepository.save(buyer1);
        buyer1Token = jwtService.generateToken(buyer1);

        // 2. Buyer 2
        buyer2 = new User();
        buyer2.setEmail("buyer2@synthora.com");
        buyer2.setName("Buyer Two Pharma");
        buyer2.setPasswordHash("hash123");
        buyer2.setRole(UserRole.USER);
        buyer2.setStatus(UserStatus.ACTIVE);
        buyer2 = userRepository.save(buyer2);
        buyer2Token = jwtService.generateToken(buyer2);

        // 3. Supplier 1
        supplierUser1 = new User();
        supplierUser1.setEmail("supplier1@synthora.com");
        supplierUser1.setName("Global Chemicals Ltd");
        supplierUser1.setPasswordHash("hash123");
        supplierUser1.setRole(UserRole.SUPPLIER);
        supplierUser1.setStatus(UserStatus.ACTIVE);
        supplierUser1 = userRepository.save(supplierUser1);
        supplier1Token = jwtService.generateToken(supplierUser1);

        supplier1 = new Supplier();
        supplier1.setUser(supplierUser1);
        supplier1.setName("Global Chemicals Ltd");
        supplier1.setVerified(true);
        supplier1 = supplierRepository.save(supplier1);

        // 4. Supplier 2
        supplierUser2 = new User();
        supplierUser2.setEmail("supplier2@synthora.com");
        supplierUser2.setName("Apex Reagents Inc");
        supplierUser2.setPasswordHash("hash123");
        supplierUser2.setRole(UserRole.SUPPLIER);
        supplierUser2.setStatus(UserStatus.ACTIVE);
        supplierUser2 = userRepository.save(supplierUser2);
        supplier2Token = jwtService.generateToken(supplierUser2);

        supplier2 = new Supplier();
        supplier2.setUser(supplierUser2);
        supplier2.setName("Apex Reagents Inc");
        supplier2.setVerified(true);
        supplier2 = supplierRepository.save(supplier2);

        // 5. Canonical Master Product
        masterProduct = new MasterProduct();
        masterProduct.setName("Acetaminophen USP");
        masterProduct.setMasterProductCode("MP-ACE-001");
        masterProduct.setCasNumber("103-90-2");
        masterProduct.setCategory(ProductCategory.API);
        masterProduct.setStatus("ACTIVE");
        masterProduct = masterProductRepository.save(masterProduct);

        // 6. Supplier Offering
        offering1 = new SupplierOffering();
        offering1.setSupplier(supplier1);
        offering1.setMasterProduct(masterProduct);
        offering1.setPrice(new BigDecimal("120.00"));
        offering1.setStock(10000);
        offering1.setPurity(new BigDecimal("99.50"));
        offering1.setGrade("Pharma Grade");
        offering1.setPackaging("25kg Fiber Drum");
        offering1.setLeadTimeDays(14);
        offering1.setModerationStatus("APPROVED");
        offering1.setAvailabilityStatus("AVAILABLE");
        offering1 = supplierOfferingRepository.save(offering1);
    }

    private Rfq createAcceptedRfq(User buyer, Supplier supplier, MasterProduct mp, SupplierOffering offering, BigDecimal unitPrice, BigDecimal quantity) {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyer.getId());
        rfq.setSupplierId(supplier.getId());
        rfq.setMasterProductId(mp.getId());
        rfq.setSupplierOfferingId(offering.getId());
        rfq.setQuantity(quantity);
        rfq.setUnit("kg");
        rfq.setStatus(RfqStatus.QUOTED);
        rfq.setCreatedAt(LocalDateTime.now());
        rfq = rfqRepository.save(rfq);

        Quotation quote = new Quotation();
        quote.setRfq(rfq);
        quote.setQuotationVersion(1);
        quote.setUnitPrice(unitPrice);
        quote.setCurrency("USD");
        quote.setLeadTimeDays(10);
        quote.setPackagingDetails("25kg Drum Sealed");
        quote.setCommercialNotes("Valid for 30 days");
        quote.setValidityDate(LocalDate.now().plusDays(30));
        quote.setCreatedAt(LocalDateTime.now());
        quote = quotationRepository.save(quote);

        rfq.setStatus(RfqStatus.ACCEPTED);
        rfq.setAcceptedQuotationId(quote.getId());
        return rfqRepository.save(rfq);
    }

    @Test
    @DisplayName("1. Buyer can successfully create PO from accepted quotation with full commercial snapshot")
    public void testBuyerCreatePurchaseOrderSuccess() throws Exception {
        Rfq rfq = createAcceptedRfq(buyer1, supplier1, masterProduct, offering1, new BigDecimal("110.00"), new BigDecimal("500.00"));

        String requestJson = String.format("""
                {
                    "rfqId": "%s",
                    "shippingAddress": "123 Pharma Way, Boston MA 02115",
                    "billingContact": "accounts@buyer1.com",
                    "paymentTerms": "Net 30",
                    "deliveryTerms": "FOB Origin",
                    "incoterms": "FOB",
                    "notes": "Urgent production batch"
                }
                """, rfq.getId());

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + buyer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.poNumber", startsWith("PO-")))
                .andExpect(jsonPath("$.rfqId", is(rfq.getId().toString())))
                .andExpect(jsonPath("$.masterProductId", is(masterProduct.getId().toString())))
                .andExpect(jsonPath("$.productName", is("Acetaminophen USP")))
                .andExpect(jsonPath("$.quantity", is(500.0)))
                .andExpect(jsonPath("$.unitPrice", is(110.0)))
                .andExpect(jsonPath("$.totalAmount", is(55000.0)))
                .andExpect(jsonPath("$.currency", is("USD")))
                .andExpect(jsonPath("$.status", is("PLACED")))
                .andExpect(jsonPath("$.shippingAddress", is("123 Pharma Way, Boston MA 02115")))
                .andExpect(jsonPath("$.billingContact", is("accounts@buyer1.com")))
                .andExpect(jsonPath("$.paymentTerms", is("Net 30")))
                .andExpect(jsonPath("$.rfqReference", notNullValue()))
                .andExpect(jsonPath("$.quotationReference", notNullValue()));

        assertEquals(1, purchaseOrderRepository.count());
    }

    @Test
    @DisplayName("2. Buyer cannot create PO from pending/unaccepted RFQ")
    public void testBuyerCannotCreatePoFromPendingRfq() throws Exception {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyer1.getId());
        rfq.setSupplierId(supplier1.getId());
        rfq.setMasterProductId(masterProduct.getId());
        rfq.setQuantity(new BigDecimal("100.00"));
        rfq.setUnit("kg");
        rfq.setStatus(RfqStatus.PENDING);
        rfq = rfqRepository.save(rfq);

        String requestJson = String.format("""
                {
                    "rfqId": "%s",
                    "shippingAddress": "123 Pharma Way",
                    "billingContact": "accounts@buyer1.com"
                }
                """, rfq.getId());

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + buyer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("3. Buyer cannot create PO from expired quotation")
    public void testBuyerCannotCreatePoFromExpiredQuotation() throws Exception {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyer1.getId());
        rfq.setSupplierId(supplier1.getId());
        rfq.setMasterProductId(masterProduct.getId());
        rfq.setQuantity(new BigDecimal("100.00"));
        rfq.setUnit("kg");
        rfq.setStatus(RfqStatus.ACCEPTED);
        rfq = rfqRepository.save(rfq);

        Quotation quote = new Quotation();
        quote.setRfq(rfq);
        quote.setQuotationVersion(1);
        quote.setUnitPrice(new BigDecimal("95.00"));
        quote.setCurrency("USD");
        quote.setValidityDate(LocalDate.now().minusDays(5)); // EXPIRED
        quote = quotationRepository.save(quote);

        rfq.setAcceptedQuotationId(quote.getId());
        rfq = rfqRepository.save(rfq);

        String requestJson = String.format("""
                {
                    "rfqId": "%s",
                    "shippingAddress": "123 Pharma Way",
                    "billingContact": "accounts@buyer1.com"
                }
                """, rfq.getId());

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + buyer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("4. IDOR Protection: Buyer cannot create PO using another buyer's RFQ/Quotation")
    public void testBuyerCannotCreatePoFromAnotherBuyerRfq() throws Exception {
        Rfq rfq = createAcceptedRfq(buyer2, supplier1, masterProduct, offering1, new BigDecimal("110.00"), new BigDecimal("500.00"));

        String requestJson = String.format("""
                {
                    "rfqId": "%s",
                    "shippingAddress": "123 Pharma Way",
                    "billingContact": "accounts@buyer1.com"
                }
                """, rfq.getId());

        // Buyer 1 tries to order Buyer 2's RFQ
        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + buyer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("5. Duplicate PO creation from same accepted quotation is strictly prevented")
    public void testDuplicatePoCreationPrevented() throws Exception {
        Rfq rfq = createAcceptedRfq(buyer1, supplier1, masterProduct, offering1, new BigDecimal("110.00"), new BigDecimal("500.00"));

        String requestJson = String.format("""
                {
                    "rfqId": "%s",
                    "shippingAddress": "123 Pharma Way",
                    "billingContact": "accounts@buyer1.com"
                }
                """, rfq.getId());

        // First attempt succeeds
        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + buyer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated());

        // Second attempt is rejected with 409 Conflict
        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + buyer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isConflict());

        assertEquals(1, purchaseOrderRepository.count());
    }

    @Test
    @DisplayName("6. Commercial snapshot immutability: subsequent offering price/stock edits do not change existing PO")
    public void testCommercialSnapshotImmutability() throws Exception {
        Rfq rfq = createAcceptedRfq(buyer1, supplier1, masterProduct, offering1, new BigDecimal("110.00"), new BigDecimal("500.00"));

        String requestJson = String.format("""
                {
                    "rfqId": "%s",
                    "shippingAddress": "123 Pharma Way",
                    "billingContact": "accounts@buyer1.com"
                }
                """, rfq.getId());

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + buyer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated());

        // Later, supplier updates their public offering price and stock
        offering1.setPrice(new BigDecimal("250.00"));
        offering1.setStock(0);
        supplierOfferingRepository.save(offering1);

        // Verify PO remains at original contracted price ₹110.00 and quantity 500
        PurchaseOrder po = purchaseOrderRepository.findByRfqId(rfq.getId()).orElseThrow();
        assertEquals(new BigDecimal("110.0000"), po.getUnitPrice());
        assertEquals(new BigDecimal("500.00"), po.getQuantity());
        assertEquals(new BigDecimal("55000.0000"), po.getTotalAmount());
    }

    @Test
    @DisplayName("7. IDOR: Supplier 2 cannot view or confirm Supplier 1's PO")
    public void testSupplierIdorProtection() throws Exception {
        Rfq rfq = createAcceptedRfq(buyer1, supplier1, masterProduct, offering1, new BigDecimal("110.00"), new BigDecimal("500.00"));

        String requestJson = String.format("""
                {
                    "rfqId": "%s",
                    "shippingAddress": "123 Pharma Way",
                    "billingContact": "accounts@buyer1.com"
                }
                """, rfq.getId());

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + buyer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated());

        PurchaseOrder po = purchaseOrderRepository.findByRfqId(rfq.getId()).orElseThrow();

        // Supplier 1 can view
        mockMvc.perform(get("/api/v1/orders/supplier/" + po.getId())
                        .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isOk());

        // Supplier 2 cannot view (404)
        mockMvc.perform(get("/api/v1/orders/supplier/" + po.getId())
                        .header("Authorization", "Bearer " + supplier2Token))
                .andExpect(status().isNotFound());

        // Supplier 2 cannot confirm (404)
        mockMvc.perform(post("/api/v1/orders/supplier/" + po.getId() + "/confirm")
                        .header("Authorization", "Bearer " + supplier2Token))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("8. Supplier confirmation records timestamp and confirmedBy")
    public void testSupplierConfirmOrder() throws Exception {
        Rfq rfq = createAcceptedRfq(buyer1, supplier1, masterProduct, offering1, new BigDecimal("110.00"), new BigDecimal("500.00"));

        String requestJson = String.format("""
                {
                    "rfqId": "%s",
                    "shippingAddress": "123 Pharma Way",
                    "billingContact": "accounts@buyer1.com"
                }
                """, rfq.getId());

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + buyer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated());

        PurchaseOrder po = purchaseOrderRepository.findByRfqId(rfq.getId()).orElseThrow();

        mockMvc.perform(post("/api/v1/orders/supplier/" + po.getId() + "/confirm")
                        .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CONFIRMED")))
                .andExpect(jsonPath("$.confirmedAt", notNullValue()))
                .andExpect(jsonPath("$.confirmedBy", is("supplier1@synthora.com")));
    }

    @Test
    @DisplayName("9. Supplier can reject eligible PO with reason")
    public void testSupplierRejectOrder() throws Exception {
        Rfq rfq = createAcceptedRfq(buyer1, supplier1, masterProduct, offering1, new BigDecimal("110.00"), new BigDecimal("500.00"));

        String requestJson = String.format("""
                {
                    "rfqId": "%s",
                    "shippingAddress": "123 Pharma Way",
                    "billingContact": "accounts@buyer1.com"
                }
                """, rfq.getId());

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + buyer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated());

        PurchaseOrder po = purchaseOrderRepository.findByRfqId(rfq.getId()).orElseThrow();

        String rejectJson = """
                {
                    "reason": "Raw material shortage in production facility"
                }
                """;

        mockMvc.perform(post("/api/v1/orders/supplier/" + po.getId() + "/reject")
                        .header("Authorization", "Bearer " + supplier1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(rejectJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("REJECTED")))
                .andExpect(jsonPath("$.rejectedAt", notNullValue()))
                .andExpect(jsonPath("$.rejectedBy", is("supplier1@synthora.com")))
                .andExpect(jsonPath("$.rejectionReason", containsString("Raw material shortage")));
    }

    @Test
    @DisplayName("10. Buyer can cancel eligible PO with reason")
    public void testBuyerCancelOrder() throws Exception {
        Rfq rfq = createAcceptedRfq(buyer1, supplier1, masterProduct, offering1, new BigDecimal("110.00"), new BigDecimal("500.00"));

        String requestJson = String.format("""
                {
                    "rfqId": "%s",
                    "shippingAddress": "123 Pharma Way",
                    "billingContact": "accounts@buyer1.com"
                }
                """, rfq.getId());

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + buyer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated());

        PurchaseOrder po = purchaseOrderRepository.findByRfqId(rfq.getId()).orElseThrow();

        String cancelJson = """
                {
                    "reason": "Production project schedule revised"
                }
                """;

        mockMvc.perform(post("/api/v1/orders/" + po.getId() + "/cancel")
                        .header("Authorization", "Bearer " + buyer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cancelJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELLED")))
                .andExpect(jsonPath("$.cancelledAt", notNullValue()))
                .andExpect(jsonPath("$.cancelledBy", is("buyer1@synthora.com")))
                .andExpect(jsonPath("$.cancellationReason", containsString("schedule revised")));
    }

    @Test
    @DisplayName("11. Full End-to-End Status Lifecycle Progression: PLACED -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED -> COMPLETED")
    public void testFullStatusLifecycleProgression() throws Exception {
        Rfq rfq = createAcceptedRfq(buyer1, supplier1, masterProduct, offering1, new BigDecimal("110.00"), new BigDecimal("500.00"));

        String requestJson = String.format("""
                {
                    "rfqId": "%s",
                    "shippingAddress": "123 Pharma Way",
                    "billingContact": "accounts@buyer1.com"
                }
                """, rfq.getId());

        // 1. PLACED
        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + buyer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("PLACED")));

        PurchaseOrder po = purchaseOrderRepository.findByRfqId(rfq.getId()).orElseThrow();

        // 2. CONFIRMED
        mockMvc.perform(post("/api/v1/orders/supplier/" + po.getId() + "/confirm")
                        .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CONFIRMED")));

        // 3. PROCESSING
        mockMvc.perform(post("/api/v1/orders/supplier/" + po.getId() + "/process")
                        .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PROCESSING")));

        // Buyer cannot cancel once in PROCESSING
        String cancelJson = """
                {
                    "reason": "Buyer tries to cancel too late"
                }
                """;
        mockMvc.perform(post("/api/v1/orders/" + po.getId() + "/cancel")
                        .header("Authorization", "Bearer " + buyer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cancelJson))
                .andExpect(status().isConflict());

        // 4. SHIPPED
        String shipJson = """
                {
                    "carrier": "FedEx Freight Logistics",
                    "trackingNumber": "TRK-9876543210",
                    "estimatedDeliveryDate": "2026-09-01"
                }
                """;
        mockMvc.perform(post("/api/v1/orders/supplier/" + po.getId() + "/ship")
                        .header("Authorization", "Bearer " + supplier1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(shipJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SHIPPED")))
                .andExpect(jsonPath("$.shippedAt", notNullValue()));

        // Check Shipment API
        mockMvc.perform(get("/api/v1/orders/" + po.getId() + "/shipment")
                        .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.carrier", is("FedEx Freight Logistics")))
                .andExpect(jsonPath("$.trackingNumber", is("TRK-9876543210")));

        // 5. DELIVERED (Buyer confirms receipt)
        mockMvc.perform(post("/api/v1/orders/" + po.getId() + "/receive")
                        .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("DELIVERED")))
                .andExpect(jsonPath("$.deliveredAt", notNullValue()));

        // 6. COMPLETED
        mockMvc.perform(post("/api/v1/orders/" + po.getId() + "/complete")
                        .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("COMPLETED")))
                .andExpect(jsonPath("$.completedAt", notNullValue()));
    }
}
