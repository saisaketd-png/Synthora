package com.synthora.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.document.*;
import com.synthora.document.storage.StorageService;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.product.Product;
import com.synthora.product.ProductCategory;
import com.synthora.product.ProductRepository;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.rfq.Rfq;
import com.synthora.rfq.RfqRepository;
import com.synthora.rfq.RfqStatus;
import com.synthora.seller.SellerProfile;
import com.synthora.seller.SellerProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class FileSecurityTest {

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
    private DocumentRepository documentRepository;

    @Autowired
    private StorageService storageService;

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

    private User adminUser;
    private String tokenAdmin;

    private Product productA;
    private Rfq rfqA;

    @BeforeEach
    public void setup() {
        rateLimiterService.resetAll();
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM users;");

        // Buyers
        buyerA = createTestUser("buyer_a_filesec@synthora.com", "Buyer A", UserRole.USER);
        tokenBuyerA = jwtService.generateToken(buyerA);

        buyerB = createTestUser("buyer_b_filesec@synthora.com", "Buyer B", UserRole.USER);
        tokenBuyerB = jwtService.generateToken(buyerB);

        // Suppliers
        supplierUserA = createTestUser("supplier_a_filesec@synthora.com", "Supplier User A", UserRole.SUPPLIER);
        supplierA = createTestSupplier("Supplier Corp A", "supplier-corp-a", supplierUserA);
        tokenSupplierA = jwtService.generateToken(supplierUserA);

        supplierUserB = createTestUser("supplier_b_filesec@synthora.com", "Supplier User B", UserRole.SUPPLIER);
        supplierB = createTestSupplier("Supplier Corp B", "supplier-corp-b", supplierUserB);
        tokenSupplierB = jwtService.generateToken(supplierUserB);

        // Admin
        adminUser = createTestUser("admin_filesec@synthora.com", "Admin Security", UserRole.ADMIN);
        tokenAdmin = jwtService.generateToken(adminUser);

        // Product for Supplier A
        productA = createTestProduct("Chemical Substance A", supplierUserA);

        // RFQ for Buyer A -> Supplier A
        rfqA = new Rfq();
        rfqA.setBuyerId(buyerA.getId());
        rfqA.setProductId(productA.getId());
        rfqA.setSupplierId(supplierA.getId());
        rfqA.setQuantity(new BigDecimal("500"));
        rfqA.setUnit("KG");
        rfqA.setStatus(RfqStatus.PENDING);
        rfqA = rfqRepository.save(rfqA);
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
        p.setDescription("Test chemical description");
        p.setPrice(new BigDecimal("100.00"));
        p.setStock(500);
        p.setCategory(ProductCategory.API);
        p.setSeller(seller);
        p.setMoqKg(new BigDecimal("10.00"));
        p.setAvailabilityStatus("IN_STOCK");
        return productRepository.save(p);
    }

    // =========================================================================
    // SECTION 1: MAGIC-BYTE / FILE SIGNATURE VALIDATION
    // =========================================================================

    @Test
    @DisplayName("1. Valid PDF bytes with .pdf extension is accepted (201)")
    public void testValidPdfAccepted() throws Exception {
        byte[] pdfBytes = "%PDF-1.7\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "coa_document.pdf", "application/pdf", pdfBytes);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "COA")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalFileName", is("coa_document.pdf")))
                .andExpect(jsonPath("$.mimeType", is("application/pdf")));
    }

    @Test
    @DisplayName("2. Valid PNG image bytes with .png extension is accepted (201)")
    public void testValidPngAccepted() throws Exception {
        byte[] pngBytes = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52};
        MockMultipartFile file = new MockMultipartFile("file", "spec_chart.png", "image/png", pngBytes);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "TECHNICAL_SPECIFICATION")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalFileName", is("spec_chart.png")))
                .andExpect(jsonPath("$.mimeType", is("image/png")));
    }

    @Test
    @DisplayName("3. Valid JPEG image bytes with .jpg extension is accepted (201)")
    public void testValidJpegAccepted() throws Exception {
        byte[] jpegBytes = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00};
        MockMultipartFile file = new MockMultipartFile("file", "purity_analysis.jpg", "image/jpeg", jpegBytes);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "TECHNICAL_SPECIFICATION")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalFileName", is("purity_analysis.jpg")))
                .andExpect(jsonPath("$.mimeType", is("image/jpeg")));
    }

    @Test
    @DisplayName("4. Valid OpenXML DOCX bytes with .docx extension is accepted (201)")
    public void testValidDocxAccepted() throws Exception {
        // Zip container signature PK\x03\x04
        byte[] docxBytes = new byte[]{0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00, 0x08, 0x00, 0x00, 0x00, 0x21, 0x00};
        MockMultipartFile file = new MockMultipartFile("file", "contract.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", docxBytes);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "TECHNICAL_SPECIFICATION")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalFileName", is("contract.docx")));
    }

    @Test
    @DisplayName("5. HTML disguised as .pdf is rejected via magic byte inspection (400)")
    public void testHtmlRenamedToPdfRejected() throws Exception {
        byte[] htmlBytes = "<html><head><script>alert(1)</script></head><body>Fake PDF</body></html>".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "fake_report.pdf", "application/pdf", htmlBytes);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "COA")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("HTML/Script payload detected")));
    }

    @Test
    @DisplayName("6. JavaScript disguised as .pdf is rejected via signature inspection (400)")
    public void testJavaScriptRenamedToPdfRejected() throws Exception {
        byte[] jsBytes = "var x = 10; function exploit() { fetch('/steal'); }".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "script.pdf", "application/pdf", jsBytes);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "COA")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("File signature mismatch")));
    }

    @Test
    @DisplayName("7. Windows PE Executable binary disguised as .pdf is rejected (400)")
    public void testExecutableRenamedToPdfRejected() throws Exception {
        byte[] peBytes = new byte[]{0x4D, 0x5A, (byte) 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00}; // "MZ..."
        MockMultipartFile file = new MockMultipartFile("file", "malware.pdf", "application/pdf", peBytes);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "COA")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Executable binary content detected")));
    }

    @Test
    @DisplayName("8. Linux ELF binary disguised as .pdf is rejected (400)")
    public void testElfBinaryRenamedToPdfRejected() throws Exception {
        byte[] elfBytes = new byte[]{0x7F, 0x45, 0x4C, 0x46, 0x02, 0x01, 0x01, 0x00}; // "\x7fELF..."
        MockMultipartFile file = new MockMultipartFile("file", "rootkit.pdf", "application/pdf", elfBytes);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "COA")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Executable binary content detected")));
    }

    @Test
    @DisplayName("9. Text file disguised as .jpg image is rejected (400)")
    public void testTextRenamedToJpgRejected() throws Exception {
        byte[] textBytes = "This is simply plain text without JPEG magic bytes.".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "not_image.jpg", "image/jpeg", textBytes);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "TECHNICAL_SPECIFICATION")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("File signature mismatch")));
    }

    @Test
    @DisplayName("10. SVG file upload is rejected to prevent active SVG script execution (400)")
    public void testSvgUploadRejected() throws Exception {
        byte[] svgBytes = "<svg xmlns=\"http://www.w3.org/2000/svg\" onload=\"alert(1)\"><rect width=\"100\" height=\"100\"/></svg>".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "vector_graphic.svg", "image/svg+xml", svgBytes);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "TECHNICAL_SPECIFICATION")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // SECTION 2: FILENAME ATTACKS & DOUBLE EXTENSION DEFENSE
    // =========================================================================

    @Test
    @DisplayName("11. Double extension with executable (invoice.pdf.exe) is rejected (400)")
    public void testDoubleExtensionExecutableRejected() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 sample".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "invoice.pdf.exe", "application/pdf", pdfBytes);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "COA")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("12. Double extension with script (coa.pdf.bat) is rejected (400)")
    public void testDoubleExtensionScriptRejected() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 sample".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "coa.pdf.bat", "application/pdf", pdfBytes);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "COA")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("13. Unix path traversal in filename (../../etc/passwd.pdf) is sanitized")
    public void testUnixPathTraversalSanitized() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 valid test pdf content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "../../../../etc/passwd.pdf", "application/pdf", pdfBytes);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "COA")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalFileName", is("passwd.pdf")));
    }

    @Test
    @DisplayName("14. Windows path traversal (..\\..\\windows\\system32\\cmd.pdf) is sanitized")
    public void testWindowsPathTraversalSanitized() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 valid test pdf content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "..\\..\\..\\windows\\system32\\cmd.pdf", "application/pdf", pdfBytes);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "COA")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalFileName", is("cmd.pdf")));
    }

    @Test
    @DisplayName("15. Double-URL-encoded traversal (%252e%252e%252fsecret.pdf) is sanitized")
    public void testDoubleEncodedTraversalSanitized() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 valid test pdf content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "%252e%252e%252fsecret.pdf", "application/pdf", pdfBytes);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "COA")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalFileName", is("secret.pdf")));
    }

    @Test
    @DisplayName("16. Windows reserved device filename (CON.pdf) is sanitized with safe prefix")
    public void testWindowsReservedNameSanitized() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 valid test pdf content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "CON.pdf", "application/pdf", pdfBytes);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "COA")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalFileName", is("safe_CON.pdf")));
    }

    // =========================================================================
    // SECTION 3: FILE SIZE & EMPTY BOUNDARIES
    // =========================================================================

    @Test
    @DisplayName("17. Empty file upload is rejected (400)")
    public void testEmptyFileUploadRejected() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "empty.pdf", "application/pdf", new byte[0]);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "COA")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("File cannot be empty")));
    }

    // =========================================================================
    // SECTION 4: AUTHORIZATION & IDOR / BOLA PROTECTION
    // =========================================================================

    @Test
    @DisplayName("18. Buyer A can upload and download document for their own RFQ")
    public void testBuyerACanUploadAndDownloadOwnRfqDoc() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 valid test pdf content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "rfq_spec.pdf", "application/pdf", pdfBytes);

        String uploadJson = mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "RFQ")
                        .param("ownerId", rfqA.getId().toString())
                        .param("category", "TECHNICAL_SPECIFICATION")
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String docId = uploadJson.split("\"id\":\"")[1].split("\"")[0];

        mockMvc.perform(get("/api/v1/documents/" + docId + "/download")
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"rfq_spec.pdf\""))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "private, no-cache, no-store, must-revalidate"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }

    @Test
    @DisplayName("19. Buyer B cannot download Buyer A's RFQ document (IDOR BOLA defense: 403)")
    public void testBuyerBCannotDownloadBuyerADocument() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 valid test pdf content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "private_rfq_spec.pdf", "application/pdf", pdfBytes);

        String uploadJson = mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "RFQ")
                        .param("ownerId", rfqA.getId().toString())
                        .param("category", "TECHNICAL_SPECIFICATION")
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String docId = uploadJson.split("\"id\":\"")[1].split("\"")[0];

        mockMvc.perform(get("/api/v1/documents/" + docId + "/download")
                        .header("Authorization", "Bearer " + tokenBuyerB))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("20. Supplier B (unrelated supplier) cannot download RFQ document assigned to Supplier A (403)")
    public void testUnrelatedSupplierCannotDownloadRfqDoc() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 valid test pdf content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "rfq_spec.pdf", "application/pdf", pdfBytes);

        String uploadJson = mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "RFQ")
                        .param("ownerId", rfqA.getId().toString())
                        .param("category", "TECHNICAL_SPECIFICATION")
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String docId = uploadJson.split("\"id\":\"")[1].split("\"")[0];

        mockMvc.perform(get("/api/v1/documents/" + docId + "/download")
                        .header("Authorization", "Bearer " + tokenSupplierB))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("21. Assigned Supplier A CAN download RFQ document assigned to them (200)")
    public void testAssignedSupplierCanDownloadRfqDoc() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 valid test pdf content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "rfq_spec.pdf", "application/pdf", pdfBytes);

        String uploadJson = mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "RFQ")
                        .param("ownerId", rfqA.getId().toString())
                        .param("category", "TECHNICAL_SPECIFICATION")
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String docId = uploadJson.split("\"id\":\"")[1].split("\"")[0];

        mockMvc.perform(get("/api/v1/documents/" + docId + "/download")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("22. Unauthenticated user cannot access document download (401)")
    public void testUnauthenticatedDownloadRejected() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 valid test pdf content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "rfq_spec.pdf", "application/pdf", pdfBytes);

        String uploadJson = mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "RFQ")
                        .param("ownerId", rfqA.getId().toString())
                        .param("category", "TECHNICAL_SPECIFICATION")
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String docId = uploadJson.split("\"id\":\"")[1].split("\"")[0];

        mockMvc.perform(get("/api/v1/documents/" + docId + "/download"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("23. Unauthorized user cannot delete another user's document (403)")
    public void testUnauthorizedDeleteRejected() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 valid test pdf content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "rfq_spec.pdf", "application/pdf", pdfBytes);

        String uploadJson = mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "RFQ")
                        .param("ownerId", rfqA.getId().toString())
                        .param("category", "TECHNICAL_SPECIFICATION")
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String docId = uploadJson.split("\"id\":\"")[1].split("\"")[0];

        // Supplier A can view, but CANNOT delete Buyer A's uploaded document
        mockMvc.perform(delete("/api/v1/documents/" + docId)
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // SECTION 5: PHYSICAL STORAGE ISOLATION & SECURE HEADERS
    // =========================================================================

    @Test
    @DisplayName("24. Physical storage key is server-generated with random UUID")
    public void testPhysicalStorageKeyServerGenerated() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 valid test pdf content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "my_custom_named_coa.pdf", "application/pdf", pdfBytes);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "COA")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isCreated());

        Document doc = documentRepository.findAll().get(0);
        assertNotNull(doc.getStorageKey());
        assertTrue(doc.getStorageKey().startsWith("documents/"));
        assertFalse(doc.getStorageKey().contains("my_custom_named_coa"));
        assertTrue(storageService.exists(doc.getStorageKey()));
    }

    @Test
    @DisplayName("25. Missing physical file on disk returns controlled 404 rather than 500 stack trace")
    public void testMissingPhysicalFileReturnsControlled404() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 valid test pdf content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "coa.pdf", "application/pdf", pdfBytes);

        String uploadJson = mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "COA")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String docId = uploadJson.split("\"id\":\"")[1].split("\"")[0];
        Document doc = documentRepository.findById(UUID.fromString(docId)).orElseThrow();

        // Delete physical file on disk to simulate orphaned DB record
        storageService.delete(doc.getStorageKey());

        mockMvc.perform(get("/api/v1/documents/" + docId + "/download")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Document file not found on storage")));
    }

    @Test
    @DisplayName("26. Deleting document purges both database record and physical storage file")
    public void testDeletePurgesDatabaseAndDisk() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 valid test pdf content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "to_delete.pdf", "application/pdf", pdfBytes);

        String uploadJson = mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "COA")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String docId = uploadJson.split("\"id\":\"")[1].split("\"")[0];
        Document doc = documentRepository.findById(UUID.fromString(docId)).orElseThrow();
        String storageKey = doc.getStorageKey();

        assertTrue(storageService.exists(storageKey));

        // Delete
        mockMvc.perform(delete("/api/v1/documents/" + docId)
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isNoContent());

        assertFalse(documentRepository.existsById(UUID.fromString(docId)));
        assertFalse(storageService.exists(storageKey));
    }

    @Test
    @DisplayName("27. Valid OpenXML XLSX spreadsheet is accepted (201)")
    public void testValidXlsxAccepted() throws Exception {
        byte[] xlsxBytes = new byte[]{0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00, 0x08, 0x00, 0x00, 0x00, 0x21, 0x00};
        MockMultipartFile file = new MockMultipartFile("file", "batch_data.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", xlsxBytes);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "TECHNICAL_SPECIFICATION")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalFileName", is("batch_data.xlsx")));
    }

    @Test
    @DisplayName("28. Valid CSV plain text is accepted (201)")
    public void testValidCsvAccepted() throws Exception {
        byte[] csvBytes = "batch_id,purity,moisture\nB1001,99.8,0.12\nB1002,99.9,0.08\n".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "test_report.csv", "text/csv", csvBytes);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "TECHNICAL_SPECIFICATION")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalFileName", is("test_report.csv")))
                .andExpect(jsonPath("$.mimeType", is("text/csv")));
    }

    @Test
    @DisplayName("29. CSV containing null bytes is rejected (400)")
    public void testCsvWithNullBytesRejected() throws Exception {
        byte[] nullByteCsv = new byte[]{'a', 'b', 'c', 0x00, 'd', 'e', 'f'};
        MockMultipartFile file = new MockMultipartFile("file", "corrupt.csv", "text/csv", nullByteCsv);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "TECHNICAL_SPECIFICATION")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Null bytes detected")));
    }

    @Test
    @DisplayName("30. Valid Microsoft OLECF Word .doc is accepted (201)")
    public void testValidOleDocAccepted() throws Exception {
        byte[] docBytes = new byte[]{(byte) 0xD0, (byte) 0xCF, 0x11, (byte) 0xE0, (byte) 0xA1, (byte) 0xB1, 0x1A, (byte) 0xE1, 0x00, 0x00};
        MockMultipartFile file = new MockMultipartFile("file", "specification.doc", "application/msword", docBytes);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "TECHNICAL_SPECIFICATION")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalFileName", is("specification.doc")));
    }

    @Test
    @DisplayName("31. Nonexistent document download returns 404 Not Found")
    public void testNonexistentDocumentDownloadReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/documents/" + UUID.randomUUID() + "/download")
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Document not found")));
    }

    @Test
    @DisplayName("32. Filename with control characters is sanitized safely")
    public void testFilenameWithControlCharsSanitized() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 valid test pdf content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "test\r\n\tfile.pdf", "application/pdf", pdfBytes);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "COA")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalFileName", is("testfile.pdf")));
    }

    @Test
    @DisplayName("33. Extremely long filename is bounded safely within 255 characters")
    public void testExtremelyLongFilenameBounded() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 valid test pdf content".getBytes();
        String longName = "a".repeat(300) + ".pdf";
        MockMultipartFile file = new MockMultipartFile("file", longName, "application/pdf", pdfBytes);

        String res = mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "COA")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String originalName = res.split("\"originalFileName\":\"")[1].split("\"")[0];
        assertTrue(originalName.length() <= 255);
    }

    @Test
    @DisplayName("34. Null byte in filename is sanitized safely")
    public void testNullByteInFilenameSanitized() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 valid test pdf content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "report\0.pdf", "application/pdf", pdfBytes);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "COA")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalFileName", is("report.pdf")));
    }

    @Test
    @DisplayName("35. Attempting to download deleted document returns 404 Not Found")
    public void testDownloadDeletedDocumentReturns404() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 valid test pdf content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "doc.pdf", "application/pdf", pdfBytes);

        String uploadJson = mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "COA")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String docId = uploadJson.split("\"id\":\"")[1].split("\"")[0];

        // Delete
        mockMvc.perform(delete("/api/v1/documents/" + docId)
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isNoContent());

        // Subsequent download attempt
        mockMvc.perform(get("/api/v1/documents/" + docId + "/download")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("36. Administrator is authorized to view and download document across all owners (200)")
    public void testAdminCanDownloadAnyDocument() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 valid test pdf content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "product_coa.pdf", "application/pdf", pdfBytes);

        String uploadJson = mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "PRODUCT")
                        .param("ownerId", productA.getId().toString())
                        .param("category", "COA")
                        .header("Authorization", "Bearer " + tokenSupplierA))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String docId = uploadJson.split("\"id\":\"")[1].split("\"")[0];

        mockMvc.perform(get("/api/v1/documents/" + docId + "/download")
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"product_coa.pdf\""));
    }
}
