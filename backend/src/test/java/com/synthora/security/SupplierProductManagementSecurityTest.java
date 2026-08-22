package com.synthora.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.product.*;
import com.synthora.product.dto.CreateProductRequest;
import com.synthora.product.dto.ProductSupplierRequest;
import com.synthora.product.dto.UpdateProductRequest;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class SupplierProductManagementSecurityTest {

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
    private ProductRepository productRepository;

    @Autowired
    private ProductSupplierRepository productSupplierRepository;

    @Autowired
    private ProductImageRepository productImageRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private User supplierUserA;
    private Supplier supplierA;
    private SellerProfile sellerProfileA;

    private User supplierUserB;
    private Supplier supplierB;

    private User buyerUser;

    private Product productA;

    // Real PNG 1x1 magic bytes
    private static final byte[] VALID_PNG_BYTES = new byte[]{
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, (byte) 0xC4,
            (byte) 0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
            0x54, 0x78, (byte) 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
            0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, (byte) 0xB4, 0x00,
            0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, (byte) 0xAE,
            0x42, 0x60, (byte) 0x82
    };

    // Real JPEG SOI magic bytes
    private static final byte[] VALID_JPEG_BYTES = new byte[]{
            (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0,
            0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00,
            (byte) 0xFF, (byte) 0xDB, 0x00, 0x43, 0x00, 0x08,
            (byte) 0xFF, (byte) 0xD9
    };

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM users;");

        // 1. Supplier User A
        supplierUserA = new User(
                UUID.randomUUID(),
                "Dr. John Vance",
                "supplier.a@chemcorp.com",
                "+1-555-0101",
                "hash",
                UserRole.SUPPLIER,
                UserStatus.ACTIVE
        );
        userRepository.save(supplierUserA);

        supplierA = new Supplier();
        supplierA.setUser(supplierUserA);
        supplierA.setName("Vance Chemical Solutions");
        supplierA.setSlug("vance-chem-" + UUID.randomUUID().toString().substring(0, 8));
        supplierA.setCountryName("Germany");
        supplierA.setCountryCode("DE");
        supplierA.setVerified(true);
        supplierA.setExportReady(true);
        supplierRepository.save(supplierA);

        sellerProfileA = new SellerProfile();
        sellerProfileA.setUser(supplierUserA);
        sellerProfileA.setCompanyName("Vance Chemical Solutions");
        sellerProfileA.setCountry("Germany");
        sellerProfileA.setCity("Berlin");
        sellerProfileRepository.save(sellerProfileA);

        // 2. Supplier User B
        supplierUserB = new User(
                UUID.randomUUID(),
                "Alice Schmidt",
                "supplier.b@apexchem.com",
                "+1-555-0202",
                "hash",
                UserRole.SUPPLIER,
                UserStatus.ACTIVE
        );
        userRepository.save(supplierUserB);

        supplierB = new Supplier();
        supplierB.setUser(supplierUserB);
        supplierB.setName("Apex Specialty Chemicals");
        supplierB.setSlug("apex-chem-" + UUID.randomUUID().toString().substring(0, 8));
        supplierB.setCountryName("India");
        supplierB.setCountryCode("IN");
        supplierRepository.save(supplierB);

        // 3. Buyer User
        buyerUser = new User(
                UUID.randomUUID(),
                "Procurement Buyer",
                "buyer@pharma.com",
                "+1-555-0303",
                "hash",
                UserRole.USER,
                UserStatus.ACTIVE
        );
        userRepository.save(buyerUser);

        // 4. Product owned by Supplier A
        productA = new Product();
        productA.setName("High Purity Paracetamol");
        productA.setProductCode("API-100001");
        productA.setDescription("Pharma grade acetaminophen API 99.8%");
        productA.setCategory(ProductCategory.API);
        productA.setPrice(new BigDecimal("18.50"));
        productA.setStock(5000);
        productA.setCasNumber("103-90-2");
        productA.setMolecularFormula("C8H9NO2");
        productA.setPurity(new BigDecimal("99.80"));
        productA.setGrade("Pharma Grade");
        productA.setPackaging("25kg Fiber Drum");
        productA.setMoqKg(new BigDecimal("100.00"));
        productA.setLeadTimeDays(7);
        productA.setAvailabilityStatus("IN_STOCK");
        productA.setSeller(supplierUserA);
        productRepository.save(productA);
    }

    // =========================================================================
    // 1. SUPPLIER PROFILE TESTS
    // =========================================================================

    @Test
    @DisplayName("Supplier can view own profile")
    @WithMockUser(username = "supplier.a@chemcorp.com", roles = "SUPPLIER")
    void testSupplierCanViewOwnProfile() throws Exception {
        mockMvc.perform(get("/api/v1/sellers/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyName", is("Vance Chemical Solutions")))
                .andExpect(jsonPath("$.country", is("Germany")));
    }

    @Test
    @DisplayName("Supplier can update own profile successfully")
    @WithMockUser(username = "supplier.a@chemcorp.com", roles = "SUPPLIER")
    void testSupplierCanUpdateOwnProfile() throws Exception {
        UpdateSellerProfileRequest request = new UpdateSellerProfileRequest(
                "Vance Global Chem Tech",
                "DE-99887766",
                "Industrial Park 4B",
                "Munich",
                "Bavaria",
                "Germany",
                "https://vance-global.com",
                "ISO 9001, GMP, FDA",
                "Leading manufacturer of high-purity APIs."
        );

        mockMvc.perform(put("/api/v1/sellers/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyName", is("Vance Global Chem Tech")))
                .andExpect(jsonPath("$.city", is("Munich")));

        Supplier updatedSupplier = supplierRepository.findByUser(supplierUserA).orElseThrow();
        assertThat(updatedSupplier.getName()).isEqualTo("Vance Global Chem Tech");
    }

    @Test
    @DisplayName("Buyer cannot update supplier profile")
    @WithMockUser(username = "buyer@pharma.com", roles = "USER")
    void testBuyerCannotUpdateSupplierProfile() throws Exception {
        UpdateSellerProfileRequest request = new UpdateSellerProfileRequest(
                "Malicious Update", null, null, null, null, null, null, null, null
        );

        mockMvc.perform(put("/api/v1/sellers/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated user cannot update supplier profile")
    void testUnauthenticatedCannotUpdateProfile() throws Exception {
        UpdateSellerProfileRequest request = new UpdateSellerProfileRequest(
                "Malicious Update", null, null, null, null, null, null, null, null
        );

        mockMvc.perform(put("/api/v1/sellers/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 2. PRODUCT CREATION & PRODUCT CODE TESTS
    // =========================================================================

    @Test
    @DisplayName("Supplier can create product with auto-generated product code")
    @WithMockUser(username = "supplier.a@chemcorp.com", roles = "SUPPLIER")
    void testSupplierProductCreationGeneratesProductCode() throws Exception {
        CreateProductRequest request = new CreateProductRequest(
                "N,N-Dimethylformamide (DMF)",
                "High purity organic solvent for chemical synthesis and peptide production.",
                new BigDecimal("12.50"),
                ProductCategory.SOLVENT,
                10000,
                "68-12-2",
                "C3H7NO",
                new BigDecimal("99.90"),
                "HPLC Grade",
                new BigDecimal("500.00"),
                "200L Drum",
                5,
                true,
                true,
                true,
                "IN_STOCK"
        );

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("N,N-Dimethylformamide (DMF)")))
                .andExpect(jsonPath("$.category", is("SOLVENT")))
                .andExpect(jsonPath("$.productCode", startsWith("SOL-")))
                .andExpect(jsonPath("$.sellerId", is(supplierUserA.getId().toString())));
    }

    @Test
    @DisplayName("Product code is strictly generated server-side and client injection is ignored")
    @WithMockUser(username = "supplier.a@chemcorp.com", roles = "SUPPLIER")
    void testProductCodeClientInjectionIsIgnored() throws Exception {
        String payloadWithInjectedCode = """
        {
            "name": "2-Chloropyridine API Intermediate",
            "description": "Pharmaceutical intermediate for antispasmodics and antihistamines.",
            "price": 45.00,
            "stock": 2000,
            "category": "INTERMEDIATE",
            "casNumber": "109-09-1",
            "productCode": "HACKED-CODE-999"
        }
        """;

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadWithInjectedCode))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productCode", startsWith("INT-")))
                .andExpect(jsonPath("$.productCode", not("HACKED-CODE-999")));
    }

    @Test
    @DisplayName("Multiple products receive unique product codes without collisions")
    @WithMockUser(username = "supplier.a@chemcorp.com", roles = "SUPPLIER")
    void testMultipleProductCodesAreUnique() throws Exception {
        CreateProductRequest req1 = new CreateProductRequest(
                "Product 1", "Desc 1", new BigDecimal("10.00"), ProductCategory.API, 100,
                null, null, null, null, null, null, null, false, false, false, "IN_STOCK"
        );
        CreateProductRequest req2 = new CreateProductRequest(
                "Product 2", "Desc 2", new BigDecimal("20.00"), ProductCategory.API, 200,
                null, null, null, null, null, null, null, false, false, false, "IN_STOCK"
        );

        var res1 = mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isOk())
                .andReturn();

        var res2 = mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isOk())
                .andReturn();

        String code1 = objectMapper.readTree(res1.getResponse().getContentAsString()).get("productCode").asText();
        String code2 = objectMapper.readTree(res2.getResponse().getContentAsString()).get("productCode").asText();

        assertThat(code1).startsWith("API-");
        assertThat(code2).startsWith("API-");
        assertThat(code1).isNotEqualTo(code2);
    }

    // =========================================================================
    // 3. PRODUCT OWNERSHIP & IDOR AUTHORIZATION TESTS
    // =========================================================================

    @Test
    @DisplayName("Supplier A can update own product")
    @WithMockUser(username = "supplier.a@chemcorp.com", roles = "SUPPLIER")
    void testSupplierCanUpdateOwnProduct() throws Exception {
        UpdateProductRequest updateReq = new UpdateProductRequest(
                "High Purity Paracetamol (Updated)",
                "Updated pharma grade acetaminophen",
                new BigDecimal("19.75"),
                ProductCategory.API,
                6000,
                "103-90-2",
                "C8H9NO2",
                new BigDecimal("99.90"),
                "Pharma Grade USP/EP",
                new BigDecimal("150.00"),
                "25kg Fiber Drum",
                5,
                true,
                true,
                true,
                "IN_STOCK"
        );

        mockMvc.perform(put("/api/v1/products/" + productA.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("High Purity Paracetamol (Updated)")))
                .andExpect(jsonPath("$.price", is(19.75)));
    }

    @Test
    @DisplayName("Supplier B CANNOT update Supplier A's product (IDOR Defense)")
    @WithMockUser(username = "supplier.b@apexchem.com", roles = "SUPPLIER")
    void testSupplierBCannotUpdateSupplierAProduct() throws Exception {
        UpdateProductRequest maliciousReq = new UpdateProductRequest(
                "Hijacked Product", "Malicious desc", new BigDecimal("0.01"), ProductCategory.API, 100,
                null, null, null, null, null, null, null, null, null, null, null
        );

        mockMvc.perform(put("/api/v1/products/" + productA.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(maliciousReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Supplier B CANNOT delete Supplier A's product (IDOR Defense)")
    @WithMockUser(username = "supplier.b@apexchem.com", roles = "SUPPLIER")
    void testSupplierBCannotDeleteSupplierAProduct() throws Exception {
        mockMvc.perform(delete("/api/v1/products/" + productA.getId()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Buyer CANNOT modify or delete supplier product")
    @WithMockUser(username = "buyer@pharma.com", roles = "USER")
    void testBuyerCannotModifyProduct() throws Exception {
        mockMvc.perform(delete("/api/v1/products/" + productA.getId()))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // 4. PRODUCT IMAGE UPLOAD & SECURITY TESTS (Phase 2H.5)
    // =========================================================================

    @Test
    @DisplayName("Supplier can upload valid PNG image to own product and it becomes primary")
    @WithMockUser(username = "supplier.a@chemcorp.com", roles = "SUPPLIER")
    void testSupplierCanUploadValidImage() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "paracetamol-sample.png",
                "image/png",
                VALID_PNG_BYTES
        );

        mockMvc.perform(multipart("/api/v1/products/" + productA.getId() + "/images")
                        .file(file))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fileName", is("paracetamol-sample.png")))
                .andExpect(jsonPath("$.contentType", is("image/png")))
                .andExpect(jsonPath("$.isPrimary", is(true)))
                .andExpect(jsonPath("$.imageUrl", containsString("/content")));

        assertThat(productImageRepository.countByProductId(productA.getId())).isEqualTo(1);
    }

    @Test
    @DisplayName("Invalid file types (e.g. text/script) are strictly rejected")
    @WithMockUser(username = "supplier.a@chemcorp.com", roles = "SUPPLIER")
    void testInvalidFileTypeIsRejected() throws Exception {
        MockMultipartFile scriptFile = new MockMultipartFile(
                "file",
                "exploit.sh",
                "application/x-sh",
                "#!/bin/bash\necho test\n".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/products/" + productA.getId() + "/images")
                        .file(scriptFile))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("MIME spoofing (PHP script masked as JPG) is rejected by binary magic-byte inspection")
    @WithMockUser(username = "supplier.a@chemcorp.com", roles = "SUPPLIER")
    void testMimeSpoofingIsRejected() throws Exception {
        MockMultipartFile spoofedFile = new MockMultipartFile(
                "file",
                "image.jpg",
                "image/jpeg",
                "<?php phpinfo(); ?>".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/products/" + productA.getId() + "/images")
                        .file(spoofedFile))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Supplier B CANNOT upload image to Supplier A's product (IDOR Defense)")
    @WithMockUser(username = "supplier.b@apexchem.com", roles = "SUPPLIER")
    void testSupplierBCannotUploadImageToSupplierAProduct() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "malicious.png",
                "image/png",
                VALID_PNG_BYTES
        );

        mockMvc.perform(multipart("/api/v1/products/" + productA.getId() + "/images")
                        .file(file))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Supplier can set a different image as primary and delete images")
    @WithMockUser(username = "supplier.a@chemcorp.com", roles = "SUPPLIER")
    void testPrimaryImageManagementAndDelete() throws Exception {
        // Upload image 1
        MockMultipartFile file1 = new MockMultipartFile("file", "img1.png", "image/png", VALID_PNG_BYTES);
        var res1 = mockMvc.perform(multipart("/api/v1/products/" + productA.getId() + "/images").file(file1))
                .andExpect(status().isCreated()).andReturn();
        UUID img1Id = UUID.fromString(objectMapper.readTree(res1.getResponse().getContentAsString()).get("id").asText());

        // Upload image 2
        MockMultipartFile file2 = new MockMultipartFile("file", "img2.jpg", "image/jpeg", VALID_JPEG_BYTES);
        var res2 = mockMvc.perform(multipart("/api/v1/products/" + productA.getId() + "/images").file(file2))
                .andExpect(status().isCreated()).andReturn();
        UUID img2Id = UUID.fromString(objectMapper.readTree(res2.getResponse().getContentAsString()).get("id").asText());

        // Set image 2 as primary
        mockMvc.perform(put("/api/v1/products/" + productA.getId() + "/images/" + img2Id + "/primary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isPrimary", is(true)));

        // Verify image 1 is no longer primary
        ProductImage updatedImg1 = productImageRepository.findById(img1Id).orElseThrow();
        assertThat(updatedImg1.getIsPrimary()).isFalse();

        // Delete image 2
        mockMvc.perform(delete("/api/v1/products/" + productA.getId() + "/images/" + img2Id))
                .andExpect(status().isNoContent());

        // Image 1 is promoted back to primary
        ProductImage promotedImg1 = productImageRepository.findById(img1Id).orElseThrow();
        assertThat(promotedImg1.getIsPrimary()).isTrue();
    }

    @Test
    @DisplayName("Enforcing maximum 5 images per product")
    @WithMockUser(username = "supplier.a@chemcorp.com", roles = "SUPPLIER")
    void testEnforceMaxImagesPerProduct() throws Exception {
        for (int i = 1; i <= 5; i++) {
            MockMultipartFile file = new MockMultipartFile("file", "img" + i + ".png", "image/png", VALID_PNG_BYTES);
            mockMvc.perform(multipart("/api/v1/products/" + productA.getId() + "/images").file(file))
                    .andExpect(status().isCreated());
        }

        // 6th image must be rejected
        MockMultipartFile file6 = new MockMultipartFile("file", "img6.png", "image/png", VALID_PNG_BYTES);
        mockMvc.perform(multipart("/api/v1/products/" + productA.getId() + "/images").file(file6))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // 5. PRODUCT SUPPLIER OFFERING TESTS
    // =========================================================================

    @Test
    @DisplayName("Supplier can add offering to existing product")
    @WithMockUser(username = "supplier.b@apexchem.com", roles = "SUPPLIER")
    void testSupplierCanAddOfferingToProduct() throws Exception {
        ProductSupplierRequest req = new ProductSupplierRequest(
                "99.50", "USP", new BigDecimal("250.00"), "50kg Drum", 10, true, true
        );

        mockMvc.perform(post("/api/v1/products/" + productA.getId() + "/supplier-offering")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productName", is("High Purity Paracetamol")))
                .andExpect(jsonPath("$.purity", is("99.50")));
    }

    @Test
    @DisplayName("Offering validation rejects negative numbers")
    @WithMockUser(username = "supplier.b@apexchem.com", roles = "SUPPLIER")
    void testOfferingRejectsNegativeMoq() throws Exception {
        ProductSupplierRequest req = new ProductSupplierRequest(
                "99.50", "USP", new BigDecimal("-50.00"), "50kg Drum", 10, true, true
        );

        mockMvc.perform(post("/api/v1/products/" + productA.getId() + "/supplier-offering")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }
}
