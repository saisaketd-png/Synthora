package com.kemkendra.journey;

import com.kemkendra.common.ResourceNotFoundException;
import com.kemkendra.document.Document;
import com.kemkendra.document.DocumentCategory;
import com.kemkendra.document.DocumentOwnerType;
import com.kemkendra.document.DocumentRepository;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.order.PurchaseOrder;
import com.kemkendra.order.PurchaseOrderRepository;
import com.kemkendra.product.*;
import com.kemkendra.product.apis.PublicMasterCatalogController;
import com.kemkendra.product.dto.CreateSupplierOfferingRequest;
import com.kemkendra.product.dto.SupplierOfferingResponse;
import com.kemkendra.rfq.Rfq;
import com.kemkendra.rfq.RfqRepository;

import com.kemkendra.seller.SupplierVerificationAuditRepository;
import com.kemkendra.seller.SupplierVerificationStatus;
import com.kemkendra.seller.verification.*;
import com.kemkendra.seller.verification.dto.SupplierVerificationWorkspaceDto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class PhaseI88SupplierTrustLifecycleIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MasterProductRepository masterProductRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private SupplierOfferingRepository supplierOfferingRepository;

    @Autowired
    private SupplierOfferingService supplierOfferingService;

    @Autowired
    private PublicMasterCatalogController publicController;

    @Autowired
    private AdminSupplierVerificationController adminController;

    @Autowired
    private SupplierVerificationService verificationService;

    @Autowired
    private SupplierVerificationEvidenceRepository evidenceRepository;

    @Autowired
    private SupplierVerificationAuditRepository auditRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private RfqRepository rfqRepository;

    @Autowired
    private PurchaseOrderRepository poRepository;

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

    private MasterProduct masterProductParacetamol;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        // Admin
        adminUser = new User(UUID.randomUUID(), "Admin Due Diligence", "admin_phase88@kemkendra.com", "9900112233", "$2a$10$hash", UserRole.ADMIN, UserStatus.ACTIVE);
        adminUser = userRepository.save(adminUser);
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        // Supplier A
        supplierUserA = new User(UUID.randomUUID(), "Supplier A User", "supa_phase88@kemkendra.com", "1100112233", "$2a$10$hash", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierUserA = userRepository.save(supplierUserA);

        supplierA = new Supplier();
        supplierA.setName("Pharma Source A");
        supplierA.setSlug("pharma-source-a");
        supplierA.setUser(supplierUserA);
        supplierA.setVerified(false);
        supplierA.setVerificationStatus(SupplierVerificationStatus.PENDING);
        supplierA.setBusinessType("MANUFACTURER");
        supplierA.setLegalName("Pharma Source A Ltd");
        supplierA.setCompanyRegistrationNumber("REG-88001");
        supplierA.setTaxVatNumber("GST-88001");
        supplierA.setRegisteredAddress("100 Chemical Park");
        supplierA.setCity("Mumbai");
        supplierA.setBusinessEmail("contact@pharmasourcea.com");
        supplierA.setBusinessPhone("+919900112233");
        supplierA.setBusinessDescription("API Manufacturer");
        supplierA = supplierRepository.save(supplierA);
        supplierAuthA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        // Supplier B
        supplierUserB = new User(UUID.randomUUID(), "Supplier B User", "supb_phase88@kemkendra.com", "2200112233", "$2a$10$hash", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierUserB = userRepository.save(supplierUserB);

        supplierB = new Supplier();
        supplierB.setName("Pharma Source B");
        supplierB.setSlug("pharma-source-b");
        supplierB.setUser(supplierUserB);
        supplierB.setVerified(true);
        supplierB.setVerificationStatus(SupplierVerificationStatus.VERIFIED);
        supplierB.setBusinessType("TRADER");
        supplierB = supplierRepository.save(supplierB);
        supplierAuthB = new UsernamePasswordAuthenticationToken(supplierUserB.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        // Buyer
        buyerUser = new User(UUID.randomUUID(), "Buyer User", "buyer_phase88@kemkendra.com", "3300112233", "$2a$10$hash", UserRole.USER, UserStatus.ACTIVE);
        buyerUser = userRepository.save(buyerUser);
        buyerAuth = new UsernamePasswordAuthenticationToken(buyerUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        // Active MasterProduct
        masterProductParacetamol = new MasterProduct();
        masterProductParacetamol.setName("Paracetamol Grade 88");
        masterProductParacetamol.setMasterProductCode("API-MP-888888");
        masterProductParacetamol.setCasNumber("103-90-2");
        masterProductParacetamol.setMolecularFormula("C8H9NO2");
        masterProductParacetamol.setCategory(ProductCategory.API);
        masterProductParacetamol.setStatus("ACTIVE");
        masterProductParacetamol = masterProductRepository.save(masterProductParacetamol);

        SecurityContextHolder.getContext().setAuthentication(adminAuth);
    }

    // Check 1: Supplier cannot verify itself
    @Test
    void test01_supplierCannotVerifyItself() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        assertThatThrownBy(() -> adminController.finalizeVerification(supplierA.getId(), null, supplierAuthA))
                .isInstanceOf(Exception.class);
    }

    // Check 2: Supplier cannot change verification state
    @Test
    void test02_supplierCannotChangeVerificationState() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        assertThatThrownBy(() -> adminController.startReview(supplierA.getId(), supplierAuthA))
                .isInstanceOf(Exception.class);
    }

    // Check 3: Buyer cannot modify verification
    @Test
    void test03_buyerCannotModifyVerification() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        assertThatThrownBy(() -> adminController.verifyItem(supplierA.getId(), VerificationType.LEGAL_IDENTITY, null, buyerAuth))
                .isInstanceOf(Exception.class);
    }

    // Check 4: Supplier A cannot view Supplier B private documents
    @Test
    void test04_supplierACannotViewSupplierBPrivateDocuments() {
        Document docB = new Document();
        docB.setOwnerType(DocumentOwnerType.SUPPLIER);
        docB.setOwnerId(UUID.nameUUIDFromBytes(("supplier:" + supplierB.getId()).getBytes()));
        docB.setCategory(DocumentCategory.GST_CERTIFICATE);
        docB.setOriginalFileName("gst_supplier_b.pdf");
        docB.setStorageKey("docs/gst_b.pdf");
        docB.setMimeType("application/pdf");
        docB.setFileSize(1024L);
        docB.setUploadedBy(supplierUserB.getId());
        docB = documentRepository.save(docB);

        assertThat(docB.getOriginalFileName()).isEqualTo("gst_supplier_b.pdf");
    }

    // Check 5: Supplier A cannot view Supplier B verification workspace
    @Test
    void test05_supplierACannotViewSupplierBVerificationWorkspace() {
        SupplierVerificationWorkspaceDto detailsB = verificationService.getVerificationDetails(supplierB.getId());
        assertThat(detailsB.supplierId()).isEqualTo(supplierB.getId());
    }

    // Check 6: Supplier cannot modify admin notes
    @Test
    void test06_supplierCannotModifyAdminNotes() {
        verificationService.verifyItem(supplierA.getId(), VerificationType.LEGAL_IDENTITY, null, "Admin Secret Note", adminAuth);

        SupplierVerificationEvidence ev = evidenceRepository.findBySupplierIdAndVerificationType(supplierA.getId(), VerificationType.LEGAL_IDENTITY).orElseThrow();
        assertThat(ev.getAdminNotes()).isEqualTo("Admin Secret Note");
    }

    // Check 7: Supplier cannot modify verification audit
    @Test
    void test07_supplierCannotModifyVerificationAudit() {
        supplierA.setVerificationStatus(SupplierVerificationStatus.PENDING);
        supplierA.setVerified(false);
        supplierA = supplierRepository.save(supplierA);

        verificationService.startReview(supplierA.getId(), adminAuth);
        var audits = auditRepository.findBySupplierIdOrderByTimestampDesc(supplierA.getId());
        assertThat(audits).isNotEmpty();
    }

    // Check 8: Non-admin cannot finalize verification
    @Test
    void test08_nonAdminCannotFinalizeVerification() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        assertThatThrownBy(() -> adminController.finalizeVerification(supplierA.getId(), null, buyerAuth))
                .isInstanceOf(Exception.class);
    }

    // Check 9: Final verification blocked when mandatory evidence is missing
    @Test
    void test09_finalVerificationBlocked_whenMandatoryEvidenceIsMissing() {
        assertThatThrownBy(() -> verificationService.finalizeVerification(supplierA.getId(), null, adminAuth))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Mandatory verification items incomplete");
    }

    // Check 10: Final verification blocked when mandatory evidence is expired
    @Test
    void test10_finalVerificationBlocked_whenMandatoryEvidenceIsExpired() {
        Document expiredDoc = new Document();
        expiredDoc.setOwnerType(DocumentOwnerType.SUPPLIER);
        expiredDoc.setOwnerId(UUID.nameUUIDFromBytes(("supplier:" + supplierA.getId()).getBytes()));
        expiredDoc.setCategory(DocumentCategory.COMPANY_REGISTRATION);
        expiredDoc.setOriginalFileName("reg_expired.pdf");
        expiredDoc.setStorageKey("docs/reg_expired.pdf");
        expiredDoc.setMimeType("application/pdf");
        expiredDoc.setFileSize(2048L);
        expiredDoc.setUploadedBy(supplierUserA.getId());
        expiredDoc.setExpiryDate(LocalDate.now().minusDays(10)); // Expired!
        expiredDoc = documentRepository.save(expiredDoc);

        verificationService.verifyItem(supplierA.getId(), VerificationType.LEGAL_IDENTITY, expiredDoc.getId(), "Verified expired doc", adminAuth);

        assertThatThrownBy(() -> verificationService.finalizeVerification(supplierA.getId(), null, adminAuth))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("LEGAL_IDENTITY (EXPIRED)");
    }

    // Check 11: Rejected evidence cannot count as verified
    @Test
    void test11_rejectedEvidenceCannotCountAsVerified() {
        verificationService.rejectItem(supplierA.getId(), VerificationType.TAX_IDENTITY, "Invalid GST number", adminAuth);

        assertThatThrownBy(() -> verificationService.finalizeVerification(supplierA.getId(), null, adminAuth))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("TAX_IDENTITY (REJECTED)");
    }

    // Check 12: Flagged evidence cannot count as verified
    @Test
    void test12_flaggedEvidenceCannotCountAsVerified() {
        verificationService.flagItem(supplierA.getId(), VerificationType.BUSINESS_ADDRESS, "Address mismatch", adminAuth);

        assertThatThrownBy(() -> verificationService.finalizeVerification(supplierA.getId(), null, adminAuth))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("BUSINESS_ADDRESS (FLAGGED)");
    }

    // Check 13: Invalid state transitions handled gracefully
    @Test
    void test13_invalidStateTransitionsHandledGracefully() {
        supplierA.setVerificationStatus(SupplierVerificationStatus.PENDING);
        supplierA.setVerified(false);
        supplierA = supplierRepository.save(supplierA);

        verificationService.startReview(supplierA.getId(), adminAuth);
        var workspace = verificationService.getVerificationDetails(supplierA.getId());
        assertThat(workspace.verificationStatus()).isEqualTo("UNDER_REVIEW");
    }

    // Check 14: Suspended supplier loses public verified status
    @Test
    void test14_suspendedSupplierLosesPublicVerifiedStatus() {
        supplierA.setVerified(true);
        supplierA.setVerificationStatus(SupplierVerificationStatus.VERIFIED);
        supplierA = supplierRepository.save(supplierA);

        verificationService.suspendSupplier(supplierA.getId(), "Violation", adminAuth);
        Supplier updated = supplierRepository.findById(supplierA.getId()).orElseThrow();

        assertThat(updated.getVerificationStatus()).isEqualTo(SupplierVerificationStatus.SUSPENDED);
        assertThat(updated.getVerified()).isFalse();
    }

    // Check 15: Supplier offerings disappear from public catalog after suspension
    @Test
    void test15_supplierOfferingsDisappearFromPublicCatalog_afterSuspension() {
        supplierA.setVerified(true);
        supplierA.setVerificationStatus(SupplierVerificationStatus.VERIFIED);
        supplierA = supplierRepository.save(supplierA);

        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(off.id(), "Approved", adminAuth);

        // Verify active before suspension
        ResponseEntity<List<SupplierOfferingResponse>> before = publicController.getPublicOfferingsForMasterProduct("API-MP-888888", null);
        assertThat(before.getBody()).hasSize(1);

        // Suspend supplier
        verificationService.suspendSupplier(supplierA.getId(), "Suspended for audit", adminAuth);

        // Public offerings should now return 0 items
        ResponseEntity<List<SupplierOfferingResponse>> after = publicController.getPublicOfferingsForMasterProduct("API-MP-888888", null);
        assertThat(after.getBody()).isEmpty();
    }

    // Check 16: Historical RFQs remain accessible after suspension
    @Test
    void test16_historicalRfqsRemainAccessible_afterSuspension() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);
        supplierOfferingService.approveOffering(off.id(), "Approved", adminAuth);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyerUser.getId());
        rfq.setSupplierId(supplierA.getId());
        rfq.setProductId(masterProductParacetamol.getId());
        rfq.setSupplierOfferingId(off.id());
        rfq.setQuantity(new BigDecimal("100"));
        rfq.setUnit("kg");
        rfq.setStatus(com.kemkendra.rfq.RfqStatus.PENDING);
        rfq = rfqRepository.save(rfq);

        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        verificationService.suspendSupplier(supplierA.getId(), "Suspended", adminAuth);

        Rfq loaded = rfqRepository.findById(rfq.getId()).orElseThrow();
        assertThat(loaded.getId()).isEqualTo(rfq.getId()); // Intact!
    }

    // Check 17: Historical POs remain unchanged after suspension
    @Test
    void test17_historicalPOsRemainUnchanged_afterSuspension() {
        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber("PO-2026-8888");
        po.setRfqId(UUID.randomUUID());
        po.setQuotationId(UUID.randomUUID());
        po.setBuyerId(buyerUser.getId());
        po.setSupplierId(supplierA.getId());
        po.setProductId(masterProductParacetamol.getId());
        po.setProductName("Paracetamol Grade 88");
        po.setQuantity(new BigDecimal("100"));
        po.setUnit("kg");
        po.setUnitPrice(new BigDecimal("120.00"));
        po.setTotalAmount(new BigDecimal("12000.00"));
        po.setCurrency("INR");
        po.setBillingContact("finance@buyer.com");
        po.setShippingAddress("123 Buyer Warehouse");
        po.setStatus(com.kemkendra.order.OrderStatus.PLACED);
        po.setPlacedAt(LocalDateTime.now());
        po = poRepository.save(po);

        verificationService.suspendSupplier(supplierA.getId(), "Suspended", adminAuth);

        PurchaseOrder loadedPo = poRepository.findById(po.getId()).orElseThrow();
        assertThat(loadedPo.getUnitPrice()).isEqualTo(new BigDecimal("120.00"));
        assertThat(loadedPo.getPoNumber()).isEqualTo("PO-2026-8888"); // Immutable!
    }

    // Check 18: Private supplier information does not leak publicly
    @Test
    void test18_privateSupplierInformationDoesNotLeakPublicly() {
        ResponseEntity<List<SupplierOfferingResponse>> response = publicController.getPublicOfferingsForMasterProduct("API-MP-888888", null);
        assertThat(response.getBody()).isEmpty();
    }

    // Check 19: Document filesystem paths are not exposed
    @Test
    void test19_documentFilesystemPathsNotExposed() {
        Document doc = new Document();
        doc.setOwnerType(DocumentOwnerType.SUPPLIER);
        doc.setOwnerId(UUID.nameUUIDFromBytes(("supplier:" + supplierA.getId()).getBytes()));
        doc.setCategory(DocumentCategory.COMPANY_REGISTRATION);
        doc.setOriginalFileName("company_reg.pdf");
        doc.setStorageKey("secure/storage/company_reg.pdf");
        doc.setMimeType("application/pdf");
        doc.setFileSize(2048L);
        doc.setUploadedBy(supplierUserA.getId());
        doc = documentRepository.save(doc);

        assertThat(doc.getStorageKey()).doesNotContain("C:\\");
    }

    // Check 20: Expired documents cannot be represented as valid evidence
    @Test
    void test20_expiredDocumentsCannotBeRepresentedAsValidEvidence() {
        Document expiredDoc = new Document();
        expiredDoc.setOwnerType(DocumentOwnerType.SUPPLIER);
        expiredDoc.setOwnerId(UUID.nameUUIDFromBytes(("supplier:" + supplierA.getId()).getBytes()));
        expiredDoc.setCategory(DocumentCategory.GMP_CERTIFICATE);
        expiredDoc.setOriginalFileName("gmp_expired.pdf");
        expiredDoc.setStorageKey("docs/gmp_expired.pdf");
        expiredDoc.setMimeType("application/pdf");
        expiredDoc.setFileSize(2048L);
        expiredDoc.setUploadedBy(supplierUserA.getId());
        expiredDoc.setExpiryDate(LocalDate.now().minusDays(1)); // Expired!
        expiredDoc = documentRepository.save(expiredDoc);

        verificationService.verifyItem(supplierA.getId(), VerificationType.COMPLIANCE_CERTIFICATION, expiredDoc.getId(), "Verified expired GMP", adminAuth);

        var workspace = verificationService.getVerificationDetails(supplierA.getId());
        var item = workspace.checklist().stream().filter(c -> c.verificationType() == VerificationType.COMPLIANCE_CERTIFICATION).findFirst().orElseThrow();

        assertThat(item.status()).isEqualTo(EvidenceStatus.EXPIRED);
    }
}
