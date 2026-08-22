package com.synthora.product;

import com.synthora.admin.supplier.AdminSupplierService;
import com.synthora.admin.supplier.api.AdminSupplierController;
import com.synthora.admin.supplier.dto.AdminSupplierResponse;
import com.synthora.document.*;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.product.apis.MasterProductImageController;
import com.synthora.product.apis.PublicMasterCatalogController;
import com.synthora.product.apis.SupplierOfferingController;
import com.synthora.product.apis.SupplierOfferingImageController;
import com.synthora.product.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class CatalogIntegrationStabilizationSecurityTest {

    @Autowired
    private CatalogImageService catalogImageService;

    @Autowired
    private MasterProductImageController masterProductImageController;

    @Autowired
    private SupplierOfferingImageController supplierOfferingImageController;

    @Autowired
    private SupplierOfferingController supplierOfferingController;

    @Autowired
    private SupplierOfferingService supplierOfferingService;

    @Autowired
    private MasterProductRepository masterProductRepository;

    @Autowired
    private SupplierOfferingRepository supplierOfferingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private AdminSupplierController adminSupplierController;

    @Autowired
    private AdminMasterCatalogService adminMasterCatalogService;

    @Autowired
    private DocumentController documentController;

    @Autowired
    private PublicMasterCatalogController publicMasterCatalogController;

    @Autowired
    private com.synthora.admin.user.api.AdminUserController adminUserController;

    @Autowired
    private ProductRequestRepository productRequestRepository;

    @Autowired
    private MasterProductService masterProductService;

    @Autowired
    private com.synthora.admin.audit.AuditLogRepository auditLogRepository;

    @Autowired
    private AdminSupplierService adminSupplierService;

    @Autowired
    private com.synthora.product.verification.SupplierOfferingVerificationService supplierOfferingVerificationService;

    private User adminUser;
    private Authentication adminAuth;

    private User supplierUserA;
    private Supplier supplierA;
    private Authentication supplierAuthA;

    private User supplierUserB;
    private Supplier supplierB;
    private Authentication supplierAuthB;

    private MasterProduct zeroOfferingProduct;

    private static final byte[] VALID_PNG_BYTES = new byte[] {
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, (byte) 196, (byte) 137
    };

    private static final byte[] VALID_PDF_BYTES = "%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF".getBytes();

    @BeforeEach
    public void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        adminUser = new User();
        adminUser.setName("Admin " + suffix);
        adminUser.setEmail("admin_stab_" + suffix + "@synthora.com");
        adminUser.setPasswordHash("hash");
        adminUser.setRole(UserRole.ADMIN);
        adminUser = userRepository.save(adminUser);
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null, java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN")));

        supplierUserA = new User();
        supplierUserA.setName("Supplier A " + suffix);
        supplierUserA.setEmail("sup_a_stab_" + suffix + "@synthora.com");
        supplierUserA.setPasswordHash("hash");
        supplierUserA.setRole(UserRole.SUPPLIER);
        supplierUserA = userRepository.save(supplierUserA);

        supplierA = new Supplier();
        supplierA.setName("Supplier A Corp " + suffix);
        supplierA.setSlug("sup-a-stab-" + suffix);
        supplierA.setUser(supplierUserA);
        supplierA.setVerified(true);
        supplierA.setVerificationStatus(com.synthora.seller.SupplierVerificationStatus.VERIFIED);
        supplierA = supplierRepository.save(supplierA);
        supplierAuthA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null, java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_SUPPLIER")));

        supplierUserB = new User();
        supplierUserB.setName("Supplier B " + suffix);
        supplierUserB.setEmail("sup_b_stab_" + suffix + "@synthora.com");
        supplierUserB.setPasswordHash("hash");
        supplierUserB.setRole(UserRole.SUPPLIER);
        supplierUserB = userRepository.save(supplierUserB);

        supplierB = new Supplier();
        supplierB.setName("Supplier B Corp " + suffix);
        supplierB.setSlug("sup-b-stab-" + suffix);
        supplierB.setUser(supplierUserB);
        supplierB.setVerified(true);
        supplierB.setVerificationStatus(com.synthora.seller.SupplierVerificationStatus.VERIFIED);
        supplierB = supplierRepository.save(supplierB);
        supplierAuthB = new UsernamePasswordAuthenticationToken(supplierUserB.getEmail(), null, java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_SUPPLIER")));

        MasterProduct mp = new MasterProduct();
        mp.setName("Zero Offering Chemical " + suffix);
        mp.setMasterProductCode("API-MP-Z-" + suffix);
        mp.setCasNumber("111-22-3");
        mp.setMolecularFormula("C8H9NO2");
        mp.setDescription("Pure API compound for research.");
        mp.setCategory(ProductCategory.API);
        mp.setStatus("ACTIVE");
        zeroOfferingProduct = masterProductRepository.save(mp);
    }

    // 1. Admin Supplier Verification API Contract: Returns paginated response with content array
    @Test
    public void test01_AdminSupplierVerificationResponseShape() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);
        ResponseEntity<Page<AdminSupplierResponse>> res = adminSupplierController.getSuppliers(
                0, 20, null, null, null, null, null, null, false
        );
        assertNotNull(res.getBody());
        assertTrue(res.getBody().getTotalElements() >= 2);
        assertNotNull(res.getBody().getContent());
        assertTrue(res.getBody().getContent().stream().anyMatch(s -> s.id().equals(supplierA.getId())));
    }

    // 2. Master Product Image Upload, Content Streaming, and Persistence
    @Test
    public void test02_MasterProductImageUploadAndContentStreaming() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);
        MockMultipartFile file = new MockMultipartFile("file", "structure.png", "image/png", VALID_PNG_BYTES);
        CatalogImageResponse uploadRes = masterProductImageController.uploadMasterProductImage(
                zeroOfferingProduct.getId(), file, "Chemical structure", adminAuth
        ).getBody();

        assertNotNull(uploadRes);
        assertNotNull(uploadRes.imageUrl());
        assertTrue(uploadRes.imageUrl().contains("/content"));

        // Stream image content via controller endpoint
        ResponseEntity<Resource> contentRes = masterProductImageController.getImageContent(
                zeroOfferingProduct.getId(), uploadRes.id()
        );
        assertNotNull(contentRes.getBody());
        assertTrue(contentRes.getBody().exists());
        assertEquals("image/png", contentRes.getHeaders().getContentType().toString());
    }

    // 3. Supplier can create first offering for MasterProduct with zero existing offerings
    @Test
    public void test03_SupplierCanCreateFirstOfferingOnZeroOfferingMasterProduct() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        CreateSupplierOfferingRequest req = new CreateSupplierOfferingRequest(
                zeroOfferingProduct.getId(),
                new BigDecimal("250.00"),
                "INR",
                100,
                new BigDecimal("99.50"),
                "USP",
                new BigDecimal("10.00"),
                "25kg Fiber Drum",
                5,
                true,
                true,
                true,
                "AVAILABLE"
        );

        SupplierOfferingResponse created = supplierOfferingController.createOffering(req, supplierAuthA).getBody();
        assertNotNull(created);
        assertEquals(zeroOfferingProduct.getId(), created.masterProductId());
        assertEquals(supplierA.getId(), created.supplierId());
        assertEquals("PENDING_REVIEW", created.moderationStatus());

        // Supplier can fetch own offering via getOfferingById
        SupplierOfferingResponse fetched = supplierOfferingController.getOfferingById(created.id(), supplierAuthA).getBody();
        assertNotNull(fetched);
        assertEquals(created.id(), fetched.id());
    }

    // 4. Supplier can edit own offering, but cannot edit another supplier's offering
    @Test
    public void test04_SupplierOwnershipEnforcementOnOfferingEdit() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        CreateSupplierOfferingRequest req = new CreateSupplierOfferingRequest(
                zeroOfferingProduct.getId(),
                new BigDecimal("250.00"),
                "INR",
                100,
                new BigDecimal("99.50"),
                "USP",
                new BigDecimal("10.00"),
                "25kg Fiber Drum",
                5,
                true,
                true,
                true,
                "AVAILABLE"
        );

        SupplierOfferingResponse createdA = supplierOfferingController.createOffering(req, supplierAuthA).getBody();

        // Supplier A updates price
        UpdateSupplierOfferingRequest updateReq = new UpdateSupplierOfferingRequest(
                new BigDecimal("220.00"),
                "INR",
                150,
                new BigDecimal("99.80"),
                "EP",
                new BigDecimal("25.00"),
                "50kg Drum",
                7,
                true,
                true,
                true,
                "AVAILABLE"
        );
        SupplierOfferingResponse updated = supplierOfferingController.updateOffering(createdA.id(), updateReq, supplierAuthA).getBody();
        assertEquals(new BigDecimal("220.00"), updated.price());

        // Switch to Supplier B context
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthB);

        // Supplier B cannot access Supplier A's offering via getOfferingById
        assertThrows(AccessDeniedException.class, () -> supplierOfferingController.getOfferingById(createdA.id(), supplierAuthB));

        // Supplier B cannot update Supplier A's offering
        assertThrows(AccessDeniedException.class, () -> supplierOfferingController.updateOffering(createdA.id(), updateReq, supplierAuthB));
    }

    // 5. Governance Field Verification (Field 07 Technical Documents) Persists and Updates Score
    @Test
    public void test05_MasterProductGovernanceFieldVerificationPersistence() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);

        // Initial state: Field 07 is ATTENTION_REQUIRED because no document uploaded yet
        MasterProductDetailResponse initial = adminMasterCatalogService.getMasterProductDetail(zeroOfferingProduct.getId(), adminAuth);
        assertNotNull(initial.verifiedFields());
        assertEquals("ATTENTION_REQUIRED", initial.verifiedFields().get("DOCUMENTS"));

        // Admin audits and verifies Field 07
        VerifyChemicalFieldPayload payload = new VerifyChemicalFieldPayload(
                "DOCUMENTS", "VERIFIED", "Standard specification confirmed against pharmacopeia."
        );
        adminMasterCatalogService.verifyChemicalField(zeroOfferingProduct.getId(), payload, adminAuth);

        // Reload detail: Field 07 must be VERIFIED
        MasterProductDetailResponse reloaded = adminMasterCatalogService.getMasterProductDetail(zeroOfferingProduct.getId(), adminAuth);
        assertEquals("VERIFIED", reloaded.verifiedFields().get("DOCUMENTS"));
        assertEquals("VERIFIED", reloaded.verifiedFields().get("NAME"));
        assertEquals("VERIFIED", reloaded.verifiedFields().get("CAS_NUMBER"));
        assertEquals("VERIFIED", reloaded.verifiedFields().get("MOLECULAR_FORMULA"));
        assertEquals("VERIFIED", reloaded.verifiedFields().get("CATEGORY"));
        assertEquals("VERIFIED", reloaded.verifiedFields().get("PRODUCT_CODE"));
    }

    // 6. Canonical Technical Document Upload, Listing, Download, and Deletion
    @Test
    public void test06_TechnicalDocumentUploadAndManagement() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);

        MockMultipartFile pdfFile = new MockMultipartFile(
                "file", "specification_sheet.pdf", "application/pdf", VALID_PDF_BYTES
        );

        DocumentUploadRequest req = new DocumentUploadRequest();
        req.setFile(pdfFile);
        req.setOwnerType(DocumentOwnerType.MASTER_PRODUCT);
        req.setOwnerId(zeroOfferingProduct.getId());
        req.setCategory(DocumentCategory.TECHNICAL_SPECIFICATION);

        DocumentResponse uploaded = documentController.uploadDocument(req, adminAuth);
        assertNotNull(uploaded);
        assertEquals("specification_sheet.pdf", uploaded.getOriginalFileName());
        assertEquals(DocumentOwnerType.MASTER_PRODUCT, uploaded.getOwnerType());
        assertEquals(zeroOfferingProduct.getId(), uploaded.getOwnerId());

        // Detail response contains the document
        MasterProductDetailResponse detail = adminMasterCatalogService.getMasterProductDetail(zeroOfferingProduct.getId(), adminAuth);
        assertFalse(detail.documents().isEmpty());
        assertEquals("specification_sheet.pdf", detail.documents().get(0).getOriginalFileName());
        assertEquals("VERIFIED", detail.verifiedFields().get("DOCUMENTS"));

        // Download document
        ResponseEntity<Resource> downloadRes = documentController.downloadDocument(uploaded.getId(), adminAuth);
        assertNotNull(downloadRes.getBody());
        assertTrue(downloadRes.getBody().exists());

        // Delete document
        documentController.deleteDocument(uploaded.getId(), adminAuth);
        MasterProductDetailResponse afterDelete = adminMasterCatalogService.getMasterProductDetail(zeroOfferingProduct.getId(), adminAuth);
        assertTrue(afterDelete.documents().isEmpty());
    }

    // 7. Public Catalog Visibility with Approved Offering vs 0 Offering Product
    @Test
    public void test07_PublicCatalogVisibilityWithApprovedOffering() {
        // Initial state: zeroOfferingProduct has 0 offerings -> excluded from public catalog
        ResponseEntity<Page<MasterProductResponse>> publicSearch1 = publicMasterCatalogController.searchActiveMasterProducts(
                null, null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, null
        );
        assertNotNull(publicSearch1.getBody());
        assertFalse(publicSearch1.getBody().getContent().stream().anyMatch(p -> p.id().equals(zeroOfferingProduct.getId())));

        // Supplier creates offering
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        CreateSupplierOfferingRequest req = new CreateSupplierOfferingRequest(
                zeroOfferingProduct.getId(),
                new BigDecimal("250.00"),
                "INR",
                100,
                new BigDecimal("99.50"),
                "USP",
                new BigDecimal("10.00"),
                "25kg Drum",
                5,
                true,
                true,
                true,
                "AVAILABLE"
        );
        SupplierOfferingResponse offering = supplierOfferingController.createOffering(req, supplierAuthA).getBody();
        assertNotNull(offering);

        // Admin approves offering
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);
        SupplierOffering entity = supplierOfferingRepository.findById(offering.id()).orElseThrow();
        entity.setModerationStatus("APPROVED");
        entity.setAvailabilityStatus("AVAILABLE");
        supplierOfferingRepository.save(entity);

        // Now public catalog includes the product
        ResponseEntity<Page<MasterProductResponse>> publicSearch2 = publicMasterCatalogController.searchActiveMasterProducts(
                null, null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, null
        );
        assertNotNull(publicSearch2.getBody());
        assertTrue(publicSearch2.getBody().getContent().stream().anyMatch(p -> p.id().equals(zeroOfferingProduct.getId())));
    }

    // 8. Admin Master Catalog Search by Name, CAS, Code, Molecular Formula
    @Test
    public void test08_AdminMasterCatalogMultiFieldSearchAndFilters() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);

        // Search by exact CAS
        Page<MasterProductResponse> byCas = adminMasterCatalogService.searchAdminMasterProducts(
                new AdminMasterProductSearchCriteria(null, "111-22-3", null, null, null, null, null, 0, 20, "createdAt,desc"),
                org.springframework.data.domain.PageRequest.of(0, 20),
                adminAuth
        );
        assertTrue(byCas.getContent().stream().anyMatch(p -> p.id().equals(zeroOfferingProduct.getId())));

        // Search by Code
        Page<MasterProductResponse> byCode = adminMasterCatalogService.searchAdminMasterProducts(
                new AdminMasterProductSearchCriteria(null, null, zeroOfferingProduct.getMasterProductCode(), null, null, null, null, 0, 20, "createdAt,desc"),
                org.springframework.data.domain.PageRequest.of(0, 20),
                adminAuth
        );
        assertTrue(byCode.getContent().stream().anyMatch(p -> p.id().equals(zeroOfferingProduct.getId())));

        // Search by query (Molecular formula)
        Page<MasterProductResponse> byFormula = adminMasterCatalogService.searchAdminMasterProducts(
                new AdminMasterProductSearchCriteria("C8H9NO2", null, null, null, null, null, null, 0, 20, "createdAt,desc"),
                org.springframework.data.domain.PageRequest.of(0, 20),
                adminAuth
        );
        assertTrue(byFormula.getContent().stream().anyMatch(p -> p.id().equals(zeroOfferingProduct.getId())));

        // Filter by Category
        Page<MasterProductResponse> byCategory = adminMasterCatalogService.searchAdminMasterProducts(
                new AdminMasterProductSearchCriteria(null, null, null, ProductCategory.API, null, null, null, 0, 20, "createdAt,desc"),
                org.springframework.data.domain.PageRequest.of(0, 20),
                adminAuth
        );
        assertTrue(byCategory.getContent().stream().anyMatch(p -> p.id().equals(zeroOfferingProduct.getId())));
    }

    // 9. Governance Statistics Calculation
    @Test
    public void test09_GovernanceStatsCalculation() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);
        GovernanceStatsResponse stats = adminMasterCatalogService.getGovernanceStats(adminAuth);
        assertNotNull(stats);
        assertTrue(stats.activeMasterProducts() >= 1);
        assertTrue(stats.pendingSupplierVerifications() >= 0);
        assertTrue(stats.verifiedSuppliersCount() >= 1);
        assertTrue(stats.totalOfferings() >= 0);
    }

    // 10. Admin User Management Contract and Filtering
    @Test
    public void test10_AdminUserManagementContractAndSecurity() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);

        // Fetch users page
        ResponseEntity<Page<com.synthora.admin.user.dto.AdminUserResponse>> res = adminUserController.getUsers(
                0, 20, null, null, null, null, false
        );
        assertNotNull(res.getBody());
        assertTrue(res.getBody().getTotalElements() >= 3);
        assertTrue(res.getBody().getContent().stream().anyMatch(u -> u.email().equals(adminUser.getEmail())));

        // Filter by Role
        ResponseEntity<Page<com.synthora.admin.user.dto.AdminUserResponse>> adminOnly = adminUserController.getUsers(
                0, 20, null, null, UserRole.ADMIN, null, false
        );
        assertNotNull(adminOnly.getBody());
        assertTrue(adminOnly.getBody().getContent().stream().allMatch(u -> u.role() == UserRole.ADMIN));
    }

    // 11. Security Boundary Enforcement: Non-admin cannot access admin catalog/users
    @Test
    public void test11_RoleBasedAccessControlOnAdminEndpoints() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);

        assertThrows(AccessDeniedException.class, () -> adminMasterCatalogService.getGovernanceStats(supplierAuthA));
        assertThrows(AccessDeniedException.class, () -> adminMasterCatalogService.searchAdminMasterProducts(
                new AdminMasterProductSearchCriteria(null, null, null, null, null, null, null, 0, 20, "createdAt,desc"),
                org.springframework.data.domain.PageRequest.of(0, 20),
                supplierAuthA
        ));
    }

    // 12. Product Request Search and Linking to Existing MasterProduct
    @Test
    public void test12_ProductRequestSearchAndLinkingToExistingMasterProduct() {
        // Supplier creates product request
        ProductRequest pr = new ProductRequest();
        pr.setSupplier(supplierA);
        pr.setProposedName("Zero Offering Custom Grade");
        pr.setCasNumber("111-22-3");
        pr.setMolecularFormula("C8H9NO2");
        pr.setCategory(ProductCategory.API);
        pr.setStatus("PENDING_REVIEW");
        final ProductRequest savedPr = productRequestRepository.save(pr);

        // Admin searches master catalog for linking candidates
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);
        Page<MasterProductResponse> candidates = masterProductService.searchMasterProducts("111-22-3", 0, 10);
        assertNotNull(candidates);
        assertTrue(candidates.getContent().stream().anyMatch(c -> c.id().equals(zeroOfferingProduct.getId())));

        // Admin links the proposal to the existing canonical MasterProduct
        ApproveAndLinkPayload linkPayload = new ApproveAndLinkPayload(
                zeroOfferingProduct.getId(),
                "Linked proposal to verified canonical MasterProduct " + zeroOfferingProduct.getMasterProductCode()
        );
        MasterProductResponse linkedMp = adminMasterCatalogService.approveAndLinkRequest(savedPr.getId(), linkPayload, adminAuth);
        assertNotNull(linkedMp);
        assertEquals(zeroOfferingProduct.getId(), linkedMp.id());

        // Verify request status and reviewedBy
        ProductRequest updatedPr = productRequestRepository.findById(savedPr.getId()).orElseThrow();
        assertEquals("APPROVED", updatedPr.getStatus());
        assertNotNull(updatedPr.getReviewedBy());
        assertEquals(adminUser.getId(), updatedPr.getReviewedBy().getId());
    }

    // 13. Product Request Linking Security and Validation
    @Test
    public void test13_ProductRequestLinkingSecurityAndValidation() {
        ProductRequest pr = new ProductRequest();
        pr.setSupplier(supplierA);
        pr.setProposedName("Acetaminophen Proposal");
        pr.setCasNumber("103-90-2");
        pr.setCategory(ProductCategory.API);
        pr.setStatus("PENDING_REVIEW");
        final ProductRequest savedPr = productRequestRepository.save(pr);

        // Supplier cannot approve or link request
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        ApproveAndLinkPayload linkPayload = new ApproveAndLinkPayload(zeroOfferingProduct.getId(), "Supplier trying to link");
        assertThrows(AccessDeniedException.class, () ->
                adminMasterCatalogService.approveAndLinkRequest(savedPr.getId(), linkPayload, supplierAuthA));

        // Admin with non-existent MasterProduct UUID -> 404
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);
        ApproveAndLinkPayload invalidPayload = new ApproveAndLinkPayload(UUID.randomUUID(), "Invalid UUID");
        assertThrows(com.synthora.common.ResourceNotFoundException.class, () ->
                adminMasterCatalogService.approveAndLinkRequest(savedPr.getId(), invalidPayload, adminAuth));
    }

    // 14. Supplier Offering Lifecycle and Domain Decoupling
    @Test
    public void test14_SupplierOfferingLifecycleAndDomainDecoupling() {
        // Supplier creates offering for zeroOfferingProduct
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        CreateSupplierOfferingRequest createReq = new CreateSupplierOfferingRequest(
                zeroOfferingProduct.getId(),
                new BigDecimal("150.00"),
                "INR",
                500,
                new BigDecimal("99.00"),
                "BP",
                new BigDecimal("25.00"),
                "Fiber Drum",
                7,
                true,
                true,
                true,
                "AVAILABLE"
        );
        SupplierOfferingResponse createdOffering = supplierOfferingService.createOffering(createReq, supplierAuthA);
        assertNotNull(createdOffering);
        assertEquals("PENDING_REVIEW", createdOffering.moderationStatus());

        // MasterProduct remains ACTIVE
        MasterProduct mp = masterProductRepository.findById(zeroOfferingProduct.getId()).orElseThrow();
        assertEquals("ACTIVE", mp.getStatus());

        // Supplier A updates their own pending offering
        UpdateSupplierOfferingRequest updateReq = new UpdateSupplierOfferingRequest(
                new BigDecimal("145.00"),
                "INR",
                600,
                new BigDecimal("99.20"),
                "BP/USP",
                new BigDecimal("20.00"),
                "Fiber Drum",
                5,
                true,
                true,
                true,
                "AVAILABLE"
        );
        SupplierOfferingResponse updatedOffering = supplierOfferingService.updateOffering(createdOffering.id(), updateReq, supplierAuthA);
        assertNotNull(updatedOffering);
        assertEquals(new BigDecimal("145.00"), updatedOffering.price());
        assertEquals(600, updatedOffering.stock());

        // Supplier B cannot update Supplier A's offering
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        assertThrows(AccessDeniedException.class, () ->
                supplierOfferingService.updateOffering(createdOffering.id(), updateReq, supplierAuthB));

        // Pending offering is NOT visible on public chemical catalog
        ResponseEntity<Page<MasterProductResponse>> publicBeforeApproval = publicMasterCatalogController.searchActiveMasterProducts(
                null, null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, null
        );
        assertNotNull(publicBeforeApproval.getBody());
        assertFalse(publicBeforeApproval.getBody().getContent().stream().anyMatch(p -> p.id().equals(zeroOfferingProduct.getId())));

        // Admin approves offering
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);
        SupplierOfferingResponse approved = supplierOfferingService.approveOffering(createdOffering.id(), "Commercial terms verified", adminAuth);
        assertEquals("APPROVED", approved.moderationStatus());

        // Now public chemical catalog includes the product
        ResponseEntity<Page<MasterProductResponse>> publicAfterApproval = publicMasterCatalogController.searchActiveMasterProducts(
                null, null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, null
        );
        assertNotNull(publicAfterApproval.getBody());
        assertTrue(publicAfterApproval.getBody().getContent().stream().anyMatch(p -> p.id().equals(zeroOfferingProduct.getId())));
    }

    // 15. Admin Offering Moderation Workflow & Audit Verification
    @Test
    public void test15_AdminOfferingModerationWorkflowAndAudit() {
        // Supplier A creates offering
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        CreateSupplierOfferingRequest createReq = new CreateSupplierOfferingRequest(
                zeroOfferingProduct.getId(),
                new BigDecimal("180.00"),
                "INR",
                400,
                new BigDecimal("98.50"),
                "USP",
                new BigDecimal("50.00"),
                "HDPE Drum",
                7,
                true,
                true,
                true,
                "AVAILABLE"
        );
        SupplierOfferingResponse createdOffering = supplierOfferingService.createOffering(createReq, supplierAuthA);
        assertNotNull(createdOffering);
        assertEquals("PENDING_REVIEW", createdOffering.moderationStatus());

        // Admin filters offering queue
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);
        Page<SupplierOfferingResponse> pendingQueue = adminMasterCatalogService.searchSupplierOfferings(
                null, "PENDING_REVIEW", null, null, org.springframework.data.domain.PageRequest.of(0, 10), adminAuth
        );
        assertTrue(pendingQueue.getContent().stream().anyMatch(o -> o.id().equals(createdOffering.id())));

        // Admin inspects offering governance details
        com.synthora.product.verification.dto.SupplierOfferingGovernanceWorkspaceDto ws =
                supplierOfferingVerificationService.getOfferingVerificationDetails(createdOffering.id());
        assertNotNull(ws);
        assertEquals(zeroOfferingProduct.getName(), ws.masterProductName());
        assertEquals("PENDING_REVIEW", ws.moderationStatus());
        assertNotNull(ws.images());
        assertNotNull(ws.documents());

        // Admin flags offering
        SupplierOfferingResponse flagged = supplierOfferingService.flagOffering(createdOffering.id(), "Please update purity certificate", adminAuth);
        assertEquals("FLAGGED", flagged.moderationStatus());

        // Admin requests info
        SupplierOfferingResponse infoReq = supplierOfferingService.requestInfoOffering(createdOffering.id(), "Submit updated MSDS", adminAuth);
        assertEquals("FLAGGED", infoReq.moderationStatus());

        // Admin approves offering
        SupplierOfferingResponse approved = supplierOfferingService.approveOffering(createdOffering.id(), "All criteria verified", adminAuth);
        assertEquals("APPROVED", approved.moderationStatus());

        // Verify Audit Log records exist for SUPPLIER_OFFERING target
        var auditLogs = auditLogRepository.findAll().stream()
                .filter(a -> com.synthora.admin.audit.AuditTargetType.SUPPLIER_OFFERING.equals(a.getTargetType()) &&
                        createdOffering.id().toString().equals(a.getTargetId()))
                .toList();
        assertFalse(auditLogs.isEmpty());
        assertTrue(auditLogs.stream().anyMatch(a -> com.synthora.admin.audit.AuditAction.SUPPLIER_OFFERING_APPROVED.equals(a.getAction())));
    }

    // 16. Supplier Cannot Approve or Moderation Own or Others' Offering
    @Test
    public void test16_SupplierCannotApproveOwnOffering() {
        // Supplier creates offering
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        CreateSupplierOfferingRequest createReq = new CreateSupplierOfferingRequest(
                zeroOfferingProduct.getId(),
                new BigDecimal("210.00"),
                "INR",
                200,
                new BigDecimal("99.00"),
                "USP",
                new BigDecimal("10.00"),
                "25kg Drum",
                3,
                true,
                true,
                true,
                "AVAILABLE"
        );
        SupplierOfferingResponse offering = supplierOfferingService.createOffering(createReq, supplierAuthA);

        // Supplier A tries to approve own offering -> 403 AccessDeniedException
        assertThrows(AccessDeniedException.class, () ->
                supplierOfferingService.approveOffering(offering.id(), "Self-approval", supplierAuthA)
        );

        // Supplier B tries to approve Supplier A's offering -> 403 AccessDeniedException
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        assertThrows(AccessDeniedException.class, () ->
                supplierOfferingService.approveOffering(offering.id(), "Malicious approval", supplierAuthB)
        );
    }

    // 17. Already Verified Supplier Re-verification Fails Safely
    @Test
    public void test17_AlreadyVerifiedSupplierCannotBeReVerified() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);

        // supplierA is already VERIFIED
        assertTrue(Boolean.TRUE.equals(supplierA.getVerified()));
        assertEquals(com.synthora.seller.SupplierVerificationStatus.VERIFIED, supplierA.getVerificationStatus());

        // Calling transitionSupplierVerification to VERIFIED again throws IllegalArgumentException
        assertThrows(IllegalArgumentException.class, () ->
                adminSupplierService.transitionSupplierVerification(
                        supplierA.getId(),
                        com.synthora.seller.SupplierVerificationStatus.VERIFIED,
                        "Attempt duplicate verification",
                        adminAuth
                )
        );
    }

    // 18. Public Chemical Catalog Four-Pillar Eligibility
    @Test
    public void test18_PublicCatalogFourPillarEligibilityCheck() {
        // Step 1: Supplier creates offering in PENDING_REVIEW
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        CreateSupplierOfferingRequest createReq = new CreateSupplierOfferingRequest(
                zeroOfferingProduct.getId(),
                new BigDecimal("300.00"),
                "INR",
                250,
                new BigDecimal("99.00"),
                "USP",
                new BigDecimal("10.00"),
                "Drum",
                5,
                true,
                true,
                true,
                "AVAILABLE"
        );
        SupplierOfferingResponse offering = supplierOfferingService.createOffering(createReq, supplierAuthA);
        assertEquals("PENDING_REVIEW", offering.moderationStatus());

        // In PENDING_REVIEW, product must NOT appear in public catalog
        ResponseEntity<Page<MasterProductResponse>> publicPending = publicMasterCatalogController.searchActiveMasterProducts(
                null, null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, null
        );
        assertNotNull(publicPending.getBody());
        assertFalse(publicPending.getBody().getContent().stream().anyMatch(p -> p.id().equals(zeroOfferingProduct.getId())));

        // Step 2: Admin flags offering (FLAGGED)
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);
        supplierOfferingService.flagOffering(offering.id(), "Clarification needed", adminAuth);

        // In FLAGGED status, product must NOT appear in public catalog
        ResponseEntity<Page<MasterProductResponse>> publicFlagged = publicMasterCatalogController.searchActiveMasterProducts(
                null, null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, null
        );
        assertNotNull(publicFlagged.getBody());
        assertFalse(publicFlagged.getBody().getContent().stream().anyMatch(p -> p.id().equals(zeroOfferingProduct.getId())));

        // Step 3: Admin approves offering (APPROVED)
        supplierOfferingService.approveOffering(offering.id(), "Approved by Admin", adminAuth);

        // Now all 4 pillars satisfied: MasterProduct ACTIVE, Supplier VERIFIED, Offering APPROVED, AVAILABLE
        ResponseEntity<Page<MasterProductResponse>> publicActive = publicMasterCatalogController.searchActiveMasterProducts(
                null, null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, null
        );
        assertNotNull(publicActive.getBody());
        assertTrue(publicActive.getBody().getContent().stream().anyMatch(p -> p.id().equals(zeroOfferingProduct.getId())));

        // Step 4: If availability is changed to OUT_OF_STOCK
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        UpdateSupplierOfferingRequest outOfStockUpdate = new UpdateSupplierOfferingRequest(
                new BigDecimal("300.00"),
                "INR",
                0,
                new BigDecimal("99.00"),
                "USP",
                new BigDecimal("10.00"),
                "Drum",
                5,
                true,
                true,
                true,
                "OUT_OF_STOCK"
        );
        supplierOfferingService.updateOffering(offering.id(), outOfStockUpdate, supplierAuthA);

        // In OUT_OF_STOCK, product must NOT appear in default AVAILABLE catalog
        ResponseEntity<Page<MasterProductResponse>> publicOutOfStock = publicMasterCatalogController.searchActiveMasterProducts(
                null, null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, 0, 20, null
        );
        assertNotNull(publicOutOfStock.getBody());
        assertFalse(publicOutOfStock.getBody().getContent().stream().anyMatch(p -> p.id().equals(zeroOfferingProduct.getId())));
    }
}
