package com.synthora.notification;

import com.synthora.document.DocumentCategory;
import com.synthora.document.DocumentOwnerType;
import com.synthora.notification.events.*;
import com.synthora.order.PurchaseOrder;
import com.synthora.order.PurchaseOrderRepository;
import com.synthora.order.Shipment;
import com.synthora.order.ShipmentRepository;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.rfq.Rfq;
import com.synthora.rfq.RfqRepository;
import com.synthora.rfq.quotation.Quotation;
import com.synthora.rfq.quotation.QuotationRepository;
import com.synthora.notification.email.EmailNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Optional;
import java.util.UUID;

/**
 * Handles domain application events AFTER_COMMIT to create notifications and trigger async email notifications.
 * Failure in notification creation or email dispatch is safely logged and will not impact completed transactions.
 */
@Component
public class NotificationEventListener {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventListener.class);

    private final NotificationService notificationService;
    private final EmailNotificationService emailNotificationService;
    private final SupplierRepository supplierRepository;
    private final RfqRepository rfqRepository;
    private final QuotationRepository quotationRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ShipmentRepository shipmentRepository;

    public NotificationEventListener(
            NotificationService notificationService,
            EmailNotificationService emailNotificationService,
            SupplierRepository supplierRepository,
            RfqRepository rfqRepository,
            QuotationRepository quotationRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            ShipmentRepository shipmentRepository) {
        this.notificationService = notificationService;
        this.emailNotificationService = emailNotificationService;
        this.supplierRepository = supplierRepository;
        this.rfqRepository = rfqRepository;
        this.quotationRepository = quotationRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.shipmentRepository = shipmentRepository;
    }

    private UUID resolveSupplierUserId(Long supplierId) {
        if (supplierId == null) {
            return null;
        }
        return supplierRepository.findById(supplierId)
                .map(Supplier::getUser)
                .map(u -> u != null ? u.getId() : null)
                .orElse(null);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onRfqSubmitted(RfqSubmittedEvent event) {
        try {
            UUID recipientId = resolveSupplierUserId(event.supplierId());
            if (recipientId != null) {
                Notification n = notificationService.createNotification(
                        recipientId,
                        NotificationType.RFQ_SUBMITTED,
                        "New RFQ Received",
                        "A buyer has submitted a new request for quotation.",
                        NotificationEntityType.RFQ,
                        event.rfqId()
                );
                if (n != null) {
                    emailNotificationService.sendNotificationEmail(n);
                }
            } else {
                log.warn("Could not resolve supplier User for supplier ID {}", event.supplierId());
            }
        } catch (Exception e) {
            log.error("Failed to process RfqSubmittedEvent for RFQ {}", event.rfqId(), e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onQuotationSubmitted(QuotationSubmittedEvent event) {
        try {
            Notification n = notificationService.createNotification(
                    event.buyerId(),
                    NotificationType.QUOTATION_SUBMITTED,
                    "New Quotation Received",
                    "A supplier has submitted a quotation for your RFQ.",
                    NotificationEntityType.QUOTATION,
                    event.quotationId()
            );
            if (n != null) {
                emailNotificationService.sendNotificationEmail(n);
            }
        } catch (Exception e) {
            log.error("Failed to process QuotationSubmittedEvent for quotation {}", event.quotationId(), e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onQuotationAccepted(QuotationAcceptedEvent event) {
        try {
            UUID recipientId = resolveSupplierUserId(event.supplierId());
            if (recipientId != null) {
                Notification n = notificationService.createNotification(
                        recipientId,
                        NotificationType.QUOTATION_ACCEPTED,
                        "Quotation Accepted",
                        "Your quotation has been accepted by the buyer.",
                        NotificationEntityType.QUOTATION,
                        event.quotationId()
                );
                if (n != null) {
                    emailNotificationService.sendNotificationEmail(n);
                }
            } else {
                log.warn("Could not resolve supplier User for supplier ID {}", event.supplierId());
            }
        } catch (Exception e) {
            log.error("Failed to process QuotationAcceptedEvent for quotation {}", event.quotationId(), e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onQuotationRejected(QuotationRejectedEvent event) {
        try {
            UUID recipientId = resolveSupplierUserId(event.supplierId());
            if (recipientId != null) {
                Notification n = notificationService.createNotification(
                        recipientId,
                        NotificationType.QUOTATION_REJECTED,
                        "Quotation Rejected",
                        "Your quotation has been rejected by the buyer.",
                        NotificationEntityType.QUOTATION,
                        event.quotationId()
                );
                if (n != null) {
                    emailNotificationService.sendNotificationEmail(n);
                }
            } else {
                log.warn("Could not resolve supplier User for supplier ID {}", event.supplierId());
            }
        } catch (Exception e) {
            log.error("Failed to process QuotationRejectedEvent for quotation {}", event.quotationId(), e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onPurchaseOrderIssued(PurchaseOrderIssuedEvent event) {
        try {
            UUID recipientId = resolveSupplierUserId(event.supplierId());
            if (recipientId != null) {
                Notification n = notificationService.createNotification(
                        recipientId,
                        NotificationType.PO_ISSUED,
                        "Purchase Order Issued",
                        "A new purchase order has been issued to you.",
                        NotificationEntityType.PURCHASE_ORDER,
                        event.purchaseOrderId()
                );
                if (n != null) {
                    emailNotificationService.sendNotificationEmail(n);
                }
            } else {
                log.warn("Could not resolve supplier User for supplier ID {}", event.supplierId());
            }
        } catch (Exception e) {
            log.error("Failed to process PurchaseOrderIssuedEvent for PO {}", event.purchaseOrderId(), e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onPurchaseOrderConfirmed(PurchaseOrderConfirmedEvent event) {
        try {
            Notification n = notificationService.createNotification(
                    event.buyerId(),
                    NotificationType.PO_CONFIRMED,
                    "Purchase Order Confirmed",
                    "Your purchase order has been confirmed by the supplier.",
                    NotificationEntityType.PURCHASE_ORDER,
                    event.purchaseOrderId()
            );
            if (n != null) {
                emailNotificationService.sendNotificationEmail(n);
            }
        } catch (Exception e) {
            log.error("Failed to process PurchaseOrderConfirmedEvent for PO {}", event.purchaseOrderId(), e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onOrderProcessingStarted(OrderProcessingStartedEvent event) {
        try {
            Notification n = notificationService.createNotification(
                    event.buyerId(),
                    NotificationType.ORDER_PROCESSING_STARTED,
                    "Order Processing Started",
                    "Your supplier has started processing the order.",
                    NotificationEntityType.PURCHASE_ORDER,
                    event.purchaseOrderId()
            );
            if (n != null) {
                emailNotificationService.sendNotificationEmail(n);
            }
        } catch (Exception e) {
            log.error("Failed to process OrderProcessingStartedEvent for PO {}", event.purchaseOrderId(), e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onOrderShipped(OrderShippedEvent event) {
        try {
            NotificationEntityType entityType = event.shipmentId() != null
                    ? NotificationEntityType.SHIPMENT
                    : NotificationEntityType.PURCHASE_ORDER;
            UUID entityId = event.shipmentId() != null
                    ? event.shipmentId()
                    : event.purchaseOrderId();

            Notification n = notificationService.createNotification(
                    event.buyerId(),
                    NotificationType.ORDER_SHIPPED,
                    "Order Shipped",
                    "Your order has been shipped.",
                    entityType,
                    entityId
            );
            if (n != null) {
                emailNotificationService.sendNotificationEmail(n);
            }
        } catch (Exception e) {
            log.error("Failed to process OrderShippedEvent for PO {}", event.purchaseOrderId(), e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onOrderDelivered(OrderDeliveredEvent event) {
        try {
            Notification n = notificationService.createNotification(
                    event.buyerId(),
                    NotificationType.ORDER_DELIVERED,
                    "Order Delivered",
                    "Your order has been marked as delivered.",
                    NotificationEntityType.PURCHASE_ORDER,
                    event.purchaseOrderId()
            );
            if (n != null) {
                emailNotificationService.sendNotificationEmail(n);
            }
        } catch (Exception e) {
            log.error("Failed to process OrderDeliveredEvent for PO {}", event.purchaseOrderId(), e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onDocumentUploaded(DocumentUploadedEvent event) {
        try {
            UUID recipientId = resolveDocumentCounterparty(event);
            if (recipientId != null && !recipientId.equals(event.uploadedBy())) {
                String ownerLabel = event.ownerType().name().toLowerCase().replace('_', ' ');
                Notification n = notificationService.createNotification(
                        recipientId,
                        NotificationType.DOCUMENT_UPLOADED,
                        "New Document Uploaded",
                        "A new document has been uploaded for your " + ownerLabel + ".",
                        NotificationEntityType.DOCUMENT,
                        event.documentId()
                );
                if (n != null) {
                    emailNotificationService.sendNotificationEmail(n);
                }
            }
        } catch (Exception e) {
            log.error("Failed to process DocumentUploadedEvent for doc {}", event.documentId(), e);
        }
    }

    private UUID resolveDocumentCounterparty(DocumentUploadedEvent event) {
        if (event.ownerType() == null || event.ownerId() == null) {
            return null;
        }

        switch (event.ownerType()) {
            case RFQ:
                return rfqRepository.findById(event.ownerId())
                        .map(rfq -> event.uploadedBy().equals(rfq.getBuyerId())
                                ? resolveSupplierUserId(rfq.getSupplierId())
                                : rfq.getBuyerId())
                        .orElse(null);

            case QUOTATION:
                return quotationRepository.findById(event.ownerId())
                        .map(Quotation::getRfq)
                        .map(rfq -> event.uploadedBy().equals(rfq.getBuyerId())
                                ? resolveSupplierUserId(rfq.getSupplierId())
                                : rfq.getBuyerId())
                        .orElse(null);

            case PURCHASE_ORDER:
                return purchaseOrderRepository.findById(event.ownerId())
                        .map(po -> event.uploadedBy().equals(po.getBuyerId())
                                ? resolveSupplierUserId(po.getSupplierId())
                                : po.getBuyerId())
                        .orElse(null);

            case SHIPMENT:
                return shipmentRepository.findById(event.ownerId())
                        .map(Shipment::getPurchaseOrder)
                        .map(po -> event.uploadedBy().equals(po.getBuyerId())
                                ? resolveSupplierUserId(po.getSupplierId())
                                : po.getBuyerId())
                        .orElse(null);

            case PRODUCT:
            default:
                return null;
        }
    }
}
