package com.kemkendra.identity.service;

import java.util.UUID;
import java.util.List;
import java.util.Optional;
import com.kemkendra.common.ResourceNotFoundException;
import com.kemkendra.security.JwtService;
import com.kemkendra.security.LoginRateLimiterService;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.identity.dto.RegisterRequest;
import com.kemkendra.identity.dto.UserResponse;
import com.kemkendra.identity.dto.LoginRequest;
import com.kemkendra.identity.dto.LoginResponse;
import com.kemkendra.identity.dto.SupplierRegisterRequest;
import com.kemkendra.product.Supplier;
import com.kemkendra.product.SupplierRepository;
import com.kemkendra.seller.SellerProfile;
import com.kemkendra.seller.SellerProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import java.time.LocalDateTime;
import java.time.Instant;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginRateLimiterService rateLimiterService;
    private final com.kemkendra.identity.PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailVerificationService emailVerificationService;
    private final com.kemkendra.admin.audit.AuditService auditService;
    private com.kemkendra.admin.config.FeatureToggleService featureToggleService;

    public UserService(UserRepository userRepository,
                       SupplierRepository supplierRepository,
                       SellerProfileRepository sellerProfileRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       LoginRateLimiterService rateLimiterService,
                       com.kemkendra.identity.PasswordResetTokenRepository passwordResetTokenRepository,
                       EmailVerificationService emailVerificationService,
                       com.kemkendra.admin.audit.AuditService auditService) {
        this.userRepository = userRepository;
        this.supplierRepository = supplierRepository;
        this.sellerProfileRepository = sellerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.rateLimiterService = rateLimiterService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailVerificationService = emailVerificationService;
        this.auditService = auditService;
    }

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    public void setFeatureToggleService(com.kemkendra.admin.config.FeatureToggleService featureToggleService) {
        this.featureToggleService = featureToggleService;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (featureToggleService != null) {
            if (featureToggleService.isMaintenanceModeActive()) {
                throw new IllegalStateException("The platform is currently in maintenance mode. Registration is unavailable.");
            }
            if (!featureToggleService.isFeatureEnabled("BUYER_REGISTRATION_ENABLED")) {
                throw new IllegalStateException("Buyer registration is currently disabled by administrator policy.");
            }
        }

        if (!Boolean.TRUE.equals(request.termsAccepted()) || !Boolean.TRUE.equals(request.privacyAccepted())) {
            throw new IllegalArgumentException("Terms of Service and Privacy Policy must be accepted.");
        }

        String email = request.email().trim().toLowerCase();
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPhone(request.phone() != null ? request.phone().trim() : null);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);
        user.setTermsAcceptedAt(Instant.now());
        user.setTermsVersion(com.kemkendra.common.LegalConstants.CURRENT_TERMS_VERSION);
        user.setPrivacyAcceptedAt(Instant.now());
        user.setPrivacyVersion(com.kemkendra.common.LegalConstants.CURRENT_PRIVACY_VERSION);

        User saved = userRepository.save(user);

        // Audit log
        try {
            auditService.recordInternal(
                    saved.getId(),
                    com.kemkendra.admin.audit.AuditAction.USER_CREATED,
                    com.kemkendra.admin.audit.AuditTargetType.USER,
                    saved.getId().toString(),
                    "User account created for " + saved.getEmail() + " with role " + saved.getRole(),
                    "127.0.0.1"
            );
        } catch (Exception ignored) {}

        // Dispatch verification email with secure token
        emailVerificationService.createAndSendVerificationToken(saved);

        return new UserResponse(
                saved.getId(),
                saved.getName(),
                saved.getEmail(),
                saved.getPhone(),
                saved.getRole(),
                saved.getStatus()
        );
    }

    @Transactional
    public com.kemkendra.identity.dto.SupplierRegisterResponse registerSupplier(SupplierRegisterRequest request) {
        if (featureToggleService != null) {
            if (featureToggleService.isMaintenanceModeActive()) {
                throw new IllegalStateException("The platform is currently in maintenance mode. Registration is unavailable.");
            }
            if (!featureToggleService.isFeatureEnabled("SUPPLIER_REGISTRATION_ENABLED")) {
                throw new IllegalStateException("Supplier registration is currently disabled by administrator policy.");
            }
        }

        if (!Boolean.TRUE.equals(request.termsAccepted()) || !Boolean.TRUE.equals(request.privacyAccepted())) {
            throw new IllegalArgumentException("Terms of Service and Privacy Policy must be accepted.");
        }

        String email = request.email().trim().toLowerCase();
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }

        // 1. Create User
        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPhone(request.phone() != null ? request.phone().trim() : null);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.SUPPLIER);
        user.setStatus(UserStatus.ACTIVE);
        user.setTermsAcceptedAt(Instant.now());
        user.setTermsVersion(com.kemkendra.common.LegalConstants.CURRENT_TERMS_VERSION);
        user.setPrivacyAcceptedAt(Instant.now());
        user.setPrivacyVersion(com.kemkendra.common.LegalConstants.CURRENT_PRIVACY_VERSION);
        User savedUser = userRepository.save(user);

        // Audit log
        try {
            auditService.recordInternal(
                    savedUser.getId(),
                    com.kemkendra.admin.audit.AuditAction.USER_CREATED,
                    com.kemkendra.admin.audit.AuditTargetType.USER,
                    savedUser.getId().toString(),
                    "Supplier user account created for " + savedUser.getEmail(),
                    "127.0.0.1"
            );
        } catch (Exception ignored) {}

        // 2. Generate slug
        String rawSlug = request.companyName().trim().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        if (rawSlug.isBlank()) {
            rawSlug = "supplier";
        }
        String slug = rawSlug + "-" + UUID.randomUUID().toString().substring(0, 8);

        // 3. Create Operational Supplier entity
        Supplier supplier = new Supplier();
        supplier.setUser(savedUser);
        supplier.setName(request.companyName().trim());
        supplier.setSlug(slug);
        supplier.setCountryCode(request.countryCode() != null && !request.countryCode().isBlank() ? request.countryCode().trim().toUpperCase() : "IN");
        supplier.setCountryName(request.country().trim());
        supplier.setVerified(false);
        supplier.setVerificationStatus(com.kemkendra.seller.SupplierVerificationStatus.DRAFT);
        supplier.setExportReady(false);
        supplier.setCreatedAt(LocalDateTime.now());
        Supplier savedSupplier = supplierRepository.save(supplier);

        // 4. Create Editable SellerProfile entity
        SellerProfile profile = new SellerProfile();
        profile.setUser(savedUser);
        profile.setCompanyName(request.companyName().trim());
        profile.setCountry(request.country().trim());
        profile.setCity(request.city() != null ? request.city().trim() : null);
        profile.setWebsite(request.website() != null ? request.website().trim() : null);
        profile.setAboutCompany(request.aboutCompany() != null ? request.aboutCompany().trim() : null);
        sellerProfileRepository.save(profile);

        // 5. Dispatch verification email (no automatic login token issued)
        emailVerificationService.createAndSendVerificationToken(savedUser);

        log.info("Supplier registration completed for user: {} (Company: {})", savedUser.getEmail(), request.companyName());

        return new com.kemkendra.identity.dto.SupplierRegisterResponse(
                "Supplier registered successfully. Please verify your email before logging in.",
                savedUser.getId(),
                savedUser.getEmail(),
                savedSupplier.getId()
        );
    }

    public LoginResponse login(LoginRequest request) {
        return login(request, null);
    }

    public LoginResponse login(LoginRequest request, String clientIp) {
        // 1. Rate limit verification
        rateLimiterService.checkRateLimit(clientIp, request.email());

        Optional<User> userOpt = userRepository.findByEmail(request.email());

        if (userOpt.isEmpty()) {
            rateLimiterService.recordFailedAttempt(clientIp, request.email());
            log.warn("Failed login attempt for nonexistent email: {}", request.email());
            throw new IllegalArgumentException("Invalid email or password");
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            rateLimiterService.recordFailedAttempt(clientIp, request.email());
            log.warn("Failed login attempt (bad password) for user: {}", user.getEmail());
            throw new IllegalArgumentException("Invalid email or password");
        }

        if (user.getDeletedAt() != null) {
            rateLimiterService.recordFailedAttempt(clientIp, request.email());
            log.warn("Failed login attempt on deactivated user: {}", user.getEmail());
            throw new IllegalArgumentException("Invalid email or password");
        }

        if (user.getStatus() == UserStatus.SUSPENDED) {
            rateLimiterService.recordSuccessfulLogin(clientIp, request.email());
            log.info("Suspended user authenticated for account review: {}", user.getEmail());
            String token = jwtService.generateToken(user);
            return new LoginResponse("Your KemKendra account is currently suspended. You can request an account review.", token);
        }

        if (user.getEmailVerifiedAt() == null && user.getRole() != UserRole.ADMIN) {
            rateLimiterService.recordFailedAttempt(clientIp, request.email());
            log.warn("Failed login attempt on unverified email: {}", user.getEmail());
            throw new IllegalArgumentException("Please verify your email address before logging in. Check your inbox for the verification link.");
        }

        // Login success - clear failed rate limit counter
        rateLimiterService.recordSuccessfulLogin(clientIp, request.email());
        log.info("Successful login for user: {} (Role: {})", user.getEmail(), user.getRole());

        String token = jwtService.generateToken(user);
        return new LoginResponse("Login successful", token);
    }

    public UserResponse getById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getStatus()
        );
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getName(),
                        user.getEmail(),
                        user.getPhone(),
                        user.getRole(),
                        user.getStatus()
                ))
                .toList();
    }

    public UserResponse getCurrentUser(Authentication authentication) {
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getStatus()
        );
    }

    @Transactional
    public UserResponse updateProfile(Authentication authentication, com.kemkendra.identity.dto.UpdateProfileRequest request) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setName(request.name().trim());

        String newPhone = request.phone() != null && !request.phone().isBlank()
                ? request.phone().trim()
                : null;

        if (newPhone != null) {
            Optional<User> existingUserWithPhone = userRepository.findByPhone(newPhone);
            if (existingUserWithPhone.isPresent() && !existingUserWithPhone.get().getId().equals(user.getId())) {
                throw new IllegalArgumentException("Phone number is already registered by another account.");
            }
        }
        user.setPhone(newPhone);

        User saved = userRepository.save(user);
        log.info("Profile updated successfully for user ID: {}", saved.getId());

        return new UserResponse(
                saved.getId(),
                saved.getName(),
                saved.getEmail(),
                saved.getPhone(),
                saved.getRole(),
                saved.getStatus()
        );
    }

    @Transactional
    public com.kemkendra.identity.dto.ChangePasswordResponse changePassword(
            Authentication authentication,
            com.kemkendra.identity.dto.ChangePasswordRequest request) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }

        if (request.currentPassword().equals(request.newPassword())) {
            throw new IllegalArgumentException("New password cannot be the same as current password.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        // Invalidate any active password-reset tokens
        passwordResetTokenRepository.invalidateActiveTokensForUser(user, java.time.Instant.now());

        log.info("Password changed successfully for user ID: {}", user.getId());
        return com.kemkendra.identity.dto.ChangePasswordResponse.ofDefault();
    }
}