package com.kemkendra.admin.transaction;

import com.kemkendra.admin.audit.AuditAction;
import com.kemkendra.admin.audit.AuditService;
import com.kemkendra.admin.audit.AuditTargetType;
import com.kemkendra.admin.transaction.dto.*;
import com.kemkendra.common.ResourceNotFoundException;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.order.OrderStatus;
import com.kemkendra.order.PurchaseOrder;
import com.kemkendra.order.PurchaseOrderRepository;
import com.kemkendra.order.Shipment;
import com.kemkendra.order.ShipmentRepository;
import com.kemkendra.product.MasterProduct;
import com.kemkendra.product.MasterProductRepository;
import com.kemkendra.product.Product;
import com.kemkendra.product.ProductRepository;
import com.kemkendra.product.Supplier;
import com.kemkendra.product.SupplierOffering;
import com.kemkendra.product.SupplierOfferingRepository;
import com.kemkendra.product.SupplierRepository;
import com.kemkendra.rfq.Rfq;
import com.kemkendra.rfq.RfqRepository;
import com.kemkendra.rfq.RfqStatus;
import com.kemkendra.rfq.quotation.Quotation;
import com.kemkendra.rfq.quotation.QuotationRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service providing administrative transaction oversight across RFQs, Quotations,
 * Purchase Orders, and Shipments.
 */
@Service
@Transactional
public class AdminTransactionService {

    private final RfqRepository rfqRepository;
    private final QuotationRepository quotationRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final MasterProductRepository masterProductRepository;
    private final SupplierOfferingRepository supplierOfferingRepository;
    private final AuditService auditService;

    public AdminTransactionService(
            RfqRepository rfqRepository,
            QuotationRepository quotationRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            ShipmentRepository shipmentRepository,
            UserRepository userRepository,
            SupplierRepository supplierRepository,
            ProductRepository productRepository,
            MasterProductRepository masterProductRepository,
            SupplierOfferingRepository supplierOfferingRepository,
            AuditService auditService) {
        this.rfqRepository = rfqRepository;
        this.quotationRepository = quotationRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.shipmentRepository = shipmentRepository;
        this.userRepository = userRepository;
        this.supplierRepository = supplierRepository;
        this.productRepository = productRepository;
        this.masterProductRepository = masterProductRepository;
        this.supplierOfferingRepository = supplierOfferingRepository;
        this.auditService = auditService;
    }

    /**
     * Paginated RFQ search and filtering for administrators.
     */
    @Transactional(readOnly = true)
    public Page<AdminRfqResponse> getRfqs(
            int page,
            int size,
            RfqStatus status,
            UUID buyerId,
            Long supplierId,
            UUID productId,
            String query) {

        int boundedPage = Math.max(0, page);
        int boundedSize = Math.min(Math.max(1, size), 100);

        Pageable pageable = PageRequest.of(
                boundedPage,
                boundedSize,
                Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id"))
        );

        Specification<Rfq> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (buyerId != null) {
                predicates.add(cb.equal(root.get("buyerId"), buyerId));
            }
            if (supplierId != null) {
                predicates.add(cb.equal(root.get("supplierId"), supplierId));
            }
            if (productId != null) {
                predicates.add(cb.or(
                        cb.equal(root.get("productId"), productId),
                        cb.equal(root.get("masterProductId"), productId),
                        cb.equal(root.get("supplierOfferingId"), productId)
                ));
            }
            if (query != null && !query.trim().isEmpty()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                Predicate msgMatch = cb.like(cb.lower(root.get("message")), pattern);
                Predicate unitMatch = cb.like(cb.lower(root.get("unit")), pattern);
                Predicate refMatch = cb.like(cb.lower(root.get("sourcingRequestReference")), pattern);
                predicates.add(cb.or(msgMatch, unitMatch, refMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return rfqRepository.findAll(spec, pageable).map(this::toRfqResponse);
    }

    /**
     * Detailed RFQ inspection with complete quotation revision history.
     */
    @Transactional(readOnly = true)
    public AdminRfqDetailResponse getRfqDetail(UUID id) {
        Rfq rfq = rfqRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found: " + id));

        List<AdminQuotationSummary> quotations = quotationRepository.findByRfqIdOrderByQuotationVersionDesc(id)
                .stream()
                .map(this::toQuotationSummary)
                .toList();

        String buyerName = rfq.getBuyerId() != null
                ? userRepository.findById(rfq.getBuyerId()).map(User::getName).orElse(null)
                : null;
        String buyerEmail = rfq.getBuyerId() != null
                ? userRepository.findById(rfq.getBuyerId()).map(User::getEmail).orElse(null)
                : null;
        String supplierName = rfq.getSupplierId() != null
                ? supplierRepository.findById(rfq.getSupplierId()).map(Supplier::getName).orElse(null)
                : null;
        String productName = resolveProductName(rfq);

        UUID effectiveProductId = rfq.getMasterProductId() != null
                ? rfq.getMasterProductId()
                : (rfq.getProductId() != null ? rfq.getProductId() : rfq.getSupplierOfferingId());

        return new AdminRfqDetailResponse(
                rfq.getId(),
                rfq.getBuyerId(),
                buyerName,
                buyerEmail,
                effectiveProductId,
                productName,
                rfq.getSupplierId(),
                supplierName,
                rfq.getQuantity(),
                rfq.getUnit(),
                rfq.getMessage(),
                rfq.getStatus(),
                rfq.getAcceptedQuotationId(),
                rfq.getCreatedAt(),
                rfq.getUpdatedAt(),
                quotations
        );
    }

    /**
     * Moderates RFQ status to a terminal state (CLOSED or CANCELLED) and logs an audit record.
     */
    public AdminRfqResponse updateRfqStatus(
            UUID id,
            UpdateAdminRfqStatusRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        resolveAdminActor(authentication);

        if (request.status() != RfqStatus.CLOSED && request.status() != RfqStatus.CANCELLED) {
            throw new IllegalArgumentException("Invalid administrative RFQ status transition: only CLOSED and CANCELLED are supported");
        }

        Rfq rfq = rfqRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found: " + id));

        if (rfq.getStatus() == request.status()) {
            throw new IllegalArgumentException("RFQ is already in status " + request.status());
        }

        if (rfq.getStatus() == RfqStatus.ACCEPTED) {
            if (purchaseOrderRepository.existsByRfqId(id)) {
                throw new IllegalStateException("Cannot close or cancel an ACCEPTED RFQ that already has an issued Purchase Order");
            }
        }

        RfqStatus oldStatus = rfq.getStatus();
        rfq.setStatus(request.status());
        Rfq saved = rfqRepository.save(rfq);

        String details = "RFQ status changed from " + oldStatus + " to " + request.status()
                + ((request.reason() != null && !request.reason().trim().isEmpty()) ? (": " + request.reason().trim()) : "");

        auditService.record(
                authentication,
                AuditAction.RFQ_STATUS_CHANGED,
                AuditTargetType.RFQ,
                id.toString(),
                details,
                servletRequest
        );

        return toRfqResponse(saved);
    }

    /**
     * Paginated Purchase Order search and filtering for administrators.
     */
    @Transactional(readOnly = true)
    public Page<AdminPurchaseOrderResponse> getOrders(
            int page,
            int size,
            OrderStatus status,
            UUID buyerId,
            Long supplierId,
            UUID productId,
            String poNumber,
            String query) {

        int boundedPage = Math.max(0, page);
        int boundedSize = Math.min(Math.max(1, size), 100);

        Pageable pageable = PageRequest.of(
                boundedPage,
                boundedSize,
                Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id"))
        );

        Specification<PurchaseOrder> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (buyerId != null) {
                predicates.add(cb.equal(root.get("buyerId"), buyerId));
            }
            if (supplierId != null) {
                predicates.add(cb.equal(root.get("supplierId"), supplierId));
            }
            if (productId != null) {
                predicates.add(cb.equal(root.get("productId"), productId));
            }
            if (poNumber != null && !poNumber.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("poNumber")), "%" + poNumber.trim().toLowerCase() + "%"));
            }
            if (query != null && !query.trim().isEmpty()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                Predicate poMatch = cb.like(cb.lower(root.get("poNumber")), pattern);
                Predicate productMatch = cb.like(cb.lower(root.get("productName")), pattern);
                Predicate notesMatch = cb.like(cb.lower(root.get("notes")), pattern);
                predicates.add(cb.or(poMatch, productMatch, notesMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return purchaseOrderRepository.findAll(spec, pageable).map(this::toOrderResponse);
    }

    /**
     * Detailed Purchase Order inspection including shipment tracking details.
     */
    @Transactional(readOnly = true)
    public AdminPurchaseOrderDetailResponse getOrderDetail(UUID id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found: " + id));

        AdminShipmentSummary shipmentSummary = shipmentRepository.findByPurchaseOrderId(id)
                .map(this::toShipmentSummary)
                .orElse(null);

        String buyerName = po.getBuyerId() != null
                ? userRepository.findById(po.getBuyerId()).map(User::getName).orElse(null)
                : null;
        String buyerEmail = po.getBuyerId() != null
                ? userRepository.findById(po.getBuyerId()).map(User::getEmail).orElse(null)
                : null;
        String supplierName = po.getSupplierId() != null
                ? supplierRepository.findById(po.getSupplierId()).map(Supplier::getName).orElse(null)
                : null;

        return new AdminPurchaseOrderDetailResponse(
                po.getId(),
                po.getPoNumber(),
                po.getRfqId(),
                po.getQuotationId(),
                po.getBuyerId(),
                buyerName,
                buyerEmail,
                po.getSupplierId(),
                supplierName,
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
                po.getUpdatedAt(),
                shipmentSummary
        );
    }

    /**
     * Administratively cancels a Purchase Order if not yet SHIPPED or DELIVERED.
     */
    public AdminPurchaseOrderResponse cancelOrder(
            UUID id,
            CancelAdminPurchaseOrderRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        resolveAdminActor(authentication);

        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found: " + id));

        if (po.getStatus() == OrderStatus.SHIPPED || po.getStatus() == OrderStatus.DELIVERED) {
            throw new IllegalStateException("Cannot cancel order in status: " + po.getStatus() + ". Shipped or delivered orders cannot be cancelled.");
        }

        if (po.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Purchase order is already cancelled");
        }

        OrderStatus oldStatus = po.getStatus();
        po.setStatus(OrderStatus.CANCELLED);
        PurchaseOrder saved = purchaseOrderRepository.save(po);

        String details = "Order cancelled from " + oldStatus + " to CANCELLED: " + request.reason().trim();

        auditService.record(
                authentication,
                AuditAction.ORDER_CANCELLED,
                AuditTargetType.PURCHASE_ORDER,
                id.toString(),
                details,
                servletRequest
        );

        return toOrderResponse(saved);
    }

    private User resolveAdminActor(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication required for administrative operations");
        }

        String email = authentication.getName();
        User admin = userRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Authenticated administrator not found: " + email));

        if (admin.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only users with role ADMIN can perform transaction oversight");
        }

        return admin;
    }

    private String resolveProductName(Rfq rfq) {
        if (rfq.getMasterProductId() != null) {
            Optional<MasterProduct> mp = masterProductRepository.findById(rfq.getMasterProductId());
            if (mp.isPresent()) {
                return mp.get().getName();
            }
        }
        if (rfq.getSupplierOfferingId() != null) {
            Optional<SupplierOffering> offering = supplierOfferingRepository.findById(rfq.getSupplierOfferingId());
            if (offering.isPresent()) {
                if (offering.get().getMasterProduct() != null) {
                    return offering.get().getMasterProduct().getName();
                }
            }
        }
        if (rfq.getProductId() != null) {
            Optional<Product> prod = productRepository.findById(rfq.getProductId());
            if (prod.isPresent()) {
                return prod.get().getName();
            }
        }
        return "Specialty Chemical Compound";
    }

    private AdminRfqResponse toRfqResponse(Rfq rfq) {
        String buyerName = rfq.getBuyerId() != null
                ? userRepository.findById(rfq.getBuyerId()).map(User::getName).orElse(null)
                : null;
        String buyerEmail = rfq.getBuyerId() != null
                ? userRepository.findById(rfq.getBuyerId()).map(User::getEmail).orElse(null)
                : null;
        String supplierName = rfq.getSupplierId() != null
                ? supplierRepository.findById(rfq.getSupplierId()).map(Supplier::getName).orElse(null)
                : null;
        String productName = resolveProductName(rfq);

        UUID effectiveProductId = rfq.getMasterProductId() != null
                ? rfq.getMasterProductId()
                : (rfq.getProductId() != null ? rfq.getProductId() : rfq.getSupplierOfferingId());

        return new AdminRfqResponse(
                rfq.getId(),
                rfq.getBuyerId(),
                buyerName,
                buyerEmail,
                effectiveProductId,
                productName,
                rfq.getSupplierId(),
                supplierName,
                rfq.getQuantity(),
                rfq.getUnit(),
                rfq.getMessage(),
                rfq.getStatus(),
                rfq.getAcceptedQuotationId(),
                rfq.getCreatedAt(),
                rfq.getUpdatedAt()
        );
    }

    private AdminQuotationSummary toQuotationSummary(Quotation q) {
        return new AdminQuotationSummary(
                q.getId(),
                q.getQuotationVersion(),
                q.getUnitPrice(),
                q.getCurrency(),
                q.getMinimumOrderQuantity(),
                q.getLeadTimeDays(),
                q.getValidityDate(),
                q.getPackagingDetails(),
                q.getCommercialNotes(),
                q.getCreatedAt()
        );
    }

    private AdminPurchaseOrderResponse toOrderResponse(PurchaseOrder po) {
        String buyerName = po.getBuyerId() != null
                ? userRepository.findById(po.getBuyerId()).map(User::getName).orElse(null)
                : null;
        String buyerEmail = po.getBuyerId() != null
                ? userRepository.findById(po.getBuyerId()).map(User::getEmail).orElse(null)
                : null;
        String supplierName = po.getSupplierId() != null
                ? supplierRepository.findById(po.getSupplierId()).map(Supplier::getName).orElse(null)
                : null;

        return new AdminPurchaseOrderResponse(
                po.getId(),
                po.getPoNumber(),
                po.getRfqId(),
                po.getQuotationId(),
                po.getBuyerId(),
                buyerName,
                buyerEmail,
                po.getSupplierId(),
                supplierName,
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

    private AdminShipmentSummary toShipmentSummary(Shipment s) {
        return new AdminShipmentSummary(
                s.getId(),
                s.getCarrier(),
                s.getTrackingNumber(),
                s.getEstimatedDeliveryDate(),
                s.getShippedAt()
        );
    }
}
