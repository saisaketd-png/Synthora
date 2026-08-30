package com.kemkendra.product;

import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.product.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class MasterProductSynonymAndRequestFlowSecurityTest {

    @Autowired
    private MasterProductService masterProductService;

    @Autowired
    private AdminMasterCatalogService adminMasterCatalogService;

    @Autowired
    private ProductRequestService productRequestService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private MasterProductRepository masterProductRepository;

    @Autowired
    private ProductSynonymRepository productSynonymRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private User adminUser;
    private Authentication adminAuth;

    private User supplierUser;
    private Supplier supplier;
    private Authentication supplierAuth;

    private User buyerUser;
    private Authentication buyerAuth;

    @BeforeEach
    public void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        String suffix = UUID.randomUUID().toString().substring(0, 8);

        adminUser = new User();
        adminUser.setName("Admin " + suffix);
        adminUser.setEmail("admin_" + suffix + "@test.com");
        adminUser.setPasswordHash("hash");
        adminUser.setRole(UserRole.ADMIN);
        adminUser = userRepository.save(adminUser);
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        supplierUser = new User();
        supplierUser.setName("Supplier " + suffix);
        supplierUser.setEmail("supplier_" + suffix + "@test.com");
        supplierUser.setPasswordHash("hash");
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser = userRepository.save(supplierUser);

        supplier = new Supplier();
        supplier.setName("Supplier Corp " + suffix);
        supplier.setSlug("supplier-corp-" + suffix);
        supplier.setUser(supplierUser);
        supplier = supplierRepository.save(supplier);
        supplierAuth = new UsernamePasswordAuthenticationToken(supplierUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        buyerUser = new User();
        buyerUser.setName("Buyer " + suffix);
        buyerUser.setEmail("buyer_" + suffix + "@test.com");
        buyerUser.setPasswordHash("hash");
        buyerUser.setRole(UserRole.USER);
        buyerUser = userRepository.save(buyerUser);
        buyerAuth = new UsernamePasswordAuthenticationToken(buyerUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
    }

    @Test
    public void testProductRequestToMasterCatalogEndToEndFlow() {
        String chemName = "Novel KemKendra Compound " + UUID.randomUUID().toString().substring(0, 6);
        String cas = "9999-99-9";

        // 1. Supplier searches Master Catalog -> Not found
        Page<MasterProductResponse> initialSearch = masterProductService.searchMasterProducts(chemName, 0, 20);
        assertTrue(initialSearch.isEmpty(), "Initial search should find nothing");

        // 2. Supplier requests product
        CreateProductRequestRequest requestDto = new CreateProductRequestRequest(
                chemName, cas, "C10H15N", ProductCategory.API, "Novel API description", "We can supply 500kg monthly"
        );
        ProductRequestResponse requestResponse = productRequestService.createRequest(requestDto, supplierAuth);
        assertNotNull(requestResponse.id());
        assertEquals("PENDING_REVIEW", requestResponse.status());

        // 3. Admin reviews and approves request
        ApproveProductRequestPayload approvePayload = new ApproveProductRequestPayload(
                chemName, cas, "C10H15N", ProductCategory.API, "Approved chemical proposal"
        );
        MasterProductResponse approvedMp = adminMasterCatalogService.approveRequest(requestResponse.id(), approvePayload, adminAuth);
        assertNotNull(approvedMp);
        assertEquals("ACTIVE", approvedMp.status());
        assertEquals(chemName, approvedMp.name());

        // 4. Supplier searches Master Catalog again -> Product immediately appears!
        Page<MasterProductResponse> afterApprovalSearch = masterProductService.searchMasterProducts(chemName, 0, 20);
        assertFalse(afterApprovalSearch.isEmpty(), "Supplier catalog search should immediately return the newly approved product even with 0 offerings");
        assertEquals(approvedMp.id(), afterApprovalSearch.getContent().get(0).id());
    }

    @Test
    public void testOfficialSynonymsCreationAndSearch() {
        // Create canonical MasterProduct
        CreateMasterProductPayload payload = new CreateMasterProductPayload(
                "Acetylsalicylic Acid " + UUID.randomUUID().toString().substring(0, 4),
                "50-78-2",
                "C9H8O4",
                ProductCategory.API,
                "Analgesic and antipyretic active pharmaceutical ingredient",
                "ACTIVE"
        );
        MasterProductResponse mp = adminMasterCatalogService.createMasterProduct(payload, adminAuth);

        // Admin adds official synonym: Aspirin
        ProductSynonymResponse syn1 = adminMasterCatalogService.addOfficialSynonym(mp.id(), new AddSynonymPayload("Aspirin"), adminAuth);
        assertEquals("Aspirin", syn1.synonym());
        assertEquals(SynonymSource.OFFICIAL, syn1.source());
        assertEquals(SynonymStatus.APPROVED, syn1.status());

        // Admin adds official synonym: ASA
        ProductSynonymResponse syn2 = adminMasterCatalogService.addOfficialSynonym(mp.id(), new AddSynonymPayload("ASA"), adminAuth);
        assertEquals("ASA", syn2.synonym());

        // Search by synonym "Aspirin" (case-insensitive "aspirin")
        Page<MasterProductResponse> searchRes = masterProductService.searchMasterProducts("aspirin", 0, 10);
        assertFalse(searchRes.isEmpty(), "Searching for synonym 'aspirin' should return MasterProduct");
        assertEquals(mp.id(), searchRes.getContent().get(0).id());

        // Duplicate synonym check (normalized lower & trimmed)
        assertThrows(IllegalStateException.class, () -> {
            adminMasterCatalogService.addOfficialSynonym(mp.id(), new AddSynonymPayload("  ASPIRIN  "), adminAuth);
        }, "Duplicate synonym should be rejected");
    }

    @Test
    public void testSupplierSynonymSuggestionFlow() {
        CreateMasterProductPayload payload = new CreateMasterProductPayload(
                "Acetaminophen " + UUID.randomUUID().toString().substring(0, 4),
                "103-90-2",
                "C8H9NO2",
                ProductCategory.API,
                "Analgesic agent",
                "ACTIVE"
        );
        MasterProductResponse mp = adminMasterCatalogService.createMasterProduct(payload, adminAuth);

        // Supplier suggests synonym "Paracetamol"
        ProductSynonymResponse suggestion = masterProductService.suggestSupplierSynonym(
                mp.id(),
                new AddSynonymPayload("Paracetamol"),
                supplierAuth
        );
        assertNotNull(suggestion.id());
        assertEquals(SynonymSource.SUPPLIER, suggestion.source());
        assertEquals(SynonymStatus.PENDING, suggestion.status());

        // Searching for "Paracetamol" before approval should NOT return product
        Page<MasterProductResponse> preApprovalSearch = masterProductService.searchMasterProducts("Paracetamol", 0, 10);
        assertTrue(preApprovalSearch.isEmpty(), "Pending synonym suggestion must not be globally searchable");

        // Supplier cannot review/approve their own suggestion
        assertThrows(AccessDeniedException.class, () -> {
            adminMasterCatalogService.reviewSupplierSynonym(suggestion.id(), new ReviewSynonymPayload(SynonymStatus.APPROVED), supplierAuth);
        });

        // Admin approves supplier suggestion
        ProductSynonymResponse approvedSuggestion = adminMasterCatalogService.reviewSupplierSynonym(
                suggestion.id(),
                new ReviewSynonymPayload(SynonymStatus.APPROVED),
                adminAuth
        );
        assertEquals(SynonymStatus.APPROVED, approvedSuggestion.status());

        // Searching for "Paracetamol" after approval should now return product
        Page<MasterProductResponse> postApprovalSearch = masterProductService.searchMasterProducts("Paracetamol", 0, 10);
        assertFalse(postApprovalSearch.isEmpty(), "Approved synonym suggestion should now be searchable");
        assertEquals(mp.id(), postApprovalSearch.getContent().get(0).id());
    }

    @Test
    public void testRejectedSynonymSuggestionDoesNotBecomeSearchable() {
        CreateMasterProductPayload payload = new CreateMasterProductPayload(
                "Ibuprofen " + UUID.randomUUID().toString().substring(0, 4),
                "15687-27-1",
                "C13H18O2",
                ProductCategory.API,
                "NSAID",
                "ACTIVE"
        );
        MasterProductResponse mp = adminMasterCatalogService.createMasterProduct(payload, adminAuth);

        // Supplier suggests invalid synonym
        ProductSynonymResponse suggestion = masterProductService.suggestSupplierSynonym(
                mp.id(),
                new AddSynonymPayload("FakeInvalidSynonymXYZ"),
                supplierAuth
        );

        // Admin rejects suggestion
        adminMasterCatalogService.reviewSupplierSynonym(suggestion.id(), new ReviewSynonymPayload(SynonymStatus.REJECTED), adminAuth);

        // Search should not return product
        Page<MasterProductResponse> searchRes = masterProductService.searchMasterProducts("FakeInvalidSynonymXYZ", 0, 10);
        assertTrue(searchRes.isEmpty(), "Rejected synonym must not be searchable");
    }

    @Test
    public void testUnauthorizedUserCannotModifyOfficialSynonyms() {
        CreateMasterProductPayload payload = new CreateMasterProductPayload(
                "Chemical Compound " + UUID.randomUUID().toString().substring(0, 4),
                "111-22-3",
                "CH4",
                ProductCategory.API,
                "Test chemical",
                "ACTIVE"
        );
        MasterProductResponse mp = adminMasterCatalogService.createMasterProduct(payload, adminAuth);

        assertThrows(AccessDeniedException.class, () -> {
            adminMasterCatalogService.addOfficialSynonym(mp.id(), new AddSynonymPayload("Unauthorized"), buyerAuth);
        });

        assertThrows(AccessDeniedException.class, () -> {
            adminMasterCatalogService.addOfficialSynonym(mp.id(), new AddSynonymPayload("Unauthorized"), supplierAuth);
        });
    }
}
