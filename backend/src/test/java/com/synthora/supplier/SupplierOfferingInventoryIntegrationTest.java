package com.synthora.supplier;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.product.*;
import com.synthora.product.dto.CreateSupplierOfferingRequest;
import com.synthora.product.dto.SupplierOfferingResponse;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class SupplierOfferingInventoryIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MasterProductRepository masterProductRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private SupplierOfferingService supplierOfferingService;

    private User supplierUserA;
    private Supplier supplierA;

    private User supplierUserB;
    private Supplier supplierB;

    private MasterProduct masterProduct;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        // Supplier A
        supplierUserA = new User(
                UUID.randomUUID(),
                "Supplier A User",
                "supplier_a_inv@synthora.com",
                "1112223333",
                "$2a$10$hashedpassword",
                UserRole.SUPPLIER,
                UserStatus.ACTIVE
        );
        supplierUserA = userRepository.save(supplierUserA);

        supplierA = new Supplier();
        supplierA.setName("Supplier A Pharma");
        supplierA.setSlug("supplier-a-pharma");
        supplierA.setUser(supplierUserA);
        supplierA = supplierRepository.save(supplierA);

        // Supplier B
        supplierUserB = new User(
                UUID.randomUUID(),
                "Supplier B User",
                "supplier_b_inv@synthora.com",
                "4445556666",
                "$2a$10$hashedpassword",
                UserRole.SUPPLIER,
                UserStatus.ACTIVE
        );
        supplierUserB = userRepository.save(supplierUserB);

        supplierB = new Supplier();
        supplierB.setName("Supplier B Labs");
        supplierB.setSlug("supplier-b-labs");
        supplierB.setUser(supplierUserB);
        supplierB = supplierRepository.save(supplierB);

        // Master Product
        masterProduct = new MasterProduct();
        masterProduct.setName("Ibuprofen Inv Test");
        masterProduct.setMasterProductCode("API-MP-80801");
        masterProduct.setCasNumber("15687-27-1");
        masterProduct.setMolecularFormula("C13H18O2");
        masterProduct.setCategory(ProductCategory.API);
        masterProduct.setStatus("ACTIVE");
        masterProduct = masterProductRepository.save(masterProduct);
    }

    @Test
    void supplierInventory_returnsOnlyAuthenticatedSupplierOfferings() {
        // Supplier A creates offering
        var authA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null, List.of());
        CreateSupplierOfferingRequest reqA = new CreateSupplierOfferingRequest(
                masterProduct.getId(), new BigDecimal("1500.00"), "INR", 1000,
                new BigDecimal("99.50"), "EP", new BigDecimal("100.00"), "50kg Drums", 14,
                true, true, true, "AVAILABLE"
        );
        supplierOfferingService.createOffering(reqA, authA);

        // Supplier B creates offering on same MasterProduct
        var authB = new UsernamePasswordAuthenticationToken(supplierUserB.getEmail(), null, List.of());
        CreateSupplierOfferingRequest reqB = new CreateSupplierOfferingRequest(
                masterProduct.getId(), new BigDecimal("1450.00"), "INR", 800,
                new BigDecimal("99.20"), "BP", new BigDecimal("50.00"), "25kg Drums", 10,
                true, true, false, "AVAILABLE"
        );
        supplierOfferingService.createOffering(reqB, authB);

        // Query inventory for Supplier A
        List<SupplierOfferingResponse> offeringsA = supplierOfferingService.getMyOfferings(authA);
        assertThat(offeringsA).hasSize(1);
        assertThat(offeringsA.get(0).supplierId()).isEqualTo(supplierA.getId());
        assertThat(offeringsA.get(0).masterProductName()).isEqualTo("Ibuprofen Inv Test");

        // Query inventory for Supplier B
        List<SupplierOfferingResponse> offeringsB = supplierOfferingService.getMyOfferings(authB);
        assertThat(offeringsB).hasSize(1);
        assertThat(offeringsB.get(0).supplierId()).isEqualTo(supplierB.getId());
    }

    @Test
    void supplierCannotDeactivateAnotherSupplierOffering() {
        var authA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null, List.of());
        CreateSupplierOfferingRequest reqA = new CreateSupplierOfferingRequest(
                masterProduct.getId(), new BigDecimal("1500.00"), "INR", 1000,
                new BigDecimal("99.50"), "EP", new BigDecimal("100.00"), "50kg Drums", 14,
                true, true, true, "AVAILABLE"
        );
        var offeringA = supplierOfferingService.createOffering(reqA, authA);

        // Supplier B attempts to deactivate Supplier A's offering
        var authB = new UsernamePasswordAuthenticationToken(supplierUserB.getEmail(), null, List.of());

        assertThatThrownBy(() -> supplierOfferingService.deactivateOffering(offeringA.id(), authB))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("You cannot modify another supplier's offering");
    }
}
