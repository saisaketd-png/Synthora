package com.kemkendra.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kemkendra.admin.audit.AuditAction;
import com.kemkendra.admin.audit.AuditLog;
import com.kemkendra.admin.audit.AuditLogRepository;
import com.kemkendra.admin.audit.AuditTargetType;
import com.kemkendra.admin.config.PlatformSetting;
import com.kemkendra.admin.config.PlatformSettingRepository;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.notification.NotificationRepository;
import com.kemkendra.order.OrderStatus;
import com.kemkendra.order.PurchaseOrder;
import com.kemkendra.order.PurchaseOrderRepository;
import com.kemkendra.order.ShipmentRepository;
import com.kemkendra.order.dto.CreatePurchaseOrderRequest;
import com.kemkendra.order.dto.ShipOrderRequest;
import com.kemkendra.product.*;
import com.kemkendra.rfq.Rfq;
import com.kemkendra.rfq.RfqRepository;
import com.kemkendra.rfq.RfqStatus;
import com.kemkendra.rfq.dto.AcceptQuotationRequest;
import com.kemkendra.rfq.dto.CreateCounterOfferRequest;
import com.kemkendra.rfq.dto.CreateQuotationRequest;
import com.kemkendra.rfq.dto.CreateRfqRequest;
import com.kemkendra.rfq.quotation.Quotation;
import com.kemkendra.rfq.quotation.QuotationRepository;
import com.kemkendra.seller.SellerProfile;
import com.kemkendra.seller.SellerProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class TransactionLifecycleSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private SellerProfileRepository sellerProfileRepository;

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
    private NotificationRepository notificationRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private PlatformSettingRepository platformSettingRepository;

    @Autowired
    private com.kemkendra.admin.config.PlatformPolicyService platformPolicyService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User buyerA;
    private User buyerB;
    private User suspendedBuyer;

    private User supplierUserA;
    private Supplier supplierA;
    private User supplierUserB;
    private Supplier supplierB;
    private User suspendedSupplierUser;
    private Supplier suspendedSupplier;

    private MasterProduct masterProductA;
    private SupplierOffering offeringA;

    private String tokenBuyerA;
    private String tokenBuyerB;
    private String tokenSuspendedBuyer;

    private String tokenSupplierA;
    private String tokenSupplierB;
    private String tokenSuspendedSupplier;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
        jdbcTemplate.execute("TRUNCATE TABLE shipments");
        jdbcTemplate.execute("TRUNCATE TABLE purchase_orders");
        jdbcTemplate.execute("TRUNCATE TABLE quotations");
        jdbcTemplate.execute("TRUNCATE TABLE rfqs");
        jdbcTemplate.execute("TRUNCATE TABLE sourcing_requests");
        jdbcTemplate.execute("TRUNCATE TABLE notifications");
        jdbcTemplate.execute("TRUNCATE TABLE audit_logs");
        jdbcTemplate.execute("TRUNCATE TABLE supplier_offerings");
        jdbcTemplate.execute("TRUNCATE TABLE master_products");
        jdbcTemplate.execute("TRUNCATE TABLE seller_profiles");
        jdbcTemplate.execute("TRUNCATE TABLE suppliers");
        jdbcTemplate.execute("TRUNCATE TABLE users");
        jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");

        // Create Buyers
        buyerA = createTestUser("buyer_a_tl@kemkendra.com", "Buyer Alice", UserRole.USER, UserStatus.ACTIVE);
        tokenBuyerA = jwtService.generateToken(buyerA);

        buyerB = createTestUser("buyer_b_tl@kemkendra.com", "Buyer Bob", UserRole.USER, UserStatus.ACTIVE);
        tokenBuyerB = jwtService.generateToken(buyerB);

        suspendedBuyer = createTestUser("buyer_susp_tl@kemkendra.com", "Buyer Suspended", UserRole.USER, UserStatus.SUSPENDED);
        tokenSuspendedBuyer = jwtService.generateToken(suspendedBuyer);

        // Create Suppliers
        supplierUserA = createTestUser("supp_a_tl@kemkendra.com", "Supplier Apex", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierA = createTestSupplier("Apex Pharma Chem", "apex-pharma-chem", supplierUserA, true);
        tokenSupplierA = jwtService.generateToken(supplierUserA);

        supplierUserB = createTestUser("supp_b_tl@kemkendra.com", "Supplier Beacon", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierB = createTestSupplier("Beacon Intermediates", "beacon-intermediates", supplierUserB, true);
        tokenSupplierB = jwtService.generateToken(supplierUserB);

        suspendedSupplierUser = createTestUser("supp_susp_tl@kemkendra.com", "Supplier Suspended", UserRole.SUPPLIER, UserStatus.SUSPENDED);
        suspendedSupplier = createTestSupplier("Suspended Pharma", "suspended-pharma", suspendedSupplierUser, false);
        tokenSuspendedSupplier = jwtService.generateToken(suspendedSupplierUser);

        // Create Master Product
        masterProductA = new MasterProduct();
        masterProductA.setName("Paracetamol USP");
        masterProductA.setCasNumber("103-90-2");
        masterProductA.setMasterProductCode("CHEM-000103");
        masterProductA.setCategory(ProductCategory.API);
        masterProductA.setStatus("ACTIVE");
        masterProductA = masterProductRepository.save(masterProductA);

        // Create Offering
        offeringA = new SupplierOffering();
        offeringA.setSupplier(supplierA);
        offeringA.setMasterProduct(masterProductA);
        offeringA.setGrade("USP");
        offeringA.setPurity(new BigDecimal("99.50"));
        offeringA.setPrice(new BigDecimal("18.50"));
        offeringA.setCurrency("USD");
        offeringA.setStock(500);
        offeringA.setMoqKg(new BigDecimal("50.00"));
        offeringA.setLeadTimeDays(7);
        offeringA.setModerationStatus("APPROVED");
        offeringA.setAvailabilityStatus("AVAILABLE");
        offeringA = supplierOfferingRepository.save(offeringA);
    }

    private User createTestUser(String email, String name, UserRole role, UserStatus status) {
        User user = new User();
        user.setEmail(email);
        user.setName(name);
        user.setPasswordHash(passwordEncoder.encode("Password123!"));
        user.setRole(role);
        user.setStatus(status);
        return userRepository.save(user);
    }

    private Supplier createTestSupplier(String name, String slug, User user, boolean verified) {
        Supplier s = new Supplier();
        s.setName(name);
        s.setSlug(slug);
        s.setCountryCode("IN");
        s.setCountryName("India");
        s.setUser(user);
        s.setVerified(verified);
        s.setExportReady(true);
        Supplier saved = supplierRepository.save(s);

        SellerProfile profile = new SellerProfile();
        profile.setUser(user);
        profile.setCompanyName(name);
        sellerProfileRepository.save(profile);

        return saved;
    }

    // =========================================================================
    // SECTION 1: END-TO-END TRANSACTION PIPELINE & AUDIT RECORDING
    // =========================================================================

    @Test
    @DisplayName("Complete Transaction Pipeline: RFQ -> Quote -> Counter -> Accept -> PO -> Ship -> Receive -> Complete")
    public void testCompleteTransactionLifecyclePipelineWithAudit() throws Exception {

        // 1. Buyer A creates RFQ
        CreateRfqRequest rfqReq = new CreateRfqRequest(
                null,
                masterProductA.getId(),
                offeringA.getId(),
                supplierA.getId(),
                List.of(supplierA.getId()),
                new BigDecimal("100.00"),
                "KG",
                "Target delivery in 2 weeks"
        );

        MvcResult rfqResult = mockMvc.perform(post("/api/v1/rfqs")
                        .header("Authorization", "Bearer " + tokenBuyerA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rfqReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("PENDING")))
                .andReturn();

        String rfqResponseJson = rfqResult.getResponse().getContentAsString();
        UUID rfqId = UUID.fromString(objectMapper.readTree(rfqResponseJson).get("id").asText());

        // Verify RFQ_CREATED audit
        List<AuditLog> rfqAudits = auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AuditTargetType.RFQ, rfqId.toString());
        assertFalse(rfqAudits.isEmpty());
        assertEquals(AuditAction.RFQ_CREATED, rfqAudits.get(0).getAction());
        assertEquals(buyerA.getId(), rfqAudits.get(0).getAdminId());

        // 2. Supplier A accesses RFQ
        mockMvc.perform(get("/api/v1/rfqs/supplier/{id}", rfqId)
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(rfqId.toString())));

        // 3. Supplier A submits Quotation Version 1
        CreateQuotationRequest quoteReq = new CreateQuotationRequest(
                new BigDecimal("17.50"),
                "USD",
                new BigDecimal("50.00"),
                5,
                LocalDate.now().plusDays(15),
                "Fiber drums 25kg",
                "Standard FOB Nhava Sheva"
        );

        MvcResult quoteResult = mockMvc.perform(post("/api/v1/rfqs/supplier/{id}/quotations", rfqId)
                        .header("Authorization", "Bearer " + tokenSupplierA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(quoteReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quotationVersion", is(1)))
                .andExpect(jsonPath("$.unitPrice", is(17.50)))
                .andReturn();

        UUID quoteV1Id = UUID.fromString(objectMapper.readTree(quoteResult.getResponse().getContentAsString()).get("id").asText());

        // Verify QUOTATION_SUBMITTED audit
        List<AuditLog> quoteAudits = auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AuditTargetType.QUOTATION, quoteV1Id.toString());
        assertFalse(quoteAudits.isEmpty());
        assertEquals(AuditAction.QUOTATION_SUBMITTED, quoteAudits.get(0).getAction());
        assertEquals(supplierUserA.getId(), quoteAudits.get(0).getAdminId());

        // 4. Buyer A views Quotation
        mockMvc.perform(get("/api/v1/rfqs/{id}/quotations", rfqId)
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].quotationVersion", is(1)));

        // 5. Buyer A submits Counter-Offer Version 2
        CreateCounterOfferRequest counterReq = new CreateCounterOfferRequest(
                new BigDecimal("16.80"),
                "USD",
                new BigDecimal("100.00"),
                5,
                "Fiber drums 25kg",
                "Can you do $16.80/kg for 100kg batch?"
        );

        MvcResult counterResult = mockMvc.perform(post("/api/v1/rfqs/{id}/counter-offer", rfqId)
                        .header("Authorization", "Bearer " + tokenBuyerA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(counterReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quotationVersion", is(2)))
                .andExpect(jsonPath("$.unitPrice", is(16.80)))
                .andReturn();

        UUID counterQuoteId = UUID.fromString(objectMapper.readTree(counterResult.getResponse().getContentAsString()).get("id").asText());

        // Verify COUNTER_OFFER_SUBMITTED audit
        List<AuditLog> counterAudits = auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AuditTargetType.QUOTATION, counterQuoteId.toString());
        assertFalse(counterAudits.isEmpty());
        assertEquals(AuditAction.COUNTER_OFFER_SUBMITTED, counterAudits.get(0).getAction());
        assertEquals(buyerA.getId(), counterAudits.get(0).getAdminId());

        // 6. Supplier A accepts Counter-Offer Version 2
        AcceptQuotationRequest acceptReq = new AcceptQuotationRequest("Accepted counter-offer price of $16.80");
        mockMvc.perform(post("/api/v1/rfqs/supplier/{id}/quotations/{qId}/accept", rfqId, counterQuoteId)
                        .header("Authorization", "Bearer " + tokenSupplierA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(acceptReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decision", is("ACCEPTED")));

        // Verify QUOTATION_ACCEPTED audit
        List<AuditLog> acceptAudits = auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AuditTargetType.QUOTATION, counterQuoteId.toString());
        assertTrue(acceptAudits.stream().anyMatch(a -> a.getAction() == AuditAction.QUOTATION_ACCEPTED));

        // 7. Buyer A issues Purchase Order from Accepted Quotation
        CreatePurchaseOrderRequest poReq = new CreatePurchaseOrderRequest(
                rfqId,
                "Industrial Area Phase 2, Plot 45, Mumbai, MH, 400072",
                "accounts@buyer-a.com",
                "Urgent production dispatch required",
                "Net 30 Days",
                "Door Delivery",
                "CIP"
        );

        MvcResult poResult = mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + tokenBuyerA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(poReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("PLACED")))
                .andExpect(jsonPath("$.totalAmount", is(1680.00)))
                .andExpect(jsonPath("$.currency", is("USD")))
                .andReturn();

        UUID poId = UUID.fromString(objectMapper.readTree(poResult.getResponse().getContentAsString()).get("id").asText());

        // Verify PO_ISSUED audit
        List<AuditLog> poAudits = auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AuditTargetType.PURCHASE_ORDER, poId.toString());
        assertFalse(poAudits.isEmpty());
        assertEquals(AuditAction.PO_ISSUED, poAudits.get(0).getAction());
        assertEquals(buyerA.getId(), poAudits.get(0).getAdminId());

        // 8. Supplier A confirms PO
        mockMvc.perform(post("/api/v1/orders/supplier/{id}/confirm", poId)
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CONFIRMED")));

        // 9. Supplier A starts processing PO
        mockMvc.perform(post("/api/v1/orders/supplier/{id}/process", poId)
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PROCESSING")));

        // 10. Supplier A dispatches Shipment
        ShipOrderRequest shipReq = new ShipOrderRequest(
                "BlueDart Express",
                "BLUEDART-IND-998877",
                LocalDate.now().plusDays(3)
        );

        mockMvc.perform(post("/api/v1/orders/supplier/{id}/ship", poId)
                        .header("Authorization", "Bearer " + tokenSupplierA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(shipReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SHIPPED")));

        // Verify PO_SHIPPED audit
        List<AuditLog> shipAudits = auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AuditTargetType.PURCHASE_ORDER, poId.toString());
        assertTrue(shipAudits.stream().anyMatch(a -> a.getAction() == AuditAction.PO_SHIPPED));

        // 11. Buyer A confirms receipt of goods
        mockMvc.perform(post("/api/v1/orders/{id}/receive", poId)
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("DELIVERED")));

        // Verify ORDER_RECEIPT_CONFIRMED audit
        List<AuditLog> receiveAudits = auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AuditTargetType.PURCHASE_ORDER, poId.toString());
        assertTrue(receiveAudits.stream().anyMatch(a -> a.getAction() == AuditAction.ORDER_RECEIPT_CONFIRMED));

        // 12. Buyer A marks order complete
        mockMvc.perform(post("/api/v1/orders/{id}/complete", poId)
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("COMPLETED")));

        // Verify PO_COMPLETED audit
        List<AuditLog> completeAudits = auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AuditTargetType.PURCHASE_ORDER, poId.toString());
        assertTrue(completeAudits.stream().anyMatch(a -> a.getAction() == AuditAction.PO_COMPLETED));

        // Verify notifications generated
        assertTrue(notificationRepository.count() > 0);
    }

    // =========================================================================
    // SECTION 2: AUTHENTICATION, RBAC & IDOR SECURITY TESTS
    // =========================================================================

    @Test
    @DisplayName("Unauthenticated requests to transaction endpoints return 401")
    public void testUnauthenticatedAccessReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/rfqs/my"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/orders"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/orders/supplier"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("RBAC: Buyer cannot perform supplier-only operations")
    public void testBuyerCannotPerformSupplierOperations() throws Exception {
        UUID randomId = UUID.randomUUID();

        mockMvc.perform(post("/api/v1/orders/supplier/{id}/confirm", randomId)
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/orders/supplier/{id}/ship", randomId)
                        .header("Authorization", "Bearer " + tokenBuyerA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"carrier\":\"DHL\",\"trackingNumber\":\"12345\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("RBAC: Supplier cannot perform buyer-only operations")
    public void testSupplierCannotPerformBuyerOperations() throws Exception {
        UUID randomId = UUID.randomUUID();

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + tokenSupplierA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rfqId\":\"" + randomId + "\",\"shippingAddress\":\"123 Main St\",\"billingContact\":\"buyer@test.com\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/orders/{id}/cancel", randomId)
                        .header("Authorization", "Bearer " + tokenSupplierA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Valid cancellation reason text\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("IDOR: Buyer B cannot access or cancel Buyer A's RFQ (404)")
    public void testBuyerCannotAccessOtherBuyerRfq() throws Exception {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyerA.getId());
        rfq.setMasterProductId(masterProductA.getId());
        rfq.setSupplierId(supplierA.getId());
        rfq.setQuantity(new BigDecimal("100"));
        rfq.setUnit("KG");
        rfq.setStatus(RfqStatus.PENDING);
        rfq = rfqRepository.save(rfq);

        mockMvc.perform(get("/api/v1/rfqs/{id}", rfq.getId())
                        .header("Authorization", "Bearer " + tokenBuyerB))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v1/rfqs/{id}/cancel", rfq.getId())
                        .header("Authorization", "Bearer " + tokenBuyerB))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("IDOR: Supplier B cannot access or quote Supplier A's RFQ (404)")
    public void testSupplierCannotAccessOtherSupplierRfq() throws Exception {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyerA.getId());
        rfq.setMasterProductId(masterProductA.getId());
        rfq.setSupplierId(supplierA.getId());
        rfq.setQuantity(new BigDecimal("100"));
        rfq.setUnit("KG");
        rfq.setStatus(RfqStatus.PENDING);
        rfq = rfqRepository.save(rfq);

        mockMvc.perform(get("/api/v1/rfqs/supplier/{id}", rfq.getId())
                        .header("Authorization", "Bearer " + tokenSupplierB))
                .andExpect(status().isNotFound());

        CreateQuotationRequest quoteReq = new CreateQuotationRequest(
                new BigDecimal("20.00"), "USD", new BigDecimal("50.00"), 5, LocalDate.now().plusDays(10), "Drums", "FOB"
        );

        mockMvc.perform(post("/api/v1/rfqs/supplier/{id}/quotations", rfq.getId())
                        .header("Authorization", "Bearer " + tokenSupplierB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(quoteReq)))
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // SECTION 3: STATE MACHINE & DUPLICATE PROTECTIONS
    // =========================================================================

    @Test
    @DisplayName("State machine: Cannot issue PO for unaccepted RFQ")
    public void testCannotIssuePoForUnacceptedRfq() throws Exception {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyerA.getId());
        rfq.setMasterProductId(masterProductA.getId());
        rfq.setSupplierId(supplierA.getId());
        rfq.setQuantity(new BigDecimal("100"));
        rfq.setUnit("KG");
        rfq.setStatus(RfqStatus.QUOTED); // Not yet accepted!
        rfq = rfqRepository.save(rfq);

        Quotation q = new Quotation();
        q.setRfq(rfq);
        q.setQuotationVersion(1);
        q.setUnitPrice(new BigDecimal("15.00"));
        q.setCurrency("USD");
        q.setValidityDate(LocalDate.now().plusDays(30));
        q = quotationRepository.save(q);

        CreatePurchaseOrderRequest poReq = new CreatePurchaseOrderRequest(
                rfq.getId(),
                "123 Main St",
                "buyer@test.com",
                "Notes",
                "Net 30",
                "Door Delivery",
                "FOB"
        );

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + tokenBuyerA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(poReq)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("Duplicate Protection: Cannot issue duplicate PO for same RFQ")
    public void testCannotIssueDuplicatePoForSameRfq() throws Exception {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyerA.getId());
        rfq.setMasterProductId(masterProductA.getId());
        rfq.setSupplierId(supplierA.getId());
        rfq.setQuantity(new BigDecimal("100"));
        rfq.setUnit("KG");
        rfq.setStatus(RfqStatus.ACCEPTED);
        rfq = rfqRepository.save(rfq);

        Quotation q = new Quotation();
        q.setRfq(rfq);
        q.setQuotationVersion(1);
        q.setUnitPrice(new BigDecimal("15.00"));
        q.setCurrency("USD");
        q.setValidityDate(LocalDate.now().plusDays(30));
        q = quotationRepository.save(q);
        rfq.setAcceptedQuotationId(q.getId());
        rfqRepository.save(rfq);

        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber("PO-2026-9999");
        po.setRfqId(rfq.getId());
        po.setQuotationId(q.getId());
        po.setBuyerId(buyerA.getId());
        po.setSupplierId(supplierA.getId());
        po.setQuantity(new BigDecimal("100"));
        po.setUnit("KG");
        po.setUnitPrice(new BigDecimal("15.00"));
        po.setTotalAmount(new BigDecimal("1500.00"));
        po.setCurrency("USD");
        po.setShippingAddress("123 Street");
        po.setBillingContact("accounts@buyer.com");
        po.setStatus(OrderStatus.PLACED);
        po.setPlacedAt(java.time.LocalDateTime.now());
        purchaseOrderRepository.save(po);

        CreatePurchaseOrderRequest poReq = new CreatePurchaseOrderRequest(
                rfq.getId(),
                "123 Street",
                "accounts@buyer.com",
                "Notes",
                "Net 30",
                "Door Delivery",
                "FOB"
        );

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + tokenBuyerA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(poReq)))
                .andExpect(status().is4xxClientError());
    }

    // =========================================================================
    // SECTION 4: SUSPENDED ACCOUNTS PROTECTION
    // =========================================================================

    @Test
    @DisplayName("Suspended buyer cannot create RFQ")
    public void testSuspendedBuyerCannotCreateRfq() throws Exception {
        CreateRfqRequest rfqReq = new CreateRfqRequest(
                null,
                masterProductA.getId(),
                offeringA.getId(),
                supplierA.getId(),
                List.of(supplierA.getId()),
                new BigDecimal("50.00"),
                "KG",
                "Trying to create RFQ while suspended"
        );

        mockMvc.perform(post("/api/v1/rfqs")
                        .header("Authorization", "Bearer " + tokenSuspendedBuyer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rfqReq)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("Suspended supplier cannot submit quotation")
    public void testSuspendedSupplierCannotSubmitQuotation() throws Exception {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyerA.getId());
        rfq.setMasterProductId(masterProductA.getId());
        rfq.setSupplierId(suspendedSupplier.getId());
        rfq.setQuantity(new BigDecimal("100"));
        rfq.setUnit("KG");
        rfq.setStatus(RfqStatus.PENDING);
        rfq = rfqRepository.save(rfq);

        CreateQuotationRequest quoteReq = new CreateQuotationRequest(
                new BigDecimal("19.00"), "USD", new BigDecimal("50.00"), 5, LocalDate.now().plusDays(10), "Drums", "FOB"
        );

        mockMvc.perform(post("/api/v1/rfqs/supplier/{id}/quotations", rfq.getId())
                        .header("Authorization", "Bearer " + tokenSuspendedSupplier)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(quoteReq)))
                .andExpect(status().is4xxClientError());
    }

    // =========================================================================
    // SECTION 5: BUYER RFQ DAILY LIMIT ENFORCEMENT
    // =========================================================================

    @Test
    @DisplayName("Policy Enforcement: BUYER_RFQ_DAILY_LIMIT restricts excessive RFQs per day")
    public void testBuyerRfqDailyLimitEnforced() throws Exception {
        // Set daily limit to 2 using PlatformPolicyService
        platformPolicyService.updateSetting(
                "BUYER_RFQ_DAILY_LIMIT",
                new com.kemkendra.admin.config.dto.AdminConfigDtos.UpdatePlatformSettingRequest("2"),
                "admin@kemkendra.com"
        );

        CreateRfqRequest req1 = new CreateRfqRequest(
                null, masterProductA.getId(), offeringA.getId(), supplierA.getId(), List.of(supplierA.getId()), new BigDecimal("10"), "KG", "RFQ 1"
        );
        CreateRfqRequest req2 = new CreateRfqRequest(
                null, masterProductA.getId(), offeringA.getId(), supplierA.getId(), List.of(supplierA.getId()), new BigDecimal("20"), "KG", "RFQ 2"
        );
        CreateRfqRequest req3 = new CreateRfqRequest(
                null, masterProductA.getId(), offeringA.getId(), supplierA.getId(), List.of(supplierA.getId()), new BigDecimal("30"), "KG", "RFQ 3"
        );

        // 1st RFQ -> Allowed
        mockMvc.perform(post("/api/v1/rfqs")
                        .header("Authorization", "Bearer " + tokenBuyerA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        // 2nd RFQ -> Allowed
        mockMvc.perform(post("/api/v1/rfqs")
                        .header("Authorization", "Bearer " + tokenBuyerA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isCreated());

        // 3rd RFQ -> Rejected (Daily limit reached)
        mockMvc.perform(post("/api/v1/rfqs")
                        .header("Authorization", "Bearer " + tokenBuyerA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req3)))
                .andExpect(status().is4xxClientError());

        // Buyer B has independent daily limit -> Allowed
        mockMvc.perform(post("/api/v1/rfqs")
                        .header("Authorization", "Bearer " + tokenBuyerB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        // Dynamically increase limit to 10 -> Buyer A can now submit 3rd RFQ
        platformPolicyService.updateSetting(
                "BUYER_RFQ_DAILY_LIMIT",
                new com.kemkendra.admin.config.dto.AdminConfigDtos.UpdatePlatformSettingRequest("10"),
                "admin@kemkendra.com"
        );

        mockMvc.perform(post("/api/v1/rfqs")
                        .header("Authorization", "Bearer " + tokenBuyerA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req3)))
                .andExpect(status().isCreated());
    }
}
