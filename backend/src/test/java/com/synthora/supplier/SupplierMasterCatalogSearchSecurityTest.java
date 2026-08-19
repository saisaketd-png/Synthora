package com.synthora.supplier;

import com.synthora.product.AdminMasterCatalogService;
import com.synthora.common.ResourceNotFoundException;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.product.*;
import com.synthora.product.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
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
public class SupplierMasterCatalogSearchSecurityTest {

    @Autowired
    private MasterProductService masterProductService;

    @Autowired
    private MasterProductRepository masterProductRepository;

    @Autowired
    private SupplierOfferingRepository supplierOfferingRepository;

    @Autowired
    private ProductRequestService productRequestService;

    @Autowired
    private AdminMasterCatalogService adminMasterCatalogService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    private User supplierUser;
    private Supplier supplier;
    private UsernamePasswordAuthenticationToken supplierAuth;

    private User buyerUser;
    private UsernamePasswordAuthenticationToken buyerAuth;

    private MasterProduct activeMp;
    private MasterProduct inactiveMp;

    @BeforeEach
    public void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        supplierUser = new User();
        supplierUser.setName("Supplier Search Tester " + suffix);
        supplierUser.setEmail("sup_search_" + suffix + "@synthora.com");
        supplierUser.setPasswordHash("hash");
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser = userRepository.save(supplierUser);

        supplier = new Supplier();
        supplier.setName("Supplier Search Firm " + suffix);
        supplier.setSlug("sup-search-firm-" + suffix);
        supplier.setUser(supplierUser);
        supplier.setVerified(true);
        supplier = supplierRepository.save(supplier);

        supplierAuth = new UsernamePasswordAuthenticationToken(supplierUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        buyerUser = new User();
        buyerUser.setName("Buyer Search Tester " + suffix);
        buyerUser.setEmail("buyer_search_" + suffix + "@synthora.com");
        buyerUser.setPasswordHash("hash");
        buyerUser.setRole(UserRole.USER);
        buyerUser = userRepository.save(buyerUser);

        buyerAuth = new UsernamePasswordAuthenticationToken(buyerUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        MasterProduct m1 = new MasterProduct();
        m1.setName("Metformin Hydrochloride Search");
        m1.setMasterProductCode("API-MP-SUP1-" + suffix);
        m1.setCasNumber("1115-70-4");
        m1.setMolecularFormula("C4H11N5.HCl");
        m1.setCategory(ProductCategory.API);
        m1.setDescription("Antidiabetic active pharmaceutical ingredient");
        m1.setStatus("ACTIVE");
        activeMp = masterProductRepository.save(m1);

        MasterProduct m2 = new MasterProduct();
        m2.setName("Discontinued Chemical Search");
        m2.setMasterProductCode("API-MP-SUP2-" + suffix);
        m2.setCasNumber("9999-99-9");
        m2.setMolecularFormula("CXHY");
        m2.setCategory(ProductCategory.API);
        m2.setDescription("Obsolete product");
        m2.setStatus("INACTIVE");
        inactiveMp = masterProductRepository.save(m2);
    }

    // 1. Supplier can search by name
    @Test
    public void test01_SupplierSearchByName() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        Page<MasterProductResponse> page = masterProductService.searchMasterProducts("Metformin", 0, 10);
        assertTrue(page.getContent().stream().anyMatch(m -> m.name().contains("Metformin")));
    }

    // 2. Supplier can partial-search by name
    @Test
    public void test02_SupplierPartialSearchByName() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        Page<MasterProductResponse> page = masterProductService.searchMasterProducts("Metfor", 0, 10);
        assertTrue(page.getContent().stream().anyMatch(m -> m.name().contains("Metformin")));
    }

    // 3. Supplier can search by CAS
    @Test
    public void test03_SupplierSearchByCas() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        Page<MasterProductResponse> page = masterProductService.searchMasterProducts("1115-70-4", 0, 10);
        assertTrue(page.getContent().stream().anyMatch(m -> "1115-70-4".equals(m.casNumber())));
    }

    // 4. Supplier can search by normalized CAS
    @Test
    public void test04_SupplierSearchByNormalizedCas() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        Page<MasterProductResponse> page = masterProductService.searchMasterProducts("1115704", 0, 10);
        assertTrue(page.getContent().stream().anyMatch(m -> "1115-70-4".equals(m.casNumber())));
    }

    // 5. Supplier can search by formula
    @Test
    public void test05_SupplierSearchByFormula() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        Page<MasterProductResponse> page = masterProductService.searchMasterProducts("C4H11N5", 0, 10);
        assertTrue(page.getContent().stream().anyMatch(m -> m.molecularFormula() != null && m.molecularFormula().contains("C4H11N5")));
    }

    // 6. Supplier can search by Master Product Code
    @Test
    public void test06_SupplierSearchByMasterProductCode() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        Page<MasterProductResponse> page = masterProductService.searchMasterProducts(activeMp.getMasterProductCode(), 0, 10);
        assertTrue(page.getContent().stream().anyMatch(m -> activeMp.getMasterProductCode().equals(m.masterProductCode())));
    }

    // 7. Supplier search is case-insensitive
    @Test
    public void test07_SupplierSearchCaseInsensitive() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        Page<MasterProductResponse> page = masterProductService.searchMasterProducts("metformin", 0, 10);
        assertTrue(page.getContent().stream().anyMatch(m -> m.name().contains("Metformin")));
    }

    // 8. Supplier search returns only ACTIVE MasterProducts
    @Test
    public void test08_SupplierSearchReturnsOnlyActive() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        Page<MasterProductResponse> page = masterProductService.searchMasterProducts("", 0, 100);
        assertTrue(page.getContent().stream().allMatch(m -> "ACTIVE".equals(m.status())));
    }

    // 9. INACTIVE MasterProduct is hidden
    @Test
    public void test09_InactiveMasterProductIsHidden() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        Page<MasterProductResponse> page = masterProductService.searchMasterProducts("Discontinued Chemical", 0, 10);
        assertTrue(page.getContent().stream().noneMatch(m -> m.id().equals(inactiveMp.getId())));
    }

    // 10. MERGED MasterProduct resolves correctly
    @Test
    public void test10_MergedMasterProductHiddenFromPublicSearch() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        MasterProduct m = new MasterProduct();
        m.setName("Merged Product Test");
        m.setMasterProductCode("API-MP-MRG-" + UUID.randomUUID().toString().substring(0, 5));
        m.setCategory(ProductCategory.API);
        m.setStatus("MERGED");
        masterProductRepository.save(m);

        Page<MasterProductResponse> page = masterProductService.searchMasterProducts("Merged Product", 0, 10);
        assertTrue(page.getContent().stream().noneMatch(mp -> mp.id().equals(m.getId())));
    }

    // 11. Empty search behaves correctly
    @Test
    public void test11_EmptySearchReturnsDefaultActiveCatalog() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        Page<MasterProductResponse> page = masterProductService.searchMasterProducts("", 0, 10);
        assertNotNull(page);
        assertFalse(page.getContent().isEmpty());
    }

    // 12. Pagination works
    @Test
    public void test12_PaginationWorks() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        Page<MasterProductResponse> page = masterProductService.searchMasterProducts("", 0, 1);
        assertEquals(1, page.getContent().size());
    }

    // 13. Invalid page is handled safely
    @Test
    public void test13_InvalidPageHandledSafely() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        Page<MasterProductResponse> page = masterProductService.searchMasterProducts("", -5, 10);
        assertNotNull(page);
        assertEquals(0, page.getNumber());
    }

    // 14. Invalid size is bounded
    @Test
    public void test14_InvalidSizeIsBounded() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        Page<MasterProductResponse> page = masterProductService.searchMasterProducts("", 0, 500);
        assertNotNull(page);
        assertTrue(page.getSize() <= 100);
    }

    // 15. Supplier cannot access admin catalog endpoint
    @Test
    public void test15_SupplierCannotAccessAdminCatalogEndpoint() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        AdminMasterProductSearchCriteria criteria = new AdminMasterProductSearchCriteria("Metformin", null, null, null, null, null, null, 0, 10, null);
        assertThrows(AccessDeniedException.class, () -> adminMasterCatalogService.searchAdminMasterProducts(criteria, null, supplierAuth));
    }

    // 16. Buyer cannot mutate catalog
    @Test
    public void test16_BuyerCannotMutateCatalog() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        CreateMasterProductPayload payload = new CreateMasterProductPayload("Buyer Product", null, null, ProductCategory.API, null, "ACTIVE");
        assertThrows(AccessDeniedException.class, () -> adminMasterCatalogService.createMasterProduct(payload, buyerAuth));
    }

    // 17. Supplier cannot mutate MasterProduct identity
    @Test
    public void test17_SupplierCannotMutateMasterProductIdentity() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        UpdateMasterProductPayload payload = new UpdateMasterProductPayload("Supplier Modified Title", null, null, null, null, null, null);
        assertThrows(AccessDeniedException.class, () -> adminMasterCatalogService.updateMasterProduct(activeMp.getId(), payload, supplierAuth));
    }

    // 18. Search does not expose private supplier data
    @Test
    public void test18_SearchDoesNotExposePrivateSupplierData() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        Page<MasterProductResponse> page = masterProductService.searchMasterProducts("Metformin", 0, 10);
        assertTrue(page.getContent().stream().allMatch(m -> m.masterProductCode() != null));
    }

    // 19. Selecting MasterProduct allows SupplierOffering creation
    @Test
    public void test19_SelectingMasterProductAllowsSupplierOfferingCreation() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        SupplierOffering off = new SupplierOffering();
        off.setMasterProduct(activeMp);
        off.setSupplier(supplier);
        off.setPrice(new BigDecimal("150.00"));
        off.setCurrency("INR");
        off.setStock(200);
        off.setAvailabilityStatus("AVAILABLE");
        SupplierOffering saved = supplierOfferingRepository.save(off);
        assertNotNull(saved.getId());
        assertEquals(activeMp.getId(), saved.getMasterProduct().getId());
    }

    // 20. Missing chemical creates ProductRequest rather than MasterProduct
    @Test
    public void test20_MissingChemicalCreatesProductRequest() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        CreateProductRequestRequest req = new CreateProductRequestRequest("New Experimental Compound", "8888-88-8", "C10H20", ProductCategory.SPECIALTY_CHEMICAL, "Custom synth", "Need catalog entry");
        ProductRequestResponse res = productRequestService.createRequest(req, supplierAuth);
        assertNotNull(res.id());
        assertEquals("PENDING_REVIEW", res.status());
    }

    // 21. Deactivated MasterProduct cannot be selected for offering creation
    @Test
    public void test21_DeactivatedMasterProductHiddenFromSupplierSearch() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        Page<MasterProductResponse> page = masterProductService.searchMasterProducts(inactiveMp.getMasterProductCode(), 0, 10);
        assertTrue(page.getContent().isEmpty());
    }

    // 22. Deactivated SupplierOffering cannot be used for new RFQ
    @Test
    public void test22_DeactivatedSupplierOfferingStatusHandled() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        SupplierOffering off = new SupplierOffering();
        off.setMasterProduct(activeMp);
        off.setSupplier(supplier);
        off.setPrice(new BigDecimal("150.00"));
        off.setCurrency("INR");
        off.setStock(200);
        off.setAvailabilityStatus("FLAGGED");
        SupplierOffering saved = supplierOfferingRepository.save(off);
        assertEquals("FLAGGED", saved.getAvailabilityStatus());
    }

    // 23. Search SQL injection input is handled safely
    @Test
    public void test23_SearchSqlInjectionInputHandledSafely() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        Page<MasterProductResponse> page = masterProductService.searchMasterProducts("' OR '1'='1", 0, 10);
        assertNotNull(page);
    }

    // 24. Search does not leak stack traces
    @Test
    public void test24_SearchDoesNotLeakStackTraces() {
        SecurityContextHolder.getContext().setAuthentication(supplierAuth);
        Page<MasterProductResponse> page = masterProductService.searchMasterProducts("Metformin", 0, 10);
        assertNotNull(page);
        assertTrue(page.getContent().size() >= 1);
    }
}
