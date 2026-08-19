package com.synthora.identity.service;

import java.util.UUID;
import java.util.List;
import java.util.Optional;
import com.synthora.common.ResourceNotFoundException;
import com.synthora.security.JwtService;
import com.synthora.security.LoginRateLimiterService;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.identity.dto.RegisterRequest;
import com.synthora.identity.dto.UserResponse;
import com.synthora.identity.dto.LoginRequest;
import com.synthora.identity.dto.LoginResponse;
import com.synthora.identity.dto.SupplierRegisterRequest;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.seller.SellerProfile;
import com.synthora.seller.SellerProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import java.time.LocalDateTime;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginRateLimiterService rateLimiterService;

    public UserService(UserRepository userRepository,
                       SupplierRepository supplierRepository,
                       SellerProfileRepository sellerProfileRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       LoginRateLimiterService rateLimiterService) {
        this.userRepository = userRepository;
        this.supplierRepository = supplierRepository;
        this.sellerProfileRepository = sellerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.rateLimiterService = rateLimiterService;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
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

        User saved = userRepository.save(user);

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
    public LoginResponse registerSupplier(SupplierRegisterRequest request) {
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
        User savedUser = userRepository.save(user);

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
        supplier.setExportReady(false);
        supplier.setCreatedAt(LocalDateTime.now());
        supplierRepository.save(supplier);

        // 4. Create Editable SellerProfile entity
        SellerProfile profile = new SellerProfile();
        profile.setUser(savedUser);
        profile.setCompanyName(request.companyName().trim());
        profile.setCountry(request.country().trim());
        profile.setCity(request.city() != null ? request.city().trim() : null);
        profile.setWebsite(request.website() != null ? request.website().trim() : null);
        profile.setAboutCompany(request.aboutCompany() != null ? request.aboutCompany().trim() : null);
        sellerProfileRepository.save(profile);

        log.info("Supplier onboarding completed for user: {} (Company: {})", savedUser.getEmail(), request.companyName());

        // 5. Generate token for immediate onboarding session
        String token = jwtService.generateToken(savedUser);
        return new LoginResponse("Supplier registered successfully", token);
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
            rateLimiterService.recordFailedAttempt(clientIp, request.email());
            log.warn("Failed login attempt on suspended user: {}", user.getEmail());
            throw new IllegalArgumentException("Invalid email or password");
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
}