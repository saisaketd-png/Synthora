package com.synthora.admin.user;

import com.synthora.admin.audit.AuditAction;
import com.synthora.admin.audit.AuditLog;
import com.synthora.admin.audit.AuditLogRepository;
import com.synthora.admin.audit.AuditTargetType;
import com.synthora.admin.user.dto.AdminUserDetailResponse;
import com.synthora.admin.user.dto.AdminUserResponse;
import com.synthora.admin.user.dto.UpdateUserRoleRequest;
import com.synthora.admin.user.dto.UpdateUserStatusRequest;
import com.synthora.common.ResourceNotFoundException;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
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
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class AdminUserServiceTest {

    @Autowired
    private AdminUserService adminUserService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User admin1;
    private User admin2;
    private User regularUser;
    private User supplierUser;

    private Authentication admin1Auth;

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

        admin1 = new User();
        admin1.setName("Alice Admin");
        admin1.setEmail("alice.admin@synthora.com");
        admin1.setPasswordHash("hash123");
        admin1.setRole(UserRole.ADMIN);
        admin1.setStatus(UserStatus.ACTIVE);
        admin1 = userRepository.save(admin1);

        admin2 = new User();
        admin2.setName("Bob Admin");
        admin2.setEmail("bob.admin@synthora.com");
        admin2.setPasswordHash("hash123");
        admin2.setRole(UserRole.ADMIN);
        admin2.setStatus(UserStatus.ACTIVE);
        admin2 = userRepository.save(admin2);

        regularUser = new User();
        regularUser.setName("Charlie Buyer");
        regularUser.setEmail("charlie.buyer@acme.com");
        regularUser.setPhone("+1234567890");
        regularUser.setPasswordHash("hash123");
        regularUser.setRole(UserRole.USER);
        regularUser.setStatus(UserStatus.ACTIVE);
        regularUser = userRepository.save(regularUser);

        supplierUser = new User();
        supplierUser.setName("Delta Supplier");
        supplierUser.setEmail("delta.supplier@chemicals.com");
        supplierUser.setPasswordHash("hash123");
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser.setStatus(UserStatus.ACTIVE);
        supplierUser = userRepository.save(supplierUser);

        admin1Auth = new UsernamePasswordAuthenticationToken(admin1.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
    }

    @Test
    public void testGetUsers_PaginationAndFiltering() {
        Page<AdminUserResponse> allUsers = adminUserService.getUsers(0, 10, null, null, null, false);
        assertEquals(4, allUsers.getTotalElements());

        // Role filter
        Page<AdminUserResponse> suppliers = adminUserService.getUsers(0, 10, null, UserRole.SUPPLIER, null, false);
        assertEquals(1, suppliers.getTotalElements());
        assertEquals("Delta Supplier", suppliers.getContent().get(0).name());

        // Status filter
        Page<AdminUserResponse> activeUsers = adminUserService.getUsers(0, 10, null, null, UserStatus.ACTIVE, false);
        assertEquals(4, activeUsers.getTotalElements());

        // Search query
        Page<AdminUserResponse> searched = adminUserService.getUsers(0, 10, "charlie", null, null, false);
        assertEquals(1, searched.getTotalElements());
        assertEquals("Charlie Buyer", searched.getContent().get(0).name());
    }

    @Test
    public void testGetUsers_ExcludesSoftDeletedByDefault() {
        regularUser.setDeletedAt(Instant.now());
        regularUser.setStatus(UserStatus.SUSPENDED);
        userRepository.save(regularUser);

        Page<AdminUserResponse> withoutDeleted = adminUserService.getUsers(0, 10, null, null, null, false);
        assertEquals(3, withoutDeleted.getTotalElements());

        Page<AdminUserResponse> withDeleted = adminUserService.getUsers(0, 10, null, null, null, true);
        assertEquals(4, withDeleted.getTotalElements());
    }

    @Test
    public void testGetUserDetail_SuccessAndNotFound() {
        AdminUserDetailResponse detail = adminUserService.getUserDetail(regularUser.getId());
        assertNotNull(detail);
        assertEquals("Charlie Buyer", detail.name());
        assertEquals("charlie.buyer@acme.com", detail.email());

        assertThrows(ResourceNotFoundException.class, () -> {
            adminUserService.getUserDetail(UUID.randomUUID());
        });
    }

    @Test
    public void testUpdateUserStatus_SuspendAndActivate_GeneratesAuditLogs() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.1");

        // Suspend Charlie
        UpdateUserStatusRequest suspendReq = new UpdateUserStatusRequest(UserStatus.SUSPENDED, "Violation of terms");
        AdminUserResponse suspended = adminUserService.updateUserStatus(regularUser.getId(), suspendReq, admin1Auth, request);

        assertEquals(UserStatus.SUSPENDED, suspended.status());

        User reloaded = userRepository.findById(regularUser.getId()).orElseThrow();
        assertEquals(UserStatus.SUSPENDED, reloaded.getStatus());

        List<AuditLog> auditLogs = auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(
                AuditTargetType.USER,
                regularUser.getId().toString()
        );
        assertEquals(1, auditLogs.size());
        assertEquals(AuditAction.USER_SUSPENDED, auditLogs.get(0).getAction());
        assertEquals("Violation of terms", auditLogs.get(0).getDetails());
        assertEquals(admin1.getId(), auditLogs.get(0).getAdminId());

        // Activate Charlie
        UpdateUserStatusRequest activateReq = new UpdateUserStatusRequest(UserStatus.ACTIVE, "Reinstated after review");
        AdminUserResponse activated = adminUserService.updateUserStatus(regularUser.getId(), activateReq, admin1Auth, request);

        assertEquals(UserStatus.ACTIVE, activated.status());
        assertEquals(2, auditLogRepository.count());
    }

    @Test
    public void testUpdateUserStatus_SelfSuspensionRejected() {
        UpdateUserStatusRequest suspendReq = new UpdateUserStatusRequest(UserStatus.SUSPENDED, "Self suspend");

        assertThrows(IllegalArgumentException.class, () -> {
            adminUserService.updateUserStatus(admin1.getId(), suspendReq, admin1Auth, null);
        });
    }

    @Test
    public void testUpdateUserStatus_LastAdminSuspensionRejected() {
        // Suspend admin2 first
        adminUserService.updateUserStatus(admin2.getId(), new UpdateUserStatusRequest(UserStatus.SUSPENDED, "Suspend admin2"), admin1Auth, null);

        // Now admin1 is the only ACTIVE admin. Suspending admin1 by admin2's credentials or attempting to suspend the last admin must fail.
        Authentication admin2Auth = new UsernamePasswordAuthenticationToken(admin2.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        assertThrows(IllegalStateException.class, () -> {
            adminUserService.updateUserStatus(admin1.getId(), new UpdateUserStatusRequest(UserStatus.SUSPENDED, "Suspend last admin"), admin2Auth, null);
        });
    }

    @Test
    public void testUpdateUserRole_PromoteAndDemote() {
        MockHttpServletRequest request = new MockHttpServletRequest();

        // Promote Charlie to SUPPLIER
        AdminUserResponse promoted = adminUserService.updateUserRole(
                regularUser.getId(),
                new UpdateUserRoleRequest(UserRole.SUPPLIER),
                admin1Auth,
                request
        );

        assertEquals(UserRole.SUPPLIER, promoted.role());

        List<AuditLog> auditLogs = auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(
                AuditTargetType.USER,
                regularUser.getId().toString()
        );
        assertEquals(1, auditLogs.size());
        assertEquals(AuditAction.USER_ROLE_CHANGED, auditLogs.get(0).getAction());
        assertTrue(auditLogs.get(0).getDetails().contains("USER to SUPPLIER"));
    }

    @Test
    public void testUpdateUserRole_SelfDemotionRejected() {
        assertThrows(IllegalArgumentException.class, () -> {
            adminUserService.updateUserRole(
                    admin1.getId(),
                    new UpdateUserRoleRequest(UserRole.USER),
                    admin1Auth,
                    null
            );
        });
    }

    @Test
    public void testUpdateUserRole_LastAdminDemotionRejected() {
        // Demote admin2 to USER
        adminUserService.updateUserRole(admin2.getId(), new UpdateUserRoleRequest(UserRole.USER), admin1Auth, null);

        // admin1 is now the sole active admin. Demoting admin1 must fail
        assertThrows(IllegalArgumentException.class, () -> {
            adminUserService.updateUserRole(admin1.getId(), new UpdateUserRoleRequest(UserRole.USER), admin1Auth, null);
        });
    }

    @Test
    public void testSoftDeleteUser_SuccessAndProtection() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("172.16.0.10");

        AdminUserResponse deleted = adminUserService.softDeleteUser(regularUser.getId(), admin1Auth, request);

        assertNotNull(deleted.deletedAt());
        assertEquals(UserStatus.SUSPENDED, deleted.status());

        User reloaded = userRepository.findById(regularUser.getId()).orElseThrow();
        assertNotNull(reloaded.getDeletedAt());
        assertEquals(admin1.getId(), reloaded.getDeletedBy());
        assertEquals(UserStatus.SUSPENDED, reloaded.getStatus());

        List<AuditLog> auditLogs = auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(
                AuditTargetType.USER,
                regularUser.getId().toString()
        );
        assertEquals(1, auditLogs.size());
        assertEquals(AuditAction.USER_DELETED, auditLogs.get(0).getAction());

        // Deleting again fails
        assertThrows(IllegalArgumentException.class, () -> {
            adminUserService.softDeleteUser(regularUser.getId(), admin1Auth, request);
        });

        // Self-deletion fails
        assertThrows(IllegalArgumentException.class, () -> {
            adminUserService.softDeleteUser(admin1.getId(), admin1Auth, request);
        });
    }
}
