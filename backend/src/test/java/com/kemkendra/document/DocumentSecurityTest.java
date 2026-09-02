package com.kemkendra.document;

import com.kemkendra.admin.audit.AuditAction;
import com.kemkendra.admin.audit.AuditLog;
import com.kemkendra.admin.audit.AuditLogRepository;
import com.kemkendra.identity.*;
import com.kemkendra.order.PurchaseOrder;
import com.kemkendra.order.PurchaseOrderRepository;
import com.kemkendra.order.Shipment;
import com.kemkendra.order.ShipmentRepository;
import com.kemkendra.product.Product;
import com.kemkendra.product.ProductRepository;
import com.kemkendra.product.Supplier;
import com.kemkendra.product.SupplierRepository;
import com.kemkendra.rfq.Rfq;
import com.kemkendra.rfq.RfqRepository;
import com.kemkendra.rfq.quotation.Quotation;
import com.kemkendra.rfq.quotation.QuotationRepository;
import com.kemkendra.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class DocumentSecurityTest {

    @Autowired
    private MockMvc mockMvc;

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

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private ShipmentRepository shipmentRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentService documentService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private JwtService jwtService;

    private User buyer1;
    private User buyer2;
    private User supplierUser1;
    private User supplierUser2;
    private User adminUser;
    private User suspendedUser;

    private Supplier supplier1;
    private Supplier supplier2;

    private String buyer1Token;
    private String buyer2Token;
    private String supplier1Token;
    private String supplier2Token;
    private String adminToken;
    private String suspendedToken;

    private Rfq rfq1;
    private Quotation quote1;
    private PurchaseOrder po1;
    private Shipment shipment1;

    private byte[] validPdfBytes;

    @BeforeEach
    void setUp() {
        validPdfBytes = "%PDF-1.4\n%âãÏÓ\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF".getBytes();

        buyer1 = createUser("buyer1_sec@kemkendra.com", "Buyer One", UserRole.USER, UserStatus.ACTIVE);
        buyer2 = createUser("buyer2_sec@kemkendra.com", "Buyer Two", UserRole.USER, UserStatus.ACTIVE);
        supplierUser1 = createUser("supplier1_sec@kemkendra.com", "Supplier One", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierUser2 = createUser("supplier2_sec@kemkendra.com", "Supplier Two", UserRole.SUPPLIER, UserStatus.ACTIVE);
        adminUser = createUser("admin_sec@kemkendra.com", "Admin Sec", UserRole.ADMIN, UserStatus.ACTIVE);
        suspendedUser = createUser("suspended_sec@kemkendra.com", "Suspended Sec", UserRole.USER, UserStatus.SUSPENDED);

        supplier1 = createSupplier(supplierUser1, "Supplier One Corp", "supplier-one-sec");
        supplier2 = createSupplier(supplierUser2, "Supplier Two Corp", "supplier-two-sec");

        buyer1Token = "Bearer " + jwtService.generateToken(buyer1);
        buyer2Token = "Bearer " + jwtService.generateToken(buyer2);
        supplier1Token = "Bearer " + jwtService.generateToken(supplierUser1);
        supplier2Token = "Bearer " + jwtService.generateToken(supplierUser2);
        adminToken = "Bearer " + jwtService.generateToken(adminUser);
        suspendedToken = "Bearer " + jwtService.generateToken(suspendedUser);

        // Create transaction lineage: Buyer1 <-> Supplier1
        rfq1 = new Rfq();
        rfq1.setBuyerId(buyer1.getId());
        rfq1.setSupplierId(supplier1.getId());
        rfq1.setProductId(UUID.randomUUID());
        rfq1.setStatus(com.kemkendra.rfq.RfqStatus.PENDING);
        rfq1.setQuantity(BigDecimal.valueOf(100));
        rfq1.setUnit("KG");
        rfq1 = rfqRepository.save(rfq1);

        quote1 = new Quotation();
        quote1.setRfq(rfq1);
        quote1.setQuotationVersion(1);
        quote1.setUnitPrice(BigDecimal.valueOf(48));
        quote1.setCurrency("INR");
        quote1.setValidityDate(LocalDate.now().plusDays(30));
        quote1.setActorType("SUPPLIER");
        quote1 = quotationRepository.save(quote1);

        po1 = new PurchaseOrder();
        po1.setRfqId(rfq1.getId());
        po1.setQuotationId(quote1.getId());
        po1.setBuyerId(buyer1.getId());
        po1.setSupplierId(supplier1.getId());
        po1.setProductId(rfq1.getProductId());
        po1.setQuantity(rfq1.getQuantity());
        po1.setUnit(rfq1.getUnit());
        po1.setUnitPrice(quote1.getUnitPrice());
        po1.setCurrency("INR");
        po1.setPoNumber("PO-SEC-" + UUID.randomUUID().toString().substring(0, 8));
        po1.setStatus(com.kemkendra.order.OrderStatus.PLACED);
        po1.setTotalAmount(BigDecimal.valueOf(4800));
        po1.setShippingAddress("Mumbai");
        po1.setBillingContact("Contact");
        po1.setPlacedAt(LocalDateTime.now());
        po1 = purchaseOrderRepository.save(po1);

        shipment1 = new Shipment();
        shipment1.setPurchaseOrder(po1);
        shipment1.setTrackingNumber("TRK-" + UUID.randomUUID().toString().substring(0, 8));
        shipment1.setCarrier("BlueDart Express");
        shipment1.setShippedAt(LocalDateTime.now());
        shipment1 = shipmentRepository.save(shipment1);
    }

    private User createUser(String email, String name, UserRole role, UserStatus status) {
        User u = new User();
        u.setId(UUID.randomUUID());
        u.setEmail(email);
        u.setName(name);
        u.setPasswordHash("$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF");
        u.setRole(role);
        u.setStatus(status);
        u.setCreatedAt(java.time.Instant.now());
        u.setUpdatedAt(java.time.Instant.now());
        return userRepository.save(u);
    }

    private Supplier createSupplier(User user, String name, String slug) {
        Supplier s = new Supplier();
        s.setUser(user);
        s.setName(name);
        s.setLegalName(name + " Pvt Ltd");
        s.setSlug(slug);
        s.setBusinessEmail(user.getEmail());
        s.setVerificationStatus(com.kemkendra.seller.SupplierVerificationStatus.UNDER_REVIEW);
        return supplierRepository.save(s);
    }

    @Nested
    @DisplayName("1 & 2: Unauthenticated Access Protections")
    class UnauthenticatedTests {

        @Test
        @DisplayName("1. Unauthenticated upload rejected with 401/403")
        void unauthenticatedUpload_rejected() throws Exception {
            MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", validPdfBytes);

            mockMvc.perform(multipart("/api/v1/documents")
                            .file(file)
                            .param("ownerType", "RFQ")
                            .param("ownerId", rfq1.getId().toString())
                            .param("category", "RFQ_ATTACHMENT"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("2. Unauthenticated download rejected with 401/403")
        void unauthenticatedDownload_rejected() throws Exception {
            Document doc = createTestDocument(DocumentOwnerType.RFQ, rfq1.getId(), DocumentCategory.RFQ_ATTACHMENT, buyer1.getId());

            mockMvc.perform(get("/api/v1/documents/{id}/download", doc.getId()))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("3, 4, 5: Authorized Counterparty & Admin Access")
    class AuthorizedAccessTests {

        @Test
        @DisplayName("3. Buyer can access own transaction documents (RFQ, PO, Quotation)")
        void buyer_canAccessOwnTransactionDocuments() throws Exception {
            Document rfqDoc = createTestDocument(DocumentOwnerType.RFQ, rfq1.getId(), DocumentCategory.RFQ_ATTACHMENT, buyer1.getId());
            Document poDoc = createTestDocument(DocumentOwnerType.PURCHASE_ORDER, po1.getId(), DocumentCategory.PURCHASE_ORDER, buyer1.getId());

            mockMvc.perform(get("/api/v1/documents/{id}", rfqDoc.getId())
                            .header(HttpHeaders.AUTHORIZATION, buyer1Token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(rfqDoc.getId().toString()));

            mockMvc.perform(get("/api/v1/documents/{id}", poDoc.getId())
                            .header(HttpHeaders.AUTHORIZATION, buyer1Token))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("4. Supplier can access own transaction documents")
        void supplier_canAccessOwnTransactionDocuments() throws Exception {
            Document rfqDoc = createTestDocument(DocumentOwnerType.RFQ, rfq1.getId(), DocumentCategory.RFQ_ATTACHMENT, buyer1.getId());
            Document poDoc = createTestDocument(DocumentOwnerType.PURCHASE_ORDER, po1.getId(), DocumentCategory.PURCHASE_ORDER, buyer1.getId());

            mockMvc.perform(get("/api/v1/documents/{id}", rfqDoc.getId())
                            .header(HttpHeaders.AUTHORIZATION, supplier1Token))
                    .andExpect(status().isOk());

            mockMvc.perform(get("/api/v1/documents/{id}", poDoc.getId())
                            .header(HttpHeaders.AUTHORIZATION, supplier1Token))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("5. Admin can access authorized documents across all entities")
        void admin_canAccessAnyDocument() throws Exception {
            Document rfqDoc = createTestDocument(DocumentOwnerType.RFQ, rfq1.getId(), DocumentCategory.RFQ_ATTACHMENT, buyer1.getId());

            mockMvc.perform(get("/api/v1/documents/{id}", rfqDoc.getId())
                            .header(HttpHeaders.AUTHORIZATION, adminToken))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("6, 7, 8, 9, 10, 11: IDOR and Cross-Tenant Defenses")
    class IdorDefenseTests {

        @Test
        @DisplayName("6. Buyer cannot access another buyer's private transaction document")
        void buyer2_cannotAccessBuyer1Document() throws Exception {
            Document rfqDoc = createTestDocument(DocumentOwnerType.RFQ, rfq1.getId(), DocumentCategory.RFQ_ATTACHMENT, buyer1.getId());

            mockMvc.perform(get("/api/v1/documents/{id}", rfqDoc.getId())
                            .header(HttpHeaders.AUTHORIZATION, buyer2Token))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("7. Supplier cannot access another supplier's transaction document")
        void supplier2_cannotAccessSupplier1Document() throws Exception {
            Document rfqDoc = createTestDocument(DocumentOwnerType.RFQ, rfq1.getId(), DocumentCategory.RFQ_ATTACHMENT, buyer1.getId());

            mockMvc.perform(get("/api/v1/documents/{id}", rfqDoc.getId())
                            .header(HttpHeaders.AUTHORIZATION, supplier2Token))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("8. Supplier cannot access internal user or admin private documents")
        void supplier_cannotAccessUserPrivateDocuments() throws Exception {
            Document userDoc = createTestDocument(DocumentOwnerType.USER, buyer1.getId(), DocumentCategory.BUSINESS_REGISTRATION, buyer1.getId());

            mockMvc.perform(get("/api/v1/documents/{id}", userDoc.getId())
                            .header(HttpHeaders.AUTHORIZATION, supplier1Token))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("9. Changing document ID in URL cannot bypass authorization")
        void changingDocumentId_cannotBypassAuth() throws Exception {
            UUID fakeDocId = UUID.randomUUID();
            mockMvc.perform(get("/api/v1/documents/{id}", fakeDocId)
                            .header(HttpHeaders.AUTHORIZATION, buyer1Token))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("10. Changing entity ID in query cannot bypass authorization")
        void changingEntityId_cannotBypassAuth() throws Exception {
            UUID unauthorizedEntityId = UUID.randomUUID();
            mockMvc.perform(get("/api/v1/documents")
                            .param("ownerType", "RFQ")
                            .param("ownerId", unauthorizedEntityId.toString())
                            .header(HttpHeaders.AUTHORIZATION, buyer1Token))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("12, 13, 14, 15: File Validation, Traversal & Content Hardening")
    class FileValidationTests {

        @Test
        @DisplayName("12. Path traversal in filenames is sanitized safely")
        void pathTraversalFilename_sanitized() throws Exception {
            MockMultipartFile maliciousFile = new MockMultipartFile(
                    "file",
                    "../../../../etc/passwd.pdf",
                    "application/pdf",
                    validPdfBytes
            );

            mockMvc.perform(multipart("/api/v1/documents")
                            .file(maliciousFile)
                            .param("ownerType", "RFQ")
                            .param("ownerId", rfq1.getId().toString())
                            .param("category", "RFQ_ATTACHMENT")
                            .header(HttpHeaders.AUTHORIZATION, buyer1Token))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.originalFileName").value("passwd.pdf"));
        }

        @Test
        @DisplayName("13. Executable and script uploads are strictly rejected")
        void executableUpload_rejected() throws Exception {
            byte[] exeBytes = new byte[]{'M', 'Z', 0, 0, 0};
            MockMultipartFile exeFile = new MockMultipartFile("file", "malware.exe", "application/x-msdownload", exeBytes);

            mockMvc.perform(multipart("/api/v1/documents")
                            .file(exeFile)
                            .param("ownerType", "RFQ")
                            .param("ownerId", rfq1.getId().toString())
                            .param("category", "RFQ_ATTACHMENT")
                            .header(HttpHeaders.AUTHORIZATION, buyer1Token))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("14. Oversized document upload rejected")
        void oversizedDocument_rejected() throws Exception {
            byte[] oversizedBytes = new byte[15 * 1024 * 1024]; // 15MB exceeds 10MB default
            System.arraycopy(validPdfBytes, 0, oversizedBytes, 0, validPdfBytes.length);
            MockMultipartFile largeFile = new MockMultipartFile("file", "big.pdf", "application/pdf", oversizedBytes);

            mockMvc.perform(multipart("/api/v1/documents")
                            .file(largeFile)
                            .param("ownerType", "RFQ")
                            .param("ownerId", rfq1.getId().toString())
                            .param("category", "RFQ_ATTACHMENT")
                            .header(HttpHeaders.AUTHORIZATION, buyer1Token))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("15. Double extension attacks detected and rejected")
        void doubleExtension_rejected() throws Exception {
            MockMultipartFile doubleExtFile = new MockMultipartFile("file", "invoice.pdf.exe", "application/pdf", validPdfBytes);

            mockMvc.perform(multipart("/api/v1/documents")
                            .file(doubleExtFile)
                            .param("ownerType", "RFQ")
                            .param("ownerId", rfq1.getId().toString())
                            .param("category", "RFQ_ATTACHMENT")
                            .header(HttpHeaders.AUTHORIZATION, buyer1Token))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("16, 17, 18, 19, 20, 21, 22: Integrity, Storage, Versioning & Audit")
    class IntegrityAndAuditTests {

        @Test
        @DisplayName("16. Client cannot spoof uploadedBy identity in body; derived from token")
        void clientCannotSpoofUploadedBy() throws Exception {
            MockMultipartFile file = new MockMultipartFile("file", "contract.pdf", "application/pdf", validPdfBytes);

            mockMvc.perform(multipart("/api/v1/documents")
                            .file(file)
                            .param("ownerType", "RFQ")
                            .param("ownerId", rfq1.getId().toString())
                            .param("category", "RFQ_ATTACHMENT")
                            .header(HttpHeaders.AUTHORIZATION, buyer1Token))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.uploadedBy").value(buyer1.getId().toString()));
        }

        @Test
        @DisplayName("17 & 18 & 19. No filesystem paths or storage credentials exposed in responses")
        void noStorageCredentialsOrPathsExposed() throws Exception {
            Document doc = createTestDocument(DocumentOwnerType.RFQ, rfq1.getId(), DocumentCategory.RFQ_ATTACHMENT, buyer1.getId());

            String responseBody = mockMvc.perform(get("/api/v1/documents/{id}", doc.getId())
                            .header(HttpHeaders.AUTHORIZATION, buyer1Token))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            assertThat(responseBody).doesNotContain("storageKey");
            assertThat(responseBody).doesNotContain("C:\\");
            assertThat(responseBody).doesNotContain("/var/data");
            assertThat(responseBody).doesNotContain("secret");
            assertThat(responseBody).doesNotContain("password");
        }

        @Test
        @DisplayName("20. Historical document versions remain protected under same authorization rules")
        void historicalVersions_protected() throws Exception {
            Document v1 = createTestDocument(DocumentOwnerType.RFQ, rfq1.getId(), DocumentCategory.RFQ_ATTACHMENT, buyer1.getId());
            v1.setVersion(1);
            v1.setIsActive(false);
            documentRepository.save(v1);

            // Buyer 2 cannot access historical V1 of Buyer 1's RFQ
            mockMvc.perform(get("/api/v1/documents/{id}", v1.getId())
                            .header(HttpHeaders.AUTHORIZATION, buyer2Token))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("21. Audit actor is server-derived from Authentication.getName()")
        void auditActor_serverDerived() throws Exception {
            MockMultipartFile file = new MockMultipartFile("file", "audit_test.pdf", "application/pdf", validPdfBytes);

            mockMvc.perform(multipart("/api/v1/documents")
                            .file(file)
                            .param("ownerType", "RFQ")
                            .param("ownerId", rfq1.getId().toString())
                            .param("category", "RFQ_ATTACHMENT")
                            .header(HttpHeaders.AUTHORIZATION, buyer1Token))
                    .andExpect(status().isCreated());

            List<AuditLog> logs = auditLogRepository.findAll();
            boolean hasDocumentAudit = logs.stream()
                    .anyMatch(l -> l.getAdminId().equals(buyer1.getId()) && l.getAction() == AuditAction.DOCUMENT_UPLOADED);
            assertThat(hasDocumentAudit).isTrue();
        }

        @Test
        @DisplayName("22. Suspended users cannot upload or modify documents")
        void suspendedUser_blocked() throws Exception {
            MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", validPdfBytes);

            mockMvc.perform(multipart("/api/v1/documents")
                            .file(file)
                            .param("ownerType", "USER")
                            .param("ownerId", suspendedUser.getId().toString())
                            .param("category", "BUSINESS_REGISTRATION")
                            .header(HttpHeaders.AUTHORIZATION, suspendedToken))
                    .andExpect(status().isUnauthorized());
        }
    }

    private Document createTestDocument(DocumentOwnerType ownerType, UUID ownerId, DocumentCategory category, UUID uploadedBy) {
        Document doc = new Document();
        doc.setDocumentGroupId(UUID.randomUUID());
        doc.setOwnerType(ownerType);
        doc.setOwnerId(ownerId);
        doc.setCategory(category);
        doc.setOriginalFileName("test_doc.pdf");
        doc.setStorageKey("documents/" + UUID.randomUUID() + ".pdf");
        doc.setMimeType("application/pdf");
        doc.setFileSize((long) validPdfBytes.length);
        doc.setUploadedBy(uploadedBy);
        doc.setVersion(1);
        doc.setChecksum("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
        doc.setIsActive(true);
        return documentRepository.save(doc);
    }
}
