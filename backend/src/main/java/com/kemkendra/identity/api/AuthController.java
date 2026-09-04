package com.kemkendra.identity.api;

import com.kemkendra.identity.User;
import com.kemkendra.identity.dto.ForgotPasswordRequest;
import com.kemkendra.identity.dto.ForgotPasswordResponse;
import com.kemkendra.identity.dto.LoginRequest;
import com.kemkendra.identity.dto.LoginResponse;
import com.kemkendra.identity.dto.RegisterRequest;
import com.kemkendra.identity.dto.ResendVerificationRequest;
import com.kemkendra.identity.dto.ResendVerificationResponse;
import com.kemkendra.identity.dto.ResetPasswordRequest;
import com.kemkendra.identity.dto.ResetPasswordResponse;
import com.kemkendra.identity.dto.SupplierRegisterRequest;
import com.kemkendra.identity.dto.SupplierRegisterResponse;
import com.kemkendra.identity.dto.UserResponse;
import com.kemkendra.identity.dto.VerifyEmailRequest;
import com.kemkendra.identity.dto.VerifyEmailResponse;
import com.kemkendra.identity.service.EmailVerificationService;
import com.kemkendra.identity.service.PasswordResetService;
import com.kemkendra.identity.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.kemkendra.identity.dto.LoginAuthResult;
import com.kemkendra.security.cookie.AuthCookieService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import java.time.Duration;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserService userService;
    private final PasswordResetService passwordResetService;
    private final EmailVerificationService emailVerificationService;
    private final com.kemkendra.identity.service.RefreshTokenService refreshTokenService;
    private final com.kemkendra.identity.UserRepository userRepository;
    private final AuthCookieService authCookieService;

    public AuthController(UserService userService,
                          PasswordResetService passwordResetService,
                          EmailVerificationService emailVerificationService,
                          com.kemkendra.identity.service.RefreshTokenService refreshTokenService,
                          com.kemkendra.identity.UserRepository userRepository,
                          AuthCookieService authCookieService) {
        this.userService = userService;
        this.passwordResetService = passwordResetService;
        this.emailVerificationService = emailVerificationService;
        this.refreshTokenService = refreshTokenService;
        this.userRepository = userRepository;
        this.authCookieService = authCookieService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(
            Authentication authentication) {

        UserResponse response = userService.getCurrentUser(authentication);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        UserResponse response = userService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/register/supplier")
    public ResponseEntity<SupplierRegisterResponse> registerSupplier(
            @Valid @RequestBody SupplierRegisterRequest request) {

        SupplierRegisterResponse response = userService.registerSupplier(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            jakarta.servlet.http.HttpServletRequest servletRequest) {

        String ip = servletRequest.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) {
            ip = servletRequest.getRemoteAddr();
        } else if (ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        String userAgent = servletRequest.getHeader("User-Agent");
        LoginAuthResult authResult = userService.login(request, ip, userAgent);

        ResponseEntity.BodyBuilder responseBuilder = ResponseEntity.ok();
        if (authResult.rawRefreshToken() != null) {
            ResponseCookie refreshCookie = authCookieService.createRefreshCookie(
                    authResult.rawRefreshToken(),
                    Duration.ofSeconds(authResult.refreshExpiresIn())
            );
            responseBuilder.header(HttpHeaders.SET_COOKIE, refreshCookie.toString());
        }

        LoginResponse response = new LoginResponse(
                authResult.message(),
                authResult.token(),
                authResult.expiresIn()
        );

        return responseBuilder.body(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<com.kemkendra.identity.dto.RefreshTokenResponse> refresh(
            jakarta.servlet.http.HttpServletRequest servletRequest) {

        String rawRefreshToken = authCookieService.extractRefreshToken(servletRequest)
                .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException("Refresh token cookie is missing or invalid"));

        String ip = servletRequest.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) {
            ip = servletRequest.getRemoteAddr();
        } else if (ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        String userAgent = servletRequest.getHeader("User-Agent");

        com.kemkendra.identity.dto.RefreshTokenRotateResult result =
                refreshTokenService.rotate(rawRefreshToken, ip, userAgent);

        ResponseCookie refreshCookie = authCookieService.createRefreshCookie(
                result.newRawRefreshToken(),
                Duration.ofSeconds(result.refreshExpiresIn())
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(new com.kemkendra.identity.dto.RefreshTokenResponse(result.token(), result.expiresIn()));
    }

    @PostMapping("/logout")
    public ResponseEntity<com.kemkendra.identity.dto.LogoutResponse> logout(
            jakarta.servlet.http.HttpServletRequest servletRequest) {

        java.util.Optional<String> tokenOpt = authCookieService.extractRefreshToken(servletRequest);
        if (tokenOpt.isPresent() && !tokenOpt.get().isBlank()) {
            refreshTokenService.logout(tokenOpt.get());
        }

        ResponseCookie clearCookie = authCookieService.clearRefreshCookie();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body(new com.kemkendra.identity.dto.LogoutResponse("Logged out successfully"));
    }

    @PostMapping("/logout-all")
    public ResponseEntity<com.kemkendra.identity.dto.LogoutResponse> logoutAll(
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException("User not found"));

        refreshTokenService.logoutAll(user);

        return ResponseEntity.ok(new com.kemkendra.identity.dto.LogoutResponse("All active sessions terminated successfully"));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<VerifyEmailResponse> verifyEmail(
            @Valid @RequestBody VerifyEmailRequest request) {

        VerifyEmailResponse response = emailVerificationService.verifyEmail(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<ResendVerificationResponse> resendVerification(
            @Valid @RequestBody ResendVerificationRequest request) {

        ResendVerificationResponse response = emailVerificationService.resendVerification(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {

        ForgotPasswordResponse response = passwordResetService.processForgotPassword(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ResetPasswordResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        ResetPasswordResponse response = passwordResetService.resetPassword(request);
        return ResponseEntity.ok(response);
    }
}
