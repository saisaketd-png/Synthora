package com.synthora.identity.service;

import com.synthora.identity.EmailVerificationToken;
import com.synthora.identity.EmailVerificationTokenRepository;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.dto.ResendVerificationRequest;
import com.synthora.identity.dto.ResendVerificationResponse;
import com.synthora.identity.dto.VerifyEmailRequest;
import com.synthora.identity.dto.VerifyEmailResponse;
import com.synthora.notification.email.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int TOKEN_BYTE_LENGTH = 32;
    private static final long EXPIRATION_HOURS = 24;
    private static final long RESEND_COOLDOWN_SECONDS = 60;

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final EmailService emailService;
    private final String appBaseUrl;

    public EmailVerificationService(
            UserRepository userRepository,
            EmailVerificationTokenRepository tokenRepository,
            EmailService emailService,
            @Value("${synthora.app.base-url:http://localhost:3000}") String appBaseUrl) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
        this.appBaseUrl = appBaseUrl != null && appBaseUrl.endsWith("/")
                ? appBaseUrl.substring(0, appBaseUrl.length() - 1)
                : (appBaseUrl != null ? appBaseUrl : "http://localhost:3000");
    }

    /**
     * Creates and dispatches an email verification token for a newly registered user.
     */
    @Transactional
    public void createAndSendVerificationToken(User user) {
        if (user == null || user.getDeletedAt() != null) {
            return;
        }

        // Invalidate any previously generated active tokens for this user
        tokenRepository.invalidateActiveTokensForUser(user, Instant.now());

        // Generate 256-bit secure random token
        byte[] randomBytes = new byte[TOKEN_BYTE_LENGTH];
        SECURE_RANDOM.nextBytes(randomBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        // Store SHA-256 hash
        String tokenHash = hashToken(rawToken);
        Instant expiresAt = Instant.now().plus(EXPIRATION_HOURS, ChronoUnit.HOURS);

        EmailVerificationToken verificationToken = new EmailVerificationToken(null, user, tokenHash, expiresAt);
        tokenRepository.save(verificationToken);

        // Construct verification URL and dispatch email
        String verifyUrl = appBaseUrl + "/verify-email?token=" + rawToken;
        sendVerificationEmail(user, verifyUrl);

        log.info("Email verification token generated and email dispatched for user ID: {}", user.getId());
    }

    /**
     * Verifies the email using a raw verification token from the link.
     */
    @Transactional
    public VerifyEmailResponse verifyEmail(VerifyEmailRequest request) {
        String rawToken = request.token() != null ? request.token().trim() : "";
        if (rawToken.isBlank()) {
            throw new IllegalArgumentException("Invalid or expired verification token.");
        }

        String tokenHash = hashToken(rawToken);
        EmailVerificationToken verificationToken = tokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification token."));

        if (verificationToken.isUsed()) {
            throw new IllegalArgumentException("This verification link has already been used. Please sign in or request a new one.");
        }

        if (verificationToken.isExpired()) {
            throw new IllegalArgumentException("This verification link has expired. Please request a new verification email.");
        }

        User user = verificationToken.getUser();
        if (user == null || user.getDeletedAt() != null) {
            throw new IllegalArgumentException("User account is inactive or not found.");
        }

        // Mark user email as verified
        Instant now = Instant.now();
        user.setEmailVerifiedAt(now);
        userRepository.save(user);

        // Mark token as used
        verificationToken.setUsedAt(now);
        tokenRepository.save(verificationToken);

        // Invalidate other pending tokens
        tokenRepository.invalidateActiveTokensForUser(user, now);

        log.info("Email successfully verified for user ID: {}", user.getId());
        return new VerifyEmailResponse("Email verified successfully. You can now log in.");
    }

    /**
     * Resends email verification with a 60-second cooldown per account to prevent email abuse.
     */
    @Transactional
    public ResendVerificationResponse resendVerification(ResendVerificationRequest request) {
        String email = request.email() != null ? request.email().trim().toLowerCase() : "";
        if (email.isBlank()) {
            return new ResendVerificationResponse("If an unverified account exists for this email, a verification link has been sent.");
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            log.info("Resend verification requested for non-existent email (anti-enumeration response returned)");
            return new ResendVerificationResponse("If an unverified account exists for this email, a verification link has been sent.");
        }

        User user = userOpt.get();
        if (user.getDeletedAt() != null || user.getEmailVerifiedAt() != null) {
            log.info("Resend verification requested for already verified or deleted account ID: {}", user.getId());
            return new ResendVerificationResponse("If an unverified account exists for this email, a verification link has been sent.");
        }

        // Check 60-second cooldown on latest token
        Optional<EmailVerificationToken> latestTokenOpt = tokenRepository.findFirstByUserOrderByCreatedAtDesc(user);
        if (latestTokenOpt.isPresent()) {
            EmailVerificationToken latestToken = latestTokenOpt.get();
            if (latestToken.getCreatedAt() != null &&
                    latestToken.getCreatedAt().isAfter(Instant.now().minus(RESEND_COOLDOWN_SECONDS, ChronoUnit.SECONDS))) {
                log.warn("Resend verification throttled (cooldown active) for user ID: {}", user.getId());
                // Still return generic success response for anti-enumeration and seamless UX
                return new ResendVerificationResponse("If an unverified account exists for this email, a verification link has been sent.");
            }
        }

        createAndSendVerificationToken(user);
        return new ResendVerificationResponse("If an unverified account exists for this email, a verification link has been sent.");
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

    private void sendVerificationEmail(User user, String verifyUrl) {
        String recipientName = user.getName() != null && !user.getName().isBlank()
                ? HtmlUtils.htmlEscape(user.getName())
                : "Valued Partner";
        String escapedUrl = HtmlUtils.htmlEscape(verifyUrl);

        String subject = "[Synthora] Verify Your Email Address";
        String htmlBody = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Verify Your Email Address</title>
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
                                                        <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #38bdf8; letter-spacing: -0.5px;">SYNTHORA</h1>
                                                        <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">B2B Chemical & Raw Materials Marketplace</p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <!-- Body -->
                                    <tr>
                                        <td style="padding: 40px;">
                                            <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #f8fafc;">Verify Your Email Address</h2>
                                            <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 24px; color: #cbd5e1;">
                                                Hello %s,
                                            </p>
                                            <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #cbd5e1;">
                                                Welcome to Synthora. To activate your account and access the B2B chemical marketplace, please verify your email address by clicking the button below:
                                            </p>
                                            <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                                                <tr>
                                                    <td align="center">
                                                        <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%%, #0369a1 100%%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);">
                                                            Verify Email Address
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                            <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 20px; color: #94a3b8;">
                                                <strong>Note:</strong> This verification link will expire in <strong>24 hours</strong> and can only be used once.
                                            </p>
                                            <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 20px; color: #94a3b8;">
                                                If you did not register for an account on Synthora, you can safely ignore this email.
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
                                                &copy; %d Synthora Marketplace. All rights reserved.
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
