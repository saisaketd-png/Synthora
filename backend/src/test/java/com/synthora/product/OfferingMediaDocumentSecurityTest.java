package com.synthora.product;

import com.synthora.document.*;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.product.apis.SupplierOfferingImageController;
import com.synthora.product.dto.CatalogImageResponse;
import com.synthora.product.dto.CreateSupplierOfferingRequest;
import com.synthora.product.dto.SupplierOfferingResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
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
public class OfferingMediaDocumentSecurityTest {

    @Autowired
    private CatalogImageService catalogImageService;

    @Autowired
    private SupplierOfferingImageController supplierOfferingImageController;

    @Autowired
    private DocumentController documentController;

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

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private User supplierUserA;
    private Supplier supplierA;
    private Authentication supplierAuthA;

    private User supplierUserB;
    private Supplier supplierB;
    private Authentication supplierAuthB;

    private MasterProduct masterProduct;
    private SupplierOffering offeringA;

    // Standard valid PNG magic bytes (89 50 4E 47 0D 0A 1A 0A)
    private static final byte[] VALID_PNG_BYTES = new byte[] {
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52
    };

    // Standard valid PDF header bytes (%PDF-1.4)
    private static final byte[] VALID_PDF_BYTES = "%PDF-1.4\n%âãÏÓ\n1 0 obj\n<< /Title (Test Document) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF".getBytes();

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM users;");

        // 1. Create Supplier A
        supplierUserA = new User();
        supplierUserA.setId(UUID.randomUUID());
        supplierUserA.setEmail("supplier-a-" + UUID.randomUUID() + "@synthora.com");
        supplierUserA.setPasswordHash("hash");
        supplierUserA.setName("Acme Chemical Labs");
        supplierUserA.setRole(UserRole.SUPPLIER);
        supplierUserA = userRepository.save(supplierUserA);

        supplierA = new Supplier();
        supplierA.setUser(supplierUserA);
        supplierA.setName("Acme Chemical Labs");
        supplierA.setVerified(true);
        supplierA.setVerificationStatus(com.synthora.seller.SupplierVerificationStatus.VERIFIED);
        supplierA = supplierRepository.save(supplierA);

        supplierAuthA = new UsernamePasswordAuthenticationToken(
                supplierUserA.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        // 2. Create Supplier B (Attacker / Distinct Supplier)
        supplierUserB = new User();
        supplierUserB.setId(UUID.randomUUID());
        supplierUserB.setEmail("supplier-b-" + UUID.randomUUID() + "@synthora.com");
        supplierUserB.setPasswordHash("hash");
        supplierUserB.setName("Rival Chemical Corp");
        supplierUserB.setRole(UserRole.SUPPLIER);
        supplierUserB = userRepository.save(supplierUserB);

        supplierB = new Supplier();
        supplierB.setUser(supplierUserB);
        supplierB.setName("Rival Chemical Corp");
        supplierB.setVerified(true);
        supplierB.setVerificationStatus(com.synthora.seller.SupplierVerificationStatus.VERIFIED);
        supplierB = supplierRepository.save(supplierB);

        supplierAuthB = new UsernamePasswordAuthenticationToken(
                supplierUserB.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        // 3. Create Active Master Product
        masterProduct = new MasterProduct();
        masterProduct.setMasterProductCode("SYN-MED-001");
        masterProduct.setName("Metformin Hydrochloride");
        masterProduct.setCasNumber("1115-70-4");
        masterProduct.setMolecularFormula("C4H11N5.HCl");
        masterProduct.setCategory(ProductCategory.API);
        masterProduct.setDescription("Biguanide antidiabetic agent.");
        masterProduct.setStatus("ACTIVE");
        masterProduct = masterProductRepository.save(masterProduct);

        // 4. Create Offering for Supplier A (defaults: coaAvailable=false, msdsAvailable=false, exportReady=false)
        CreateSupplierOfferingRequest req = new CreateSupplierOfferingRequest(
                masterProduct.getId(),
                new BigDecimal("45.00"),
                "INR",
                500,
                new BigDecimal("99.50"),
                "USP",
                new BigDecimal("25.00"),
                "Fiber Drum",
                5,
                false,
                false,
                false,
                "AVAILABLE"
        );
        SupplierOfferingResponse offResp = supplierOfferingService.createOffering(req, supplierAuthA);
        offeringA = supplierOfferingRepository.findById(offResp.id()).orElseThrow();
    }

    @Test
    @DisplayName("1. Supplier A can upload primary product image to own offering")
    public void testSupplierCanUploadOfferingImage() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);

        MockMultipartFile imageFile = new MockMultipartFile(
                "file",
                "sample_batch.png",
                "image/png",
                VALID_PNG_BYTES
        );

        ResponseEntity<CatalogImageResponse> resp = supplierOfferingImageController.uploadOfferingImage(
                offeringA.getId(), imageFile, "Batch Sample", supplierAuthA
        );

        assertNotNull(resp.getBody());
        assertTrue(resp.getBody().isPrimary(), "First uploaded image must automatically be designated primary");
        assertEquals("sample_batch.png", resp.getBody().fileName());

        List<CatalogImageResponse> images = supplierOfferingImageController.getOfferingImages(offeringA.getId()).getBody();
        assertNotNull(images);
        assertEquals(1, images.size());
    }

    @Test
    @DisplayName("2. Supplier A can upload COA and MSDS documents to own offering")
    public void testSupplierCanUploadOfferingDocuments() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);

        MockMultipartFile coaFile = new MockMultipartFile(
                "file",
                "Metformin_COA_Batch2026.pdf",
                "application/pdf",
                VALID_PDF_BYTES
        );

        DocumentUploadRequest docReq = new DocumentUploadRequest();
        docReq.setFile(coaFile);
        docReq.setOwnerType(DocumentOwnerType.SUPPLIER_OFFERING);
        docReq.setOwnerId(offeringA.getId());
        docReq.setCategory(DocumentCategory.COA);

        DocumentResponse docResp = documentController.uploadDocument(docReq, supplierAuthA);
        assertNotNull(docResp);
        assertEquals(DocumentCategory.COA, docResp.getCategory());
        assertEquals("Metformin_COA_Batch2026.pdf", docResp.getOriginalFileName());

        List<DocumentResponse> docs = documentController.getDocumentsByOwner(
                DocumentOwnerType.SUPPLIER_OFFERING, offeringA.getId(), supplierAuthA
        );
        assertEquals(1, docs.size());
        assertEquals(docResp.getId(), docs.get(0).getId());
    }

    @Test
    @DisplayName("3. Supplier B cannot upload image to Supplier A's offering (IDOR protection)")
    public void testSupplierCannotUploadImageToAnotherSupplierOffering() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthB);

        MockMultipartFile imageFile = new MockMultipartFile(
                "file",
                "malicious.png",
                "image/png",
                VALID_PNG_BYTES
        );

        assertThrows(AccessDeniedException.class, () -> {
            supplierOfferingImageController.uploadOfferingImage(
                    offeringA.getId(), imageFile, "Injected Image", supplierAuthB
            );
        });
    }

    @Test
    @DisplayName("4. Supplier B cannot upload document to Supplier A's offering (IDOR protection)")
    public void testSupplierCannotUploadDocumentToAnotherSupplierOffering() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthB);

        MockMultipartFile docFile = new MockMultipartFile(
                "file",
                "fake_coa.pdf",
                "application/pdf",
                VALID_PDF_BYTES
        );

        DocumentUploadRequest docReq = new DocumentUploadRequest();
        docReq.setFile(docFile);
        docReq.setOwnerType(DocumentOwnerType.SUPPLIER_OFFERING);
        docReq.setOwnerId(offeringA.getId());
        docReq.setCategory(DocumentCategory.COA);

        assertThrows(AccessDeniedException.class, () -> {
            documentController.uploadDocument(docReq, supplierAuthB);
        });
    }

    @Test
    @DisplayName("5. Supplier A can delete own uploaded document and image")
    public void testSupplierCanDeleteOwnMediaAndDocuments() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);

        // Upload image
        MockMultipartFile img = new MockMultipartFile("file", "test.png", "image/png", VALID_PNG_BYTES);
        CatalogImageResponse imgResp = supplierOfferingImageController.uploadOfferingImage(offeringA.getId(), img, "Test", supplierAuthA).getBody();

        // Upload doc
        MockMultipartFile pdf = new MockMultipartFile("file", "test.pdf", "application/pdf", VALID_PDF_BYTES);
        DocumentUploadRequest docReq = new DocumentUploadRequest();
        docReq.setFile(pdf);
        docReq.setOwnerType(DocumentOwnerType.SUPPLIER_OFFERING);
        docReq.setOwnerId(offeringA.getId());
        docReq.setCategory(DocumentCategory.TECHNICAL_SPECIFICATION);
        DocumentResponse docResp = documentController.uploadDocument(docReq, supplierAuthA);

        // Delete image
        supplierOfferingImageController.deleteOfferingImage(offeringA.getId(), imgResp.id(), supplierAuthA);
        List<CatalogImageResponse> remainingImages = supplierOfferingImageController.getOfferingImages(offeringA.getId()).getBody();
        assertTrue(remainingImages == null || remainingImages.isEmpty());

        // Delete document
        documentController.deleteDocument(docResp.getId(), supplierAuthA);
        List<DocumentResponse> remainingDocs = documentController.getDocumentsByOwner(
                DocumentOwnerType.SUPPLIER_OFFERING, offeringA.getId(), supplierAuthA
        );
        assertTrue(remainingDocs == null || remainingDocs.isEmpty());
    }

    @Test
    @DisplayName("6. Authorized document download via /api/v1/documents/{id}/download works")
    public void testAuthorizedDocumentDownload() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);

        MockMultipartFile pdf = new MockMultipartFile("file", "MSDS_Safe.pdf", "application/pdf", VALID_PDF_BYTES);
        DocumentUploadRequest docReq = new DocumentUploadRequest();
        docReq.setFile(pdf);
        docReq.setOwnerType(DocumentOwnerType.SUPPLIER_OFFERING);
        docReq.setOwnerId(offeringA.getId());
        docReq.setCategory(DocumentCategory.MSDS);
        DocumentResponse docResp = documentController.uploadDocument(docReq, supplierAuthA);

        // Download document
        ResponseEntity<Resource> downloadResp = documentController.downloadDocument(docResp.getId(), supplierAuthA);
        assertNotNull(downloadResp);
        assertEquals(200, downloadResp.getStatusCode().value());
        assertTrue(downloadResp.getHeaders().getFirst("Content-Disposition").contains("MSDS_Safe.pdf"));
    }
}
