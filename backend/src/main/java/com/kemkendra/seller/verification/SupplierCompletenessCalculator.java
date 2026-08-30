package com.kemkendra.seller.verification;

import com.kemkendra.document.Document;
import com.kemkendra.document.DocumentRepository;
import com.kemkendra.product.Supplier;
import com.kemkendra.product.SupplierOfferingRepository;
import com.kemkendra.seller.verification.dto.SupplierCompletenessDto;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SupplierCompletenessCalculator {

    private final DocumentRepository documentRepository;
    private final SupplierOfferingRepository supplierOfferingRepository;

    public SupplierCompletenessCalculator(DocumentRepository documentRepository, SupplierOfferingRepository supplierOfferingRepository) {
        this.documentRepository = documentRepository;
        this.supplierOfferingRepository = supplierOfferingRepository;
    }

    public SupplierCompletenessDto calculateCompleteness(Supplier supplier) {
        if (supplier == null) {
            return new SupplierCompletenessDto(0, false, false, false, false, false, false, false);
        }

        boolean companyIdentity = supplier.getLegalName() != null && !supplier.getLegalName().isBlank()
                && supplier.getCompanyRegistrationNumber() != null && !supplier.getCompanyRegistrationNumber().isBlank();

        boolean businessInfo = supplier.getBusinessType() != null && !supplier.getBusinessType().isBlank()
                && supplier.getBusinessDescription() != null && !supplier.getBusinessDescription().isBlank();

        boolean contactInfo = supplier.getBusinessEmail() != null && !supplier.getBusinessEmail().isBlank()
                && supplier.getBusinessPhone() != null && !supplier.getBusinessPhone().isBlank()
                && supplier.getCity() != null && !supplier.getCity().isBlank();

        boolean taxInfo = supplier.getTaxVatNumber() != null && !supplier.getTaxVatNumber().isBlank();

        // Documents check if supplier user ID exists
        boolean businessDocs = false;
        boolean complianceDocs = false;
        if (supplier.getUser() != null) {
            List<Document> docs = documentRepository.findByUploadedBy(supplier.getUser().getId());
            businessDocs = !docs.isEmpty();
            complianceDocs = docs.size() >= 2;
        }

        // Catalog check
        boolean catalogInfo = supplierOfferingRepository.countBySupplierId(supplier.getId()) > 0;

        int count = 0;
        if (companyIdentity) count++;
        if (businessInfo) count++;
        if (contactInfo) count++;
        if (taxInfo) count++;
        if (businessDocs) count++;
        if (complianceDocs) count++;
        if (catalogInfo) count++;

        int percentage = (count * 100) / 7;

        return new SupplierCompletenessDto(
                percentage,
                companyIdentity,
                businessInfo,
                contactInfo,
                taxInfo,
                businessDocs,
                complianceDocs,
                catalogInfo
        );
    }
}
