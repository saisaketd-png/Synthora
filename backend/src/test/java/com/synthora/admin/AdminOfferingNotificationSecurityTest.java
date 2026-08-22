package com.synthora.admin;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.notification.NotificationRepository;
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
public class AdminOfferingNotificationSecurityTest {

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

    @Autowired
    private NotificationRepository notificationRepository;

    private User adminUser;
    private User supplierUser;
    private Supplier supplier;
    private MasterProduct masterProduct;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM users;");

        // Admin User
        adminUser = new User(
                UUID.randomUUID(),
                "System Admin",
                "admin_off_test@synthora.com",
                "9998887777",
                "$2a$10$hashedpassword",
                UserRole.ADMIN,
                UserStatus.ACTIVE
        );
        adminUser = userRepository.save(adminUser);

        // Supplier User
        supplierUser = new User(
                UUID.randomUUID(),
                "Supplier User",
                "supplier_notif_test@synthora.com",
                "1234567890",
                "$2a$10$hashedpassword",
                UserRole.SUPPLIER,
                UserStatus.ACTIVE
        );
        supplierUser = userRepository.save(supplierUser);

        supplier = new Supplier();
        supplier.setName("Beta Organics");
        supplier.setSlug("beta-organics");
        supplier.setUser(supplierUser);
        supplier = supplierRepository.save(supplier);

        masterProduct = new MasterProduct();
        masterProduct.setName("Aspirin Notif Test");
        masterProduct.setMasterProductCode("API-MP-70701");
        masterProduct.setCasNumber("50-78-2");
        masterProduct.setMolecularFormula("C9H8O4");
        masterProduct.setCategory(ProductCategory.API);
        masterProduct.setStatus("ACTIVE");
        masterProduct = masterProductRepository.save(masterProduct);
    }

    @Test
    void supplierCreatingOffering_emitsNotificationToAdmin() {
        var authSupplier = new UsernamePasswordAuthenticationToken(supplierUser.getEmail(), null, List.of());
        SecurityContextHolder.getContext().setAuthentication(authSupplier);

        CreateSupplierOfferingRequest req = new CreateSupplierOfferingRequest(
                masterProduct.getId(), new BigDecimal("980.00"), "INR", 400,
                new BigDecimal("99.90"), "USP", new BigDecimal("25.00"), "25kg Drums", 5,
                true, true, true, "AVAILABLE"
        );

        var offeringRes = supplierOfferingService.createOffering(req, authSupplier);

        // Verify admin notification created
        long adminUnread = notificationRepository.countByRecipientIdAndReadFalse(adminUser.getId());
        assertThat(adminUnread).isGreaterThanOrEqualTo(1);

        var notifications = notificationRepository.findByRecipientIdAndReadFalse(adminUser.getId());
        assertThat(notifications).anyMatch(n ->
                n.getTitle().contains("New Supplier Offering") &&
                n.getEntityId().equals(offeringRes.id())
        );
    }

    @Test
    void adminApprovingOffering_notifiesSupplierUser() {
        var authSupplier = new UsernamePasswordAuthenticationToken(supplierUser.getEmail(), null, List.of());
        CreateSupplierOfferingRequest req = new CreateSupplierOfferingRequest(
                masterProduct.getId(), new BigDecimal("980.00"), "INR", 400,
                new BigDecimal("99.90"), "USP", new BigDecimal("25.00"), "25kg Drums", 5,
                true, true, true, "AVAILABLE"
        );
        var offeringRes = supplierOfferingService.createOffering(req, authSupplier);

        // Admin approves
        var authAdmin = new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        supplierOfferingService.approveOffering(offeringRes.id(), "Approved by Governance", authAdmin);

        // Verify supplier notification
        var supplierNotifications = notificationRepository.findByRecipientIdAndReadFalse(supplierUser.getId());
        assertThat(supplierNotifications).anyMatch(n ->
                n.getTitle().contains("Offering Approved") &&
                n.getEntityId().equals(offeringRes.id())
        );
    }
}
