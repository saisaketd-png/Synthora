package com.kemkendra.admin.supplier;

import com.kemkendra.admin.audit.AuditAction;
import com.kemkendra.admin.audit.AuditLog;
import com.kemkendra.admin.audit.AuditLogRepository;
import com.kemkendra.admin.audit.AuditTargetType;
import com.kemkendra.admin.supplier.dto.*;
import com.kemkendra.common.ResourceNotFoundException;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.product.Supplier;
import com.kemkendra.product.SupplierRepository;
import com.kemkendra.seller.SellerProfile;
import com.kemkendra.seller.SellerProfileRepository;
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

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class AdminSupplierServiceTest {

    @Autowired
    private AdminSupplierService adminSupplierService;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SellerProfileRepository sellerProfileRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User admin;
    private User supplierUser1;
    private User supplierUser2;

    private Supplier supplier1;
    private Supplier supplier2;

    private Authentication adminAuth;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        admin = new User();
        admin.setName("Admin Super");
        admin.setEmail("admin@kemkendra.com");
        admin.setPasswordHash("hash123");
        admin.setRole(UserRole.ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        admin = userRepository.save(admin);

        supplierUser1 = new User();
        supplierUser1.setName("Acme Seller");
        supplierUser1.setEmail("seller@acme.com");
        supplierUser1.setPasswordHash("hash123");
        supplierUser1.setRole(UserRole.SUPPLIER);
        supplierUser1.setStatus(UserStatus.ACTIVE);
        supplierUser1 = userRepository.save(supplierUser1);

        supplier1 = new Supplier();
        supplier1.setName("Acme Chemicals");
        supplier1.setSlug("acme-chemicals");
        supplier1.setCountryCode("IN");
        supplier1.setCountryName("India");
        supplier1.setVerified(false);
        supplier1.setExportReady(false);
        supplier1.setYearsInBusiness(10);
        supplier1.setResponseRate(95);
        supplier1.setUser(supplierUser1);
        supplier1.setCreatedAt(LocalDateTime.now());
        supplier1 = supplierRepository.save(supplier1);

        SellerProfile profile1 = new SellerProfile();
        profile1.setUser(supplierUser1);
        profile1.setCompanyName("Acme Chemicals Pvt Ltd");
        profile1.setGstNumber("27ABCDE1234F1Z5");
        profile1.setAddress("Industrial Area 4");
        profile1.setCity("Mumbai");
        profile1.setState("Maharashtra");
        profile1.setCountry("India");
        profile1.setWebsite("https://acmechem.example.com");
        profile1.setCertifications("ISO 9001:2015");
        profile1.setAboutCompany("Leading manufacturer of high purity solvents");
        sellerProfileRepository.save(profile1);

        supplierUser2 = new User();
        supplierUser2.setName("Global Pharms");
        supplierUser2.setEmail("contact@globalpharms.com");
        supplierUser2.setPasswordHash("hash123");
        supplierUser2.setRole(UserRole.SUPPLIER);
        supplierUser2.setStatus(UserStatus.ACTIVE);
        supplierUser2 = userRepository.save(supplierUser2);

        supplier2 = new Supplier();
        supplier2.setName("Global Pharma Ltd");
        supplier2.setSlug("global-pharma-ltd");
        supplier2.setCountryCode("DE");
        supplier2.setCountryName("Germany");
        supplier2.setVerified(true);
        supplier2.setExportReady(true);
        supplier2.setYearsInBusiness(25);
        supplier2.setResponseRate(98);
        supplier2.setUser(supplierUser2);
        supplier2.setCreatedAt(LocalDateTime.now());
        supplier2 = supplierRepository.save(supplier2);

        adminAuth = new UsernamePasswordAuthenticationToken(admin.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
    }

    @Test
    public void testGetSuppliers_PaginationAndFilters() {
        Page<AdminSupplierResponse> all = adminSupplierService.getSuppliers(0, 10, null, null, null, null, null, false);
        assertEquals(2, all.getTotalElements());

        // Country filter
        Page<AdminSupplierResponse> inIndia = adminSupplierService.getSuppliers(0, 10, null, "IN", null, null, null, false);
        assertEquals(1, inIndia.getTotalElements());
        assertEquals("Acme Chemicals", inIndia.getContent().get(0).name());

        // Verified filter
        Page<AdminSupplierResponse> verified = adminSupplierService.getSuppliers(0, 10, null, null, true, null, null, false);
        assertEquals(1, verified.getTotalElements());
        assertEquals("Global Pharma Ltd", verified.getContent().get(0).name());

        // Export ready filter
        Page<AdminSupplierResponse> exportReady = adminSupplierService.getSuppliers(0, 10, null, null, null, true, null, false);
        assertEquals(1, exportReady.getTotalElements());
        assertEquals("Global Pharma Ltd", exportReady.getContent().get(0).name());
    }

    @Test
    public void testGetSupplierDetail_WithSellerProfile() {
        AdminSupplierDetailResponse detail = adminSupplierService.getSupplierDetail(supplier1.getId());
        assertNotNull(detail);
        assertEquals("Acme Chemicals", detail.name());
        assertNotNull(detail.sellerProfile());
        assertEquals("Acme Chemicals Pvt Ltd", detail.sellerProfile().companyName());
        assertEquals("27ABCDE1234F1Z5", detail.sellerProfile().gstNumber());
    }

    @Test
    public void testGetSupplierDetail_NotFound() {
        assertThrows(ResourceNotFoundException.class, () -> {
            adminSupplierService.getSupplierDetail(99999L);
        });
    }

    @Test
    public void testUpdateVerification_VerifyAndUnverify_WithAudit() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.5");

        // Verify supplier1
        AdminSupplierResponse verified = adminSupplierService.updateVerification(
                supplier1.getId(),
                new UpdateSupplierVerificationRequest(true, "Passed audit verification"),
                adminAuth,
                request
        );

        assertTrue(verified.verified());

        List<AuditLog> logs = auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(
                AuditTargetType.SUPPLIER,
                supplier1.getId().toString()
        );
        assertEquals(1, logs.size());
        assertEquals(AuditAction.SUPPLIER_VERIFIED, logs.get(0).getAction());
        assertEquals("Passed audit verification", logs.get(0).getDetails());

        // Unverify supplier1
        AdminSupplierResponse unverified = adminSupplierService.updateVerification(
                supplier1.getId(),
                new UpdateSupplierVerificationRequest(false, "Expired documents"),
                adminAuth,
                request
        );

        assertFalse(unverified.verified());
        assertEquals(2, auditLogRepository.count());
    }

    @Test
    public void testUpdateExportReady_ToggleWithAudit() {
        AdminSupplierResponse updated = adminSupplierService.updateExportReady(
                supplier1.getId(),
                new UpdateSupplierExportReadyRequest(true, "Obtained IEC certificate"),
                adminAuth,
                null
        );

        assertTrue(updated.exportReady());

        List<AuditLog> logs = auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(
                AuditTargetType.SUPPLIER,
                supplier1.getId().toString()
        );
        assertEquals(1, logs.size());
        assertEquals(AuditAction.SUPPLIER_EXPORT_READY_CHANGED, logs.get(0).getAction());
    }

    @Test
    public void testUpdateSupplierStatus_SuspendAndActivate() {
        // Suspend supplier1
        AdminSupplierResponse suspended = adminSupplierService.updateSupplierStatus(
                supplier1.getId(),
                new UpdateSupplierStatusRequest(UserStatus.SUSPENDED, "Regulatory warning"),
                adminAuth,
                null
        );

        assertEquals(UserStatus.SUSPENDED, suspended.userStatus());

        User reloadedUser = userRepository.findById(supplierUser1.getId()).orElseThrow();
        assertEquals(UserStatus.SUSPENDED, reloadedUser.getStatus());

        List<AuditLog> logs = auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(
                AuditTargetType.SUPPLIER,
                supplier1.getId().toString()
        );
        assertEquals(1, logs.size());
        assertEquals(AuditAction.SUPPLIER_SUSPENDED, logs.get(0).getAction());
    }

    @Test
    public void testUpdateSupplierStatus_SoftDeletedAccountBlocked() {
        supplierUser1.setDeletedAt(Instant.now());
        supplierUser1.setStatus(UserStatus.SUSPENDED);
        userRepository.save(supplierUser1);

        assertThrows(IllegalStateException.class, () -> {
            adminSupplierService.updateSupplierStatus(
                    supplier1.getId(),
                    new UpdateSupplierStatusRequest(UserStatus.ACTIVE, "Try restoring deleted"),
                    adminAuth,
                    null
            );
        });
    }
}
