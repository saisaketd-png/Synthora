package com.synthora.admin;

import com.synthora.admin.AdminSystemDataResetService;
import com.synthora.admin.dto.TestDataResetReportResponse;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AdminSystemResetSecurityTest {

    @Autowired
    private AdminSystemDataResetService dataResetService;

    @Autowired
    private UserRepository userRepository;

    private UsernamePasswordAuthenticationToken adminAuth;
    private UsernamePasswordAuthenticationToken supplierAuth;

    @BeforeEach
    public void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        User admin = new User();
        admin.setName("System Reset Admin " + suffix);
        admin.setEmail("reset_admin_" + suffix + "@synthora.com");
        admin.setPasswordHash("hash");
        admin.setRole(UserRole.ADMIN);
        admin = userRepository.save(admin);

        adminAuth = new UsernamePasswordAuthenticationToken(admin.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        User supplierUser = new User();
        supplierUser.setName("System Reset Supplier " + suffix);
        supplierUser.setEmail("reset_sup_" + suffix + "@synthora.com");
        supplierUser.setPasswordHash("hash");
        supplierUser.setRole(UserRole.SUPPLIER);
        userRepository.save(supplierUser);

        supplierAuth = new UsernamePasswordAuthenticationToken(supplierUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));
    }

    @Test
    public void test01_AdminCanExecuteTestDataReset() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        TestDataResetReportResponse report = dataResetService.executeTestDataReset(adminAuth);
        assertNotNull(report);
        assertTrue(report.statusMessage().contains("completed successfully"));
    }
}
