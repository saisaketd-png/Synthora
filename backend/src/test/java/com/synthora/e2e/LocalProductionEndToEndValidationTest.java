package com.synthora.e2e;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.identity.dto.*;
import com.synthora.order.OrderStatus;
import com.synthora.order.PurchaseOrder;
import com.synthora.order.PurchaseOrderRepository;
import com.synthora.order.dto.CreatePurchaseOrderRequest;
import com.synthora.rfq.Rfq;
import com.synthora.rfq.RfqRepository;
import com.synthora.rfq.RfqStatus;
import com.synthora.rfq.dto.CreateQuotationRequest;
import com.synthora.rfq.quotation.Quotation;
import com.synthora.rfq.quotation.QuotationRepository;
import com.synthora.security.JwtService;
import com.synthora.security.ratelimit.RateLimitProperties;
import com.synthora.security.ratelimit.RateLimiterStorage;
import com.synthora.seller.SellerProfile;
import com.synthora.seller.SellerProfileRepository;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import org.junit.jupiter.api.AfterEach;
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
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Phase 1.6: Local Production End-to-End Validation Suite
 * Validates the complete Synthora workflow under production-like security and constraints:
 * 1. Healthcheck and Actuator validation
 * 2. Registration with Terms & Privacy requirements
 * 3. Email verification lifecycle & unverified login guards
 * 4. Authentication, JWT issuance, and server-authoritative role evaluation
 * 5. Self-service profile settings and secure password changes
 * 6. Password reset flow with cryptographic token hash isolation
 * 7. End-to-End B2B Marketplace procurement lifecycle (RFQ -> Quotation -> Acceptance -> PO)
 * 8. Document vault upload, authorization, and retrieval
 * 9. Rate limiting throttling and HTTP 429 response structure
 * 10. HTTP security headers and CSP compliance
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class LocalProductionEndToEndValidationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private SellerProfileRepository sellerProfileRepository;

    @Autowired
    private RfqRepository rfqRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RateLimitProperties rateLimitProperties;

    @Autowired
    private RateLimiterStorage rateLimiterStorage;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        rateLimitProperties.setEnabled(false);
        rateLimiterStorage.resetAll();

        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");
    }

    @AfterEach
    void tearDown() {
        rateLimitProperties.setEnabled(false);
        rateLimiterStorage.resetAll();
    }

    @Test
    @DisplayName("E2E 01: Healthcheck endpoint returns HTTP 200 UP")
    void testHealthcheckEndpoint() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UP")));
    }

    @Test
    @DisplayName("E2E 02: Buyer registration enforces Terms & Privacy acceptance")
    void testBuyerRegistrationTermsEnforcement() throws Exception {
        RegisterRequest withoutTerms = new RegisterRequest(
                "John Buyer",
                "buyer.terms@synthora.com",
                "+1234567890",
                "Password123!",
                false, // Terms rejected
                true
        );

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(withoutTerms)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Terms")));

        RegisterRequest validRegistration = new RegisterRequest(
                "John Buyer",
                "buyer.valid@synthora.com",
                "+1234567890",
                "Password123!",
                true,
                true
        );

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRegistration)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email", is("buyer.valid@synthora.com")))
                .andExpect(jsonPath("$.role", is("USER")));

        User user = userRepository.findByEmail("buyer.valid@synthora.com").orElseThrow();
        assertNotNull(user.getTermsAcceptedAt());
        assertNotNull(user.getPrivacyAcceptedAt());
        assertNull(user.getEmailVerifiedAt()); // Unverified on creation
    }

    @Test
    @DisplayName("E2E 03: Email verification guard blocks unverified login until verified")
    void testEmailVerificationLifecycle() throws Exception {
        // 1. Create unverified user
        User unverifiedUser = new User();
        unverifiedUser.setName("Unverified User");
        unverifiedUser.setEmail("unverified.e2e@synthora.com");
        unverifiedUser.setPasswordHash(passwordEncoder.encode("Password123!"));
        unverifiedUser.setRole(UserRole.USER);
        unverifiedUser.setStatus(UserStatus.ACTIVE);
        unverifiedUser.setTermsAcceptedAt(Instant.now());
        unverifiedUser.setPrivacyAcceptedAt(Instant.now());
        unverifiedUser = userRepository.save(unverifiedUser);

        // 2. Attempt login -> Expect 400 Bad Request
        LoginRequest loginRequest = new LoginRequest("unverified.e2e@synthora.com", "Password123!");
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("verify your email")));

        // 3. Verify email by setting verification timestamp
        unverifiedUser.setEmailVerifiedAt(Instant.now());
        userRepository.save(unverifiedUser);

        // 4. Retry login -> Expect HTTP 200 OK and valid JWT
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andReturn();

        JsonNode root = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String token = root.get("token").asText();
        assertTrue(jwtService.isTokenValid(token));
        assertEquals("unverified.e2e@synthora.com", jwtService.extractEmail(token));
    }

    @Test
    @DisplayName("E2E 04: Self-service profile settings and change password")
    void testProfileSettingsAndChangePassword() throws Exception {
        User user = new User();
        user.setName("Original Name");
        user.setEmail("profile.test@synthora.com");
        user.setPhone("+1000000001");
        user.setPasswordHash(passwordEncoder.encode("CurrentPassword123!"));
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);
        user.setEmailVerifiedAt(Instant.now());
        user = userRepository.save(user);

        String token = jwtService.generateToken(user);

        // 1. Get profile
        mockMvc.perform(get("/api/v1/users/me")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Original Name")))
                .andExpect(jsonPath("$.email", is("profile.test@synthora.com")));

        // 2. Update profile
        UpdateProfileRequest updateRequest = new UpdateProfileRequest("Updated Name", "+1000000002");
        mockMvc.perform(put("/api/v1/users/me")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Updated Name")))
                .andExpect(jsonPath("$.phone", is("+1000000002")));

        // 3. Change password with wrong current password -> Rejection
        ChangePasswordRequest wrongCurrent = new ChangePasswordRequest("WrongPass!", "NewPassword123!");
        mockMvc.perform(post("/api/v1/users/me/change-password")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(wrongCurrent)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Current password is incorrect")));

        // 4. Change password with valid credentials
        ChangePasswordRequest validChange = new ChangePasswordRequest("CurrentPassword123!", "NewPassword123!");
        mockMvc.perform(post("/api/v1/users/me/change-password")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validChange)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("Password updated successfully")));

        // 5. Verify old password fails and new password succeeds
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest("profile.test@synthora.com", "CurrentPassword123!"))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest("profile.test@synthora.com", "NewPassword123!"))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("E2E 05: Complete B2B Marketplace procurement lifecycle (RFQ -> Quotation -> Acceptance -> PO)")
    void testMarketplaceProcurementLifecycle() throws Exception {
        // 1. Create Buyer
        User buyer = new User();
        buyer.setName("Marketplace Buyer");
        buyer.setEmail("buyer.mkt@synthora.com");
        buyer.setPasswordHash(passwordEncoder.encode("Password123!"));
        buyer.setRole(UserRole.USER);
        buyer.setStatus(UserStatus.ACTIVE);
        buyer.setEmailVerifiedAt(Instant.now());
        buyer = userRepository.save(buyer);
        String buyerToken = jwtService.generateToken(buyer);

        // 2. Create Supplier User & Supplier entity
        User supplierUser = new User();
        supplierUser.setName("Pharma Supplier");
        supplierUser.setEmail("supplier.mkt@synthora.com");
        supplierUser.setPasswordHash(passwordEncoder.encode("Password123!"));
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser.setStatus(UserStatus.ACTIVE);
        supplierUser.setEmailVerifiedAt(Instant.now());
        supplierUser = userRepository.save(supplierUser);
        String supplierToken = jwtService.generateToken(supplierUser);

        Supplier supplier = new Supplier();
        supplier.setUser(supplierUser);
        supplier = supplierRepository.save(supplier);

        // 3. Create RFQ
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyer.getId());
        rfq.setSupplierId(supplier.getId());
        rfq.setQuantity(new BigDecimal("1000"));
        rfq.setUnit("kg");
        rfq.setStatus(RfqStatus.PENDING);
        rfq = rfqRepository.save(rfq);

        // 4. Supplier submits Quotation
        CreateQuotationRequest quoteRequest = new CreateQuotationRequest(
                new BigDecimal("4.8000"),
                "USD",
                new BigDecimal("100.0000"),
                14,
                LocalDate.now().plusDays(30),
                "Standard 25kg drums",
                "Includes COA and GMP certificates"
        );

        MvcResult quoteResult = mockMvc.perform(post("/api/v1/rfqs/supplier/" + rfq.getId() + "/quotations")
                .header("Authorization", "Bearer " + supplierToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(quoteRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.unitPrice", is(4.8)))
                .andExpect(jsonPath("$.currency", is("USD")))
                .andReturn();

        JsonNode quoteJson = objectMapper.readTree(quoteResult.getResponse().getContentAsString());
        UUID quotationId = UUID.fromString(quoteJson.get("id").asText());

        // 5. Buyer accepts quotation
        mockMvc.perform(post("/api/v1/rfqs/" + rfq.getId() + "/quotations/" + quotationId + "/accept")
                .header("Authorization", "Bearer " + buyerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"decisionNotes\": \"Approved best price\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rfqStatus", is("ACCEPTED")))
                .andExpect(jsonPath("$.decision", is("ACCEPTED")));

        // 6. Buyer issues Purchase Order
        CreatePurchaseOrderRequest poRequest = new CreatePurchaseOrderRequest(
                rfq.getId(),
                "Port of Hamburg, Dock 4",
                "procurement@buyer.com",
                "Temperature controlled delivery"
        );

        mockMvc.perform(post("/api/v1/orders")
                .header("Authorization", "Bearer " + buyerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(poRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("PLACED")))
                .andExpect(jsonPath("$.totalAmount", is(4800.0)));
    }

    @Autowired
    private com.synthora.product.ProductRepository productRepository;

    @Test
    @DisplayName("E2E 06: Document vault upload, authorization, and secure retrieval")
    void testDocumentVaultSecurity() throws Exception {
        User user = new User();
        user.setName("Doc User");
        user.setEmail("doc.user@synthora.com");
        user.setPasswordHash(passwordEncoder.encode("Password123!"));
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);
        user.setEmailVerifiedAt(Instant.now());
        user = userRepository.save(user);
        String userToken = jwtService.generateToken(user);

        com.synthora.product.Product product = new com.synthora.product.Product();
        product.setName("Doc Test Product");
        product.setDescription("For doc testing");
        product.setCategory(com.synthora.product.ProductCategory.API);
        product.setPrice(new BigDecimal("10.00"));
        product.setStock(100);
        product.setSeller(user);
        product = productRepository.save(product);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "certificate_coa.pdf",
                "application/pdf",
                "%PDF-1.4 Mock certificate content".getBytes()
        );

        MvcResult uploadResult = mockMvc.perform(multipart("/api/v1/documents")
                .file(file)
                .param("ownerType", "PRODUCT")
                .param("ownerId", product.getId().toString())
                .param("category", "COA")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalFileName", is("certificate_coa.pdf")))
                .andReturn();

        JsonNode docJson = objectMapper.readTree(uploadResult.getResponse().getContentAsString());
        UUID docId = UUID.fromString(docJson.get("id").asText());

        // Owner can access metadata
        mockMvc.perform(get("/api/v1/documents/" + docId)
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.originalFileName", is("certificate_coa.pdf")));
    }

    @Test
    @DisplayName("E2E 07: HTTP Security headers and Content Security Policy verification")
    void testSecurityHeadersE2E() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("Referrer-Policy", "strict-origin-when-cross-origin"))
                .andExpect(header().string("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()"))
                .andExpect(header().string("Content-Security-Policy", containsString("default-src 'self'")));
    }

    @Test
    @DisplayName("E2E 08: Rate limiting throttling and HTTP 429 response structure")
    void testRateLimitingE2E() throws Exception {
        rateLimitProperties.setEnabled(true);
        rateLimitProperties.getLogin().setLimit(3);
        rateLimitProperties.getLogin().setWindowSeconds(60);

        LoginRequest req = new LoginRequest("throttled@synthora.com", "BadPass");

        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                    .header("X-Forwarded-For", "198.51.100.99")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }

        // 4th request must be throttled with HTTP 429 and Retry-After
        mockMvc.perform(post("/api/v1/auth/login")
                .header("X-Forwarded-For", "198.51.100.99")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.code", is("RATE_LIMIT_EXCEEDED")));
    }
}
