package com.synthora.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.document.Document;
import com.synthora.document.DocumentCategory;
import com.synthora.document.DocumentOwnerType;
import com.synthora.document.DocumentRepository;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.notification.Notification;
import com.synthora.notification.NotificationEntityType;
import com.synthora.notification.NotificationRepository;
import com.synthora.notification.NotificationType;
import com.synthora.order.OrderStatus;
import com.synthora.order.PurchaseOrder;
import com.synthora.order.PurchaseOrderRepository;
import com.synthora.order.ShipmentRepository;
import com.synthora.order.dto.CreatePurchaseOrderRequest;
import com.synthora.product.Product;
import com.synthora.product.ProductCategory;
import com.synthora.product.ProductRepository;
import com.synthora.product.ProductSupplier;
import com.synthora.product.ProductSupplierRepository;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.product.dto.ProductSupplierRequest;
import com.synthora.product.dto.UpdateProductRequest;
import com.synthora.rfq.Rfq;
import com.synthora.rfq.RfqRepository;
import com.synthora.rfq.RfqStatus;
import com.synthora.rfq.dto.CreateQuotationRequest;
import com.synthora.rfq.dto.CreateRfqRequest;
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
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthorizationIdorSecurityTest {

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
    private ProductSupplierRepository productSupplierRepository;

    @Autowired
    private RfqRepository rfqRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private ShipmentRepository shipmentRepository;

    @Autowired
    private DocumentRepository documentRepository;

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

    // Test Actors
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

    private User adminUser;
    private String tokenAdmin;

    private Product productA;
    private Product productB;

    @BeforeEach
    public void setup() {
        rateLimiterService.resetAll();
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM users;");

        // 1. Buyers
        buyerA = createTestUser("buyer_a@synthora.com", "Buyer A", UserRole.USER);
        tokenBuyerA = jwtService.generateToken(buyerA);

        buyerB = createTestUser("buyer_b@synthora.com", "Buyer B", UserRole.USER);
        tokenBuyerB = jwtService.generateToken(buyerB);

        // 2. Suppliers
        supplierUserA = createTestUser("supplier_a@synthora.com", "Supplier User A", UserRole.SUPPLIER);
        supplierA = createTestSupplier("Supplier Corp A", "supplier-corp-a", supplierUserA);
        tokenSupplierA = jwtService.generateToken(supplierUserA);

        supplierUserB = createTestUser("supplier_b@synthora.com", "Supplier User B", UserRole.SUPPLIER);
        supplierB = createTestSupplier("Supplier Corp B", "supplier-corp-b", supplierUserB);
        tokenSupplierB = jwtService.generateToken(supplierUserB);

        // 3. Admin
        adminUser = createTestUser("admin@synthora.com", "Admin User", UserRole.ADMIN);
        tokenAdmin = jwtService.generateToken(adminUser);

        // 4. Products
        productA = createTestProduct("Product Alpha", supplierUserA);
        productB = createTestProduct("Product Beta", supplierUserB);
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
        Supplier supplier = new Supplier();
        supplier.setName(name);
        supplier.setSlug(slug);
        supplier.setCountryCode("US");
        supplier.setCountryName("United States");
        supplier.setUser(user);
        supplier.setVerified(true);
        supplier.setExportReady(true);
        Supplier savedSupplier = supplierRepository.save(supplier);

        SellerProfile profile = new SellerProfile();
        profile.setUser(user);
        profile.setCompanyName(name);
        sellerProfileRepository.save(profile);

        return savedSupplier;
    }

    private Product createTestProduct(String name, User seller) {
        Product product = new Product();
        product.setName(name);
        product.setDescription("Test product description");
        product.setPrice(new BigDecimal("100.00"));
        product.setStock(1000);
        product.setCategory(ProductCategory.API);
        product.setSeller(seller);
        product.setMoqKg(new BigDecimal("10.00"));
        product.setAvailabilityStatus("IN_STOCK");
        return productRepository.save(product);
    }

    // =========================================================================
    // SECTION 1: USER & ADMIN RBAC AUTHORIZATION
    // =========================================================================

    @Test
    @DisplayName("1. USER cannot access ADMIN endpoint")
    public void testUserCannotAccessAdminEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("2. SUPPLIER cannot access ADMIN endpoint")
    public void testSupplierCannotAccessAdminEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("3. USER cannot retrieve another user's profile via admin ID endpoint")
    public void testUserCannotGetOtherUserById() throws Exception {
        mockMvc.perform(get("/api/v1/users/" + buyerB.getId())
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("4. USER cannot change user status or role via admin endpoints")
    public void testUserCannotChangeRoleOrStatus() throws Exception {
        mockMvc.perform(put("/api/v1/admin/users/" + buyerA.getId() + "/role")
                        .header("Authorization", "Bearer " + tokenBuyerA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"ADMIN\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/v1/admin/users/" + buyerA.getId() + "/status")
                        .header("Authorization", "Bearer " + tokenBuyerA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACTIVE\",\"reason\":\"Attempt self reactivate\"}"))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // SECTION 2: BUYER OWNERSHIP & IDOR / BOLA PROTECTION
    // =========================================================================

    @Test
    @DisplayName("5. Buyer A cannot access Buyer B RFQ")
    public void testBuyerCannotAccessOtherBuyerRfq() throws Exception {
        Rfq rfqB = new Rfq();
        rfqB.setBuyerId(buyerB.getId());
        rfqB.setProductId(productA.getId());
        rfqB.setSupplierId(supplierA.getId());
        rfqB.setQuantity(new BigDecimal("100"));
        rfqB.setUnit("kg");
        rfqB = rfqRepository.save(rfqB);

        // Buyer A requests Buyer B's RFQ -> 404 (resource concealment)
        mockMvc.perform(get("/api/v1/rfqs/" + rfqB.getId())
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("6. Buyer A cannot access Buyer B Purchase Order")
    public void testBuyerCannotAccessOtherBuyerPurchaseOrder() throws Exception {
        PurchaseOrder poB = new PurchaseOrder();
        poB.setPoNumber("PO-2026-0001");
        poB.setRfqId(UUID.randomUUID());
        poB.setQuotationId(UUID.randomUUID());
        poB.setBuyerId(buyerB.getId());
        poB.setSupplierId(supplierA.getId());
        poB.setProductId(productA.getId());
        poB.setProductName(productA.getName());
        poB.setQuantity(new BigDecimal("50"));
        poB.setUnit("kg");
        poB.setUnitPrice(new BigDecimal("100.00"));
        poB.setTotalAmount(new BigDecimal("5000.00"));
        poB.setCurrency("USD");
        poB.setShippingAddress("123 Buyer B Way");
        poB.setBillingContact("buyer_b@synthora.com");
        poB.setStatus(OrderStatus.PLACED);
        poB.setPlacedAt(LocalDateTime.now());
        poB = purchaseOrderRepository.save(poB);

        // Buyer A requests Buyer B's PO -> 404
        mockMvc.perform(get("/api/v1/orders/" + poB.getId())
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("7. Buyer A cannot access Buyer B private document")
    public void testBuyerCannotAccessOtherBuyerDocument() throws Exception {
        Rfq rfqB = new Rfq();
        rfqB.setBuyerId(buyerB.getId());
        rfqB.setProductId(productA.getId());
        rfqB.setSupplierId(supplierA.getId());
        rfqB.setQuantity(new BigDecimal("100"));
        rfqB.setUnit("kg");
        rfqB = rfqRepository.save(rfqB);

        Document docB = new Document();
        docB.setOwnerType(DocumentOwnerType.RFQ);
        docB.setOwnerId(rfqB.getId());
        docB.setCategory(DocumentCategory.TECHNICAL_SPECIFICATION);
        docB.setOriginalFileName("confidential_specs.pdf");
        docB.setStorageKey("rfq/confidential_specs_stored_" + UUID.randomUUID() + ".pdf");
        docB.setMimeType("application/pdf");
        docB.setFileSize(1024L);
        docB.setUploadedBy(buyerB.getId());
        docB = documentRepository.save(docB);

        // Buyer A attempts to view Buyer B's document metadata -> 403
        mockMvc.perform(get("/api/v1/documents/" + docB.getId())
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("8. Buyer A cannot access or mark Buyer B notification as read")
    public void testBuyerCannotAccessOtherBuyerNotification() throws Exception {
        Notification notifB = new Notification();
        notifB.setRecipientId(buyerB.getId());
        notifB.setType(NotificationType.RFQ_SUBMITTED);
        notifB.setTitle("Private Notification");
        notifB.setMessage("Confidential buyer B details");
        notifB.setEntityType(NotificationEntityType.RFQ);
        notifB.setEntityId(UUID.randomUUID());
        notifB.setRead(false);
        notifB = notificationRepository.save(notifB);

        // Buyer A attempts to mark Buyer B's notification as read -> 404
        mockMvc.perform(put("/api/v1/notifications/" + notifB.getId() + "/read")
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // SECTION 3: SUPPLIER OWNERSHIP & CROSS-SUPPLIER ISOLATION
    // =========================================================================

    @Test
    @DisplayName("9. Supplier A cannot update Supplier B product")
    public void testSupplierCannotUpdateOtherSupplierProduct() throws Exception {
        UpdateProductRequest updateReq = new UpdateProductRequest(
                "Hacked Product Beta", "Updated description", new BigDecimal("150.00"), ProductCategory.API, 500,
                "123-45-6", "C10H15N", new BigDecimal("99.0"), "USP", new BigDecimal("25.0"), "Drum", 14,
                true, true, true, "IN_STOCK"
        );

        // Supplier A tries to update productB owned by Supplier B -> 403
        mockMvc.perform(put("/api/v1/products/" + productB.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("10. Supplier A cannot delete Supplier B product")
    public void testSupplierCannotDeleteOtherSupplierProduct() throws Exception {
        // Supplier A tries to delete productB owned by Supplier B -> 403
        mockMvc.perform(delete("/api/v1/products/" + productB.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("11. Supplier A cannot access or overwrite Supplier B ProductSupplier offering")
    public void testSupplierCannotAccessOtherSupplierOffering() throws Exception {
        ProductSupplier psB = new ProductSupplier();
        psB.setProduct(productA);
        psB.setSupplier(supplierB);
        psB.setMoqKg(new BigDecimal("50.00"));
        psB.setLeadTimeDays(14);
        productSupplierRepository.save(psB);

        // Supplier A requests its own offering for productA when only Supplier B has one -> 404
        mockMvc.perform(get("/api/v1/products/" + productA.getId() + "/supplier-offering")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("12. Supplier A cannot access Supplier B RFQ")
    public void testSupplierCannotAccessOtherSupplierRfq() throws Exception {
        Rfq rfqForB = new Rfq();
        rfqForB.setBuyerId(buyerA.getId());
        rfqForB.setProductId(productB.getId());
        rfqForB.setSupplierId(supplierB.getId());
        rfqForB.setQuantity(new BigDecimal("100"));
        rfqForB.setUnit("kg");
        rfqForB = rfqRepository.save(rfqForB);

        // Supplier A tries to view RFQ routed to Supplier B -> 404
        mockMvc.perform(get("/api/v1/rfqs/supplier/" + rfqForB.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("13. Supplier A cannot submit quotation to Supplier B RFQ")
    public void testSupplierCannotSubmitQuoteToOtherSupplierRfq() throws Exception {
        Rfq rfqForB = new Rfq();
        rfqForB.setBuyerId(buyerA.getId());
        rfqForB.setProductId(productB.getId());
        rfqForB.setSupplierId(supplierB.getId());
        rfqForB.setQuantity(new BigDecimal("100"));
        rfqForB.setUnit("kg");
        rfqForB = rfqRepository.save(rfqForB);

        CreateQuotationRequest quoteReq = new CreateQuotationRequest(
                new BigDecimal("95.00"), "USD", new BigDecimal("10"), 7, LocalDate.of(2026, 12, 31), "Drum", "Net 30"
        );

        // Supplier A tries to quote on Supplier B's RFQ -> 404
        mockMvc.perform(post("/api/v1/rfqs/supplier/" + rfqForB.getId() + "/quotations")
                        .header("Authorization", "Bearer " + tokenSupplierA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(quoteReq)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("14. Supplier A cannot access Supplier B Purchase Order")
    public void testSupplierCannotAccessOtherSupplierPo() throws Exception {
        PurchaseOrder poB = new PurchaseOrder();
        poB.setPoNumber("PO-2026-0002");
        poB.setRfqId(UUID.randomUUID());
        poB.setQuotationId(UUID.randomUUID());
        poB.setBuyerId(buyerA.getId());
        poB.setSupplierId(supplierB.getId());
        poB.setProductId(productB.getId());
        poB.setProductName(productB.getName());
        poB.setQuantity(new BigDecimal("100"));
        poB.setUnit("kg");
        poB.setUnitPrice(new BigDecimal("100.00"));
        poB.setTotalAmount(new BigDecimal("10000.00"));
        poB.setCurrency("USD");
        poB.setShippingAddress("123 Port Way");
        poB.setBillingContact("buyer_a@synthora.com");
        poB.setStatus(OrderStatus.PLACED);
        poB.setPlacedAt(LocalDateTime.now());
        poB = purchaseOrderRepository.save(poB);

        // Supplier A tries to access Supplier B's PO -> 404
        mockMvc.perform(get("/api/v1/orders/supplier/" + poB.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("15. Supplier A cannot confirm or process Supplier B Purchase Order")
    public void testSupplierCannotConfirmOtherSupplierPo() throws Exception {
        PurchaseOrder poB = new PurchaseOrder();
        poB.setPoNumber("PO-2026-0003");
        poB.setRfqId(UUID.randomUUID());
        poB.setQuotationId(UUID.randomUUID());
        poB.setBuyerId(buyerA.getId());
        poB.setSupplierId(supplierB.getId());
        poB.setProductId(productB.getId());
        poB.setProductName(productB.getName());
        poB.setQuantity(new BigDecimal("100"));
        poB.setUnit("kg");
        poB.setUnitPrice(new BigDecimal("100.00"));
        poB.setTotalAmount(new BigDecimal("10000.00"));
        poB.setCurrency("USD");
        poB.setShippingAddress("123 Port Way");
        poB.setBillingContact("buyer_a@synthora.com");
        poB.setStatus(OrderStatus.PLACED);
        poB.setPlacedAt(LocalDateTime.now());
        poB = purchaseOrderRepository.save(poB);

        // Supplier A tries to confirm Supplier B's PO -> 404
        mockMvc.perform(post("/api/v1/orders/supplier/" + poB.getId() + "/confirm")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("16. Supplier A cannot download Supplier B private quotation document")
    public void testSupplierCannotAccessOtherSupplierQuotationDocument() throws Exception {
        Rfq rfqB = new Rfq();
        rfqB.setBuyerId(buyerA.getId());
        rfqB.setProductId(productB.getId());
        rfqB.setSupplierId(supplierB.getId());
        rfqB.setQuantity(new BigDecimal("100"));
        rfqB.setUnit("kg");
        rfqB = rfqRepository.save(rfqB);

        Quotation qB = new Quotation();
        qB.setRfq(rfqB);
        qB.setQuotationVersion(1);
        qB.setUnitPrice(new BigDecimal("95.00"));
        qB.setCurrency("USD");
        qB.setValidityDate(LocalDate.of(2026, 12, 31));
        qB = quotationRepository.save(qB);

        Document docQB = new Document();
        docQB.setOwnerType(DocumentOwnerType.QUOTATION);
        docQB.setOwnerId(qB.getId());
        docQB.setCategory(DocumentCategory.QUOTATION_ATTACHMENT);
        docQB.setOriginalFileName("supplier_b_quote.pdf");
        docQB.setStorageKey("quotation/supplier_b_quote_stored_" + UUID.randomUUID() + ".pdf");
        docQB.setMimeType("application/pdf");
        docQB.setFileSize(2048L);
        docQB.setUploadedBy(supplierUserB.getId());
        docQB = documentRepository.save(docQB);

        // Supplier A attempts to view Supplier B's quotation document -> 403
        mockMvc.perform(get("/api/v1/documents/" + docQB.getId())
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // SECTION 4: NESTED RESOURCE SECURITY & CROSS-TENANT ISOLATION
    // =========================================================================

    @Test
    @DisplayName("17. Buyer B cannot access quotations belonging to Buyer A's RFQ")
    public void testBuyerCannotAccessOtherBuyerQuotations() throws Exception {
        Rfq rfqA = new Rfq();
        rfqA.setBuyerId(buyerA.getId());
        rfqA.setProductId(productA.getId());
        rfqA.setSupplierId(supplierA.getId());
        rfqA.setQuantity(new BigDecimal("100"));
        rfqA.setUnit("kg");
        rfqA = rfqRepository.save(rfqA);

        Quotation qA = new Quotation();
        qA.setRfq(rfqA);
        qA.setQuotationVersion(1);
        qA.setUnitPrice(new BigDecimal("80.00"));
        qA.setCurrency("USD");
        qA.setValidityDate(LocalDate.of(2026, 12, 31));
        quotationRepository.save(qA);

        // Buyer B queries quotations of Buyer A's RFQ -> 404
        mockMvc.perform(get("/api/v1/rfqs/" + rfqA.getId() + "/quotations")
                        .header("Authorization", "Bearer " + tokenBuyerB))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("18. Buyer B cannot accept quotation belonging to Buyer A's RFQ")
    public void testBuyerCannotAcceptOtherBuyerQuotation() throws Exception {
        Rfq rfqA = new Rfq();
        rfqA.setBuyerId(buyerA.getId());
        rfqA.setProductId(productA.getId());
        rfqA.setSupplierId(supplierA.getId());
        rfqA.setQuantity(new BigDecimal("100"));
        rfqA.setUnit("kg");
        rfqA.setStatus(RfqStatus.QUOTED);
        rfqA = rfqRepository.save(rfqA);

        Quotation qA = new Quotation();
        qA.setRfq(rfqA);
        qA.setQuotationVersion(1);
        qA.setUnitPrice(new BigDecimal("80.00"));
        qA.setCurrency("USD");
        qA.setValidityDate(LocalDate.of(2026, 12, 31));
        qA = quotationRepository.save(qA);

        // Buyer B attempts to accept Buyer A's quotation -> 404
        mockMvc.perform(post("/api/v1/rfqs/" + rfqA.getId() + "/quotations/" + qA.getId() + "/accept")
                        .header("Authorization", "Bearer " + tokenBuyerB))
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // SECTION 5: MASS ASSIGNMENT & FORGERY MITIGATION
    // =========================================================================

    @Test
    @DisplayName("19. Buyer cannot forge buyer identity in RFQ creation")
    public void testBuyerIdentityDerivedFromServerContext() throws Exception {
        CreateRfqRequest req = new CreateRfqRequest(
                productA.getId(), supplierA.getId(), new BigDecimal("500"), "kg", "RFQ from Buyer A"
        );

        mockMvc.perform(post("/api/v1/rfqs")
                        .header("Authorization", "Bearer " + tokenBuyerA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.buyerId", is(buyerA.getId().toString())));
    }

    @Test
    @DisplayName("20. Supplier cannot forge supplier identity in offering creation")
    public void testSupplierOfferingDerivedFromServerContext() throws Exception {
        ProductSupplierRequest req = new ProductSupplierRequest(
                "99.5%", "USP", new BigDecimal("10.00"), "25kg Drum", 10, true, true
        );

        mockMvc.perform(post("/api/v1/products/" + productA.getId() + "/supplier-offering")
                        .header("Authorization", "Bearer " + tokenSupplierA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productName", is("Product Alpha")))
                .andExpect(jsonPath("$.purity", is("99.5%")));

        // Verify the database association was created for supplierA (not supplierB or arbitrary ID)
        Optional<ProductSupplier> psOpt = productSupplierRepository.findByProductIdAndSupplierId(productA.getId(), supplierA.getId());
        assertTrue(psOpt.isPresent());
    }

    // =========================================================================
    // SECTION 6: STATE TRANSITION ENFORCEMENT & BUSINESS WORKFLOWS
    // =========================================================================

    @Test
    @DisplayName("21. Supplier cannot submit quotation to already ACCEPTED RFQ")
    public void testSupplierCannotQuoteOnAcceptedRfq() throws Exception {
        Rfq rfqA = new Rfq();
        rfqA.setBuyerId(buyerA.getId());
        rfqA.setProductId(productA.getId());
        rfqA.setSupplierId(supplierA.getId());
        rfqA.setQuantity(new BigDecimal("100"));
        rfqA.setUnit("kg");
        rfqA.setStatus(RfqStatus.ACCEPTED);
        rfqA = rfqRepository.save(rfqA);

        CreateQuotationRequest quoteReq = new CreateQuotationRequest(
                new BigDecimal("95.00"), "USD", new BigDecimal("10"), 7, LocalDate.of(2026, 12, 31), "Drum", "Net 30"
        );

        mockMvc.perform(post("/api/v1/rfqs/supplier/" + rfqA.getId() + "/quotations")
                        .header("Authorization", "Bearer " + tokenSupplierA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(quoteReq)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("22. Buyer cannot issue Purchase Order on non-ACCEPTED RFQ")
    public void testBuyerCannotCreatePoOnUnacceptedRfq() throws Exception {
        Rfq rfqA = new Rfq();
        rfqA.setBuyerId(buyerA.getId());
        rfqA.setProductId(productA.getId());
        rfqA.setSupplierId(supplierA.getId());
        rfqA.setQuantity(new BigDecimal("100"));
        rfqA.setUnit("kg");
        rfqA.setStatus(RfqStatus.PENDING);
        rfqA = rfqRepository.save(rfqA);

        CreatePurchaseOrderRequest poReq = new CreatePurchaseOrderRequest(
                rfqA.getId(), "123 Shipping St", "buyer_a@synthora.com", "Urgent delivery"
        );

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + tokenBuyerA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(poReq)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("23. Public catalog remains accessible without authentication")
    public void testPublicCatalogAccessible() throws Exception {
        mockMvc.perform(get("/api/v1/products"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/products/" + productA.getId() + "/detail"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Product Alpha")));

        mockMvc.perform(get("/api/v1/suppliers"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("24. Anonymous user cannot access protected RFQ endpoints")
    public void testAnonymousCannotAccessRfq() throws Exception {
        mockMvc.perform(get("/api/v1/rfqs"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("25. Anonymous user cannot access protected Purchase Order endpoints")
    public void testAnonymousCannotAccessOrders() throws Exception {
        mockMvc.perform(get("/api/v1/orders"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("26. Anonymous user cannot access protected Notification endpoints")
    public void testAnonymousCannotAccessNotifications() throws Exception {
        mockMvc.perform(get("/api/v1/notifications"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("27. Buyer cannot perform supplier shipment confirmation")
    public void testBuyerCannotShipPurchaseOrder() throws Exception {
        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber("PO-2026-0004");
        po.setRfqId(UUID.randomUUID());
        po.setQuotationId(UUID.randomUUID());
        po.setBuyerId(buyerA.getId());
        po.setSupplierId(supplierA.getId());
        po.setProductId(productA.getId());
        po.setProductName(productA.getName());
        po.setQuantity(new BigDecimal("100"));
        po.setUnit("kg");
        po.setUnitPrice(new BigDecimal("100.00"));
        po.setTotalAmount(new BigDecimal("10000.00"));
        po.setCurrency("USD");
        po.setShippingAddress("123 Port Way");
        po.setBillingContact("buyer_a@synthora.com");
        po.setStatus(OrderStatus.PROCESSING);
        po.setPlacedAt(LocalDateTime.now());
        po = purchaseOrderRepository.save(po);

        // Buyer attempts to ship -> 403 Forbidden (endpoint requires SUPPLIER role)
        mockMvc.perform(post("/api/v1/orders/supplier/" + po.getId() + "/ship")
                        .header("Authorization", "Bearer " + tokenBuyerA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"carrier\":\"FedEx\",\"trackingNumber\":\"123456\",\"estimatedDeliveryDate\":\"2026-12-31\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("28. Supplier cannot transition an already DELIVERED order back to confirmed/shipped")
    public void testSupplierCannotShipDeliveredOrder() throws Exception {
        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber("PO-2026-0005");
        po.setRfqId(UUID.randomUUID());
        po.setQuotationId(UUID.randomUUID());
        po.setBuyerId(buyerA.getId());
        po.setSupplierId(supplierA.getId());
        po.setProductId(productA.getId());
        po.setProductName(productA.getName());
        po.setQuantity(new BigDecimal("100"));
        po.setUnit("kg");
        po.setUnitPrice(new BigDecimal("100.00"));
        po.setTotalAmount(new BigDecimal("10000.00"));
        po.setCurrency("USD");
        po.setShippingAddress("123 Port Way");
        po.setBillingContact("buyer_a@synthora.com");
        po.setStatus(OrderStatus.DELIVERED);
        po.setPlacedAt(LocalDateTime.now());
        po = purchaseOrderRepository.save(po);

        mockMvc.perform(post("/api/v1/orders/supplier/" + po.getId() + "/confirm")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isConflict());
    }
}
