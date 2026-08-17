package com.synthora.rfq;

import com.synthora.common.ResourceNotFoundException;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.product.Product;
import com.synthora.product.ProductRepository;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.rfq.dto.CreateRfqRequest;
import com.synthora.rfq.dto.RfqResponse;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class RfqService {

    private final RfqRepository rfqRepository;
    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final com.synthora.rfq.quotation.QuotationRepository quotationRepository;

    public RfqService(
            RfqRepository rfqRepository,
            UserRepository userRepository,
            SupplierRepository supplierRepository,
            ProductRepository productRepository,
            com.synthora.rfq.quotation.QuotationRepository quotationRepository) {

        this.rfqRepository = rfqRepository;
        this.userRepository = userRepository;
        this.supplierRepository = supplierRepository;
        this.productRepository = productRepository;
        this.quotationRepository = quotationRepository;
    }

    private String deriveRfqReference(Rfq rfq) {
        LocalDateTime date = rfq.getCreatedAt() != null ? rfq.getCreatedAt() : LocalDateTime.now();
        String idPrefix = rfq.getId() != null ? rfq.getId().toString().substring(0, 8).toUpperCase() : "REQ";
        return String.format("RFQ-%d-%s", date.getYear(), idPrefix);
    }

    private RfqResponse buildSingleRfqResponse(Rfq rfq, String buyerName, String supplierName, String productName) {
        String rfqRef = deriveRfqReference(rfq);

        String finalBuyerName = buyerName != null ? buyerName : userRepository.findById(rfq.getBuyerId())
                .map(User::getName)
                .orElse("Buyer Organization");

        String finalSupplierName = supplierName != null ? supplierName : supplierRepository.findById(rfq.getSupplierId())
                .map(Supplier::getName)
                .orElse("Supplier #" + rfq.getSupplierId());

        String finalProductName = productName != null ? productName : productRepository.findById(rfq.getProductId())
                .map(Product::getName)
                .orElse("Specialty Chemical Product");

        return new RfqResponse(
                rfq.getId(),
                rfqRef,
                rfq.getBuyerId(),
                finalBuyerName,
                rfq.getProductId(),
                finalProductName,
                rfq.getSupplierId(),
                finalSupplierName,
                rfq.getQuantity(),
                rfq.getUnit(),
                rfq.getMessage(),
                rfq.getStatus(),
                rfq.getCreatedAt()
        );
    }

    public RfqResponse createRfq(
            CreateRfqRequest request,
            Authentication authentication) {

        String email = authentication.getName();

        User buyer = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyer.getId());
        rfq.setProductId(request.productId());
        rfq.setSupplierId(request.supplierId());
        rfq.setQuantity(request.quantity());
        rfq.setUnit(request.unit());
        rfq.setMessage(request.message());

        Rfq saved = rfqRepository.save(rfq);

        return buildSingleRfqResponse(saved, buyer.getName(), null, null);
    }

    public List<RfqResponse> getMyRfqs(Authentication authentication) {

        String email = authentication.getName();

        User buyer = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Rfq> rfqs = rfqRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        if (rfqs.isEmpty()) {
            return List.of();
        }

        Set<UUID> productIds = rfqs.stream().map(Rfq::getProductId).collect(Collectors.toSet());
        Set<Long> supplierIds = rfqs.stream().map(Rfq::getSupplierId).collect(Collectors.toSet());

        Map<UUID, String> productNames = productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, Product::getName, (a, b) -> a));
        Map<Long, String> supplierNames = supplierRepository.findAllById(supplierIds).stream()
                .collect(Collectors.toMap(Supplier::getId, Supplier::getName, (a, b) -> a));

        return rfqs.stream().map(rfq -> {
            String rfqRef = deriveRfqReference(rfq);
            String prodName = productNames.getOrDefault(rfq.getProductId(), "Specialty Chemical Product");
            String suppName = supplierNames.getOrDefault(rfq.getSupplierId(), "Supplier #" + rfq.getSupplierId());

            return new RfqResponse(
                    rfq.getId(),
                    rfqRef,
                    rfq.getBuyerId(),
                    buyer.getName(),
                    rfq.getProductId(),
                    prodName,
                    rfq.getSupplierId(),
                    suppName,
                    rfq.getQuantity(),
                    rfq.getUnit(),
                    rfq.getMessage(),
                    rfq.getStatus(),
                    rfq.getCreatedAt()
            );
        }).toList();
    }

    public RfqResponse getMyRfq(
            UUID rfqId,
            Authentication authentication) {

        String email = authentication.getName();

        User buyer = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Rfq rfq = rfqRepository.findByIdAndBuyerId(
                rfqId,
                buyer.getId()
        ).orElseThrow(() -> new ResourceNotFoundException("RFQ not found"));

        return buildSingleRfqResponse(rfq, buyer.getName(), null, null);
    }

    public List<RfqResponse> getSupplierRfqs(Authentication authentication) {

        String email = authentication.getName();

        User supplierUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Supplier supplier = supplierRepository.findByUser(supplierUser)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier profile not found"));

        List<Rfq> rfqs = rfqRepository.findBySupplierIdOrderByCreatedAtDesc(supplier.getId());
        if (rfqs.isEmpty()) {
            return List.of();
        }

        Set<UUID> productIds = rfqs.stream().map(Rfq::getProductId).collect(Collectors.toSet());
        Set<UUID> buyerIds = rfqs.stream().map(Rfq::getBuyerId).collect(Collectors.toSet());

        Map<UUID, String> productNames = productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, Product::getName, (a, b) -> a));
        Map<UUID, String> buyerNames = userRepository.findAllById(buyerIds).stream()
                .collect(Collectors.toMap(User::getId, User::getName, (a, b) -> a));

        return rfqs.stream().map(rfq -> {
            String rfqRef = deriveRfqReference(rfq);
            String prodName = productNames.getOrDefault(rfq.getProductId(), "Specialty Chemical Product");
            String bName = buyerNames.getOrDefault(rfq.getBuyerId(), "Buyer Organization");

            return new RfqResponse(
                    rfq.getId(),
                    rfqRef,
                    rfq.getBuyerId(),
                    bName,
                    rfq.getProductId(),
                    prodName,
                    rfq.getSupplierId(),
                    supplier.getName(),
                    rfq.getQuantity(),
                    rfq.getUnit(),
                    rfq.getMessage(),
                    rfq.getStatus(),
                    rfq.getCreatedAt()
            );
        }).toList();
    }

    public RfqResponse getSupplierRfq(UUID rfqId, Authentication authentication) {

        String email = authentication.getName();

        User supplierUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Supplier supplier = supplierRepository.findByUser(supplierUser)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier profile not found"));

        Rfq rfq = rfqRepository.findByIdAndSupplierId(rfqId, supplier.getId())
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found"));

        return buildSingleRfqResponse(rfq, null, supplier.getName(), null);
    }

    public com.synthora.rfq.dto.QuotationResponse submitQuotation(UUID rfqId, com.synthora.rfq.dto.CreateQuotationRequest request, Authentication authentication) {

        String email = authentication.getName();
        User supplierUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Supplier supplier = supplierRepository.findByUser(supplierUser)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier profile not found"));

        Rfq rfq = rfqRepository.findByIdAndSupplierIdForUpdate(rfqId, supplier.getId())
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found"));

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
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Rfq rfq = rfqRepository.findByIdAndBuyerId(rfqId, buyer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found"));

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
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Rfq rfq = rfqRepository.findByIdAndBuyerIdForUpdate(rfqId, buyer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found"));

        if (rfq.getStatus() != RfqStatus.QUOTED) {
            throw new IllegalStateException("Cannot accept quotation for RFQ in status: " + rfq.getStatus());
        }

        com.synthora.rfq.quotation.Quotation quotation = quotationRepository.findByIdAndRfqId(quotationId, rfq.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found"));

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
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Rfq rfq = rfqRepository.findByIdAndBuyerIdForUpdate(rfqId, buyer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found"));

        if (rfq.getStatus() != RfqStatus.QUOTED) {
            throw new IllegalStateException("Cannot reject quotation for RFQ in status: " + rfq.getStatus());
        }

        com.synthora.rfq.quotation.Quotation quotation = quotationRepository.findByIdAndRfqId(quotationId, rfq.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found"));

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