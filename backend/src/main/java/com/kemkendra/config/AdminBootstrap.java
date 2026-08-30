package com.kemkendra.config;

import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrap implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean bootstrapEnabled;
    private final String adminEmail;
    private final String adminPassword;

    public AdminBootstrap(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          @Value("${ADMIN_BOOTSTRAP_ENABLED:false}") boolean bootstrapEnabled,
                          @Value("${ADMIN_EMAIL:#{null}}") String adminEmail,
                          @Value("${ADMIN_PASSWORD:#{null}}") String adminPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.bootstrapEnabled = bootstrapEnabled;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(String... args) {
        if (!bootstrapEnabled) {
            log.info("Admin bootstrap is disabled.");
            return;
        }

        if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            String errorMsg = "ADMIN_BOOTSTRAP_ENABLED is true, but ADMIN_EMAIL or ADMIN_PASSWORD is missing or blank.";
            log.error(errorMsg);
            throw new IllegalStateException(errorMsg);
        }

        userRepository.findByEmail(adminEmail).ifPresentOrElse(
                admin -> log.info("Admin user {} already exists. Skipping bootstrap.", adminEmail),
                () -> {
                    log.info("Bootstrapping admin user: {}", adminEmail);
                    User admin = new User();
                    admin.setName("System Admin");
                    admin.setEmail(adminEmail);
                    admin.setPasswordHash(passwordEncoder.encode(adminPassword));
                    admin.setRole(UserRole.ADMIN);
                    admin.setStatus(UserStatus.ACTIVE);
                    userRepository.save(admin);
                    log.info("Admin user bootstrapped successfully.");
                }
        );
    }
}
