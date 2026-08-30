package com.kemkendra.catalog;

import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.order.OrderStatus;
import com.kemkendra.order.PurchaseOrder;
import com.kemkendra.order.PurchaseOrderRepository;
import com.kemkendra.product.*;
import com.kemkendra.product.dto.CreateSupplierOfferingRequest;
import com.kemkendra.product.dto.SupplierOfferingResponse;

import com.kemkendra.rfq.Rfq;
import com.kemkendra.rfq.RfqRepository;
import com.kemkendra.rfq.RfqService;
import com.kemkendra.rfq.RfqStatus;
import com.kemkendra.rfq.dto.CreateRfqRequest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class MasterCatalogPublicPageIntegrationTest {

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
    private MasterProductService masterProductService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductMasterMappingRepository mappingRepository;

    @Autowired
    private LegacyProductTransitionService transitionService;

    @Autowired
    private RfqService rfqService;

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
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        // Admin
        adminUser = new User(UUID.randomUUID(), "Admin", "admin_pub15@kemkendra.com", "9900112233", "$2a$10$hash", UserRole.ADMIN, UserStatus.ACTIVE);
        adminUser = userRepository.save(adminUser);
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        // Supplier A
        supplierUserA = new User(UUID.randomUUID(), "Supplier A User", "supa_pub15@kemkendra.com", "1100112233", "$2a$10$hash", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierUserA = userRepository.save(supplierUserA);

        supplierA = new Supplier();
        supplierA.setName("Pharma Source A");
        supplierA.setSlug("pharma-source-a");
        supplierA.setUser(supplierUserA);
        supplierA.setVerified(true);
        supplierA = supplierRepository.save(supplierA);
        supplierAuthA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        // Supplier B
        supplierUserB = new User(UUID.randomUUID(), "Supplier B User", "supb_pub15@kemkendra.com", "2200112233", "$2a$10$hash", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierUserB = userRepository.save(supplierUserB);

        supplierB = new Supplier();
        supplierB.setName("Pharma Source B");
        supplierB.setSlug("pharma-source-b");
        supplierB.setUser(supplierUserB);
        supplierB.setVerified(true);
        supplierB = supplierRepository.save(supplierB);
        supplierAuthB = new UsernamePasswordAuthenticationToken(supplierUserB.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        // Buyer
        buyerUser = new User(UUID.randomUUID(), "Buyer User", "buyer_pub15@kemkendra.com", "3300112233", "$2a$10$hash", UserRole.USER, UserStatus.ACTIVE);
        buyerUser = userRepository.save(buyerUser);
        buyerAuth = new UsernamePasswordAuthenticationToken(buyerUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        // Active MasterProduct
        masterProductParacetamol = new MasterProduct();
        masterProductParacetamol.setName("Paracetamol Grade 15");
        masterProductParacetamol.setMasterProductCode("API-MP-151515");
        masterProductParacetamol.setCasNumber("103-90-2");
        masterProductParacetamol.setMolecularFormula("C8H9NO2");
        masterProductParacetamol.setCategory(ProductCategory.API);
        masterProductParacetamol.setStatus("ACTIVE");
        masterProductParacetamol = masterProductRepository.save(masterProductParacetamol);

        // Inactive MasterProduct
        masterProductInactive = new MasterProduct();
        masterProductInactive.setName("Suspended Compound 15");
        masterProductInactive.setMasterProductCode("API-MP-999999");
        masterProductInactive.setCasNumber("999-99-9");
        masterProductInactive.setMolecularFormula("C9H9NO9");
        masterProductInactive.setCategory(ProductCategory.SPECIALTY_CHEMICAL);
        masterProductInactive.setStatus("INACTIVE");
        masterProductInactive = masterProductRepository.save(masterProductInactive);
    }

    // Check 1: MasterProduct appears in public catalog when it has approved offering
    @Test
    void test01_masterProductAppearsInPublicCatalog_whenApprovedOfferingExists() {
        var offering = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500,
                new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "25kg Drum", 7,
                true, true, true, "AVAILABLE"
        ), supplierAuthA);

        supplierOfferingService.approveOffering(offering.id(), "Approved", adminAuth);

        var searchResult = masterProductService.searchActiveMasterProductsWithCriteria(
                new com.kemkendra.product.dto.MasterProductSearchCriteria("Paracetamol", null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 10, null)
        );

        assertThat(searchResult.getContent()).hasSize(1);
        assertThat(searchResult.getContent().get(0).masterProductCode()).isEqualTo("API-MP-151515");
    }

    // Check 2: MasterProduct does NOT appear when all offerings are pending
    @Test
    void test02_masterProductDoesNotAppear_whenAllOfferingsPending() {
        supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500,
                new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "25kg Drum", 7,
                true, true, true, "AVAILABLE"
        ), supplierAuthA);

        var searchResult = masterProductService.searchActiveMasterProductsWithCriteria(
                new com.kemkendra.product.dto.MasterProductSearchCriteria("Paracetamol", null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 10, null)
        );

        assertThat(searchResult.getContent()).isEmpty();
    }

    // Check 3: MasterProduct does NOT appear when all offerings are suspended
    @Test
    void test03_masterProductDoesNotAppear_whenAllOfferingsSuspended() {
        var offering = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500,
                new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "25kg Drum", 7,
                true, true, true, "AVAILABLE"
        ), supplierAuthA);

        supplierOfferingService.suspendOffering(offering.id(), "Suspended by admin", adminAuth);

        var searchResult = masterProductService.searchActiveMasterProductsWithCriteria(
                new com.kemkendra.product.dto.MasterProductSearchCriteria("Paracetamol", null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 10, null)
        );

        assertThat(searchResult.getContent()).isEmpty();
    }

    // Check 4: MasterProduct does NOT appear when all offerings are deactivated
    @Test
    void test04_masterProductDoesNotAppear_whenAllOfferingsDeactivated() {
        var offering = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500,
                new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "25kg Drum", 7,
                true, true, true, "AVAILABLE"
        ), supplierAuthA);

        supplierOfferingService.deactivateOffering(offering.id(), supplierAuthA);

        var searchResult = masterProductService.searchActiveMasterProductsWithCriteria(
                new com.kemkendra.product.dto.MasterProductSearchCriteria("Paracetamol", null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 10, null)
        );

        assertThat(searchResult.getContent()).isEmpty();
    }

    // Check 5: Inactive MasterProduct does NOT appear
    @Test
    void test05_inactiveMasterProduct_doesNotAppearInPublicCatalog() {
        var offering = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                masterProductInactive.getId(), new BigDecimal("500.00"), "INR", 100,
                new BigDecimal("95.00"), "Tech", new BigDecimal("10.00"), "Box", 5,
                true, true, true, "AVAILABLE"
        ), supplierAuthA);

        supplierOfferingService.approveOffering(offering.id(), "Approved", adminAuth);

        var searchResult = masterProductService.searchActiveMasterProductsWithCriteria(
                new com.kemkendra.product.dto.MasterProductSearchCriteria("Suspended", null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 10, null)
        );

        assertThat(searchResult.getContent()).isEmpty();
    }

    // Check 6: Multiple supplier offerings aggregate under one MasterProduct
    @Test
    void test06_multipleSupplierOfferings_aggregateUnderOneMasterProduct() {
        var offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500,
                new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "25kg Drum", 7,
                true, true, true, "AVAILABLE"
        ), supplierAuthA);
        supplierOfferingService.approveOffering(offA.id(), "Approved", adminAuth);

        var offB = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                masterProductParacetamol.getId(), new BigDecimal("115.00"), "INR", 800,
                new BigDecimal("99.50"), "BP", new BigDecimal("50.00"), "50kg Bag", 5,
                true, true, true, "AVAILABLE"
        ), supplierAuthB);
        supplierOfferingService.approveOffering(offB.id(), "Approved", adminAuth);

        List<SupplierOfferingResponse> offerings = supplierOfferingService.getOfferingsForMasterProduct(masterProductParacetamol.getId());
        List<SupplierOfferingResponse> approvedOfferings = offerings.stream()
                .filter(o -> "APPROVED".equalsIgnoreCase(o.moderationStatus()) && "AVAILABLE".equalsIgnoreCase(o.availabilityStatus()))
                .toList();

        assertThat(approvedOfferings).hasSize(2);
    }

    // Check 7: Supplier A offering does NOT appear as Supplier B
    @Test
    void test07_supplierOffering_isStrictlyBoundToOfferingOwner() {
        var offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500,
                new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "25kg Drum", 7,
                true, true, true, "AVAILABLE"
        ), supplierAuthA);

        SupplierOffering offeringA = supplierOfferingRepository.findById(offA.id()).orElseThrow();
        assertThat(offeringA.getSupplier().getId()).isEqualTo(supplierA.getId());
        assertThat(offeringA.getSupplier().getId()).isNotEqualTo(supplierB.getId());
    }

    // Check 8: Supplier inventory displays authenticated supplier's offerings
    @Test
    void test08_supplierInventory_displaysAuthenticatedSupplierOfferings() {
        supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500,
                new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "25kg Drum", 7,
                true, true, true, "AVAILABLE"
        ), supplierAuthA);

        List<SupplierOfferingResponse> myOfferingsA = supplierOfferingService.getMyOfferings(supplierAuthA);
        assertThat(myOfferingsA).hasSize(1);
        assertThat(myOfferingsA.get(0).supplierId()).isEqualTo(supplierA.getId());

        List<SupplierOfferingResponse> myOfferingsB = supplierOfferingService.getMyOfferings(supplierAuthB);
        assertThat(myOfferingsB).isEmpty();
    }

    // Check 9: Legacy Product does NOT automatically populate public catalog
    @Test
    void test09_legacyProduct_doesNotAutomaticallyPopulatePublicCatalog() {
        Product legacyProduct = new Product();
        legacyProduct.setSeller(supplierUserA);
        legacyProduct.setName("Legacy Unmapped Product");
        legacyProduct.setProductCode("LEG-9090");
        legacyProduct.setCategory(ProductCategory.API);
        legacyProduct.setPrice(new BigDecimal("99.00"));
        legacyProduct.setStock(100);
        productRepository.save(legacyProduct);

        var searchResult = masterProductService.searchActiveMasterProductsWithCriteria(
                new com.kemkendra.product.dto.MasterProductSearchCriteria("Legacy Unmapped", null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 10, null)
        );

        assertThat(searchResult.getContent()).isEmpty();
    }

    // Check 10: Legacy URL resolves to MasterProduct
    @Test
    void test10_legacyUrl_resolvesToCanonicalMasterProduct() {
        Product legacyProduct = new Product();
        legacyProduct.setSeller(supplierUserA);
        legacyProduct.setName("Paracetamol Legacy");
        legacyProduct.setProductCode("API-100428");
        legacyProduct.setCategory(ProductCategory.API);
        legacyProduct.setPrice(new BigDecimal("100.00"));
        legacyProduct.setStock(100);
        legacyProduct = productRepository.save(legacyProduct);

        ProductMasterMapping mapping = new ProductMasterMapping();
        mapping.setLegacyProduct(legacyProduct);
        mapping.setMasterProduct(masterProductParacetamol);
        mapping.setMappingStatus("AUTO_MIGRATED");
        mappingRepository.save(mapping);

        MasterProduct resolved = transitionService.resolveCanonicalMasterProduct("API-100428");
        assertThat(resolved.getId()).isEqualTo(masterProductParacetamol.getId());
        assertThat(resolved.getMasterProductCode()).isEqualTo("API-MP-151515");
    }

    // Check 11: MasterProduct detail page displays canonical identity
    @Test
    void test11_masterProductDetail_returnsCanonicalChemicalIdentity() {
        var detail = masterProductService.getMasterProductById(masterProductParacetamol.getId());
        assertThat(detail.name()).isEqualTo("Paracetamol Grade 15");
        assertThat(detail.casNumber()).isEqualTo("103-90-2");
        assertThat(detail.molecularFormula()).isEqualTo("C8H9NO2");
    }

    // Check 12: Supplier offerings display separately
    @Test
    void test12_supplierOfferings_displaySeparatelyForMasterProduct() {
        var offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500,
                new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "25kg Drum", 7,
                true, true, true, "AVAILABLE"
        ), supplierAuthA);
        supplierOfferingService.approveOffering(offA.id(), "Approved", adminAuth);

        var offB = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                masterProductParacetamol.getId(), new BigDecimal("110.00"), "INR", 300,
                new BigDecimal("99.00"), "BP", new BigDecimal("50.00"), "50kg Bag", 10,
                true, true, true, "AVAILABLE"
        ), supplierAuthB);
        supplierOfferingService.approveOffering(offB.id(), "Approved", adminAuth);

        List<SupplierOfferingResponse> list = supplierOfferingService.getOfferingsForMasterProduct(masterProductParacetamol.getId());
        assertThat(list).extracting("supplierId").containsExactlyInAnyOrder(supplierA.getId(), supplierB.getId());
    }

    // Check 13: Request Quote targets exact SupplierOffering
    @Test
    void test13_requestQuote_targetsExactSupplierOffering_andValidatesRelationship() {
        var offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                masterProductParacetamol.getId(), new BigDecimal("120.00"), "INR", 500,
                new BigDecimal("99.80"), "USP", new BigDecimal("25.00"), "25kg Drum", 7,
                true, true, true, "AVAILABLE"
        ), supplierAuthA);
        supplierOfferingService.approveOffering(offA.id(), "Approved", adminAuth);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);

        UUID dummyProductId = UUID.randomUUID();
        CreateRfqRequest rfqReq = new CreateRfqRequest(
                dummyProductId,
                masterProductParacetamol.getId(),
                offA.id(),
                supplierA.getId(),
                List.of(supplierA.getId()),
                new BigDecimal("100.00"),
                "kg",
                "Request quote for Supplier A offering",
                7
        );

        var rfqResponse = rfqService.createRfq(rfqReq, buyerAuth);
        assertThat(rfqResponse.supplierOfferingId()).isEqualTo(offA.id());
        assertThat(rfqResponse.supplierId()).isEqualTo(supplierA.getId());

        // Validate spoofing rejection: Mismatched supplierId must be rejected
        CreateRfqRequest spoofedReq = new CreateRfqRequest(
                dummyProductId,
                masterProductParacetamol.getId(),
                offA.id(),
                supplierB.getId(), // Spoofed supplier ID!
                List.of(supplierB.getId()),
                new BigDecimal("100.00"),
                "kg",
                "Spoofed RFQ",
                7
        );

        assertThatThrownBy(() -> rfqService.createRfq(spoofedReq, buyerAuth))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("does not match SupplierOffering owner ID");
    }

    // Check 14: Historical RFQ remains unchanged
    @Test
    void test14_historicalRfq_remainsValidAndUnchanged() {
        Rfq historicalRfq = new Rfq();
        historicalRfq.setBuyerId(buyerUser.getId());
        historicalRfq.setSupplierId(supplierA.getId());
        historicalRfq.setQuantity(new BigDecimal("250.00"));
        historicalRfq.setUnit("kg");
        historicalRfq.setMessage("Historical RFQ Test");
        historicalRfq.setStatus(RfqStatus.PENDING);
        historicalRfq = rfqRepository.save(historicalRfq);

        Rfq loaded = rfqRepository.findById(historicalRfq.getId()).orElseThrow();
        assertThat(loaded.getMessage()).isEqualTo("Historical RFQ Test");
        assertThat(loaded.getStatus()).isEqualTo(RfqStatus.PENDING);
    }

    // Check 15: Historical PO remains unchanged
    @Test
    void test15_historicalPo_remainsValidAndUnchanged() {
        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber("PO-2026-HISTORICAL-001");
        po.setRfqId(UUID.randomUUID());
        po.setQuotationId(UUID.randomUUID());
        po.setProductId(UUID.randomUUID());
        po.setQuantity(new BigDecimal("100.00"));
        po.setUnit("kg");
        po.setUnitPrice(new BigDecimal("500.00"));
        po.setBuyerId(buyerUser.getId());
        po.setSupplierId(supplierA.getId());
        po.setTotalAmount(new BigDecimal("50000.00"));
        po.setCurrency("INR");
        po.setShippingAddress("Bangalore, India");
        po.setBillingContact("Billing Dept");
        po.setPlacedAt(java.time.LocalDateTime.now());
        po.setStatus(OrderStatus.PLACED);
        po = poRepository.save(po);

        PurchaseOrder loaded = poRepository.findById(po.getId()).orElseThrow();
        assertThat(loaded.getPoNumber()).isEqualTo("PO-2026-HISTORICAL-001");
        assertThat(loaded.getStatus()).isEqualTo(OrderStatus.PLACED);
    }
}
