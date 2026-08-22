package com.synthora.order;

import com.synthora.common.ResourceNotFoundException;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.order.dto.PurchaseOrderResponse;
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
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;

@SpringBootTest
@ActiveProfiles("test")
public class PurchaseOrderFulfillmentServiceTest {

    @Autowired
    private PurchaseOrderService purchaseOrderService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private RfqRepository rfqRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private ShipmentRepository shipmentRepository;

    // We spy on the repository to simulate a failure during the transaction
    @MockitoSpyBean
    private PurchaseOrderRepository spyPurchaseOrderRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private User buyer;
    private User supplierUser;
    private Supplier supplier;
    private Product product;
    private PurchaseOrder purchaseOrder;
    private Authentication supplierAuth;
    private Authentication buyerAuth;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM users;");

        buyer = new User();
        buyer.setEmail("buyer@synthora.com");
        buyer.setName("Buyer");
        buyer.setPasswordHash("hash123");
        buyer.setRole(UserRole.USER);
        buyer.setStatus(com.synthora.identity.UserStatus.ACTIVE);
        buyer = userRepository.save(buyer);

        buyerAuth = new UsernamePasswordAuthenticationToken(buyer.getEmail(), null, Collections.emptyList());

        supplierUser = new User();
        supplierUser.setEmail("seller@synthora.com");
        supplierUser.setName("Seller");
        supplierUser.setPasswordHash("hash123");
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser.setStatus(com.synthora.identity.UserStatus.ACTIVE);
        supplierUser = userRepository.save(supplierUser);

        supplierAuth = new UsernamePasswordAuthenticationToken(supplierUser.getEmail(), null, Collections.emptyList());

        supplier = new Supplier();
        supplier.setUser(supplierUser);
        supplier = supplierRepository.save(supplier);

        product = new Product();
        product.setName("Test Product");
        product.setPrice(BigDecimal.valueOf(100.00));
        product.setStock(500);
        product.setCategory(ProductCategory.SPECIALTY_CHEMICAL);
        product.setSeller(supplierUser);
        product = productRepository.save(product);

        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyer.getId());
        rfq.setSupplierId(supplier.getId());
        rfq.setProductId(product.getId());
        rfq.setQuantity(BigDecimal.valueOf(50.00));
        rfq.setUnit("MT");
        rfq.setStatus(RfqStatus.ACCEPTED);
        rfq = rfqRepository.save(rfq);

        Quotation quotation = new Quotation();
        quotation.setRfq(rfq);
        quotation.setQuotationVersion(1);
        quotation.setUnitPrice(BigDecimal.valueOf(125.5));
        quotation.setCurrency("USD");
        quotation.setMinimumOrderQuantity(BigDecimal.valueOf(10.0));
        quotation.setValidityDate(LocalDate.now().plusMonths(1));
        quotation = quotationRepository.save(quotation);

        rfq.setAcceptedQuotationId(quotation.getId());
        rfqRepository.save(rfq);

        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber("PO-2026-1000");
        po.setRfqId(rfq.getId());
        po.setQuotationId(quotation.getId());
        po.setBuyerId(buyer.getId());
        po.setSupplierId(supplier.getId());
        po.setProductId(product.getId());
        po.setQuantity(BigDecimal.valueOf(50));
        po.setUnit("MT");
        po.setUnitPrice(BigDecimal.valueOf(125.5));
        po.setTotalAmount(BigDecimal.valueOf(6275));
        po.setCurrency("USD");
        po.setShippingAddress("Test Address");
        po.setBillingContact("Test Billing");
        po.setStatus(OrderStatus.CONFIRMED);
        po.setPlacedAt(LocalDateTime.now());
        po.setConfirmedAt(LocalDateTime.now());
        purchaseOrder = purchaseOrderRepository.save(po);
    }

    @Test
    public void testValidTransitionsFullLifecycle() {
        // 1. CONFIRMED -> PROCESSING
        PurchaseOrderResponse processingResp = purchaseOrderService.startProcessingSupplierOrder(purchaseOrder.getId(), supplierAuth);
        assertEquals(OrderStatus.PROCESSING, processingResp.status());

        // 2. PROCESSING -> SHIPPED
        LocalDate eta = LocalDate.now().plusDays(5);
        PurchaseOrderResponse shippedResp = purchaseOrderService.shipSupplierOrder(purchaseOrder.getId(), "FedEx", "TRK-123", eta, supplierAuth);
        assertEquals(OrderStatus.SHIPPED, shippedResp.status());

        Shipment shipment = shipmentRepository.findByPurchaseOrderId(purchaseOrder.getId()).orElse(null);
        assertNotNull(shipment);
        assertEquals("FedEx", shipment.getCarrier());
        assertEquals("TRK-123", shipment.getTrackingNumber());
        assertEquals(eta, shipment.getEstimatedDeliveryDate());
        assertNotNull(shipment.getShippedAt());

        // 3. SHIPPED -> DELIVERED
        PurchaseOrderResponse deliveredResp = purchaseOrderService.markOrderDeliveredSupplier(purchaseOrder.getId(), supplierAuth);
        assertEquals(OrderStatus.DELIVERED, deliveredResp.status());
    }

    @Test
    public void testInvalidStartProcessing() {
        purchaseOrder.setStatus(OrderStatus.PLACED);
        purchaseOrderRepository.save(purchaseOrder);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            purchaseOrderService.startProcessingSupplierOrder(purchaseOrder.getId(), supplierAuth);
        });
        assertTrue(ex.getMessage().contains("Cannot start processing"));
    }

    @Test
    public void testShipmentValidation() {
        // Attempt to ship from CONFIRMED directly
        IllegalStateException ex1 = assertThrows(IllegalStateException.class, () -> {
            purchaseOrderService.shipSupplierOrder(purchaseOrder.getId(), "FedEx", "TRK-123", null, supplierAuth);
        });
        assertTrue(ex1.getMessage().contains("Cannot ship order"));

        purchaseOrder.setStatus(OrderStatus.PROCESSING);
        purchaseOrderRepository.save(purchaseOrder);

        // Blank carrier
        IllegalArgumentException ex2 = assertThrows(IllegalArgumentException.class, () -> {
            purchaseOrderService.shipSupplierOrder(purchaseOrder.getId(), "", "TRK-123", null, supplierAuth);
        });
        assertTrue(ex2.getMessage().contains("Carrier"));

        // Blank tracking
        IllegalArgumentException ex3 = assertThrows(IllegalArgumentException.class, () -> {
            purchaseOrderService.shipSupplierOrder(purchaseOrder.getId(), "FedEx", "  ", null, supplierAuth);
        });
        assertTrue(ex3.getMessage().contains("Tracking"));
    }

    @Test
    public void testDuplicateShipment() {
        purchaseOrder.setStatus(OrderStatus.PROCESSING);
        purchaseOrderRepository.save(purchaseOrder);

        // First shipment succeeds
        purchaseOrderService.shipSupplierOrder(purchaseOrder.getId(), "FedEx", "TRK-123", null, supplierAuth);

        // Must manually reset status back to PROCESSING to test the duplicate shipment guard without hitting the status guard
        PurchaseOrder updated = purchaseOrderRepository.findById(purchaseOrder.getId()).orElseThrow();
        updated.setStatus(OrderStatus.PROCESSING);
        purchaseOrderRepository.save(updated);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            purchaseOrderService.shipSupplierOrder(purchaseOrder.getId(), "DHL", "TRK-456", null, supplierAuth);
        });
        assertTrue(ex.getMessage().contains("already exists"));
    }

    @Test
    public void testInvalidDelivery() {
        purchaseOrder.setStatus(OrderStatus.PROCESSING);
        purchaseOrderRepository.save(purchaseOrder);

        // Cannot deliver PROCESSING order
        IllegalStateException ex1 = assertThrows(IllegalStateException.class, () -> {
            purchaseOrderService.markOrderDeliveredSupplier(purchaseOrder.getId(), supplierAuth);
        });
        assertTrue(ex1.getMessage().contains("Cannot mark delivered"));

        // Cannot deliver SHIPPED order if Shipment record missing
        purchaseOrder.setStatus(OrderStatus.SHIPPED);
        purchaseOrderRepository.save(purchaseOrder);

        IllegalStateException ex2 = assertThrows(IllegalStateException.class, () -> {
            purchaseOrderService.markOrderDeliveredSupplier(purchaseOrder.getId(), supplierAuth);
        });
        assertTrue(ex2.getMessage().contains("Shipment record not found"));
    }

    @Test
    public void testTransactionalRollbackDuringShipment() {
        purchaseOrder.setStatus(OrderStatus.PROCESSING);
        purchaseOrderRepository.save(purchaseOrder);

        // We use Mockito to force a failure during PO save
        doThrow(new RuntimeException("Simulated DB Failure"))
                .when(spyPurchaseOrderRepository).save(any(PurchaseOrder.class));

        assertThrows(RuntimeException.class, () -> {
            purchaseOrderService.shipSupplierOrder(purchaseOrder.getId(), "FedEx", "TRK-123", null, supplierAuth);
        });

        // Verify rollback: Shipment should not be saved
        assertTrue(shipmentRepository.findByPurchaseOrderId(purchaseOrder.getId()).isEmpty());

        // Verify PO remains PROCESSING
        PurchaseOrder fetched = purchaseOrderRepository.findById(purchaseOrder.getId()).orElseThrow();
        assertEquals(OrderStatus.PROCESSING, fetched.getStatus());
        
        Mockito.reset(spyPurchaseOrderRepository);
    }

    @Test
    public void testBuyerCannotPerformSupplierFulfillmentActions() {
        assertThrows(ResourceNotFoundException.class, () -> {
            purchaseOrderService.startProcessingSupplierOrder(purchaseOrder.getId(), buyerAuth);
        });

        purchaseOrder.setStatus(OrderStatus.PROCESSING);
        purchaseOrderRepository.save(purchaseOrder);

        assertThrows(ResourceNotFoundException.class, () -> {
            purchaseOrderService.shipSupplierOrder(purchaseOrder.getId(), "FedEx", "123", null, buyerAuth);
        });
        
        purchaseOrder.setStatus(OrderStatus.SHIPPED);
        purchaseOrderRepository.save(purchaseOrder);
        
        Shipment shipment = new Shipment();
        shipment.setPurchaseOrder(purchaseOrder);
        shipment.setCarrier("FedEx");
        shipment.setTrackingNumber("123");
        shipment.setShippedAt(LocalDateTime.now());
        shipmentRepository.save(shipment);

        assertThrows(ResourceNotFoundException.class, () -> {
            purchaseOrderService.markOrderDeliveredSupplier(purchaseOrder.getId(), buyerAuth);
        });
    }
}
