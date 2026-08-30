package com.kemkendra.document;

import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.product.Product;
import com.kemkendra.product.ProductCategory;
import com.kemkendra.product.ProductRepository;
import com.kemkendra.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ProductDocumentSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private String supplierToken;
    private User supplierUser;
    private Product testProduct;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        supplierUser = new User();
        supplierUser.setEmail("supplier.doc@kemkendra.com");
        supplierUser.setName("Supplier Doc");
        supplierUser.setPasswordHash("hash123");
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser.setStatus(com.kemkendra.identity.UserStatus.ACTIVE);
        supplierUser = userRepository.save(supplierUser);

        supplierToken = jwtService.generateToken(supplierUser);

        testProduct = new Product();
        testProduct.setName("Test Product");
        testProduct.setDescription("A product for testing documents");
        testProduct.setCategory(ProductCategory.API);
        testProduct.setPrice(new BigDecimal("10.00"));
        testProduct.setStock(100);
        testProduct.setSeller(supplierUser);
        testProduct.setCoaAvailable(false);
        testProduct.setMsdsAvailable(false);
        testProduct = productRepository.save(testProduct);
    }

    @Test
    public void testValidProductDocumentUploadUpdatesAvailability() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", "%PDF-1.4 valid test pdf content".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/documents")
                .file(file)
                .param("ownerType", "PRODUCT")
                .param("ownerId", testProduct.getId().toString())
                .param("category", "COA")
                .header("Authorization", "Bearer " + supplierToken))
                .andExpect(status().isCreated());

        Product updatedProduct = productRepository.findById(testProduct.getId()).orElseThrow();
        assertTrue(updatedProduct.getCoaAvailable(), "COA should be available after upload");
    }

    @Test
    public void testInvalidProductCategoryRejected() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", "%PDF-1.4 valid test pdf content".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/documents")
                .file(file)
                .param("ownerType", "PRODUCT")
                .param("ownerId", testProduct.getId().toString())
                .param("category", "INVOICE")
                .header("Authorization", "Bearer " + supplierToken))
                .andExpect(status().isBadRequest()); // Handled by exception handler
    }

    @Test
    public void testDeletingLastDocumentUpdatesAvailability() throws Exception {
        // Upload COA
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", "%PDF-1.4 valid test pdf content".getBytes()
        );

        String responseJson = mockMvc.perform(multipart("/api/v1/documents")
                .file(file)
                .param("ownerType", "PRODUCT")
                .param("ownerId", testProduct.getId().toString())
                .param("category", "COA")
                .header("Authorization", "Bearer " + supplierToken))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        // Extract Document ID
        String documentIdStr = responseJson.split("\"id\":\"")[1].split("\"")[0];
        UUID documentId = UUID.fromString(documentIdStr);

        Product updatedProduct = productRepository.findById(testProduct.getId()).orElseThrow();
        assertTrue(updatedProduct.getCoaAvailable(), "COA should be available");

        // Delete the COA document
        mockMvc.perform(delete("/api/v1/documents/" + documentId)
                .header("Authorization", "Bearer " + supplierToken))
                .andExpect(status().isNoContent());

        Product afterDeleteProduct = productRepository.findById(testProduct.getId()).orElseThrow();
        assertFalse(afterDeleteProduct.getCoaAvailable(), "COA should not be available after deletion of last COA");
    }

    @Test
    public void testUnauthorizedSupplierCannotUploadToAnotherProduct() throws Exception {
        User otherSupplier = new User();
        otherSupplier.setEmail("hacker@kemkendra.com");
        otherSupplier.setName("Hacker");
        otherSupplier.setPasswordHash("hash123");
        otherSupplier.setRole(UserRole.SUPPLIER);
        otherSupplier = userRepository.save(otherSupplier);

        String hackerToken = jwtService.generateToken(otherSupplier);

        MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", "%PDF-1.4 valid test pdf content".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/documents")
                .file(file)
                .param("ownerType", "PRODUCT")
                .param("ownerId", testProduct.getId().toString())
                .param("category", "COA")
                .header("Authorization", "Bearer " + hackerToken))
                .andExpect(status().isForbidden());
    }
}
