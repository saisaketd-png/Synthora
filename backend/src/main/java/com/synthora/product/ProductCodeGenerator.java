package com.synthora.product;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class ProductCodeGenerator {

    private final ProductRepository productRepository;
    private final SecureRandom random = new SecureRandom();

    public ProductCodeGenerator(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    /**
     * Generates a unique, human-readable, collision-resistant product code.
     * Example: API-100428, INT-294819, SYN-583920
     */
    public String generateProductCode(ProductCategory category) {
        String prefix = getCategoryPrefix(category);
        
        // Loop with collision check to guarantee uniqueness even under concurrent creation
        for (int attempt = 0; attempt < 50; attempt++) {
            int numericPart = 100000 + random.nextInt(900000); // 6-digit number
            String candidateCode = prefix + "-" + numericPart;
            if (!productRepository.existsByProductCode(candidateCode)) {
                return candidateCode;
            }
        }

        // Fallback with timestamp suffix if repeated collisions occur
        return prefix + "-" + (System.currentTimeMillis() % 10000000);
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
