package com.kemkendra.document;

import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRole;
import com.kemkendra.order.PurchaseOrder;
import com.kemkendra.order.PurchaseOrderRepository;
import com.kemkendra.order.Shipment;
import com.kemkendra.order.ShipmentRepository;
import com.kemkendra.product.*;
import com.kemkendra.rfq.Rfq;
import com.kemkendra.rfq.RfqRepository;
import com.kemkendra.rfq.quotation.Quotation;
import com.kemkendra.rfq.quotation.QuotationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class DocumentAuthorizationServiceImpl implements DocumentAuthorizationService {

    private final ProductRepository productRepository;
    private final MasterProductRepository masterProductRepository;
    private final SupplierOfferingRepository supplierOfferingRepository;
    private final RfqRepository rfqRepository;
    private final QuotationRepository quotationRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ShipmentRepository shipmentRepository;
    private final SupplierRepository supplierRepository;

    public DocumentAuthorizationServiceImpl(
            ProductRepository productRepository,
            MasterProductRepository masterProductRepository,
            SupplierOfferingRepository supplierOfferingRepository,
            RfqRepository rfqRepository,
            QuotationRepository quotationRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            ShipmentRepository shipmentRepository,
            SupplierRepository supplierRepository) {
        this.productRepository = productRepository;
        this.masterProductRepository = masterProductRepository;
        this.supplierOfferingRepository = supplierOfferingRepository;
        this.rfqRepository = rfqRepository;
        this.quotationRepository = quotationRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.shipmentRepository = shipmentRepository;
        this.supplierRepository = supplierRepository;
    }

    @Override
    public boolean canAccessDocument(DocumentOwnerType type, UUID ownerId, User authenticatedUser) {
        if (authenticatedUser != null && UserRole.ADMIN == authenticatedUser.getRole()) {
            return true;
        }

        if (authenticatedUser == null && type != DocumentOwnerType.PRODUCT && type != DocumentOwnerType.MASTER_PRODUCT && type != DocumentOwnerType.SUPPLIER_OFFERING) {
            return false;
        }

        if (authenticatedUser != null && authenticatedUser.getStatus() == com.kemkendra.identity.UserStatus.SUSPENDED) {
            return false;
        }

        switch (type) {
            case USER:
                return canAccessUser(ownerId, authenticatedUser);
            case PRODUCT:
                return canAccessProduct(ownerId, authenticatedUser);
            case MASTER_PRODUCT:
                return canAccessMasterProduct(ownerId, authenticatedUser);
            case SUPPLIER_OFFERING:
                return canAccessSupplierOffering(ownerId, authenticatedUser);
            case SUPPLIER:
                return canAccessSupplier(ownerId, authenticatedUser);
            case RFQ:
                return canAccessRfq(ownerId, authenticatedUser);
            case QUOTATION:
                return canAccessQuotation(ownerId, authenticatedUser);
            case PURCHASE_ORDER:
                return canAccessPurchaseOrder(ownerId, authenticatedUser);
            case SHIPMENT:
                return canAccessShipment(ownerId, authenticatedUser);
            default:
                return false;
        }
    }

    @Override
    public boolean canUploadDocument(DocumentOwnerType type, UUID ownerId, User authenticatedUser) {
        if (authenticatedUser != null && UserRole.ADMIN == authenticatedUser.getRole()) {
            return true;
        }
        if (authenticatedUser == null || authenticatedUser.getStatus() == com.kemkendra.identity.UserStatus.SUSPENDED) {
            return false;
        }

        switch (type) {
            case USER:
                return canUploadUser(ownerId, authenticatedUser);
            case PRODUCT:
                return canUploadProduct(ownerId, authenticatedUser);
            case MASTER_PRODUCT:
                return false; // Only Admin can upload canonical MasterProduct documents
            case SUPPLIER_OFFERING:
                return canUploadSupplierOffering(ownerId, authenticatedUser);
            case SUPPLIER:
                return canUploadSupplier(ownerId, authenticatedUser);
            case RFQ:
                return canUploadRfq(ownerId, authenticatedUser);
            case QUOTATION:
                return canUploadQuotation(ownerId, authenticatedUser);
            case PURCHASE_ORDER:
                return canUploadPurchaseOrder(ownerId, authenticatedUser);
            case SHIPMENT:
                return canUploadShipment(ownerId, authenticatedUser);
            default:
                return false;
        }
    }

    @Override
    public boolean canDeleteDocument(DocumentResponse document, User authenticatedUser) {
        if (authenticatedUser != null && UserRole.ADMIN == authenticatedUser.getRole()) {
            return true;
        }
        if (authenticatedUser == null) {
            return false;
        }

        boolean canUpload = canUploadDocument(document.getOwnerType(), document.getOwnerId(), authenticatedUser);
        if (!canUpload) {
            return false;
        }

        return document.getUploadedBy() != null && document.getUploadedBy().equals(authenticatedUser.getId());
    }

    private Long getSupplierId(User user) {
        if (user == null) {
            return null;
        }
        return supplierRepository.findByUser(user)
                .map(Supplier::getId)
                .orElse(null);
    }

    private boolean canAccessProduct(UUID productId, User authenticatedUser) {
        return productRepository.findById(productId).isPresent();
    }

    private boolean canAccessMasterProduct(UUID masterProductId, User authenticatedUser) {
        return masterProductRepository.findById(masterProductId)
                .map(mp -> "ACTIVE".equalsIgnoreCase(mp.getStatus()) || "MERGED".equalsIgnoreCase(mp.getStatus()))
                .orElse(false);
    }

    private boolean canAccessSupplierOffering(UUID offeringId, User authenticatedUser) {
        return supplierOfferingRepository.findById(offeringId)
                .map(offering -> "ACTIVE".equalsIgnoreCase(offering.getAvailabilityStatus()) || "AVAILABLE".equalsIgnoreCase(offering.getAvailabilityStatus()))
                .orElse(false);
    }

    private boolean canAccessSupplier(UUID ownerId, User authenticatedUser) {
        if (authenticatedUser == null) {
            return false;
        }
        if (authenticatedUser.getId().equals(ownerId)) {
            return true;
        }
        return supplierRepository.findByUser(authenticatedUser)
                .map(Supplier::getId)
                .map(id -> id.toString().equalsIgnoreCase(ownerId.toString()))
                .orElse(false);
    }

    private boolean canUploadProduct(UUID productId, User authenticatedUser) {
        if (authenticatedUser == null) {
            return false;
        }
        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) {
            return false;
        }
        return productOpt.get().getSeller().getId().equals(authenticatedUser.getId());
    }

    private boolean canUploadSupplierOffering(UUID offeringId, User authenticatedUser) {
        if (authenticatedUser == null || authenticatedUser.getRole() != UserRole.SUPPLIER) {
            return false;
        }
        Optional<SupplierOffering> offeringOpt = supplierOfferingRepository.findById(offeringId);
        if (offeringOpt.isEmpty()) {
            return false;
        }
        return offeringOpt.get().getSupplier().getUser().getId().equals(authenticatedUser.getId());
    }

    private boolean canUploadSupplier(UUID supplierId, User authenticatedUser) {
        return canAccessSupplier(supplierId, authenticatedUser);
    }

    private boolean canAccessRfq(UUID rfqId, User authenticatedUser) {
        if (authenticatedUser == null) {
            return false;
        }
        Optional<Rfq> rfqOpt = rfqRepository.findById(rfqId);
        if (rfqOpt.isEmpty()) {
            return false;
        }
        Rfq rfq = rfqOpt.get();

        if (rfq.getBuyerId() != null && rfq.getBuyerId().equals(authenticatedUser.getId())) {
            return true;
        }

        Long supplierId = getSupplierId(authenticatedUser);
        return supplierId != null && supplierId.equals(rfq.getSupplierId());
    }

    private boolean canAccessQuotation(UUID quotationId, User authenticatedUser) {
        Optional<Quotation> quoteOpt = quotationRepository.findById(quotationId);
        if (quoteOpt.isEmpty()) {
            return false;
        }
        return canAccessRfq(quoteOpt.get().getRfq().getId(), authenticatedUser);
    }

    private boolean canAccessPurchaseOrder(UUID poId, User authenticatedUser) {
        if (authenticatedUser == null) {
            return false;
        }
        Optional<PurchaseOrder> poOpt = purchaseOrderRepository.findById(poId);
        if (poOpt.isEmpty()) {
            return false;
        }
        PurchaseOrder po = poOpt.get();

        if (po.getBuyerId().equals(authenticatedUser.getId())) {
            return true;
        }

        Long supplierId = getSupplierId(authenticatedUser);
        return supplierId != null && supplierId.equals(po.getSupplierId());
    }

    private boolean canAccessShipment(UUID shipmentId, User authenticatedUser) {
        Optional<Shipment> shipmentOpt = shipmentRepository.findById(shipmentId);
        if (shipmentOpt.isEmpty()) {
            return false;
        }
        return canAccessPurchaseOrder(shipmentOpt.get().getPurchaseOrder().getId(), authenticatedUser);
    }

    private boolean canUploadRfq(UUID rfqId, User authenticatedUser) {
        if (authenticatedUser == null) {
            return false;
        }
        Optional<Rfq> rfqOpt = rfqRepository.findById(rfqId);
        if (rfqOpt.isEmpty()) {
            return false;
        }
        Rfq rfq = rfqOpt.get();

        // Buyer who created the RFQ can upload documents
        if (rfq.getBuyerId() != null && rfq.getBuyerId().equals(authenticatedUser.getId())) {
            return true;
        }

        // Supplier participating in this RFQ can upload documents
        Long supplierId = getSupplierId(authenticatedUser);
        return supplierId != null && supplierId.equals(rfq.getSupplierId());
    }

    private boolean canUploadQuotation(UUID quotationId, User authenticatedUser) {
        if (authenticatedUser == null) {
            return false;
        }
        Optional<Quotation> quoteOpt = quotationRepository.findById(quotationId);
        if (quoteOpt.isEmpty()) {
            return false;
        }
        Long supplierId = getSupplierId(authenticatedUser);
        return supplierId != null && supplierId.equals(quoteOpt.get().getRfq().getSupplierId());
    }

    private boolean canUploadPurchaseOrder(UUID poId, User authenticatedUser) {
        if (authenticatedUser == null) {
            return false;
        }
        Optional<PurchaseOrder> poOpt = purchaseOrderRepository.findById(poId);
        if (poOpt.isEmpty()) {
            return false;
        }
        PurchaseOrder po = poOpt.get();
        if (po.getBuyerId().equals(authenticatedUser.getId())) {
            return true;
        }
        Long supplierId = getSupplierId(authenticatedUser);
        return supplierId != null && supplierId.equals(po.getSupplierId());
    }

    private boolean canUploadShipment(UUID shipmentId, User authenticatedUser) {
        if (authenticatedUser == null) {
            return false;
        }
        Optional<Shipment> shipmentOpt = shipmentRepository.findById(shipmentId);
        if (shipmentOpt.isEmpty()) {
            return false;
        }
        Long supplierId = getSupplierId(authenticatedUser);
        return supplierId != null && supplierId.equals(shipmentOpt.get().getPurchaseOrder().getSupplierId());
    }

    private boolean canAccessUser(UUID ownerId, User authenticatedUser) {
        if (authenticatedUser == null) {
            return false;
        }
        return authenticatedUser.getId().equals(ownerId);
    }

    private boolean canUploadUser(UUID ownerId, User authenticatedUser) {
        return canAccessUser(ownerId, authenticatedUser);
    }
}
