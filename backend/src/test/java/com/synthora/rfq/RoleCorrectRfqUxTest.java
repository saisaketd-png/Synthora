package com.synthora.rfq;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.product.*;
import com.synthora.product.dto.CreateSupplierOfferingRequest;
import com.synthora.rfq.dto.CreateRfqRequest;

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
public class RoleCorrectRfqUxTest {

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
    private RfqService rfqService;

    private User buyerUser;
    private User supplierUser;
    private Supplier supplier;
    private MasterProduct masterProduct;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM master_products; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM users;");

        // Admin User
        User adminUser = new User(
                UUID.randomUUID(),
                "Admin User",
                "admin@synthora.com",
                "7771112222",
                "$2a$10$hashedpassword",
                UserRole.ADMIN,
                UserStatus.ACTIVE
        );
        userRepository.save(adminUser);

        // Buyer User
        buyerUser = new User(
                UUID.randomUUID(),
                "Buyer User",
                "buyer_rfq_role@synthora.com",
                "9991112222",
                "$2a$10$hashedpassword",
                UserRole.USER,
                UserStatus.ACTIVE
        );
        buyerUser = userRepository.save(buyerUser);

        // Supplier User
        supplierUser = new User(
                UUID.randomUUID(),
                "Supplier User",
                "supplier_rfq_role@synthora.com",
                "8881112222",
                "$2a$10$hashedpassword",
                UserRole.SUPPLIER,
                UserStatus.ACTIVE
        );
        supplierUser = userRepository.save(supplierUser);

        supplier = new Supplier();
        supplier.setName("Gamma Chem Supplier");
        supplier.setSlug("gamma-chem-supplier");
        supplier.setUser(supplierUser);
        supplier = supplierRepository.save(supplier);

        masterProduct = new MasterProduct();
        masterProduct.setName("Metformin Role Test");
        masterProduct.setMasterProductCode("API-MP-60601");
        masterProduct.setCasNumber("1115-70-4");
        masterProduct.setMolecularFormula("C4H11N5");
        masterProduct.setCategory(ProductCategory.API);
        masterProduct.setStatus("ACTIVE");
        masterProduct = masterProductRepository.save(masterProduct);
    }

    @Test
    void buyerCanCreateRfqFromApprovedOffering_andSupplierReceivesRfq() {
        // Supplier creates offering and admin approves it
        var authSupplier = new UsernamePasswordAuthenticationToken(supplierUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));
        CreateSupplierOfferingRequest req = new CreateSupplierOfferingRequest(
                masterProduct.getId(), new BigDecimal("850.00"), "INR", 2000,
                new BigDecimal("99.80"), "USP", new BigDecimal("100.00"), "25kg Drums", 7,
                true, true, true, "AVAILABLE"
        );
        var offeringRes = supplierOfferingService.createOffering(req, authSupplier);

        var authAdmin = new UsernamePasswordAuthenticationToken("admin@synthora.com", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        supplierOfferingService.approveOffering(offeringRes.id(), "Approved", authAdmin);

        // Buyer creates RFQ targeting supplier
        var authBuyer = new UsernamePasswordAuthenticationToken(buyerUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(authBuyer);

        UUID dummyProductId = UUID.randomUUID();
        CreateRfqRequest rfqReq = new CreateRfqRequest(
                dummyProductId,
                masterProduct.getId(),
                offeringRes.id(),
                supplier.getId(),
                List.of(supplier.getId()),
                new BigDecimal("500.00"),
                "kg",
                "Require USP grade Metformin hydrochloride with 99.8% purity.",
                14
        );

        var rfqResponse = rfqService.createRfq(rfqReq, authBuyer);

        assertThat(rfqResponse.id()).isNotNull();

        // Supplier checks RFQ Inbox
        SecurityContextHolder.getContext().setAuthentication(authSupplier);
        var supplierRfqs = rfqService.getSupplierRfqs(authSupplier);

        assertThat(supplierRfqs).isNotEmpty();
        assertThat(supplierRfqs).anyMatch(r -> r.id().equals(rfqResponse.id()));
    }
}
