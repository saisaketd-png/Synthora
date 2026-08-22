package com.synthora.rfq;

import com.synthora.common.ResourceNotFoundException;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.product.*;
import com.synthora.rfq.dto.*;
import com.synthora.rfq.sourcing.*;
import com.synthora.notification.events.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class RfqService {

    private final RfqRepository rfqRepository;
    private final SourcingRequestRepository sourcingRequestRepository;
    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final MasterProductRepository masterProductRepository;
    private final SupplierOfferingRepository supplierOfferingRepository;
    private final com.synthora.rfq.quotation.QuotationRepository quotationRepository;
    private final ApplicationEventPublisher eventPublisher;

    public RfqService(
            RfqRepository rfqRepository,
            SourcingRequestRepository sourcingRequestRepository,
            UserRepository userRepository,
            SupplierRepository supplierRepository,
            ProductRepository productRepository,
            MasterProductRepository masterProductRepository,
            SupplierOfferingRepository supplierOfferingRepository,
            com.synthora.rfq.quotation.QuotationRepository quotationRepository,
            ApplicationEventPublisher eventPublisher) {

        this.rfqRepository = rfqRepository;
        this.sourcingRequestRepository = sourcingRequestRepository;
        this.userRepository = userRepository;
        this.supplierRepository = supplierRepository;
        this.productRepository = productRepository;
        this.masterProductRepository = masterProductRepository;
        this.supplierOfferingRepository = supplierOfferingRepository;
        this.quotationRepository = quotationRepository;
        this.eventPublisher = eventPublisher;
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

        String finalProductName = productName;
        if (finalProductName == null) {
            if (rfq.getMasterProductId() != null) {
                finalProductName = masterProductRepository.findById(rfq.getMasterProductId())
                        .map(MasterProduct::getName)
                        .orElse(null);
            }
            if (finalProductName == null && rfq.getProductId() != null) {
                finalProductName = productRepository.findById(rfq.getProductId())
                        .map(Product::getName)
                        .orElse(null);
            }
            if (finalProductName == null && rfq.getSupplierOfferingId() != null) {
                finalProductName = supplierOfferingRepository.findById(rfq.getSupplierOfferingId())
                        .map(offering -> offering.getMasterProduct() != null ? offering.getMasterProduct().getName() : null)
                        .orElse(null);
            }
            if (finalProductName == null) {
                finalProductName = "Specialty Chemical Product";
            }
        }

        return new RfqResponse(
                rfq.getId(),
                rfqRef,
                rfq.getSourcingRequestId(),
                rfq.getSourcingRequestReference(),
                rfq.getBuyerId(),
                finalBuyerName,
                rfq.getProductId(),
                rfq.getMasterProductId(),
                rfq.getSupplierOfferingId(),
                finalProductName,
                rfq.getSupplierId(),
                finalSupplierName,
                rfq.getQuantity(),
                rfq.getUnit(),
                rfq.getMessage(),
                rfq.getStatus(),
                rfq.getExpiresAt(),
                rfq.getCreatedAt()
        );
    }

    private void validateRfqActive(Rfq rfq, String actionDesc) {
        if (rfq.getStatus() == RfqStatus.ACCEPTED || rfq.getStatus() == RfqStatus.REJECTED || rfq.getStatus() == RfqStatus.CLOSED || rfq.getStatus() == RfqStatus.CANCELLED || rfq.getStatus() == RfqStatus.EXPIRED) {
            throw new IllegalStateException("Cannot " + actionDesc + " for RFQ in status: " + rfq.getStatus());
        }

        if (rfq.getExpiresAt() != null && LocalDateTime.now().isAfter(rfq.getExpiresAt())) {
            rfq.setStatus(RfqStatus.EXPIRED);
            rfqRepository.save(rfq);
            eventPublisher.publishEvent(new RfqExpiredEvent(rfq.getId(), rfq.getBuyerId(), rfq.getSupplierId()));
            throw new IllegalStateException("RFQ has expired on " + rfq.getExpiresAt());
        }
    }

    public RfqResponse createRfq(
            CreateRfqRequest request,
            Authentication authentication) {

        String email = authentication.getName();

        User buyer = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (buyer.getStatus() != null && buyer.getStatus() != com.synthora.identity.UserStatus.ACTIVE) {
            throw new IllegalStateException("Buyer account is not active.");
        }

        final UUID requestedMasterProductId = request.masterProductId();
        UUID targetOfferingId = request.supplierOfferingId();

        // 1. Master Product Validation
        if (requestedMasterProductId != null) {
            MasterProduct masterProduct = masterProductRepository.findById(requestedMasterProductId)
                    .orElseThrow(() -> new ResourceNotFoundException("MasterProduct not found: " + requestedMasterProductId));

            if (!"ACTIVE".equalsIgnoreCase(masterProduct.getStatus())) {
                throw new IllegalArgumentException("Cannot create RFQ for inactive MasterProduct: " + requestedMasterProductId);
            }
        }

        UUID derivedMasterProductId = requestedMasterProductId;

        // 2. Supplier Offering & Identity Spoofing Validation
        if (targetOfferingId != null) {
            SupplierOffering offering = supplierOfferingRepository.findById(targetOfferingId)
                    .orElseThrow(() -> new ResourceNotFoundException("SupplierOffering not found: " + targetOfferingId));

            if (!"ACTIVE".equalsIgnoreCase(offering.getAvailabilityStatus()) && !"AVAILABLE".equalsIgnoreCase(offering.getAvailabilityStatus())) {
                throw new IllegalArgumentException("Cannot create RFQ for inactive SupplierOffering: " + targetOfferingId);
            }

            if (!"APPROVED".equalsIgnoreCase(offering.getModerationStatus())) {
                throw new IllegalArgumentException("Cannot create RFQ for unapproved SupplierOffering: " + targetOfferingId);
            }

            // Zero-Trust Spoofing Check
            if (!offering.getSupplier().getId().equals(request.supplierId())) {
                throw new IllegalArgumentException("Supplier ID " + request.supplierId() + " does not match SupplierOffering owner ID " + offering.getSupplier().getId());
            }

            if (requestedMasterProductId != null && offering.getMasterProduct() != null && !offering.getMasterProduct().getId().equals(requestedMasterProductId)) {
                throw new IllegalArgumentException("MasterProduct ID " + requestedMasterProductId + " does not match SupplierOffering MasterProduct ID " + offering.getMasterProduct().getId());
            }

            if (derivedMasterProductId == null && offering.getMasterProduct() != null) {
                derivedMasterProductId = offering.getMasterProduct().getId();
            }
        }

        final UUID targetMasterProductId = derivedMasterProductId;

        // 3. Resolve Product ID
        UUID resolvedProdId = request.productId();
        if (resolvedProdId == null && targetMasterProductId == null && targetOfferingId == null) {
            throw new IllegalArgumentException("A valid product, master chemical, or supplier offering must be specified.");
        }
        final UUID finalProductId = resolvedProdId;

        // 4. Multi-Supplier Sourcing Resolution
        List<Long> targetSuppliers = new ArrayList<>();
        if (request.targetSupplierIds() != null && !request.targetSupplierIds().isEmpty()) {
            targetSuppliers.addAll(request.targetSupplierIds());
        } else if (request.supplierId() != null) {
            targetSuppliers.add(request.supplierId());
        } else {
            throw new IllegalArgumentException("At least one supplier ID must be provided for RFQ sourcing.");
        }

        LocalDateTime expiresAt = request.expiryDays() != null
                ? LocalDateTime.now().plusDays(request.expiryDays())
                : null;

        // 5. Instantiate Parent SourcingRequest
        SourcingRequest sourcingRequest = new SourcingRequest();
        sourcingRequest.setBuyerId(buyer.getId());
        sourcingRequest.setMasterProductId(targetMasterProductId);
        sourcingRequest.setProductId(finalProductId);
        sourcingRequest.setTargetQuantity(request.quantity());
        sourcingRequest.setUnit(request.unit());
        sourcingRequest.setStatus(SourcingRequestStatus.OPEN);
        sourcingRequest.setExpiresAt(expiresAt);
        sourcingRequest.setNotes(request.message());
        SourcingRequest savedSourcingReq = sourcingRequestRepository.save(sourcingRequest);

        List<Rfq> createdRfqs = new ArrayList<>();
        for (Long sId : targetSuppliers) {
            Supplier supp = supplierRepository.findById(sId)
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + sId));

            if (supp.getUser() != null && supp.getUser().getStatus() != null && supp.getUser().getStatus() != com.synthora.identity.UserStatus.ACTIVE) {
                throw new IllegalStateException("Supplier account is inactive: " + sId);
            }

            Rfq rfq = new Rfq();
            rfq.setSourcingRequestId(savedSourcingReq.getId());
            rfq.setSourcingRequestReference(savedSourcingReq.getSourcingRequestReference());
            rfq.setBuyerId(buyer.getId());
            rfq.setProductId(finalProductId);
            rfq.setMasterProductId(targetMasterProductId);
            rfq.setSupplierOfferingId(targetOfferingId);
            rfq.setSupplierId(supp.getId());
            rfq.setQuantity(request.quantity());
            rfq.setUnit(request.unit());
            rfq.setMessage(request.message());
            rfq.setExpiresAt(expiresAt);

            Rfq saved = rfqRepository.save(rfq);
            createdRfqs.add(saved);

            eventPublisher.publishEvent(new RfqSubmittedEvent(
                    saved.getId(),
                    saved.getBuyerId(),
                    saved.getSupplierId()
            ));
        }

        Rfq primaryRfq = createdRfqs.get(0);
        return buildSingleRfqResponse(primaryRfq, buyer.getName(), null, null);
    }

    public List<RfqResponse> getMyRfqs(Authentication authentication) {

        String email = authentication.getName();

        User buyer = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Rfq> rfqs = rfqRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        if (rfqs.isEmpty()) {
            return List.of();
        }

        Set<UUID> productIds = rfqs.stream().map(Rfq::getProductId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<UUID> masterProductIds = rfqs.stream().map(Rfq::getMasterProductId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<UUID> offeringIds = rfqs.stream().map(Rfq::getSupplierOfferingId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<Long> supplierIds = rfqs.stream().map(Rfq::getSupplierId).filter(Objects::nonNull).collect(Collectors.toSet());

        Map<UUID, String> productNames = productIds.isEmpty() ? Collections.emptyMap() : productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, Product::getName, (a, b) -> a));
        Map<UUID, String> masterProductNames = masterProductIds.isEmpty() ? Collections.emptyMap() : masterProductRepository.findAllById(masterProductIds).stream()
                .collect(Collectors.toMap(MasterProduct::getId, MasterProduct::getName, (a, b) -> a));
        Map<UUID, String> offeringNames = offeringIds.isEmpty() ? Collections.emptyMap() : supplierOfferingRepository.findAllById(offeringIds).stream()
                .filter(o -> o.getMasterProduct() != null)
                .collect(Collectors.toMap(SupplierOffering::getId, o -> o.getMasterProduct().getName(), (a, b) -> a));
        Map<Long, String> supplierNames = supplierIds.isEmpty() ? Collections.emptyMap() : supplierRepository.findAllById(supplierIds).stream()
                .collect(Collectors.toMap(Supplier::getId, Supplier::getName, (a, b) -> a));

        return rfqs.stream().map(rfq -> {
            String rfqRef = deriveRfqReference(rfq);
            String prodName = null;
            if (rfq.getMasterProductId() != null) {
                prodName = masterProductNames.get(rfq.getMasterProductId());
            }
            if (prodName == null && rfq.getProductId() != null) {
                prodName = productNames.get(rfq.getProductId());
            }
            if (prodName == null && rfq.getSupplierOfferingId() != null) {
                prodName = offeringNames.get(rfq.getSupplierOfferingId());
            }
            if (prodName == null) {
                prodName = "Specialty Chemical Product";
            }
            String suppName = supplierNames.getOrDefault(rfq.getSupplierId(), "Supplier #" + rfq.getSupplierId());

            return new RfqResponse(
                    rfq.getId(),
                    rfqRef,
                    rfq.getSourcingRequestId(),
                    rfq.getSourcingRequestReference(),
                    rfq.getBuyerId(),
                    buyer.getName(),
                    rfq.getProductId(),
                    rfq.getMasterProductId(),
                    rfq.getSupplierOfferingId(),
                    prodName,
                    rfq.getSupplierId(),
                    suppName,
                    rfq.getQuantity(),
                    rfq.getUnit(),
                    rfq.getMessage(),
                    rfq.getStatus(),
                    rfq.getExpiresAt(),
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

    public List<SourcingRequestResponse> getSourcingRequests(Authentication authentication) {
        String email = authentication.getName();

        User buyer = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<SourcingRequest> sourcingRequests = sourcingRequestRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        if (sourcingRequests.isEmpty()) {
            return List.of();
        }

        List<RfqResponse> buyerRfqs = getMyRfqs(authentication);
        Map<UUID, List<RfqResponse>> rfqMap = buyerRfqs.stream()
                .filter(r -> r.sourcingRequestId() != null)
                .collect(Collectors.groupingBy(RfqResponse::sourcingRequestId));

        return sourcingRequests.stream().map(sr -> {
            List<RfqResponse> participations = rfqMap.getOrDefault(sr.getId(), List.of());
            String prodName = "Chemical Sourcing Request";
            if (sr.getMasterProductId() != null) {
                prodName = masterProductRepository.findById(sr.getMasterProductId())
                        .map(MasterProduct::getName)
                        .orElse(prodName);
            } else if (sr.getProductId() != null) {
                prodName = productRepository.findById(sr.getProductId())
                        .map(Product::getName)
                        .orElse(prodName);
            }

            return new SourcingRequestResponse(
                    sr.getId(),
                    sr.getSourcingRequestReference(),
                    sr.getBuyerId(),
                    buyer.getName(),
                    sr.getMasterProductId(),
                    sr.getProductId(),
                    prodName,
                    sr.getTargetQuantity(),
                    sr.getUnit(),
                    sr.getStatus(),
                    sr.getExpiresAt(),
                    sr.getNotes(),
                    sr.getCreatedAt(),
                    participations
            );
        }).toList();
    }

    public SourcingRequestResponse getSourcingRequestDetail(UUID sourcingRequestId, Authentication authentication) {
        String email = authentication.getName();

        User buyer = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        SourcingRequest sr = sourcingRequestRepository.findByIdAndBuyerId(sourcingRequestId, buyer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("SourcingRequest not found: " + sourcingRequestId));

        List<RfqResponse> buyerRfqs = getMyRfqs(authentication);
        List<RfqResponse> participations = buyerRfqs.stream()
                .filter(r -> sr.getId().equals(r.sourcingRequestId()))
                .toList();

        String prodName = "Chemical Sourcing Request";
        if (sr.getMasterProductId() != null) {
            prodName = masterProductRepository.findById(sr.getMasterProductId())
                    .map(MasterProduct::getName)
                    .orElse(prodName);
        } else if (sr.getProductId() != null) {
            prodName = productRepository.findById(sr.getProductId())
                    .map(Product::getName)
                    .orElse(prodName);
        }

        return new SourcingRequestResponse(
                sr.getId(),
                sr.getSourcingRequestReference(),
                sr.getBuyerId(),
                buyer.getName(),
                sr.getMasterProductId(),
                sr.getProductId(),
                prodName,
                sr.getTargetQuantity(),
                sr.getUnit(),
                sr.getStatus(),
                sr.getExpiresAt(),
                sr.getNotes(),
                sr.getCreatedAt(),
                participations
        );
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

        Set<UUID> productIds = rfqs.stream().map(Rfq::getProductId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<UUID> masterProductIds = rfqs.stream().map(Rfq::getMasterProductId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<UUID> offeringIds = rfqs.stream().map(Rfq::getSupplierOfferingId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<UUID> buyerIds = rfqs.stream().map(Rfq::getBuyerId).filter(Objects::nonNull).collect(Collectors.toSet());

        Map<UUID, String> productNames = productIds.isEmpty() ? Collections.emptyMap() : productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, Product::getName, (a, b) -> a));
        Map<UUID, String> masterProductNames = masterProductIds.isEmpty() ? Collections.emptyMap() : masterProductRepository.findAllById(masterProductIds).stream()
                .collect(Collectors.toMap(MasterProduct::getId, MasterProduct::getName, (a, b) -> a));
        Map<UUID, String> offeringNames = offeringIds.isEmpty() ? Collections.emptyMap() : supplierOfferingRepository.findAllById(offeringIds).stream()
                .filter(o -> o.getMasterProduct() != null)
                .collect(Collectors.toMap(SupplierOffering::getId, o -> o.getMasterProduct().getName(), (a, b) -> a));
        Map<UUID, String> buyerNames = buyerIds.isEmpty() ? Collections.emptyMap() : userRepository.findAllById(buyerIds).stream()
                .collect(Collectors.toMap(User::getId, User::getName, (a, b) -> a));

        return rfqs.stream().map(rfq -> {
            String rfqRef = deriveRfqReference(rfq);
            String prodName = null;
            if (rfq.getMasterProductId() != null) {
                prodName = masterProductNames.get(rfq.getMasterProductId());
            }
            if (prodName == null && rfq.getProductId() != null) {
                prodName = productNames.get(rfq.getProductId());
            }
            if (prodName == null && rfq.getSupplierOfferingId() != null) {
                prodName = offeringNames.get(rfq.getSupplierOfferingId());
            }
            if (prodName == null) {
                prodName = "Specialty Chemical Product";
            }
            String bName = buyerNames.getOrDefault(rfq.getBuyerId(), "Buyer Organization");

            return new RfqResponse(
                    rfq.getId(),
                    rfqRef,
                    rfq.getSourcingRequestId(),
                    rfq.getSourcingRequestReference(),
                    rfq.getBuyerId(),
                    bName,
                    rfq.getProductId(),
                    rfq.getMasterProductId(),
                    rfq.getSupplierOfferingId(),
                    prodName,
                    rfq.getSupplierId(),
                    supplier.getName(),
                    rfq.getQuantity(),
                    rfq.getUnit(),
                    rfq.getMessage(),
                    rfq.getStatus(),
                    rfq.getExpiresAt(),
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

    public RfqResponse cancelRfq(UUID rfqId, String reason, Authentication authentication) {
        String email = authentication.getName();
        User buyer = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Rfq rfq = rfqRepository.findByIdAndBuyerIdForUpdate(rfqId, buyer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found"));

        if (rfq.getStatus() == RfqStatus.ACCEPTED || rfq.getStatus() == RfqStatus.CLOSED) {
            throw new IllegalStateException("Cannot cancel RFQ in status: " + rfq.getStatus());
        }

        rfq.setStatus(RfqStatus.CANCELLED);
        Rfq saved = rfqRepository.save(rfq);

        eventPublisher.publishEvent(new RfqCancelledEvent(
                saved.getId(),
                saved.getBuyerId(),
                saved.getSupplierId(),
                reason
        ));

        return buildSingleRfqResponse(saved, buyer.getName(), null, null);
    }

    public SourcingRequestResponse cancelSourcingRequest(UUID sourcingRequestId, String reason, Authentication authentication) {
        String email = authentication.getName();
        User buyer = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        SourcingRequest sr = sourcingRequestRepository.findByIdAndBuyerId(sourcingRequestId, buyer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("SourcingRequest not found: " + sourcingRequestId));

        sr.setStatus(SourcingRequestStatus.CANCELLED);
        sourcingRequestRepository.save(sr);

        List<Rfq> childRfqs = rfqRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId())
                .stream()
                .filter(r -> sr.getId().equals(r.getSourcingRequestId()))
                .toList();

        for (Rfq rfq : childRfqs) {
            if (rfq.getStatus() != RfqStatus.ACCEPTED && rfq.getStatus() != RfqStatus.CLOSED && rfq.getStatus() != RfqStatus.CANCELLED) {
                rfq.setStatus(RfqStatus.CANCELLED);
                Rfq saved = rfqRepository.save(rfq);
                eventPublisher.publishEvent(new RfqCancelledEvent(
                        saved.getId(),
                        saved.getBuyerId(),
                        saved.getSupplierId(),
                        reason
                ));
            }
        }

        return getSourcingRequestDetail(sourcingRequestId, authentication);
    }

    private com.synthora.rfq.dto.QuotationResponse mapToQuotationResponse(com.synthora.rfq.quotation.Quotation q) {
        return new com.synthora.rfq.dto.QuotationResponse(
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
                q.getActorType(),
                q.getActionType(),
                q.getCommercialMessage(),
                q.getCreatedAt()
        );
    }

    public com.synthora.rfq.dto.QuotationResponse submitQuotation(
            UUID rfqId,
            com.synthora.rfq.dto.CreateQuotationRequest request,
            Authentication authentication) {

        String email = authentication.getName();
        User supplierUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (supplierUser.getStatus() != null && supplierUser.getStatus() != com.synthora.identity.UserStatus.ACTIVE) {
            throw new IllegalStateException("Supplier user is inactive.");
        }

        Supplier supplier = supplierRepository.findByUser(supplierUser)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier profile not found"));

        Rfq rfq = rfqRepository.findByIdAndSupplierIdForUpdate(rfqId, supplier.getId())
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found"));

        if (rfq.getStatus() == RfqStatus.CANCELLED) {
            throw new IllegalStateException("Cannot submit quotation for cancelled RFQ.");
        }

        validateRfqActive(rfq, "submit quotation");

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
        quotation.setActorType("SUPPLIER");
        quotation.setActionType(nextVersion == 1 ? "INITIAL_QUOTATION" : "REVISED_QUOTATION");
        quotation.setCommercialMessage(request.commercialNotes());

        com.synthora.rfq.quotation.Quotation saved = quotationRepository.save(quotation);

        rfq.setStatus(RfqStatus.QUOTED);
        rfqRepository.save(rfq);

        eventPublisher.publishEvent(new QuotationSubmittedEvent(
                saved.getId(),
                rfq.getId(),
                rfq.getBuyerId(),
                rfq.getSupplierId()
        ));

        return mapToQuotationResponse(saved);
    }

    public com.synthora.rfq.dto.QuotationResponse submitCounterOffer(
            UUID rfqId,
            com.synthora.rfq.dto.CreateCounterOfferRequest request,
            Authentication authentication) {

        String email = authentication.getName();
        User buyer = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Rfq rfq = rfqRepository.findByIdAndBuyerIdForUpdate(rfqId, buyer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found"));

        validateRfqActive(rfq, "submit counter offer");

        if (rfq.getStatus() != RfqStatus.QUOTED && rfq.getStatus() != RfqStatus.COUNTERED) {
            throw new IllegalStateException("Cannot submit counter offer for RFQ in status: " + rfq.getStatus());
        }

        Integer maxVersion = quotationRepository.findMaxQuotationVersionByRfqId(rfq.getId());
        if (maxVersion == null || maxVersion == 0) {
            throw new IllegalStateException("Cannot submit counter offer when no prior quotation exists.");
        }

        com.synthora.rfq.quotation.Quotation latestQuote = quotationRepository.findByRfqIdOrderByQuotationVersionDesc(rfq.getId())
                .stream().findFirst().orElse(null);

        java.time.LocalDate validityDate = (latestQuote != null && latestQuote.getValidityDate() != null)
                ? latestQuote.getValidityDate()
                : java.time.LocalDate.now().plusDays(30);

        Integer nextVersion = maxVersion + 1;

        com.synthora.rfq.quotation.Quotation counterQuotation = new com.synthora.rfq.quotation.Quotation();
        counterQuotation.setRfq(rfq);
        counterQuotation.setQuotationVersion(nextVersion);
        counterQuotation.setUnitPrice(request.unitPrice());
        counterQuotation.setCurrency(request.currency());
        counterQuotation.setMinimumOrderQuantity(request.minimumOrderQuantity());
        counterQuotation.setLeadTimeDays(request.leadTimeDays());
        counterQuotation.setValidityDate(validityDate);
        counterQuotation.setPackagingDetails(request.packagingDetails());
        counterQuotation.setCommercialNotes(request.commercialMessage());
        counterQuotation.setActorType("BUYER");
        counterQuotation.setActionType("COUNTER_OFFER");
        counterQuotation.setCommercialMessage(request.commercialMessage());

        com.synthora.rfq.quotation.Quotation saved = quotationRepository.save(counterQuotation);

        rfq.setStatus(RfqStatus.COUNTERED);
        rfqRepository.save(rfq);

        eventPublisher.publishEvent(new com.synthora.notification.events.CounterOfferSubmittedEvent(
                saved.getId(),
                rfq.getId(),
                rfq.getBuyerId(),
                rfq.getSupplierId(),
                saved.getUnitPrice(),
                saved.getCurrency()
        ));

        return mapToQuotationResponse(saved);
    }

    public List<com.synthora.rfq.dto.QuotationResponse> getBuyerQuotations(UUID rfqId, Authentication authentication) {

        String email = authentication.getName();
        User buyer = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Rfq rfq = rfqRepository.findByIdAndBuyerId(rfqId, buyer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found"));

        return quotationRepository.findByRfqIdOrderByQuotationVersionDesc(rfq.getId())
                .stream()
                .map(this::mapToQuotationResponse)
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

        validateRfqActive(rfq, "accept quotation");

        if (rfq.getStatus() != RfqStatus.QUOTED && rfq.getStatus() != RfqStatus.COUNTERED) {
            throw new IllegalStateException("Cannot accept quotation for RFQ in status: " + rfq.getStatus());
        }

        com.synthora.rfq.quotation.Quotation quotation = quotationRepository.findByIdAndRfqId(quotationId, rfq.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found"));

        if (quotation.getValidityDate() != null && quotation.getValidityDate().isBefore(java.time.LocalDate.now())) {
            throw new IllegalStateException("Cannot accept an expired quotation.");
        }

        Supplier supplier = supplierRepository.findById(rfq.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + rfq.getSupplierId()));

        if (supplier.getUser() != null && supplier.getUser().getStatus() != null && supplier.getUser().getStatus() != com.synthora.identity.UserStatus.ACTIVE) {
            throw new IllegalStateException("Supplier account is not active.");
        }

        Integer maxVersion = quotationRepository.findMaxQuotationVersionByRfqId(rfq.getId());
        if (!quotation.getQuotationVersion().equals(maxVersion)) {
            throw new IllegalStateException("Cannot accept an outdated quotation version. Latest version is " + maxVersion);
        }

        rfq.setStatus(RfqStatus.ACCEPTED);
        rfq.setAcceptedQuotationId(quotation.getId());
        rfqRepository.save(rfq);

        // Update SourcingRequest status to COMPLETED if all or any accepted
        if (rfq.getSourcingRequestId() != null) {
            sourcingRequestRepository.findById(rfq.getSourcingRequestId()).ifPresent(sr -> {
                sr.setStatus(SourcingRequestStatus.COMPLETED);
                sourcingRequestRepository.save(sr);
            });
        }

        eventPublisher.publishEvent(new QuotationAcceptedEvent(
                quotation.getId(),
                rfq.getId(),
                rfq.getBuyerId(),
                rfq.getSupplierId()
        ));

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

        validateRfqActive(rfq, "reject quotation");

        if (rfq.getStatus() != RfqStatus.QUOTED && rfq.getStatus() != RfqStatus.COUNTERED) {
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

        eventPublisher.publishEvent(new QuotationRejectedEvent(
                quotation.getId(),
                rfq.getId(),
                rfq.getBuyerId(),
                rfq.getSupplierId()
        ));

        return new com.synthora.rfq.dto.QuotationDecisionResponse(
                rfq.getId(),
                quotation.getId(),
                quotation.getQuotationVersion(),
                rfq.getStatus(),
                "REJECTED",
                java.time.LocalDateTime.now()
        );
    }

    public List<com.synthora.rfq.dto.QuotationResponse> getSupplierQuotations(UUID rfqId, Authentication authentication) {

        String email = authentication.getName();
        User supplierUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Supplier supplier = supplierRepository.findByUser(supplierUser)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier profile not found"));

        Rfq rfq = rfqRepository.findByIdAndSupplierId(rfqId, supplier.getId())
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found"));

        return quotationRepository.findByRfqIdOrderByQuotationVersionDesc(rfq.getId())
                .stream()
                .map(this::mapToQuotationResponse)
                .toList();
    }

    public com.synthora.rfq.dto.QuotationDecisionResponse acceptSupplierCounterOffer(
            UUID rfqId,
            UUID quotationId,
            com.synthora.rfq.dto.AcceptQuotationRequest request,
            Authentication authentication) {

        String email = authentication.getName();
        User supplierUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Supplier supplier = supplierRepository.findByUser(supplierUser)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier profile not found"));

        Rfq rfq = rfqRepository.findByIdAndSupplierIdForUpdate(rfqId, supplier.getId())
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found"));

        validateRfqActive(rfq, "accept counter offer");

        if (rfq.getStatus() != RfqStatus.COUNTERED && rfq.getStatus() != RfqStatus.QUOTED) {
            throw new IllegalStateException("Cannot accept quotation for RFQ in status: " + rfq.getStatus());
        }

        com.synthora.rfq.quotation.Quotation quotation = quotationRepository.findByIdAndRfqId(quotationId, rfq.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found"));

        if (quotation.getValidityDate() != null && quotation.getValidityDate().isBefore(java.time.LocalDate.now())) {
            throw new IllegalStateException("Cannot accept an expired quotation.");
        }

        Integer maxVersion = quotationRepository.findMaxQuotationVersionByRfqId(rfq.getId());
        if (!quotation.getQuotationVersion().equals(maxVersion)) {
            throw new IllegalStateException("Cannot accept an outdated quotation version. Latest version is " + maxVersion);
        }

        rfq.setStatus(RfqStatus.ACCEPTED);
        rfq.setAcceptedQuotationId(quotation.getId());
        rfqRepository.save(rfq);

        if (rfq.getSourcingRequestId() != null) {
            sourcingRequestRepository.findById(rfq.getSourcingRequestId()).ifPresent(sr -> {
                sr.setStatus(SourcingRequestStatus.COMPLETED);
                sourcingRequestRepository.save(sr);
            });
        }

        eventPublisher.publishEvent(new QuotationAcceptedEvent(
                quotation.getId(),
                rfq.getId(),
                rfq.getBuyerId(),
                rfq.getSupplierId()
        ));

        return new com.synthora.rfq.dto.QuotationDecisionResponse(
                rfq.getId(),
                quotation.getId(),
                quotation.getQuotationVersion(),
                rfq.getStatus(),
                "ACCEPTED",
                java.time.LocalDateTime.now()
        );
    }

    public com.synthora.rfq.dto.QuotationDecisionResponse rejectSupplierCounterOffer(
            UUID rfqId,
            UUID quotationId,
            com.synthora.rfq.dto.RejectQuotationRequest request,
            Authentication authentication) {

        String email = authentication.getName();
        User supplierUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Supplier supplier = supplierRepository.findByUser(supplierUser)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier profile not found"));

        Rfq rfq = rfqRepository.findByIdAndSupplierIdForUpdate(rfqId, supplier.getId())
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found"));

        validateRfqActive(rfq, "reject counter offer");

        if (rfq.getStatus() != RfqStatus.COUNTERED && rfq.getStatus() != RfqStatus.QUOTED && rfq.getStatus() != RfqStatus.PENDING) {
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

        eventPublisher.publishEvent(new QuotationRejectedEvent(
                quotation.getId(),
                rfq.getId(),
                rfq.getBuyerId(),
                rfq.getSupplierId()
        ));

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