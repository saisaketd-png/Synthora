package com.synthora.admin.audit;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class AuditLogDomainTest {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User admin;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM users;");

        admin = new User();
        admin.setEmail("admin@synthora.com");
        admin.setName("Super Admin");
        admin.setPasswordHash("hash123");
        admin.setRole(UserRole.ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        admin = userRepository.save(admin);
    }

    @Test
    public void testAuditLog_PersistenceAndFieldIntegrity() {
        UUID targetId = UUID.randomUUID();
        AuditLog log = new AuditLog(
                admin.getId(),
                AuditAction.USER_SUSPENDED,
                AuditTargetType.USER,
                targetId.toString(),
                "Suspended for terms violation",
                "192.168.1.100"
        );

        AuditLog saved = auditLogRepository.save(log);

        assertNotNull(saved.getId(), "UUID primary key should be generated");
        assertEquals(admin.getId(), saved.getAdminId());
        assertEquals(AuditAction.USER_SUSPENDED, saved.getAction());
        assertEquals(AuditTargetType.USER, saved.getTargetType());
        assertEquals(targetId.toString(), saved.getTargetId());
        assertEquals("Suspended for terms violation", saved.getDetails());
        assertEquals("192.168.1.100", saved.getIpAddress());
        assertNotNull(saved.getCreatedAt(), "createdAt should be populated automatically");
    }

    @Test
    public void testAuditLog_NullableFieldsAllowed() {
        AuditLog log = new AuditLog(
                admin.getId(),
                AuditAction.SUPPLIER_VERIFIED,
                AuditTargetType.SUPPLIER,
                "1001",
                null, // null details
                null  // null IP
        );

        AuditLog saved = auditLogRepository.save(log);

        assertNotNull(saved.getId());
        assertNull(saved.getDetails());
        assertNull(saved.getIpAddress());
        assertEquals(AuditAction.SUPPLIER_VERIFIED, saved.getAction());
    }

    @Test
    public void testAuditLog_QueryByAdminId_PaginatedAndSorted() {
        for (int i = 0; i < 5; i++) {
            AuditLog log = new AuditLog(
                    admin.getId(),
                    AuditAction.PRODUCT_UPDATED,
                    AuditTargetType.PRODUCT,
                    "prod-" + i,
                    "Updated product " + i,
                    "10.0.0.1"
            );
            auditLogRepository.save(log);
        }

        Page<AuditLog> page = auditLogRepository.findByAdminIdOrderByCreatedAtDesc(
                admin.getId(),
                PageRequest.of(0, 3)
        );

        assertEquals(5, page.getTotalElements());
        assertEquals(3, page.getContent().size());
        assertEquals(2, page.getTotalPages());
    }

    @Test
    public void testAuditLog_QueryByTargetTypeAndTargetId() {
        String targetUserId = UUID.randomUUID().toString();

        auditLogRepository.save(new AuditLog(
                admin.getId(),
                AuditAction.USER_ACTIVATED,
                AuditTargetType.USER,
                targetUserId,
                "Activated account",
                "127.0.0.1"
        ));

        auditLogRepository.save(new AuditLog(
                admin.getId(),
                AuditAction.USER_ROLE_CHANGED,
                AuditTargetType.USER,
                targetUserId,
                "Promoted to SUPPLIER",
                "127.0.0.1"
        ));

        // Different target
        auditLogRepository.save(new AuditLog(
                admin.getId(),
                AuditAction.PRODUCT_DELETED,
                AuditTargetType.PRODUCT,
                "prod-999",
                "Deleted prohibited product",
                "127.0.0.1"
        ));

        List<AuditLog> targetLogs = auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(
                AuditTargetType.USER,
                targetUserId
        );

        assertEquals(2, targetLogs.size());
        assertEquals(AuditAction.USER_ROLE_CHANGED, targetLogs.get(0).getAction());
        assertEquals(AuditAction.USER_ACTIVATED, targetLogs.get(1).getAction());
    }

    @Test
    public void testAuditLog_QueryByAction() {
        auditLogRepository.save(new AuditLog(admin.getId(), AuditAction.DOCUMENT_DELETED, AuditTargetType.DOCUMENT, "doc-1", "Deleted doc 1", null));
        auditLogRepository.save(new AuditLog(admin.getId(), AuditAction.DOCUMENT_DELETED, AuditTargetType.DOCUMENT, "doc-2", "Deleted doc 2", null));
        auditLogRepository.save(new AuditLog(admin.getId(), AuditAction.USER_SUSPENDED, AuditTargetType.USER, "user-1", "Suspended user", null));

        Page<AuditLog> docDeletions = auditLogRepository.findByActionOrderByCreatedAtDesc(
                AuditAction.DOCUMENT_DELETED,
                PageRequest.of(0, 10)
        );

        assertEquals(2, docDeletions.getTotalElements());
    }

    @Test
    public void testAuditLog_AllActionsSupported() {
        for (AuditAction action : AuditAction.values()) {
            AuditLog log = new AuditLog(
                    admin.getId(),
                    action,
                    AuditTargetType.USER,
                    "target-" + action.name(),
                    "Testing action " + action.name(),
                    "127.0.0.1"
            );
            AuditLog saved = auditLogRepository.save(log);
            assertNotNull(saved.getId());
            assertEquals(action, saved.getAction());
        }
    }
}
