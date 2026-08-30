package com.kemkendra.product;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
public class MasterProductCodeGenerator {

    private final MasterProductRepository masterProductRepository;
    private final SecureRandom random = new SecureRandom();

    public MasterProductCodeGenerator(MasterProductRepository masterProductRepository) {
        this.masterProductRepository = masterProductRepository;
    }

    /**
     * Generates a unique, human-readable, collision-resistant master product code.
     * Example: API-MP-100428, INT-MP-294819, SYN-MP-583920
     */
    public String generateMasterProductCode(ProductCategory category) {
        String prefix = getCategoryPrefix(category);

        for (int attempt = 0; attempt < 50; attempt++) {
            int numericPart = 100000 + random.nextInt(900000);
            String candidateCode = prefix + "-MP-" + numericPart;
            if (!masterProductRepository.existsByMasterProductCode(candidateCode)) {
                return candidateCode;
            }
        }

        return prefix + "-MP-" + (System.currentTimeMillis() % 10000000);
    }

    private String getCategoryPrefix(ProductCategory category) {
        if (category == null) {
            return "SYN";
        }
        return switch (category) {
            case API -> "API";
            case INTERMEDIATE -> "INT";
            case EXCIPIENT -> "EXC";
            case SOLVENT -> "SOL";
            case SPECIALTY_CHEMICAL -> "SPC";
            case LAB_CHEMICAL -> "LAB";
            default -> "SYN";
        };
    }
}
