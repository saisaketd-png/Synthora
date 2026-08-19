package com.synthora.product;

import com.synthora.common.ResourceNotFoundException;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.product.dto.*;
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
public class SupplierOfferingManagementTest {

    @Autowired
    private MasterProductService masterProductService;

    @Autowired
    private SupplierOfferingService supplierOfferingService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    private User supplierUserA;
    private Supplier supplierA;
    private Authentication authA;

    private User supplierUserB;
    private Supplier supplierB;
    private Authentication authB;

    private MasterProductResponse masterParacetamol;

    @BeforeEach
    public void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        supplierUserA = new User();
        supplierUserA.setName("Supplier A " + suffix);
        supplierUserA.setEmail("sup_a_" + suffix + "@test.com");
        supplierUserA.setPasswordHash("hash");
        supplierUserA.setRole(UserRole.SUPPLIER);
        supplierUserA = userRepository.save(supplierUserA);

        supplierA = new Supplier();
        supplierA.setName("Pharma A " + suffix);
        supplierA.setSlug("pharma-a-" + suffix);
        supplierA.setUser(supplierUserA);
        supplierA = supplierRepository.save(supplierA);

        authA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null);

        supplierUserB = new User();
        supplierUserB.setName("Supplier B " + suffix);
        supplierUserB.setEmail("sup_b_" + suffix + "@test.com");
        supplierUserB.setPasswordHash("hash");
        supplierUserB.setRole(UserRole.SUPPLIER);
        supplierUserB = userRepository.save(supplierUserB);

        supplierB = new Supplier();
        supplierB.setName("Chem B " + suffix);
        supplierB.setSlug("chem-b-" + suffix);
        supplierB.setUser(supplierUserB);
        supplierB = supplierRepository.save(supplierB);

        authB = new UsernamePasswordAuthenticationToken(supplierUserB.getEmail(), null);

        // Seed Master Product
        masterParacetamol = masterProductService.createMasterProduct(new CreateMasterProductRequest(
                "Paracetamol Fine Powder",
                "103-90-2",
                "C8H9NO2",
                ProductCategory.API,
                "Canonical Paracetamol entry"
        ));
    }

    // 1. Search Master Catalog
    @Test
    public void test01_SearchMasterCatalogByNameAndCas() {
        var resultsByName = masterProductService.searchMasterProducts("Paracetamol", 0, 10);
        assertTrue(resultsByName.getTotalElements() > 0);

        List<MasterProductResponse> resultsByCas = masterProductService.getMasterProductsByCas("103-90-2");
        assertFalse(resultsByCas.isEmpty());
        assertEquals("Paracetamol Fine Powder", resultsByCas.get(0).name());
    }

    // 2. Add Supplier Offering with INR Default Currency
    @Test
    public void test02_AddSupplierOfferingWithInrDefault() {
        CreateSupplierOfferingRequest req = new CreateSupplierOfferingRequest(
                masterParacetamol.id(),
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
        );

        SupplierOfferingResponse offering = supplierOfferingService.createOffering(req, authA);

        assertNotNull(offering.id());
        assertEquals("INR", offering.currency());
        assertEquals(supplierA.getId(), offering.supplierId());
        assertEquals(masterParacetamol.id(), offering.masterProductId());
    }

    // 3. Prevent Duplicate Offering for Same Supplier & Master Product
    @Test
    public void test03_PreventDuplicateOffering() {
        CreateSupplierOfferingRequest req1 = new CreateSupplierOfferingRequest(
                masterParacetamol.id(),
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
        );
        supplierOfferingService.createOffering(req1, authA);

        CreateSupplierOfferingRequest req2 = new CreateSupplierOfferingRequest(
                masterParacetamol.id(),
                new BigDecimal("125.00"),
                "INR",
                500,
                new BigDecimal("99.50"),
                "EP",
                new BigDecimal("50.00"),
                "50kg Bag",
                5,
                true,
                true,
                true,
                "AVAILABLE"
        );

        assertThrows(IllegalStateException.class, () -> supplierOfferingService.createOffering(req2, authA));
    }

    // 4. Multiple Suppliers Can Create Offerings for Same Master Product
    @Test
    public void test04_MultipleSuppliersCanOfferSameMasterProduct() {
        CreateSupplierOfferingRequest reqA = new CreateSupplierOfferingRequest(
                masterParacetamol.id(),
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
        );
        SupplierOfferingResponse offA = supplierOfferingService.createOffering(reqA, authA);

        CreateSupplierOfferingRequest reqB = new CreateSupplierOfferingRequest(
                masterParacetamol.id(),
                new BigDecimal("125.00"),
                "INR",
                500,
                new BigDecimal("99.50"),
                "EP",
                new BigDecimal("50.00"),
                "50kg Bag",
                5,
                true,
                true,
                true,
                "AVAILABLE"
        );
        SupplierOfferingResponse offB = supplierOfferingService.createOffering(reqB, authB);

        assertNotNull(offA.id());
        assertNotNull(offB.id());
        assertNotEquals(offA.id(), offB.id());

        List<SupplierOfferingResponse> offerings = supplierOfferingService.getOfferingsForMasterProduct(masterParacetamol.id());
        assertEquals(2, offerings.size());
    }

    // 5. Cross-Supplier IDOR / BOLA Prevention
    @Test
    public void test05_CrossSupplierBolaProtection() {
        SupplierOfferingResponse offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                masterParacetamol.id(),
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

        UpdateSupplierOfferingRequest updateReq = new UpdateSupplierOfferingRequest(
                new BigDecimal("100.00"),
                "INR",
                2000,
                null, null, null, null, null, null, null, null, "AVAILABLE"
        );

        // Supplier B attempting to edit Supplier A's offering must fail
        assertThrows(AccessDeniedException.class, () -> supplierOfferingService.updateOffering(offA.id(), updateReq, authB));

        // Supplier B attempting to deactivate Supplier A's offering must fail
        assertThrows(AccessDeniedException.class, () -> supplierOfferingService.deactivateOffering(offA.id(), authB));
    }

    // 6. Master Product Attributes Remain Immutable
    @Test
    public void test06_MasterProductAttributesImmutability() {
        SupplierOfferingResponse offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                masterParacetamol.id(),
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

        // Updating offering attributes does NOT alter MasterProduct's canonical name or CAS number
        supplierOfferingService.updateOffering(offA.id(), new UpdateSupplierOfferingRequest(
                new BigDecimal("130.00"),
                "USD",
                800,
                null, null, null, null, null, null, null, null, "AVAILABLE"
        ), authA);

        MasterProductResponse mpAfter = masterProductService.getMasterProductById(masterParacetamol.id());
        assertEquals("Paracetamol Fine Powder", mpAfter.name());
        assertEquals("103-90-2", mpAfter.casNumber());
    }
}
