package com.synthora.admin.product;

import com.synthora.admin.audit.AuditAction;
import com.synthora.admin.audit.AuditLog;
import com.synthora.admin.audit.AuditLogRepository;
import com.synthora.admin.audit.AuditTargetType;
import com.synthora.admin.product.dto.*;
import com.synthora.common.ResourceNotFoundException;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.product.*;
import com.synthora.product.dto.ProductSupplierRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class AdminProductServiceTest {

    @Autowired
    private AdminProductService adminProductService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductSupplierRepository productSupplierRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User admin;
    private User seller;
    private Supplier supplier;
    private Product product1;
    private Product product2;
    private ProductSupplier productSupplier;
    private Authentication adminAuth;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("DELETE FROM audit_logs");
        jdbcTemplate.execute("DELETE FROM notifications");
        jdbcTemplate.execute(
                "UPDATE rfqs SET accepted_quotation_id = NULL; " +
                "DELETE FROM shipments; " +
                "DELETE FROM purchase_orders; " +
                "DELETE FROM quotations; " +
                "DELETE FROM rfqs; " +
                "DELETE FROM documents; " +
                "DELETE FROM product_suppliers; " +
                "DELETE FROM products; " +
                "DELETE FROM seller_profiles; " +
                "DELETE FROM suppliers; " +
                "DELETE FROM users;"
        );

        admin = new User();
        admin.setName("Admin Boss");
        admin.setEmail("admin.product@synthora.com");
        admin.setPasswordHash("hash123");
        admin.setRole(UserRole.ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        admin = userRepository.save(admin);

        seller = new User();
        seller.setName("Seller One");
        seller.setEmail("seller1@synthora.com");
        seller.setPasswordHash("hash123");
        seller.setRole(UserRole.SUPPLIER);
        seller.setStatus(UserStatus.ACTIVE);
        seller = userRepository.save(seller);

        supplier = new Supplier();
        supplier.setName("Apex Solvents LLC");
        supplier.setSlug("apex-solvents-llc");
        supplier.setCountryCode("US");
        supplier.setCountryName("United States");
        supplier.setVerified(true);
        supplier.setUser(seller);
        supplier.setCreatedAt(LocalDateTime.now());
        supplier = supplierRepository.save(supplier);

        product1 = new Product();
        product1.setName("Ethanol 99%");
        product1.setDescription("High purity ethanol");
        product1.setPrice(new BigDecimal("150.00"));
        product1.setStock(500);
        product1.setCategory(ProductCategory.SOLVENT);
        product1.setCasNumber("64-17-5");
        product1.setAvailabilityStatus("AVAILABLE");
        product1.setSeller(seller);
        product1 = productRepository.save(product1);

        product2 = new Product();
        product2.setName("Methanol Grade A");
        product2.setDescription("Industrial grade methanol");
        product2.setPrice(new BigDecimal("90.00"));
        product2.setStock(200);
        product2.setCategory(ProductCategory.SOLVENT);
        product2.setCasNumber("67-56-1");
        product2.setAvailabilityStatus("OUT_OF_STOCK");
        product2.setSeller(seller);
        product2 = productRepository.save(product2);

        productSupplier = new ProductSupplier();
        productSupplier.setProduct(product1);
        productSupplier.setSupplier(supplier);
        productSupplier.setPurity("99.9%");
        productSupplier.setGrade("Pharma Grade");
        productSupplier.setMoqKg(new BigDecimal("50.00"));
        productSupplier = productSupplierRepository.save(productSupplier);

        adminAuth = new UsernamePasswordAuthenticationToken(admin.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
    }

    @Test
    public void testGetProducts_PaginationAndFilters() {
        Page<AdminProductResponse> all = adminProductService.getProducts(0, 10, null, null, null, null);
        assertEquals(2, all.getTotalElements());

        // Search by CAS
        Page<AdminProductResponse> casSearch = adminProductService.getProducts(0, 10, "64-17-5", null, null, null);
        assertEquals(1, casSearch.getTotalElements());
        assertEquals("Ethanol 99%", casSearch.getContent().get(0).name());

        // Filter by availability
        Page<AdminProductResponse> outOfStock = adminProductService.getProducts(0, 10, null, null, null, "OUT_OF_STOCK");
        assertEquals(1, outOfStock.getTotalElements());
        assertEquals("Methanol Grade A", outOfStock.getContent().get(0).name());
    }

    @Test
    public void testGetProductDetail_WithOfferingCount() {
        AdminProductDetailResponse detail = adminProductService.getProductDetail(product1.getId());
        assertNotNull(detail);
        assertEquals("Ethanol 99%", detail.name());
        assertEquals(1, detail.supplierOfferingCount());
        assertEquals(seller.getId(), detail.sellerId());
    }

    @Test
    public void testUpdateProduct_MetadataWithAudit() {
        UpdateAdminProductRequest req = new UpdateAdminProductRequest(
                "Ethanol 99.5% Absolute",
                "Updated description",
                new BigDecimal("165.00"),
                600,
                ProductCategory.SOLVENT,
                "64-17-5",
                "C2H6O",
                new BigDecimal("99.50"),
                "Reagent Grade",
                "Steel Drum",
                new BigDecimal("100.00"),
                5,
                true,
                true,
                true,
                "AVAILABLE",
                "Metadata correction"
        );

        AdminProductResponse updated = adminProductService.updateProduct(product1.getId(), req, adminAuth, new MockHttpServletRequest());
        assertEquals("Ethanol 99.5% Absolute", updated.name());
        assertEquals(new BigDecimal("165.00"), updated.price());

        List<AuditLog> logs = auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AuditTargetType.PRODUCT, product1.getId().toString());
        assertEquals(1, logs.size());
        assertEquals(AuditAction.PRODUCT_UPDATED, logs.get(0).getAction());
    }

    @Test
    public void testUpdateAvailability_StatusToggleWithAudit() {
        UpdateProductAvailabilityRequest req = new UpdateProductAvailabilityRequest("HIDDEN", "Under policy investigation");

        AdminProductResponse updated = adminProductService.updateAvailability(product1.getId(), req, adminAuth, null);
        assertEquals("HIDDEN", updated.availabilityStatus());

        List<AuditLog> logs = auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AuditTargetType.PRODUCT, product1.getId().toString());
        assertEquals(1, logs.size());
        assertEquals(AuditAction.PRODUCT_UPDATED, logs.get(0).getAction());
        assertTrue(logs.get(0).getDetails().contains("HIDDEN"));
    }

    @Test
    public void testUpdateAvailability_InvalidStatusRejected() {
        UpdateProductAvailabilityRequest req = new UpdateProductAvailabilityRequest("UNKNOWN_STATUS", "Test");
        assertThrows(IllegalArgumentException.class, () -> {
            adminProductService.updateAvailability(product1.getId(), req, adminAuth, null);
        });
    }

    @Test
    public void testDeactivateProduct_NonDestructiveDiscontinued() {
        AdminProductResponse deactivated = adminProductService.deactivateProduct(product1.getId(), adminAuth, null);
        assertEquals("DISCONTINUED", deactivated.availabilityStatus());

        // Product still exists in DB
        assertTrue(productRepository.existsById(product1.getId()));

        List<AuditLog> logs = auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AuditTargetType.PRODUCT, product1.getId().toString());
        assertEquals(1, logs.size());
        assertEquals(AuditAction.PRODUCT_DELETED, logs.get(0).getAction());
    }

    @Test
    public void testProductSupplier_AdminUpdateAndDeletion() {
        // List offerings
        List<AdminProductSupplierResponse> offerings = adminProductService.getProductSuppliers(product1.getId());
        assertEquals(1, offerings.size());
        assertEquals("Apex Solvents LLC", offerings.get(0).supplierName());

        // Update offering
        ProductSupplierRequest updateReq = new ProductSupplierRequest("99.95%", "High Purity", new BigDecimal("100.00"), "IBC Tank", 3, true, true);
        AdminProductSupplierResponse updatedOffering = adminProductService.updateProductSupplierOffering(
                product1.getId(),
                supplier.getId(),
                updateReq,
                adminAuth,
                null
        );
        assertEquals("99.95%", updatedOffering.purity());

        // Delete offering
        adminProductService.deleteProductSupplierOffering(product1.getId(), supplier.getId(), adminAuth, null);

        // Verify offering is gone
        assertFalse(productSupplierRepository.existsByProductIdAndSupplierId(product1.getId(), supplier.getId()));

        // Verify product and supplier still exist
        assertTrue(productRepository.existsById(product1.getId()));
        assertTrue(supplierRepository.existsById(supplier.getId()));

        // Verify audits
        List<AuditLog> logs = auditLogRepository.findAll();
        assertTrue(logs.stream().anyMatch(l -> l.getTargetType() == AuditTargetType.PRODUCT_SUPPLIER && l.getAction() == AuditAction.PRODUCT_DELETED));
    }
}
