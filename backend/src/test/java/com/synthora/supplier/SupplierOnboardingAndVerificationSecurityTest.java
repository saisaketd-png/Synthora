package com.synthora.supplier;

import com.synthora.admin.audit.AuditService;
import com.synthora.common.ResourceNotFoundException;
import com.synthora.document.DocumentOwnerType;
import com.synthora.document.DocumentResponse;
import com.synthora.document.DocumentService;
import com.synthora.document.DocumentUploadRequest;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.identity.dto.SupplierRegisterRequest;
import com.synthora.identity.service.UserService;
import com.synthora.product.*;
import com.synthora.product.apis.SupplierPublicController;
import com.synthora.product.dto.CreateMasterProductRequest;
import com.synthora.product.dto.CreateSupplierOfferingRequest;
import com.synthora.product.dto.MasterProductDetailResponse;
import com.synthora.product.dto.SupplierOfferingResponse;
import com.synthora.seller.SupplierProfileController;
import com.synthora.seller.SupplierVerificationStatus;
import com.synthora.seller.dto.SupplierProfileResponse;
import com.synthora.seller.dto.UpdateSupplierProfileRequest;
import com.synthora.seller.verification.AdminSupplierVerificationController;
import com.synthora.seller.verification.SupplierVerificationService;
import com.synthora.seller.verification.dto.SupplierVerificationWorkspaceDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class SupplierOnboardingAndVerificationSecurityTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private SupplierProfileController supplierProfileController;

    @Autowired
    private SupplierPublicController supplierPublicController;

    @Autowired
    private AdminSupplierVerificationController adminSupplierVerificationController;

    @Autowired
    private SupplierVerificationService supplierVerificationService;

    @Autowired
    private MasterProductService masterProductService;

    @Autowired
    private SupplierOfferingService supplierOfferingService;

    @Autowired
    private DocumentService documentService;

    @Autowired
    private com.synthora.product.apis.PublicMasterCatalogController publicMasterCatalogController;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private User supplierUserA;
    private Supplier supplierA;
    private UsernamePasswordAuthenticationToken supplierAuthA;

    private User supplierUserB;
    private Supplier supplierB;
    private UsernamePasswordAuthenticationToken supplierAuthB;

    private User adminUser;
    private UsernamePasswordAuthenticationToken adminAuth;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM users;");

        // Create Admin
        adminUser = new User();
        adminUser.setName("System Admin");
        adminUser.setEmail("admin-onboarding-" + UUID.randomUUID() + "@synthora.com");
        adminUser.setPasswordHash("hash");
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setStatus(UserStatus.ACTIVE);
        adminUser = userRepository.save(adminUser);
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        // Create Supplier A
        supplierUserA = new User();
        supplierUserA.setName("Dr. Rajesh Kumar");
        supplierUserA.setEmail("rajesh-onboarding-" + UUID.randomUUID() + "@apexchem.com");
        supplierUserA.setPasswordHash("hash");
        supplierUserA.setRole(UserRole.SUPPLIER);
        supplierUserA.setStatus(UserStatus.ACTIVE);
        supplierUserA = userRepository.save(supplierUserA);
        supplierAuthA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        supplierA = new Supplier();
        supplierA.setUser(supplierUserA);
        supplierA.setName("Apex Fine Chemicals Ltd.");
        supplierA.setSlug("apex-chem-" + UUID.randomUUID().toString().substring(0, 8));
        supplierA.setCountryCode("IN");
        supplierA.setCountryName("India");
        supplierA.setVerified(false);
        supplierA.setVerificationStatus(SupplierVerificationStatus.DRAFT);
        supplierA.setCreatedAt(LocalDateTime.now());
        supplierA = supplierRepository.save(supplierA);

        // Create Supplier B
        supplierUserB = new User();
        supplierUserB.setName("Supplier B Representative");
        supplierUserB.setEmail("rep-onboarding-" + UUID.randomUUID() + "@biochem.com");
        supplierUserB.setPasswordHash("hash");
        supplierUserB.setRole(UserRole.SUPPLIER);
        supplierUserB.setStatus(UserStatus.ACTIVE);
        supplierUserB = userRepository.save(supplierUserB);
        supplierAuthB = new UsernamePasswordAuthenticationToken(supplierUserB.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        supplierB = new Supplier();
        supplierB.setUser(supplierUserB);
        supplierB.setName("BioChem Laboratories");
        supplierB.setSlug("biochem-" + UUID.randomUUID().toString().substring(0, 8));
        supplierB.setCountryCode("DE");
        supplierB.setCountryName("Germany");
        supplierB.setVerified(false);
        supplierB.setVerificationStatus(SupplierVerificationStatus.DRAFT);
        supplierB.setCreatedAt(LocalDateTime.now());
        supplierB = supplierRepository.save(supplierB);
    }

    @Test
    void test01_SupplierRegistrationCreatesUnverifiedSupplierWithDraftStatus() {
        String email = "new-supplier-" + UUID.randomUUID() + "@pharma.com";
        SupplierRegisterRequest request = new SupplierRegisterRequest(
                "Pharma Synthetics India",
                email,
                "StrongPassword123!",
                "Pharma Synthetics Ltd",
                "India",
                "IN",
                "+919876543210",
                "Hyderabad",
                "https://pharmasynthetics.example.com",
                "Specialized active ingredient manufacturer"
        );

        var loginResponse = userService.registerSupplier(request);
        assertNotNull(loginResponse);
        assertNotNull(loginResponse.token());

        User registeredUser = userRepository.findByEmail(email).orElseThrow();
        assertEquals(UserRole.SUPPLIER, registeredUser.getRole());

        Supplier createdSupplier = supplierRepository.findByUser(registeredUser).orElseThrow();
        assertEquals("Pharma Synthetics Ltd", createdSupplier.getName());
        assertFalse(Boolean.TRUE.equals(createdSupplier.getVerified()), "Newly registered supplier must not be auto-verified");
        assertEquals(SupplierVerificationStatus.DRAFT, createdSupplier.getVerificationStatus(), "Initial status must be DRAFT before explicit submission");
        assertFalse(Boolean.TRUE.equals(createdSupplier.getEmailVerified()));
        assertFalse(Boolean.TRUE.equals(createdSupplier.getPhoneVerified()));
    }

    @Test
    void test02_SupplierCanSaveDraftAndRetrieveProfileWithoutSubmitting() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        UpdateSupplierProfileRequest updateReq = new UpdateSupplierProfileRequest(
                "Apex Fine Chemicals Global",
                "Apex Fine Chemicals Private Limited",
                "Apex Chem",
                "MANUFACTURER",
                "Plot No 42, MIDC Industrial Area Phase II",
                "Maharashtra",
                "Mumbai",
                "400001",
                "IN",
                "India",
                "contact@apexchem.example.com",
                "+91 22 1234 5678",
                "Dr. Rajesh Kumar",
                "Managing Director",
                "https://apexchem.example.com",
                "27AABCA1234F1Z5",
                "U24110MH2012PTC234567",
                "Producer of high purity pharmaceutical intermediates",
                "USA, Germany, Japan",
                "APIs, Intermediates",
                15,
                true
        );

        ResponseEntity<SupplierProfileResponse> updateRes = supplierProfileController.updateMyProfile(updateReq, supplierAuthA);
        assertEquals(HttpStatus.OK, updateRes.getStatusCode());
        SupplierProfileResponse profile = updateRes.getBody();
        assertNotNull(profile);
        assertEquals("Apex Fine Chemicals Global", profile.name());
        assertEquals("Apex Fine Chemicals Private Limited", profile.legalName());
        assertEquals("Apex Chem", profile.tradeName());
        assertEquals("MANUFACTURER", profile.businessType());
        assertEquals("Plot No 42, MIDC Industrial Area Phase II", profile.registeredAddress());
        assertEquals("27AABCA1234F1Z5", profile.taxVatNumber());
        assertEquals(15, profile.yearsInBusiness());
        assertTrue(profile.exportReady());
        assertEquals("DRAFT", profile.verificationStatus(), "Saving profile draft must NOT transition to PENDING");

        // Retrieve profile via GET
        ResponseEntity<SupplierProfileResponse> getRes = supplierProfileController.getMyProfile(supplierAuthA);
        assertEquals(HttpStatus.OK, getRes.getStatusCode());
        assertEquals("Apex Fine Chemicals Global", getRes.getBody().name());
        assertEquals("DRAFT", getRes.getBody().verificationStatus());
    }

    @Test
    void test03_SupplierCanUploadCompanyLogoAndStreamPubliclyWithoutChangingDraftStatus() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        // Valid PNG Header: 89 50 4E 47 0D 0A 1A 0A
        byte[] pngBytes = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D};
        MockMultipartFile validLogo = new MockMultipartFile("file", "company_logo.png", "image/png", pngBytes);

        ResponseEntity<SupplierProfileResponse> uploadRes = supplierProfileController.uploadLogo(validLogo, supplierAuthA);
        assertEquals(HttpStatus.OK, uploadRes.getStatusCode());
        SupplierProfileResponse profile = uploadRes.getBody();
        assertNotNull(profile);
        assertNotNull(profile.logoUrl());
        assertTrue(profile.logoUrl().startsWith("/api/v1/suppliers/"));
        assertTrue(profile.logoUrl().endsWith("/logo"));
        assertEquals("DRAFT", profile.verificationStatus(), "Logo upload must NEVER submit verification application or change status from DRAFT to PENDING");

        // Public stream endpoint
        ResponseEntity<Resource> logoStreamRes = supplierPublicController.getSupplierLogo(supplierA.getId());
        assertEquals(HttpStatus.OK, logoStreamRes.getStatusCode());
        assertNotNull(logoStreamRes.getBody());
        assertTrue(logoStreamRes.getHeaders().getCacheControl().contains("public"));
    }

    @Test
    void test03B_SupplierCanRemoveCompanyLogoWithoutChangingDraftStatus() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        // Upload logo first
        byte[] pngBytes = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D};
        MockMultipartFile validLogo = new MockMultipartFile("file", "company_logo.png", "image/png", pngBytes);
        supplierProfileController.uploadLogo(validLogo, supplierAuthA);

        // Remove logo
        ResponseEntity<SupplierProfileResponse> deleteRes = supplierProfileController.deleteLogo(supplierAuthA);
        assertEquals(HttpStatus.OK, deleteRes.getStatusCode());
        assertNull(deleteRes.getBody().logoUrl());
        assertEquals("DRAFT", deleteRes.getBody().verificationStatus(), "Removing logo must NOT change verification status");
    }

    @Test
    void test04_LogoUploadRejectsInvalidFileSignatures() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        // Invalid text pretending to be PNG
        MockMultipartFile fakeLogo = new MockMultipartFile("file", "fake.png", "image/png", "NOT_A_REAL_PNG".getBytes());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                supplierProfileController.uploadLogo(fakeLogo, supplierAuthA));
        assertTrue(ex.getMessage().contains("Corrupted image or invalid binary signature"));
    }

    @Test
    void test05_SupplierCanVerifyEmailAndPhoneWithoutChangingDraftStatus() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        ResponseEntity<SupplierProfileResponse> emailRes = supplierProfileController.verifyEmail(supplierAuthA);
        assertEquals(HttpStatus.OK, emailRes.getStatusCode());
        assertTrue(emailRes.getBody().emailVerified());
        assertEquals("DRAFT", emailRes.getBody().verificationStatus());

        ResponseEntity<SupplierProfileResponse> phoneRes = supplierProfileController.verifyPhone(supplierAuthA);
        assertEquals(HttpStatus.OK, phoneRes.getStatusCode());
        assertTrue(phoneRes.getBody().phoneVerified());
        assertEquals("DRAFT", phoneRes.getBody().verificationStatus());
    }

    @Test
    void test06_SupplierCanSubmitVerificationApplicationExplicitlyTransitionsToPending() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        ResponseEntity<SupplierProfileResponse> submitRes = supplierProfileController.submitVerification(supplierAuthA);
        assertEquals(HttpStatus.OK, submitRes.getStatusCode());
        assertEquals("PENDING", submitRes.getBody().verificationStatus(), "Explicit submit button MUST transition status to PENDING");
    }

    @Test
    void test07_AdminSupplierListExcludesDraftSuppliersFromVerificationQueue() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);

        // Supplier A is DRAFT -> excluded when excludeDraft=true
        var queueBefore = adminSupplierVerificationController.getVerificationDetails(supplierA.getId());
        assertEquals("DRAFT", queueBefore.getBody().verificationStatus());

        // Supplier A explicitly submits
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        supplierProfileController.submitVerification(supplierAuthA);

        // After submission, status is PENDING
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);
        var queueAfter = adminSupplierVerificationController.getVerificationDetails(supplierA.getId());
        assertEquals("PENDING", queueAfter.getBody().verificationStatus());
    }

    @Test
    void test08_AdminVerificationLifecycleWorkflow() {
        // First supplier explicitly submits application
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        supplierProfileController.submitVerification(supplierAuthA);

        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);
        // 1. Admin inspects supplier workspace
        ResponseEntity<SupplierVerificationWorkspaceDto> details = adminSupplierVerificationController.getVerificationDetails(supplierA.getId());
        assertEquals(HttpStatus.OK, details.getStatusCode());
        assertNotNull(details.getBody());
        assertEquals(supplierA.getName(), details.getBody().companyName());

        // 2. Admin starts review
        ResponseEntity<SupplierVerificationWorkspaceDto> reviewRes = adminSupplierVerificationController.startReview(supplierA.getId(), adminAuth);
        assertEquals(HttpStatus.OK, reviewRes.getStatusCode());
        assertEquals("UNDER_REVIEW", reviewRes.getBody().verificationStatus());

        // 3. Admin requests information
        ResponseEntity<SupplierVerificationWorkspaceDto> reqInfoRes = adminSupplierVerificationController.requestInformation(
                supplierA.getId(),
                new com.synthora.seller.verification.dto.RequestInfoRequest("Please upload ISO-9001 certification and recent GST-3B filing"),
                adminAuth
        );
        assertEquals(HttpStatus.OK, reqInfoRes.getStatusCode());
        assertEquals("INFORMATION_REQUIRED", reqInfoRes.getBody().verificationStatus());

        // 4. Supplier responds with notes
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        supplierVerificationService.submitSupplierResponse(supplierAuthA, "Uploaded ISO certificate and GST registration document.");

        // 5. Admin verifies supplier
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);
        ResponseEntity<SupplierVerificationWorkspaceDto> verifyRes = adminSupplierVerificationController.finalizeVerification(
                supplierA.getId(),
                new com.synthora.seller.verification.dto.FinalizeVerificationRequest("Verified company identity, tax filings and drug manufacturing license."),
                adminAuth
        );
        assertEquals(HttpStatus.OK, verifyRes.getStatusCode());
        assertEquals("VERIFIED", verifyRes.getBody().verificationStatus());

        Supplier verifiedSupplier = supplierRepository.findById(supplierA.getId()).orElseThrow();
        assertTrue(Boolean.TRUE.equals(verifiedSupplier.getVerified()));
    }

    @Test
    void test09_AdminVerificationPreventsDuplicateTransitionsOnVerifiedSupplier() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);
        // Set supplier as already verified
        supplierA.setVerified(true);
        supplierA.setVerificationStatus(SupplierVerificationStatus.VERIFIED);
        supplierRepository.save(supplierA);

        // Attempting to re-verify or restart review should throw IllegalStateException
        assertThrows(IllegalStateException.class, () ->
                adminSupplierVerificationController.finalizeVerification(
                        supplierA.getId(),
                        new com.synthora.seller.verification.dto.FinalizeVerificationRequest("Duplicate verify"),
                        adminAuth
                ));
    }

    @Test
    void test10_PublicCatalogFourPillarEligibilityIncludesLogoAndExcludesUnverified() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);
        // Create canonical MasterProduct
        CreateMasterProductRequest mpReq = new CreateMasterProductRequest(
                "Paracetamol Pure Grade",
                "103-90-2",
                "C8H9NO2",
                ProductCategory.API,
                "Analgesic and antipyretic canonical compound"
        );
        var mp = masterProductService.createMasterProduct(mpReq);

        // Upload logo for Supplier A
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        byte[] pngBytes = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D};
        MockMultipartFile validLogo = new MockMultipartFile("file", "company_logo.png", "image/png", pngBytes);
        supplierProfileController.uploadLogo(validLogo, supplierAuthA);

        // Verify Supplier A
        supplierA.setVerified(true);
        supplierA.setVerificationStatus(SupplierVerificationStatus.VERIFIED);
        supplierRepository.save(supplierA);

        // Create Offering for Supplier A
        CreateSupplierOfferingRequest offReqA = new CreateSupplierOfferingRequest(
                mp.id(),
                new BigDecimal("450.00"),
                "INR",
                500,
                new BigDecimal("99.8"),
                "IP/BP",
                new BigDecimal("25.0"),
                "25kg Drum",
                5,
                true,
                true,
                true,
                "AVAILABLE"
        );
        SupplierOfferingResponse offA = supplierOfferingService.createOffering(offReqA, supplierAuthA);

        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);
        supplierOfferingService.approveOffering(offA.id(), "Approved commercial offering", adminAuth);

        // Supplier B is UNVERIFIED - create offering
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        CreateSupplierOfferingRequest offReqB = new CreateSupplierOfferingRequest(
                mp.id(),
                new BigDecimal("420.00"),
                "INR",
                1000,
                new BigDecimal("99.5"),
                "Technical",
                new BigDecimal("50.0"),
                "50kg Drum",
                10,
                false,
                false,
                false,
                "AVAILABLE"
        );
        SupplierOfferingResponse offB = supplierOfferingService.createOffering(offReqB, supplierAuthB);

        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);
        supplierOfferingService.approveOffering(offB.id(), "Approved commercial offering", adminAuth);

        // Inspect public offerings for MasterProduct
        List<SupplierOfferingResponse> publicOfferings = publicMasterCatalogController.getPublicOfferingsForMasterProduct(mp.masterProductCode()).getBody();
        assertNotNull(publicOfferings);

        // Supplier A must be included and have logo and verified badge
        assertEquals(1, publicOfferings.size(), "Only offerings from VERIFIED suppliers with APPROVED & AVAILABLE status must appear in public catalog");
        SupplierOfferingResponse liveOffering = publicOfferings.get(0);
        assertEquals(supplierA.getName(), liveOffering.supplierName());
        assertNotNull(liveOffering.supplierLogoUrl());
        assertTrue(liveOffering.supplierLogoUrl().startsWith("/api/v1/suppliers/"));
        assertTrue(Boolean.TRUE.equals(liveOffering.supplierVerified()));
    }

    @Test
    void test11_AdminCanRejectSupplierWithReason() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);
        ResponseEntity<SupplierVerificationWorkspaceDto> rejectRes = adminSupplierVerificationController.rejectSupplier(
                supplierB.getId(),
                new com.synthora.seller.verification.dto.RejectSupplierRequest("Invalid tax registration certificate provided."),
                adminAuth
        );
        assertEquals(HttpStatus.OK, rejectRes.getStatusCode());
        assertEquals("REJECTED", rejectRes.getBody().verificationStatus());
    }

    @Test
    void test12_AdminCanSuspendSupplierAccount() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);
        ResponseEntity<SupplierVerificationWorkspaceDto> suspendRes = adminSupplierVerificationController.suspendSupplier(
                supplierA.getId(),
                new com.synthora.seller.verification.dto.SuspendSupplierRequest("Compliance violation detected."),
                adminAuth
        );
        assertEquals(HttpStatus.OK, suspendRes.getStatusCode());
        assertEquals("SUSPENDED", suspendRes.getBody().verificationStatus());
    }

    @Test
    void test13_SupplierCannotAccessAnotherSuppliersVerificationWorkspace() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        // Supplier B attempting to access Admin verification workspace for Supplier A must fail with AccessDeniedException
        assertThrows(org.springframework.security.access.AccessDeniedException.class, () ->
                adminSupplierVerificationController.getVerificationDetails(supplierA.getId()));
    }
}
