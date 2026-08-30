package com.kemkendra.admin;

import com.kemkendra.admin.AdminSystemDataResetService;
import com.kemkendra.admin.dto.TestDataResetReportResponse;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
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
        admin.setEmail("reset_admin_" + suffix + "@kemkendra.com");
        admin.setPasswordHash("hash");
        admin.setRole(UserRole.ADMIN);
        admin = userRepository.save(admin);

        adminAuth = new UsernamePasswordAuthenticationToken(admin.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        User supplierUser = new User();
        supplierUser.setName("System Reset Supplier " + suffix);
        supplierUser.setEmail("reset_sup_" + suffix + "@kemkendra.com");
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
