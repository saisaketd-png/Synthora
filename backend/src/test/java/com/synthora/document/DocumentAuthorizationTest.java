package com.synthora.document;

import com.synthora.identity.User;
import com.synthora.order.PurchaseOrder;
import com.synthora.order.PurchaseOrderRepository;
import com.synthora.order.Shipment;
import com.synthora.order.ShipmentRepository;
import com.synthora.product.Product;
import com.synthora.product.ProductRepository;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.rfq.Rfq;
import com.synthora.rfq.RfqRepository;
import com.synthora.rfq.quotation.Quotation;
import com.synthora.rfq.quotation.QuotationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;
import java.util.UUID;
import org.springframework.test.util.ReflectionTestUtils;
import com.synthora.identity.UserRole;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

class DocumentAuthorizationTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private RfqRepository rfqRepository;
    @Mock
    private QuotationRepository quotationRepository;
    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;
    @Mock
    private ShipmentRepository shipmentRepository;
    @Mock
    private SupplierRepository supplierRepository;

    @InjectMocks
    private DocumentAuthorizationServiceImpl authorizationService;

    private User admin;
    private User buyerA;
    private User buyerB;
    private User supplierUserA;
    private User supplierUserB;

    private Supplier supplierA;
    private Supplier supplierB;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        admin = new User();
        ReflectionTestUtils.setField(admin, "id", UUID.randomUUID());
        admin.setRole(UserRole.ADMIN);

        buyerA = new User();
        ReflectionTestUtils.setField(buyerA, "id", UUID.randomUUID());
        buyerA.setRole(UserRole.USER); // Synthora might use USER for buyer

        buyerB = new User();
        ReflectionTestUtils.setField(buyerB, "id", UUID.randomUUID());
        buyerB.setRole(UserRole.USER);

        supplierUserA = new User();
        ReflectionTestUtils.setField(supplierUserA, "id", UUID.randomUUID());
        supplierUserA.setRole(UserRole.SUPPLIER);

        supplierUserB = new User();
        ReflectionTestUtils.setField(supplierUserB, "id", UUID.randomUUID());
        supplierUserB.setRole(UserRole.SUPPLIER);

        supplierA = new Supplier();
        ReflectionTestUtils.setField(supplierA, "id", 10L);
        supplierA.setUser(supplierUserA);

        supplierB = new Supplier();
        ReflectionTestUtils.setField(supplierB, "id", 20L);
        supplierB.setUser(supplierUserB);

        when(supplierRepository.findByUser(supplierUserA)).thenReturn(Optional.of(supplierA));
        when(supplierRepository.findByUser(supplierUserB)).thenReturn(Optional.of(supplierB));
    }

    @Test
    void testAdminCanAccessEverything() {
        assertTrue(authorizationService.canAccessDocument(DocumentOwnerType.PRODUCT, UUID.randomUUID(), admin));
        assertTrue(authorizationService.canAccessDocument(DocumentOwnerType.RFQ, UUID.randomUUID(), admin));
        assertTrue(authorizationService.canAccessDocument(DocumentOwnerType.QUOTATION, UUID.randomUUID(), admin));
        assertTrue(authorizationService.canAccessDocument(DocumentOwnerType.PURCHASE_ORDER, UUID.randomUUID(), admin));
        assertTrue(authorizationService.canAccessDocument(DocumentOwnerType.SHIPMENT, UUID.randomUUID(), admin));
    }

    @Test
    void testProductAuthorization() {
        UUID productId = UUID.randomUUID();
        Product product = new Product();
        ReflectionTestUtils.setField(product, "id", productId);
        product.setSeller(supplierUserA);

        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        assertTrue(authorizationService.canAccessDocument(DocumentOwnerType.PRODUCT, productId, supplierUserA));
        assertFalse(authorizationService.canAccessDocument(DocumentOwnerType.PRODUCT, productId, supplierUserB));
        assertFalse(authorizationService.canAccessDocument(DocumentOwnerType.PRODUCT, productId, buyerA));
    }

    @Test
    void testRfqAuthorization() {
        UUID rfqId = UUID.randomUUID();
        Rfq rfq = new Rfq();
        rfq.setId(rfqId);
        rfq.setBuyerId(buyerA.getId());
        rfq.setSupplierId(supplierA.getId());

        when(rfqRepository.findById(rfqId)).thenReturn(Optional.of(rfq));

        assertTrue(authorizationService.canAccessDocument(DocumentOwnerType.RFQ, rfqId, buyerA));
        assertTrue(authorizationService.canAccessDocument(DocumentOwnerType.RFQ, rfqId, supplierUserA));
        
        assertFalse(authorizationService.canAccessDocument(DocumentOwnerType.RFQ, rfqId, buyerB));
        assertFalse(authorizationService.canAccessDocument(DocumentOwnerType.RFQ, rfqId, supplierUserB));
    }

    @Test
    void testQuotationAuthorization() {
        UUID rfqId = UUID.randomUUID();
        Rfq rfq = new Rfq();
        rfq.setId(rfqId);
        rfq.setBuyerId(buyerA.getId());
        rfq.setSupplierId(supplierA.getId());

        UUID quoteId = UUID.randomUUID();
        Quotation quotation = new Quotation();
        quotation.setId(quoteId);
        quotation.setRfq(rfq);

        when(quotationRepository.findById(quoteId)).thenReturn(Optional.of(quotation));
        when(rfqRepository.findById(rfqId)).thenReturn(Optional.of(rfq));

        assertTrue(authorizationService.canAccessDocument(DocumentOwnerType.QUOTATION, quoteId, buyerA));
        assertTrue(authorizationService.canAccessDocument(DocumentOwnerType.QUOTATION, quoteId, supplierUserA));
        
        assertFalse(authorizationService.canAccessDocument(DocumentOwnerType.QUOTATION, quoteId, buyerB));
        assertFalse(authorizationService.canAccessDocument(DocumentOwnerType.QUOTATION, quoteId, supplierUserB));
    }

    @Test
    void testPurchaseOrderAuthorization() {
        UUID poId = UUID.randomUUID();
        PurchaseOrder po = new PurchaseOrder();
        po.setId(poId);
        po.setBuyerId(buyerA.getId());
        po.setSupplierId(supplierA.getId());

        when(purchaseOrderRepository.findById(poId)).thenReturn(Optional.of(po));

        assertTrue(authorizationService.canAccessDocument(DocumentOwnerType.PURCHASE_ORDER, poId, buyerA));
        assertTrue(authorizationService.canAccessDocument(DocumentOwnerType.PURCHASE_ORDER, poId, supplierUserA));
        
        assertFalse(authorizationService.canAccessDocument(DocumentOwnerType.PURCHASE_ORDER, poId, buyerB));
        assertFalse(authorizationService.canAccessDocument(DocumentOwnerType.PURCHASE_ORDER, poId, supplierUserB));
    }

    @Test
    void testShipmentAuthorization() {
        UUID poId = UUID.randomUUID();
        PurchaseOrder po = new PurchaseOrder();
        po.setId(poId);
        po.setBuyerId(buyerA.getId());
        po.setSupplierId(supplierA.getId());

        UUID shipmentId = UUID.randomUUID();
        Shipment shipment = new Shipment();
        shipment.setId(shipmentId);
        shipment.setPurchaseOrder(po);

        when(purchaseOrderRepository.findById(poId)).thenReturn(Optional.of(po));
        when(shipmentRepository.findById(shipmentId)).thenReturn(Optional.of(shipment));

        assertTrue(authorizationService.canAccessDocument(DocumentOwnerType.SHIPMENT, shipmentId, buyerA));
        assertTrue(authorizationService.canAccessDocument(DocumentOwnerType.SHIPMENT, shipmentId, supplierUserA));
        
        assertFalse(authorizationService.canAccessDocument(DocumentOwnerType.SHIPMENT, shipmentId, buyerB));
        assertFalse(authorizationService.canAccessDocument(DocumentOwnerType.SHIPMENT, shipmentId, supplierUserB));
    }
}
