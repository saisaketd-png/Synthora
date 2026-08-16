package com.synthora.rfq.apis;

import com.synthora.rfq.RfqService;
import com.synthora.rfq.dto.CreateRfqRequest;
import com.synthora.rfq.dto.RfqResponse;
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
    // BUYER RFQs
    // =========================

    @GetMapping("/my")
    public List<RfqResponse> getMyRfqs(
            Authentication authentication) {

        return rfqService.getMyRfqs(authentication);
    }

    @GetMapping("/{rfqId}")
    public RfqResponse getMyRfq(
            @PathVariable UUID rfqId,
            Authentication authentication) {

        return rfqService.getMyRfq(rfqId, authentication);
    }

    @GetMapping("/{rfqId}/quotations")
    public List<com.synthora.rfq.dto.QuotationResponse> getBuyerQuotations(
            @PathVariable UUID rfqId,
            Authentication authentication) {

        return rfqService.getBuyerQuotations(rfqId, authentication);
    }

    @PostMapping("/{rfqId}/quotations/{quotationId}/accept")
    public com.synthora.rfq.dto.QuotationDecisionResponse acceptQuotation(
            @PathVariable UUID rfqId,
            @PathVariable UUID quotationId,
            @RequestBody(required = false) com.synthora.rfq.dto.AcceptQuotationRequest request,
            Authentication authentication) {

        return rfqService.acceptQuotation(rfqId, quotationId, request, authentication);
    }

    @PostMapping("/{rfqId}/quotations/{quotationId}/reject")
    public com.synthora.rfq.dto.QuotationDecisionResponse rejectQuotation(
            @PathVariable UUID rfqId,
            @PathVariable UUID quotationId,
            @RequestBody(required = false) com.synthora.rfq.dto.RejectQuotationRequest request,
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
    public com.synthora.rfq.dto.QuotationResponse submitQuotation(
            @PathVariable UUID rfqId,
            @Valid @RequestBody com.synthora.rfq.dto.CreateQuotationRequest request,
            Authentication authentication) {

        return rfqService.submitQuotation(rfqId, request, authentication);
    }
}