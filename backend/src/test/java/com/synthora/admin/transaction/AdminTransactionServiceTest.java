package com.synthora.admin.transaction;

import com.synthora.admin.audit.AuditAction;
import com.synthora.admin.audit.AuditLog;
import com.synthora.admin.audit.AuditLogRepository;
import com.synthora.admin.audit.AuditTargetType;
import com.synthora.admin.transaction.dto.*;
import com.synthora.common.ResourceNotFoundException;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.order.OrderStatus;
import com.synthora.order.PurchaseOrder;
import com.synthora.order.PurchaseOrderRepository;
import com.synthora.order.Shipment;
import com.synthora.order.ShipmentRepository;
import com.synthora.product.Product;
import com.synthora.product.ProductCategory;
import com.synthora.product.ProductRepository;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.rfq.Rfq;
import com.synthora.rfq.RfqRepository;
import com.synthora.rfq.RfqStatus;
import com.synthora.rfq.quotation.Quotation;
import com.synthora.rfq.quotation.QuotationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class AdminTransactionServiceTest {

    @Autowired
    private AdminTransactionService adminTransactionService;

    @Autowired
    private RfqRepository rfqRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private ShipmentRepository shipmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User admin;
    private User buyer;
    private User seller;
    private Supplier supplier;
    private Product product;
    private Rfq rfq1;
    private Rfq rfq2;
    private Quotation quotation1;
    private Quotation quotation2;
    private PurchaseOrder po;
    private Shipment shipment;

    private Authentication adminAuth;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        admin = new User();
        admin.setName("Admin Transactions");
        admin.setEmail("admin.tx@synthora.com");
        admin.setPasswordHash("hash123");
        admin.setRole(UserRole.ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        admin = userRepository.save(admin);

        buyer = new User();
        buyer.setName("Buyer Bob");
        buyer.setEmail("buyer.bob@synthora.com");
        buyer.setPasswordHash("hash123");
        buyer.setRole(UserRole.USER);
        buyer.setStatus(UserStatus.ACTIVE);
        buyer = userRepository.save(buyer);

        seller = new User();
        seller.setName("Supplier Sally");
        seller.setEmail("supplier.sally@synthora.com");
        seller.setPasswordHash("hash123");
        seller.setRole(UserRole.SUPPLIER);
        seller.setStatus(UserStatus.ACTIVE);
        seller = userRepository.save(seller);

        supplier = new Supplier();
        supplier.setName("Sally BioTech");
        supplier.setSlug("sally-biotech");
        supplier.setCountryCode("IN");
        supplier.setCountryName("India");
        supplier.setVerified(true);
        supplier.setUser(seller);
        supplier.setCreatedAt(LocalDateTime.now());
        supplier = supplierRepository.save(supplier);

        product = new Product();
        product.setName("Acetaminophen USP");
        product.setDescription("Pharma grade API");
        product.setPrice(new BigDecimal("80.00"));
        product.setStock(1000);
        product.setCategory(ProductCategory.API);
        product.setSeller(seller);
        product = productRepository.save(product);

        rfq1 = new Rfq();
        rfq1.setBuyerId(buyer.getId());
        rfq1.setProductId(product.getId());
        rfq1.setSupplierId(supplier.getId());
        rfq1.setQuantity(new BigDecimal("500.00"));
        rfq1.setUnit("KG");
        rfq1.setMessage("Need fast shipment");
        rfq1.setStatus(RfqStatus.PENDING);
        rfq1 = rfqRepository.save(rfq1);

        quotation1 = new Quotation();
        quotation1.setRfq(rfq1);
        quotation1.setQuotationVersion(1);
        quotation1.setUnitPrice(new BigDecimal("78.50"));
        quotation1.setCurrency("USD");
        quotation1.setMinimumOrderQuantity(new BigDecimal("100.00"));
        quotation1.setLeadTimeDays(7);
        quotation1.setValidityDate(LocalDate.now().plusDays(30));
        quotation1 = quotationRepository.save(quotation1);

        quotation2 = new Quotation();
        quotation2.setRfq(rfq1);
        quotation2.setQuotationVersion(2);
        quotation2.setUnitPrice(new BigDecimal("75.00"));
        quotation2.setCurrency("USD");
        quotation2.setMinimumOrderQuantity(new BigDecimal("100.00"));
        quotation2.setLeadTimeDays(5);
        quotation2.setValidityDate(LocalDate.now().plusDays(30));
        quotation2 = quotationRepository.save(quotation2);

        rfq2 = new Rfq();
        rfq2.setBuyerId(buyer.getId());
        rfq2.setProductId(product.getId());
        rfq2.setSupplierId(supplier.getId());
        rfq2.setQuantity(new BigDecimal("200.00"));
        rfq2.setUnit("KG");
        rfq2.setMessage("Regular inquiry");
        rfq2.setStatus(RfqStatus.QUOTED);
        rfq2 = rfqRepository.save(rfq2);

        po = new PurchaseOrder();
        po.setPoNumber("PO-2026-0001");
        po.setRfqId(rfq1.getId());
        po.setQuotationId(quotation2.getId());
        po.setBuyerId(buyer.getId());
        po.setSupplierId(supplier.getId());
        po.setProductId(product.getId());
        po.setProductName("Acetaminophen USP");
        po.setQuantity(new BigDecimal("500.00"));
        po.setUnit("KG");
        po.setUnitPrice(new BigDecimal("75.00"));
        po.setTotalAmount(new BigDecimal("37500.00"));
        po.setCurrency("USD");
        po.setShippingAddress("123 Pharma Way, Boston, MA");
        po.setBillingContact("finance@buyer.com");
        po.setStatus(OrderStatus.PLACED);
        po.setPlacedAt(LocalDateTime.now());
        po = purchaseOrderRepository.save(po);

        shipment = new Shipment();
        shipment.setPurchaseOrder(po);
        shipment.setCarrier("DHL Express");
        shipment.setTrackingNumber("DHL-987654321");
        shipment.setEstimatedDeliveryDate(LocalDate.now().plusDays(4));
        shipment.setShippedAt(LocalDateTime.now());
        shipment = shipmentRepository.save(shipment);

        adminAuth = new UsernamePasswordAuthenticationToken(admin.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
    }

    @Test
    public void testGetRfqs_PaginationAndFilters() {
        Page<AdminRfqResponse> all = adminTransactionService.getRfqs(0, 10, null, null, null, null, null);
        assertEquals(2, all.getTotalElements());

        // Status filter
        Page<AdminRfqResponse> pending = adminTransactionService.getRfqs(0, 10, RfqStatus.PENDING, null, null, null, null);
        assertEquals(1, pending.getTotalElements());
        assertEquals(rfq1.getId(), pending.getContent().get(0).id());

        // Buyer filter
        Page<AdminRfqResponse> buyerFilter = adminTransactionService.getRfqs(0, 10, null, buyer.getId(), null, null, null);
        assertEquals(2, buyerFilter.getTotalElements());
    }

    @Test
    public void testGetRfqDetail_WithQuotationHistory() {
        AdminRfqDetailResponse detail = adminTransactionService.getRfqDetail(rfq1.getId());
        assertNotNull(detail);
        assertEquals("Acetaminophen USP", detail.productName());
        assertEquals("Sally BioTech", detail.supplierName());
        assertEquals(2, detail.quotations().size());
        assertEquals(2, detail.quotations().get(0).quotationVersion()); // Descending order
    }

    @Test
    public void testUpdateRfqStatus_CloseAndCancelWithAudit() {
        MockHttpServletRequest request = new MockHttpServletRequest();

        // Close rfq2
        AdminRfqResponse closed = adminTransactionService.updateRfqStatus(
                rfq2.getId(),
                new UpdateAdminRfqStatusRequest(RfqStatus.CLOSED, "Stale RFQ closed by admin"),
                adminAuth,
                request
        );

        assertEquals(RfqStatus.CLOSED, closed.status());

        List<AuditLog> logs = auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AuditTargetType.RFQ, rfq2.getId().toString());
        assertEquals(1, logs.size());
        assertEquals(AuditAction.RFQ_STATUS_CHANGED, logs.get(0).getAction());
        assertTrue(logs.get(0).getDetails().contains("CLOSED"));

        // Reject invalid status like ACCEPTED
        assertThrows(IllegalArgumentException.class, () -> {
            adminTransactionService.updateRfqStatus(
                    rfq2.getId(),
                    new UpdateAdminRfqStatusRequest(RfqStatus.ACCEPTED, "Cannot force accept"),
                    adminAuth,
                    null
            );
        });
    }

    @Test
    public void testGetOrders_PaginationAndFilters() {
        Page<AdminPurchaseOrderResponse> all = adminTransactionService.getOrders(0, 10, null, null, null, null, null, null);
        assertEquals(1, all.getTotalElements());
        assertEquals("PO-2026-0001", all.getContent().get(0).poNumber());

        // PO number search
        Page<AdminPurchaseOrderResponse> search = adminTransactionService.getOrders(0, 10, null, null, null, null, "PO-2026", null);
        assertEquals(1, search.getTotalElements());
    }

    @Test
    public void testGetOrderDetail_WithShipmentInfo() {
        AdminPurchaseOrderDetailResponse detail = adminTransactionService.getOrderDetail(po.getId());
        assertNotNull(detail);
        assertEquals("PO-2026-0001", detail.poNumber());
        assertNotNull(detail.shipment());
        assertEquals("DHL Express", detail.shipment().carrier());
        assertEquals("DHL-987654321", detail.shipment().trackingNumber());
    }

    @Test
    public void testCancelOrder_CancellableWithAudit() {
        AdminPurchaseOrderResponse cancelled = adminTransactionService.cancelOrder(
                po.getId(),
                new CancelAdminPurchaseOrderRequest("Buyer requested cancellation due to budget constraints"),
                adminAuth,
                null
        );

        assertEquals(OrderStatus.CANCELLED, cancelled.status());

        List<AuditLog> logs = auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AuditTargetType.PURCHASE_ORDER, po.getId().toString());
        assertEquals(1, logs.size());
        assertEquals(AuditAction.ORDER_CANCELLED, logs.get(0).getAction());
    }

    @Test
    public void testCancelOrder_ShippedOrDeliveredRejected() {
        po.setStatus(OrderStatus.SHIPPED);
        purchaseOrderRepository.save(po);

        assertThrows(IllegalStateException.class, () -> {
            adminTransactionService.cancelOrder(
                    po.getId(),
                    new CancelAdminPurchaseOrderRequest("Try cancelling shipped order"),
                    adminAuth,
                    null
            );
        });

        po.setStatus(OrderStatus.DELIVERED);
        purchaseOrderRepository.save(po);

        assertThrows(IllegalStateException.class, () -> {
            adminTransactionService.cancelOrder(
                    po.getId(),
                    new CancelAdminPurchaseOrderRequest("Try cancelling delivered order"),
                    adminAuth,
                    null
            );
        });
    }
}
