package com.synthora.catalog;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.product.*;
import com.synthora.product.dto.CreateSupplierOfferingRequest;

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

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class CatalogPublicationIntegrationTest {

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

    private User adminUser;
    private UsernamePasswordAuthenticationToken adminAuth;

    private User supplierUser;
    private Supplier supplier;
    private MasterProduct masterProduct;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM users;");

        adminUser = new User(
                UUID.randomUUID(),
                "Admin User",
                "admin_pub_test@synthora.com",
                "9990001111",
                "$2a$10$hashedpassword",
                UserRole.ADMIN,
                UserStatus.ACTIVE
        );
        adminUser = userRepository.save(adminUser);
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        supplierUser = new User(
                UUID.randomUUID(),
                "Supplier Catalog Tester",
                "supplier_pub@synthora.com",
                "1234567890",
                "$2a$10$hashedpassword",
                UserRole.SUPPLIER,
                UserStatus.ACTIVE
        );
        supplierUser = userRepository.save(supplierUser);

        supplier = new Supplier();
        supplier.setName("Alpha Chemicals Ltd");
        supplier.setSlug("alpha-chem-pub");
        supplier.setUser(supplierUser);
        supplier.setVerified(true);
        supplier = supplierRepository.save(supplier);

        masterProduct = new MasterProduct();
        masterProduct.setName("Paracetamol Pub Test");
        masterProduct.setMasterProductCode("API-MP-90901");
        masterProduct.setCasNumber("103-90-2");
        masterProduct.setMolecularFormula("C8H9NO2");
        masterProduct.setCategory(ProductCategory.API);
        masterProduct.setStatus("ACTIVE");
        masterProduct = masterProductRepository.save(masterProduct);
    }

    @Test
    void pendingOffering_isNotPubliclyVisible_untilAdminApproves() {
        // Step 1: Supplier creates offering -> Moderation status = PENDING_REVIEW
        var auth = new UsernamePasswordAuthenticationToken(supplierUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        CreateSupplierOfferingRequest req = new CreateSupplierOfferingRequest(
                masterProduct.getId(),
                new BigDecimal("1250.00"),
                "INR",
                500,
                new BigDecimal("99.80"),
                "USP",
                new BigDecimal("50.00"),
                "25kg Drums",
                7,
                true,
                true,
                true,
                "AVAILABLE"
        );

        var response = supplierOfferingService.createOffering(req, auth);
        assertThat(response.moderationStatus()).isEqualTo("PENDING_REVIEW");

        // Verify that unapproved offering is filtered out from public offerings query
        List<SupplierOffering> publicOfferings = supplierOfferingRepository.findByMasterProductId(masterProduct.getId());
        List<SupplierOffering> approvedOfferings = publicOfferings.stream()
                .filter(o -> "APPROVED".equalsIgnoreCase(o.getModerationStatus()))
                .toList();

        assertThat(approvedOfferings).isEmpty();

        // Step 2: Admin approves offering
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        supplierOfferingService.approveOffering(response.id(), "Approved after ISO verification", adminAuth);

        // Step 3: Verified offering is now APPROVED
        SupplierOffering approved = supplierOfferingRepository.findById(response.id()).orElseThrow();
        assertThat(approved.getModerationStatus()).isEqualTo("APPROVED");
    }

    @Test
    void deactivatedOffering_disappearsFromPublicCatalog() {
        var auth = new UsernamePasswordAuthenticationToken(supplierUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        CreateSupplierOfferingRequest req = new CreateSupplierOfferingRequest(
                masterProduct.getId(),
                new BigDecimal("1250.00"),
                "INR",
                500,
                new BigDecimal("99.80"),
                "USP",
                new BigDecimal("50.00"),
                "25kg Drums",
                7,
                true,
                true,
                true,
                "AVAILABLE"
        );

        var response = supplierOfferingService.createOffering(req, auth);

        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        supplierOfferingService.approveOffering(response.id(), "Approved", adminAuth);

        // Deactivate offering
        SecurityContextHolder.getContext().setAuthentication(auth);
        supplierOfferingService.deactivateOffering(response.id(), auth);

        SupplierOffering deactivated = supplierOfferingRepository.findById(response.id()).orElseThrow();
        assertThat(deactivated.getModerationStatus()).isEqualTo("DEACTIVATED");
        assertThat(deactivated.getAvailabilityStatus()).isEqualTo("HIDDEN");
    }
}
