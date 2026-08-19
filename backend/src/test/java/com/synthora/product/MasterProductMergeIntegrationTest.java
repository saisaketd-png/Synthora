package com.synthora.product;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.product.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
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
public class MasterProductMergeIntegrationTest {

    @Autowired
    private AdminMasterCatalogService adminMasterCatalogService;

    @Autowired
    private MasterProductService masterProductService;

    @Autowired
    private SupplierOfferingService supplierOfferingService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private MasterProductRepository masterProductRepository;

    @Autowired
    private MasterProductCodeGenerator codeGenerator;

    private User adminUser;
    private Authentication adminAuth;

    private User supplierUserA;
    private Supplier supplierA;
    private Authentication authA;

    private MasterProductResponse masterProductTarget;
    private MasterProductResponse masterProductSource;

    @BeforeEach
    public void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        adminUser = new User();
        adminUser.setName("Merge Admin " + suffix);
        adminUser.setEmail("admin_merge_" + suffix + "@synthora.com");
        adminUser.setPasswordHash("hash");
        adminUser.setRole(UserRole.ADMIN);
        adminUser = userRepository.save(adminUser);
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null);

        supplierUserA = new User();
        supplierUserA.setName("Supplier A " + suffix);
        supplierUserA.setEmail("sup_a_merge_" + suffix + "@synthora.com");
        supplierUserA.setPasswordHash("hash");
        supplierUserA.setRole(UserRole.SUPPLIER);
        supplierUserA = userRepository.save(supplierUserA);

        supplierA = new Supplier();
        supplierA.setName("Supplier A Corp " + suffix);
        supplierA.setSlug("sup-a-merge-" + suffix);
        supplierA.setUser(supplierUserA);
        supplierA = supplierRepository.save(supplierA);

        authA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null);

        // Target Master Product
        masterProductTarget = masterProductService.createMasterProduct(new CreateMasterProductRequest(
                "Paracetamol Canonical",
                "103-90-2",
                "C8H9NO2",
                ProductCategory.API,
                "Target canonical entry"
        ));

        // Source Master Product (Duplicate entry created prior to CAS uniqueness constraint enforcement)
        MasterProduct mpSource = new MasterProduct();
        mpSource.setName("Paracetamol USP Duplicate");
        mpSource.setMasterProductCode(codeGenerator.generateMasterProductCode(ProductCategory.API));
        mpSource.setCasNumber("103-90-2");
        mpSource.setMolecularFormula("C8H9NO2");
        mpSource.setCategory(ProductCategory.API);
        mpSource.setDescription("Source duplicate entry");
        mpSource.setStatus("ACTIVE");
        mpSource = masterProductRepository.save(mpSource);

        masterProductSource = new MasterProductResponse(
                mpSource.getId(),
                mpSource.getMasterProductCode(),
                mpSource.getName(),
                mpSource.getCasNumber(),
                mpSource.getMolecularFormula(),
                mpSource.getCategory(),
                mpSource.getDescription(),
                mpSource.getStatus(),
                0,
                mpSource.getCreatedAt(),
                mpSource.getUpdatedAt()
        );
    }

    // 1. Detect Duplicate Candidates
    @Test
    public void test01_DetectDuplicateCandidates() {
        List<DuplicateCandidateResponse> dupes = adminMasterCatalogService.findDuplicateCandidates(adminAuth);
        assertFalse(dupes.isEmpty());
        assertTrue(dupes.stream().anyMatch(d -> d.reason().contains("103-90-2")));
    }

    // 2. Controlled Merge Reassigns Offerings and Marks Source as MERGED
    @Test
    public void test02_ControlledMergeReassignsOfferingsAndMarksSourceMerged() {
        // Add offering on Source
        SupplierOfferingResponse offSource = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                masterProductSource.id(),
                new BigDecimal("120.00"),
                "INR",
                1000,
                new BigDecimal("99.80"),
                "USP",
                new BigDecimal("25.00"),
                "25kg Drum",
                7,
                true,
                true,
                true,
                "AVAILABLE"
        ), authA);

        // Execute merge of Source into Target
        MergeMasterProductsPayload mergePayload = new MergeMasterProductsPayload(
                masterProductSource.id(),
                masterProductTarget.id(),
                "Merging duplicate CAS entries"
        );

        MasterProductResponse mergedTarget = adminMasterCatalogService.mergeMasterProducts(mergePayload, adminAuth);

        assertEquals(masterProductTarget.id(), mergedTarget.id());

        // Verify Source status is MERGED
        MasterProductResponse updatedSource = masterProductService.getMasterProductById(masterProductSource.id());
        assertEquals("MERGED", updatedSource.status());

        // Verify offering moved to Target
        List<SupplierOfferingResponse> targetOfferings = supplierOfferingService.getOfferingsForMasterProduct(masterProductTarget.id());
        assertEquals(1, targetOfferings.size());
        assertEquals(offSource.id(), targetOfferings.get(0).id());
    }

    // 3. Repeat Merge on Already Merged Source Fails
    @Test
    public void test03_RepeatMergeFails() {
        MergeMasterProductsPayload mergePayload = new MergeMasterProductsPayload(
                masterProductSource.id(),
                masterProductTarget.id(),
                "First merge"
        );
        adminMasterCatalogService.mergeMasterProducts(mergePayload, adminAuth);

        // Attempting second merge on already merged source must fail
        assertThrows(IllegalStateException.class, () -> adminMasterCatalogService.mergeMasterProducts(mergePayload, adminAuth));
    }
}
