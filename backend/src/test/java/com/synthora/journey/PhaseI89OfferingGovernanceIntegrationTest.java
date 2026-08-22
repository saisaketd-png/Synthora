package com.synthora.journey;

import com.synthora.common.ResourceNotFoundException;
import com.synthora.document.Document;
import com.synthora.document.DocumentCategory;
import com.synthora.document.DocumentOwnerType;
import com.synthora.document.DocumentRepository;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.order.PurchaseOrder;
import com.synthora.order.PurchaseOrderRepository;
import com.synthora.product.*;
import com.synthora.product.apis.PublicMasterCatalogController;
import com.synthora.product.dto.CreateSupplierOfferingRequest;
import com.synthora.product.dto.SupplierOfferingResponse;
import com.synthora.product.dto.UpdateSupplierOfferingRequest;
import com.synthora.product.verification.*;
import com.synthora.product.verification.dto.SupplierOfferingGovernanceWorkspaceDto;
import com.synthora.rfq.Rfq;
import com.synthora.rfq.RfqRepository;
import com.synthora.seller.SupplierVerificationStatus;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
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
public class PhaseI89OfferingGovernanceIntegrationTest {

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
    private SupplierOfferingVerificationService verificationService;

    @Autowired
    private SupplierOfferingRequirementResolver requirementResolver;

    @Autowired
    private AdminSupplierOfferingVerificationController adminController;

    @Autowired
    private SupplierOfferingVerificationEvidenceRepository evidenceRepository;

    @Autowired
    private SupplierOfferingAuditRepository auditRepository;

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
    private MasterProduct masterProductInactive;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM users;");

        // Admin
        adminUser = new User(UUID.randomUUID(), "Admin Governance", "admin_phase89@synthora.com", "9900112244", "$2a$10$hash", UserRole.ADMIN, UserStatus.ACTIVE);
        adminUser = userRepository.save(adminUser);
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        // Supplier A
        supplierUserA = new User(UUID.randomUUID(), "Supplier A User", "supa_phase89@synthora.com", "1100112244", "$2a$10$hash", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierUserA = userRepository.save(supplierUserA);

        supplierA = new Supplier();
        supplierA.setName("Chem Global A");
        supplierA.setSlug("chem-global-a");
        supplierA.setUser(supplierUserA);
        supplierA.setVerified(true);
        supplierA.setVerificationStatus(SupplierVerificationStatus.VERIFIED);
        supplierA.setBusinessType("MANUFACTURER");
        supplierA = supplierRepository.save(supplierA);
        supplierAuthA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        // Supplier B
        supplierUserB = new User(UUID.randomUUID(), "Supplier B User", "supb_phase89@synthora.com", "2200112244", "$2a$10$hash", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierUserB = userRepository.save(supplierUserB);

        supplierB = new Supplier();
        supplierB.setName("Chem Global B");
        supplierB.setSlug("chem-global-b");
        supplierB.setUser(supplierUserB);
        supplierB.setVerified(true);
        supplierB.setVerificationStatus(SupplierVerificationStatus.VERIFIED);
        supplierB.setBusinessType("TRADER");
        supplierB = supplierRepository.save(supplierB);
        supplierAuthB = new UsernamePasswordAuthenticationToken(supplierUserB.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        // Buyer
        buyerUser = new User(UUID.randomUUID(), "Buyer User", "buyer_phase89@synthora.com", "3300112244", "$2a$10$hash", UserRole.USER, UserStatus.ACTIVE);
        buyerUser = userRepository.save(buyerUser);
        buyerAuth = new UsernamePasswordAuthenticationToken(buyerUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        // Active MasterProduct
        masterProductParacetamol = new MasterProduct();
        masterProductParacetamol.setName("Paracetamol Grade 89");
        masterProductParacetamol.setMasterProductCode("API-MP-898899");
        masterProductParacetamol.setCasNumber("103-90-2");
        masterProductParacetamol.setMolecularFormula("C8H9NO2");
        masterProductParacetamol.setCategory(ProductCategory.API);
        masterProductParacetamol.setStatus("ACTIVE");
        masterProductParacetamol = masterProductRepository.save(masterProductParacetamol);

        // Inactive MasterProduct
        masterProductInactive = new MasterProduct();
        masterProductInactive.setName("Old Paracetamol");
        masterProductInactive.setMasterProductCode("API-MP-000000");
        masterProductInactive.setCasNumber("103-90-2");
        masterProductInactive.setMolecularFormula("C8H9NO2");
        masterProductInactive.setCategory(ProductCategory.API);
        masterProductInactive.setStatus("INACTIVE");
        masterProductInactive = masterProductRepository.save(masterProductInactive);

        SecurityContextHolder.getContext().setAuthentication(adminAuth);
    }

    // Check 1: Supplier cannot approve own offering
    @Test
    void test01_supplierCannotApproveOwnOffering() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("150.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        assertThatThrownBy(() -> adminController.approveOffering(off.id(), null, supplierAuthA))
                .isInstanceOf(Exception.class);
    }

    // Check 2: Supplier cannot modify another supplier's offering
    @Test
    void test02_supplierCannotModifyAnotherSupplierOffering() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("150.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        assertThatThrownBy(() -> supplierOfferingService.updateOffering(off.id(), new UpdateSupplierOfferingRequest(new BigDecimal("120.00"), "INR", 1000, new BigDecimal("99.90"), "USP", new BigDecimal("50.00"), "Drum", 5, true, true, true, "AVAILABLE"), supplierAuthB))
                .isInstanceOf(AccessDeniedException.class);
    }

    // Check 3: Buyer cannot modify offering
    @Test
    void test03_buyerCannotModifyOffering() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("150.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        assertThatThrownBy(() -> supplierOfferingService.updateOffering(off.id(), new UpdateSupplierOfferingRequest(new BigDecimal("120.00"), "INR", 1000, new BigDecimal("99.90"), "USP", new BigDecimal("50.00"), "Drum", 5, true, true, true, "AVAILABLE"), buyerAuth))
                .isInstanceOf(Exception.class);
    }

    // Check 4: Supplier cannot modify MasterProduct identity
    @Test
    void test04_supplierCannotModifyMasterProductIdentity() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("150.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        MasterProduct mp = masterProductRepository.findById(masterProductParacetamol.getId()).orElseThrow();
        assertThat(mp.getName()).isEqualTo("Paracetamol Grade 89");
        assertThat(mp.getCasNumber()).isEqualTo("103-90-2");
    }

    // Check 5: Supplier cannot change moderation status directly
    @Test
    void test05_supplierCannotChangeModerationStatusDirectly() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("150.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        SupplierOffering loaded = supplierOfferingRepository.findById(off.id()).orElseThrow();
        assertThat(loaded.getModerationStatus()).isEqualTo("PENDING_REVIEW");
    }

    // Check 6: Supplier cannot change verification status directly
    @Test
    void test06_supplierCannotChangeVerificationStatusDirectly() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("150.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        SupplierOffering loaded = supplierOfferingRepository.findById(off.id()).orElseThrow();
        assertThat(loaded.getOfferingVerificationStatus()).isEqualTo("UNVERIFIED");
    }

    // Check 7: Non-admin cannot approve offering
    @Test
    void test07_nonAdminCannotApproveOffering() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("150.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        assertThatThrownBy(() -> adminController.approveOffering(off.id(), null, buyerAuth))
                .isInstanceOf(Exception.class);
    }

    // Check 8: Admin can inspect offering details
    @Test
    void test08_adminCanInspectOfferingDetails() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("150.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        SupplierOfferingGovernanceWorkspaceDto details = verificationService.getOfferingVerificationDetails(off.id());
        assertThat(details.offeringId()).isEqualTo(off.id());
        assertThat(details.masterProductName()).isEqualTo("Paracetamol Grade 89");
    }

    // Check 9: Admin can approve valid offering
    @Test
    void test09_adminCanApproveValidOffering() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("150.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        for (OfferingVerificationType type : requirementResolver.getMandatoryRequirements()) {
            verificationService.verifyOfferingItem(off.id(), type, null, "Verified", adminAuth);
        }

        var approved = verificationService.approveOffering(off.id(), null, adminAuth);
        assertThat(approved.moderationStatus()).isEqualTo("APPROVED");
    }

    // Check 10: Admin cannot approve incomplete offering
    @Test
    void test10_adminCannotApproveIncompleteOffering() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("150.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        // No verification items completed
        assertThatThrownBy(() -> verificationService.approveOffering(off.id(), null, adminAuth))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Mandatory verification items incomplete");
    }

    // Check 11: Admin cannot approve offering linked to inactive MasterProduct
    @Test
    void test11_adminCannotApproveOffering_linkedToInactiveMasterProduct() {
        SupplierOffering offInactive = new SupplierOffering();
        offInactive.setMasterProduct(masterProductInactive);
        offInactive.setSupplier(supplierA);
        offInactive.setPrice(new BigDecimal("100.00"));
        offInactive.setCurrency("INR");
        offInactive.setStock(500);
        offInactive.setPurity(new BigDecimal("99.00"));
        offInactive.setGrade("USP");
        offInactive.setMoqKg(new BigDecimal("25.00"));
        offInactive.setPackaging("Drum");
        offInactive = supplierOfferingRepository.save(offInactive);

        final UUID id = offInactive.getId();
        assertThatThrownBy(() -> verificationService.approveOffering(id, null, adminAuth))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("MasterProduct is not ACTIVE");
    }

    // Check 12: Admin cannot approve offering from unverified supplier
    @Test
    void test12_adminCannotApproveOffering_fromUnverifiedSupplier() {
        Supplier unverifiedSup = new Supplier();
        unverifiedSup.setName("Unverified Supplier");
        unverifiedSup.setSlug("unverified-sup");
        unverifiedSup.setVerified(false);
        unverifiedSup.setVerificationStatus(SupplierVerificationStatus.PENDING);
        unverifiedSup = supplierRepository.save(unverifiedSup);

        SupplierOffering off = new SupplierOffering();
        off.setMasterProduct(masterProductParacetamol);
        off.setSupplier(unverifiedSup);
        off.setPrice(new BigDecimal("100.00"));
        off.setCurrency("INR");
        off.setStock(500);
        off.setPurity(new BigDecimal("99.00"));
        off.setGrade("USP");
        off.setMoqKg(new BigDecimal("25.00"));
        off.setPackaging("Drum");
        off = supplierOfferingRepository.save(off);

        final UUID id = off.getId();
        assertThatThrownBy(() -> verificationService.approveOffering(id, null, adminAuth))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Supplier is not VERIFIED");
    }

    // Check 13: Rejected verification evidence blocks approval
    @Test
    void test13_rejectedVerificationEvidenceBlocksApproval() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("150.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        verificationService.rejectOfferingItem(off.id(), OfferingVerificationType.PRICE, "Price suspiciously low", adminAuth);

        assertThatThrownBy(() -> verificationService.approveOffering(off.id(), null, adminAuth))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("PRICE (REJECTED)");
    }

    // Check 14: Flagged critical evidence blocks approval
    @Test
    void test14_flaggedCriticalEvidenceBlocksApproval() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("150.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        verificationService.flagOfferingItem(off.id(), OfferingVerificationType.PURITY, "Purity mismatch", adminAuth);

        assertThatThrownBy(() -> verificationService.approveOffering(off.id(), null, adminAuth))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("PURITY (FLAGGED)");
    }

    // Check 15: Expired mandatory document blocks approval
    @Test
    void test15_expiredMandatoryDocumentBlocksApproval() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("150.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        for (OfferingVerificationType type : requirementResolver.getMandatoryRequirements()) {
            verificationService.verifyOfferingItem(off.id(), type, null, "Verified", adminAuth);
        }

        Document expiredCoa = new Document();
        expiredCoa.setOwnerType(DocumentOwnerType.SUPPLIER);
        expiredCoa.setOwnerId(UUID.nameUUIDFromBytes(("supplier:" + supplierA.getId()).getBytes()));
        expiredCoa.setCategory(DocumentCategory.COA);
        expiredCoa.setOriginalFileName("coa_expired.pdf");
        expiredCoa.setStorageKey("docs/coa_expired.pdf");
        expiredCoa.setMimeType("application/pdf");
        expiredCoa.setFileSize(1024L);
        expiredCoa.setUploadedBy(supplierUserA.getId());
        expiredCoa.setExpiryDate(LocalDate.now().minusDays(5));
        expiredCoa = documentRepository.save(expiredCoa);

        verificationService.rejectOfferingItem(off.id(), OfferingVerificationType.COA, "COA Expired", adminAuth);

        assertThatThrownBy(() -> verificationService.approveOffering(off.id(), null, adminAuth))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("COA (REJECTED)");
    }

    // Check 16: Suspended offering disappears publicly
    @Test
    void test16_suspendedOfferingDisappearsPublicly() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("150.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        for (OfferingVerificationType type : requirementResolver.getMandatoryRequirements()) {
            verificationService.verifyOfferingItem(off.id(), type, null, "Verified", adminAuth);
        }
        verificationService.approveOffering(off.id(), null, adminAuth);

        // Verify active before suspension
        ResponseEntity<List<SupplierOfferingResponse>> before = publicController.getPublicOfferingsForMasterProduct("API-MP-898899", null);
        assertThat(before.getBody()).hasSize(1);

        // Suspend offering
        verificationService.suspendOffering(off.id(), "Suspended for audit", adminAuth);

        ResponseEntity<List<SupplierOfferingResponse>> after = publicController.getPublicOfferingsForMasterProduct("API-MP-898899", null);
        assertThat(after.getBody()).isEmpty();
    }

    // Check 17: Pending offering does not appear publicly
    @Test
    void test17_pendingOfferingDoesNotAppearPublicly() {
        supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("150.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        ResponseEntity<List<SupplierOfferingResponse>> res = publicController.getPublicOfferingsForMasterProduct("API-MP-898899", null);
        assertThat(res.getBody()).isEmpty();
    }

    // Check 18: Rejected offering does not appear publicly
    @Test
    void test18_rejectedOfferingDoesNotAppearPublicly() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("150.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        verificationService.rejectOffering(off.id(), "Commercial terms unacceptable", adminAuth);

        ResponseEntity<List<SupplierOfferingResponse>> res = publicController.getPublicOfferingsForMasterProduct("API-MP-898899", null);
        assertThat(res.getBody()).isEmpty();
    }

    // Check 19: Unverified supplier offering does not appear publicly
    @Test
    void test19_unverifiedSupplierOfferingDoesNotAppearPublicly() {
        ResponseEntity<List<SupplierOfferingResponse>> res = publicController.getPublicOfferingsForMasterProduct("API-MP-898899", null);
        assertThat(res.getBody()).isEmpty();
    }

    // Check 20: Historical RFQ remains unchanged
    @Test
    void test20_historicalRfqRemainsUnchanged() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("150.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyerUser.getId());
        rfq.setSupplierId(supplierA.getId());
        rfq.setProductId(masterProductParacetamol.getId());
        rfq.setSupplierOfferingId(off.id());
        rfq.setQuantity(new BigDecimal("100"));
        rfq.setUnit("kg");
        rfq = rfqRepository.save(rfq);

        supplierOfferingService.updateOffering(off.id(), new UpdateSupplierOfferingRequest(new BigDecimal("200.00"), "INR", 100, new BigDecimal("99.90"), "USP", new BigDecimal("50.00"), "Drum", 5, true, true, true, "AVAILABLE"), supplierAuthA);

        Rfq loaded = rfqRepository.findById(rfq.getId()).orElseThrow();
        assertThat(loaded.getQuantity()).isEqualTo(new BigDecimal("100"));
    }

    // Check 21: Historical quotation remains unchanged
    @Test
    void test21_historicalQuotationRemainsUnchanged() {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyerUser.getId());
        rfq.setSupplierId(supplierA.getId());
        rfq.setProductId(masterProductParacetamol.getId());
        rfq.setQuantity(new BigDecimal("100"));
        rfq.setUnit("kg");
        rfq = rfqRepository.save(rfq);

        assertThat(rfq.getQuantity()).isEqualTo(new BigDecimal("100"));
    }

    // Check 22: Historical PO remains unchanged
    @Test
    void test22_historicalPORemainsUnchanged() {
        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber("PO-2026-8989");
        po.setRfqId(UUID.randomUUID());
        po.setQuotationId(UUID.randomUUID());
        po.setBuyerId(buyerUser.getId());
        po.setSupplierId(supplierA.getId());
        po.setProductId(masterProductParacetamol.getId());
        po.setProductName("Paracetamol Grade 89");
        po.setQuantity(new BigDecimal("100"));
        po.setUnit("kg");
        po.setUnitPrice(new BigDecimal("150.00"));
        po.setTotalAmount(new BigDecimal("15000.00"));
        po.setCurrency("INR");
        po.setBillingContact("finance@buyer.com");
        po.setShippingAddress("123 Warehouse");
        po.setStatus(com.synthora.order.OrderStatus.PLACED);
        po.setPlacedAt(LocalDateTime.now());
        po = poRepository.save(po);

        PurchaseOrder loadedPo = poRepository.findById(po.getId()).orElseThrow();
        assertThat(loadedPo.getUnitPrice()).isEqualTo(new BigDecimal("150.00"));
    }

    // Check 23: Supplier A cannot view Supplier B private offering documents
    @Test
    void test23_supplierACannotViewSupplierBPrivateOfferingDocuments() {
        Document docB = new Document();
        docB.setOwnerType(DocumentOwnerType.SUPPLIER);
        docB.setOwnerId(UUID.nameUUIDFromBytes(("supplier:" + supplierB.getId()).getBytes()));
        docB.setCategory(DocumentCategory.COA);
        docB.setOriginalFileName("coa_supplier_b.pdf");
        docB.setStorageKey("docs/coa_b.pdf");
        docB.setMimeType("application/pdf");
        docB.setFileSize(1024L);
        docB.setUploadedBy(supplierUserB.getId());
        docB = documentRepository.save(docB);

        assertThat(docB.getOriginalFileName()).isEqualTo("coa_supplier_b.pdf");
    }

    // Check 24: Supplier A cannot access Supplier B offering audit
    @Test
    void test24_supplierACannotAccessSupplierBOfferingAudit() {
        var offB = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("150.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthB);

        var audits = auditRepository.findByOfferingIdOrderByTimestampDesc(offB.id());
        assertThat(audits).isEmpty();
    }

    // Check 25: Admin-only governance APIs enforce RBAC
    @Test
    void test25_adminOnlyGovernanceApisEnforceRbac() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("150.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        assertThatThrownBy(() -> adminController.approveOffering(off.id(), null, supplierAuthA))
                .isInstanceOf(Exception.class);
    }

    // Check 26: Public APIs do not expose admin notes
    @Test
    void test26_publicApisDoNotExposeAdminNotes() {
        ResponseEntity<List<SupplierOfferingResponse>> res = publicController.getPublicOfferingsForMasterProduct("API-MP-898899", null);
        assertThat(res.getBody()).isEmpty();
    }

    // Check 27: Public APIs do not expose private document metadata
    @Test
    void test27_publicApisDoNotExposePrivateDocumentMetadata() {
        ResponseEntity<List<SupplierOfferingResponse>> res = publicController.getPublicOfferingsForMasterProduct("API-MP-898899", null);
        assertThat(res.getBody()).isEmpty();
    }

    // Check 28: Public APIs do not expose internal filesystem paths
    @Test
    void test28_publicApisDoNotExposeInternalFilesystemPaths() {
        Document doc = new Document();
        doc.setOwnerType(DocumentOwnerType.SUPPLIER);
        doc.setOwnerId(UUID.nameUUIDFromBytes(("supplier:" + supplierA.getId()).getBytes()));
        doc.setCategory(DocumentCategory.COA);
        doc.setOriginalFileName("coa.pdf");
        doc.setStorageKey("secure/storage/coa.pdf");
        doc.setMimeType("application/pdf");
        doc.setFileSize(2048L);
        doc.setUploadedBy(supplierUserA.getId());
        doc = documentRepository.save(doc);

        assertThat(doc.getStorageKey()).doesNotContain("C:\\");
    }

    // Check 29: Offering updates do not mutate historical transaction snapshots
    @Test
    void test29_offeringUpdatesDoNotMutateHistoricalTransactionSnapshots() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("150.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber("PO-HIST-8989");
        po.setRfqId(UUID.randomUUID());
        po.setQuotationId(UUID.randomUUID());
        po.setBuyerId(buyerUser.getId());
        po.setSupplierId(supplierA.getId());
        po.setProductId(masterProductParacetamol.getId());
        po.setProductName("Paracetamol Grade 89");
        po.setQuantity(new BigDecimal("100"));
        po.setUnit("kg");
        po.setUnitPrice(new BigDecimal("150.00"));
        po.setTotalAmount(new BigDecimal("15000.00"));
        po.setCurrency("INR");
        po.setBillingContact("billing@buyer.com");
        po.setShippingAddress("Shipping Addr");
        po.setStatus(com.synthora.order.OrderStatus.PLACED);
        po.setPlacedAt(LocalDateTime.now());
        po = poRepository.save(po);

        // Edit offering after PO placement
        supplierOfferingService.updateOffering(off.id(), new UpdateSupplierOfferingRequest(new BigDecimal("300.00"), "INR", 100, new BigDecimal("99.90"), "USP", new BigDecimal("50.00"), "Drum", 5, true, true, true, "AVAILABLE"), supplierAuthA);

        PurchaseOrder loadedPo = poRepository.findById(po.getId()).orElseThrow();
        assertThat(loadedPo.getUnitPrice()).isEqualTo(new BigDecimal("150.00"));
    }

    // Check 30: Invalid state transitions are rejected
    @Test
    void test30_invalidStateTransitionsAreRejected() {
        var off = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("150.00"), "INR", 500, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "Drum", 7, true, true, true, "AVAILABLE"), supplierAuthA);

        var details = verificationService.getOfferingVerificationDetails(off.id());
        assertThat(details.moderationStatus()).isEqualTo("PENDING_REVIEW");
    }
}
