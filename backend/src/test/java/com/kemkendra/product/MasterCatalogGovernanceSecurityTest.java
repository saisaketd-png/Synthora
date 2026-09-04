package com.kemkendra.product;

import com.kemkendra.admin.audit.AuditLogRepository;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.notification.NotificationRepository;
import com.kemkendra.product.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class MasterCatalogGovernanceSecurityTest {

    @Autowired
    private AdminMasterCatalogService adminMasterCatalogService;

    @Autowired
    private ProductRequestService productRequestService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private User adminUser;
    private Authentication adminAuth;

    private User supplierUser;
    private Supplier supplier;
    private Authentication supplierAuth;

    private User buyerUser;
    private Authentication buyerAuth;

    @BeforeEach
    public void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        adminUser = new User();
        adminUser.setName("Catalog Admin " + suffix);
        adminUser.setEmail("admin_cat_" + suffix + "@kemkendra.com");
        adminUser.setPasswordHash("hash");
        adminUser.setRole(UserRole.ADMIN);
        adminUser = userRepository.save(adminUser);
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null);

        supplierUser = new User();
        supplierUser.setName("Proposal Supplier " + suffix);
        supplierUser.setEmail("prop_sup_" + suffix + "@kemkendra.com");
        supplierUser.setPasswordHash("hash");
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser = userRepository.save(supplierUser);

        supplier = new Supplier();
        supplier.setName("Proposal Chem " + suffix);
        supplier.setSlug("prop-chem-" + suffix);
        supplier.setUser(supplierUser);
        supplier = supplierRepository.save(supplier);
        supplierAuth = new UsernamePasswordAuthenticationToken(supplierUser.getEmail(), null);

        buyerUser = new User();
        buyerUser.setName("Buyer User " + suffix);
        buyerUser.setEmail("buyer_cat_" + suffix + "@kemkendra.com");
        buyerUser.setPasswordHash("hash");
        buyerUser.setRole(UserRole.USER);
        buyerUser = userRepository.save(buyerUser);
        buyerAuth = new UsernamePasswordAuthenticationToken(buyerUser.getEmail(), null);
    }

    // 1. Admin Access Allowed, Non-Admin Denied (HTTP 403)
    @Test
    public void test01_NonAdminDeniedAccessToGovernance() {
        assertThrows(AccessDeniedException.class, () -> adminMasterCatalogService.getGovernanceStats(buyerAuth));
        assertThrows(AccessDeniedException.class, () -> adminMasterCatalogService.getRequestsByStatus("PENDING_REVIEW", null, buyerAuth));
    }

    // 2. Supplier Cannot Approve Own Chemical Request
    @Test
    public void test02_SupplierCannotApproveOwnRequest() {
        ProductRequestResponse req = productRequestService.createRequest(new CreateProductRequestRequest(
                "Custom Solubilizer Compound",
                "1234-56-7",
                "C5H10O5",
                ProductCategory.EXCIPIENT,
                "Description",
                "Message"
        ), supplierAuth);

        ApproveProductRequestPayload approvePayload = new ApproveProductRequestPayload(
                "Custom Solubilizer Compound",
                "1234-56-7",
                "C5H10O5",
                ProductCategory.EXCIPIENT,
                "Canonical description"
        );

        assertThrows(AccessDeniedException.class, () -> adminMasterCatalogService.approveRequest(req.id(), approvePayload, supplierAuth));
    }

    // 3. Admin Request Approval Creates MasterProduct & Delivers Supplier Notification & Audit Log
    @Test
    public void test03_AdminApproveRequestCreatesMasterProductAndNotifiesSupplier() {
        ProductRequestResponse req = productRequestService.createRequest(new CreateProductRequestRequest(
                "Sodium Valproate Tech",
                "1069-66-5",
                "C8H15NaO2",
                ProductCategory.API,
                "Description",
                "Message"
        ), supplierAuth);

        ApproveProductRequestPayload approvePayload = new ApproveProductRequestPayload(
                "Sodium Valproate Pure",
                "1069-66-5",
                "C8H15NaO2",
                ProductCategory.API,
                "Canonical Sodium Valproate entry"
        );

        MasterProductResponse approvedMp = adminMasterCatalogService.approveRequest(req.id(), approvePayload, adminAuth);

        assertNotNull(approvedMp.id());
        assertEquals("Sodium Valproate Pure", approvedMp.name());
        assertTrue(approvedMp.masterProductCode().startsWith("API-"));

        // Verify supplier notification delivered
        assertFalse(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(supplierUser.getId()).isEmpty());

        // Verify audit log emitted
        assertFalse(auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(
                com.kemkendra.admin.audit.AuditTargetType.PRODUCT_REQUEST,
                req.id().toString()
        ).isEmpty());
    }

    // 4. Admin Rejection Updates Status & Delivers Notification
    @Test
    public void test04_AdminRejectRequestUpdatesStatusAndNotifiesSupplier() {
        ProductRequestResponse req = productRequestService.createRequest(new CreateProductRequestRequest(
                "Invalid Compound",
                "9999-99-9",
                "C1H1",
                ProductCategory.SPECIALTY_CHEMICAL,
                "Description",
                "Message"
        ), supplierAuth);

        RejectProductRequestPayload rejectPayload = new RejectProductRequestPayload(
                "Invalid CAS format and incomplete technical data"
        );

        ProductRequestResponse rejected = adminMasterCatalogService.rejectRequest(req.id(), rejectPayload, adminAuth);

        assertEquals("REJECTED", rejected.status());
        assertFalse(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(supplierUser.getId()).isEmpty());
    }
}
