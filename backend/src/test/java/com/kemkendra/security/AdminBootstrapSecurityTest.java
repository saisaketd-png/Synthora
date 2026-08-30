package com.kemkendra.security;

import com.kemkendra.config.AdminBootstrap;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class AdminBootstrapSecurityTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    public void setup() {
        userRepository.findByEmail("testadmin@kemkendra.local").ifPresent(user -> userRepository.delete(user));
    }

    @Test
    @Transactional
    public void testAdminBootstrapCreatesSecureAdmin() {
        AdminBootstrap bootstrap = new AdminBootstrap(
                userRepository,
                passwordEncoder,
                true,
                "testadmin@kemkendra.local",
                "supersecure123"
        );

        bootstrap.run();

        Optional<User> adminOpt = userRepository.findByEmail("testadmin@kemkendra.local");
        assertTrue(adminOpt.isPresent(), "Admin user should be created");

        User admin = adminOpt.get();
        assertEquals(UserRole.ADMIN, admin.getRole(), "User should have ADMIN role");
        assertEquals("testadmin@kemkendra.local", admin.getEmail());

        // Password must be hashed, not plaintext
        assertNotEquals("supersecure123", admin.getPasswordHash());
        assertTrue(passwordEncoder.matches("supersecure123", admin.getPasswordHash()));
    }

    @Test
    @Transactional
    public void testAdminBootstrapIsIdempotent() {
        AdminBootstrap bootstrap = new AdminBootstrap(
                userRepository,
                passwordEncoder,
                true,
                "testadmin@kemkendra.local",
                "supersecure123"
        );

        // Run first time
        bootstrap.run();
        
        // Change password in DB to test idempotency
        User admin = userRepository.findByEmail("testadmin@kemkendra.local").get();
        String originalHash = admin.getPasswordHash();
        
        // Run second time
        bootstrap.run();
        
        User adminAfter = userRepository.findByEmail("testadmin@kemkendra.local").get();
        assertEquals(originalHash, adminAfter.getPasswordHash(), "Password hash should not change on second run");
        
        long adminCount = userRepository.findAll().stream()
                .filter(u -> u.getEmail().equals("testadmin@kemkendra.local"))
                .count();
        assertEquals(1, adminCount, "Should not create duplicate admin users");
    }

    @Test
    public void testAdminBootstrapFailsIfCredentialsMissing() {
        AdminBootstrap bootstrap = new AdminBootstrap(
                userRepository,
                passwordEncoder,
                true,
                null,
                "supersecure123"
        );

        assertThrows(IllegalStateException.class, bootstrap::run, "Should fail if email is missing");

        AdminBootstrap bootstrap2 = new AdminBootstrap(
                userRepository,
                passwordEncoder,
                true,
                "testadmin@kemkendra.local",
                ""
        );

        assertThrows(IllegalStateException.class, bootstrap2::run, "Should fail if password is empty");
    }
    
    @Test
    public void testAdminBootstrapDisabled() {
        AdminBootstrap bootstrap = new AdminBootstrap(
                userRepository,
                passwordEncoder,
                false,
                "testadmin@kemkendra.local",
                "supersecure123"
        );

        bootstrap.run();
        
        Optional<User> adminOpt = userRepository.findByEmail("testadmin@kemkendra.local");
        assertFalse(adminOpt.isPresent(), "Admin user should not be created if bootstrap is disabled");
    }
}
