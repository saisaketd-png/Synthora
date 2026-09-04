package com.kemkendra.identity.service;

import com.kemkendra.identity.PasswordResetToken;
import com.kemkendra.identity.PasswordResetTokenRepository;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.dto.ForgotPasswordRequest;
import com.kemkendra.identity.dto.ForgotPasswordResponse;
import com.kemkendra.identity.dto.ResetPasswordRequest;
import com.kemkendra.identity.dto.ResetPasswordResponse;
import com.kemkendra.notification.email.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int TOKEN_BYTE_LENGTH = 32;
    private static final long EXPIRATION_MINUTES = 15;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final RefreshTokenService refreshTokenService;
    private final String appBaseUrl;

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            RefreshTokenService refreshTokenService,
            @Value("${kemkendra.app.base-url:http://localhost:3000}") String appBaseUrl) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.refreshTokenService = refreshTokenService;
        this.appBaseUrl = appBaseUrl != null && appBaseUrl.endsWith("/")
                ? appBaseUrl.substring(0, appBaseUrl.length() - 1)
                : (appBaseUrl != null ? appBaseUrl : "http://localhost:3000");
    }

    @Transactional
    public ForgotPasswordResponse processForgotPassword(ForgotPasswordRequest request) {
        String email = request.email() != null ? request.email().trim().toLowerCase() : "";
        if (email.isBlank()) {
            return ForgotPasswordResponse.ofDefault();
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            log.info("Password reset requested for non-existent email (anti-enumeration response returned)");
            return ForgotPasswordResponse.ofDefault();
        }

        User user = userOpt.get();
        if (user.getDeletedAt() != null) {
            log.info("Password reset requested for deleted account ID: {}", user.getId());
            return ForgotPasswordResponse.ofDefault();
        }

        // Invalidate any previously generated active tokens for this user
        passwordResetTokenRepository.invalidateActiveTokensForUser(user, Instant.now());

        // Generate cryptographically secure token
        byte[] randomBytes = new byte[TOKEN_BYTE_LENGTH];
        SECURE_RANDOM.nextBytes(randomBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        // Store SHA-256 hash of the token (never the raw token)
        String tokenHash = hashToken(rawToken);
        Instant expiresAt = Instant.now().plus(EXPIRATION_MINUTES, ChronoUnit.MINUTES);

        PasswordResetToken resetToken = new PasswordResetToken(null, user, tokenHash, expiresAt);
        passwordResetTokenRepository.save(resetToken);

        // Build reset link using app base URL and dispatch email
        String resetUrl = appBaseUrl + "/reset-password?token=" + rawToken;
        sendResetEmail(user, resetUrl);

        log.info("Dispatched password reset for user ID: {}, recipient: {}", user.getId(), user.getEmail());
        return ForgotPasswordResponse.ofDefault();
    }

    @Transactional
    public ResetPasswordResponse resetPassword(ResetPasswordRequest request) {
        String rawToken = request.token() != null ? request.token().trim() : "";
        if (rawToken.isBlank()) {
            throw new IllegalArgumentException("Invalid or expired password reset link.");
        }

        String tokenHash = hashToken(rawToken);
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired password reset link."));

        if (resetToken.isUsed()) {
            throw new IllegalArgumentException("This password reset link has already been used. Please request a new one.");
        }

        if (resetToken.isExpired()) {
            throw new IllegalArgumentException("This password reset link has expired. Please request a new one.");
        }

        User user = resetToken.getUser();
        if (user == null || user.getDeletedAt() != null) {
            throw new IllegalArgumentException("User account is inactive or not found.");
        }

        // Update password using existing PasswordEncoder and record password change timestamp for session revocation
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setPasswordChangedAt(Instant.now());
        userRepository.save(user);

        // Mark token as used
        Instant now = Instant.now();
        resetToken.setUsedAt(now);
        passwordResetTokenRepository.save(resetToken);

        // Invalidate any other outstanding tokens for this user
        passwordResetTokenRepository.invalidateActiveTokensForUser(user, now);

        // Revoke all active refresh sessions for this user (Phase C.2)
        refreshTokenService.revokeAllUserSessions(user.getId());

        log.info("Password successfully reset for user ID: {}", user.getId());
        return ResetPasswordResponse.ofDefault();
    }

    public static String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    private void sendResetEmail(User user, String resetUrl) {
        String recipientName = user.getName() != null && !user.getName().isBlank()
                ? HtmlUtils.htmlEscape(user.getName())
                : "Valued Partner";
        String escapedUrl = HtmlUtils.htmlEscape(resetUrl);

        String subject = "[KemKendra] Reset Your Password";
        String htmlBody = """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <title>Reset your KemKendra password</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
                    <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 48px 16px;">
                        <tr>
                            <td align="center">
                                <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); overflow: hidden;">
                                    <!-- Minimal Header -->
                                    <tr>
                                        <td style="padding: 32px 40px 24px 40px; border-bottom: 1px solid #f1f5f9;">
                                            <table width="100%%" border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td>
                                                        <span style="font-size: 16px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px;">KEMKENDRA</span>
                                                        <span style="display: inline-block; margin-left: 8px; font-size: 13px; color: #94a3b8; font-weight: 400;">&bull;&nbsp; Global B2B Chemical Marketplace</span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <!-- Editorial Body -->
                                    <tr>
                                        <td style="padding: 36px 40px 32px 40px;">
                                            <h1 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 600; color: #0f172a; letter-spacing: -0.2px; line-height: 28px;">
                                                Password reset request
                                            </h1>
                                            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #334155;">
                                                Hello %s,
                                            </p>
                                            <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 24px; color: #334155;">
                                                We received a request to reset the password for your KemKendra account. Click the button below to choose a new password.
                                            </p>
                                            <!-- Solid Primary Action -->
                                            <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 28px 0;">
                                                <tr>
                                                    <td align="center" style="border-radius: 6px; background-color: #0f172a;">
                                                        <a href="%s" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px; background-color: #0f172a;">
                                                            Reset Password
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                            <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 20px; color: #64748b;">
                                                This link expires in 15 minutes. If you did not request a password reset, your account remains secure and no action is needed.
                                            </p>
                                            <!-- Monospace direct link -->
                                            <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
                                                <p style="margin: 0 0 4px 0; font-size: 12px; color: #94a3b8;">
                                                    Trouble with the button? Use this URL directly:
                                                </p>
                                                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #2563eb; word-break: break-all; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
                                                    <a href="%s" target="_blank" style="color: #2563eb; text-decoration: underline;">%s</a>
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                    <!-- Understated Footer -->
                                    <tr>
                                        <td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #f1f5f9;">
                                            <p style="margin: 0 0 4px 0; font-size: 12px; line-height: 18px; color: #64748b;">
                                                KemKendra Inc. &bull; Enterprise Chemical Sourcing &amp; Compliance
                                            </p>
                                            <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                                                &copy; %d KemKendra. All rights reserved.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(recipientName, escapedUrl, escapedUrl, escapedUrl, java.time.Year.now().getValue());

        emailService.sendHtmlEmail(user.getEmail(), subject, htmlBody);
    }
}
