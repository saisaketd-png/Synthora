package com.synthora.security;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.product.Product;
import com.synthora.product.ProductRepository;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.rfq.Rfq;
import com.synthora.rfq.RfqRepository;
import com.synthora.rfq.RfqStatus;
import com.synthora.rfq.quotation.Quotation;
import com.synthora.rfq.quotation.QuotationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SecurityHardeningIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private RfqRepository rfqRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    private User buyerA;
    private User buyerB;
    private User supplierUserA;
    private User supplierUserB;
    private User suspendedUser;
    private User adminUser;
    private Supplier supplierA;
    private Supplier supplierB;
    private String tokenBuyerA;
    private String tokenBuyerB;
    private String tokenSupplierA;
    private String tokenSupplierB;
    private String tokenSuspended;
    private String tokenAdmin;
    private Product productA;
    private Rfq rfqA;

    @BeforeEach
    public void setUp() {
        quotationRepository.deleteAll();
        rfqRepository.deleteAll();
        productRepository.deleteAll();
        supplierRepository.deleteAll();

        String s = UUID.randomUUID().toString().substring(0, 8);

        buyerA = new User();
        buyerA.setName("Buyer A " + s);
        buyerA.setEmail("buyerA_" + s + "@test.com");
        buyerA.setPasswordHash("hash");
        buyerA.setRole(UserRole.USER);
        buyerA = userRepository.save(buyerA);

        buyerB = new User();
        buyerB.setName("Buyer B " + s);
        buyerB.setEmail("buyerB_" + s + "@test.com");
        buyerB.setPasswordHash("hash");
        buyerB.setRole(UserRole.USER);
        buyerB = userRepository.save(buyerB);

        supplierUserA = new User();
        supplierUserA.setName("Supplier User A " + s);
        supplierUserA.setEmail("supplierA_" + s + "@test.com");
        supplierUserA.setPasswordHash("hash");
        supplierUserA.setRole(UserRole.SUPPLIER);
        supplierUserA = userRepository.save(supplierUserA);

        supplierUserB = new User();
        supplierUserB.setName("Supplier User B " + s);
        supplierUserB.setEmail("supplierB_" + s + "@test.com");
        supplierUserB.setPasswordHash("hash");
        supplierUserB.setRole(UserRole.SUPPLIER);
        supplierUserB = userRepository.save(supplierUserB);

        suspendedUser = new User();
        suspendedUser.setName("Suspended User " + s);
        suspendedUser.setEmail("suspended_" + s + "@test.com");
        suspendedUser.setPasswordHash("hash");
        suspendedUser.setRole(UserRole.USER);
        suspendedUser.setStatus(UserStatus.SUSPENDED);
        suspendedUser = userRepository.save(suspendedUser);

        adminUser = new User();
        adminUser.setName("Admin User " + s);
        adminUser.setEmail("admin_" + s + "@test.com");
        adminUser.setPasswordHash("hash");
        adminUser.setRole(UserRole.ADMIN);
        adminUser = userRepository.save(adminUser);

        supplierA = new Supplier();
        supplierA.setName("Supplier Corp A " + s);
        supplierA.setSlug("supplier-corp-a-" + s);
        supplierA.setCountryName("India");
        supplierA.setCountryCode("IN");
        supplierA.setUser(supplierUserA);
        supplierA = supplierRepository.save(supplierA);

        supplierB = new Supplier();
        supplierB.setName("Supplier Corp B " + s);
        supplierB.setSlug("supplier-corp-b-" + s);
        supplierB.setCountryName("India");
        supplierB.setCountryCode("IN");
        supplierB.setUser(supplierUserB);
        supplierB = supplierRepository.save(supplierB);

        productA = new Product();
        productA.setName("Chemical Product A " + s);
        productA.setProductCode("API-" + s.toUpperCase());
        productA.setCasNumber("103-90-2");
        productA.setCategory(com.synthora.product.ProductCategory.API);
        productA.setPrice(new BigDecimal("150.00"));
        productA.setStock(1000);
        productA.setSeller(supplierUserA);
        productA = productRepository.save(productA);

        tokenBuyerA = jwtService.generateToken(buyerA);
        tokenBuyerB = jwtService.generateToken(buyerB);
        tokenSupplierA = jwtService.generateToken(supplierUserA);
        tokenSupplierB = jwtService.generateToken(supplierUserB);
        tokenSuspended = jwtService.generateToken(suspendedUser);
        tokenAdmin = jwtService.generateToken(adminUser);

        rfqA = new Rfq();
        rfqA.setBuyerId(buyerA.getId());
        rfqA.setSupplierId(supplierA.getId());
        rfqA.setProductId(productA.getId());
        rfqA.setQuantity(new BigDecimal("500.00"));
        rfqA.setUnit("KG");
        rfqA.setMessage("RFQ for Product A");
        rfqA.setStatus(RfqStatus.PENDING);
        rfqA = rfqRepository.save(rfqA);
    }

    // 1. Expired/Malformed JWT Rejected
    @Test
    public void test01_MalformedOrInvalidJwtRejected() throws Exception {
        mockMvc.perform(get("/api/v1/rfqs/my")
                .header("Authorization", "Bearer invalid.jwt.token"))
                .andExpect(status().isUnauthorized());
    }

    // 2. Suspended User Rejected
    @Test
    public void test02_SuspendedUserRejectedEvenWithValidJwt() throws Exception {
        mockMvc.perform(get("/api/v1/rfqs/my")
                .header("Authorization", "Bearer " + tokenSuspended))
                .andExpect(status().isUnauthorized());
    }

    // 3. Inactive/Deleted User Rejected
    @Test
    public void test03_DeletedUserRejectedEvenWithValidJwt() throws Exception {
        buyerB.setDeletedAt(java.time.Instant.now());
        userRepository.save(buyerB);

        mockMvc.perform(get("/api/v1/rfqs/my")
                .header("Authorization", "Bearer " + tokenBuyerB))
                .andExpect(status().isUnauthorized());
    }

    // 4. Buyer Cannot Access Supplier Endpoint
    @Test
    public void test04_BuyerCannotAccessSupplierEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/rfqs/supplier")
                .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isForbidden());
    }

    // 5. Supplier Cannot Access Admin Endpoint
    @Test
    public void test05_SupplierCannotAccessAdminEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isForbidden());
    }

    // 6. Buyer A Cannot Access Buyer B RFQ
    @Test
    public void test06_BuyerACannotAccessBuyerBRfq() throws Exception {
        mockMvc.perform(get("/api/v1/rfqs/" + rfqA.getId())
                .header("Authorization", "Bearer " + tokenBuyerB))
                .andExpect(status().isNotFound());
    }

    // 7. Supplier B Cannot Access Supplier A RFQ
    @Test
    public void test07_SupplierBCannotAccessSupplierARfq() throws Exception {
        mockMvc.perform(get("/api/v1/rfqs/supplier/" + rfqA.getId())
                .header("Authorization", "Bearer " + tokenSupplierB))
                .andExpect(status().isNotFound());
    }

    // 8. Supplier B Cannot Modify Supplier A Product
    @Test
    public void test08_SupplierBCannotModifySupplierAProduct() throws Exception {
        String updateJson = """
                {
                    "name": "Hacked Product Name",
                    "category": "API",
                    "price": 200.00,
                    "stock": 500
                }
                """;

        mockMvc.perform(put("/api/v1/products/" + productA.getId())
                .header("Authorization", "Bearer " + tokenSupplierB)
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateJson))
                .andExpect(status().isForbidden());
    }

    // 9. Buyer Cannot Create Supplier Quotation
    @Test
    public void test09_BuyerCannotSubmitSupplierQuotation() throws Exception {
        String quoteJson = """
                {
                    "unitPrice": 100.00,
                    "currency": "INR",
                    "validityDate": "%s"
                }
                """.formatted(LocalDate.now().plusDays(30));

        mockMvc.perform(post("/api/v1/rfqs/supplier/" + rfqA.getId() + "/quotations")
                .header("Authorization", "Bearer " + tokenBuyerA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(quoteJson))
                .andExpect(status().isForbidden());
    }

    // 10. Supplier Cannot Submit Buyer Counter Offer
    @Test
    public void test10_SupplierCannotSubmitBuyerCounterOffer() throws Exception {
        String counterJson = """
                {
                    "unitPrice": 90.00,
                    "currency": "INR",
                    "commercialMessage": "Supplier fake counter"
                }
                """;

        mockMvc.perform(post("/api/v1/rfqs/" + rfqA.getId() + "/counter-offer")
                .header("Authorization", "Bearer " + tokenSupplierA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(counterJson))
                .andExpect(status().isNotFound());
    }

    // 11. Malicious Executable File Upload Rejected
    @Test
    public void test11_ExecutableFileUploadRejected() throws Exception {
        MockMultipartFile exeFile = new MockMultipartFile(
                "file",
                "malware.exe",
                "application/x-msdownload",
                "MZ-executable-binary-content".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/documents")
                .file(exeFile)
                .param("ownerType", "PRODUCT")
                .param("ownerId", productA.getId().toString())
                .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isBadRequest());
    }

    // 12. Path Traversal Filename Rejected
    @Test
    public void test12_PathTraversalFilenameRejected() throws Exception {
        MockMultipartFile pathTraversalFile = new MockMultipartFile(
                "file",
                "../../etc/passwd.pdf",
                "application/pdf",
                "%PDF-1.4 test content".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/documents")
                .file(pathTraversalFile)
                .param("ownerType", "PRODUCT")
                .param("ownerId", productA.getId().toString())
                .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isBadRequest());
    }

    // 13. Invalid Currency Code Rejected
    @Test
    public void test13_InvalidCurrencyCodeRejected() throws Exception {
        String quoteJson = """
                {
                    "unitPrice": 100.00,
                    "currency": "INVALID_CURRENCY_123",
                    "validityDate": "%s"
                }
                """.formatted(LocalDate.now().plusDays(30));

        mockMvc.perform(post("/api/v1/rfqs/supplier/" + rfqA.getId() + "/quotations")
                .header("Authorization", "Bearer " + tokenSupplierA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(quoteJson))
                .andExpect(status().isBadRequest());
    }

    // 14. Negative Price Rejected
    @Test
    public void test14_NegativePriceRejected() throws Exception {
        String quoteJson = """
                {
                    "unitPrice": -50.00,
                    "currency": "INR",
                    "validityDate": "%s"
                }
                """.formatted(LocalDate.now().plusDays(30));

        mockMvc.perform(post("/api/v1/rfqs/supplier/" + rfqA.getId() + "/quotations")
                .header("Authorization", "Bearer " + tokenSupplierA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(quoteJson))
                .andExpect(status().isBadRequest());
    }

    // 15. Admin Endpoint Accessible by Admin Only
    @Test
    public void test15_AdminEndpointAccessibleByAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk());
    }

    // 16. Public Product Documents Viewable Unauthenticated
    @Test
    public void test16_PublicProductDocumentsViewableUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/documents")
                .param("ownerType", "PRODUCT")
                .param("ownerId", productA.getId().toString()))
                .andExpect(status().isOk());
    }

    // 17. Error Response Does Not Expose Java Stack Trace
    @Test
    public void test17_ErrorResponseSanitizedNoStackTrace() throws Exception {
        mockMvc.perform(get("/api/v1/rfqs/invalid-uuid-format")
                .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }
}
