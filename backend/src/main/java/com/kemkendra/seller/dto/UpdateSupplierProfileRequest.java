package com.kemkendra.seller.dto;

public record UpdateSupplierProfileRequest(
        String name,
        String legalName,
        String tradeName,
        String businessType,
        String registeredAddress,
        String stateProvince,
        String city,
        String postalCode,
        String countryCode,
        String countryName,
        String businessEmail,
        String businessPhone,
        String authorizedRepresentativeName,
        String authorizedRepresentativeDesignation,
        String website,
        String taxVatNumber,
        String companyRegistrationNumber,
        String businessDescription,
        String countriesServed,
        String primaryCategories,
        Integer yearsInBusiness,
        Boolean exportReady
) {}
