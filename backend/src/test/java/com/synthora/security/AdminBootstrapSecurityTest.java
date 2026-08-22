package com.synthora.security;

import com.synthora.config.AdminBootstrap;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
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
        userRepository.findByEmail("testadmin@synthora.local").ifPresent(user -> userRepository.delete(user));
    }

    @Test
    @Transactional
    public void testAdminBootstrapCreatesSecureAdmin() {
        AdminBootstrap bootstrap = new AdminBootstrap(
                userRepository,
                passwordEncoder,
                true,
                "testadmin@synthora.local",
                "supersecure123"
        );

        bootstrap.run();

        Optional<User> adminOpt = userRepository.findByEmail("testadmin@synthora.local");
        assertTrue(adminOpt.isPresent(), "Admin user should be created");

        User admin = adminOpt.get();
        assertEquals(UserRole.ADMIN, admin.getRole(), "User should have ADMIN role");
        assertEquals("testadmin@synthora.local", admin.getEmail());

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
                "testadmin@synthora.local",
                "supersecure123"
        );

        // Run first time
        bootstrap.run();
        
        // Change password in DB to test idempotency
        User admin = userRepository.findByEmail("testadmin@synthora.local").get();
        String originalHash = admin.getPasswordHash();
        
        // Run second time
        bootstrap.run();
        
        User adminAfter = userRepository.findByEmail("testadmin@synthora.local").get();
        assertEquals(originalHash, adminAfter.getPasswordHash(), "Password hash should not change on second run");
        
        long adminCount = userRepository.findAll().stream()
                .filter(u -> u.getEmail().equals("testadmin@synthora.local"))
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
                "testadmin@synthora.local",
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
                "testadmin@synthora.local",
                "supersecure123"
        );

        bootstrap.run();
        
        Optional<User> adminOpt = userRepository.findByEmail("testadmin@synthora.local");
        assertFalse(adminOpt.isPresent(), "Admin user should not be created if bootstrap is disabled");
    }
}
