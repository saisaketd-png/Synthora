package com.synthora.product.verification;

import com.synthora.document.Document;
import com.synthora.document.DocumentRepository;
import com.synthora.product.SupplierOffering;
import com.synthora.product.verification.dto.SupplierOfferingCompletenessDto;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class SupplierOfferingCompletenessCalculator {

    private final DocumentRepository documentRepository;

    public SupplierOfferingCompletenessCalculator(DocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    public SupplierOfferingCompletenessDto calculateCompleteness(SupplierOffering offering) {
        if (offering == null) {
            return new SupplierOfferingCompletenessDto(0, false, false, false, false, false, false, false, false);
        }

        boolean commercialTerms = offering.getPrice() != null && offering.getPrice().compareTo(BigDecimal.ZERO) > 0
                && offering.getCurrency() != null && !offering.getCurrency().isBlank()
                && offering.getStock() != null && offering.getStock() >= 0;

        boolean purityAndGrade = offering.getPurity() != null && offering.getPurity().compareTo(BigDecimal.ZERO) > 0
                && offering.getGrade() != null && !offering.getGrade().isBlank();

        boolean moqAndPackaging = offering.getMoqKg() != null && offering.getMoqKg().compareTo(BigDecimal.ZERO) > 0
                && offering.getPackaging() != null && !offering.getPackaging().isBlank();

        boolean leadTimeAndAvailability = offering.getLeadTimeDays() != null && offering.getLeadTimeDays() >= 0
                && offering.getAvailabilityStatus() != null && !offering.getAvailabilityStatus().isBlank();

        boolean coa = Boolean.TRUE.equals(offering.getCoaAvailable());
        boolean msds = Boolean.TRUE.equals(offering.getMsdsAvailable());
        boolean exportInfo = Boolean.TRUE.equals(offering.getExportReady());

        boolean imagesOrTechData = false;
        if (offering.getSupplier() != null && offering.getSupplier().getUser() != null) {
            List<Document> docs = documentRepository.findByUploadedBy(offering.getSupplier().getUser().getId());
            imagesOrTechData = !docs.isEmpty();
        }

        int count = 0;
        if (commercialTerms) count++;
        if (purityAndGrade) count++;
        if (moqAndPackaging) count++;
        if (leadTimeAndAvailability) count++;
        if (coa) count++;
        if (msds) count++;
        if (exportInfo) count++;
        if (imagesOrTechData) count++;

        int percentage = (count * 100) / 8;

        return new SupplierOfferingCompletenessDto(
                percentage,
                commercialTerms,
                purityAndGrade,
                moqAndPackaging,
                leadTimeAndAvailability,
                coa,
                msds,
                exportInfo,
                imagesOrTechData
        );
    }
}
