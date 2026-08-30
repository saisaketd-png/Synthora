package com.synthora.admin.audit;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@org.springframework.transaction.annotation.Transactional
public class AuditServiceSecurityTest {

    @Autowired
    private AuditService auditService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User adminUser;
    private User regularUser;
    private User supplierUser;

    private Authentication adminAuth;
    private Authentication userAuth;
    private Authentication supplierAuth;

    @BeforeEach
    public void setup() {
        for (String sql : List.of(
                "UPDATE rfqs SET accepted_quotation_id = NULL",
                "DELETE FROM buyer_shortlist_items",
                "DELETE FROM buyer_shortlists",
                "DELETE FROM governance_audit_logs",
                "DELETE FROM audit_logs",
                "DELETE FROM notifications",
                "DELETE FROM supplier_offering_verification_evidences",
                "DELETE FROM supplier_offering_audits",
                "DELETE FROM supplier_verification_evidences",
                "DELETE FROM supplier_verification_audits",
                "DELETE FROM product_requests",
                "DELETE FROM sourcing_requests",
                "DELETE FROM documents",
                "DELETE FROM shipments",
                "DELETE FROM purchase_orders",
                "DELETE FROM quotations",
                "DELETE FROM rfqs",
                "DELETE FROM supplier_offerings",
                "DELETE FROM product_master_mappings",
                "DELETE FROM master_products",
                "DELETE FROM product_images",
                "DELETE FROM product_suppliers",
                "DELETE FROM products",
                "DELETE FROM seller_profiles",
                "DELETE FROM suppliers",
                "DELETE FROM email_verification_tokens",
                "DELETE FROM password_reset_tokens",
                "DELETE FROM users"
        )) {
            try {
                jdbcTemplate.execute(sql);
            } catch (Exception ignored) {}
        }

        adminUser = new User();
        adminUser.setEmail("superadmin@synthora.com");
        adminUser.setName("Super Admin");
        adminUser.setPasswordHash("hash");
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setStatus(UserStatus.ACTIVE);
        adminUser = userRepository.save(adminUser);
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        regularUser = new User();
        regularUser.setEmail("buyer@enterprise.com");
        regularUser.setName("Buyer User");
        regularUser.setPasswordHash("hash");
        regularUser.setRole(UserRole.USER);
        regularUser.setStatus(UserStatus.ACTIVE);
        regularUser = userRepository.save(regularUser);
        userAuth = new UsernamePasswordAuthenticationToken(regularUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        supplierUser = new User();
        supplierUser.setEmail("supplier@acme.com");
        supplierUser.setName("Supplier User");
        supplierUser.setPasswordHash("hash");
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser.setStatus(UserStatus.ACTIVE);
        supplierUser = userRepository.save(supplierUser);
        supplierAuth = new UsernamePasswordAuthenticationToken(supplierUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));
    }

    @Test
    public void testAuditService_AdminSuccessfullyRecordsAudit() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("192.168.1.50");

        AuditLog log = auditService.record(
                adminAuth,
                AuditAction.USER_SUSPENDED,
                AuditTargetType.USER,
                regularUser.getId().toString(),
                "Suspended for non-payment",
                request
        );

        assertNotNull(log.getId());
        assertEquals(adminUser.getId(), log.getAdminId());
        assertEquals(AuditAction.USER_SUSPENDED, log.getAction());
        assertEquals(AuditTargetType.USER, log.getTargetType());
        assertEquals(regularUser.getId().toString(), log.getTargetId());
        assertEquals("Suspended for non-payment", log.getDetails());
        assertEquals("192.168.1.50", log.getIpAddress());

        assertEquals(1, auditLogRepository.count());
    }

    @Test
    public void testAuditService_RegularUserRejected() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.1");

        assertThrows(AccessDeniedException.class, () -> {
            auditService.record(
                    userAuth,
                    AuditAction.USER_SUSPENDED,
                    AuditTargetType.USER,
                    supplierUser.getId().toString(),
                    "Attempted suspension",
                    request
            );
        });

        assertEquals(0, auditLogRepository.count(), "No audit entry should be created for unauthorized user");
    }

    @Test
    public void testAuditService_SupplierUserRejected() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.2");

        assertThrows(AccessDeniedException.class, () -> {
            auditService.record(
                    supplierAuth,
                    AuditAction.SUPPLIER_VERIFIED,
                    AuditTargetType.SUPPLIER,
                    "1001",
                    "Attempted self-verification",
                    request
            );
        });

        assertEquals(0, auditLogRepository.count());
    }

    @Test
    public void testAuditService_UnauthenticatedRejected() {
        assertThrows(AccessDeniedException.class, () -> {
            auditService.record(
                    null,
                    AuditAction.USER_SUSPENDED,
                    AuditTargetType.USER,
                    "target-id",
                    "No auth",
                    (String) null
            );
        });

        assertEquals(0, auditLogRepository.count());
    }

    @Test
    public void testAuditService_UnknownEmailRejected() {
        Authentication ghostAuth = new UsernamePasswordAuthenticationToken("ghost@synthora.com", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        assertThrows(AccessDeniedException.class, () -> {
            auditService.record(
                    ghostAuth,
                    AuditAction.USER_ACTIVATED,
                    AuditTargetType.USER,
                    "target-id",
                    "Ghost admin",
                    (String) null
            );
        });

        assertEquals(0, auditLogRepository.count());
    }

    @Test
    public void testAuditService_IpExtractionFromXForwardedFor() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Forwarded-For", "203.0.113.195, 70.41.3.18, 150.172.238.178");
        request.setRemoteAddr("127.0.0.1");

        AuditLog log = auditService.record(
                adminAuth,
                AuditAction.SUPPLIER_VERIFIED,
                AuditTargetType.SUPPLIER,
                "500",
                "Verified ISO compliance",
                request
        );

        // Must extract the first IP (original client)
        assertEquals("203.0.113.195", log.getIpAddress());
    }

    @Test
    public void testAuditService_NullRequestHandledSafely() {
        AuditLog log = auditService.record(
                adminAuth,
                AuditAction.PRODUCT_DELETED,
                AuditTargetType.PRODUCT,
                UUID.randomUUID().toString(),
                "Product deleted by admin",
                (MockHttpServletRequest) null
        );

        assertNotNull(log.getId());
        assertNull(log.getIpAddress());
    }

    @Test
    public void testAuditService_ValidationErrorsOnMissingParameters() {
        assertThrows(IllegalArgumentException.class, () -> {
            auditService.recordInternal(null, AuditAction.USER_ACTIVATED, AuditTargetType.USER, "1", "d", "ip");
        });

        assertThrows(IllegalArgumentException.class, () -> {
            auditService.recordInternal(adminUser.getId(), null, AuditTargetType.USER, "1", "d", "ip");
        });

        assertThrows(IllegalArgumentException.class, () -> {
            auditService.recordInternal(adminUser.getId(), AuditAction.USER_ACTIVATED, null, "1", "d", "ip");
        });

        assertThrows(IllegalArgumentException.class, () -> {
            auditService.recordInternal(adminUser.getId(), AuditAction.USER_ACTIVATED, AuditTargetType.USER, "  ", "d", "ip");
        });
    }
}
