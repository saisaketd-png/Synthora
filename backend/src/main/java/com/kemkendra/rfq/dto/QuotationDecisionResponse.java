package com.kemkendra.rfq.dto;

import com.kemkendra.rfq.RfqStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record QuotationDecisionResponse(
        UUID rfqId,
        UUID quotationId,
        Integer quotationVersion,
        RfqStatus rfqStatus,
        String decision,
        LocalDateTime decisionTimestamp
) {}
