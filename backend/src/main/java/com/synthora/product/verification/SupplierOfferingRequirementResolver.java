package com.synthora.product.verification;

import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.Set;

@Component
public class SupplierOfferingRequirementResolver {

    public Set<OfferingVerificationType> getMandatoryRequirements() {
        return EnumSet.of(
                OfferingVerificationType.PRICE,
                OfferingVerificationType.CURRENCY,
                OfferingVerificationType.PURITY,
                OfferingVerificationType.GRADE,
                OfferingVerificationType.MOQ,
                OfferingVerificationType.PACKAGING,
                OfferingVerificationType.LEAD_TIME,
                OfferingVerificationType.STOCK,
                OfferingVerificationType.AVAILABILITY,
                OfferingVerificationType.MASTER_PRODUCT_CONSISTENCY,
                OfferingVerificationType.SUPPLIER_OWNERSHIP
        );
    }

    public boolean isMandatory(OfferingVerificationType verificationType) {
        return getMandatoryRequirements().contains(verificationType);
    }
}
