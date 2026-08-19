package com.synthora.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.admin.user.dto.UpdateUserStatusRequest;
import com.synthora.document.Document;
import com.synthora.document.DocumentCategory;
import com.synthora.document.DocumentOwnerType;
import com.synthora.document.DocumentRepository;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.identity.dto.RegisterRequest;
import com.synthora.order.OrderStatus;
import com.synthora.order.PurchaseOrder;
import com.synthora.order.PurchaseOrderRepository;
import com.synthora.product.Product;
import com.synthora.product.ProductCategory;
import com.synthora.product.ProductRepository;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.product.dto.CreateProductRequest;
import com.synthora.product.dto.ProductSupplierRequest;
import com.synthora.rfq.Rfq;
import com.synthora.rfq.RfqRepository;
import com.synthora.rfq.RfqStatus;
import com.synthora.rfq.dto.CreateQuotationRequest;
import com.synthora.rfq.dto.CreateRfqRequest;
import com.synthora.rfq.dto.RejectQuotationRequest;
import com.synthora.seller.SellerProfile;
import com.synthora.seller.SellerProfileRepository;
import com.synthora.seller.dto.UpdateSellerProfileRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class InputValidationSecurityTest {

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
    private com.synthora.rfq.quotation.QuotationRepository quotationRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private DocumentRepository documentRepository;

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

    private User buyer;
    private String tokenBuyer;

    private User supplierUser;
    private Supplier supplier;
    private String tokenSupplier;

    private User adminUser;
    private String tokenAdmin;

    private Product product;

    @BeforeEach
    public void setup() {
        rateLimiterService.resetAll();
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM users;");

        // Buyer
        buyer = createTestUser("buyer_validation@synthora.com", "Validation Buyer", UserRole.USER);
        tokenBuyer = jwtService.generateToken(buyer);

        // Supplier
        supplierUser = createTestUser("supplier_validation@synthora.com", "Validation Supplier", UserRole.SUPPLIER);
        supplier = createTestSupplier("Validation Chem Corp", "validation-chem-corp", supplierUser);
        tokenSupplier = jwtService.generateToken(supplierUser);

        // Admin
        adminUser = createTestUser("admin_validation@synthora.com", "Validation Admin", UserRole.ADMIN);
        tokenAdmin = jwtService.generateToken(adminUser);

        // Product
        product = createTestProduct("Base Product", supplierUser);
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

    private Product createTestProduct(String name, User seller) {
        Product p = new Product();
        p.setName(name);
        p.setDescription("Test description");
        p.setPrice(new BigDecimal("100.00"));
        p.setStock(500);
        p.setCategory(ProductCategory.API);
        p.setSeller(seller);
        p.setMoqKg(new BigDecimal("10.00"));
        p.setAvailabilityStatus("IN_STOCK");
        return productRepository.save(p);
    }

    // =========================================================================
    // SECTION 1: XSS DEFENSE & SAFE STRING STORAGE
    // =========================================================================

    @Test
    @DisplayName("1. Script payload in product name is safely stored as text without execution")
    public void testScriptInProductName() throws Exception {
        CreateProductRequest req = new CreateProductRequest(
                "<script>alert('xss')</script>", "Description", new BigDecimal("50.00"), ProductCategory.API,
                100, "123-45-6", "C6H12O6", new BigDecimal("99.0"), "USP", new BigDecimal("10.0"), "Drum",
                7, true, true, true, "IN_STOCK"
        );

        mockMvc.perform(post("/api/v1/products")
                        .header("Authorization", "Bearer " + tokenSupplier)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("<script>alert('xss')</script>")));
    }

    @Test
    @DisplayName("2. Script payload in product description is safely stored without execution")
    public void testScriptInProductDescription() throws Exception {
        CreateProductRequest req = new CreateProductRequest(
                "Safe Product Name", "<img src=x onerror=alert(1)>", new BigDecimal("50.00"), ProductCategory.API,
                100, "123-45-6", "C6H12O6", new BigDecimal("99.0"), "USP", new BigDecimal("10.0"), "Drum",
                7, true, true, true, "IN_STOCK"
        );

        mockMvc.perform(post("/api/v1/products")
                        .header("Authorization", "Bearer " + tokenSupplier)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description", is("<img src=x onerror=alert(1)>")));
    }

    @Test
    @DisplayName("3. Script payload in RFQ notes is safely stored without execution")
    public void testScriptInRfqNotes() throws Exception {
        CreateRfqRequest req = new CreateRfqRequest(
                product.getId(), supplier.getId(), new BigDecimal("100"), "kg", "\"><script>alert(1)</script>"
        );

        mockMvc.perform(post("/api/v1/rfqs")
                        .header("Authorization", "Bearer " + tokenBuyer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message", is("\"><script>alert(1)</script>")));
    }

    @Test
    @DisplayName("4. Script payload in quotation notes is safely stored without execution")
    public void testScriptInQuotationNotes() throws Exception {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyer.getId());
        rfq.setProductId(product.getId());
        rfq.setSupplierId(supplier.getId());
        rfq.setQuantity(new BigDecimal("100"));
        rfq.setUnit("kg");
        rfq = rfqRepository.save(rfq);

        CreateQuotationRequest quoteReq = new CreateQuotationRequest(
                new BigDecimal("90.00"), "USD", new BigDecimal("10"), 7, LocalDate.now().plusDays(30),
                "Drum", "javascript:alert(1)"
        );

        mockMvc.perform(post("/api/v1/rfqs/supplier/" + rfq.getId() + "/quotations")
                        .header("Authorization", "Bearer " + tokenSupplier)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(quoteReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.commercialNotes", is("javascript:alert(1)")));
    }

    @Test
    @DisplayName("5. Script payload in quotation rejection reason is safely stored")
    public void testScriptInRejectionReason() throws Exception {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyer.getId());
        rfq.setProductId(product.getId());
        rfq.setSupplierId(supplier.getId());
        rfq.setQuantity(new BigDecimal("100"));
        rfq.setUnit("kg");
        rfq.setStatus(RfqStatus.QUOTED);
        rfq = rfqRepository.save(rfq);

        com.synthora.rfq.quotation.Quotation q = new com.synthora.rfq.quotation.Quotation();
        q.setRfq(rfq);
        q.setQuotationVersion(1);
        q.setUnitPrice(new BigDecimal("90.00"));
        q.setCurrency("USD");
        q.setValidityDate(LocalDate.now().plusDays(30));
        q = quotationRepository.save(q);

        RejectQuotationRequest rejectReq = new RejectQuotationRequest("<iframe src=javascript:alert(1)>");

        mockMvc.perform(post("/api/v1/rfqs/" + rfq.getId() + "/quotations/" + q.getId() + "/reject")
                        .header("Authorization", "Bearer " + tokenBuyer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // SECTION 2: SQL / JPQL INJECTION & SEARCH HARDENING
    // =========================================================================

    @Test
    @DisplayName("6. SQL Injection in search query is safely handled via parameterized predicates")
    public void testSqlInjectionInSearch() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                        .param("query", "' OR '1'='1")
                        .param("sortField", "name")
                        .param("sortDir", "asc"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("7. Malicious JPQL injection in search keyword returns safely without error")
    public void testJpqlInjectionInSearch() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                        .param("query", "'; DROP TABLE products; --"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("8. Malicious sort field is safely sanitized to default sort field")
    public void testMaliciousSortFieldSanitized() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                        .param("sortField", "passwordHash; DROP TABLE users; --")
                        .param("sortDir", "desc"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("9. Malicious sort direction is safely sanitized")
    public void testMaliciousSortDirectionSanitized() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                        .param("sortField", "name")
                        .param("sortDir", "desc; DROP TABLE users;"))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // SECTION 3: PAGINATION ABUSE DEFENSE
    // =========================================================================

    @Test
    @DisplayName("10. Negative page number is bounded safely to 0")
    public void testNegativePageNumber() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                        .param("page", "-5")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.number", is(0)));
    }

    @Test
    @DisplayName("11. Negative page size is bounded safely to at least 1")
    public void testNegativePageSize() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                        .param("page", "0")
                        .param("size", "-10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size", is(1)));
    }

    @Test
    @DisplayName("12. Excessively large page size is clamped safely to 100")
    public void testExcessivelyLargePageSize() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                        .param("page", "0")
                        .param("size", "999999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size", is(100)));
    }

    @Test
    @DisplayName("13. Non-numeric page parameter produces controlled 400 Bad Request")
    public void testNonNumericPageParameter() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                        .param("page", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Invalid parameter format")));
    }

    // =========================================================================
    // SECTION 4: UUID & TYPE MISMATCH VALIDATION
    // =========================================================================

    @Test
    @DisplayName("14. Malformed product UUID in path returns controlled 400 Bad Request")
    public void testMalformedProductUuid() throws Exception {
        mockMvc.perform(get("/api/v1/products/not-a-valid-uuid/suppliers"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Invalid parameter format")));
    }

    @Test
    @DisplayName("15. Malformed RFQ UUID in path returns controlled 400 Bad Request")
    public void testMalformedRfqUuid() throws Exception {
        mockMvc.perform(get("/api/v1/rfqs/not-a-valid-uuid")
                        .header("Authorization", "Bearer " + tokenBuyer))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Invalid parameter format")));
    }

    @Test
    @DisplayName("16. Malformed Purchase Order UUID in path returns controlled 400 Bad Request")
    public void testMalformedPoUuid() throws Exception {
        mockMvc.perform(get("/api/v1/orders/not-a-valid-uuid")
                        .header("Authorization", "Bearer " + tokenBuyer))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Invalid parameter format")));
    }

    @Test
    @DisplayName("17. Malformed Document UUID in path returns controlled 400 Bad Request")
    public void testMalformedDocumentUuid() throws Exception {
        mockMvc.perform(get("/api/v1/documents/not-a-valid-uuid")
                        .header("Authorization", "Bearer " + tokenBuyer))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Invalid parameter format")));
    }

    // =========================================================================
    // SECTION 5: ENUM & FORMAT VALIDATION
    // =========================================================================

    @Test
    @DisplayName("18. Invalid product category string returns controlled 400 Bad Request")
    public void testInvalidProductCategory() throws Exception {
        String invalidJson = """
                {
                    "name": "Test Product",
                    "price": 100.00,
                    "category": "INVALID_HACK_CATEGORY",
                    "stock": 50
                }
                """;

        mockMvc.perform(post("/api/v1/products")
                        .header("Authorization", "Bearer " + tokenSupplier)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Malformed request body or invalid field format")));
    }

    @Test
    @DisplayName("19. Invalid user status string returns controlled 400 Bad Request")
    public void testInvalidUserStatus() throws Exception {
        String invalidJson = """
                {
                    "status": "SUPER_ADMIN_STATUS",
                    "reason": "Invalid status hack"
                }
                """;

        mockMvc.perform(put("/api/v1/admin/users/" + buyer.getId() + "/status")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // SECTION 6: NUMERIC BOUNDARY & MONETARY VALIDATION
    // =========================================================================

    @Test
    @DisplayName("20. Negative quantity in RFQ creation is rejected (400)")
    public void testNegativeQuantityRfq() throws Exception {
        CreateRfqRequest req = new CreateRfqRequest(
                product.getId(), supplier.getId(), new BigDecimal("-10.00"), "kg", "Test RFQ"
        );

        mockMvc.perform(post("/api/v1/rfqs")
                        .header("Authorization", "Bearer " + tokenBuyer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.quantity", notNullValue()));
    }

    @Test
    @DisplayName("21. Zero quantity in RFQ creation is rejected (400)")
    public void testZeroQuantityRfq() throws Exception {
        CreateRfqRequest req = new CreateRfqRequest(
                product.getId(), supplier.getId(), BigDecimal.ZERO, "kg", "Test RFQ"
        );

        mockMvc.perform(post("/api/v1/rfqs")
                        .header("Authorization", "Bearer " + tokenBuyer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.quantity", notNullValue()));
    }

    @Test
    @DisplayName("22. Negative price in product creation is rejected (400)")
    public void testNegativePriceProduct() throws Exception {
        CreateProductRequest req = new CreateProductRequest(
                "Negative Price Chemical", "Desc", new BigDecimal("-50.00"), ProductCategory.API,
                100, null, null, null, null, null, null, null, null, null, null, null
        );

        mockMvc.perform(post("/api/v1/products")
                        .header("Authorization", "Bearer " + tokenSupplier)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.price", notNullValue()));
    }

    @Test
    @DisplayName("23. Overflow / excessively large price is rejected (400)")
    public void testExcessivelyLargePriceProduct() throws Exception {
        CreateProductRequest req = new CreateProductRequest(
                "Expensive Chemical", "Desc", new BigDecimal("1000000000000.00"), ProductCategory.API,
                100, null, null, null, null, null, null, null, null, null, null, null
        );

        mockMvc.perform(post("/api/v1/products")
                        .header("Authorization", "Bearer " + tokenSupplier)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.price", notNullValue()));
    }

    @Test
    @DisplayName("24. Negative lead time in ProductSupplier offering is rejected (400)")
    public void testNegativeLeadTimeProductSupplier() throws Exception {
        ProductSupplierRequest req = new ProductSupplierRequest(
                "99.0%", "USP", new BigDecimal("10.00"), "Drum", -5, true, true
        );

        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/supplier-offering")
                        .header("Authorization", "Bearer " + tokenSupplier)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // SECTION 7: DATE VALIDATION
    // =========================================================================

    @Test
    @DisplayName("25. Past validity date in quotation creation is rejected (400)")
    public void testPastQuotationValidityDate() throws Exception {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyer.getId());
        rfq.setProductId(product.getId());
        rfq.setSupplierId(supplier.getId());
        rfq.setQuantity(new BigDecimal("100"));
        rfq.setUnit("kg");
        rfq = rfqRepository.save(rfq);

        CreateQuotationRequest quoteReq = new CreateQuotationRequest(
                new BigDecimal("90.00"), "USD", new BigDecimal("10"), 7, LocalDate.of(2020, 1, 1),
                "Drum", "Past date quote"
        );

        mockMvc.perform(post("/api/v1/rfqs/supplier/" + rfq.getId() + "/quotations")
                        .header("Authorization", "Bearer " + tokenSupplier)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(quoteReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validityDate", notNullValue()));
    }

    // =========================================================================
    // SECTION 8: URL VALIDATION & SSRF MITIGATION
    // =========================================================================

    @Test
    @DisplayName("26. Malicious javascript: URL in seller profile website is rejected (400)")
    public void testJavascriptUrlInSellerProfile() throws Exception {
        UpdateSellerProfileRequest req = new UpdateSellerProfileRequest(
                "Validation Corp", "GST12345", "123 Main St", "City", "State", "Country",
                "javascript:alert('xss')", "ISO9001", "About us"
        );

        mockMvc.perform(put("/api/v1/sellers/me")
                        .header("Authorization", "Bearer " + tokenSupplier)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.website", notNullValue()));
    }

    @Test
    @DisplayName("27. Valid HTTPS website URL in seller profile is accepted (200)")
    public void testValidHttpsWebsiteUrl() throws Exception {
        UpdateSellerProfileRequest req = new UpdateSellerProfileRequest(
                "Validation Corp", "GST12345", "123 Main St", "City", "State", "Country",
                "https://www.validation-corp.com/about", "ISO9001", "About us"
        );

        mockMvc.perform(put("/api/v1/sellers/me")
                        .header("Authorization", "Bearer " + tokenSupplier)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.website", is("https://www.validation-corp.com/about")));
    }

    // =========================================================================
    // SECTION 9: PATH TRAVERSAL & FILENAME SANITIZATION
    // =========================================================================

    @Test
    @DisplayName("28. Filename with path traversal sequences (../) is sanitized safely")
    public void testPathTraversalInFilename() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "../../../../etc/passwd.pdf",
                "application/pdf",
                "%PDF-1.4 test document content".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", product.getId().toString())
                        .param("category", "COA")
                        .header("Authorization", "Bearer " + tokenSupplier))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalFileName", not(containsString(".."))))
                .andExpect(jsonPath("$.originalFileName", is("passwd.pdf")));
    }

    // =========================================================================
    // SECTION 10: MASS ASSIGNMENT & UNKNOWN FIELDS
    // =========================================================================

    @Test
    @DisplayName("29. User cannot inject ADMIN role or SUSPENDED status during registration")
    public void testMassAssignmentRoleInRegistration() throws Exception {
        String registrationPayload = """
                {
                    "name": "Hacker User",
                    "email": "hacker@synthora.com",
                    "password": "Password123!",
                    "role": "ADMIN",
                    "status": "SUSPENDED"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationPayload))
                .andExpect(status().isCreated());

        User registered = userRepository.findByEmail("hacker@synthora.com").orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(UserRole.USER, registered.getRole());
        org.junit.jupiter.api.Assertions.assertEquals(UserStatus.ACTIVE, registered.getStatus());
    }

    // =========================================================================
    // SECTION 11: PRESERVATION OF LEGITIMATE CHEMICAL DATA
    // =========================================================================

    @Test
    @DisplayName("30. Legitimate chemical names with hyphens, parentheses, commas, brackets, numbers are preserved")
    public void testPreserveChemicalNamesAndFormulas() throws Exception {
        CreateProductRequest req = new CreateProductRequest(
                "4-Hydroxycarbazole (99.5% USP)",
                "Chemical formula: C12H9NO, CAS: 52602-39-8. Suitable for pharmaceutical synthesis [DMF/Water soluble].",
                new BigDecimal("250.75"),
                ProductCategory.API,
                250,
                "52602-39-8",
                "C12H9NO",
                new BigDecimal("99.5"),
                "USP / Ph. Eur.",
                new BigDecimal("5.0"),
                "25kg Fiber Drum",
                14,
                true,
                true,
                true,
                "IN_STOCK"
        );

        mockMvc.perform(post("/api/v1/products")
                        .header("Authorization", "Bearer " + tokenSupplier)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("4-Hydroxycarbazole (99.5% USP)")))
                .andExpect(jsonPath("$.casNumber", is("52602-39-8")))
                .andExpect(jsonPath("$.molecularFormula", is("C12H9NO")))
                .andExpect(jsonPath("$.purity", is(99.5)))
                .andExpect(jsonPath("$.grade", is("USP / Ph. Eur.")))
                .andExpect(jsonPath("$.packaging", is("25kg Fiber Drum")));
    }

    @Test
    @DisplayName("31. Technical notation with Greek characters and percentages is preserved")
    public void testPreserveTechnicalNotation() throws Exception {
        CreateProductRequest req = new CreateProductRequest(
                "α,β-Unsaturated Ketone Derivative",
                "High purity α-isomer (>98.0%), boiling point 180°C ± 2°C.",
                new BigDecimal("180.00"),
                ProductCategory.INTERMEDIATE,
                100,
                "1234-56-7",
                "C10H10O",
                new BigDecimal("98.0"),
                "Analytical Grade",
                new BigDecimal("1.0"),
                "1L Amber Glass Bottle",
                5,
                true,
                true,
                true,
                "IN_STOCK"
        );

        mockMvc.perform(post("/api/v1/products")
                        .header("Authorization", "Bearer " + tokenSupplier)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("α,β-Unsaturated Ketone Derivative")))
                .andExpect(jsonPath("$.description", containsString("α-isomer")));
    }
}
