package com.synthora.notification;

import com.synthora.document.DocumentCategory;
import com.synthora.document.DocumentOwnerType;
import com.synthora.document.DocumentService;
import com.synthora.document.DocumentUploadRequest;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.notification.email.EmailService;
import com.synthora.order.PurchaseOrderService;
import com.synthora.order.dto.CreatePurchaseOrderRequest;
import com.synthora.order.dto.PurchaseOrderResponse;
import com.synthora.product.Product;
import com.synthora.product.ProductCategory;
import com.synthora.product.ProductRepository;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.rfq.RfqService;
import com.synthora.rfq.dto.AcceptQuotationRequest;
import com.synthora.rfq.dto.CreateQuotationRequest;
import com.synthora.rfq.dto.CreateRfqRequest;
import com.synthora.rfq.dto.QuotationResponse;
import com.synthora.rfq.dto.RejectQuotationRequest;
import com.synthora.rfq.dto.RfqResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
public class NotificationEmailIntegrationTest {

    @MockBean private EmailService emailService;

    @Autowired private NotificationRepository notificationRepository;
    @Autowired private RfqService rfqService;
    @Autowired private PurchaseOrderService purchaseOrderService;
    @Autowired private DocumentService documentService;
    @Autowired private UserRepository userRepository;
    @Autowired private SupplierRepository supplierRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private JdbcTemplate jdbcTemplate;

    private User buyerUser;
    private User supplierUser;
    private Supplier supplier;
    private Product product;
    private Authentication buyerAuth;
    private Authentication supplierAuth;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        buyerUser = new User();
        buyerUser.setEmail("buyer-corp@enterprise.com");
        buyerUser.setName("Buyer User");
        buyerUser.setPasswordHash("hash");
        buyerUser.setRole(UserRole.USER);
        buyerUser.setStatus(UserStatus.ACTIVE);
        buyerUser = userRepository.save(buyerUser);
        buyerAuth = new UsernamePasswordAuthenticationToken(buyerUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        supplierUser = new User();
        supplierUser.setEmail("sales@acmechemicals.com");
        supplierUser.setName("Supplier User");
        supplierUser.setPasswordHash("hash");
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser.setStatus(UserStatus.ACTIVE);
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

        reset(emailService);
    }

    @Test
    public void testRfqSubmitted_TriggersEmailToSupplier() throws InterruptedException {
        CreateRfqRequest request = new CreateRfqRequest(
                product.getId(),
                supplier.getId(),
                new BigDecimal("500"),
                "L",
                "Need quote urgently"
        );

        rfqService.createRfq(request, buyerAuth);

        // Allow async thread pool a brief moment to process
        Thread.sleep(300);

        ArgumentCaptor<String> emailCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> subjectCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);

        verify(emailService, atLeastOnce()).sendHtmlEmail(emailCaptor.capture(), subjectCaptor.capture(), bodyCaptor.capture());

        assertEquals("sales@acmechemicals.com", emailCaptor.getValue());
        assertEquals("[Synthora] New RFQ Received", subjectCaptor.getValue());
        assertTrue(bodyCaptor.getValue().contains("A buyer has submitted a new request for quotation."));
    }

    @Test
    public void testQuotationSubmitted_TriggersEmailToBuyer() throws InterruptedException {
        CreateRfqRequest rfqReq = new CreateRfqRequest(product.getId(), supplier.getId(), new BigDecimal("500"), "L", "RFQ");
        RfqResponse rfq = rfqService.createRfq(rfqReq, buyerAuth);

        reset(emailService);

        CreateQuotationRequest quoteReq = new CreateQuotationRequest(
                new BigDecimal("4.50"), "USD", new BigDecimal("100"), 7, LocalDate.now().plusDays(30), "Standard Drums", "FOB port");
        rfqService.submitQuotation(rfq.id(), quoteReq, supplierAuth);

        Thread.sleep(300);

        ArgumentCaptor<String> emailCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> subjectCaptor = ArgumentCaptor.forClass(String.class);

        verify(emailService, atLeastOnce()).sendHtmlEmail(emailCaptor.capture(), subjectCaptor.capture(), anyString());

        assertEquals("buyer-corp@enterprise.com", emailCaptor.getValue());
        assertEquals("[Synthora] New Quotation Received", subjectCaptor.getValue());
    }

    @Test
    public void testEmailFailure_DoesNotRollbackBusinessTransactionOrInAppNotification() throws InterruptedException {
        // Configure emailService to throw exception on send
        doThrow(new RuntimeException("SMTP transport failure")).when(emailService).sendHtmlEmail(anyString(), anyString(), anyString());

        CreateRfqRequest request = new CreateRfqRequest(
                product.getId(),
                supplier.getId(),
                new BigDecimal("500"),
                "L",
                "Need quote urgently"
        );

        // RFQ creation must succeed completely despite email failure
        RfqResponse rfq = assertDoesNotThrow(() -> rfqService.createRfq(request, buyerAuth));
        assertNotNull(rfq);
        assertNotNull(rfq.id());

        Thread.sleep(300);

        // In-app notification must still be persisted
        assertEquals(1, notificationRepository.count());
        Notification n = notificationRepository.findAll().get(0);
        assertEquals(supplierUser.getId(), n.getRecipientId());
        assertEquals(NotificationType.RFQ_SUBMITTED, n.getType());
    }

    @Test
    public void testPurchaseOrderLifecycle_DispatchesEmailsAtEachStage() throws InterruptedException {
        CreateRfqRequest rfqReq = new CreateRfqRequest(product.getId(), supplier.getId(), new BigDecimal("500"), "L", "RFQ");
        RfqResponse rfq = rfqService.createRfq(rfqReq, buyerAuth);

        CreateQuotationRequest quoteReq = new CreateQuotationRequest(
                new BigDecimal("4.50"), "USD", new BigDecimal("100"), 7, LocalDate.now().plusDays(30), "Drums", "Notes");
        QuotationResponse quote = rfqService.submitQuotation(rfq.id(), quoteReq, supplierAuth);
        rfqService.acceptQuotation(rfq.id(), quote.id(), new AcceptQuotationRequest("Accepted"), buyerAuth);

        reset(emailService);

        // 1. PO Issued
        CreatePurchaseOrderRequest poReq = new CreatePurchaseOrderRequest(rfq.id(), "123 Parkway", "billing@buyer.com", "Notes");
        PurchaseOrderResponse po = purchaseOrderService.createPurchaseOrder(poReq, buyerAuth);
        Thread.sleep(300);
        verify(emailService, atLeastOnce()).sendHtmlEmail(eq("sales@acmechemicals.com"), eq("[Synthora] Purchase Order Issued"), anyString());

        // 2. PO Confirmed
        reset(emailService);
        purchaseOrderService.confirmSupplierOrder(po.id(), supplierAuth);
        Thread.sleep(300);
        verify(emailService, atLeastOnce()).sendHtmlEmail(eq("buyer-corp@enterprise.com"), eq("[Synthora] Purchase Order Confirmed"), anyString());

        // 3. Processing Started
        reset(emailService);
        purchaseOrderService.startProcessingSupplierOrder(po.id(), supplierAuth);
        Thread.sleep(300);
        verify(emailService, atLeastOnce()).sendHtmlEmail(eq("buyer-corp@enterprise.com"), eq("[Synthora] Order Processing Started"), anyString());

        // 4. Shipped
        reset(emailService);
        purchaseOrderService.shipSupplierOrder(po.id(), "FedEx Freight", "TRK-12345", LocalDate.now().plusDays(3), supplierAuth);
        Thread.sleep(300);
        verify(emailService, atLeastOnce()).sendHtmlEmail(eq("buyer-corp@enterprise.com"), eq("[Synthora] Order Shipped"), anyString());

        // 5. Delivered
        reset(emailService);
        purchaseOrderService.markOrderDeliveredSupplier(po.id(), supplierAuth);
        Thread.sleep(300);
        verify(emailService, atLeastOnce()).sendHtmlEmail(eq("buyer-corp@enterprise.com"), eq("[Synthora] Order Delivered"), anyString());
    }

    @Test
    public void testDocumentUpload_TriggersEmailToCounterparty() throws InterruptedException {
        CreateRfqRequest rfqReq = new CreateRfqRequest(product.getId(), supplier.getId(), new BigDecimal("500"), "L", "RFQ");
        RfqResponse rfq = rfqService.createRfq(rfqReq, buyerAuth);

        reset(emailService);

        MockMultipartFile file = new MockMultipartFile("file", "spec.pdf", "application/pdf", "%PDF-1.4 spec content".getBytes());
        DocumentUploadRequest docReq = new DocumentUploadRequest();
        docReq.setOwnerType(DocumentOwnerType.RFQ);
        docReq.setOwnerId(rfq.id());
        docReq.setCategory(DocumentCategory.TECHNICAL_SPECIFICATION);
        docReq.setFile(file);

        documentService.uploadDocument(docReq, buyerUser.getId());

        Thread.sleep(300);

        verify(emailService, atLeastOnce()).sendHtmlEmail(eq("sales@acmechemicals.com"), eq("[Synthora] New Document Uploaded"), anyString());
    }
}
