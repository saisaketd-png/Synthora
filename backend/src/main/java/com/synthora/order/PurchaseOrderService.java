package com.synthora.order;

import com.synthora.common.ResourceNotFoundException;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.order.dto.CreatePurchaseOrderRequest;
import com.synthora.order.dto.PurchaseOrderResponse;
import com.synthora.product.Product;
import com.synthora.product.ProductRepository;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.rfq.Rfq;
import com.synthora.rfq.RfqRepository;
import com.synthora.rfq.RfqStatus;
import com.synthora.rfq.quotation.Quotation;
import com.synthora.rfq.quotation.QuotationRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;

    public PurchaseOrderService(
            PurchaseOrderRepository purchaseOrderRepository,
            RfqRepository rfqRepository,
            QuotationRepository quotationRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            SupplierRepository supplierRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.rfqRepository = rfqRepository;
        this.quotationRepository = quotationRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.supplierRepository = supplierRepository;
    }

    public PurchaseOrderResponse createPurchaseOrder(
            CreatePurchaseOrderRequest request,
            Authentication authentication) {

        String email = authentication.getName();
        User buyer = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

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

        // Fetch product snapshot name
        String productName = productRepository.findById(rfq.getProductId())
                .map(Product::getName)
                .orElse("Chemical Product");

        // Calculate total amount = quantity * unitPrice
        BigDecimal totalAmount = rfq.getQuantity()
                .multiply(quotation.getUnitPrice())
                .setScale(4, RoundingMode.HALF_UP);

        // Generate PO Number
        Long seqVal = purchaseOrderRepository.getNextPoSequenceValue();
        String poNumber = String.format("PO-%d-%04d", Year.now().getValue(), seqVal);

        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber(poNumber);
        po.setRfqId(rfq.getId());
        po.setQuotationId(quotation.getId());
        po.setBuyerId(buyer.getId());
        po.setSupplierId(rfq.getSupplierId());
        po.setProductId(rfq.getProductId());
        po.setProductName(productName);
        po.setQuantity(rfq.getQuantity());
        po.setUnit(rfq.getUnit());
        po.setUnitPrice(quotation.getUnitPrice());
        po.setTotalAmount(totalAmount);
        po.setCurrency(quotation.getCurrency());
        po.setAgreedLeadTimeDays(quotation.getLeadTimeDays());
        po.setShippingAddress(request.shippingAddress().trim());
        po.setBillingContact(request.billingContact().trim());
        po.setNotes(request.notes() != null && !request.notes().isBlank() ? request.notes().trim() : null);
        po.setStatus(OrderStatus.PLACED);
        po.setPlacedAt(LocalDateTime.now());

        PurchaseOrder saved = purchaseOrderRepository.save(po);

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

        PurchaseOrder updated = purchaseOrderRepository.save(order);
        return mapToResponse(updated);
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
                po.getProductName(),
                po.getQuantity(),
                po.getUnit(),
                po.getUnitPrice(),
                po.getTotalAmount(),
                po.getCurrency(),
                po.getAgreedLeadTimeDays(),
                po.getShippingAddress(),
                po.getBillingContact(),
                po.getNotes(),
                po.getStatus(),
                po.getPlacedAt(),
                po.getConfirmedAt(),
                po.getCreatedAt(),
                po.getUpdatedAt()
        );
    }
}
