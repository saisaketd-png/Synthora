package com.kemkendra.identity.service;

import com.kemkendra.identity.EmailVerificationToken;
import com.kemkendra.identity.EmailVerificationTokenRepository;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.dto.ResendVerificationRequest;
import com.kemkendra.identity.dto.ResendVerificationResponse;
import com.kemkendra.identity.dto.VerifyEmailRequest;
import com.kemkendra.identity.dto.VerifyEmailResponse;
import com.kemkendra.security.JwtService;
import com.kemkendra.identity.UserRole;
import com.kemkendra.notification.email.EmailService;
import com.kemkendra.product.Supplier;
import com.kemkendra.product.SupplierRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
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
    private final JwtService jwtService;
    private final SupplierRepository supplierRepository;
    private final String appBaseUrl;

    public EmailVerificationService(
            UserRepository userRepository,
            EmailVerificationTokenRepository tokenRepository,
            EmailService emailService,
            JwtService jwtService,
            SupplierRepository supplierRepository,
            @Value("${kemkendra.app.base-url:http://localhost:3000}") String appBaseUrl) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
        this.jwtService = jwtService;
        this.supplierRepository = supplierRepository;
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

        // Construct verification URL and dispatch email after transaction successfully commits
        String verifyUrl = appBaseUrl + "/verify-email?token=" + rawToken;
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    sendVerificationEmail(user, verifyUrl);
                    log.info("Dispatched email verification for user ID: {}, recipient: {}", user.getId(), user.getEmail());
                }
            });
        } else {
            sendVerificationEmail(user, verifyUrl);
            log.info("Dispatched email verification for user ID: {}, recipient: {}", user.getId(), user.getEmail());
        }
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

        // If supplier, update supplier emailVerified flag and determine verificationStatus
        String verificationStatus = null;
        if (user.getRole() == UserRole.SUPPLIER) {
            Optional<Supplier> supplierOpt = supplierRepository.findByUser(user);
            if (supplierOpt.isPresent()) {
                Supplier supplier = supplierOpt.get();
                supplier.setBusinessEmail(user.getEmail());
                supplier.setEmailVerified(true);
                supplierRepository.save(supplier);
                verificationStatus = supplier.getVerificationStatus() != null
                        ? supplier.getVerificationStatus().name()
                        : "DRAFT";
            } else {
                verificationStatus = "DRAFT";
            }
        }

        // Generate JWT token so client is automatically authenticated
        String token = jwtService.generateToken(user);
        String role = user.getRole() != null ? user.getRole().name() : "USER";

        log.info("Email successfully verified for user ID: {}, role: {}, supplierStatus: {}", user.getId(), role, verificationStatus);
        return new VerifyEmailResponse("Email verified successfully.", token, role, verificationStatus);
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

        String subject = "[KemKendra] Verify Your Email Address";
        String htmlBody = """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <title>Activate your KemKendra account</title>
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
                                                Verify your email address
                                            </h1>
                                            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #334155;">
                                                Hello %s,
                                            </p>
                                            <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #334155;">
                                                Please confirm that you created a KemKendra account by clicking the button below. Once confirmed, you will be directed straight to your commercial workspace.
                                            </p>
                                            <!-- Solid Primary Action -->
                                            <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 28px 0;">
                                                <tr>
                                                    <td align="center" style="border-radius: 6px; background-color: #0f172a;">
                                                        <a href="%s" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px; background-color: #0f172a;">
                                                            Verify Email Address
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                            <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 20px; color: #64748b;">
                                                This link will expire in 24 hours. If you did not make this request, you can safely ignore this email.
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
                                                KemKendra Inc. &bull; Enterprise Chemical Sourcing & Compliance
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
