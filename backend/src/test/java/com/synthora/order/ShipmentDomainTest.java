package com.synthora.order;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
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
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class ShipmentDomainTest {

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

    private User buyer;
    private User supplierUser;
    private Supplier supplier;
    private Product product;
    private PurchaseOrder purchaseOrder;

    @BeforeEach
    public void setup() {
        shipmentRepository.deleteAll();
        purchaseOrderRepository.deleteAll();
        quotationRepository.deleteAll();
        rfqRepository.deleteAll();
        productRepository.deleteAll();
        supplierRepository.deleteAll();
        userRepository.deleteAll();

        buyer = new User();
        buyer.setEmail("buyer@synthora.com");
        buyer.setName("Buyer");
        buyer.setPasswordHash("hash123");
        buyer.setRole(UserRole.USER);
        buyer = userRepository.save(buyer);

        supplierUser = new User();
        supplierUser.setEmail("seller@synthora.com");
        supplierUser.setName("Seller");
        supplierUser.setPasswordHash("hash123");
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser = userRepository.save(supplierUser);

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
        rfq = rfqRepository.save(rfq);

        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber("PO-2026-0001");
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
    public void testShipmentPersistenceAndRelationship() {
        Shipment shipment = new Shipment();
        shipment.setPurchaseOrder(purchaseOrder);
        shipment.setCarrier("FedEx");
        shipment.setTrackingNumber("TRK123456789");
        shipment.setEstimatedDeliveryDate(LocalDate.now().plusDays(5));
        shipment.setShippedAt(LocalDateTime.now());

        Shipment saved = shipmentRepository.save(shipment);

        assertNotNull(saved.getId());
        assertNotNull(saved.getCreatedAt());
        assertNotNull(saved.getUpdatedAt());
        assertEquals("FedEx", saved.getCarrier());
        assertEquals("TRK123456789", saved.getTrackingNumber());
        assertEquals(purchaseOrder.getId(), saved.getPurchaseOrder().getId());

        Shipment fetched = shipmentRepository.findById(saved.getId()).orElse(null);
        assertNotNull(fetched);
        assertEquals("TRK123456789", fetched.getTrackingNumber());
    }

    @Test
    public void testOneShipmentPerOrderConstraint() {
        Shipment shipment1 = new Shipment();
        shipment1.setPurchaseOrder(purchaseOrder);
        shipment1.setCarrier("FedEx");
        shipment1.setTrackingNumber("TRK-1");
        shipment1.setShippedAt(LocalDateTime.now());
        shipmentRepository.saveAndFlush(shipment1);

        Shipment shipment2 = new Shipment();
        shipment2.setPurchaseOrder(purchaseOrder);
        shipment2.setCarrier("DHL");
        shipment2.setTrackingNumber("TRK-2");
        shipment2.setShippedAt(LocalDateTime.now());

        assertThrows(DataIntegrityViolationException.class, () -> {
            shipmentRepository.saveAndFlush(shipment2);
        });
    }

    @Test
    public void testNewOrderStatusesCanBePersisted() {
        purchaseOrder.setStatus(OrderStatus.PROCESSING);
        PurchaseOrder savedProcessing = purchaseOrderRepository.saveAndFlush(purchaseOrder);
        assertEquals(OrderStatus.PROCESSING, savedProcessing.getStatus());

        purchaseOrder.setStatus(OrderStatus.SHIPPED);
        PurchaseOrder savedShipped = purchaseOrderRepository.saveAndFlush(purchaseOrder);
        assertEquals(OrderStatus.SHIPPED, savedShipped.getStatus());

        purchaseOrder.setStatus(OrderStatus.DELIVERED);
        PurchaseOrder savedDelivered = purchaseOrderRepository.saveAndFlush(purchaseOrder);
        assertEquals(OrderStatus.DELIVERED, savedDelivered.getStatus());
    }
}
