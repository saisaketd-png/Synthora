package com.synthora.seller.verification;

import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.Set;

@Component
public class SupplierVerificationRequirementResolver {

    public Set<VerificationType> getMandatoryRequirements(String businessType) {
        String bt = (businessType != null ? businessType.trim().toUpperCase() : "MANUFACTURER");
        switch (bt) {
            case "DISTRIBUTOR":
            case "TRADER":
                return EnumSet.of(
                        VerificationType.LEGAL_IDENTITY,
                        VerificationType.TAX_IDENTITY,
                        VerificationType.BUSINESS_ADDRESS,
                        VerificationType.BUSINESS_TYPE,
                        VerificationType.CONTACT_INFORMATION,
                        VerificationType.WEBSITE,
                        VerificationType.EXPORT_CAPABILITY
                );
            case "MANUFACTURER":
            default:
                return EnumSet.of(
                        VerificationType.LEGAL_IDENTITY,
                        VerificationType.TAX_IDENTITY,
                        VerificationType.BUSINESS_ADDRESS,
                        VerificationType.BUSINESS_TYPE,
                        VerificationType.CONTACT_INFORMATION,
                        VerificationType.WEBSITE,
                        VerificationType.COMPLIANCE_CERTIFICATION,
                        VerificationType.BUSINESS_OPERATION
                );
        }
    }

    public boolean isMandatory(String businessType, VerificationType verificationType) {
        return getMandatoryRequirements(businessType).contains(verificationType);
    }
}
