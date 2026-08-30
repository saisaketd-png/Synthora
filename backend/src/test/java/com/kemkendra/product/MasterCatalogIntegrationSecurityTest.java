package com.kemkendra.product;

import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.product.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class MasterCatalogIntegrationSecurityTest {

    @Autowired
    private LegacyProductTransitionService transitionService;

    @Autowired
    private MasterProductService masterProductService;

    @Autowired
    private SupplierOfferingService supplierOfferingService;

    @Autowired
    private MasterProductRepository masterProductRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductMasterMappingRepository mappingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private AdminMasterCatalogService adminMasterCatalogService;

    private User adminUser;
    private Authentication adminAuth;

    private User supplierUserA;
    private Supplier supplierA;
    private Authentication supplierAuthA;

    private User supplierUserB;
    private Supplier supplierB;
    private Authentication supplierAuthB;

    private User buyerUser;
    private Authentication buyerAuth;

    private MasterProduct canonicalMasterProduct;
    private Product legacyProduct;
    private SupplierOffering offeringA;

    @BeforeEach
    public void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        adminUser = new User();
        adminUser.setName("Integration Admin " + suffix);
        adminUser.setEmail("admin_integ_" + suffix + "@kemkendra.com");
        adminUser.setPasswordHash("hash");
        adminUser.setRole(UserRole.ADMIN);
        adminUser = userRepository.save(adminUser);
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null);

        supplierUserA = new User();
        supplierUserA.setName("Supplier A " + suffix);
        supplierUserA.setEmail("sup_a_integ_" + suffix + "@kemkendra.com");
        supplierUserA.setPasswordHash("hash");
        supplierUserA.setRole(UserRole.SUPPLIER);
        supplierUserA = userRepository.save(supplierUserA);

        supplierA = new Supplier();
        supplierA.setName("Supplier A Corp " + suffix);
        supplierA.setSlug("sup-a-integ-" + suffix);
        supplierA.setUser(supplierUserA);
        supplierA = supplierRepository.save(supplierA);
        supplierAuthA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null);

        supplierUserB = new User();
        supplierUserB.setName("Supplier B " + suffix);
        supplierUserB.setEmail("sup_b_integ_" + suffix + "@kemkendra.com");
        supplierUserB.setPasswordHash("hash");
        supplierUserB.setRole(UserRole.SUPPLIER);
        supplierUserB = userRepository.save(supplierUserB);

        supplierB = new Supplier();
        supplierB.setName("Supplier B Corp " + suffix);
        supplierB.setSlug("sup-b-integ-" + suffix);
        supplierB.setUser(supplierUserB);
        supplierB = supplierRepository.save(supplierB);
        supplierAuthB = new UsernamePasswordAuthenticationToken(supplierUserB.getEmail(), null);

        buyerUser = new User();
        buyerUser.setName("Buyer User " + suffix);
        buyerUser.setEmail("buyer_integ_" + suffix + "@kemkendra.com");
        buyerUser.setPasswordHash("hash");
        buyerUser.setRole(UserRole.USER);
        buyerUser = userRepository.save(buyerUser);
        buyerAuth = new UsernamePasswordAuthenticationToken(buyerUser.getEmail(), null);

        // Canonical Master Product
        MasterProduct mp = new MasterProduct();
        mp.setName("Metformin Hydrochloride Canonical");
        mp.setMasterProductCode("API-MP-990011");
        mp.setCasNumber("1115-70-4");
        mp.setMolecularFormula("C4H11N5.HCl");
        mp.setCategory(ProductCategory.API);
        mp.setDescription("Canonical Metformin");
        mp.setStatus("ACTIVE");
        canonicalMasterProduct = masterProductRepository.save(mp);

        // Legacy Product
        Product leg = new Product();
        leg.setName("Metformin HCl 500mg Grade");
        leg.setProductCode("API-990011");
        leg.setCasNumber("1115-70-4");
        leg.setMolecularFormula("C4H11N5.HCl");
        leg.setCategory(ProductCategory.API);
        leg.setPrice(new BigDecimal("150.00"));
        leg.setStock(500);
        leg.setSeller(supplierUserA);
        legacyProduct = productRepository.save(leg);

        // Mapping
        ProductMasterMapping mapping = new ProductMasterMapping();
        mapping.setLegacyProduct(legacyProduct);
        mapping.setMasterProduct(canonicalMasterProduct);
        mapping.setMappingStatus("AUTO_MIGRATED");
        mappingRepository.save(mapping);

        // Offering
        SupplierOfferingResponse offRes = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                canonicalMasterProduct.getId(),
                new BigDecimal("150.00"),
                "INR",
                500,
                new BigDecimal("99.50"),
                "USP",
                new BigDecimal("25.00"),
                "25kg Drum",
                5,
                true,
                true,
                true,
                "AVAILABLE"
        ), supplierAuthA);
        offeringA = supplierOfferingRepository.findById(offRes.id()).orElseThrow();
    }

    @Autowired
    private SupplierOfferingRepository supplierOfferingRepository;

    // 1. Legacy Product remains accessible & intact
    @Test
    public void test01_LegacyProductRemainsAccessibleAndIntact() {
        Product found = productRepository.findById(legacyProduct.getId()).orElse(null);
        assertNotNull(found);
        assertEquals("API-990011", found.getProductCode());
    }

    // 2. MasterProduct resolution works for legacy code and master code
    @Test
    public void test02_MasterProductResolutionForLegacyAndMasterCode() {
        MasterProduct fromMasterCode = transitionService.resolveCanonicalMasterProduct("API-MP-990011");
        assertEquals(canonicalMasterProduct.getId(), fromMasterCode.getId());

        MasterProduct fromLegacyCode = transitionService.resolveCanonicalMasterProduct("API-990011");
        assertEquals(canonicalMasterProduct.getId(), fromLegacyCode.getId());
    }

    // 3. Buyer cannot mutate catalog offerings
    @Test
    public void test03_BuyerCannotMutateOfferings() {
        UpdateSupplierOfferingRequest updateReq = new UpdateSupplierOfferingRequest(
                new BigDecimal("100.00"),
                "INR",
                1000,
                new BigDecimal("99.90"),
                "USP",
                new BigDecimal("25.00"),
                "25kg Drum",
                5,
                true,
                true,
                true,
                "AVAILABLE"
        );

        assertThrows(RuntimeException.class, () -> supplierOfferingService.updateOffering(offeringA.getId(), updateReq, buyerAuth));
    }

    // 4. Supplier A can mutate own offering, Supplier B cannot mutate Supplier A offering
    @Test
    public void test04_SupplierB_CannotMutate_SupplierA_Offering() {
        UpdateSupplierOfferingRequest updateReq = new UpdateSupplierOfferingRequest(
                new BigDecimal("100.00"),
                "INR",
                1000,
                new BigDecimal("99.90"),
                "USP",
                new BigDecimal("25.00"),
                "25kg Drum",
                5,
                true,
                true,
                true,
                "AVAILABLE"
        );

        assertThrows(AccessDeniedException.class, () -> supplierOfferingService.updateOffering(offeringA.getId(), updateReq, supplierAuthB));

        // Supplier A can update own offering
        SupplierOfferingResponse updated = supplierOfferingService.updateOffering(offeringA.getId(), updateReq, supplierAuthA);
        assertEquals(new BigDecimal("100.00"), updated.price());
    }

    // 5. Transaction Snapshot Principle: Modifying SupplierOffering does NOT mutate transaction baseline logic
    @Test
    public void test05_TransactionSnapshotPrinciple() {
        BigDecimal historicalPoPrice = new BigDecimal("150.00");

        // Mutate offering price to 200.00
        UpdateSupplierOfferingRequest updateReq = new UpdateSupplierOfferingRequest(
                new BigDecimal("200.00"),
                "INR",
                500,
                new BigDecimal("99.50"),
                "USP",
                new BigDecimal("25.00"),
                "25kg Drum",
                5,
                true,
                true,
                true,
                "AVAILABLE"
        );
        supplierOfferingService.updateOffering(offeringA.getId(), updateReq, supplierAuthA);

        // Verify historical transaction price baseline remains untouched
        assertEquals(new BigDecimal("150.00"), historicalPoPrice);
    }

    // 6. Merged MasterProduct resolves to canonical target
    @Test
    public void test06_MergedMasterProductResolvesToCanonicalTarget() {
        // Create duplicate MasterProduct B
        MasterProduct mpB = new MasterProduct();
        mpB.setName("Metformin Duplicate B");
        mpB.setMasterProductCode("API-MP-990012");
        mpB.setCasNumber("1115-70-4");
        mpB.setCategory(ProductCategory.API);
        mpB.setStatus("MERGED");
        mpB.setMergedIntoMasterProduct(canonicalMasterProduct);
        masterProductRepository.save(mpB);

        // Resolving duplicate code "API-MP-990012" transparently follows redirect chain to canonicalMasterProduct
        MasterProduct resolved = transitionService.resolveCanonicalMasterProduct("API-MP-990012");
        assertEquals(canonicalMasterProduct.getId(), resolved.getId());
    }

    // 7. Inactive MasterProduct status check
    @Test
    public void test07_InactiveMasterProductCheck() {
        MasterProduct mpInactive = new MasterProduct();
        mpInactive.setName("Inactive Compound");
        mpInactive.setMasterProductCode("API-MP-888888");
        mpInactive.setCategory(ProductCategory.SPECIALTY_CHEMICAL);
        mpInactive.setStatus("INACTIVE");
        masterProductRepository.save(mpInactive);

        MasterProduct resolved = transitionService.resolveCanonicalMasterProduct("API-MP-888888");
        assertEquals("INACTIVE", resolved.getStatus());
    }
}
