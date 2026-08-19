package com.synthora.product;

import com.synthora.common.ResourceNotFoundException;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.product.dto.CreateMasterProductRequest;
import com.synthora.product.dto.CreateSupplierOfferingRequest;
import com.synthora.product.dto.MasterProductResponse;
import com.synthora.product.dto.SupplierOfferingResponse;
import com.synthora.product.dto.UpdateSupplierOfferingRequest;
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
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class MasterProductOfferingSecurityTest {

    @Autowired
    private MasterProductService masterProductService;

    @Autowired
    private SupplierOfferingService supplierOfferingService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private ProductRepository productRepository;

    private User supplierUser1;
    private Supplier supplier1;
    private Authentication auth1;

    private User supplierUser2;
    private Supplier supplier2;
    private Authentication auth2;

    private User buyerUser;
    private Authentication buyerAuth;

    @BeforeEach
    public void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        // Supplier 1
        supplierUser1 = new User();
        supplierUser1.setName("Supplier One " + suffix);
        supplierUser1.setEmail("sup1_" + suffix + "@test.com");
        supplierUser1.setPasswordHash("hash");
        supplierUser1.setRole(UserRole.SUPPLIER);
        supplierUser1 = userRepository.save(supplierUser1);

        supplier1 = new Supplier();
        supplier1.setName("Pharma Corp " + suffix);
        supplier1.setSlug("pharma-corp-" + suffix);
        supplier1.setUser(supplierUser1);
        supplier1 = supplierRepository.save(supplier1);

        auth1 = new UsernamePasswordAuthenticationToken(supplierUser1.getEmail(), null);

        // Supplier 2
        supplierUser2 = new User();
        supplierUser2.setName("Supplier Two " + suffix);
        supplierUser2.setEmail("sup2_" + suffix + "@test.com");
        supplierUser2.setPasswordHash("hash");
        supplierUser2.setRole(UserRole.SUPPLIER);
        supplierUser2 = userRepository.save(supplierUser2);

        supplier2 = new Supplier();
        supplier2.setName("Chem Global " + suffix);
        supplier2.setSlug("chem-global-" + suffix);
        supplier2.setUser(supplierUser2);
        supplier2 = supplierRepository.save(supplier2);

        auth2 = new UsernamePasswordAuthenticationToken(supplierUser2.getEmail(), null);

        // Buyer
        buyerUser = new User();
        buyerUser.setName("Buyer User " + suffix);
        buyerUser.setEmail("buyer_" + suffix + "@test.com");
        buyerUser.setPasswordHash("hash");
        buyerUser.setRole(UserRole.USER);
        buyerUser = userRepository.save(buyerUser);

        buyerAuth = new UsernamePasswordAuthenticationToken(buyerUser.getEmail(), null);
    }

    // 1. MasterProduct Creation & Server-Generated Code
    @Test
    public void test01_MasterProductCreationAndServerGeneratedCode() {
        CreateMasterProductRequest request = new CreateMasterProductRequest(
                "Paracetamol Master Grade",
                "103-90-2",
                "C8H9NO2",
                ProductCategory.API,
                "Canonical Paracetamol identity"
        );

        MasterProductResponse response = masterProductService.createMasterProduct(request);

        assertNotNull(response.id());
        assertNotNull(response.masterProductCode());
        assertTrue(response.masterProductCode().startsWith("API-MP-"));
        assertEquals("Paracetamol Master Grade", response.name());
        assertEquals("103-90-2", response.casNumber());
    }

    // 2. Duplicate CAS + Category MasterProduct Rejection
    @Test
    public void test02_DuplicateMasterProductCasAndCategoryRejection() {
        CreateMasterProductRequest request1 = new CreateMasterProductRequest(
                "Ibuprofen Pure",
                "15687-27-1",
                "C13H18O2",
                ProductCategory.API,
                "Description 1"
        );
        masterProductService.createMasterProduct(request1);

        CreateMasterProductRequest request2 = new CreateMasterProductRequest(
                "Ibuprofen Duplicate",
                "15687-27-1",
                "C13H18O2",
                ProductCategory.API,
                "Description 2"
        );

        assertThrows(IllegalStateException.class, () -> masterProductService.createMasterProduct(request2));
    }

    // 3. Supplier Offering Creation & Ownership Resolution
    @Test
    public void test03_SupplierOfferingCreationAndOwnership() {
        MasterProductResponse mp = masterProductService.createMasterProduct(new CreateMasterProductRequest(
                "Aspirin Master",
                "50-78-2",
                "C9H8O4",
                ProductCategory.API,
                "Aspirin canonical entry"
        ));

        CreateSupplierOfferingRequest req = new CreateSupplierOfferingRequest(
                mp.id(),
                new BigDecimal("150.00"),
                "INR",
                1000,
                new BigDecimal("99.50"),
                "USP",
                new BigDecimal("25.00"),
                "25kg Drum",
                7,
                true,
                true,
                true,
                "AVAILABLE"
        );

        SupplierOfferingResponse offering = supplierOfferingService.createOffering(req, auth1);

        assertNotNull(offering.id());
        assertEquals(mp.id(), offering.masterProductId());
        assertEquals(supplier1.getId(), offering.supplierId());
        assertEquals(new BigDecimal("150.00"), offering.price());
        assertEquals("INR", offering.currency());
    }

    // 4. Duplicate Supplier Offering Constraint (One Supplier + One Master Product)
    @Test
    public void test04_DuplicateSupplierOfferingRejection() {
        MasterProductResponse mp = masterProductService.createMasterProduct(new CreateMasterProductRequest(
                "Metformin Master",
                "657-24-9",
                "C4H11N5",
                ProductCategory.API,
                "Metformin canonical entry"
        ));

        CreateSupplierOfferingRequest req1 = new CreateSupplierOfferingRequest(
                mp.id(),
                new BigDecimal("90.00"),
                "INR",
                500,
                new BigDecimal("98.00"),
                "EP",
                new BigDecimal("50.00"),
                "50kg Bag",
                5,
                true,
                true,
                false,
                "AVAILABLE"
        );
        supplierOfferingService.createOffering(req1, auth1);

        CreateSupplierOfferingRequest req2 = new CreateSupplierOfferingRequest(
                mp.id(),
                new BigDecimal("95.00"),
                "INR",
                200,
                new BigDecimal("98.50"),
                "EP",
                new BigDecimal("50.00"),
                "50kg Bag",
                3,
                true,
                true,
                false,
                "AVAILABLE"
        );

        assertThrows(IllegalStateException.class, () -> supplierOfferingService.createOffering(req2, auth1));
    }

    // 5. Cross-Supplier Modification Prevention (IDOR/BOLA Protection)
    @Test
    public void test05_CrossSupplierModificationPrevention() {
        MasterProductResponse mp = masterProductService.createMasterProduct(new CreateMasterProductRequest(
                "Omeprazole Master",
                "73590-58-6",
                "C17H19N3O3S",
                ProductCategory.API,
                "Omeprazole canonical entry"
        ));

        SupplierOfferingResponse off1 = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                mp.id(),
                new BigDecimal("300.00"),
                "INR",
                200,
                new BigDecimal("99.00"),
                "USP",
                new BigDecimal("10.00"),
                "10kg Drum",
                10,
                true,
                true,
                true,
                "AVAILABLE"
        ), auth1);

        UpdateSupplierOfferingRequest updateReq = new UpdateSupplierOfferingRequest(
                new BigDecimal("250.00"),
                "INR",
                300,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "AVAILABLE"
        );

        // Supplier 2 attempting to update Supplier 1's offering must fail
        assertThrows(AccessDeniedException.class, () -> supplierOfferingService.updateOffering(off1.id(), updateReq, auth2));
    }

    // 6. Buyer Cannot Mutate Offerings
    @Test
    public void test06_BuyerCannotMutateOffering() {
        MasterProductResponse mp = masterProductService.createMasterProduct(new CreateMasterProductRequest(
                "Amoxicillin Master",
                "26787-78-0",
                "C16H19N3O5S",
                ProductCategory.API,
                "Amoxicillin canonical entry"
        ));

        CreateSupplierOfferingRequest req = new CreateSupplierOfferingRequest(
                mp.id(),
                new BigDecimal("220.00"),
                "INR",
                100,
                new BigDecimal("99.00"),
                "BP",
                new BigDecimal("25.00"),
                "Drum",
                5,
                true,
                true,
                true,
                "AVAILABLE"
        );

        // Buyer attempting to create offering must fail (no operational supplier record)
        assertThrows(IllegalStateException.class, () -> supplierOfferingService.createOffering(req, buyerAuth));
    }

    // 7. Non-Interference with Legacy Product Baseline
    @Test
    public void test07_LegacyProductNonInterference() {
        Product legacyProduct = new Product();
        legacyProduct.setName("Legacy Paracetamol");
        legacyProduct.setCategory(ProductCategory.API);
        legacyProduct.setPrice(new BigDecimal("100.00"));
        legacyProduct.setStock(50);
        legacyProduct.setSeller(supplierUser1);
        legacyProduct = productRepository.save(legacyProduct);

        assertNotNull(legacyProduct.getId());
        assertNotNull(legacyProduct.getProductCode());

        // MasterProduct creation does not touch or invalidate legacy product
        MasterProductResponse mp = masterProductService.createMasterProduct(new CreateMasterProductRequest(
                "Paracetamol Master",
                "103-90-2",
                "C8H9NO2",
                ProductCategory.API,
                "Canonical Paracetamol"
        ));

        assertNotNull(mp.id());
        assertTrue(productRepository.findById(legacyProduct.getId()).isPresent());
    }
}
