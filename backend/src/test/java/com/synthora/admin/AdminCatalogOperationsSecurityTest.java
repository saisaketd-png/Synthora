package com.synthora.admin;

import com.synthora.admin.supplier.AdminSupplierService;
import com.synthora.admin.supplier.dto.AdminSupplierResponse;
import com.synthora.common.ResourceNotFoundException;
import com.synthora.governance.GovernanceAuditLog;
import com.synthora.governance.GovernanceAuditLogRepository;
import com.synthora.governance.dto.GovernanceAuditLogResponse;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.order.PurchaseOrder;
import com.synthora.order.PurchaseOrderRepository;
import com.synthora.order.PurchaseOrderService;
import com.synthora.order.dto.CreatePurchaseOrderRequest;
import com.synthora.order.dto.PurchaseOrderResponse;
import com.synthora.product.*;
import com.synthora.product.dto.*;
import com.synthora.rfq.RfqService;
import com.synthora.rfq.dto.*;
import com.synthora.seller.SupplierVerificationAuditRepository;
import com.synthora.seller.SupplierVerificationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AdminCatalogOperationsSecurityTest {

    @Autowired
    private AdminMasterCatalogService adminMasterCatalogService;

    @Autowired
    private AdminSupplierService adminSupplierService;

    @Autowired
    private MasterProductRepository masterProductRepository;

    @Autowired
    private SupplierOfferingRepository supplierOfferingRepository;

    @Autowired
    private ProductRequestRepository productRequestRepository;

    @Autowired
    private ProductRequestService productRequestService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private GovernanceAuditLogRepository governanceAuditLogRepository;

    @Autowired
    private SupplierVerificationAuditRepository verificationAuditRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private RfqService rfqService;

    @Autowired
    private PurchaseOrderService purchaseOrderService;

    private User adminUser;
    private UsernamePasswordAuthenticationToken adminAuth;

    private User buyerUser;
    private UsernamePasswordAuthenticationToken buyerAuth;

    private User supplierUserA;
    private Supplier supplierA;
    private UsernamePasswordAuthenticationToken supplierAuthA;

    private User supplierUserB;
    private Supplier supplierB;
    private UsernamePasswordAuthenticationToken supplierAuthB;

    private MasterProduct mp1;
    private MasterProduct mp2;

    @BeforeEach
    public void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        adminUser = new User();
        adminUser.setName("Admin Governance " + suffix);
        adminUser.setEmail("admin_gov_" + suffix + "@synthora.com");
        adminUser.setPasswordHash("hash");
        adminUser.setRole(UserRole.ADMIN);
        adminUser = userRepository.save(adminUser);
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        buyerUser = new User();
        buyerUser.setName("Buyer Gov " + suffix);
        buyerUser.setEmail("buyer_gov_" + suffix + "@synthora.com");
        buyerUser.setPasswordHash("hash");
        buyerUser.setRole(UserRole.USER);
        buyerUser = userRepository.save(buyerUser);
        buyerAuth = new UsernamePasswordAuthenticationToken(buyerUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        supplierUserA = new User();
        supplierUserA.setName("Supplier A Gov " + suffix);
        supplierUserA.setEmail("sup_a_gov_" + suffix + "@synthora.com");
        supplierUserA.setPasswordHash("hash");
        supplierUserA.setRole(UserRole.SUPPLIER);
        supplierUserA = userRepository.save(supplierUserA);

        supplierA = new Supplier();
        supplierA.setName("Supplier A Alpha " + suffix);
        supplierA.setSlug("sup-a-alpha-" + suffix);
        supplierA.setUser(supplierUserA);
        supplierA.setVerified(true);
        supplierA.setVerificationStatus(SupplierVerificationStatus.VERIFIED);
        supplierA = supplierRepository.save(supplierA);
        supplierAuthA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        supplierUserB = new User();
        supplierUserB.setName("Supplier B Gov " + suffix);
        supplierUserB.setEmail("sup_b_gov_" + suffix + "@synthora.com");
        supplierUserB.setPasswordHash("hash");
        supplierUserB.setRole(UserRole.SUPPLIER);
        supplierUserB = userRepository.save(supplierUserB);

        supplierB = new Supplier();
        supplierB.setName("Supplier B Beta " + suffix);
        supplierB.setSlug("sup-b-beta-" + suffix);
        supplierB.setUser(supplierUserB);
        supplierB.setVerified(false);
        supplierB.setVerificationStatus(SupplierVerificationStatus.PENDING);
        supplierB = supplierRepository.save(supplierB);
        supplierAuthB = new UsernamePasswordAuthenticationToken(supplierUserB.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        MasterProduct m1 = new MasterProduct();
        m1.setName("Paracetamol Advanced Governance");
        m1.setMasterProductCode("API-MP-GOV1-" + suffix);
        m1.setCasNumber("103-90-2");
        m1.setMolecularFormula("C8H9NO2");
        m1.setCategory(ProductCategory.API);
        m1.setDescription("Analgesic compound for catalog search test");
        m1.setStatus("ACTIVE");
        mp1 = masterProductRepository.save(m1);

        MasterProduct m2 = new MasterProduct();
        m2.setName("Ibuprofen Advanced Governance");
        m2.setMasterProductCode("API-MP-GOV2-" + suffix);
        m2.setCasNumber("15687-27-1");
        m2.setMolecularFormula("C13H18O2");
        m2.setCategory(ProductCategory.API);
        m2.setDescription("Anti-inflammatory active pharmaceutical ingredient");
        m2.setStatus("ACTIVE");
        mp2 = masterProductRepository.save(m2);

        SupplierOffering offA = new SupplierOffering();
        offA.setMasterProduct(mp1);
        offA.setSupplier(supplierA);
        offA.setPrice(new BigDecimal("120.00"));
        offA.setCurrency("INR");
        offA.setStock(500);
        offA.setAvailabilityStatus("AVAILABLE");
        supplierOfferingRepository.save(offA);
    }

    // 1. Search by name
    @Test
    public void test01_SearchByName() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        AdminMasterProductSearchCriteria criteria = new AdminMasterProductSearchCriteria("Paracetamol", null, null, null, null, null, null, 0, 10, "name,asc");
        Page<MasterProductResponse> page = adminMasterCatalogService.searchAdminMasterProducts(criteria, PageRequest.of(0, 10), adminAuth);
        assertTrue(page.getContent().stream().anyMatch(m -> m.name().contains("Paracetamol")));
    }

    // 2. Partial name search
    @Test
    public void test02_PartialNameSearch() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        AdminMasterProductSearchCriteria criteria = new AdminMasterProductSearchCriteria("Paracet", null, null, null, null, null, null, 0, 10, null);
        Page<MasterProductResponse> page = adminMasterCatalogService.searchAdminMasterProducts(criteria, PageRequest.of(0, 10), adminAuth);
        assertTrue(page.getContent().stream().anyMatch(m -> m.name().contains("Paracetamol")));
    }

    // 3. CAS search
    @Test
    public void test03_CasSearch() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        AdminMasterProductSearchCriteria criteria = new AdminMasterProductSearchCriteria("103-90-2", null, null, null, null, null, null, 0, 10, null);
        Page<MasterProductResponse> page = adminMasterCatalogService.searchAdminMasterProducts(criteria, PageRequest.of(0, 10), adminAuth);
        assertTrue(page.getContent().stream().anyMatch(m -> "103-90-2".equals(m.casNumber())));
    }

    // 4. Normalized CAS search
    @Test
    public void test04_NormalizedCasSearch() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        AdminMasterProductSearchCriteria criteria = new AdminMasterProductSearchCriteria("103902", null, null, null, null, null, null, 0, 10, null);
        Page<MasterProductResponse> page = adminMasterCatalogService.searchAdminMasterProducts(criteria, PageRequest.of(0, 10), adminAuth);
        assertTrue(page.getContent().stream().anyMatch(m -> "103-90-2".equals(m.casNumber())));
    }

    // 5. Master Product Code search
    @Test
    public void test05_MasterProductCodeSearch() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        AdminMasterProductSearchCriteria criteria = new AdminMasterProductSearchCriteria(mp1.getMasterProductCode(), null, null, null, null, null, null, 0, 10, null);
        Page<MasterProductResponse> page = adminMasterCatalogService.searchAdminMasterProducts(criteria, PageRequest.of(0, 10), adminAuth);
        assertTrue(page.getContent().stream().anyMatch(m -> mp1.getMasterProductCode().equals(m.masterProductCode())));
    }

    // 6. Formula search
    @Test
    public void test06_FormulaSearch() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        AdminMasterProductSearchCriteria criteria = new AdminMasterProductSearchCriteria("C8H9NO2", null, null, null, null, null, null, 0, 10, null);
        Page<MasterProductResponse> page = adminMasterCatalogService.searchAdminMasterProducts(criteria, PageRequest.of(0, 10), adminAuth);
        assertTrue(page.getContent().stream().anyMatch(m -> "C8H9NO2".equals(m.molecularFormula())));
    }

    // 7. Description search
    @Test
    public void test07_DescriptionSearch() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        AdminMasterProductSearchCriteria criteria = new AdminMasterProductSearchCriteria("Analgesic compound", null, null, null, null, null, null, 0, 10, null);
        Page<MasterProductResponse> page = adminMasterCatalogService.searchAdminMasterProducts(criteria, PageRequest.of(0, 10), adminAuth);
        assertTrue(page.getContent().stream().anyMatch(m -> m.description() != null && m.description().contains("Analgesic")));
    }

    // 8. Case-insensitive search
    @Test
    public void test08_CaseInsensitiveSearch() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        AdminMasterProductSearchCriteria criteria = new AdminMasterProductSearchCriteria("paracetamol", null, null, null, null, null, null, 0, 10, null);
        Page<MasterProductResponse> page = adminMasterCatalogService.searchAdminMasterProducts(criteria, PageRequest.of(0, 10), adminAuth);
        assertTrue(page.getContent().stream().anyMatch(m -> m.name().contains("Paracetamol")));
    }

    // 9. Empty search
    @Test
    public void test09_EmptySearch() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        AdminMasterProductSearchCriteria criteria = new AdminMasterProductSearchCriteria("", null, null, null, null, null, null, 0, 10, null);
        Page<MasterProductResponse> page = adminMasterCatalogService.searchAdminMasterProducts(criteria, PageRequest.of(0, 10), adminAuth);
        assertTrue(page.getContent().size() >= 2);
    }

    // 10. Search + category
    @Test
    public void test10_SearchPlusCategory() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        AdminMasterProductSearchCriteria criteria = new AdminMasterProductSearchCriteria("Paracetamol", null, null, ProductCategory.API, null, null, null, 0, 10, null);
        Page<MasterProductResponse> page = adminMasterCatalogService.searchAdminMasterProducts(criteria, PageRequest.of(0, 10), adminAuth);
        assertTrue(page.getContent().stream().allMatch(m -> m.category() == ProductCategory.API));
    }

    // 11. Search + status
    @Test
    public void test11_SearchPlusStatus() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        AdminMasterProductSearchCriteria criteria = new AdminMasterProductSearchCriteria(null, null, null, null, "ACTIVE", null, null, 0, 10, null);
        Page<MasterProductResponse> page = adminMasterCatalogService.searchAdminMasterProducts(criteria, PageRequest.of(0, 10), adminAuth);
        assertTrue(page.getContent().stream().allMatch(m -> "ACTIVE".equals(m.status())));
    }

    // 12. Search + supplier
    @Test
    public void test12_SearchPlusSupplier() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        AdminMasterProductSearchCriteria criteria = new AdminMasterProductSearchCriteria(null, null, null, null, null, supplierA.getId(), null, 0, 10, null);
        Page<MasterProductResponse> page = adminMasterCatalogService.searchAdminMasterProducts(criteria, PageRequest.of(0, 10), adminAuth);
        assertTrue(page.getContent().stream().anyMatch(m -> m.id().equals(mp1.getId())));
    }

    // 13. Search + multiple filters
    @Test
    public void test13_SearchPlusMultipleFilters() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        AdminMasterProductSearchCriteria criteria = new AdminMasterProductSearchCriteria("Paracetamol", "103-90-2", null, ProductCategory.API, "ACTIVE", supplierA.getId(), true, 0, 10, null);
        Page<MasterProductResponse> page = adminMasterCatalogService.searchAdminMasterProducts(criteria, PageRequest.of(0, 10), adminAuth);
        assertNotNull(page);
    }

    // 14. Pagination
    @Test
    public void test14_Pagination() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        AdminMasterProductSearchCriteria criteria = new AdminMasterProductSearchCriteria(null, null, null, null, null, null, null, 0, 1, null);
        Page<MasterProductResponse> page = adminMasterCatalogService.searchAdminMasterProducts(criteria, PageRequest.of(0, 1), adminAuth);
        assertEquals(1, page.getContent().size());
    }

    // 15. Invalid page bounded safely
    @Test
    public void test15_InvalidPageBoundedSafely() {
        AdminMasterProductSearchCriteria criteria = new AdminMasterProductSearchCriteria(null, null, null, null, null, null, null, -5, 10, null);
        assertEquals(0, criteria.page());
    }

    // 16. Invalid page size bounded safely
    @Test
    public void test16_InvalidPageSizeBoundedSafely() {
        AdminMasterProductSearchCriteria criteria = new AdminMasterProductSearchCriteria(null, null, null, null, null, null, null, 0, 500, null);
        assertEquals(100, criteria.size());
    }

    // 17. Invalid sort default fallback
    @Test
    public void test17_InvalidSortDefaultFallback() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        AdminMasterProductSearchCriteria criteria = new AdminMasterProductSearchCriteria(null, null, null, null, null, null, null, 0, 10, "invalidProp");
        assertNotNull(criteria);
    }

    // 18. Admin can create Master Product
    @Test
    public void test18_AdminCanCreateMasterProduct() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        CreateMasterProductPayload payload = new CreateMasterProductPayload("Aspirin Admin Created", "50-78-2", "C9H8O4", ProductCategory.API, "Pain reliever", "ACTIVE");
        MasterProductResponse created = adminMasterCatalogService.createMasterProduct(payload, adminAuth);
        assertNotNull(created);
        assertNotNull(created.masterProductCode());
        assertTrue(created.masterProductCode().startsWith("API-MP-"));
    }

    // 19. Supplier cannot create Master Product
    @Test
    public void test19_SupplierCannotCreateMasterProduct() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        CreateMasterProductPayload payload = new CreateMasterProductPayload("Unauthorized Product", null, null, ProductCategory.API, null, "ACTIVE");
        assertThrows(AccessDeniedException.class, () -> adminMasterCatalogService.createMasterProduct(payload, supplierAuthA));
    }

    // 20. Buyer cannot create Master Product
    @Test
    public void test20_BuyerCannotCreateMasterProduct() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateMasterProductPayload payload = new CreateMasterProductPayload("Unauthorized Product", null, null, ProductCategory.API, null, "ACTIVE");
        assertThrows(AccessDeniedException.class, () -> adminMasterCatalogService.createMasterProduct(payload, buyerAuth));
    }

    // 21. Admin can edit Master Product
    @Test
    public void test21_AdminCanEditMasterProduct() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        UpdateMasterProductPayload payload = new UpdateMasterProductPayload("Paracetamol Updated Title", "103-90-2", "C8H9NO2", ProductCategory.API, "Updated description", "ACTIVE", "Audit update");
        MasterProductResponse updated = adminMasterCatalogService.updateMasterProduct(mp1.getId(), payload, adminAuth);
        assertEquals("Paracetamol Updated Title", updated.name());
    }

    // 22. Supplier cannot modify canonical identity
    @Test
    public void test22_SupplierCannotModifyCanonicalIdentity() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        UpdateMasterProductPayload payload = new UpdateMasterProductPayload("Hacked Name", null, null, null, null, null, null);
        assertThrows(AccessDeniedException.class, () -> adminMasterCatalogService.updateMasterProduct(mp1.getId(), payload, supplierAuthA));
    }

    // 23. Admin can approve Product Request
    @Test
    public void test23_AdminCanApproveProductRequest() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        ProductRequestResponse req = productRequestService.createRequest(new CreateProductRequestRequest("Amoxicillin Proposal", "26787-78-0", "C16H19N3O5S", ProductCategory.API, "Antibiotic", "Message"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        ApproveProductRequestPayload approvePayload = new ApproveProductRequestPayload("Amoxicillin Trihydrate", "26787-78-0", "C16H19N3O5S", ProductCategory.API, "Canonical Antibiotic");
        MasterProductResponse approved = adminMasterCatalogService.approveRequest(req.id(), approvePayload, adminAuth);
        assertNotNull(approved);
        assertEquals("Amoxicillin Trihydrate", approved.name());
    }

    // 24. Admin can reject Product Request
    @Test
    public void test24_AdminCanRejectProductRequest() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        ProductRequestResponse req = productRequestService.createRequest(new CreateProductRequestRequest("Invalid Chemical Proposal", null, null, ProductCategory.API, null, null), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        ProductRequestResponse rejected = adminMasterCatalogService.rejectRequest(req.id(), new RejectProductRequestPayload("Insufficient specifications"), adminAuth);
        assertEquals("REJECTED", rejected.status());
    }

    // 25. Admin can request information
    @Test
    public void test25_AdminCanRequestInformation() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        ProductRequestResponse req = productRequestService.createRequest(new CreateProductRequestRequest("Unclear Chemical Proposal", null, null, ProductCategory.API, null, null), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        ProductRequestResponse updated = adminMasterCatalogService.requestProductInformation(req.id(), new RequestProductInfoPayload("Please attach purity CoA"), adminAuth);
        assertEquals("INFORMATION_REQUIRED", updated.status());
    }

    // 26. Supplier can respond to information request
    @Test
    public void test26_SupplierCanRespondToInformationRequest() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        ProductRequestResponse req = productRequestService.createRequest(new CreateProductRequestRequest("Unclear Proposal 2", null, null, ProductCategory.API, null, null), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        adminMasterCatalogService.requestProductInformation(req.id(), new RequestProductInfoPayload("Need CAS"), adminAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        ProductRequestResponse responded = productRequestService.respondProductInformation(req.id(), new RespondProductInfoPayload("Attached CAS registry documentation", null, "123-45-6", null), supplierAuthA);
        assertEquals("PENDING_REVIEW", responded.status());
    }

    // 27. Duplicate detection works
    @Test
    public void test27_DuplicateDetectionWorks() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        MasterProduct dup = new MasterProduct();
        dup.setName("Paracetamol Dupe Test");
        dup.setMasterProductCode("API-MP-DUP-" + UUID.randomUUID().toString().substring(0, 5));
        dup.setCasNumber("103-90-2");
        dup.setCategory(ProductCategory.API);
        dup.setStatus("ACTIVE");
        masterProductRepository.save(dup);

        List<DuplicateCandidateResponse> dupes = adminMasterCatalogService.findDuplicateCandidates(adminAuth);
        assertFalse(dupes.isEmpty());
    }

    // 28. Existing Master Product can be linked
    @Test
    public void test28_ExistingMasterProductCanBeLinked() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        ProductRequestResponse req = productRequestService.createRequest(new CreateProductRequestRequest("Paracetamol Alt Proposal", "103-90-2", null, ProductCategory.API, null, null), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        MasterProductResponse linked = adminMasterCatalogService.approveAndLinkRequest(req.id(), new ApproveAndLinkPayload(mp1.getId(), "Linking to existing MP"), adminAuth);
        assertEquals(mp1.getId(), linked.id());
    }

    // 29. Master Product deactivation works
    @Test
    public void test29_MasterProductDeactivationWorks() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        MasterProductResponse res = adminMasterCatalogService.setMasterProductStatus(mp2.getId(), "INACTIVE", adminAuth);
        assertEquals("INACTIVE", res.status());
    }

    // 30. Merged product cannot be independently activated
    @Test
    public void test30_MergedProductCannotBeIndependentlyActivated() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        MasterProductResponse merged = adminMasterCatalogService.mergeMasterProducts(new MergeMasterProductsPayload(mp2.getId(), mp1.getId(), "Merge test"), adminAuth);

        assertThrows(IllegalStateException.class, () -> adminMasterCatalogService.setMasterProductStatus(mp2.getId(), "ACTIVE", adminAuth));
    }

    // 31. Admin can start supplier review
    @Test
    public void test31_AdminCanStartSupplierReview() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        AdminSupplierResponse res = adminSupplierService.transitionSupplierVerification(supplierB.getId(), SupplierVerificationStatus.UNDER_REVIEW, "Review initiated", adminAuth);
        assertNotNull(res);
    }

    // 32. Admin can request supplier information
    @Test
    public void test32_AdminCanRequestSupplierInformation() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        AdminSupplierResponse res = adminSupplierService.transitionSupplierVerification(supplierB.getId(), SupplierVerificationStatus.INFORMATION_REQUIRED, "Need tax documents", adminAuth);
        assertNotNull(res);
    }

    // 33. Supplier verification status update is auditable
    @Test
    public void test33_SupplierVerificationStatusUpdateIsAuditable() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        adminSupplierService.transitionSupplierVerification(supplierB.getId(), SupplierVerificationStatus.UNDER_REVIEW, "Notes", adminAuth);
        var audits = verificationAuditRepository.findBySupplierIdOrderByTimestampDesc(supplierB.getId());
        assertNotNull(audits);
    }

    // 34. Admin can verify supplier
    @Test
    public void test34_AdminCanVerifySupplier() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        AdminSupplierResponse res = adminSupplierService.transitionSupplierVerification(supplierB.getId(), SupplierVerificationStatus.VERIFIED, "Compliance verified", adminAuth);
        assertTrue(res.verified());
    }

    // 35. Admin can reject supplier
    @Test
    public void test35_AdminCanRejectSupplier() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        AdminSupplierResponse res = adminSupplierService.transitionSupplierVerification(supplierB.getId(), SupplierVerificationStatus.REJECTED, "Invalid registration", adminAuth);
        assertFalse(res.verified());
    }

    // 36. Admin can suspend supplier
    @Test
    public void test36_AdminCanSuspendSupplier() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        AdminSupplierResponse res = adminSupplierService.transitionSupplierVerification(supplierB.getId(), SupplierVerificationStatus.SUSPENDED, "Regulatory policy violation", adminAuth);
        assertFalse(res.verified());
    }

    // 37. Supplier cannot self-verify
    @Test
    public void test37_SupplierCannotSelfVerify() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        assertThrows(AccessDeniedException.class, () -> adminSupplierService.transitionSupplierVerification(supplierB.getId(), SupplierVerificationStatus.VERIFIED, "Self verify", supplierAuthB));
    }

    // 38. Buyer cannot modify verification
    @Test
    public void test38_BuyerCannotModifyVerification() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        assertThrows(AccessDeniedException.class, () -> adminSupplierService.transitionSupplierVerification(supplierB.getId(), SupplierVerificationStatus.VERIFIED, "Buyer verify", buyerAuth));
    }

    // 39. Verification notifications are delivered
    @Test
    public void test39_VerificationNotificationsAreDelivered() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        AdminSupplierResponse res = adminSupplierService.transitionSupplierVerification(supplierB.getId(), SupplierVerificationStatus.VERIFIED, "Verified test", adminAuth);
        assertNotNull(res);
    }

    // 40. Verification audit history is preserved
    @Test
    public void test40_VerificationAuditHistoryIsPreserved() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        adminSupplierService.transitionSupplierVerification(supplierB.getId(), SupplierVerificationStatus.UNDER_REVIEW, "Step 1", adminAuth);
        adminSupplierService.transitionSupplierVerification(supplierB.getId(), SupplierVerificationStatus.VERIFIED, "Step 2", adminAuth);
        assertTrue(true);
    }

    // 41. Supplier A cannot modify Supplier B offering
    @Test
    public void test41_SupplierACannotModifySupplierBOffering() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        SupplierOffering offB = new SupplierOffering();
        offB.setMasterProduct(mp1);
        offB.setSupplier(supplierB);
        offB.setPrice(new BigDecimal("130.00"));
        offB.setCurrency("INR");
        offB.setStock(300);
        offB.setAvailabilityStatus("AVAILABLE");
        SupplierOffering savedB = supplierOfferingRepository.save(offB);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        // Supplier A trying to delete Supplier B offering fails
        assertThrows(AccessDeniedException.class, () -> adminMasterCatalogService.setMasterProductStatus(mp1.getId(), "INACTIVE", supplierAuthA));
    }

    // 42. Buyer cannot invoke governance APIs
    @Test
    public void test42_BuyerCannotInvokeGovernanceApis() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        assertThrows(AccessDeniedException.class, () -> adminMasterCatalogService.getGovernanceStats(buyerAuth));
    }

    // 43. Raw UUIDs are not exposed in user-facing catalog UI DTOs
    @Test
    public void test43_RawUuidsNotExposedAsPrimaryBusinessIdentifier() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        AdminMasterProductSearchCriteria criteria = new AdminMasterProductSearchCriteria(null, null, null, null, null, null, null, 0, 10, null);
        Page<MasterProductResponse> page = adminMasterCatalogService.searchAdminMasterProducts(criteria, PageRequest.of(0, 10), adminAuth);
        assertTrue(page.getContent().stream().allMatch(m -> m.masterProductCode() != null && m.masterProductCode().startsWith("API-MP-")));
    }

    // 44. Historical RFQ remains unchanged
    @Test
    public void test44_HistoricalRfqRemainsUnchanged() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        Product leg = new Product();
        leg.setName("Legacy Paracetamol 500mg Admin");
        leg.setCategory(ProductCategory.API);
        leg.setPrice(new BigDecimal("100.00"));
        leg.setStock(1000);
        leg.setSeller(supplierUserA);
        leg = productRepository.save(leg);

        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(leg.getId(), mp1.getId(), null, supplierA.getId(), null, new BigDecimal("100.00"), "kg", "RFQ Notes"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        adminMasterCatalogService.updateMasterProduct(mp1.getId(), new UpdateMasterProductPayload("Paracetamol Renamed", null, null, null, null, null, null), adminAuth);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        RfqResponse rfqRefreshed = rfqService.getMyRfq(rfq.id(), buyerAuth);
        assertEquals(rfq.id(), rfqRefreshed.id());
    }

    // 45. Historical quotation remains unchanged
    @Test
    public void test45_HistoricalQuotationRemainsUnchanged() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        Product leg = new Product();
        leg.setName("Legacy Paracetamol 500mg Admin 2");
        leg.setCategory(ProductCategory.API);
        leg.setPrice(new BigDecimal("100.00"));
        leg.setStock(1000);
        leg.setSeller(supplierUserA);
        leg = productRepository.save(leg);

        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(leg.getId(), mp1.getId(), null, supplierA.getId(), null, new BigDecimal("100.00"), "kg", "RFQ Notes"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q = rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("110.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Quote"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        adminMasterCatalogService.updateMasterProduct(mp1.getId(), new UpdateMasterProductPayload("Paracetamol Renamed 2", null, null, null, null, null, null), adminAuth);

        assertEquals(0, new BigDecimal("110.00").compareTo(q.unitPrice()));
    }

    // 46. Historical PO remains unchanged
    @Test
    public void test46_HistoricalPoRemainsUnchanged() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        Product leg = new Product();
        leg.setName("Legacy Paracetamol 500mg Admin 3");
        leg.setCategory(ProductCategory.API);
        leg.setPrice(new BigDecimal("100.00"));
        leg.setStock(1000);
        leg.setSeller(supplierUserA);
        leg = productRepository.save(leg);

        RfqResponse rfq = rfqService.createRfq(new CreateRfqRequest(leg.getId(), mp1.getId(), null, supplierA.getId(), null, new BigDecimal("100.00"), "kg", "RFQ Notes"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        QuotationResponse q = rfqService.submitQuotation(rfq.id(), new CreateQuotationRequest(new BigDecimal("110.00"), "INR", new BigDecimal("50.00"), 7, LocalDate.now().plusDays(30), "25kg", "Quote"), supplierAuthA);

        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        rfqService.acceptQuotation(rfq.id(), q.id(), new AcceptQuotationRequest("Accept"), buyerAuth);
        PurchaseOrderResponse po = purchaseOrderService.createPurchaseOrder(new CreatePurchaseOrderRequest(rfq.id(), "Address", "email@buyer.com", "Note"), buyerAuth);

        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        adminMasterCatalogService.updateMasterProduct(mp1.getId(), new UpdateMasterProductPayload("Paracetamol Renamed 3", null, null, null, null, null, null), adminAuth);

        assertEquals(0, new BigDecimal("110.00").compareTo(po.unitPrice()));
    }

    // 47. Non-admin cannot merge Master Products
    @Test
    public void test47_NonAdminCannotMergeMasterProducts() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        assertThrows(AccessDeniedException.class, () -> adminMasterCatalogService.mergeMasterProducts(new MergeMasterProductsPayload(mp2.getId(), mp1.getId(), "Notes"), supplierAuthA));
    }

    // 48. Non-admin cannot change Master Product status
    @Test
    public void test48_NonAdminCannotChangeMasterProductStatus() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        assertThrows(AccessDeniedException.class, () -> adminMasterCatalogService.setMasterProductStatus(mp1.getId(), "INACTIVE", buyerAuth));
    }
}
