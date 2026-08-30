package com.kemkendra.document;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kemkendra.document.storage.StorageService;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.product.Product;
import com.kemkendra.product.ProductCategory;
import com.kemkendra.product.ProductRepository;
import com.kemkendra.security.JwtService;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class DocumentApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private StorageService storageService;

    @Autowired
    private ProductRepository productRepository;

    @MockBean
    private DocumentAuthorizationService documentAuthorizationService;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @TempDir
    static Path tempStorageDir;

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("kemkendra.storage.local.root", () -> tempStorageDir.toAbsolutePath().toString());
    }

    private String userToken;
    private User testUser;
    private Product testProduct;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        testUser = new User();
        testUser.setEmail("doc.tester@kemkendra.com");
        testUser.setName("Doc Tester");
        testUser.setPasswordHash("hash123");
        testUser.setRole(UserRole.USER);
        testUser.setStatus(com.kemkendra.identity.UserStatus.ACTIVE);
        testUser = userRepository.save(testUser);

        testProduct = new Product();
        testProduct.setName("Doc Api Test Product");
        testProduct.setDescription("A product for doc testing");
        testProduct.setCategory(ProductCategory.API);
        testProduct.setPrice(new java.math.BigDecimal("10.00"));
        testProduct.setStock(100);
        testProduct.setSeller(testUser);
        testProduct.setCoaAvailable(false);
        testProduct.setMsdsAvailable(false);
        testProduct = productRepository.save(testProduct);

        userToken = jwtService.generateToken(testUser);

        when(documentAuthorizationService.canAccessDocument(any(), any(), any())).thenReturn(true);
        when(documentAuthorizationService.canUploadDocument(any(), any(), any())).thenReturn(true);
        when(documentAuthorizationService.canDeleteDocument(any(), any())).thenReturn(true);
    }

    @Test
    public void testValidUploadCreatesDocumentAndStorageFile() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.pdf",
                "application/pdf",
                "%PDF-1.4 valid test pdf content".getBytes()
        );

        UUID ownerId = testProduct.getId();

        String responseJson = mockMvc.perform(multipart("/api/v1/documents")
                .file(file)
                .param("ownerType", "PRODUCT")
                .param("ownerId", ownerId.toString())
                .param("category", "COA")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.originalFileName").value("test.pdf"))
                .andExpect(jsonPath("$.mimeType").value("application/pdf"))
                .andExpect(jsonPath("$.storageKey").doesNotExist()) // Shouldn't be exposed usually, but let's assert it doesn't expose physical path
                .andReturn().getResponse().getContentAsString();

        assertEquals(1, documentRepository.count());
        Document saved = documentRepository.findAll().get(0);
        
        // Assert storage file exists
        assertTrue(storageService.exists(saved.getStorageKey()));
        
        // Assert no physical path leak in JSON string (primitive check)
        assertFalse(responseJson.contains(tempStorageDir.toAbsolutePath().toString()));
    }

    @Test
    public void testRejectsMissingRequiredFields() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", "%PDF-1.4 valid data".getBytes());

        mockMvc.perform(multipart("/api/v1/documents")
                .file(file)
                // Missing ownerType
                .param("ownerId", UUID.randomUUID().toString())
                .param("category", "COA")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testRejectsUnsupportedMimeType() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "script.sh", "application/x-sh", "echo hello".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/documents")
                .file(file)
                .param("ownerType", "PRODUCT")
                .param("ownerId", UUID.randomUUID().toString())
                .param("category", "COA")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Unsupported file type")));
    }

    @Test
    public void testRejectsExecutableExtensionEvenIfMimeTypeSpoofed() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "malicious.exe", "application/pdf", "fake pdf".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/documents")
                .file(file)
                .param("ownerType", "PRODUCT")
                .param("ownerId", UUID.randomUUID().toString())
                .param("category", "COA")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Unsupported file type")));
    }

    @Test
    public void testPathTraversalFilenameIsNormalized() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "../../../etc/passwd.pdf", "application/pdf", "%PDF-1.4 test passwd content".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/documents")
                .file(file)
                .param("ownerType", "PRODUCT")
                .param("ownerId", testProduct.getId().toString())
                .param("category", "COA")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalFileName").value("passwd.pdf")); // directory traversal stripped
    }

    @Test
    public void testGetDocumentReturnsMetadataNotRawFile() throws Exception {
        Document doc = createTestDocument();
        
        mockMvc.perform(get("/api/v1/documents/" + doc.getId())
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.originalFileName").value(doc.getOriginalFileName()))
                .andExpect(jsonPath("$.storageKey").doesNotExist());
    }

    @Test
    public void testListDocumentsByOwner() throws Exception {
        Document doc = createTestDocument();
        
        mockMvc.perform(get("/api/v1/documents")
                .param("ownerType", doc.getOwnerType().name())
                .param("ownerId", doc.getOwnerId().toString())
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(doc.getId().toString()));
    }

    @Test
    public void testDeleteDocumentRemovesDatabaseAndStorage() throws Exception {
        Document doc = createTestDocument();
        assertTrue(storageService.exists(doc.getStorageKey()));

        mockMvc.perform(delete("/api/v1/documents/" + doc.getId())
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNoContent());

        assertEquals(0, documentRepository.count());
        assertFalse(storageService.exists(doc.getStorageKey()));
    }

    @Test
    public void testDeleteDocumentWithMissingPhysicalFileSucceedsGracefully() throws Exception {
        Document doc = createTestDocument();
        // forcefully delete the physical file early
        storageService.delete(doc.getStorageKey());
        
        mockMvc.perform(delete("/api/v1/documents/" + doc.getId())
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNoContent());

        assertEquals(0, documentRepository.count());
    }

    @Test
    public void testStorageFailureRollsBackDatabase() throws Exception {
        UUID ownerId = UUID.randomUUID();

        // The LocalStorageService is configured to fail when extension is .FAIL_STORAGE
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.FAIL_STORAGE", "application/pdf", "data".getBytes()
        );

        try {
            mockMvc.perform(multipart("/api/v1/documents")
                    .file(file)
                    .param("ownerType", "PRODUCT")
                    .param("ownerId", ownerId.toString())
                    .param("category", "COA")
                    .header("Authorization", "Bearer " + userToken))
                    .andExpect(status().is5xxServerError());
        } catch (Exception e) {
            // Expected NestedServletException wrapping RuntimeException
            assertTrue(e.getCause().getMessage().contains("Simulated storage failure"));
        }

        // Verify DB is clean
        assertEquals(0, documentRepository.count());
    }

    @Test
    public void testUnauthenticatedRequestsRejected() throws Exception {
        mockMvc.perform(delete("/api/v1/documents/" + UUID.randomUUID()))
                .andExpect(status().isUnauthorized());
    }

    private Document createTestDocument() {
        Document doc = new Document();
        doc.setOwnerType(DocumentOwnerType.PRODUCT);
        doc.setOwnerId(testProduct.getId());
        doc.setCategory(DocumentCategory.COA);
        doc.setOriginalFileName("test.pdf");
        
        String key = "documents/" + UUID.randomUUID() + ".pdf";
        doc.setStorageKey(key);
        doc.setMimeType("application/pdf");
        doc.setFileSize(100L);
        doc.setUploadedBy(testUser.getId());
        
        doc = documentRepository.saveAndFlush(doc);
        
        // create dummy file in storage
        storageService.store(key, new java.io.ByteArrayInputStream("dummy".getBytes()));
        
        return doc;
    }

    @Test
    public void testIdorProtectionOnDownload() throws Exception {
        Document doc = createTestDocument();

        // Simulate unauthorized access
        when(documentAuthorizationService.canAccessDocument(any(), any(), any())).thenReturn(false);

        mockMvc.perform(get("/api/v1/documents/{id}/download", doc.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testIdorProtectionOnGetMetadata() throws Exception {
        Document doc = createTestDocument();

        when(documentAuthorizationService.canAccessDocument(any(), any(), any())).thenReturn(false);

        mockMvc.perform(get("/api/v1/documents/{id}", doc.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testIdorProtectionOnDelete() throws Exception {
        Document doc = createTestDocument();

        when(documentAuthorizationService.canDeleteDocument(any(), any())).thenReturn(false);

        mockMvc.perform(delete("/api/v1/documents/{id}", doc.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
        
        assertTrue(documentRepository.existsById(doc.getId()));
    }

    @Test
    public void testSecureDownloadSuccess() throws Exception {
        Document doc = createTestDocument();

        when(documentAuthorizationService.canAccessDocument(any(), any(), any())).thenReturn(true);

        mockMvc.perform(get("/api/v1/documents/{id}/download", doc.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.parseMediaType(doc.getMimeType())))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"test.pdf\""))
                .andExpect(content().string("dummy"));
    }
}
