package com.synthora.admin.governance;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.account.dto.AppealResponseRequest;
import com.synthora.account.dto.SubmitAppealRequest;
import com.synthora.admin.audit.AuditAction;
import com.synthora.admin.audit.AuditLogRepository;
import com.synthora.admin.governance.dto.AdminAppealActionRequest;
import com.synthora.admin.governance.dto.AdminRequestInfoRequest;
import com.synthora.admin.governance.dto.ReinstateUserRequest;
import com.synthora.admin.governance.dto.SuspendUserRequest;
import com.synthora.identity.*;
import com.synthora.notification.NotificationRepository;
import com.synthora.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AccountGovernanceSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountSuspensionRepository suspensionRepository;

    @Autowired
    private AccountSuspensionAppealRepository appealRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User adminUser;
    private User regularBuyer;
    private User regularSupplier;
    private User secondBuyer;

    private String adminToken;
    private String buyerToken;
    private String supplierToken;
    private String secondBuyerToken;

    @BeforeEach
    public void setup() {
        for (String sql : List.of(
                "UPDATE rfqs SET accepted_quotation_id = NULL",
                "DELETE FROM buyer_shortlist_items",
                "DELETE FROM buyer_shortlists",
                "DELETE FROM governance_audit_logs",
                "DELETE FROM audit_logs",
                "DELETE FROM notifications",
                "DELETE FROM account_suspension_appeals",
                "DELETE FROM account_suspensions",
                "DELETE FROM supplier_offering_verification_evidences",
                "DELETE FROM supplier_offering_audits",
                "DELETE FROM supplier_verification_evidences",
                "DELETE FROM supplier_verification_audits",
                "DELETE FROM product_requests",
                "DELETE FROM sourcing_requests",
                "DELETE FROM documents",
                "DELETE FROM shipments",
                "DELETE FROM purchase_orders",
                "DELETE FROM quotations",
                "DELETE FROM rfqs",
                "DELETE FROM supplier_offerings",
                "DELETE FROM product_master_mappings",
                "DELETE FROM master_products",
                "DELETE FROM product_images",
                "DELETE FROM product_suppliers",
                "DELETE FROM products",
                "DELETE FROM seller_profiles",
                "DELETE FROM suppliers",
                "DELETE FROM email_verification_tokens",
                "DELETE FROM password_reset_tokens",
                "DELETE FROM users"
        )) {
            try {
                jdbcTemplate.execute(sql);
            } catch (Exception ignored) {}
        }

        // 1. Admin User
        adminUser = new User();
        adminUser.setName("Platform Admin");
        adminUser.setEmail("admin@synthora.com");
        adminUser.setPasswordHash(passwordEncoder.encode("AdminPass123!"));
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setStatus(UserStatus.ACTIVE);
        adminUser.setEmailVerifiedAt(Instant.now());
        adminUser = userRepository.save(adminUser);
        adminToken = jwtService.generateToken(adminUser);

        // 2. Buyer User
        regularBuyer = new User();
        regularBuyer.setName("Acme Buyer");
        regularBuyer.setEmail("buyer@acme.com");
        regularBuyer.setPasswordHash(passwordEncoder.encode("BuyerPass123!"));
        regularBuyer.setRole(UserRole.USER);
        regularBuyer.setStatus(UserStatus.ACTIVE);
        regularBuyer.setEmailVerifiedAt(Instant.now());
        regularBuyer = userRepository.save(regularBuyer);
        buyerToken = jwtService.generateToken(regularBuyer);

        // 3. Supplier User
        regularSupplier = new User();
        regularSupplier.setName("Global Chemicals Supplier");
        regularSupplier.setEmail("supplier@chem.com");
        regularSupplier.setPasswordHash(passwordEncoder.encode("SupplierPass123!"));
        regularSupplier.setRole(UserRole.SUPPLIER);
        regularSupplier.setStatus(UserStatus.ACTIVE);
        regularSupplier.setEmailVerifiedAt(Instant.now());
        regularSupplier = userRepository.save(regularSupplier);
        supplierToken = jwtService.generateToken(regularSupplier);

        // 4. Second Buyer User (for IDOR isolation testing)
        secondBuyer = new User();
        secondBuyer.setName("Beta Buyer");
        secondBuyer.setEmail("buyer2@beta.com");
        secondBuyer.setPasswordHash(passwordEncoder.encode("Buyer2Pass123!"));
        secondBuyer.setRole(UserRole.USER);
        secondBuyer.setStatus(UserStatus.ACTIVE);
        secondBuyer.setEmailVerifiedAt(Instant.now());
        secondBuyer = userRepository.save(secondBuyer);
        secondBuyerToken = jwtService.generateToken(secondBuyer);
    }

    // ==========================================
    // 1. ADMIN SUSPENSION TESTS
    // ==========================================

    @Test
    @DisplayName("1. Admin can successfully suspend a regular USER account with reason and internal notes")
    public void test01_adminCanSuspendUser() throws Exception {
        SuspendUserRequest request = new SuspendUserRequest(
                "Suspicious RFQ activity detected across multiple accounts",
                "Investigate company IP address and trading certificates"
        );

        mockMvc.perform(post("/api/v1/admin/account-governance/users/" + regularBuyer.getId() + "/suspend")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(regularBuyer.getId().toString()))
                .andExpect(jsonPath("$.reason").value("Suspicious RFQ activity detected across multiple accounts"))
                .andExpect(jsonPath("$.internalNotes").value("Investigate company IP address and trading certificates"))
                .andExpect(jsonPath("$.suspendedByAdminName").value("Platform Admin"))
                .andExpect(jsonPath("$.active").value(true));

        User updated = userRepository.findById(regularBuyer.getId()).orElseThrow();
        assertEquals(UserStatus.SUSPENDED, updated.getStatus());
        assertTrue(suspensionRepository.findActiveSuspensionByUserId(regularBuyer.getId()).isPresent());
    }

    @Test
    @DisplayName("2. Admin can successfully suspend a SUPPLIER account")
    public void test02_adminCanSuspendSupplier() throws Exception {
        SuspendUserRequest request = new SuspendUserRequest(
                "Failed quality audit and expired COA certificates",
                "Contact QA team before approving reinstatement"
        );

        mockMvc.perform(post("/api/v1/admin/account-governance/users/" + regularSupplier.getId() + "/suspend")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(regularSupplier.getId().toString()))
                .andExpect(jsonPath("$.userRole").value("SUPPLIER"))
                .andExpect(jsonPath("$.active").value(true));

        User updated = userRepository.findById(regularSupplier.getId()).orElseThrow();
        assertEquals(UserStatus.SUSPENDED, updated.getStatus());
    }

    @Test
    @DisplayName("3. Admin cannot suspend another administrator under current role model")
    public void test03_adminCannotSuspendAdmin() throws Exception {
        User anotherAdmin = new User();
        anotherAdmin.setName("Admin Two");
        anotherAdmin.setEmail("admin2@synthora.com");
        anotherAdmin.setPasswordHash("hash");
        anotherAdmin.setRole(UserRole.ADMIN);
        anotherAdmin.setStatus(UserStatus.ACTIVE);
        anotherAdmin = userRepository.save(anotherAdmin);

        SuspendUserRequest request = new SuspendUserRequest("Reason", "Notes");

        mockMvc.perform(post("/api/v1/admin/account-governance/users/" + anotherAdmin.getId() + "/suspend")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("4. Admin cannot suspend their own account")
    public void test04_adminCannotSuspendSelf() throws Exception {
        SuspendUserRequest request = new SuspendUserRequest("Self suspension", null);

        mockMvc.perform(post("/api/v1/admin/account-governance/users/" + adminUser.getId() + "/suspend")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("5. Regular USER receives HTTP 403 Forbidden when attempting to access admin governance endpoints")
    public void test05_userCannotAccessAdminGovernanceEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/admin/account-governance/suspensions")
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("6. SUPPLIER receives HTTP 403 Forbidden when attempting to access admin governance endpoints")
    public void test06_supplierCannotAccessAdminGovernanceEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/admin/account-governance/appeals")
                        .header("Authorization", "Bearer " + supplierToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("7. Unauthenticated request receives HTTP 401 Unauthorized")
    public void test07_unauthenticatedReceivesUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/admin/account-governance/suspensions"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("8. Suspension reason is mandatory and cannot be blank")
    public void test08_suspensionReasonIsMandatory() throws Exception {
        SuspendUserRequest request = new SuspendUserRequest("", "Notes without reason");

        mockMvc.perform(post("/api/v1/admin/account-governance/users/" + regularBuyer.getId() + "/suspend")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // ==========================================
    // 2. SUSPENDED USER ACCESS & JWT POLICY TESTS
    // ==========================================

    @Test
    @DisplayName("9. Existing JWT of suspended user cannot access commercial marketplace endpoints")
    public void test09_suspendedUserJwtCannotAccessCommercialEndpoints() throws Exception {
        // Suspend the buyer
        regularBuyer.setStatus(UserStatus.SUSPENDED);
        userRepository.save(regularBuyer);

        AccountSuspension suspension = new AccountSuspension(regularBuyer, adminUser, "Terms violation", "Internal notes");
        suspensionRepository.save(suspension);

        // Attempting to access protected RFQ endpoint must fail with 401 / 403
        mockMvc.perform(get("/api/v1/rfqs/my")
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("10. Suspended user JWT can access self-service suspension detail endpoint")
    public void test10_suspendedUserJwtCanAccessSuspensionEndpoint() throws Exception {
        regularBuyer.setStatus(UserStatus.SUSPENDED);
        userRepository.save(regularBuyer);

        AccountSuspension suspension = new AccountSuspension(regularBuyer, adminUser, "Compliance issue detected", "Private admin notes");
        suspensionRepository.save(suspension);

        mockMvc.perform(get("/api/v1/account/suspension")
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isSuspended").value(true))
                .andExpect(jsonPath("$.reason").value("Compliance issue detected"))
                .andExpect(jsonPath("$.internalNotes").doesNotExist());
    }

    @Test
    @DisplayName("11. Suspended user JWT can access self-service appeals list endpoint")
    public void test11_suspendedUserJwtCanAccessAppealsEndpoints() throws Exception {
        regularBuyer.setStatus(UserStatus.SUSPENDED);
        userRepository.save(regularBuyer);

        AccountSuspension suspension = new AccountSuspension(regularBuyer, adminUser, "Compliance issue", null);
        suspensionRepository.save(suspension);

        mockMvc.perform(get("/api/v1/account/appeals")
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", is(empty())));
    }

    // ==========================================
    // 3. REINSTATEMENT TESTS
    // ==========================================

    @Test
    @DisplayName("12. Admin can successfully reinstate a suspended user account")
    public void test12_adminCanReinstateUser() throws Exception {
        // Suspend first
        regularBuyer.setStatus(UserStatus.SUSPENDED);
        userRepository.save(regularBuyer);

        AccountSuspension suspension = new AccountSuspension(regularBuyer, adminUser, "Compliance audit", "Notes");
        suspensionRepository.save(suspension);

        ReinstateUserRequest request = new ReinstateUserRequest("Compliance documents verified and accepted");

        mockMvc.perform(post("/api/v1/admin/account-governance/users/" + regularBuyer.getId() + "/reinstate")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reinstatementNotes").value("Compliance documents verified and accepted"))
                .andExpect(jsonPath("$.reinstatedByAdminName").value("Platform Admin"))
                .andExpect(jsonPath("$.active").value(false));

        User updated = userRepository.findById(regularBuyer.getId()).orElseThrow();
        assertEquals(UserStatus.ACTIVE, updated.getStatus());
        assertFalse(suspensionRepository.findActiveSuspensionByUserId(regularBuyer.getId()).isPresent());
    }

    @Test
    @DisplayName("13. Reinstating an active account returns 400 Bad Request")
    public void test13_reinstatingActiveAccountFails() throws Exception {
        ReinstateUserRequest request = new ReinstateUserRequest("Already active");

        mockMvc.perform(post("/api/v1/admin/account-governance/users/" + regularBuyer.getId() + "/reinstate")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // ==========================================
    // 4. FORMAL APPEAL SUBMISSION & LIFECYCLE TESTS
    // ==========================================

    @Test
    @DisplayName("14. Suspended user can submit a formal appeal with reason")
    public void test14_suspendedUserCanSubmitAppeal() throws Exception {
        regularBuyer.setStatus(UserStatus.SUSPENDED);
        userRepository.save(regularBuyer);

        AccountSuspension suspension = new AccountSuspension(regularBuyer, adminUser, "Terms violation", "Notes");
        suspensionRepository.save(suspension);

        SubmitAppealRequest request = new SubmitAppealRequest("I have updated my institutional documentation and resolved the compliance issue.");

        mockMvc.perform(post("/api/v1/account/appeals")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.submittedReason").value("I have updated my institutional documentation and resolved the compliance issue."));

        List<AccountSuspensionAppeal> appeals = appealRepository.findByUserIdOrderByCreatedAtDesc(regularBuyer.getId());
        assertEquals(1, appeals.size());
        assertEquals(AppealStatus.SUBMITTED, appeals.get(0).getStatus());
    }

    @Test
    @DisplayName("15. Active user cannot submit an appeal")
    public void test15_activeUserCannotSubmitAppeal() throws Exception {
        SubmitAppealRequest request = new SubmitAppealRequest("I am already active but submitting an appeal.");

        mockMvc.perform(post("/api/v1/account/appeals")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("16. User cannot access another user's appeal (Strict IDOR protection)")
    public void test16_userCannotAccessAnotherUsersAppeal() throws Exception {
        regularBuyer.setStatus(UserStatus.SUSPENDED);
        userRepository.save(regularBuyer);
        AccountSuspension suspension = new AccountSuspension(regularBuyer, adminUser, "Terms violation", "Notes");
        suspensionRepository.save(suspension);
        AccountSuspensionAppeal appeal = new AccountSuspensionAppeal(suspension, regularBuyer, "Buyer 1 appeal reason");
        appeal = appealRepository.save(appeal);

        // Second buyer tries to inspect Buyer 1's appeal
        mockMvc.perform(get("/api/v1/account/appeals/" + appeal.getId())
                        .header("Authorization", "Bearer " + secondBuyerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("17. Submitting duplicate active appeal while another is in progress is rejected")
    public void test17_duplicateActiveAppealIsRejected() throws Exception {
        regularBuyer.setStatus(UserStatus.SUSPENDED);
        userRepository.save(regularBuyer);
        AccountSuspension suspension = new AccountSuspension(regularBuyer, adminUser, "Terms violation", "Notes");
        suspensionRepository.save(suspension);

        AccountSuspensionAppeal existingAppeal = new AccountSuspensionAppeal(suspension, regularBuyer, "First appeal");
        appealRepository.save(existingAppeal);

        SubmitAppealRequest request = new SubmitAppealRequest("Second appeal reason while first is pending");

        mockMvc.perform(post("/api/v1/account/appeals")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("18. Admin can start review on a submitted appeal (SUBMITTED -> UNDER_REVIEW)")
    public void test18_adminCanStartReview() throws Exception {
        regularBuyer.setStatus(UserStatus.SUSPENDED);
        userRepository.save(regularBuyer);
        AccountSuspension suspension = new AccountSuspension(regularBuyer, adminUser, "Terms violation", "Notes");
        suspensionRepository.save(suspension);
        AccountSuspensionAppeal appeal = new AccountSuspensionAppeal(suspension, regularBuyer, "Appeal reason");
        appeal = appealRepository.save(appeal);

        AdminAppealActionRequest request = new AdminAppealActionRequest(null, "Admin review notes");

        mockMvc.perform(post("/api/v1/admin/account-governance/appeals/" + appeal.getId() + "/review")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UNDER_REVIEW"))
                .andExpect(jsonPath("$.reviewedByAdminName").value("Platform Admin"));
    }

    @Test
    @DisplayName("19. Admin can request information from user (UNDER_REVIEW -> INFORMATION_REQUIRED)")
    public void test19_adminCanRequestInformation() throws Exception {
        regularBuyer.setStatus(UserStatus.SUSPENDED);
        userRepository.save(regularBuyer);
        AccountSuspension suspension = new AccountSuspension(regularBuyer, adminUser, "Terms violation", "Notes");
        suspensionRepository.save(suspension);
        AccountSuspensionAppeal appeal = new AccountSuspensionAppeal(suspension, regularBuyer, "Appeal reason");
        appeal.setStatus(AppealStatus.UNDER_REVIEW);
        appeal = appealRepository.save(appeal);

        AdminRequestInfoRequest request = new AdminRequestInfoRequest(
                "Please upload your updated GST registration certificate and trade license.",
                "Internal check notes"
        );

        mockMvc.perform(post("/api/v1/admin/account-governance/appeals/" + appeal.getId() + "/request-information")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INFORMATION_REQUIRED"))
                .andExpect(jsonPath("$.adminResponse").value("Please upload your updated GST registration certificate and trade license."));
    }

    @Test
    @DisplayName("20. User can submit response to information request (INFORMATION_REQUIRED -> UNDER_REVIEW)")
    public void test20_userCanRespondToInformationRequest() throws Exception {
        regularBuyer.setStatus(UserStatus.SUSPENDED);
        userRepository.save(regularBuyer);
        AccountSuspension suspension = new AccountSuspension(regularBuyer, adminUser, "Terms violation", "Notes");
        suspensionRepository.save(suspension);
        AccountSuspensionAppeal appeal = new AccountSuspensionAppeal(suspension, regularBuyer, "Appeal reason");
        appeal.setStatus(AppealStatus.INFORMATION_REQUIRED);
        appeal.setAdminResponse("Please upload trade license");
        appeal = appealRepository.save(appeal);

        AppealResponseRequest request = new AppealResponseRequest("I have emailed the trade license to compliance@synthora.com");

        mockMvc.perform(post("/api/v1/account/appeals/" + appeal.getId() + "/response")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UNDER_REVIEW"))
                .andExpect(jsonPath("$.userResponse").value("I have emailed the trade license to compliance@synthora.com"));
    }

    @Test
    @DisplayName("21. Admin can approve appeal, automatically reinstating the suspended user (UNDER_REVIEW -> APPROVED)")
    public void test21_adminCanApproveAppealAndReinstateUser() throws Exception {
        regularBuyer.setStatus(UserStatus.SUSPENDED);
        userRepository.save(regularBuyer);
        AccountSuspension suspension = new AccountSuspension(regularBuyer, adminUser, "Terms violation", "Notes");
        suspensionRepository.save(suspension);
        AccountSuspensionAppeal appeal = new AccountSuspensionAppeal(suspension, regularBuyer, "Appeal reason");
        appeal.setStatus(AppealStatus.UNDER_REVIEW);
        appeal = appealRepository.save(appeal);

        AdminAppealActionRequest request = new AdminAppealActionRequest("Documents validated, reinstated", "Internal approval notes");

        mockMvc.perform(post("/api/v1/admin/account-governance/appeals/" + appeal.getId() + "/approve")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        // Verify account is now ACTIVE
        User updated = userRepository.findById(regularBuyer.getId()).orElseThrow();
        assertEquals(UserStatus.ACTIVE, updated.getStatus());

        // Verify suspension is closed
        AccountSuspension updatedSuspension = suspensionRepository.findById(suspension.getId()).orElseThrow();
        assertNotNull(updatedSuspension.getReinstatedAt());
    }

    @Test
    @DisplayName("22. Admin can reject appeal with reason, leaving user SUSPENDED (UNDER_REVIEW -> REJECTED)")
    public void test22_adminCanRejectAppeal() throws Exception {
        regularBuyer.setStatus(UserStatus.SUSPENDED);
        userRepository.save(regularBuyer);
        AccountSuspension suspension = new AccountSuspension(regularBuyer, adminUser, "Terms violation", "Notes");
        suspensionRepository.save(suspension);
        AccountSuspensionAppeal appeal = new AccountSuspensionAppeal(suspension, regularBuyer, "Appeal reason");
        appeal.setStatus(AppealStatus.UNDER_REVIEW);
        appeal = appealRepository.save(appeal);

        AdminAppealActionRequest request = new AdminAppealActionRequest("Provided documents are invalid or forged", "Internal fraud notes");

        mockMvc.perform(post("/api/v1/admin/account-governance/appeals/" + appeal.getId() + "/reject")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.adminResponse").value("Provided documents are invalid or forged"));

        // User remains SUSPENDED
        User updated = userRepository.findById(regularBuyer.getId()).orElseThrow();
        assertEquals(UserStatus.SUSPENDED, updated.getStatus());
    }

    @Test
    @DisplayName("23. Internal admin notes are never returned in self-service user appeal API")
    public void test23_internalNotesNeverExposedToUser() throws Exception {
        regularBuyer.setStatus(UserStatus.SUSPENDED);
        userRepository.save(regularBuyer);
        AccountSuspension suspension = new AccountSuspension(regularBuyer, adminUser, "General reason", "CRITICAL_PRIVATE_ADMIN_NOTES");
        suspensionRepository.save(suspension);
        AccountSuspensionAppeal appeal = new AccountSuspensionAppeal(suspension, regularBuyer, "Appeal reason");
        appeal.setAdminInternalNotes("SUPER_SECRET_INTERNAL_GOVERNANCE_NOTES");
        appeal = appealRepository.save(appeal);

        mockMvc.perform(get("/api/v1/account/appeals/" + appeal.getId())
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.adminInternalNotes").doesNotExist())
                .andExpect(jsonPath("$.internalNotes").doesNotExist())
                .andExpect(content().string(not(containsString("SUPER_SECRET_INTERNAL_GOVERNANCE_NOTES"))));
    }

    @Test
    @DisplayName("24. Invalidate password reset tokens upon suspension")
    public void test24_passwordResetTokensInvalidatedOnSuspension() throws Exception {
        // Create an active password reset token for regular buyer
        PasswordResetToken token = new PasswordResetToken(
                UUID.randomUUID(),
                regularBuyer,
                "token_hash_12345",
                Instant.now().plusSeconds(3600)
        );
        passwordResetTokenRepository.save(token);

        SuspendUserRequest request = new SuspendUserRequest("Suspension reason", "Notes");

        mockMvc.perform(post("/api/v1/admin/account-governance/users/" + regularBuyer.getId() + "/suspend")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        List<PasswordResetToken> activeTokens = passwordResetTokenRepository.findByUserAndUsedAtIsNull(regularBuyer);
        assertTrue(activeTokens.isEmpty(), "Expected all active password reset tokens to be invalidated upon suspension");
    }

    @Test
    @DisplayName("25. Multiple suspension and reinstatement cycles are correctly tracked in history")
    public void test25_multipleSuspensionReinstatementCyclesWorkCorrectly() throws Exception {
        // Cycle 1: Suspend
        mockMvc.perform(post("/api/v1/admin/account-governance/users/" + regularBuyer.getId() + "/suspend")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SuspendUserRequest("Cycle 1 reason", null))))
                .andExpect(status().isOk());

        // Cycle 1: Reinstate
        mockMvc.perform(post("/api/v1/admin/account-governance/users/" + regularBuyer.getId() + "/reinstate")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ReinstateUserRequest("Cycle 1 resolved"))))
                .andExpect(status().isOk());

        // Cycle 2: Suspend
        mockMvc.perform(post("/api/v1/admin/account-governance/users/" + regularBuyer.getId() + "/suspend")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SuspendUserRequest("Cycle 2 reason", null))))
                .andExpect(status().isOk());

        List<AccountSuspension> history = suspensionRepository.findHistoryByUserId(regularBuyer.getId());
        assertEquals(2, history.size());
        assertEquals(1, history.stream().filter(AccountSuspension::isActive).count());
    }

    @Test
    @DisplayName("26. Audit events are recorded for suspension, reinstatement, and appeal transitions")
    public void test26_auditEventsRecorded() throws Exception {
        // Suspend
        mockMvc.perform(post("/api/v1/admin/account-governance/users/" + regularBuyer.getId() + "/suspend")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SuspendUserRequest("Audit check suspension", null))))
                .andExpect(status().isOk());

        assertTrue(auditLogRepository.findAll().stream()
                .anyMatch(a -> a.getAction() == AuditAction.USER_SUSPENDED));

        // Reinstate
        mockMvc.perform(post("/api/v1/admin/account-governance/users/" + regularBuyer.getId() + "/reinstate")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ReinstateUserRequest("Audit check reinstatement"))))
                .andExpect(status().isOk());

        assertTrue(auditLogRepository.findAll().stream()
                .anyMatch(a -> a.getAction() == AuditAction.USER_REINSTATED));
    }

    @Test
    @DisplayName("27. Admin can query suspensions with text filter, role filter, and active flag")
    public void test27_adminCanFilterSuspensions() throws Exception {
        // Suspend buyer
        mockMvc.perform(post("/api/v1/admin/account-governance/users/" + regularBuyer.getId() + "/suspend")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SuspendUserRequest("Buyer violation reason", "Admin notes"))))
                .andExpect(status().isOk());

        // Suspend supplier
        mockMvc.perform(post("/api/v1/admin/account-governance/users/" + regularSupplier.getId() + "/suspend")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SuspendUserRequest("Supplier violation reason", "Supplier notes"))))
                .andExpect(status().isOk());

        // Search by query "Buyer"
        mockMvc.perform(get("/api/v1/admin/account-governance/suspensions?query=Acme")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].userName").value("Acme Buyer"));

        // Filter by role SUPPLIER
        mockMvc.perform(get("/api/v1/admin/account-governance/suspensions?role=SUPPLIER")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].userRole").value("SUPPLIER"));

        // Filter by activeOnly=true
        mockMvc.perform(get("/api/v1/admin/account-governance/suspensions?activeOnly=true")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)));
    }

    @Test
    @DisplayName("28. Admin can query appeals with status and query filter")
    public void test28_adminCanFilterAppeals() throws Exception {
        regularBuyer.setStatus(UserStatus.SUSPENDED);
        userRepository.save(regularBuyer);
        AccountSuspension suspension = new AccountSuspension(regularBuyer, adminUser, "Terms violation", "Notes");
        suspensionRepository.save(suspension);
        AccountSuspensionAppeal appeal = new AccountSuspensionAppeal(suspension, regularBuyer, "Special institutional justification");
        appealRepository.save(appeal);

        // Filter by status SUBMITTED
        mockMvc.perform(get("/api/v1/admin/account-governance/appeals?status=SUBMITTED")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].status").value("SUBMITTED"));

        // Filter by query "institutional"
        mockMvc.perform(get("/api/v1/admin/account-governance/appeals?query=institutional")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)));

        // Filter by non-matching query
        mockMvc.perform(get("/api/v1/admin/account-governance/appeals?query=nonexistentstring")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));
    }

    @Test
    @DisplayName("29. Admin can fetch full governance detail for a specific user")
    public void test29_adminCanFetchUserGovernanceDetail() throws Exception {
        regularBuyer.setStatus(UserStatus.SUSPENDED);
        userRepository.save(regularBuyer);
        AccountSuspension suspension = new AccountSuspension(regularBuyer, adminUser, "Terms violation", "Private investigation log");
        suspensionRepository.save(suspension);
        AccountSuspensionAppeal appeal = new AccountSuspensionAppeal(suspension, regularBuyer, "My formal appeal");
        appealRepository.save(appeal);

        mockMvc.perform(get("/api/v1/admin/account-governance/users/" + regularBuyer.getId() + "/detail")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.id").value(regularBuyer.getId().toString()))
                .andExpect(jsonPath("$.user.name").value("Acme Buyer"))
                .andExpect(jsonPath("$.user.status").value("SUSPENDED"))
                .andExpect(jsonPath("$.currentSuspension").exists())
                .andExpect(jsonPath("$.currentSuspension.internalNotes").value("Private investigation log"))
                .andExpect(jsonPath("$.suspensionHistory", hasSize(1)))
                .andExpect(jsonPath("$.appealsHistory", hasSize(1)));
    }

    @Test
    @DisplayName("30. Cannot approve an already approved appeal")
    public void test30_cannotApproveAlreadyApprovedAppeal() throws Exception {
        regularBuyer.setStatus(UserStatus.SUSPENDED);
        userRepository.save(regularBuyer);
        AccountSuspension suspension = new AccountSuspension(regularBuyer, adminUser, "Terms violation", "Notes");
        suspensionRepository.save(suspension);
        AccountSuspensionAppeal appeal = new AccountSuspensionAppeal(suspension, regularBuyer, "Appeal");
        appeal.setStatus(AppealStatus.APPROVED);
        appeal = appealRepository.save(appeal);

        mockMvc.perform(post("/api/v1/admin/account-governance/appeals/" + appeal.getId() + "/approve")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AdminAppealActionRequest("Approve again", null))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("31. Cannot reject an already approved appeal")
    public void test31_cannotRejectAlreadyApprovedAppeal() throws Exception {
        regularBuyer.setStatus(UserStatus.SUSPENDED);
        userRepository.save(regularBuyer);
        AccountSuspension suspension = new AccountSuspension(regularBuyer, adminUser, "Terms violation", "Notes");
        suspensionRepository.save(suspension);
        AccountSuspensionAppeal appeal = new AccountSuspensionAppeal(suspension, regularBuyer, "Appeal");
        appeal.setStatus(AppealStatus.APPROVED);
        appeal = appealRepository.save(appeal);

        mockMvc.perform(post("/api/v1/admin/account-governance/appeals/" + appeal.getId() + "/reject")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AdminAppealActionRequest("Reject now", null))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("32. Cannot approve an already rejected appeal directly")
    public void test32_cannotApproveAlreadyRejectedAppeal() throws Exception {
        regularBuyer.setStatus(UserStatus.SUSPENDED);
        userRepository.save(regularBuyer);
        AccountSuspension suspension = new AccountSuspension(regularBuyer, adminUser, "Terms violation", "Notes");
        suspensionRepository.save(suspension);
        AccountSuspensionAppeal appeal = new AccountSuspensionAppeal(suspension, regularBuyer, "Appeal");
        appeal.setStatus(AppealStatus.REJECTED);
        appeal = appealRepository.save(appeal);

        mockMvc.perform(post("/api/v1/admin/account-governance/appeals/" + appeal.getId() + "/approve")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AdminAppealActionRequest("Approve rejected", null))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("33. Admin can view specific suspension by ID")
    public void test33_adminCanViewSpecificSuspension() throws Exception {
        AccountSuspension suspension = new AccountSuspension(regularBuyer, adminUser, "Specific suspension test", "Notes");
        suspension = suspensionRepository.save(suspension);

        mockMvc.perform(get("/api/v1/admin/account-governance/suspensions/" + suspension.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(suspension.getId().toString()))
                .andExpect(jsonPath("$.reason").value("Specific suspension test"));
    }

    @Test
    @DisplayName("34. Non-existent suspension returns HTTP 404")
    public void test34_nonExistentSuspensionReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/admin/account-governance/suspensions/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("35. Non-existent appeal returns HTTP 404")
    public void test35_nonExistentAppealReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/admin/account-governance/appeals/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @org.junit.jupiter.api.AfterEach
    public void tearDown() {
        for (String sql : List.of(
                "UPDATE rfqs SET accepted_quotation_id = NULL",
                "DELETE FROM buyer_shortlist_items",
                "DELETE FROM buyer_shortlists",
                "DELETE FROM governance_audit_logs",
                "DELETE FROM audit_logs",
                "DELETE FROM notifications",
                "DELETE FROM account_suspension_appeals",
                "DELETE FROM account_suspensions",
                "DELETE FROM email_verification_tokens",
                "DELETE FROM password_reset_tokens",
                "DELETE FROM users"
        )) {
            try {
                jdbcTemplate.execute(sql);
            } catch (Exception ignored) {}
        }
    }
}
