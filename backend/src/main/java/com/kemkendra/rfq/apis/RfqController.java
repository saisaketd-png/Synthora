package com.kemkendra.rfq.apis;

import com.kemkendra.rfq.RfqService;
import com.kemkendra.rfq.dto.CreateRfqRequest;
import com.kemkendra.rfq.dto.RfqResponse;
import com.kemkendra.rfq.dto.SourcingRequestResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rfqs")
public class RfqController {

    private final RfqService rfqService;

    public RfqController(RfqService rfqService) {
        this.rfqService = rfqService;
    }

    // =========================
    // BUYER RFQs & SOURCING REQUESTS
    // =========================

    @GetMapping("/my")
    public List<RfqResponse> getMyRfqs(
            Authentication authentication) {

        return rfqService.getMyRfqs(authentication);
    }

    @GetMapping("/sourcing-requests")
    public List<SourcingRequestResponse> getSourcingRequests(
            Authentication authentication) {

        return rfqService.getSourcingRequests(authentication);
    }

    @GetMapping("/sourcing-requests/{sourcingRequestId}")
    public SourcingRequestResponse getSourcingRequestDetail(
            @PathVariable UUID sourcingRequestId,
            Authentication authentication) {

        return rfqService.getSourcingRequestDetail(sourcingRequestId, authentication);
    }

    @GetMapping("/{rfqId}")
    public RfqResponse getMyRfq(
            @PathVariable UUID rfqId,
            Authentication authentication) {

        return rfqService.getMyRfq(rfqId, authentication);
    }

    @GetMapping("/{rfqId}/quotations")
    public List<com.kemkendra.rfq.dto.QuotationResponse> getBuyerQuotations(
            @PathVariable UUID rfqId,
            Authentication authentication) {

        return rfqService.getBuyerQuotations(rfqId, authentication);
    }

    @PostMapping("/{rfqId}/counter-offer")
    @ResponseStatus(HttpStatus.CREATED)
    public com.kemkendra.rfq.dto.QuotationResponse submitCounterOffer(
            @PathVariable UUID rfqId,
            @Valid @RequestBody com.kemkendra.rfq.dto.CreateCounterOfferRequest request,
            Authentication authentication) {

        return rfqService.submitCounterOffer(rfqId, request, authentication);
    }

    @PostMapping("/{rfqId}/cancel")
    public RfqResponse cancelRfq(
            @PathVariable UUID rfqId,
            @RequestParam(required = false) String reason,
            Authentication authentication) {

        return rfqService.cancelRfq(rfqId, reason, authentication);
    }

    @PostMapping("/sourcing-requests/{sourcingRequestId}/cancel")
    public SourcingRequestResponse cancelSourcingRequest(
            @PathVariable UUID sourcingRequestId,
            @RequestParam(required = false) String reason,
            Authentication authentication) {

        return rfqService.cancelSourcingRequest(sourcingRequestId, reason, authentication);
    }

    @PostMapping("/{rfqId}/quotations/{quotationId}/accept")
    public com.kemkendra.rfq.dto.QuotationDecisionResponse acceptQuotation(
            @PathVariable UUID rfqId,
            @PathVariable UUID quotationId,
            @RequestBody(required = false) com.kemkendra.rfq.dto.AcceptQuotationRequest request,
            Authentication authentication) {

        return rfqService.acceptQuotation(rfqId, quotationId, request, authentication);
    }

    @PostMapping("/{rfqId}/quotations/{quotationId}/reject")
    public com.kemkendra.rfq.dto.QuotationDecisionResponse rejectQuotation(
            @PathVariable UUID rfqId,
            @PathVariable UUID quotationId,
            @RequestBody(required = false) com.kemkendra.rfq.dto.RejectQuotationRequest request,
            Authentication authentication) {

        return rfqService.rejectQuotation(rfqId, quotationId, request, authentication);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RfqResponse createRfq(
            @Valid @RequestBody CreateRfqRequest request,
            Authentication authentication) {

        return rfqService.createRfq(request, authentication);
    }

    // =========================
    // SUPPLIER RFQs
    // =========================

    @PreAuthorize("hasRole('SUPPLIER')")
    @GetMapping("/supplier")
    public List<RfqResponse> getSupplierRfqs(
            Authentication authentication) {

        return rfqService.getSupplierRfqs(authentication);
    }

    @PreAuthorize("hasRole('SUPPLIER')")
    @GetMapping("/supplier/{rfqId}")
    public RfqResponse getSupplierRfq(
            @PathVariable UUID rfqId,
            Authentication authentication) {

        return rfqService.getSupplierRfq(rfqId, authentication);
    }

    @PreAuthorize("hasRole('SUPPLIER')")
    @PostMapping("/supplier/{rfqId}/quotations")
    @ResponseStatus(HttpStatus.CREATED)
    public com.kemkendra.rfq.dto.QuotationResponse submitQuotation(
            @PathVariable UUID rfqId,
            @Valid @RequestBody com.kemkendra.rfq.dto.CreateQuotationRequest request,
            Authentication authentication) {

        return rfqService.submitQuotation(rfqId, request, authentication);
    }

    @PreAuthorize("hasRole('SUPPLIER')")
    @GetMapping("/supplier/{rfqId}/quotations")
    public List<com.kemkendra.rfq.dto.QuotationResponse> getSupplierQuotations(
            @PathVariable UUID rfqId,
            Authentication authentication) {

        return rfqService.getSupplierQuotations(rfqId, authentication);
    }

    @PreAuthorize("hasRole('SUPPLIER')")
    @PostMapping("/supplier/{rfqId}/quotations/{quotationId}/accept")
    public com.kemkendra.rfq.dto.QuotationDecisionResponse acceptSupplierCounterOffer(
            @PathVariable UUID rfqId,
            @PathVariable UUID quotationId,
            @RequestBody(required = false) com.kemkendra.rfq.dto.AcceptQuotationRequest request,
            Authentication authentication) {

        return rfqService.acceptSupplierCounterOffer(rfqId, quotationId, request, authentication);
    }

    @PreAuthorize("hasRole('SUPPLIER')")
    @PostMapping("/supplier/{rfqId}/quotations/{quotationId}/reject")
    public com.kemkendra.rfq.dto.QuotationDecisionResponse rejectSupplierCounterOffer(
            @PathVariable UUID rfqId,
            @PathVariable UUID quotationId,
            @RequestBody(required = false) com.kemkendra.rfq.dto.RejectQuotationRequest request,
            Authentication authentication) {

        return rfqService.rejectSupplierCounterOffer(rfqId, quotationId, request, authentication);
    }
}