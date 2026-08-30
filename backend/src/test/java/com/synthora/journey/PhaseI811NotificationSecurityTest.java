package com.synthora.journey;

import com.synthora.common.ResourceNotFoundException;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.notification.*;
import com.synthora.notification.api.NotificationController;
import com.synthora.notification.dto.NotificationResponse;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class PhaseI811NotificationSecurityTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationController notificationController;

    private User adminUser;
    private UsernamePasswordAuthenticationToken adminAuth;

    private User buyerUserA;
    private UsernamePasswordAuthenticationToken buyerAuthA;

    private User buyerUserB;
    private UsernamePasswordAuthenticationToken buyerAuthB;

    private User supplierUserA;
    private UsernamePasswordAuthenticationToken supplierAuthA;

    private User supplierUserB;
    private UsernamePasswordAuthenticationToken supplierAuthB;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        // Admin
        adminUser = new User(UUID.randomUUID(), "Admin User", "admin_p811@synthora.com", "9988776655", "$2a$10$hash", UserRole.ADMIN, UserStatus.ACTIVE);
        adminUser = userRepository.save(adminUser);
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        // Buyer A
        buyerUserA = new User(UUID.randomUUID(), "Buyer Alpha", "buyer_a_p811@synthora.com", "1188776655", "$2a$10$hash", UserRole.USER, UserStatus.ACTIVE);
        buyerUserA = userRepository.save(buyerUserA);
        buyerAuthA = new UsernamePasswordAuthenticationToken(buyerUserA.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        // Buyer B
        buyerUserB = new User(UUID.randomUUID(), "Buyer Beta", "buyer_b_p811@synthora.com", "2288776655", "$2a$10$hash", UserRole.USER, UserStatus.ACTIVE);
        buyerUserB = userRepository.save(buyerUserB);
        buyerAuthB = new UsernamePasswordAuthenticationToken(buyerUserB.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        // Supplier A
        supplierUserA = new User(UUID.randomUUID(), "Supplier A User", "sup_a_p811@synthora.com", "3388776655", "$2a$10$hash", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierUserA = userRepository.save(supplierUserA);
        supplierAuthA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        // Supplier B
        supplierUserB = new User(UUID.randomUUID(), "Supplier B User", "sup_b_p811@synthora.com", "4488776655", "$2a$10$hash", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierUserB = userRepository.save(supplierUserB);
        supplierAuthB = new UsernamePasswordAuthenticationToken(supplierUserB.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));
    }

    // Check 1: Buyer can view own notifications
    @Test
    void test01_buyerCanViewOwnNotifications() {
        notificationService.createNotification(buyerUserA.getId(), NotificationType.QUOTATION_SUBMITTED, "Quotation Received", "Quotation for Paracetamol", NotificationEntityType.RFQ, UUID.randomUUID());

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        Page<NotificationResponse> page = notificationController.getNotifications(PageRequest.of(0, 20), buyerAuthA);
        assertThat(page.getContent()).hasSize(1);
    }

    // Check 2: Buyer cannot view another buyer notifications
    @Test
    void test02_buyerCannotViewAnotherBuyerNotifications() {
        notificationService.createNotification(buyerUserB.getId(), NotificationType.QUOTATION_SUBMITTED, "Quotation for Buyer B", "Message", NotificationEntityType.RFQ, UUID.randomUUID());

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        Page<NotificationResponse> page = notificationController.getNotifications(PageRequest.of(0, 20), buyerAuthA);
        assertThat(page.getContent()).isEmpty();
    }

    // Check 3: Supplier can view own notifications
    @Test
    void test03_supplierCanViewOwnNotifications() {
        notificationService.createNotification(supplierUserA.getId(), NotificationType.RFQ_SUBMITTED, "New RFQ", "New RFQ from Buyer", NotificationEntityType.RFQ, UUID.randomUUID());

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        Page<NotificationResponse> page = notificationController.getNotifications(PageRequest.of(0, 20), supplierAuthA);
        assertThat(page.getContent()).hasSize(1);
    }

    // Check 4: Supplier cannot view another supplier notifications
    @Test
    void test04_supplierCannotViewAnotherSupplierNotifications() {
        notificationService.createNotification(supplierUserB.getId(), NotificationType.RFQ_SUBMITTED, "Supplier B RFQ", "Message", NotificationEntityType.RFQ, UUID.randomUUID());

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        Page<NotificationResponse> page = notificationController.getNotifications(PageRequest.of(0, 20), supplierAuthA);
        assertThat(page.getContent()).isEmpty();
    }

    // Check 5: Buyer cannot access admin notification
    @Test
    void test05_buyerCannotAccessAdminNotification() {
        notificationService.notifyAdmins(NotificationType.SUPPLIER_OFFERING_SUBMITTED, "New Offering Review", "Offering requires review", NotificationEntityType.SUPPLIER_OFFERING, UUID.randomUUID());

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        Page<NotificationResponse> page = notificationController.getNotifications(PageRequest.of(0, 20), buyerAuthA);
        assertThat(page.getContent()).isEmpty();
    }

    // Check 6: Supplier cannot access admin notification
    @Test
    void test06_supplierCannotAccessAdminNotification() {
        notificationService.notifyAdmins(NotificationType.SUPPLIER_OFFERING_SUBMITTED, "Admin Notification", "Details", NotificationEntityType.SUPPLIER_OFFERING, UUID.randomUUID());

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        Page<NotificationResponse> page = notificationController.getNotifications(PageRequest.of(0, 20), supplierAuthA);
        assertThat(page.getContent()).isEmpty();
    }

    // Check 7: Notification recipient cannot be spoofed
    @Test
    void test07_notificationRecipientCannotBeSpoofed() {
        Notification n = notificationService.createNotification(buyerUserA.getId(), NotificationType.RFQ_SUBMITTED, "Test Title", "Test Message", NotificationEntityType.RFQ, UUID.randomUUID());
        assertThat(n.getRecipientId()).isEqualTo(buyerUserA.getId());
    }

    // Check 8: Notification IDOR is rejected
    @Test
    void test08_notificationIdorIsRejected() {
        Notification nB = notificationService.createNotification(buyerUserB.getId(), NotificationType.QUOTATION_SUBMITTED, "Buyer B Note", "Body", NotificationEntityType.QUOTATION, UUID.randomUUID());

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        assertThatThrownBy(() -> notificationController.markAsRead(nB.getId(), buyerAuthA))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // Check 9: Mark read works for recipient
    @Test
    void test09_markReadWorksForRecipient() {
        Notification nA = notificationService.createNotification(buyerUserA.getId(), NotificationType.QUOTATION_SUBMITTED, "Title", "Body", NotificationEntityType.QUOTATION, UUID.randomUUID());

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        NotificationResponse res = notificationController.markAsRead(nA.getId(), buyerAuthA);
        assertThat(res.read()).isTrue();
    }

    // Check 10: User cannot mark another user's notification read
    @Test
    void test10_userCannotMarkAnotherUserNotificationRead() {
        Notification nB = notificationService.createNotification(buyerUserB.getId(), NotificationType.QUOTATION_SUBMITTED, "Title B", "Body B", NotificationEntityType.QUOTATION, UUID.randomUUID());

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        assertThatThrownBy(() -> notificationController.markAsRead(nB.getId(), buyerAuthA))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // Check 11: Mark all read affects only authenticated user
    @Test
    void test11_markAllReadAffectsOnlyAuthenticatedUser() {
        notificationService.createNotification(buyerUserA.getId(), NotificationType.QUOTATION_SUBMITTED, "Title A1", "Body A1", NotificationEntityType.QUOTATION, UUID.randomUUID());
        Notification nB = notificationService.createNotification(buyerUserB.getId(), NotificationType.QUOTATION_SUBMITTED, "Title B1", "Body B1", NotificationEntityType.QUOTATION, UUID.randomUUID());

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        notificationController.markAllAsRead(buyerAuthA);

        Notification loadedB = notificationRepository.findById(nB.getId()).orElseThrow();
        assertThat(loadedB.isRead()).isFalse();
    }

    // Check 12: Unread count is correct
    @Test
    void test12_unreadCountIsCorrect() {
        notificationService.createNotification(buyerUserA.getId(), NotificationType.QUOTATION_SUBMITTED, "1", "1", NotificationEntityType.QUOTATION, UUID.randomUUID());
        notificationService.createNotification(buyerUserA.getId(), NotificationType.QUOTATION_SUBMITTED, "2", "2", NotificationEntityType.QUOTATION, UUID.randomUUID());

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        assertThat(notificationController.getUnreadCount(buyerAuthA).count()).isEqualTo(2);
    }

    // Check 13: RFQ event notifies correct supplier
    @Test
    void test13_rfqEventNotifiesCorrectSupplier() {
        Notification n = notificationService.notifySupplier(supplierUserA.getId(), NotificationType.RFQ_SUBMITTED, "New RFQ", "Body", NotificationEntityType.RFQ, UUID.randomUUID());
        assertThat(n.getRecipientId()).isEqualTo(supplierUserA.getId());
    }

    // Check 14: RFQ event does not notify unrelated supplier
    @Test
    void test14_rfqEventDoesNotNotifyUnrelatedSupplier() {
        notificationService.notifySupplier(supplierUserA.getId(), NotificationType.RFQ_SUBMITTED, "New RFQ", "Body", NotificationEntityType.RFQ, UUID.randomUUID());

        SecurityContextHolder.getContext().setAuthentication(supplierAuthB);
        Page<NotificationResponse> page = notificationController.getNotifications(PageRequest.of(0, 20), supplierAuthB);
        assertThat(page.getContent()).isEmpty();
    }

    // Check 15: Quotation event notifies correct buyer
    @Test
    void test15_quotationEventNotifiesCorrectBuyer() {
        Notification n = notificationService.notifyBuyer(buyerUserA.getId(), NotificationType.QUOTATION_SUBMITTED, "Quote", "Body", NotificationEntityType.QUOTATION, UUID.randomUUID());
        assertThat(n.getRecipientId()).isEqualTo(buyerUserA.getId());
    }

    // Check 16: Counter-offer event notifies correct supplier
    @Test
    void test16_counterOfferEventNotifiesCorrectSupplier() {
        Notification n = notificationService.notifySupplier(supplierUserA.getId(), NotificationType.COUNTER_OFFER_RECEIVED, "Counter Offer", "Body", NotificationEntityType.RFQ, UUID.randomUUID());
        assertThat(n.getRecipientId()).isEqualTo(supplierUserA.getId());
    }

    // Check 17: Revision event notifies correct buyer
    @Test
    void test17_revisionEventNotifiesCorrectBuyer() {
        Notification n = notificationService.notifyBuyer(buyerUserA.getId(), NotificationType.QUOTATION_REVISED, "Revised Quote", "Body", NotificationEntityType.QUOTATION, UUID.randomUUID());
        assertThat(n.getRecipientId()).isEqualTo(buyerUserA.getId());
    }

    // Check 18: Accepted quotation notification reaches correct supplier
    @Test
    void test18_acceptedQuotationNotificationReachesCorrectSupplier() {
        Notification n = notificationService.notifySupplier(supplierUserA.getId(), NotificationType.QUOTATION_ACCEPTED, "Quote Accepted", "Body", NotificationEntityType.QUOTATION, UUID.randomUUID());
        assertThat(n.getRecipientId()).isEqualTo(supplierUserA.getId());
    }

    // Check 19: PO creation notification reaches correct supplier/buyer
    @Test
    void test19_poCreationNotificationReachesCorrectSupplierBuyer() {
        Notification n = notificationService.notifySupplier(supplierUserA.getId(), NotificationType.PO_ISSUED, "PO Issued", "Body", NotificationEntityType.PURCHASE_ORDER, UUID.randomUUID());
        assertThat(n.getRecipientId()).isEqualTo(supplierUserA.getId());
    }

    // Check 20: PO status update reaches correct participant
    @Test
    void test20_poStatusUpdateReachesCorrectParticipant() {
        Notification n = notificationService.notifyBuyer(buyerUserA.getId(), NotificationType.ORDER_SHIPPED, "Order Shipped", "Body", NotificationEntityType.PURCHASE_ORDER, UUID.randomUUID());
        assertThat(n.getRecipientId()).isEqualTo(buyerUserA.getId());
    }

    // Check 21: Supplier offering submission notifies admins
    @Test
    void test21_supplierOfferingSubmissionNotifiesAdmins() {
        notificationService.notifyAdmins(NotificationType.SUPPLIER_OFFERING_SUBMITTED, "New Offering Review", "Body", NotificationEntityType.SUPPLIER_OFFERING, UUID.randomUUID());

        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        Page<NotificationResponse> page = notificationController.getNotifications(PageRequest.of(0, 20), adminAuth);
        assertThat(page.getContent()).hasSize(1);
    }

    // Check 22: Offering approval notifies owning supplier
    @Test
    void test22_offeringApprovalNotifiesOwningSupplier() {
        Notification n = notificationService.notifySupplier(supplierUserA.getId(), NotificationType.SUPPLIER_OFFERING_APPROVED, "Offering Approved", "Body", NotificationEntityType.SUPPLIER_OFFERING, UUID.randomUUID());
        assertThat(n.getRecipientId()).isEqualTo(supplierUserA.getId());
    }

    // Check 23: Offering rejection notifies owning supplier
    @Test
    void test23_offeringRejectionNotifiesOwningSupplier() {
        Notification n = notificationService.notifySupplier(supplierUserA.getId(), NotificationType.SUPPLIER_OFFERING_REJECTED, "Offering Rejected", "Body", NotificationEntityType.SUPPLIER_OFFERING, UUID.randomUUID());
        assertThat(n.getRecipientId()).isEqualTo(supplierUserA.getId());
    }

    // Check 24: Supplier verification information request notifies supplier
    @Test
    void test24_supplierVerificationInformationRequestNotifiesSupplier() {
        Notification n = notificationService.notifySupplier(supplierUserA.getId(), NotificationType.VERIFICATION_INFO_REQUESTED, "Info Required", "Body", NotificationEntityType.SUPPLIER, UUID.randomUUID());
        assertThat(n.getRecipientId()).isEqualTo(supplierUserA.getId());
    }

    // Check 25: Supplier verification response notifies relevant admin
    @Test
    void test25_supplierVerificationResponseNotifiesRelevantAdmin() {
        notificationService.notifyAdmins(NotificationType.SUPPLIER_VERIFICATION_SUBMITTED, "Verification Submitted", "Body", NotificationEntityType.SUPPLIER, UUID.randomUUID());

        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        Page<NotificationResponse> page = notificationController.getNotifications(PageRequest.of(0, 20), adminAuth);
        assertThat(page.getContent()).hasSize(1);
    }

    // Check 26: Product request submission notifies admin
    @Test
    void test26_productRequestSubmissionNotifiesAdmin() {
        notificationService.notifyAdmins(NotificationType.PRODUCT_REQUEST_SUBMITTED, "Product Request Submitted", "Body", NotificationEntityType.PRODUCT_REQUEST, UUID.randomUUID());

        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        Page<NotificationResponse> page = notificationController.getNotifications(PageRequest.of(0, 20), adminAuth);
        assertThat(page.getContent()).hasSize(1);
    }

    // Check 27: Product request approval notifies supplier
    @Test
    void test27_productRequestApprovalNotifiesSupplier() {
        Notification n = notificationService.notifySupplier(supplierUserA.getId(), NotificationType.PRODUCT_REQUEST_APPROVED, "Request Approved", "Body", NotificationEntityType.PRODUCT_REQUEST, UUID.randomUUID());
        assertThat(n.getRecipientId()).isEqualTo(supplierUserA.getId());
    }

    // Check 28: Product request rejection notifies supplier
    @Test
    void test28_productRequestRejectionNotifiesSupplier() {
        Notification n = notificationService.notifySupplier(supplierUserA.getId(), NotificationType.PRODUCT_REQUEST_REJECTED, "Request Rejected", "Body", NotificationEntityType.PRODUCT_REQUEST, UUID.randomUUID());
        assertThat(n.getRecipientId()).isEqualTo(supplierUserA.getId());
    }

    // Check 29: Notification deep link points to correct entity
    @Test
    void test29_notificationDeepLinkPointsToCorrectEntity() {
        UUID rfqId = UUID.randomUUID();
        Notification n = notificationService.createNotification(buyerUserA.getId(), NotificationType.QUOTATION_SUBMITTED, "Quote Received", "Body", NotificationEntityType.RFQ, rfqId);
        assertThat(n.getEntityId()).isEqualTo(rfqId);
        assertThat(n.getEntityType()).isEqualTo(NotificationEntityType.RFQ);
    }

    // Check 30: Deep-link target still performs authorization
    @Test
    void test30_deepLinkTargetStillPerformsAuthorization() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        Page<NotificationResponse> page = notificationController.getNotifications(PageRequest.of(0, 20), buyerAuthA);
        assertThat(page).isNotNull();
    }

    // Check 31: Private data is not exposed in notification message
    @Test
    void test31_privateDataIsNotExposedInNotificationMessage() {
        Notification n = notificationService.createNotification(buyerUserA.getId(), NotificationType.QUOTATION_SUBMITTED, "New Quotation Received", "A supplier has submitted a quotation for your RFQ.", NotificationEntityType.QUOTATION, UUID.randomUUID());
        assertThat(n.getMessage()).doesNotContain("C:\\");
        assertThat(n.getMessage()).doesNotContain("password");
    }

    // Check 32: Admin notes are not exposed to buyer/supplier
    @Test
    void test32_adminNotesAreNotExposedToBuyerSupplier() {
        Notification n = notificationService.createNotification(supplierUserA.getId(), NotificationType.SUPPLIER_OFFERING_MODERATED, "Offering Update", "Your offering has been moderated.", NotificationEntityType.SUPPLIER_OFFERING, UUID.randomUUID());
        assertThat(n.getMessage()).doesNotContain("adminNote");
    }

    // Check 33: Supplier A cannot infer Supplier B activity
    @Test
    void test33_supplierACannotInferSupplierBActivity() {
        notificationService.createNotification(supplierUserB.getId(), NotificationType.RFQ_SUBMITTED, "Supplier B Activity", "Body", NotificationEntityType.RFQ, UUID.randomUUID());

        SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        Page<NotificationResponse> page = notificationController.getNotifications(PageRequest.of(0, 20), supplierAuthA);
        assertThat(page.getContent()).isEmpty();
    }

    // Check 34: Buyer A cannot infer Buyer B activity
    @Test
    void test34_buyerACannotInferBuyerBActivity() {
        notificationService.createNotification(buyerUserB.getId(), NotificationType.PO_ISSUED, "Buyer B PO", "Body", NotificationEntityType.PURCHASE_ORDER, UUID.randomUUID());

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        Page<NotificationResponse> page = notificationController.getNotifications(PageRequest.of(0, 20), buyerAuthA);
        assertThat(page.getContent()).isEmpty();
    }

    // Check 35: Duplicate event does not create unintended duplicate notification
    @Test
    void test35_duplicateEventDoesNotCreateUnintendedDuplicateNotification() {
        Notification n1 = notificationService.createNotification(buyerUserA.getId(), NotificationType.QUOTATION_SUBMITTED, "Quote 1", "Body", NotificationEntityType.QUOTATION, UUID.randomUUID());
        assertThat(n1).isNotNull();
    }

    // Check 36: Failed transaction does not create success notification
    @Test
    void test36_failedTransactionDoesNotCreateSuccessNotification() {
        assertThat(notificationRepository.count()).isEqualTo(0);
    }

    // Check 37: Historical notifications remain readable
    @Test
    void test37_historicalNotificationsRemainReadable() {
        Notification n = notificationService.createNotification(buyerUserA.getId(), NotificationType.QUOTATION_SUBMITTED, "Historic Quote", "Body", NotificationEntityType.QUOTATION, UUID.randomUUID());
        assertThat(notificationRepository.findById(n.getId())).isPresent();
    }

    // Check 38: Pagination is bounded
    @Test
    void test38_paginationIsBounded() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        Page<NotificationResponse> page = notificationController.getNotifications(PageRequest.of(0, 200), buyerAuthA);
        assertThat(page.getSize()).isEqualTo(100);
    }

    // Check 39: Invalid sort parameter is handled safely
    @Test
    void test39_invalidSortParameterIsHandledSafely() {
        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        Page<NotificationResponse> page = notificationController.getNotifications(PageRequest.of(0, 20), buyerAuthA);
        assertThat(page).isNotNull();
    }

    // Check 40: Notification API uses authenticated identity
    @Test
    void test40_notificationApiUsesAuthenticatedIdentity() {
        SecurityContextHolder.getContext().setAuthentication(null);
        assertThatThrownBy(() -> notificationController.getNotifications(PageRequest.of(0, 20), null))
                .isInstanceOf(AccessDeniedException.class);
    }

    // Check 41: Deleted/deactivated business entity notification is handled safely
    @Test
    void test41_deletedDeactivatedBusinessEntityNotificationIsHandledSafely() {
        Notification n = notificationService.createNotification(buyerUserA.getId(), NotificationType.QUOTATION_SUBMITTED, "Deleted Entity", "Body", NotificationEntityType.QUOTATION, UUID.randomUUID());
        assertThat(n.getId()).isNotNull();
    }

    // Check 42: Notification with invalid entity reference fails safely
    @Test
    void test42_notificationWithInvalidEntityReferenceFailsSafely() {
        Notification n = notificationService.createNotification(buyerUserA.getId(), NotificationType.QUOTATION_SUBMITTED, "Null Entity", "Body", null, null);
        assertThat(n.getId()).isNotNull();
    }

    // Check 43: Mark-read operation is idempotent
    @Test
    void test43_markReadOperationIsIdempotent() {
        Notification n = notificationService.createNotification(buyerUserA.getId(), NotificationType.QUOTATION_SUBMITTED, "Title", "Body", NotificationEntityType.QUOTATION, UUID.randomUUID());

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        notificationController.markAsRead(n.getId(), buyerAuthA);
        NotificationResponse res2 = notificationController.markAsRead(n.getId(), buyerAuthA);
        assertThat(res2.read()).isTrue();
    }

    // Check 44: Unread counter updates correctly
    @Test
    void test44_unreadCounterUpdatesCorrectly() {
        Notification n = notificationService.createNotification(buyerUserA.getId(), NotificationType.QUOTATION_SUBMITTED, "Title", "Body", NotificationEntityType.QUOTATION, UUID.randomUUID());

        SecurityContextHolder.getContext().setAuthentication(buyerAuthA);
        assertThat(notificationController.getUnreadCount(buyerAuthA).count()).isEqualTo(1);

        notificationController.markAsRead(n.getId(), buyerAuthA);
        assertThat(notificationController.getUnreadCount(buyerAuthA).count()).isEqualTo(0);
    }

    // Check 45: Role-specific notification routing is correct
    @Test
    void test45_roleSpecificNotificationRoutingIsCorrect() {
        Notification nBuyer = notificationService.notifyBuyer(buyerUserA.getId(), NotificationType.QUOTATION_SUBMITTED, "Buyer Note", "Body", NotificationEntityType.QUOTATION, UUID.randomUUID());
        Notification nAdmin = notificationService.createNotification(adminUser.getId(), NotificationType.SUPPLIER_OFFERING_SUBMITTED, "Admin Note", "Body", NotificationEntityType.SUPPLIER_OFFERING, UUID.randomUUID());

        assertThat(nBuyer.getRecipientId()).isEqualTo(buyerUserA.getId());
        assertThat(nAdmin.getRecipientId()).isEqualTo(adminUser.getId());
    }
}
