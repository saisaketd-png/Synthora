package com.kemkendra.product.verification;

import com.kemkendra.product.SupplierOffering;
import com.kemkendra.product.dto.BestMatchExplanationDto;
import com.kemkendra.seller.SupplierVerificationStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
public class BestMatchScoringEngine {

    public BestMatchExplanationDto calculateBestMatch(SupplierOffering offering) {
        if (offering == null) {
            return new BestMatchExplanationDto(false, 0, List.of(), "No offering provided.");
        }

        int score = 0;
        List<String> factors = new ArrayList<>();

        if (offering.getSupplier() != null && offering.getSupplier().getVerificationStatus() == SupplierVerificationStatus.VERIFIED) {
            score += 20;
            factors.add("Verified Supplier Corporate Identity");
        }

        if ("APPROVED".equalsIgnoreCase(offering.getModerationStatus())) {
            score += 20;
            factors.add("Verified Commercial Offering Specification");
        }

        if (Boolean.TRUE.equals(offering.getCoaAvailable())) {
            score += 10;
            factors.add("Certificate of Analysis (COA) Available");
        }

        if (Boolean.TRUE.equals(offering.getMsdsAvailable())) {
            score += 10;
            factors.add("Material Safety Data Sheet (MSDS) Available");
        }

        if (Boolean.TRUE.equals(offering.getExportReady())) {
            score += 10;
            factors.add("Export & Global Logistics Ready");
        }

        if (offering.getPurity() != null && offering.getPurity().compareTo(new BigDecimal("99.00")) >= 0) {
            score += 10;
            factors.add("High Purity Specification (" + offering.getPurity() + "%)");
        }

        if (offering.getMoqKg() != null && offering.getMoqKg().compareTo(new BigDecimal("100.00")) <= 0) {
            score += 10;
            factors.add("Flexible Minimum Order Quantity (" + offering.getMoqKg() + " kg)");
        }

        if (offering.getLeadTimeDays() != null && offering.getLeadTimeDays() <= 7) {
            score += 10;
            factors.add("Rapid Fulfillment Lead Time (" + offering.getLeadTimeDays() + " Days)");
        }

        boolean isBestMatch = score >= 70;
        String explanation = "Score: " + score + "/100 based on deterministic B2B compliance and commercial terms.";

        return new BestMatchExplanationDto(isBestMatch, score, factors, explanation);
    }
}
