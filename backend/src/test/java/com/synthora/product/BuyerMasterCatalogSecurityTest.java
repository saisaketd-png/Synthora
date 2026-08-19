package com.synthora.product;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.notification.NotificationRepository;
import com.synthora.product.dto.*;
import com.synthora.rfq.Rfq;
import com.synthora.rfq.RfqRepository;
import com.synthora.rfq.dto.CreateRfqRequest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
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
public class BuyerMasterCatalogSecurityTest {

    @Autowired
    private MasterProductService masterProductService;

    @Autowired
    private SupplierOfferingService supplierOfferingService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private RfqRepository rfqRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private User supplierUserA;
    private Supplier supplierA;
    private Authentication authA;

    private User buyerUser;
    private Authentication buyerAuth;

    private MasterProductResponse activeMaster;
    private MasterProductResponse inactiveMaster;
    private SupplierOfferingResponse activeOffering;

    @BeforeEach
    public void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        supplierUserA = new User();
        supplierUserA.setName("Pharma Manufacturing " + suffix);
        supplierUserA.setEmail("mfg_" + suffix + "@synthora.com");
        supplierUserA.setPasswordHash("secret_hash");
        supplierUserA.setRole(UserRole.SUPPLIER);
        supplierUserA = userRepository.save(supplierUserA);

        supplierA = new Supplier();
        supplierA.setName("Pharma Ltd " + suffix);
        supplierA.setSlug("pharma-ltd-" + suffix);
        supplierA.setUser(supplierUserA);
        supplierA = supplierRepository.save(supplierA);

        authA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null);

        buyerUser = new User();
        buyerUser.setName("Enterprise Buyer " + suffix);
        buyerUser.setEmail("buyer_" + suffix + "@synthora.com");
        buyerUser.setPasswordHash("secret_hash");
        buyerUser.setRole(UserRole.USER);
        buyerUser = userRepository.save(buyerUser);

        buyerAuth = new UsernamePasswordAuthenticationToken(buyerUser.getEmail(), null);

        // Active Master Product
        activeMaster = masterProductService.createMasterProduct(new CreateMasterProductRequest(
                "Paracetamol Fine Powder",
                "103-90-2",
                "C8H9NO2",
                ProductCategory.API,
                "Canonical Paracetamol"
        ));

        // Active Offering
        activeOffering = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                activeMaster.id(),
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

        // Inactive Master Product
        MasterProduct mpInactive = new MasterProduct();
        mpInactive.setName("Draft Chemical Compound");
        mpInactive.setMasterProductCode("API-MP-DRAFT");
        mpInactive.setCasNumber("999-99-9");
        mpInactive.setCategory(ProductCategory.API);
        mpInactive.setStatus("DRAFT");
        // Save via repository directly
        inactiveMaster = masterProductService.getMasterProductById(
                masterProductService.createMasterProduct(new CreateMasterProductRequest(
                        "Draft Chemical Compound",
                        "999-99-9",
                        "C1H1O1",
                        ProductCategory.API,
                        "Draft"
                )).id()
        );
    }

    // 1. Public Search Returns Active Master Products
    @Test
    public void test01_PublicSearchReturnsActiveMasterProducts() {
        Page<MasterProductResponse> results = masterProductService.searchActiveMasterProducts("Paracetamol", 0, 10);
        assertTrue(results.getTotalElements() > 0);
        assertEquals("Paracetamol Fine Powder", results.getContent().get(0).name());
    }

    // 2. Buyer Can View Active Offerings for Master Product
    @Test
    public void test02_BuyerCanViewActiveOfferings() {
        List<SupplierOfferingResponse> offerings = supplierOfferingService.getOfferingsForMasterProduct(activeMaster.id());
        assertFalse(offerings.isEmpty());
        assertEquals("Pharma Ltd ", offerings.get(0).supplierName().substring(0, 11));
        assertEquals(new BigDecimal("120.00"), offerings.get(0).price());
    }

    // 3. Deactivated Offerings Hidden From Public Comparison
    @Test
    public void test03_DeactivatedOfferingsHiddenFromComparison() {
        supplierOfferingService.deactivateOffering(activeOffering.id(), authA);

        SupplierOfferingResponse deactivated = supplierOfferingService.getOfferingById(activeOffering.id());
        assertEquals("HIDDEN", deactivated.availabilityStatus());
    }

    // 4. Private Supplier Credentials Are Not Exposed
    @Test
    public void test04_PrivateSupplierDataProtected() {
        SupplierOfferingResponse offering = supplierOfferingService.getOfferingById(activeOffering.id());
        assertNotNull(offering.supplierName());
        assertNotNull(offering.supplierId());
        // Verify password hash or private fields are not present on DTO
        assertFalse(offering.toString().contains("secret_hash"));
    }

    // 5. RFQ Sourcing Flow Integration & Legacy Compatibility
    @Test
    public void test05_RfqSourcingFlowIntegration() {
        // Create legacy Product for RFQ compatibility
        Product legacyProduct = new Product();
        legacyProduct.setName("Paracetamol Fine Powder");
        legacyProduct.setCasNumber("103-90-2");
        legacyProduct.setCategory(ProductCategory.API);
        legacyProduct.setPrice(new BigDecimal("120.00"));
        legacyProduct.setStock(1000);
        legacyProduct.setSeller(supplierUserA);
        legacyProduct = productRepository.save(legacyProduct);

        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyerUser.getId());
        rfq.setProductId(legacyProduct.getId());
        rfq.setSupplierId(supplierA.getId());
        rfq.setQuantity(new BigDecimal("100.00"));
        rfq.setUnit("kg");
        rfq.setMessage("Sourced from MasterProduct Offering " + activeOffering.masterProductCode());
        rfq.setStatus(com.synthora.rfq.RfqStatus.PENDING);
        Rfq savedRfq = rfqRepository.save(rfq);

        assertNotNull(savedRfq.getId());
        assertEquals(supplierA.getId(), savedRfq.getSupplierId());
    }
}
