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
import com.synthora.identity.UserRole;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class DocumentAuthorizationServiceImpl implements DocumentAuthorizationService {

    private final ProductRepository productRepository;
    private final RfqRepository rfqRepository;
    private final QuotationRepository quotationRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ShipmentRepository shipmentRepository;
    private final SupplierRepository supplierRepository;

    public DocumentAuthorizationServiceImpl(
            ProductRepository productRepository,
            RfqRepository rfqRepository,
            QuotationRepository quotationRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            ShipmentRepository shipmentRepository,
            SupplierRepository supplierRepository) {
        
        this.productRepository = productRepository;
        this.rfqRepository = rfqRepository;
        this.quotationRepository = quotationRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.shipmentRepository = shipmentRepository;
        this.supplierRepository = supplierRepository;
    }

    @Override
    public boolean canAccessDocument(DocumentOwnerType type, UUID ownerId, User authenticatedUser) {
        if (UserRole.ADMIN == authenticatedUser.getRole()) {
            return true;
        }

        switch (type) {
            case PRODUCT:
                return canAccessProduct(ownerId, authenticatedUser);
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
        if (UserRole.ADMIN == authenticatedUser.getRole()) {
            return true;
        }

        switch (type) {
            case PRODUCT:
                return canAccessProduct(ownerId, authenticatedUser); // Only seller
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
        if (UserRole.ADMIN == authenticatedUser.getRole()) {
            return true;
        }
        
        // Deletion requires that the user is authorized to upload to that document's owner
        boolean canUpload = canUploadDocument(document.getOwnerType(), document.getOwnerId(), authenticatedUser);
        if (!canUpload) {
            return false;
        }

        // The user must be the original uploader to delete the document (prevents supplier from deleting buyer's docs, etc)
        return document.getUploadedBy() != null && document.getUploadedBy().equals(authenticatedUser.getId());
    }

    private Long getSupplierId(User user) {
        if (UserRole.SUPPLIER != user.getRole()) {
            return null;
        }
        return supplierRepository.findByUser(user)
                .map(Supplier::getId)
                .orElse(null);
    }

    private boolean canAccessProduct(UUID productId, User authenticatedUser) {
        // Only the seller (supplier) who owns the product can access its documents in Phase 2D.4
        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) {
            return false;
        }
        Product product = productOpt.get();
        return product.getSeller().getId().equals(authenticatedUser.getId());
    }

    private boolean canAccessRfq(UUID rfqId, User authenticatedUser) {
        Optional<Rfq> rfqOpt = rfqRepository.findById(rfqId);
        if (rfqOpt.isEmpty()) {
            return false;
        }
        Rfq rfq = rfqOpt.get();
        
        if (rfq.getBuyerId().equals(authenticatedUser.getId())) {
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
        Quotation quotation = quoteOpt.get();
        // Quotation authorization follows its parent RFQ
        return canAccessRfq(quotation.getRfq().getId(), authenticatedUser);
    }

    private boolean canAccessPurchaseOrder(UUID poId, User authenticatedUser) {
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
        Shipment shipment = shipmentOpt.get();
        // Shipment authorization follows its parent PurchaseOrder
        return canAccessPurchaseOrder(shipment.getPurchaseOrder().getId(), authenticatedUser);
    }

    private boolean canUploadRfq(UUID rfqId, User authenticatedUser) {
        Optional<Rfq> rfqOpt = rfqRepository.findById(rfqId);
        if (rfqOpt.isEmpty()) {
            return false;
        }
        // Only the Buyer who owns the RFQ can upload documents
        return rfqOpt.get().getBuyerId().equals(authenticatedUser.getId());
    }

    private boolean canUploadQuotation(UUID quotationId, User authenticatedUser) {
        Optional<Quotation> quoteOpt = quotationRepository.findById(quotationId);
        if (quoteOpt.isEmpty()) {
            return false;
        }
        // Only the Supplier who submitted the quotation can upload documents
        Long supplierId = getSupplierId(authenticatedUser);
        return supplierId != null && supplierId.equals(quoteOpt.get().getRfq().getSupplierId());
    }

    private boolean canUploadPurchaseOrder(UUID poId, User authenticatedUser) {
        Optional<PurchaseOrder> poOpt = purchaseOrderRepository.findById(poId);
        if (poOpt.isEmpty()) {
            return false;
        }
        PurchaseOrder po = poOpt.get();
        // Buyer who owns the PO can upload
        if (po.getBuyerId().equals(authenticatedUser.getId())) {
            return true;
        }
        // Supplier assigned to the PO can upload
        Long supplierId = getSupplierId(authenticatedUser);
        return supplierId != null && supplierId.equals(po.getSupplierId());
    }

    private boolean canUploadShipment(UUID shipmentId, User authenticatedUser) {
        Optional<Shipment> shipmentOpt = shipmentRepository.findById(shipmentId);
        if (shipmentOpt.isEmpty()) {
            return false;
        }
        // Only the Supplier who fulfills the shipment can upload documents
        Long supplierId = getSupplierId(authenticatedUser);
        return supplierId != null && supplierId.equals(shipmentOpt.get().getPurchaseOrder().getSupplierId());
    }
}
