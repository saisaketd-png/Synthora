package com.synthora.product.dto;

import java.math.BigDecimal;

public record ProductSupplierResponse(
        Long supplierId,
        String supplierName,
        String countryName,
        Boolean verified,
        Integer yearsInBusiness,
        Integer responseRate,   
        Boolean exportReady,
        String purity,
        String grade,
        BigDecimal moqKg,
        String packaging,
        Integer leadTimeDays,
        Boolean coaAvailable,
        Boolean msdsAvailable
) {}