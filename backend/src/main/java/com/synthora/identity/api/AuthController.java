package com.synthora.identity.api;

import com.synthora.identity.dto.ForgotPasswordRequest;
import com.synthora.identity.dto.ForgotPasswordResponse;
import com.synthora.identity.dto.LoginRequest;
import com.synthora.identity.dto.LoginResponse;
import com.synthora.identity.dto.RegisterRequest;
import com.synthora.identity.dto.ResendVerificationRequest;
import com.synthora.identity.dto.ResendVerificationResponse;
import com.synthora.identity.dto.ResetPasswordRequest;
import com.synthora.identity.dto.ResetPasswordResponse;
import com.synthora.identity.dto.SupplierRegisterRequest;
import com.synthora.identity.dto.SupplierRegisterResponse;
import com.synthora.identity.dto.UserResponse;
import com.synthora.identity.dto.VerifyEmailRequest;
import com.synthora.identity.dto.VerifyEmailResponse;
import com.synthora.identity.service.EmailVerificationService;
import com.synthora.identity.service.PasswordResetService;
import com.synthora.identity.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserService userService;
    private final PasswordResetService passwordResetService;
    private final EmailVerificationService emailVerificationService;

    public AuthController(UserService userService,
                          PasswordResetService passwordResetService,
                          EmailVerificationService emailVerificationService) {
        this.userService = userService;
        this.passwordResetService = passwordResetService;
        this.emailVerificationService = emailVerificationService;
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

        LoginResponse response = userService.login(request, ip);
        return ResponseEntity.ok(response);
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
