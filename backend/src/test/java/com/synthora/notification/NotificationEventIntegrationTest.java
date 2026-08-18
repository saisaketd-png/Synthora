package com.synthora.notification;

import com.synthora.document.DocumentCategory;
import com.synthora.document.DocumentOwnerType;
import com.synthora.document.DocumentService;
import com.synthora.document.DocumentUploadRequest;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.order.PurchaseOrder;
import com.synthora.order.PurchaseOrderRepository;
import com.synthora.order.PurchaseOrderService;
import com.synthora.order.dto.CreatePurchaseOrderRequest;
import com.synthora.order.dto.PurchaseOrderResponse;
import com.synthora.product.Product;
import com.synthora.product.ProductCategory;
import com.synthora.product.ProductRepository;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.rfq.Rfq;
import com.synthora.rfq.RfqRepository;
import com.synthora.rfq.RfqService;
import com.synthora.rfq.dto.AcceptQuotationRequest;
import com.synthora.rfq.dto.CreateQuotationRequest;
import com.synthora.rfq.dto.CreateRfqRequest;
import com.synthora.rfq.dto.QuotationResponse;
import com.synthora.rfq.dto.RejectQuotationRequest;
import com.synthora.rfq.dto.RfqResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class NotificationEventIntegrationTest {

    @Autowired private NotificationRepository notificationRepository;
    @Autowired private RfqService rfqService;
    @Autowired private PurchaseOrderService purchaseOrderService;
    @Autowired private DocumentService documentService;
    @Autowired private UserRepository userRepository;
    @Autowired private SupplierRepository supplierRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private RfqRepository rfqRepository;
    @Autowired private PurchaseOrderRepository purchaseOrderRepository;
    @Autowired private JdbcTemplate jdbcTemplate;

    private User buyerUser;
    private User supplierUser;
    private Supplier supplier;
    private Product product;
    private Authentication buyerAuth;
    private Authentication supplierAuth;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("DELETE FROM notifications");
        jdbcTemplate.execute(
                "UPDATE rfqs SET accepted_quotation_id = NULL; " +
                "DELETE FROM shipments; " +
                "DELETE FROM purchase_orders; " +
                "DELETE FROM quotations; " +
                "DELETE FROM rfqs; " +
                "DELETE FROM documents; " +
                "DELETE FROM product_suppliers; " +
                "DELETE FROM products; " +
                "DELETE FROM seller_profiles; " +
                "DELETE FROM suppliers; " +
                "DELETE FROM users;"
        );

        buyerUser = new User();
        buyerUser.setEmail("buyer@synthora.com");
        buyerUser.setName("Buyer User");
        buyerUser.setPasswordHash("hash");
        buyerUser.setRole(UserRole.USER);
        buyerUser = userRepository.save(buyerUser);
        buyerAuth = new UsernamePasswordAuthenticationToken(buyerUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        supplierUser = new User();
        supplierUser.setEmail("supplier@synthora.com");
        supplierUser.setName("Supplier User");
        supplierUser.setPasswordHash("hash");
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser = userRepository.save(supplierUser);
        supplierAuth = new UsernamePasswordAuthenticationToken(supplierUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPPLIER")));

        supplier = new Supplier();
        supplier.setName("Acme Chemical Co.");
        supplier.setUser(supplierUser);
        supplier.setCountryCode("US");
        supplier.setCountryName("United States");
        supplier = supplierRepository.save(supplier);

        product = new Product();
        product.setName("Acetone 99.5%");
        product.setCategory(ProductCategory.API);
        product.setSeller(supplierUser);
        product.setPrice(new BigDecimal("150.00"));
        product.setStock(500);
        product = productRepository.save(product);
    }

    @Test
    public void test01_RfqCreation_ProducesRfqSubmittedNotificationForSupplier() {
        CreateRfqRequest request = new CreateRfqRequest(
                product.getId(),
                supplier.getId(),
                new BigDecimal("500"),
                "L",
                "Need quote urgently"
        );

        RfqResponse rfqResponse = rfqService.createRfq(request, buyerAuth);
        assertNotNull(rfqResponse);

        List<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(
                supplierUser.getId(), PageRequest.of(0, 10)).getContent();

        assertEquals(1, notifications.size());
        Notification n = notifications.get(0);
        assertEquals(NotificationType.RFQ_SUBMITTED, n.getType());
        assertEquals(supplierUser.getId(), n.getRecipientId());
        assertEquals("New RFQ Received", n.getTitle());
        assertEquals(NotificationEntityType.RFQ, n.getEntityType());
        assertEquals(rfqResponse.id(), n.getEntityId());
        assertFalse(n.isRead());
    }

    @Test
    public void test02_QuotationSubmission_ProducesQuotationSubmittedNotificationForBuyer() {
        CreateRfqRequest rfqReq = new CreateRfqRequest(product.getId(), supplier.getId(), new BigDecimal("500"), "L", "RFQ");
        RfqResponse rfq = rfqService.createRfq(rfqReq, buyerAuth);

        CreateQuotationRequest quoteReq = new CreateQuotationRequest(
                new BigDecimal("4.50"),
                "USD",
                new BigDecimal("100"),
                7,
                LocalDate.now().plusDays(30),
                "Standard Drums",
                "FOB port"
        );

        QuotationResponse quote = rfqService.submitQuotation(rfq.id(), quoteReq, supplierAuth);
        assertNotNull(quote);

        List<Notification> buyerNotifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(
                buyerUser.getId(), PageRequest.of(0, 10)).getContent();

        assertEquals(1, buyerNotifs.size());
        Notification n = buyerNotifs.get(0);
        assertEquals(NotificationType.QUOTATION_SUBMITTED, n.getType());
        assertEquals(buyerUser.getId(), n.getRecipientId());
        assertEquals("New Quotation Received", n.getTitle());
        assertEquals(NotificationEntityType.QUOTATION, n.getEntityType());
        assertEquals(quote.id(), n.getEntityId());
    }

    @Test
    public void test03_QuotationAccepted_ProducesQuotationAcceptedNotificationForSupplier() {
        CreateRfqRequest rfqReq = new CreateRfqRequest(product.getId(), supplier.getId(), new BigDecimal("500"), "L", "RFQ");
        RfqResponse rfq = rfqService.createRfq(rfqReq, buyerAuth);

        CreateQuotationRequest quoteReq = new CreateQuotationRequest(
                new BigDecimal("4.50"), "USD", new BigDecimal("100"), 7, LocalDate.now().plusDays(30), "Drums", "Notes");
        QuotationResponse quote = rfqService.submitQuotation(rfq.id(), quoteReq, supplierAuth);

        rfqService.acceptQuotation(rfq.id(), quote.id(), new AcceptQuotationRequest("Looks good"), buyerAuth);

        List<Notification> supplierNotifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(
                supplierUser.getId(), PageRequest.of(0, 10)).getContent();

        // Should have 2 notifications: RFQ_SUBMITTED and QUOTATION_ACCEPTED
        assertEquals(2, supplierNotifs.size());
        Notification latest = supplierNotifs.get(0);
        assertEquals(NotificationType.QUOTATION_ACCEPTED, latest.getType());
        assertEquals(supplierUser.getId(), latest.getRecipientId());
        assertEquals("Quotation Accepted", latest.getTitle());
        assertEquals(NotificationEntityType.QUOTATION, latest.getEntityType());
        assertEquals(quote.id(), latest.getEntityId());
    }

    @Test
    public void test04_QuotationRejected_ProducesQuotationRejectedNotificationForSupplier() {
        CreateRfqRequest rfqReq = new CreateRfqRequest(product.getId(), supplier.getId(), new BigDecimal("500"), "L", "RFQ");
        RfqResponse rfq = rfqService.createRfq(rfqReq, buyerAuth);

        CreateQuotationRequest quoteReq = new CreateQuotationRequest(
                new BigDecimal("4.50"), "USD", new BigDecimal("100"), 7, LocalDate.now().plusDays(30), "Drums", "Notes");
        QuotationResponse quote = rfqService.submitQuotation(rfq.id(), quoteReq, supplierAuth);

        rfqService.rejectQuotation(rfq.id(), quote.id(), new RejectQuotationRequest("Price too high"), buyerAuth);

        List<Notification> supplierNotifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(
                supplierUser.getId(), PageRequest.of(0, 10)).getContent();

        assertEquals(2, supplierNotifs.size());
        Notification latest = supplierNotifs.get(0);
        assertEquals(NotificationType.QUOTATION_REJECTED, latest.getType());
        assertEquals(supplierUser.getId(), latest.getRecipientId());
        assertEquals("Quotation Rejected", latest.getTitle());
        assertEquals(NotificationEntityType.QUOTATION, latest.getEntityType());
    }

    @Test
    public void test05_PurchaseOrderLifecycle_ProducesExpectedNotifications() {
        CreateRfqRequest rfqReq = new CreateRfqRequest(product.getId(), supplier.getId(), new BigDecimal("500"), "L", "RFQ");
        RfqResponse rfq = rfqService.createRfq(rfqReq, buyerAuth);

        CreateQuotationRequest quoteReq = new CreateQuotationRequest(
                new BigDecimal("4.50"), "USD", new BigDecimal("100"), 7, LocalDate.now().plusDays(30), "Drums", "Notes");
        QuotationResponse quote = rfqService.submitQuotation(rfq.id(), quoteReq, supplierAuth);
        rfqService.acceptQuotation(rfq.id(), quote.id(), new AcceptQuotationRequest("Accepted"), buyerAuth);

        // 1. PO Issued
        CreatePurchaseOrderRequest poReq = new CreatePurchaseOrderRequest(
                rfq.id(),
                "123 Industrial Parkway",
                "billing@buyer.com",
                "Urgent delivery"
        );
        PurchaseOrderResponse po = purchaseOrderService.createPurchaseOrder(poReq, buyerAuth);

        List<Notification> supplierNotifs1 = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(
                supplierUser.getId(), PageRequest.of(0, 10)).getContent();
        // RFQ_SUBMITTED, QUOTATION_ACCEPTED, PO_ISSUED -> 3 notifications
        assertEquals(3, supplierNotifs1.size());
        assertEquals(NotificationType.PO_ISSUED, supplierNotifs1.get(0).getType());
        assertEquals(NotificationEntityType.PURCHASE_ORDER, supplierNotifs1.get(0).getEntityType());
        assertEquals(po.id(), supplierNotifs1.get(0).getEntityId());

        // 2. PO Confirmed
        purchaseOrderService.confirmSupplierOrder(po.id(), supplierAuth);
        List<Notification> buyerNotifs2 = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(
                buyerUser.getId(), PageRequest.of(0, 10)).getContent();
        assertEquals(2, buyerNotifs2.size()); // QUOTATION_SUBMITTED, PO_CONFIRMED
        assertEquals(NotificationType.PO_CONFIRMED, buyerNotifs2.get(0).getType());

        // 3. Order Processing Started
        purchaseOrderService.startProcessingSupplierOrder(po.id(), supplierAuth);
        List<Notification> buyerNotifs3 = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(
                buyerUser.getId(), PageRequest.of(0, 10)).getContent();
        assertEquals(3, buyerNotifs3.size());
        assertEquals(NotificationType.ORDER_PROCESSING_STARTED, buyerNotifs3.get(0).getType());

        // 4. Order Shipped
        purchaseOrderService.shipSupplierOrder(po.id(), "FedEx Freight", "TRK-987654", LocalDate.now().plusDays(3), supplierAuth);
        List<Notification> buyerNotifs4 = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(
                buyerUser.getId(), PageRequest.of(0, 10)).getContent();
        assertEquals(4, buyerNotifs4.size());
        assertEquals(NotificationType.ORDER_SHIPPED, buyerNotifs4.get(0).getType());
        assertEquals(NotificationEntityType.SHIPMENT, buyerNotifs4.get(0).getEntityType());

        // 5. Order Delivered
        purchaseOrderService.markOrderDeliveredSupplier(po.id(), supplierAuth);
        List<Notification> buyerNotifs5 = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(
                buyerUser.getId(), PageRequest.of(0, 10)).getContent();
        assertEquals(5, buyerNotifs5.size());
        assertEquals(NotificationType.ORDER_DELIVERED, buyerNotifs5.get(0).getType());
    }

    @Test
    public void test06_DocumentUpload_ProducesDocumentUploadedNotificationForCounterparty() {
        CreateRfqRequest rfqReq = new CreateRfqRequest(product.getId(), supplier.getId(), new BigDecimal("500"), "L", "RFQ");
        RfqResponse rfq = rfqService.createRfq(rfqReq, buyerAuth);

        MockMultipartFile file = new MockMultipartFile(
                "file", "tech-spec.pdf", "application/pdf", "Dummy PDF content".getBytes());

        DocumentUploadRequest docReq = new DocumentUploadRequest();
        docReq.setOwnerType(DocumentOwnerType.RFQ);
        docReq.setOwnerId(rfq.id());
        docReq.setCategory(DocumentCategory.TECHNICAL_SPECIFICATION);
        docReq.setFile(file);

        // Buyer uploads a document on RFQ -> Counterparty (Supplier) should get notified
        documentService.uploadDocument(docReq, buyerUser.getId());

        List<Notification> supplierNotifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(
                supplierUser.getId(), PageRequest.of(0, 10)).getContent();

        // RFQ_SUBMITTED + DOCUMENT_UPLOADED
        assertEquals(2, supplierNotifs.size());
        Notification latest = supplierNotifs.get(0);
        assertEquals(NotificationType.DOCUMENT_UPLOADED, latest.getType());
        assertEquals(supplierUser.getId(), latest.getRecipientId());
        assertEquals("New Document Uploaded", latest.getTitle());
        assertEquals(NotificationEntityType.DOCUMENT, latest.getEntityType());
    }

    @Test
    public void test07_FailedOperation_DoesNotCreateNotification() {
        long countBefore = notificationRepository.count();

        // Try to accept a quotation that doesn't exist
        assertThrows(Exception.class, () -> {
            rfqService.acceptQuotation(UUID.randomUUID(), UUID.randomUUID(), new AcceptQuotationRequest(""), buyerAuth);
        });

        long countAfter = notificationRepository.count();
        assertEquals(countBefore, countAfter, "Failed operation must not create any notification");
    }
}
