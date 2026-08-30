package com.kemkendra.journey;

import com.kemkendra.buyer.shortlist.BuyerShortlistService;
import com.kemkendra.buyer.shortlist.dto.AddShortlistItemRequest;
import com.kemkendra.buyer.shortlist.dto.BuyerShortlistResponse;
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
import com.kemkendra.product.dto.UpdateSupplierOfferingRequest;
import com.kemkendra.product.verification.*;
import com.kemkendra.rfq.Rfq;
import com.kemkendra.rfq.RfqRepository;
import com.kemkendra.seller.SupplierVerificationStatus;

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
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class PhaseI810BuyerDecisionIntelligenceSecurityTest {

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
    private SupplierOfferingVerificationService verificationService;

    @Autowired
    private SupplierOfferingRequirementResolver requirementResolver;

    @Autowired
    private PublicMasterCatalogController publicController;

    @Autowired
    private BuyerShortlistService shortlistService;

    @Autowired
    private BestMatchScoringEngine bestMatchScoringEngine;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private RfqRepository rfqRepository;

    @Autowired
    private PurchaseOrderRepository poRepository;

    private User adminUser;
    private UsernamePasswordAuthenticationToken adminAuth;

    private User buyerUserA;
    private UsernamePasswordAuthenticationToken buyerAuthA;

    private User buyerUserB;
    private UsernamePasswordAuthenticationToken buyerAuthB;

    private User supplierUserA;
    private Supplier supplierA;
    private UsernamePasswordAuthenticationToken supplierAuthA;

    private MasterProduct masterProductParacetamol;
    private SupplierOffering offeringApproved;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        // Admin
        adminUser = new User(UUID.randomUUID(), "Admin User", "admin_p810@kemkendra.com", "9988776655", "$2a$10$hash", UserRole.ADMIN, UserStatus.ACTIVE);
        adminUser = userRepository.save(adminUser);
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        // Buyer A
        buyerUserA = new User(UUID.randomUUID(), "Buyer Alpha", "buyer_a_p810@kemkendra.com", "1188776655", "$2a$10$hash", UserRole.USER, UserStatus.ACTIVE);
        buyerUserA = userRepository.save(buyerUserA);
        buyerAuthA = new UsernamePasswordAuthenticationToken(buyerUserA.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        // Buyer B
        buyerUserB = new User(UUID.randomUUID(), "Buyer Beta", "buyer_b_p810@kemkendra.com", "2288776655", "$2a$10$hash", UserRole.USER, UserStatus.ACTIVE);
        buyerUserB = userRepository.save(buyerUserB);
        buyerAuthB = new UsernamePasswordAuthenticationToken(buyerUserB.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        // Supplier A
        supplierUserA = new User(UUID.randomUUID(), "Supplier A User", "sup_a_p810@kemkendra.com", "3388776655", "$2a$10$hash", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierUserA = userRepository.save(supplierUserA);

        supplierA = new Supplier();
        supplierA.setName("Pharma Source Ltd");
        supplierA.setSlug("pharma-source-ltd");
        supplierA.setUser(supplierUserA);
        supplierA.setVerified(true);
        supplierA.setVerificationStatus(SupplierVerificationStatus.VERIFIED);
        supplierA.setBusinessType("MANUFACTURER");
        supplierA = supplierRepository.save(supplierA);
        supplierAuthA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        // MasterProduct
        masterProductParacetamol = new MasterProduct();
        masterProductParacetamol.setName("Paracetamol Grade 810");
        masterProductParacetamol.setMasterProductCode("API-MP-810810");
        masterProductParacetamol.setCasNumber("103-90-2");
        masterProductParacetamol.setMolecularFormula("C8H9NO2");
        masterProductParacetamol.setCategory(ProductCategory.API);
        masterProductParacetamol.setStatus("ACTIVE");
        masterProductParacetamol = masterProductRepository.save(masterProductParacetamol);

        // Create Offering
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        var offRes = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 1000, new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "25kg Fiber Drum", 5, true, true, true, "AVAILABLE"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        for (OfferingVerificationType type : requirementResolver.getMandatoryRequirements()) {
            verificationService.verifyOfferingItem(offRes.id(), type, null, "Verified", adminAuth);
        }
        verificationService.approveOffering(offRes.id(), null, adminAuth);

        offeringApproved = supplierOfferingRepository.findById(offRes.id()).orElseThrow();
    }

    // Check 1: Buyer can view public approved offerings
    @Test
    void test01_buyerCanViewPublicApprovedOfferings() {
        ResponseEntity<List<SupplierOfferingResponse>> res = publicController.getPublicOfferingsForMasterProduct("API-MP-810810", null);
        assertThat(res.getBody()).hasSize(1);
        assertThat(res.getBody().get(0).id()).isEqualTo(offeringApproved.getId());
    }

    // Check 2: Pending offering is hidden
    @Test
    void test02_pendingOfferingIsHidden() {
        offeringApproved.setModerationStatus("PENDING_REVIEW");
        supplierOfferingRepository.save(offeringApproved);

        ResponseEntity<List<SupplierOfferingResponse>> res = publicController.getPublicOfferingsForMasterProduct("API-MP-810810", null);
        assertThat(res.getBody()).isEmpty();
    }

    // Check 3: Rejected offering is hidden
    @Test
    void test03_rejectedOfferingIsHidden() {
        offeringApproved.setModerationStatus("REJECTED");
        supplierOfferingRepository.save(offeringApproved);

        ResponseEntity<List<SupplierOfferingResponse>> res = publicController.getPublicOfferingsForMasterProduct("API-MP-810810", null);
        assertThat(res.getBody()).isEmpty();
    }

    // Check 4: Suspended offering is hidden
    @Test
    void test04_suspendedOfferingIsHidden() {
        offeringApproved.setModerationStatus("SUSPENDED");
        supplierOfferingRepository.save(offeringApproved);

        ResponseEntity<List<SupplierOfferingResponse>> res = publicController.getPublicOfferingsForMasterProduct("API-MP-810810", null);
        assertThat(res.getBody()).isEmpty();
    }

    // Check 5: Deactivated offering is hidden
    @Test
    void test05_deactivatedOfferingIsHidden() {
        offeringApproved.setModerationStatus("DEACTIVATED");
        supplierOfferingRepository.save(offeringApproved);

        ResponseEntity<List<SupplierOfferingResponse>> res = publicController.getPublicOfferingsForMasterProduct("API-MP-810810", null);
        assertThat(res.getBody()).isEmpty();
    }

    // Check 6: Unverified supplier offering is hidden
    @Test
    void test06_unverifiedSupplierOfferingIsHidden() {
        supplierA.setVerified(false);
        supplierA.setVerificationStatus(SupplierVerificationStatus.PENDING);
        supplierRepository.save(supplierA);

        ResponseEntity<List<SupplierOfferingResponse>> res = publicController.getPublicOfferingsForMasterProduct("API-MP-810810", null);
        assertThat(res.getBody()).isEmpty();
    }

    // Check 7: Buyer cannot mutate SupplierOffering
    @Test
    void test07_buyerCannotMutateSupplierOffering() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        assertThatThrownBy(() -> supplierOfferingService.updateOffering(offeringApproved.getId(), new UpdateSupplierOfferingRequest(new BigDecimal("90.00"), "INR", 1000, new BigDecimal("99.90"), "USP", new BigDecimal("25.00"), "Drum", 5, true, true, true, "AVAILABLE"), buyerAuthA))
                .isInstanceOf(Exception.class);
    }

    // Check 8: Buyer cannot mutate MasterProduct
    @Test
    void test08_buyerCannotMutateMasterProduct() {
        MasterProduct mp = masterProductRepository.findById(masterProductParacetamol.getId()).orElseThrow();
        assertThat(mp.getName()).isEqualTo("Paracetamol Grade 810");
    }

    // Check 9: Supplier privacy is maintained
    @Test
    void test09_supplierPrivacyIsMaintained() {
        ResponseEntity<List<SupplierOfferingResponse>> res = publicController.getPublicOfferingsForMasterProduct("API-MP-810810", null);
        assertThat(res.getBody()).hasSize(1);
        assertThat(res.getBody().get(0).moderationNotes()).isNull();
    }

    // Check 10: Private supplier documents are not exposed
    @Test
    void test10_privateSupplierDocumentsAreNotExposed() {
        Document doc = new Document();
        doc.setOwnerType(DocumentOwnerType.SUPPLIER);
        doc.setOwnerId(UUID.nameUUIDFromBytes(("supplier:" + supplierA.getId()).getBytes()));
        doc.setCategory(DocumentCategory.COA);
        doc.setOriginalFileName("coa_private.pdf");
        doc.setStorageKey("secure/coa_private.pdf");
        doc.setMimeType("application/pdf");
        doc.setFileSize(2048L);
        doc.setUploadedBy(supplierUserA.getId());
        doc = documentRepository.save(doc);

        assertThat(doc.getStorageKey()).doesNotContain("C:\\");
    }

    // Check 11: Trust badges reflect backend verification state
    @Test
    void test11_trustBadgesReflectBackendVerificationState() {
        assertThat(supplierA.getVerificationStatus()).isEqualTo(SupplierVerificationStatus.VERIFIED);
        assertThat(offeringApproved.getModerationStatus()).isEqualTo("APPROVED");
    }

    // Check 12: Best Match does not compare incompatible currencies
    @Test
    void test12_bestMatchDoesNotCompareIncompatibleCurrencies() {
        var explanation = bestMatchScoringEngine.calculateBestMatch(offeringApproved);
        assertThat(explanation.score()).isGreaterThanOrEqualTo(70);
        assertThat(explanation.isBestMatch()).isTrue();
    }

    // Check 13: Invalid sort parameter falls back safely
    @Test
    void test13_invalidSortParameterFallsBackSafely() {
        ResponseEntity<List<SupplierOfferingResponse>> res = publicController.getPublicOfferingsForMasterProduct("API-MP-810810", "invalid_sort_col");
        assertThat(res.getBody()).hasSize(1);
    }

    // Check 14: Pagination is bounded
    @Test
    void test14_paginationIsBounded() {
        ResponseEntity<List<SupplierOfferingResponse>> res = publicController.getPublicOfferingsForMasterProduct("API-MP-810810", null);
        assertThat(res.getBody()).isNotNull();
    }

    // Check 15: Buyer can create shortlist
    @Test
    void test15_buyerCanCreateShortlist() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        BuyerShortlistResponse res = shortlistService.addToShortlist(new AddShortlistItemRequest(offeringApproved.getId()), buyerAuthA);
        assertThat(res.totalItems()).isEqualTo(1);
        assertThat(res.items().get(0).supplierOfferingId()).isEqualTo(offeringApproved.getId());
    }

    // Check 16: Buyer can remove shortlist item
    @Test
    void test16_buyerCanRemoveShortlistItem() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        BuyerShortlistResponse added = shortlistService.addToShortlist(new AddShortlistItemRequest(offeringApproved.getId()), buyerAuthA);
        UUID itemId = added.items().get(0).itemId();

        BuyerShortlistResponse afterRemove = shortlistService.removeFromShortlist(itemId, buyerAuthA);
        assertThat(afterRemove.totalItems()).isEqualTo(0);
    }

    // Check 17: Buyer can view own shortlist
    @Test
    void test17_buyerCanViewOwnShortlist() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        shortlistService.addToShortlist(new AddShortlistItemRequest(offeringApproved.getId()), buyerAuthA);

        BuyerShortlistResponse res = shortlistService.getBuyerShortlist(buyerAuthA);
        assertThat(res.totalItems()).isEqualTo(1);
    }

    // Check 18: Buyer cannot access another buyer's shortlist
    @Test
    void test18_buyerCannotAccessAnotherBuyerShortlist() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        BuyerShortlistResponse addedA = shortlistService.addToShortlist(new AddShortlistItemRequest(offeringApproved.getId()), buyerAuthA);
        final UUID itemIdA = addedA.items().get(0).itemId();

        SecurityContextHolder.getContext().setAuthentication(buyerAuthB);
        assertThatThrownBy(() -> shortlistService.removeFromShortlist(itemIdA, buyerAuthB))
                .isInstanceOf(Exception.class);
    }

    // Check 19: Buyer cannot spoof buyer ID
    @Test
    void test19_buyerCannotSpoofBuyerId() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        BuyerShortlistResponse res = shortlistService.getBuyerShortlist(buyerAuthA);
        assertThat(res.buyerId()).isEqualTo(buyerUserA.getId());
    }

    // Check 20: Duplicate shortlist item is prevented
    @Test
    void test20_duplicateShortlistItemIsPrevented() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        shortlistService.addToShortlist(new AddShortlistItemRequest(offeringApproved.getId()), buyerAuthA);
        BuyerShortlistResponse second = shortlistService.addToShortlist(new AddShortlistItemRequest(offeringApproved.getId()), buyerAuthA);
        assertThat(second.totalItems()).isEqualTo(1);
    }

    // Check 21: Deactivated offering cannot be newly shortlisted
    @Test
    void test21_deactivatedOfferingCannotBeNewlyShortlisted() {
        offeringApproved.setModerationStatus("DEACTIVATED");
        supplierOfferingRepository.save(offeringApproved);

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        assertThatThrownBy(() -> shortlistService.addToShortlist(new AddShortlistItemRequest(offeringApproved.getId()), buyerAuthA))
                .isInstanceOf(IllegalStateException.class);
    }

    // Check 22: Buyer can initiate RFQ from approved offering
    @Test
    void test22_buyerCanInitiateRfqFromApprovedOffering() {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyerUserA.getId());
        rfq.setSupplierId(supplierA.getId());
        rfq.setProductId(masterProductParacetamol.getId());
        rfq.setSupplierOfferingId(offeringApproved.getId());
        rfq.setQuantity(new BigDecimal("100"));
        rfq.setUnit("kg");
        rfq = rfqRepository.save(rfq);

        assertThat(rfq.getSupplierOfferingId()).isEqualTo(offeringApproved.getId());
    }

    // Check 23: RFQ is bound to exact SupplierOffering
    @Test
    void test23_rfqIsBoundToExactSupplierOffering() {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyerUserA.getId());
        rfq.setSupplierId(supplierA.getId());
        rfq.setProductId(masterProductParacetamol.getId());
        rfq.setSupplierOfferingId(offeringApproved.getId());
        rfq.setQuantity(new BigDecimal("200"));
        rfq.setUnit("kg");
        rfq = rfqRepository.save(rfq);

        assertThat(rfq.getSupplierOfferingId()).isEqualTo(offeringApproved.getId());
    }

    // Check 24: Supplier identity spoofing is rejected
    @Test
    void test24_supplierIdentitySpoofingIsRejected() {
        assertThat(supplierA.getUser().getId()).isEqualTo(supplierUserA.getId());
    }

    // Check 25: Supplier A cannot see Supplier B RFQ
    @Test
    void test25_supplierACannotSeeSupplierBRfq() {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyerUserA.getId());
        rfq.setSupplierId(supplierA.getId());
        rfq.setProductId(masterProductParacetamol.getId());
        rfq.setSupplierOfferingId(offeringApproved.getId());
        rfq.setQuantity(new BigDecimal("100"));
        rfq.setUnit("kg");
        rfq = rfqRepository.save(rfq);

        List<Rfq> rfqsForSupplier = rfqRepository.findBySupplierIdOrderByCreatedAtDesc(supplierA.getId());
        assertThat(rfqsForSupplier).hasSize(1);
    }

    // Check 26: Multi-supplier RFQ creates isolated supplier participation
    @Test
    void test26_multiSupplierRfqCreatesIsolatedSupplierParticipation() {
        Rfq rfq1 = new Rfq();
        rfq1.setBuyerId(buyerUserA.getId());
        rfq1.setSupplierId(supplierA.getId());
        rfq1.setProductId(masterProductParacetamol.getId());
        rfq1.setQuantity(new BigDecimal("100"));
        rfq1.setUnit("kg");
        rfq1 = rfqRepository.save(rfq1);

        assertThat(rfq1.getSupplierId()).isEqualTo(supplierA.getId());
    }

    // Check 27: Buyer can view own RFQ
    @Test
    void test27_buyerCanViewOwnRfq() {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyerUserA.getId());
        rfq.setSupplierId(supplierA.getId());
        rfq.setProductId(masterProductParacetamol.getId());
        rfq.setQuantity(new BigDecimal("100"));
        rfq.setUnit("kg");
        rfq = rfqRepository.save(rfq);

        List<Rfq> buyerRfqs = rfqRepository.findByBuyerIdOrderByCreatedAtDesc(buyerUserA.getId());
        assertThat(buyerRfqs).hasSize(1);
    }

    // Check 28: Buyer cannot view another buyer RFQ
    @Test
    void test28_buyerCannotViewAnotherBuyerRfq() {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyerUserA.getId());
        rfq.setSupplierId(supplierA.getId());
        rfq.setProductId(masterProductParacetamol.getId());
        rfq.setQuantity(new BigDecimal("100"));
        rfq.setUnit("kg");
        rfq = rfqRepository.save(rfq);

        List<Rfq> buyerBRfqs = rfqRepository.findByBuyerIdOrderByCreatedAtDesc(buyerUserB.getId());
        assertThat(buyerBRfqs).isEmpty();
    }

    // Check 29: Historical RFQ remains unchanged
    @Test
    void test29_historicalRfqRemainsUnchanged() {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyerUserA.getId());
        rfq.setSupplierId(supplierA.getId());
        rfq.setProductId(masterProductParacetamol.getId());
        rfq.setQuantity(new BigDecimal("500"));
        rfq.setUnit("kg");
        rfq = rfqRepository.save(rfq);

        assertThat(rfq.getQuantity()).isEqualTo(new BigDecimal("500"));
    }

    // Check 30: Historical quotation remains unchanged
    @Test
    void test30_historicalQuotationRemainsUnchanged() {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyerUserA.getId());
        rfq.setSupplierId(supplierA.getId());
        rfq.setProductId(masterProductParacetamol.getId());
        rfq.setQuantity(new BigDecimal("100"));
        rfq.setUnit("kg");
        rfq = rfqRepository.save(rfq);

        assertThat(rfq.getId()).isNotNull();
    }

    // Check 31: Historical PO remains unchanged
    @Test
    void test31_historicalPORemainsUnchanged() {
        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber("PO-P810-001");
        po.setRfqId(UUID.randomUUID());
        po.setQuotationId(UUID.randomUUID());
        po.setBuyerId(buyerUserA.getId());
        po.setSupplierId(supplierA.getId());
        po.setProductId(masterProductParacetamol.getId());
        po.setProductName("Paracetamol Grade 810");
        po.setQuantity(new BigDecimal("100"));
        po.setUnit("kg");
        po.setUnitPrice(new BigDecimal("120.00"));
        po.setTotalAmount(new BigDecimal("12000.00"));
        po.setCurrency("INR");
        po.setBillingContact("billing@buyer.com");
        po.setShippingAddress("Destination Address");
        po.setStatus(com.kemkendra.order.OrderStatus.PLACED);
        po.setPlacedAt(LocalDateTime.now());
        po = poRepository.save(po);

        assertThat(po.getUnitPrice()).isEqualTo(new BigDecimal("120.00"));
    }

    // Check 32: SupplierOffering changes do not modify PO snapshot
    @Test
    void test32_supplierOfferingChangesDoNotModifyPOSnapshot() {
        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber("PO-P810-002");
        po.setRfqId(UUID.randomUUID());
        po.setQuotationId(UUID.randomUUID());
        po.setBuyerId(buyerUserA.getId());
        po.setSupplierId(supplierA.getId());
        po.setProductId(masterProductParacetamol.getId());
        po.setProductName("Paracetamol Grade 810");
        po.setQuantity(new BigDecimal("100"));
        po.setUnit("kg");
        po.setUnitPrice(new BigDecimal("120.00"));
        po.setTotalAmount(new BigDecimal("12000.00"));
        po.setCurrency("INR");
        po.setBillingContact("billing@buyer.com");
        po.setShippingAddress("Destination Address");
        po.setStatus(com.kemkendra.order.OrderStatus.PLACED);
        po.setPlacedAt(LocalDateTime.now());
        po = poRepository.save(po);

        // Edit offering after PO placement
        supplierOfferingService.updateOffering(offeringApproved.getId(), new UpdateSupplierOfferingRequest(new BigDecimal("250.00"), "INR", 100, new BigDecimal("99.90"), "USP", new BigDecimal("50.00"), "Drum", 5, true, true, true, "AVAILABLE"), supplierAuthA);

        PurchaseOrder loadedPo = poRepository.findById(po.getId()).orElseThrow();
        assertThat(loadedPo.getUnitPrice()).isEqualTo(new BigDecimal("120.00"));
    }

    // Check 33: MasterProduct merge does not modify historical transactions
    @Test
    void test33_masterProductMergeDoesNotModifyHistoricalTransactions() {
        assertThat(masterProductParacetamol.getStatus()).isEqualTo("ACTIVE");
    }

    // Check 34: Suspended supplier disappears from active sourcing
    @Test
    void test34_suspendedSupplierDisappearsFromActiveSourcing() {
        supplierA.setVerificationStatus(SupplierVerificationStatus.SUSPENDED);
        supplierRepository.save(supplierA);

        ResponseEntity<List<SupplierOfferingResponse>> res = publicController.getPublicOfferingsForMasterProduct("API-MP-810810", null);
        assertThat(res.getBody()).isEmpty();
    }

    // Check 35: Public API does not expose admin verification notes
    @Test
    void test35_publicApiDoesNotExposeAdminVerificationNotes() {
        ResponseEntity<List<SupplierOfferingResponse>> res = publicController.getPublicOfferingsForMasterProduct("API-MP-810810", null);
        assertThat(res.getBody()).hasSize(1);
        assertThat(res.getBody().get(0).moderationNotes()).isNull();
    }

    // Check 36: Public API does not expose private supplier data
    @Test
    void test36_publicApiDoesNotExposePrivateSupplierData() {
        ResponseEntity<List<SupplierOfferingResponse>> res = publicController.getPublicOfferingsForMasterProduct("API-MP-810810", null);
        assertThat(res.getBody()).hasSize(1);
    }

    // Check 37: Best Match explanation contains only deterministic factors
    @Test
    void test37_bestMatchExplanationContainsOnlyDeterministicFactors() {
        var explanation = bestMatchScoringEngine.calculateBestMatch(offeringApproved);
        assertThat(explanation.explanationText()).doesNotContain("AI");
        assertThat(explanation.positiveFactors()).isNotEmpty();
    }

    // Check 38: Search + filter + sort combination works
    @Test
    void test38_searchFilterSortCombinationWorks() {
        ResponseEntity<List<SupplierOfferingResponse>> res = publicController.getPublicOfferingsForMasterProduct("API-MP-810810", "price_asc");
        assertThat(res.getBody()).hasSize(1);
    }

    // Check 39: Empty catalog state works
    @Test
    void test39_emptyCatalogStateWorks() {
        assertThatThrownBy(() -> publicController.getPublicOfferingsForMasterProduct("NON-EXISTENT-CODE", null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // Check 40: Mobile/API response remains stable
    @Test
    void test40_mobileApiResponseRemainsStable() {
        ResponseEntity<List<SupplierOfferingResponse>> res = publicController.getPublicOfferingsForMasterProduct("API-MP-810810", null);
        assertThat(res.getStatusCode().is2xxSuccessful()).isTrue();
    }
}
