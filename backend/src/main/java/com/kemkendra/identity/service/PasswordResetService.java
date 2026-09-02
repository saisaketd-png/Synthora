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
    private final String appBaseUrl;

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            @Value("${kemkendra.app.base-url:http://localhost:3000}") String appBaseUrl) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
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

        log.info("""

                ================================================================================
                [PASSWORD RESET DISPATCHED]
                Recipient: {} (User ID: {})
                Reset URL: {}
                ================================================================================""",
                user.getEmail(), user.getId(), resetUrl);
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

        // Update password using existing PasswordEncoder
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        // Mark token as used
        Instant now = Instant.now();
        resetToken.setUsedAt(now);
        passwordResetTokenRepository.save(resetToken);

        // Invalidate any other outstanding tokens for this user
        passwordResetTokenRepository.invalidateActiveTokensForUser(user, now);

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
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Reset Your Password</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
                    <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 20px;">
                        <tr>
                            <td align="center">
                                <table width="100%%" max-width="600" style="max-width: 600px; background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
                                    <!-- Header -->
                                    <tr>
                                        <td style="padding: 32px 40px; background: linear-gradient(135deg, #1e293b 0%%, #0f172a 100%%); border-bottom: 1px solid #334155;">
                                            <table width="100%%" border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td>
                                                        <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #38bdf8; letter-spacing: -0.5px;">KEMKENDRA</h1>
                                                        <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">B2B Chemical & Raw Materials Marketplace</p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <!-- Body -->
                                    <tr>
                                        <td style="padding: 40px;">
                                            <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #f8fafc;">Password Reset Request</h2>
                                            <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 24px; color: #cbd5e1;">
                                                Hello %s,
                                            </p>
                                            <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #cbd5e1;">
                                                We received a request to reset your password for your KemKendra account. Click the button below to choose a new password:
                                            </p>
                                            <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                                                <tr>
                                                    <td align="center">
                                                        <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%%, #0369a1 100%%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);">
                                                            Reset Password
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                            <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 20px; color: #94a3b8;">
                                                <strong>Note:</strong> This link will expire in <strong>15 minutes</strong> and can only be used once.
                                            </p>
                                            <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 20px; color: #94a3b8;">
                                                If you did not request this password reset, please ignore this email or contact security if you have concerns. Your password will remain unchanged.
                                            </p>
                                            <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;">
                                            <p style="margin: 0; font-size: 12px; line-height: 18px; color: #64748b; word-break: break-all;">
                                                If the button above doesn't work, copy and paste this link into your browser:<br>
                                                <a href="%s" style="color: #38bdf8; text-decoration: underline;">%s</a>
                                            </p>
                                        </td>
                                    </tr>
                                    <!-- Footer -->
                                    <tr>
                                        <td style="padding: 24px 40px; background-color: #0f172a; border-top: 1px solid #334155; text-align: center;">
                                            <p style="margin: 0; font-size: 12px; color: #64748b;">
                                                &copy; %d KemKendra Marketplace. All rights reserved.
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
