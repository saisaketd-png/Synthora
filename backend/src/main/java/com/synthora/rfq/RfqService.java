package com.synthora.rfq;

import com.synthora.rfq.dto.CreateRfqRequest;
import com.synthora.rfq.dto.RfqResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;


import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class RfqService {

   private final RfqRepository rfqRepository;
private final UserRepository userRepository;
private final SupplierRepository supplierRepository;
private final com.synthora.rfq.quotation.QuotationRepository quotationRepository;

   public RfqService(
         RfqRepository rfqRepository,
        UserRepository userRepository,
        SupplierRepository supplierRepository,
        com.synthora.rfq.quotation.QuotationRepository quotationRepository) {

    this.rfqRepository = rfqRepository;
    this.userRepository = userRepository;
    this.supplierRepository = supplierRepository;
    this.quotationRepository = quotationRepository;
}

   public RfqResponse createRfq(
        CreateRfqRequest request,
        Authentication authentication) {

    String email = authentication.getName();

    User buyer = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    Rfq rfq = new Rfq();
    rfq.setBuyerId(buyer.getId());
        rfq.setProductId(request.productId());
        rfq.setSupplierId(request.supplierId());
        rfq.setQuantity(request.quantity());
        rfq.setUnit(request.unit());
        rfq.setMessage(request.message());

        Rfq saved = rfqRepository.save(rfq);

        return new RfqResponse(
                saved.getId(),
                saved.getBuyerId(),
                saved.getProductId(),
                saved.getSupplierId(),
                saved.getQuantity(),
                saved.getUnit(),
                saved.getMessage(),
                saved.getStatus(),
                saved.getCreatedAt()
        );
    }
    public List<RfqResponse> getMyRfqs(Authentication authentication) {

    String email = authentication.getName();

    User buyer = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    return rfqRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId())
            .stream()
            .map(rfq -> new RfqResponse(
                    rfq.getId(),
                    rfq.getBuyerId(),
                    rfq.getProductId(),
                    rfq.getSupplierId(),
                    rfq.getQuantity(),
                    rfq.getUnit(),
                    rfq.getMessage(),
                    rfq.getStatus(),
                    rfq.getCreatedAt()
            ))
            .toList();
}
public RfqResponse getMyRfq(
        UUID rfqId,
        Authentication authentication) {

    String email = authentication.getName();

    User buyer = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    Rfq rfq = rfqRepository.findByIdAndBuyerId(
            rfqId,
            buyer.getId()
    ).orElseThrow(() -> new IllegalArgumentException("RFQ not found"));

    return new RfqResponse(
            rfq.getId(),
            rfq.getBuyerId(),
            rfq.getProductId(),
            rfq.getSupplierId(),
            rfq.getQuantity(),
            rfq.getUnit(),
            rfq.getMessage(),
            rfq.getStatus(),
            rfq.getCreatedAt()
    );
}


public List<RfqResponse> getSupplierRfqs(Authentication authentication) {

    String email = authentication.getName();

    User supplierUser = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    Supplier supplier = supplierRepository.findByUser(supplierUser)
            .orElseThrow(() -> new IllegalArgumentException("Supplier profile not found"));

    return rfqRepository
            .findBySupplierIdOrderByCreatedAtDesc(supplier.getId())
            .stream()
            .map(rfq -> new RfqResponse(
                    rfq.getId(),
                    rfq.getBuyerId(),
                    rfq.getProductId(),
                    rfq.getSupplierId(),
                    rfq.getQuantity(),
                    rfq.getUnit(),
                    rfq.getMessage(),
                    rfq.getStatus(),
                    rfq.getCreatedAt()
            ))
            .toList();
}

public RfqResponse getSupplierRfq(UUID rfqId, Authentication authentication) {

    String email = authentication.getName();

    User supplierUser = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    Supplier supplier = supplierRepository.findByUser(supplierUser)
            .orElseThrow(() -> new IllegalArgumentException("Supplier profile not found"));

    Rfq rfq = rfqRepository.findByIdAndSupplierId(rfqId, supplier.getId())
            .orElseThrow(() -> new IllegalArgumentException("RFQ not found"));

    return new RfqResponse(
            rfq.getId(),
            rfq.getBuyerId(),
            rfq.getProductId(),
            rfq.getSupplierId(),
            rfq.getQuantity(),
            rfq.getUnit(),
            rfq.getMessage(),
            rfq.getStatus(),
            rfq.getCreatedAt()
    );
}

public com.synthora.rfq.dto.QuotationResponse submitQuotation(UUID rfqId, com.synthora.rfq.dto.CreateQuotationRequest request, Authentication authentication) {

    String email = authentication.getName();
    User supplierUser = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    Supplier supplier = supplierRepository.findByUser(supplierUser)
            .orElseThrow(() -> new IllegalArgumentException("Supplier profile not found"));

    Rfq rfq = rfqRepository.findByIdAndSupplierIdForUpdate(rfqId, supplier.getId())
            .orElseThrow(() -> new IllegalArgumentException("RFQ not found"));

    if (rfq.getStatus() == RfqStatus.ACCEPTED || rfq.getStatus() == RfqStatus.REJECTED || rfq.getStatus() == RfqStatus.CLOSED || rfq.getStatus() == RfqStatus.CANCELLED) {
        throw new IllegalStateException("Cannot submit quotation for RFQ in status: " + rfq.getStatus());
    }

    Integer maxVersion = quotationRepository.findMaxQuotationVersionByRfqId(rfq.getId());
    Integer nextVersion = (maxVersion == null ? 0 : maxVersion) + 1;

    com.synthora.rfq.quotation.Quotation quotation = new com.synthora.rfq.quotation.Quotation();
    quotation.setRfq(rfq);
    quotation.setQuotationVersion(nextVersion);
    quotation.setUnitPrice(request.unitPrice());
    quotation.setCurrency(request.currency());
    quotation.setMinimumOrderQuantity(request.minimumOrderQuantity());
    quotation.setLeadTimeDays(request.leadTimeDays());
    quotation.setValidityDate(request.validityDate());
    quotation.setPackagingDetails(request.packagingDetails());
    quotation.setCommercialNotes(request.commercialNotes());

    com.synthora.rfq.quotation.Quotation saved = quotationRepository.save(quotation);

    if (rfq.getStatus() == RfqStatus.PENDING || rfq.getStatus() == RfqStatus.CONTACTED) {
        rfq.setStatus(RfqStatus.QUOTED);
        rfqRepository.save(rfq);
    }

    return new com.synthora.rfq.dto.QuotationResponse(
            saved.getId(),
            saved.getRfq().getId(),
            saved.getQuotationVersion(),
            saved.getUnitPrice(),
            saved.getCurrency(),
            saved.getMinimumOrderQuantity(),
            saved.getLeadTimeDays(),
            saved.getValidityDate(),
            saved.getPackagingDetails(),
            saved.getCommercialNotes(),
            saved.getCreatedAt()
    );
}

public List<com.synthora.rfq.dto.QuotationResponse> getBuyerQuotations(UUID rfqId, Authentication authentication) {

    String email = authentication.getName();
    User buyer = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    Rfq rfq = rfqRepository.findByIdAndBuyerId(rfqId, buyer.getId())
            .orElseThrow(() -> new IllegalArgumentException("RFQ not found"));

    return quotationRepository.findByRfqIdOrderByQuotationVersionDesc(rfq.getId())
            .stream()
            .map(q -> new com.synthora.rfq.dto.QuotationResponse(
                    q.getId(),
                    q.getRfq().getId(),
                    q.getQuotationVersion(),
                    q.getUnitPrice(),
                    q.getCurrency(),
                    q.getMinimumOrderQuantity(),
                    q.getLeadTimeDays(),
                    q.getValidityDate(),
                    q.getPackagingDetails(),
                    q.getCommercialNotes(),
                    q.getCreatedAt()
            ))
            .toList();
}

public com.synthora.rfq.dto.QuotationDecisionResponse acceptQuotation(
        UUID rfqId,
        UUID quotationId,
        com.synthora.rfq.dto.AcceptQuotationRequest request,
        Authentication authentication) {

    String email = authentication.getName();
    User buyer = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    Rfq rfq = rfqRepository.findByIdAndBuyerIdForUpdate(rfqId, buyer.getId())
            .orElseThrow(() -> new IllegalArgumentException("RFQ not found"));

    if (rfq.getStatus() != RfqStatus.QUOTED) {
        throw new IllegalStateException("Cannot accept quotation for RFQ in status: " + rfq.getStatus());
    }

    com.synthora.rfq.quotation.Quotation quotation = quotationRepository.findByIdAndRfqId(quotationId, rfq.getId())
            .orElseThrow(() -> new IllegalArgumentException("Quotation not found"));

    Integer maxVersion = quotationRepository.findMaxQuotationVersionByRfqId(rfq.getId());
    if (!quotation.getQuotationVersion().equals(maxVersion)) {
        throw new IllegalStateException("Cannot accept an outdated quotation version. Latest version is " + maxVersion);
    }

    rfq.setStatus(RfqStatus.ACCEPTED);
    rfq.setAcceptedQuotationId(quotation.getId());
    rfqRepository.save(rfq);

    return new com.synthora.rfq.dto.QuotationDecisionResponse(
            rfq.getId(),
            quotation.getId(),
            quotation.getQuotationVersion(),
            rfq.getStatus(),
            "ACCEPTED",
            java.time.LocalDateTime.now()
    );
}

public com.synthora.rfq.dto.QuotationDecisionResponse rejectQuotation(
        UUID rfqId,
        UUID quotationId,
        com.synthora.rfq.dto.RejectQuotationRequest request,
        Authentication authentication) {

    String email = authentication.getName();
    User buyer = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    Rfq rfq = rfqRepository.findByIdAndBuyerIdForUpdate(rfqId, buyer.getId())
            .orElseThrow(() -> new IllegalArgumentException("RFQ not found"));

    if (rfq.getStatus() != RfqStatus.QUOTED) {
        throw new IllegalStateException("Cannot reject quotation for RFQ in status: " + rfq.getStatus());
    }

    com.synthora.rfq.quotation.Quotation quotation = quotationRepository.findByIdAndRfqId(quotationId, rfq.getId())
            .orElseThrow(() -> new IllegalArgumentException("Quotation not found"));

    Integer maxVersion = quotationRepository.findMaxQuotationVersionByRfqId(rfq.getId());
    if (!quotation.getQuotationVersion().equals(maxVersion)) {
        throw new IllegalStateException("Cannot reject an outdated quotation version. Latest version is " + maxVersion);
    }

    rfq.setStatus(RfqStatus.REJECTED);
    rfqRepository.save(rfq);

    return new com.synthora.rfq.dto.QuotationDecisionResponse(
            rfq.getId(),
            quotation.getId(),
            quotation.getQuotationVersion(),
            rfq.getStatus(),
            "REJECTED",
            java.time.LocalDateTime.now()
    );
}

}