package com.synthora.document;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.product.Product;
import com.synthora.product.ProductCategory;
import com.synthora.product.ProductRepository;
import com.synthora.security.JwtService;
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

    private String supplierToken;
    private User supplierUser;
    private Product testProduct;

    @BeforeEach
    public void setup() {
        documentRepository.deleteAll();
        productRepository.deleteAll();
        userRepository.deleteAll();

        supplierUser = new User();
        supplierUser.setEmail("supplier.doc@synthora.com");
        supplierUser.setName("Supplier Doc");
        supplierUser.setPasswordHash("hash123");
        supplierUser.setRole(UserRole.SUPPLIER);
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
        otherSupplier.setEmail("hacker@synthora.com");
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
