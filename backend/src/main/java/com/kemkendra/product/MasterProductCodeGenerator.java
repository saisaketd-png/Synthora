package com.kemkendra.product;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class MasterProductCodeGenerator {

    private static final Logger log = LoggerFactory.getLogger(MasterProductCodeGenerator.class);
    private static final Pattern CODE_PATTERN = Pattern.compile("^[A-Z0-9]+-(\\d+)$");

    private final MasterProductCodeSequenceRepository sequenceRepository;
    private final MasterProductRepository masterProductRepository;

    public MasterProductCodeGenerator(MasterProductCodeSequenceRepository sequenceRepository,
                                      MasterProductRepository masterProductRepository) {
        this.sequenceRepository = sequenceRepository;
        this.masterProductRepository = masterProductRepository;
    }

    /**
     * Generates a clean, human-readable, sequential, and concurrency-safe master product code.
     * Examples: API-00001, EXC-00001, INT-00001, SOL-00001, SPC-00001, LAB-00001.
     * Scales smoothly past 99,999 items (API-100000).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public synchronized String generateMasterProductCode(ProductCategory category) {
        String prefix = getCategoryPrefix(category);

        for (int attempt = 0; attempt < 50; attempt++) {
            long seqVal = allocateNextSequenceValue(prefix);
            String candidateCode = formatProductCode(prefix, seqVal);

            if (!masterProductRepository.existsByMasterProductCode(candidateCode)) {
                return candidateCode;
            }
            log.warn("Generated product code {} already exists in database; advancing sequence.", candidateCode);
        }

        // Extremely unlikely fallback
        return prefix + "-" + System.currentTimeMillis();
    }

    /**
     * Allocates the next sequence value atomically using database pessimistic locking.
     */
    private long allocateNextSequenceValue(String prefix) {
        Optional<MasterProductCodeSequence> opt = sequenceRepository.findByPrefixForUpdate(prefix);
        MasterProductCodeSequence sequence;

        if (opt.isPresent()) {
            sequence = opt.get();
        } else {
            long initialVal = calculateInitialSequenceValue(prefix);
            sequence = new MasterProductCodeSequence(prefix, initialVal);
            sequence = sequenceRepository.saveAndFlush(sequence);
        }

        long valueToUse = sequence.getNextValue();
        sequence.setNextValue(valueToUse + 1);
        sequenceRepository.saveAndFlush(sequence);
        return valueToUse;
    }

    /**
     * Calculates the starting sequence value by checking existing product codes.
     */
    private long calculateInitialSequenceValue(String prefix) {
        long maxFound = 0;
        try {
            // Check existing products matching the pattern prefix-XXXXX
            var products = masterProductRepository.findAll();
            String prefixWithDash = prefix + "-";
            for (MasterProduct mp : products) {
                String code = mp.getMasterProductCode();
                if (code != null && code.startsWith(prefixWithDash)) {
                    Matcher matcher = CODE_PATTERN.matcher(code);
                    if (matcher.matches()) {
                        try {
                            long num = Long.parseLong(matcher.group(1));
                            if (num > maxFound) {
                                maxFound = num;
                            }
                        } catch (NumberFormatException ignored) {
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error scanning existing product codes for prefix {}: {}", prefix, e.getMessage());
        }
        return Math.max(1, maxFound + 1);
    }

    /**
     * Formats prefix and numeric counter:
     * - Values 1 to 99,999 are padded to 5 digits: API-00001, API-99999
     * - Values > 99,999 expand naturally: API-100000
     */
    public String formatProductCode(String prefix, long value) {
        if (value <= 99999) {
            return String.format("%s-%05d", prefix, value);
        }
        return String.format("%s-%d", prefix, value);
    }

    /**
     * Centralized category abbreviation mapping.
     */
    public String getCategoryPrefix(ProductCategory category) {
        if (category == null) {
            return "CAT";
        }
        return switch (category) {
            case API -> "API";
            case INTERMEDIATE -> "INT";
            case EXCIPIENT -> "EXC";
            case SOLVENT -> "SOL";
            case SPECIALTY_CHEMICAL -> "SPC";
            case LAB_CHEMICAL -> "LAB";
            default -> "CAT";
        };
    }
}
