package com.kemkendra.order;

import com.kemkendra.common.ResourceNotFoundException;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.order.dto.CancelPurchaseOrderRequest;
import com.kemkendra.order.dto.CreatePurchaseOrderRequest;
import com.kemkendra.order.dto.PurchaseOrderResponse;
import com.kemkendra.order.dto.RejectPurchaseOrderRequest;
import com.kemkendra.order.dto.ShipmentResponse;
import com.kemkendra.product.*;
import com.kemkendra.rfq.Rfq;
import com.kemkendra.rfq.RfqRepository;
import com.kemkendra.rfq.RfqStatus;
import com.kemkendra.rfq.quotation.Quotation;
import com.kemkendra.rfq.quotation.QuotationRepository;
import com.kemkendra.notification.events.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final RfqRepository rfqRepository;
    private final QuotationRepository quotationRepository;
    private final ProductRepository productRepository;
    private final MasterProductRepository masterProductRepository;
    private final SupplierOfferingRepository supplierOfferingRepository;
    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;
    private final ShipmentRepository shipmentRepository;
    private final ApplicationEventPublisher eventPublisher;

    public PurchaseOrderService(
            PurchaseOrderRepository purchaseOrderRepository,
            RfqRepository rfqRepository,
            QuotationRepository quotationRepository,
            ProductRepository productRepository,
            MasterProductRepository masterProductRepository,
            SupplierOfferingRepository supplierOfferingRepository,
            UserRepository userRepository,
            SupplierRepository supplierRepository,
            ShipmentRepository shipmentRepository,
            ApplicationEventPublisher eventPublisher) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.rfqRepository = rfqRepository;
        this.quotationRepository = quotationRepository;
        this.productRepository = productRepository;
        this.masterProductRepository = masterProductRepository;
        this.supplierOfferingRepository = supplierOfferingRepository;
        this.userRepository = userRepository;
        this.supplierRepository = supplierRepository;
        this.shipmentRepository = shipmentRepository;
        this.eventPublisher = eventPublisher;
    }

    public PurchaseOrderResponse createPurchaseOrder(
            CreatePurchaseOrderRequest request,
            Authentication authentication) {

        String email = authentication.getName();
        User buyer = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (buyer.getStatus() != null && buyer.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalStateException("Buyer account is not active");
        }

        // Pessimistically lock RFQ
        Rfq rfq = rfqRepository.findByIdAndBuyerIdForUpdate(request.rfqId(), buyer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found"));

        // Precondition 1: RFQ must be in ACCEPTED status
        if (rfq.getStatus() != RfqStatus.ACCEPTED) {
            throw new IllegalStateException("Cannot issue purchase order for RFQ in status: " + rfq.getStatus());
        }

        // Precondition 2: RFQ must have accepted quotation id
        if (rfq.getAcceptedQuotationId() == null) {
            throw new IllegalStateException("RFQ does not have an accepted quotation");
        }

        // Precondition 3: Duplicate PO guard
        if (purchaseOrderRepository.existsByRfqId(rfq.getId())) {
            throw new IllegalStateException("Purchase order already issued for this RFQ");
        }

        // Fetch accepted quotation snapshot
        Quotation quotation = quotationRepository.findByIdAndRfqId(rfq.getAcceptedQuotationId(), rfq.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Accepted quotation not found for this RFQ"));

        // Precondition 4: Quotation validity check
        if (quotation.getValidityDate() != null && quotation.getValidityDate().isBefore(LocalDate.now())) {
            throw new IllegalStateException("Cannot create purchase order from an expired quotation. Validity expired on: " + quotation.getValidityDate());
        }

        // Verify supplier is active
        Supplier supplier = supplierRepository.findById(rfq.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
        if (supplier.getUser() != null && supplier.getUser().getStatus() != null && supplier.getUser().getStatus() != UserStatus.ACTIVE) {
            throw new IllegalStateException("Supplier account is not active");
        }

        // Resolve chemical & offering snapshots
        UUID masterProductId = rfq.getMasterProductId();
        String masterProductCode = null;
        String productName = "Chemical Product";
        BigDecimal purity = null;
        String grade = null;
        String packaging = quotation.getPackagingDetails();

        if (masterProductId != null) {
            MasterProduct mp = masterProductRepository.findById(masterProductId).orElse(null);
            if (mp != null) {
                masterProductCode = mp.getMasterProductCode();
                productName = mp.getName();
            }
        }

        if (rfq.getSupplierOfferingId() != null) {
            SupplierOffering offering = supplierOfferingRepository.findById(rfq.getSupplierOfferingId()).orElse(null);
            if (offering != null) {
                purity = offering.getPurity();
                grade = offering.getGrade();
                if (packaging == null) {
                    packaging = offering.getPackaging();
                }
                if (masterProductId == null && offering.getMasterProduct() != null) {
                    masterProductId = offering.getMasterProduct().getId();
                    masterProductCode = offering.getMasterProduct().getMasterProductCode();
                    productName = offering.getMasterProduct().getName();
                }
            }
        }

        if (productName.equals("Chemical Product") && rfq.getProductId() != null) {
            productName = productRepository.findById(rfq.getProductId())
                    .map(Product::getName)
                    .orElse("Chemical Product");
        }

        // Calculate total amount = quantity * unitPrice
        BigDecimal totalAmount = rfq.getQuantity()
                .multiply(quotation.getUnitPrice())
                .setScale(4, RoundingMode.HALF_UP);

        // Generate Human-Readable PO Number
        Long seqVal = purchaseOrderRepository.getNextPoSequenceValue();
        String poNumber = String.format("PO-%d-%06d", Year.now().getValue(), seqVal);

        // Derive Human-Readable Traceability References
        int rfqYear = rfq.getCreatedAt() != null ? rfq.getCreatedAt().getYear() : Year.now().getValue();
        String rfqRef = String.format("RFQ-%d-%s", rfqYear, rfq.getId().toString().substring(0, 8).toUpperCase());
        int quoteYear = quotation.getCreatedAt() != null ? quotation.getCreatedAt().getYear() : Year.now().getValue();
        String quoteRef = String.format("QT-%d-%s-V%d", quoteYear, quotation.getId().toString().substring(0, 8).toUpperCase(), quotation.getQuotationVersion());

        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber(poNumber);
        po.setRfqId(rfq.getId());
        po.setQuotationId(quotation.getId());
        po.setBuyerId(buyer.getId());
        po.setSupplierId(rfq.getSupplierId());
        po.setProductId(rfq.getProductId());
        po.setMasterProductId(masterProductId);
        po.setMasterProductCode(masterProductCode);
        po.setSupplierOfferingId(rfq.getSupplierOfferingId());
        po.setRfqReference(rfqRef);
        po.setQuotationReference(quoteRef);
        po.setQuotationVersion(quotation.getQuotationVersion());
        po.setProductName(productName);
        po.setPurity(purity);
        po.setGrade(grade);
        po.setPackaging(packaging);
        po.setQuantity(rfq.getQuantity());
        po.setUnit(rfq.getUnit());
        po.setUnitPrice(quotation.getUnitPrice());
        po.setTotalAmount(totalAmount);
        po.setCurrency(quotation.getCurrency());
        po.setAgreedLeadTimeDays(quotation.getLeadTimeDays());
        po.setPaymentTerms(request.paymentTerms() != null && !request.paymentTerms().isBlank() ? request.paymentTerms().trim() : "Standard Terms");
        po.setDeliveryTerms(request.deliveryTerms() != null && !request.deliveryTerms().isBlank() ? request.deliveryTerms().trim() : "Standard Delivery");
        po.setIncoterms(request.incoterms() != null && !request.incoterms().isBlank() ? request.incoterms().trim() : null);
        po.setShippingAddress(request.shippingAddress().trim());
        po.setBillingContact(request.billingContact().trim());
        po.setNotes(request.notes() != null && !request.notes().isBlank() ? request.notes().trim() : quotation.getCommercialNotes());
        po.setStatus(OrderStatus.PLACED);
        po.setPlacedAt(LocalDateTime.now());

        PurchaseOrder saved = purchaseOrderRepository.save(po);

        eventPublisher.publishEvent(new PurchaseOrderIssuedEvent(
                saved.getId(),
                saved.getBuyerId(),
                saved.getSupplierId()
        ));

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> getBuyerOrders(Authentication authentication) {
        String email = authentication.getName();
        User buyer = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return purchaseOrderRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PurchaseOrderResponse getBuyerOrder(UUID orderId, Authentication authentication) {
        String email = authentication.getName();
        User buyer = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        PurchaseOrder order = purchaseOrderRepository.findByIdAndBuyerId(orderId, buyer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        return mapToResponse(order);
    }

    public PurchaseOrderResponse cancelBuyerOrder(UUID orderId, CancelPurchaseOrderRequest request, Authentication authentication) {
        if (request == null || request.reason() == null || request.reason().trim().length() < 5) {
            throw new IllegalArgumentException("Cancellation reason must be at least 5 characters");
        }

        String email = authentication.getName();
        User buyer = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        PurchaseOrder order = purchaseOrderRepository.findByIdAndBuyerId(orderId, buyer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.PLACED && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new IllegalStateException("Cannot cancel order in status: " + order.getStatus() + ". Cancellation is only permitted prior to active fulfillment.");
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());
        order.setCancelledBy(buyer.getEmail());
        order.setCancellationReason(request.reason().trim());

        PurchaseOrder updated = purchaseOrderRepository.save(order);

        eventPublisher.publishEvent(new PurchaseOrderCancelledEvent(
                updated.getId(),
                updated.getBuyerId(),
                updated.getSupplierId(),
                updated.getCancellationReason()
        ));

        return mapToResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> getSupplierOrders(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Supplier supplier = supplierRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier profile not found"));

        return purchaseOrderRepository.findBySupplierIdOrderByCreatedAtDesc(supplier.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PurchaseOrderResponse getSupplierOrder(UUID orderId, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Supplier supplier = supplierRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier profile not found"));

        PurchaseOrder order = purchaseOrderRepository.findByIdAndSupplierId(orderId, supplier.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        return mapToResponse(order);
    }

    public PurchaseOrderResponse confirmSupplierOrder(UUID orderId, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Supplier supplier = supplierRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier profile not found"));

        PurchaseOrder order = purchaseOrderRepository.findByIdAndSupplierId(orderId, supplier.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.PLACED) {
            throw new IllegalStateException("Cannot confirm order in status: " + order.getStatus());
        }

        order.setStatus(OrderStatus.CONFIRMED);
        order.setConfirmedAt(LocalDateTime.now());
        order.setConfirmedBy(user.getEmail());

        PurchaseOrder updated = purchaseOrderRepository.save(order);

        eventPublisher.publishEvent(new PurchaseOrderConfirmedEvent(
                updated.getId(),
                updated.getBuyerId(),
                updated.getSupplierId()
        ));

        return mapToResponse(updated);
    }

    public PurchaseOrderResponse startProcessingSupplierOrder(UUID orderId, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Supplier supplier = supplierRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier profile not found"));

        PurchaseOrder order = purchaseOrderRepository.findByIdAndSupplierId(orderId, supplier.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw new IllegalStateException("Cannot start processing order in status: " + order.getStatus());
        }

        order.setStatus(OrderStatus.PROCESSING);
        order.setProcessingAt(LocalDateTime.now());
        PurchaseOrder updated = purchaseOrderRepository.save(order);

        eventPublisher.publishEvent(new OrderProcessingStartedEvent(
                updated.getId(),
                updated.getBuyerId(),
                updated.getSupplierId()
        ));

        return mapToResponse(updated);
    }

    public PurchaseOrderResponse rejectSupplierOrder(UUID orderId, RejectPurchaseOrderRequest request, Authentication authentication) {
        if (request == null || request.reason() == null || request.reason().trim().length() < 5) {
            throw new IllegalArgumentException("Rejection reason must be at least 5 characters");
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Supplier supplier = supplierRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier profile not found"));

        PurchaseOrder order = purchaseOrderRepository.findByIdAndSupplierId(orderId, supplier.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.PLACED && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new IllegalStateException("Cannot reject order in status: " + order.getStatus() + ". Rejection is only allowed prior to fulfillment.");
        }

        order.setStatus(OrderStatus.REJECTED);
        order.setRejectedAt(LocalDateTime.now());
        order.setRejectedBy(user.getEmail());
        order.setRejectionReason(request.reason().trim());

        PurchaseOrder updated = purchaseOrderRepository.save(order);

        eventPublisher.publishEvent(new PurchaseOrderRejectedEvent(
                updated.getId(),
                updated.getBuyerId(),
                updated.getSupplierId(),
                updated.getRejectionReason()
        ));

        return mapToResponse(updated);
    }

    public PurchaseOrderResponse shipSupplierOrder(UUID orderId, String carrier, String trackingNumber, LocalDate estimatedDeliveryDate, Authentication authentication) {
        if (carrier == null || carrier.isBlank()) {
            throw new IllegalArgumentException("Carrier must not be blank");
        }
        if (trackingNumber == null || trackingNumber.isBlank()) {
            throw new IllegalArgumentException("Tracking number must not be blank");
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Supplier supplier = supplierRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier profile not found"));

        PurchaseOrder order = purchaseOrderRepository.findByIdAndSupplierId(orderId, supplier.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.PROCESSING) {
            throw new IllegalStateException("Cannot ship order in status: " + order.getStatus());
        }

        if (shipmentRepository.findByPurchaseOrderId(orderId).isPresent()) {
            throw new IllegalStateException("A shipment already exists for this order");
        }

        LocalDateTime shippedTime = LocalDateTime.now();
        Shipment shipment = new Shipment();
        shipment.setPurchaseOrder(order);
        shipment.setCarrier(carrier.trim());
        shipment.setTrackingNumber(trackingNumber.trim());
        shipment.setEstimatedDeliveryDate(estimatedDeliveryDate);
        shipment.setShippedAt(shippedTime);
        Shipment savedShipment = shipmentRepository.save(shipment);

        order.setStatus(OrderStatus.SHIPPED);
        order.setShippedAt(shippedTime);
        PurchaseOrder updated = purchaseOrderRepository.save(order);

        eventPublisher.publishEvent(new OrderShippedEvent(
                updated.getId(),
                updated.getBuyerId(),
                updated.getSupplierId(),
                savedShipment.getId()
        ));

        return mapToResponse(updated);
    }

    public PurchaseOrderResponse confirmReceiptBuyerOrder(UUID orderId, Authentication authentication) {
        String email = authentication.getName();
        User buyer = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        PurchaseOrder order = purchaseOrderRepository.findByIdAndBuyerId(orderId, buyer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.SHIPPED) {
            throw new IllegalStateException("Cannot confirm receipt for order in status: " + order.getStatus() + ". Order must be SHIPPED.");
        }

        order.setStatus(OrderStatus.DELIVERED);
        order.setDeliveredAt(LocalDateTime.now());
        PurchaseOrder updated = purchaseOrderRepository.save(order);

        eventPublisher.publishEvent(new OrderReceiptConfirmedEvent(
                updated.getId(),
                updated.getBuyerId(),
                updated.getSupplierId()
        ));

        return mapToResponse(updated);
    }

    public PurchaseOrderResponse markOrderDeliveredSupplier(UUID orderId, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Supplier supplier = supplierRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier profile not found"));

        PurchaseOrder order = purchaseOrderRepository.findByIdAndSupplierId(orderId, supplier.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.SHIPPED) {
            throw new IllegalStateException("Cannot mark delivered order in status: " + order.getStatus());
        }

        if (shipmentRepository.findByPurchaseOrderId(orderId).isEmpty()) {
            throw new IllegalStateException("Cannot mark delivered: Shipment record not found for this order");
        }

        order.setStatus(OrderStatus.DELIVERED);
        order.setDeliveredAt(LocalDateTime.now());
        PurchaseOrder updated = purchaseOrderRepository.save(order);

        eventPublisher.publishEvent(new OrderDeliveredEvent(
                updated.getId(),
                updated.getBuyerId(),
                updated.getSupplierId()
        ));

        return mapToResponse(updated);
    }

    public PurchaseOrderResponse completeOrder(UUID orderId, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        PurchaseOrder order = purchaseOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        Supplier supplier = supplierRepository.findByUser(user).orElse(null);
        boolean isBuyer = order.getBuyerId().equals(user.getId());
        boolean isSupplier = supplier != null && order.getSupplierId().equals(supplier.getId());

        if (!isBuyer && !isSupplier) {
            throw new ResourceNotFoundException("Order not found");
        }

        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new IllegalStateException("Cannot complete order in status: " + order.getStatus() + ". Order must be DELIVERED first.");
        }

        order.setStatus(OrderStatus.COMPLETED);
        order.setCompletedAt(LocalDateTime.now());
        PurchaseOrder updated = purchaseOrderRepository.save(order);

        eventPublisher.publishEvent(new OrderCompletedEvent(
                updated.getId(),
                updated.getBuyerId(),
                updated.getSupplierId()
        ));

        return mapToResponse(updated);
    }

    @Transactional(readOnly = true)
    public ShipmentResponse getShipment(UUID orderId, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        PurchaseOrder order = purchaseOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        Supplier supplier = supplierRepository.findByUser(user).orElse(null);
        boolean isBuyer = order.getBuyerId().equals(user.getId());
        boolean isSupplier = supplier != null && order.getSupplierId().equals(supplier.getId());

        if (!isBuyer && !isSupplier) {
            throw new ResourceNotFoundException("Order not found");
        }

        Shipment shipment = shipmentRepository.findByPurchaseOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found for this order"));

        return new ShipmentResponse(
                shipment.getId(),
                shipment.getCarrier(),
                shipment.getTrackingNumber(),
                shipment.getEstimatedDeliveryDate(),
                shipment.getShippedAt()
        );
    }

    @Transactional(readOnly = true)
    public PurchaseOrderResponse getOrderByRfqId(UUID rfqId, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        PurchaseOrder order = purchaseOrderRepository.findByRfqId(rfqId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found for RFQ"));

        // Verify authorization: must be either the buyer or the assigned supplier
        Supplier supplier = supplierRepository.findByUser(user).orElse(null);
        boolean isBuyer = order.getBuyerId().equals(user.getId());
        boolean isSupplier = supplier != null && order.getSupplierId().equals(supplier.getId());

        if (!isBuyer && !isSupplier) {
            throw new ResourceNotFoundException("Order not found for RFQ");
        }

        return mapToResponse(order);
    }

    private PurchaseOrderResponse mapToResponse(PurchaseOrder po) {
        return new PurchaseOrderResponse(
                po.getId(),
                po.getPoNumber(),
                po.getRfqId(),
                po.getQuotationId(),
                po.getBuyerId(),
                po.getSupplierId(),
                po.getProductId(),
                po.getMasterProductId(),
                po.getMasterProductCode(),
                po.getSupplierOfferingId(),
                po.getRfqReference(),
                po.getQuotationReference(),
                po.getQuotationVersion(),
                po.getProductName(),
                po.getPurity(),
                po.getGrade(),
                po.getPackaging(),
                po.getQuantity(),
                po.getUnit(),
                po.getUnitPrice(),
                po.getTotalAmount(),
                po.getCurrency(),
                po.getAgreedLeadTimeDays(),
                po.getPaymentTerms(),
                po.getDeliveryTerms(),
                po.getIncoterms(),
                po.getShippingAddress(),
                po.getBillingContact(),
                po.getNotes(),
                po.getStatus(),
                po.getPlacedAt(),
                po.getConfirmedAt(),
                po.getConfirmedBy(),
                po.getProcessingAt(),
                po.getShippedAt(),
                po.getDeliveredAt(),
                po.getCompletedAt(),
                po.getRejectedAt(),
                po.getRejectedBy(),
                po.getRejectionReason(),
                po.getCancelledAt(),
                po.getCancelledBy(),
                po.getCancellationReason(),
                po.getCreatedAt(),
                po.getUpdatedAt()
        );
    }
}
