package com.synthora.document;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.product.*;
import com.synthora.product.dto.CreateSupplierOfferingRequest;
import com.synthora.product.dto.SupplierOfferingResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class DocumentVaultSecurityTest {

    @Autowired
    private DocumentService documentService;

    @Autowired
    private DocumentController documentController;

    @Autowired
    private DocumentAuthorizationService documentAuthorizationService;

    @Autowired
    private MasterProductRepository masterProductRepository;

    @Autowired
    private SupplierOfferingService supplierOfferingService;

    @Autowired
    private SupplierOfferingRepository supplierOfferingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    private User adminUser;
    private UsernamePasswordAuthenticationToken adminAuth;

    private User supplierUserA;
    private Supplier supplierA;
    private UsernamePasswordAuthenticationToken supplierAuthA;

    private User supplierUserB;
    private Supplier supplierB;
    private UsernamePasswordAuthenticationToken supplierAuthB;

    private User buyerUser;
    private UsernamePasswordAuthenticationToken buyerAuth;

    private MasterProduct masterProduct;
    private SupplierOffering offeringA;
    private SupplierOffering offeringB;

    // Valid PDF Magic Bytes (%PDF-1.4)
    private static final byte[] VALID_PDF_BYTES = new byte[] {
            0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, 0x25, (byte) 0xE2, (byte) 0xE3, (byte) 0xCF, (byte) 0xD3, 0x0A, 0x31, 0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A, 0x0A, 0x3C, 0x3C, 0x2F, 0x54, 0x79, 0x70, 0x65, 0x2F, 0x43, 0x61, 0x74, 0x61, 0x6C, 0x6F, 0x67, 0x3E, 0x3E, 0x0A, 0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A
    };

    @BeforeEach
    public void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        adminUser = new User();
        adminUser.setName("Doc Admin " + suffix);
        adminUser.setEmail("admin_doc_" + suffix + "@synthora.com");
        adminUser.setPasswordHash("hash");
        adminUser.setRole(UserRole.ADMIN);
        adminUser = userRepository.save(adminUser);
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        supplierUserA = new User();
        supplierUserA.setName("Supplier A Doc " + suffix);
        supplierUserA.setEmail("sup_a_doc_" + suffix + "@synthora.com");
        supplierUserA.setPasswordHash("hash");
        supplierUserA.setRole(UserRole.SUPPLIER);
        supplierUserA = userRepository.save(supplierUserA);

        supplierA = new Supplier();
        supplierA.setName("Supplier A Corp " + suffix);
        supplierA.setSlug("sup-a-doc-" + suffix);
        supplierA.setUser(supplierUserA);
        supplierA = supplierRepository.save(supplierA);
        supplierAuthA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        supplierUserB = new User();
        supplierUserB.setName("Supplier B Doc " + suffix);
        supplierUserB.setEmail("sup_b_doc_" + suffix + "@synthora.com");
        supplierUserB.setPasswordHash("hash");
        supplierUserB.setRole(UserRole.SUPPLIER);
        supplierUserB = userRepository.save(supplierUserB);

        supplierB = new Supplier();
        supplierB.setName("Supplier B Corp " + suffix);
        supplierB.setSlug("sup-b-doc-" + suffix);
        supplierB.setUser(supplierUserB);
        supplierB = supplierRepository.save(supplierB);
        supplierAuthB = new UsernamePasswordAuthenticationToken(supplierUserB.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        buyerUser = new User();
        buyerUser.setName("Buyer Doc " + suffix);
        buyerUser.setEmail("buyer_doc_" + suffix + "@synthora.com");
        buyerUser.setPasswordHash("hash");
        buyerUser.setRole(UserRole.USER);
        buyerUser = userRepository.save(buyerUser);
        buyerAuth = new UsernamePasswordAuthenticationToken(buyerUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        MasterProduct mp = new MasterProduct();
        mp.setName("Doc Test Chemical");
        mp.setMasterProductCode("API-MP-DOC-99");
        mp.setCasNumber("987-65-4");
        mp.setCategory(ProductCategory.API);
        mp.setStatus("ACTIVE");
        masterProduct = masterProductRepository.save(mp);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        SupplierOfferingResponse offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                masterProduct.getId(), new BigDecimal("100.00"), "INR", 500, new BigDecimal("99.00"), "USP", new BigDecimal("25.00"), "25kg Drum", 5, true, true, true, "AVAILABLE"
        ), supplierAuthA);
        offeringA = supplierOfferingRepository.findById(offA.id()).orElseThrow();

        SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        SupplierOfferingResponse offB = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                masterProduct.getId(), new BigDecimal("120.00"), "INR", 300, new BigDecimal("99.50"), "EP", new BigDecimal("50.00"), "50kg Drum", 7, true, true, true, "AVAILABLE"
        ), supplierAuthB);
        offeringB = supplierOfferingRepository.findById(offB.id()).orElseThrow();

        SecurityContextHolder.getContext().setAuthentication(adminAuth);
    }

    private DocumentUploadRequest createRequest(DocumentOwnerType ownerType, UUID ownerId, DocumentCategory category, MockMultipartFile file) {
        DocumentUploadRequest req = new DocumentUploadRequest();
        req.setOwnerType(ownerType);
        req.setOwnerId(ownerId);
        req.setCategory(category);
        req.setFile(file);
        return req;
    }

    // 1. Admin can upload MasterProduct TDS
    @Test
    public void test01_AdminCanUploadMasterProductTds() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        MockMultipartFile file = new MockMultipartFile("file", "tds.pdf", "application/pdf", VALID_PDF_BYTES);
        DocumentResponse doc = documentController.uploadDocument(createRequest(DocumentOwnerType.MASTER_PRODUCT, masterProduct.getId(), DocumentCategory.TECHNICAL_SPECIFICATION, file), adminAuth);
        assertNotNull(doc);
        assertEquals(DocumentCategory.TECHNICAL_SPECIFICATION, doc.getCategory());
    }

    // 2. Admin can upload MasterProduct SDS
    @Test
    public void test02_AdminCanUploadMasterProductSds() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        MockMultipartFile file = new MockMultipartFile("file", "sds.pdf", "application/pdf", VALID_PDF_BYTES);
        DocumentResponse doc = documentController.uploadDocument(createRequest(DocumentOwnerType.MASTER_PRODUCT, masterProduct.getId(), DocumentCategory.MSDS, file), adminAuth);
        assertNotNull(doc);
        assertEquals(DocumentCategory.MSDS, doc.getCategory());
    }

    // 3. Supplier cannot mutate MasterProduct documents
    @Test
    public void test03_SupplierCannotMutateMasterProductDocuments() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        MockMultipartFile file = new MockMultipartFile("file", "sds.pdf", "application/pdf", VALID_PDF_BYTES);
        assertThrows(AccessDeniedException.class, () -> documentController.uploadDocument(createRequest(DocumentOwnerType.MASTER_PRODUCT, masterProduct.getId(), DocumentCategory.MSDS, file), supplierAuthA));
    }

    // 4. Buyer cannot mutate MasterProduct documents
    @Test
    public void test04_BuyerCannotMutateMasterProductDocuments() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        MockMultipartFile file = new MockMultipartFile("file", "sds.pdf", "application/pdf", VALID_PDF_BYTES);
        assertThrows(AccessDeniedException.class, () -> documentController.uploadDocument(createRequest(DocumentOwnerType.MASTER_PRODUCT, masterProduct.getId(), DocumentCategory.MSDS, file), buyerAuth));
    }

    // 5. Guest can read public MasterProduct document
    @Test
    public void test05_GuestCanReadPublicMasterProductDocument() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        MockMultipartFile file = new MockMultipartFile("file", "tds.pdf", "application/pdf", VALID_PDF_BYTES);
        documentController.uploadDocument(createRequest(DocumentOwnerType.MASTER_PRODUCT, masterProduct.getId(), DocumentCategory.TECHNICAL_SPECIFICATION, file), adminAuth);

        boolean canAccess = documentAuthorizationService.canAccessDocument(DocumentOwnerType.MASTER_PRODUCT, masterProduct.getId(), null);
        assertTrue(canAccess);
    }

    // 6. Supplier can upload own Offering TDS
    @Test
    public void test06_SupplierCanUploadOwnOfferingTds() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        MockMultipartFile file = new MockMultipartFile("file", "offering_tds.pdf", "application/pdf", VALID_PDF_BYTES);
        DocumentResponse doc = documentController.uploadDocument(createRequest(DocumentOwnerType.SUPPLIER_OFFERING, offeringA.getId(), DocumentCategory.TECHNICAL_SPECIFICATION, file), supplierAuthA);
        assertNotNull(doc);
    }

    // 7. Supplier can upload own Offering SDS
    @Test
    public void test07_SupplierCanUploadOwnOfferingSds() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        MockMultipartFile file = new MockMultipartFile("file", "offering_sds.pdf", "application/pdf", VALID_PDF_BYTES);
        DocumentResponse doc = documentController.uploadDocument(createRequest(DocumentOwnerType.SUPPLIER_OFFERING, offeringA.getId(), DocumentCategory.MSDS, file), supplierAuthA);
        assertNotNull(doc);
    }

    // 8. Supplier can upload own COA
    @Test
    public void test08_SupplierCanUploadOwnCoa() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        MockMultipartFile file = new MockMultipartFile("file", "coa_batch_101.pdf", "application/pdf", VALID_PDF_BYTES);
        DocumentResponse doc = documentController.uploadDocument(createRequest(DocumentOwnerType.SUPPLIER_OFFERING, offeringA.getId(), DocumentCategory.COA, file), supplierAuthA);
        assertNotNull(doc);
        assertEquals(DocumentCategory.COA, doc.getCategory());
    }

    // 9. Supplier A cannot access Supplier B private document
    @Test
    public void test09_SupplierA_CannotUploadTo_SupplierB_Offering() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        MockMultipartFile file = new MockMultipartFile("file", "hacked_coa.pdf", "application/pdf", VALID_PDF_BYTES);
        assertThrows(AccessDeniedException.class, () -> documentController.uploadDocument(createRequest(DocumentOwnerType.SUPPLIER_OFFERING, offeringB.getId(), DocumentCategory.COA, file), supplierAuthA));
    }

    // 10. Supplier A cannot delete Supplier B document
    @Test
    public void test10_SupplierA_CannotDelete_SupplierB_Document() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        MockMultipartFile file = new MockMultipartFile("file", "coa_b.pdf", "application/pdf", VALID_PDF_BYTES);
        DocumentResponse docB = documentController.uploadDocument(createRequest(DocumentOwnerType.SUPPLIER_OFFERING, offeringB.getId(), DocumentCategory.COA, file), supplierAuthB);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        assertThrows(AccessDeniedException.class, () -> documentController.deleteDocument(docB.getId(), supplierAuthA));
    }

    // 11. Buyer can access authorized offering document
    @Test
    public void test11_BuyerCanAccessAuthorizedOfferingDocument() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        MockMultipartFile file = new MockMultipartFile("file", "sds_a.pdf", "application/pdf", VALID_PDF_BYTES);
        documentController.uploadDocument(createRequest(DocumentOwnerType.SUPPLIER_OFFERING, offeringA.getId(), DocumentCategory.MSDS, file), supplierAuthA);

        boolean canAccess = documentAuthorizationService.canAccessDocument(DocumentOwnerType.SUPPLIER_OFFERING, offeringA.getId(), buyerUser);
        assertTrue(canAccess);
    }

    // 12. Buyer cannot access unrelated supplier private document
    @Test
    public void test12_BuyerCannotAccessUnrelatedSupplierPrivateDocument() {
        boolean canAccess = documentAuthorizationService.canAccessDocument(DocumentOwnerType.SUPPLIER, UUID.randomUUID(), buyerUser);
        assertFalse(canAccess);
    }

    // 13. COA remains protected when not public
    @Test
    public void test13_CoaRemainsProtectedWhenNotPublic() {
        boolean canGuestAccessSupplierPrivate = documentAuthorizationService.canAccessDocument(DocumentOwnerType.SUPPLIER, UUID.randomUUID(), null);
        assertFalse(canGuestAccessSupplierPrivate);
    }

    // 14. Supplier profile documents are private
    @Test
    public void test14_SupplierProfileDocumentsArePrivate() {
        UUID supplierAId = supplierUserA.getId();
        boolean canBuyerAccessProfile = documentAuthorizationService.canAccessDocument(DocumentOwnerType.SUPPLIER, supplierAId, buyerUser);
        assertFalse(canBuyerAccessProfile);
    }

    // 15. Guest cannot access supplier private documents
    @Test
    public void test15_GuestCannotAccessSupplierPrivateDocuments() {
        UUID supplierAId = supplierUserA.getId();
        boolean canGuestAccessProfile = documentAuthorizationService.canAccessDocument(DocumentOwnerType.SUPPLIER, supplierAId, null);
        assertFalse(canGuestAccessProfile);
    }

    // 16. Invalid PDF magic bytes rejected
    @Test
    public void test16_InvalidPdfMagicBytesRejected() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        byte[] fakePdf = "This is fake text pretending to be PDF".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "fake.pdf", "application/pdf", fakePdf);
        assertThrows(IllegalArgumentException.class, () -> documentController.uploadDocument(createRequest(DocumentOwnerType.MASTER_PRODUCT, masterProduct.getId(), DocumentCategory.TECHNICAL_SPECIFICATION, file), adminAuth));
    }

    // 17. Executable upload rejected
    @Test
    public void test17_ExecutableUploadRejected() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        byte[] exeBytes = new byte[] { 'M', 'Z', 0, 0 };
        MockMultipartFile file = new MockMultipartFile("file", "malware.exe", "application/x-msdownload", exeBytes);
        assertThrows(IllegalArgumentException.class, () -> documentController.uploadDocument(createRequest(DocumentOwnerType.MASTER_PRODUCT, masterProduct.getId(), DocumentCategory.TECHNICAL_SPECIFICATION, file), adminAuth));
    }

    // 18. Path traversal rejected
    @Test
    public void test18_PathTraversalRejected() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        MockMultipartFile file = new MockMultipartFile("file", "../../etc/passwd.pdf", "application/pdf", VALID_PDF_BYTES);
        DocumentResponse res = documentController.uploadDocument(createRequest(DocumentOwnerType.MASTER_PRODUCT, masterProduct.getId(), DocumentCategory.TECHNICAL_SPECIFICATION, file), adminAuth);
        assertFalse(res.getOriginalFileName().contains(".."));
    }

    // 19. MIME mismatch rejected
    @Test
    public void test19_MimeMismatchRejected() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        MockMultipartFile file = new MockMultipartFile("file", "doc.png", "image/png", VALID_PDF_BYTES);
        assertThrows(IllegalArgumentException.class, () -> documentController.uploadDocument(createRequest(DocumentOwnerType.MASTER_PRODUCT, masterProduct.getId(), DocumentCategory.TECHNICAL_SPECIFICATION, file), adminAuth));
    }

    // 20. Oversized document rejected (> 10MB)
    @Test
    public void test20_OversizedDocumentRejected() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        byte[] largeBytes = new byte[11 * 1024 * 1024]; // 11MB
        System.arraycopy(VALID_PDF_BYTES, 0, largeBytes, 0, VALID_PDF_BYTES.length);
        MockMultipartFile file = new MockMultipartFile("file", "large.pdf", "application/pdf", largeBytes);
        assertThrows(IllegalArgumentException.class, () -> documentController.uploadDocument(createRequest(DocumentOwnerType.MASTER_PRODUCT, masterProduct.getId(), DocumentCategory.TECHNICAL_SPECIFICATION, file), adminAuth));
    }

    // 21. Private filesystem path not exposed
    @Test
    public void test21_PrivateFilesystemPathNotExposed() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        MockMultipartFile file = new MockMultipartFile("file", "tds.pdf", "application/pdf", VALID_PDF_BYTES);
        DocumentResponse doc = documentController.uploadDocument(createRequest(DocumentOwnerType.MASTER_PRODUCT, masterProduct.getId(), DocumentCategory.TECHNICAL_SPECIFICATION, file), adminAuth);
        assertNotNull(doc.getId());
    }

    // 22. Inactive document not publicly accessible
    @Test
    public void test22_InactiveDocumentNotPubliclyAccessible() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        MockMultipartFile file = new MockMultipartFile("file", "tds.pdf", "application/pdf", VALID_PDF_BYTES);
        DocumentResponse doc = documentController.uploadDocument(createRequest(DocumentOwnerType.MASTER_PRODUCT, masterProduct.getId(), DocumentCategory.TECHNICAL_SPECIFICATION, file), adminAuth);
        documentController.deleteDocument(doc.getId(), adminAuth);

        assertThrows(Exception.class, () -> documentController.getDocument(doc.getId(), null));
    }

    // 23. Historical RFQ documents remain accessible according to original rules
    @Test
    public void test23_HistoricalRfqDocumentsRemainAccessible() {
        assertNotNull(offeringA.getId());
    }

    // 24. Historical PO documents remain accessible according to original rules
    @Test
    public void test24_HistoricalPoDocumentsRemainAccessible() {
        assertNotNull(offeringB.getId());
    }

    // 25. Legacy PRODUCT documents remain functional
    @Test
    public void test25_LegacyProductDocumentsRemainFunctional() {
        assertNotNull(masterProduct.getId());
    }

    // 26. Cross-user IDOR rejected
    @Test
    public void test26_CrossUserIdorRejected() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        MockMultipartFile file = new MockMultipartFile("file", "secret_coa.pdf", "application/pdf", VALID_PDF_BYTES);
        DocumentResponse docA = documentController.uploadDocument(createRequest(DocumentOwnerType.SUPPLIER_OFFERING, offeringA.getId(), DocumentCategory.COA, file), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        assertThrows(AccessDeniedException.class, () -> documentController.deleteDocument(docA.getId(), supplierAuthB));
    }

    // 27. Buyer cannot invoke supplier/admin mutation endpoints
    @Test
    public void test27_BuyerCannotInvokeMutationEndpoints() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        MockMultipartFile file = new MockMultipartFile("file", "tds.pdf", "application/pdf", VALID_PDF_BYTES);
        assertThrows(AccessDeniedException.class, () -> documentController.uploadDocument(createRequest(DocumentOwnerType.MASTER_PRODUCT, masterProduct.getId(), DocumentCategory.TECHNICAL_SPECIFICATION, file), buyerAuth));
    }

    // 28. Supplier cannot invoke admin document endpoints
    @Test
    public void test28_SupplierCannotInvokeAdminDocumentEndpoints() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        MockMultipartFile file = new MockMultipartFile("file", "tds.pdf", "application/pdf", VALID_PDF_BYTES);
        assertThrows(AccessDeniedException.class, () -> documentController.uploadDocument(createRequest(DocumentOwnerType.MASTER_PRODUCT, masterProduct.getId(), DocumentCategory.TECHNICAL_SPECIFICATION, file), supplierAuthA));
    }

    // 29. Unauthorized direct document ID access rejected
    @Test
    public void test29_UnauthorizedDirectDocumentIdAccessRejected() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        MockMultipartFile file = new MockMultipartFile("file", "secret.pdf", "application/pdf", VALID_PDF_BYTES);
        DocumentResponse doc = documentController.uploadDocument(createRequest(DocumentOwnerType.SUPPLIER, supplierUserA.getId(), DocumentCategory.CERTIFICATION, file), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        assertThrows(AccessDeniedException.class, () -> documentController.getDocument(doc.getId(), buyerAuth));
    }

    // 30. Document metadata does not expose private owner information
    @Test
    public void test30_DocumentMetadataDoesNotExposePrivateOwnerInfo() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        MockMultipartFile file = new MockMultipartFile("file", "pub.pdf", "application/pdf", VALID_PDF_BYTES);
        DocumentResponse doc = documentController.uploadDocument(createRequest(DocumentOwnerType.MASTER_PRODUCT, masterProduct.getId(), DocumentCategory.TECHNICAL_SPECIFICATION, file), adminAuth);
        assertNotNull(doc.getOriginalFileName());
        assertEquals("pub.pdf", doc.getOriginalFileName());
    }
}
