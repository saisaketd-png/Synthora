package com.synthora.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.notification.Notification;
import com.synthora.notification.NotificationRepository;
import com.synthora.notification.NotificationType;
import com.synthora.order.OrderStatus;
import com.synthora.order.PurchaseOrder;
import com.synthora.order.PurchaseOrderRepository;
import com.synthora.order.ShipmentRepository;
import com.synthora.order.dto.RejectPurchaseOrderRequest;
import com.synthora.order.dto.ShipOrderRequest;
import com.synthora.product.Product;
import com.synthora.product.ProductCategory;
import com.synthora.product.ProductRepository;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.rfq.Rfq;
import com.synthora.rfq.RfqRepository;
import com.synthora.rfq.RfqStatus;
import com.synthora.rfq.quotation.Quotation;
import com.synthora.rfq.quotation.QuotationRepository;
import com.synthora.seller.SellerProfile;
import com.synthora.seller.SellerProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class PurchaseOrderFulfillmentSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private SellerProfileRepository sellerProfileRepository;

    @Autowired
    private ProductRepository productRepository;

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
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private LoginRateLimiterService rateLimiterService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User buyerA;
    private String tokenBuyerA;

    private User buyerB;
    private String tokenBuyerB;

    private User supplierUserA;
    private Supplier supplierA;
    private String tokenSupplierA;

    private User supplierUserB;
    private Supplier supplierB;
    private String tokenSupplierB;

    private Product productA;
    private Rfq rfqA;
    private Quotation quotationA;
    private PurchaseOrder poA;

    @BeforeEach
    public void setup() {
        rateLimiterService.resetAll();
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM users;");

        // Buyers
        buyerA = createTestUser("buyer_a_po@synthora.com", "Buyer A", UserRole.USER);
        tokenBuyerA = jwtService.generateToken(buyerA);

        buyerB = createTestUser("buyer_b_po@synthora.com", "Buyer B", UserRole.USER);
        tokenBuyerB = jwtService.generateToken(buyerB);

        // Suppliers
        supplierUserA = createTestUser("supplier_a_po@synthora.com", "Supplier User A", UserRole.SUPPLIER);
        supplierA = createTestSupplier("Pharma Supplier A", "pharma-supplier-a", supplierUserA);
        tokenSupplierA = jwtService.generateToken(supplierUserA);

        supplierUserB = createTestUser("supplier_b_po@synthora.com", "Supplier User B", UserRole.SUPPLIER);
        supplierB = createTestSupplier("Pharma Supplier B", "pharma-supplier-b", supplierUserB);
        tokenSupplierB = jwtService.generateToken(supplierUserB);

        // Product
        productA = new Product();
        productA.setName("Ascorbic Acid USP");
        productA.setDescription("High purity Vitamin C");
        productA.setPrice(new BigDecimal("25.00"));
        productA.setStock(1000);
        productA.setCategory(ProductCategory.API);
        productA.setSeller(supplierUserA);
        productA.setMoqKg(new BigDecimal("25.00"));
        productA.setAvailabilityStatus("IN_STOCK");
        productA = productRepository.save(productA);

        // RFQ
        rfqA = new Rfq();
        rfqA.setBuyerId(buyerA.getId());
        rfqA.setProductId(productA.getId());
        rfqA.setSupplierId(supplierA.getId());
        rfqA.setQuantity(new BigDecimal("100"));
        rfqA.setUnit("KG");
        rfqA.setStatus(RfqStatus.ACCEPTED);
        rfqA = rfqRepository.save(rfqA);

        // Quotation
        quotationA = new Quotation();
        quotationA.setRfq(rfqA);
        quotationA.setQuotationVersion(1);
        quotationA.setUnitPrice(new BigDecimal("24.50"));
        quotationA.setCurrency("USD");
        quotationA.setMinimumOrderQuantity(new BigDecimal("25.00"));
        quotationA.setLeadTimeDays(10);
        quotationA.setValidityDate(LocalDate.now().plusMonths(1));
        quotationA = quotationRepository.save(quotationA);

        rfqA.setAcceptedQuotationId(quotationA.getId());
        rfqA = rfqRepository.save(rfqA);

        // PO in PLACED status
        poA = new PurchaseOrder();
        poA.setPoNumber("PO-2026-0001");
        poA.setRfqId(rfqA.getId());
        poA.setQuotationId(quotationA.getId());
        poA.setBuyerId(buyerA.getId());
        poA.setSupplierId(supplierA.getId());
        poA.setProductId(productA.getId());
        poA.setProductName(productA.getName());
        poA.setQuantity(new BigDecimal("100"));
        poA.setUnit("KG");
        poA.setUnitPrice(new BigDecimal("24.50"));
        poA.setTotalAmount(new BigDecimal("2450.00"));
        poA.setCurrency("USD");
        poA.setShippingAddress("123 Industrial Ave, Boston MA");
        poA.setBillingContact("accounts@buyera.com");
        poA.setStatus(OrderStatus.PLACED);
        poA.setPlacedAt(LocalDateTime.now());
        poA = purchaseOrderRepository.save(poA);
    }

    private User createTestUser(String email, String name, UserRole role) {
        User user = new User();
        user.setEmail(email);
        user.setName(name);
        user.setPasswordHash(passwordEncoder.encode("Password123!"));
        user.setRole(role);
        user.setStatus(UserStatus.ACTIVE);
        return userRepository.save(user);
    }

    private Supplier createTestSupplier(String name, String slug, User user) {
        Supplier s = new Supplier();
        s.setName(name);
        s.setSlug(slug);
        s.setCountryCode("US");
        s.setCountryName("United States");
        s.setUser(user);
        s.setVerified(true);
        s.setExportReady(true);
        Supplier saved = supplierRepository.save(s);

        SellerProfile profile = new SellerProfile();
        profile.setUser(user);
        profile.setCompanyName(name);
        sellerProfileRepository.save(profile);

        return saved;
    }

    // =========================================================================
    // SECTION 1: SUPPLIER ACTIONS & VALIDATIONS
    // =========================================================================

    @Test
    @DisplayName("1. Authorized supplier confirms own PLACED PO -> CONFIRMED (200)")
    public void testSupplierConfirmsOwnPo() throws Exception {
        mockMvc.perform(post("/api/v1/orders/supplier/{id}/confirm", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CONFIRMED")))
                .andExpect(jsonPath("$.confirmedAt").isNotEmpty());

        PurchaseOrder updated = purchaseOrderRepository.findById(poA.getId()).orElseThrow();
        assertEquals(OrderStatus.CONFIRMED, updated.getStatus());
        assertNotNull(updated.getConfirmedAt());
    }

    @Test
    @DisplayName("2. Unauthorized supplier cannot confirm another supplier's PO (404)")
    public void testUnauthorizedSupplierCannotConfirmPo() throws Exception {
        mockMvc.perform(post("/api/v1/orders/supplier/{id}/confirm", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierB))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("3. Supplier cannot start processing a PLACED PO (400)")
    public void testSupplierCannotProcessPlacedPo() throws Exception {
        mockMvc.perform(post("/api/v1/orders/supplier/{id}/process", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Cannot start processing order in status: PLACED")));
    }

    @Test
    @DisplayName("4. Authorized supplier starts processing a CONFIRMED PO -> PROCESSING (200)")
    public void testSupplierStartsProcessingConfirmedPo() throws Exception {
        poA.setStatus(OrderStatus.CONFIRMED);
        poA.setConfirmedAt(LocalDateTime.now());
        purchaseOrderRepository.save(poA);

        mockMvc.perform(post("/api/v1/orders/supplier/{id}/process", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PROCESSING")))
                .andExpect(jsonPath("$.processingAt").isNotEmpty());

        PurchaseOrder updated = purchaseOrderRepository.findById(poA.getId()).orElseThrow();
        assertEquals(OrderStatus.PROCESSING, updated.getStatus());
        assertNotNull(updated.getProcessingAt());
    }

    @Test
    @DisplayName("5. Supplier cannot start processing twice (400)")
    public void testSupplierCannotProcessTwice() throws Exception {
        poA.setStatus(OrderStatus.CONFIRMED);
        purchaseOrderRepository.save(poA);

        // First transition
        mockMvc.perform(post("/api/v1/orders/supplier/{id}/process", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isOk());

        // Second transition attempt
        mockMvc.perform(post("/api/v1/orders/supplier/{id}/process", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Cannot start processing order in status: PROCESSING")));
    }

    @Test
    @DisplayName("6. Authorized supplier marks PROCESSING PO as SHIPPED (200)")
    public void testSupplierShipsProcessingPo() throws Exception {
        poA.setStatus(OrderStatus.PROCESSING);
        poA.setProcessingAt(LocalDateTime.now());
        purchaseOrderRepository.save(poA);

        ShipOrderRequest req = new ShipOrderRequest("DHL Global Forwarding", "TRK-987654321", LocalDate.now().plusDays(5));

        mockMvc.perform(post("/api/v1/orders/supplier/{id}/ship", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SHIPPED")))
                .andExpect(jsonPath("$.shippedAt").isNotEmpty());

        PurchaseOrder updated = purchaseOrderRepository.findById(poA.getId()).orElseThrow();
        assertEquals(OrderStatus.SHIPPED, updated.getStatus());
        assertNotNull(updated.getShippedAt());
        assertTrue(shipmentRepository.findByPurchaseOrderId(poA.getId()).isPresent());
    }

    @Test
    @DisplayName("7. Supplier cannot ship CONFIRMED PO directly (400)")
    public void testSupplierCannotShipConfirmedPoDirectly() throws Exception {
        poA.setStatus(OrderStatus.CONFIRMED);
        purchaseOrderRepository.save(poA);

        ShipOrderRequest req = new ShipOrderRequest("DHL", "TRK-12345", LocalDate.now().plusDays(3));

        mockMvc.perform(post("/api/v1/orders/supplier/{id}/ship", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Cannot ship order in status: CONFIRMED")));
    }

    @Test
    @DisplayName("8. Supplier cannot ship PLACED PO directly (400)")
    public void testSupplierCannotShipPlacedPoDirectly() throws Exception {
        ShipOrderRequest req = new ShipOrderRequest("DHL", "TRK-12345", LocalDate.now().plusDays(3));

        mockMvc.perform(post("/api/v1/orders/supplier/{id}/ship", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Cannot ship order in status: PLACED")));
    }

    @Test
    @DisplayName("9. Supplier cannot ship another supplier's PO (404)")
    public void testSupplierCannotShipOtherSupplierPo() throws Exception {
        poA.setStatus(OrderStatus.PROCESSING);
        purchaseOrderRepository.save(poA);

        ShipOrderRequest req = new ShipOrderRequest("DHL", "TRK-12345", LocalDate.now().plusDays(3));

        mockMvc.perform(post("/api/v1/orders/supplier/{id}/ship", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // SECTION 2: SUPPLIER REJECTION WORKFLOW
    // =========================================================================

    @Test
    @DisplayName("10. Supplier can reject PLACED PO with valid reason -> REJECTED (200)")
    public void testSupplierRejectsPlacedPo() throws Exception {
        RejectPurchaseOrderRequest req = new RejectPurchaseOrderRequest("Material out of stock for the requested batch volume.");

        mockMvc.perform(post("/api/v1/orders/supplier/{id}/reject", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("REJECTED")))
                .andExpect(jsonPath("$.rejectionReason", is("Material out of stock for the requested batch volume.")))
                .andExpect(jsonPath("$.rejectedAt").isNotEmpty());

        PurchaseOrder updated = purchaseOrderRepository.findById(poA.getId()).orElseThrow();
        assertEquals(OrderStatus.REJECTED, updated.getStatus());
        assertEquals("Material out of stock for the requested batch volume.", updated.getRejectionReason());
        assertNotNull(updated.getRejectedAt());
    }

    @Test
    @DisplayName("11. Supplier can reject CONFIRMED PO prior to fulfillment -> REJECTED (200)")
    public void testSupplierRejectsConfirmedPo() throws Exception {
        poA.setStatus(OrderStatus.CONFIRMED);
        purchaseOrderRepository.save(poA);

        RejectPurchaseOrderRequest req = new RejectPurchaseOrderRequest("Unable to meet export regulatory requirements for this shipment.");

        mockMvc.perform(post("/api/v1/orders/supplier/{id}/reject", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("REJECTED")))
                .andExpect(jsonPath("$.rejectionReason", containsString("export regulatory requirements")));
    }

    @Test
    @DisplayName("12. Supplier cannot reject PROCESSING PO (400)")
    public void testSupplierCannotRejectProcessingPo() throws Exception {
        poA.setStatus(OrderStatus.PROCESSING);
        purchaseOrderRepository.save(poA);

        RejectPurchaseOrderRequest req = new RejectPurchaseOrderRequest("Want to cancel during processing.");

        mockMvc.perform(post("/api/v1/orders/supplier/{id}/reject", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Cannot reject order in status: PROCESSING")));
    }

    @Test
    @DisplayName("13. Supplier cannot reject SHIPPED PO (400)")
    public void testSupplierCannotRejectShippedPo() throws Exception {
        poA.setStatus(OrderStatus.SHIPPED);
        purchaseOrderRepository.save(poA);

        RejectPurchaseOrderRequest req = new RejectPurchaseOrderRequest("Want to cancel after shipment.");

        mockMvc.perform(post("/api/v1/orders/supplier/{id}/reject", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Cannot reject order in status: SHIPPED")));
    }

    @Test
    @DisplayName("14. Supplier cannot reject DELIVERED PO (400)")
    public void testSupplierCannotRejectDeliveredPo() throws Exception {
        poA.setStatus(OrderStatus.DELIVERED);
        purchaseOrderRepository.save(poA);

        RejectPurchaseOrderRequest req = new RejectPurchaseOrderRequest("Want to cancel after delivery.");

        mockMvc.perform(post("/api/v1/orders/supplier/{id}/reject", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Cannot reject order in status: DELIVERED")));
    }

    @Test
    @DisplayName("15. Supplier cannot reject with empty/blank reason (400)")
    public void testSupplierCannotRejectWithBlankReason() throws Exception {
        RejectPurchaseOrderRequest req = new RejectPurchaseOrderRequest("   ");

        mockMvc.perform(post("/api/v1/orders/supplier/{id}/reject", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("16. Supplier cannot reject with too short reason (<5 chars) (400)")
    public void testSupplierCannotRejectWithShortReason() throws Exception {
        RejectPurchaseOrderRequest req = new RejectPurchaseOrderRequest("No");

        mockMvc.perform(post("/api/v1/orders/supplier/{id}/reject", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // SECTION 3: BUYER ACTIONS & RECEIPT CONFIRMATION
    // =========================================================================

    @Test
    @DisplayName("17. Authorized buyer confirms receipt of SHIPPED PO -> DELIVERED (200)")
    public void testBuyerConfirmsReceiptShippedPo() throws Exception {
        poA.setStatus(OrderStatus.SHIPPED);
        poA.setShippedAt(LocalDateTime.now());
        purchaseOrderRepository.save(poA);

        mockMvc.perform(post("/api/v1/orders/{id}/receive", poA.getId())
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("DELIVERED")))
                .andExpect(jsonPath("$.deliveredAt").isNotEmpty());

        PurchaseOrder updated = purchaseOrderRepository.findById(poA.getId()).orElseThrow();
        assertEquals(OrderStatus.DELIVERED, updated.getStatus());
        assertNotNull(updated.getDeliveredAt());
    }

    @Test
    @DisplayName("18. Buyer cannot confirm receipt of PLACED PO (409)")
    public void testBuyerCannotConfirmReceiptPlacedPo() throws Exception {
        mockMvc.perform(post("/api/v1/orders/{id}/receive", poA.getId())
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Cannot confirm receipt for order in status: PLACED")));
    }

    @Test
    @DisplayName("19. Buyer cannot confirm receipt of CONFIRMED PO (409)")
    public void testBuyerCannotConfirmReceiptConfirmedPo() throws Exception {
        poA.setStatus(OrderStatus.CONFIRMED);
        purchaseOrderRepository.save(poA);

        mockMvc.perform(post("/api/v1/orders/{id}/receive", poA.getId())
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Cannot confirm receipt for order in status: CONFIRMED")));
    }

    @Test
    @DisplayName("20. Buyer cannot confirm receipt of PROCESSING PO (409)")
    public void testBuyerCannotConfirmReceiptProcessingPo() throws Exception {
        poA.setStatus(OrderStatus.PROCESSING);
        purchaseOrderRepository.save(poA);

        mockMvc.perform(post("/api/v1/orders/{id}/receive", poA.getId())
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Cannot confirm receipt for order in status: PROCESSING")));
    }

    @Test
    @DisplayName("21. Buyer B cannot confirm receipt of Buyer A's PO (IDOR defense: 404)")
    public void testBuyerBCannotConfirmReceiptBuyerAPo() throws Exception {
        poA.setStatus(OrderStatus.SHIPPED);
        purchaseOrderRepository.save(poA);

        mockMvc.perform(post("/api/v1/orders/{id}/receive", poA.getId())
                        .header("Authorization", "Bearer " + tokenBuyerB))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("22. Buyer cannot invoke supplier fulfillment endpoints (403)")
    public void testBuyerCannotCallSupplierEndpoints() throws Exception {
        mockMvc.perform(post("/api/v1/orders/supplier/{id}/process", poA.getId())
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/orders/supplier/{id}/confirm", poA.getId())
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/orders/supplier/{id}/reject", poA.getId())
                        .header("Authorization", "Bearer " + tokenBuyerA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RejectPurchaseOrderRequest("Reason valid"))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("23. Supplier cannot invoke buyer receive endpoint (403)")
    public void testSupplierCannotCallBuyerReceiveEndpoint() throws Exception {
        poA.setStatus(OrderStatus.SHIPPED);
        purchaseOrderRepository.save(poA);

        mockMvc.perform(post("/api/v1/orders/{id}/receive", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // SECTION 4: FULL STATE-MACHINE FLOW & TERMINAL INTEGRITY
    // =========================================================================

    @Test
    @DisplayName("24-27. Full End-to-End State Machine Flow: PLACED -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED")
    public void testFullStateTransitionLifecycle() throws Exception {
        // 1. PLACED -> CONFIRMED
        mockMvc.perform(post("/api/v1/orders/supplier/{id}/confirm", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CONFIRMED")));

        // 2. CONFIRMED -> PROCESSING
        mockMvc.perform(post("/api/v1/orders/supplier/{id}/process", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PROCESSING")));

        // 3. PROCESSING -> SHIPPED
        ShipOrderRequest shipReq = new ShipOrderRequest("FedEx Freight", "TRK-00112233", LocalDate.now().plusDays(4));
        mockMvc.perform(post("/api/v1/orders/supplier/{id}/ship", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(shipReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SHIPPED")));

        // 4. SHIPPED -> DELIVERED
        mockMvc.perform(post("/api/v1/orders/{id}/receive", poA.getId())
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("DELIVERED")));

        PurchaseOrder finalPo = purchaseOrderRepository.findById(poA.getId()).orElseThrow();
        assertEquals(OrderStatus.DELIVERED, finalPo.getStatus());
        assertNotNull(finalPo.getConfirmedAt());
        assertNotNull(finalPo.getProcessingAt());
        assertNotNull(finalPo.getShippedAt());
        assertNotNull(finalPo.getDeliveredAt());
    }

    @Test
    @DisplayName("28. Terminal DELIVERED state cannot transition backwards (400)")
    public void testTerminalDeliveredStateCannotTransition() throws Exception {
        poA.setStatus(OrderStatus.DELIVERED);
        purchaseOrderRepository.save(poA);

        mockMvc.perform(post("/api/v1/orders/supplier/{id}/process", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/v1/orders/{id}/receive", poA.getId())
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("29. REJECTED state cannot enter fulfillment (400)")
    public void testRejectedStateCannotFulfill() throws Exception {
        poA.setStatus(OrderStatus.REJECTED);
        poA.setRejectionReason("Rejected due to supply constraint");
        purchaseOrderRepository.save(poA);

        mockMvc.perform(post("/api/v1/orders/supplier/{id}/process", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/v1/orders/supplier/{id}/confirm", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("30. Missing JWT authentication returns 401 Unauthorized")
    public void testUnauthenticatedRequestsRejected() throws Exception {
        mockMvc.perform(post("/api/v1/orders/supplier/{id}/confirm", poA.getId()))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/orders/{id}/receive", poA.getId()))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // SECTION 5: NOTIFICATIONS & AUDIT EVENTS
    // =========================================================================

    @Test
    @DisplayName("31. Supplier confirmation produces PO_CONFIRMED notification for Buyer")
    public void testConfirmationNotification() throws Exception {
        mockMvc.perform(post("/api/v1/orders/supplier/{id}/confirm", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isOk());

        List<Notification> notifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(
                buyerA.getId(), PageRequest.of(0, 10)).getContent();

        assertEquals(1, notifs.size());
        assertEquals(NotificationType.PO_CONFIRMED, notifs.get(0).getType());
        assertEquals("Purchase Order Confirmed", notifs.get(0).getTitle());
    }

    @Test
    @DisplayName("32. Starting processing produces ORDER_PROCESSING_STARTED notification for Buyer")
    public void testProcessingNotification() throws Exception {
        poA.setStatus(OrderStatus.CONFIRMED);
        purchaseOrderRepository.save(poA);

        mockMvc.perform(post("/api/v1/orders/supplier/{id}/process", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isOk());

        List<Notification> notifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(
                buyerA.getId(), PageRequest.of(0, 10)).getContent();

        assertEquals(1, notifs.size());
        assertEquals(NotificationType.ORDER_PROCESSING_STARTED, notifs.get(0).getType());
    }

    @Test
    @DisplayName("33. Order shipment produces ORDER_SHIPPED notification for Buyer")
    public void testShipmentNotification() throws Exception {
        poA.setStatus(OrderStatus.PROCESSING);
        purchaseOrderRepository.save(poA);

        ShipOrderRequest req = new ShipOrderRequest("UPS Freight", "TRK-998877", LocalDate.now().plusDays(2));
        mockMvc.perform(post("/api/v1/orders/supplier/{id}/ship", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        List<Notification> notifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(
                buyerA.getId(), PageRequest.of(0, 10)).getContent();

        assertEquals(1, notifs.size());
        assertEquals(NotificationType.ORDER_SHIPPED, notifs.get(0).getType());
    }

    @Test
    @DisplayName("34. Buyer receipt confirmation produces ORDER_RECEIPT_CONFIRMED notification for Supplier")
    public void testReceiptConfirmationNotification() throws Exception {
        poA.setStatus(OrderStatus.SHIPPED);
        purchaseOrderRepository.save(poA);

        mockMvc.perform(post("/api/v1/orders/{id}/receive", poA.getId())
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isOk());

        List<Notification> notifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(
                supplierUserA.getId(), PageRequest.of(0, 10)).getContent();

        assertEquals(1, notifs.size());
        assertEquals(NotificationType.ORDER_RECEIPT_CONFIRMED, notifs.get(0).getType());
    }

    @Test
    @DisplayName("35. Supplier rejection produces PO_REJECTED notification for Buyer with rejection reason")
    public void testRejectionNotification() throws Exception {
        RejectPurchaseOrderRequest req = new RejectPurchaseOrderRequest("Specification parameters cannot be met for this lot.");

        mockMvc.perform(post("/api/v1/orders/supplier/{id}/reject", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        List<Notification> notifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(
                buyerA.getId(), PageRequest.of(0, 10)).getContent();

        assertEquals(1, notifs.size());
        assertEquals(NotificationType.PO_REJECTED, notifs.get(0).getType());
        assertTrue(notifs.get(0).getMessage().contains("Specification parameters cannot be met"));
    }

    @Test
    @DisplayName("36. Unrelated Buyer cannot view shipment data (404)")
    public void testUnrelatedBuyerCannotViewShipment() throws Exception {
        poA.setStatus(OrderStatus.PROCESSING);
        purchaseOrderRepository.save(poA);

        ShipOrderRequest req = new ShipOrderRequest("FedEx", "123456", null);
        mockMvc.perform(post("/api/v1/orders/supplier/{id}/ship", poA.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/orders/{id}/shipment", poA.getId())
                        .header("Authorization", "Bearer " + tokenBuyerB))
                .andExpect(status().isNotFound());
    }
}
