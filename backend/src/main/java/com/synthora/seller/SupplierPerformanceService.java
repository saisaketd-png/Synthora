package com.synthora.seller;

import com.synthora.product.dto.SupplierPerformanceResponse;
import com.synthora.rfq.Rfq;
import com.synthora.rfq.RfqRepository;
import com.synthora.rfq.RfqStatus;
import com.synthora.rfq.quotation.Quotation;
import com.synthora.rfq.quotation.QuotationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class SupplierPerformanceService {

    public static final long DEFAULT_RESPONSE_WINDOW_HOURS = 72L;

    private final RfqRepository rfqRepository;
    private final QuotationRepository quotationRepository;

    public SupplierPerformanceService(RfqRepository rfqRepository, QuotationRepository quotationRepository) {
        this.rfqRepository = rfqRepository;
        this.quotationRepository = quotationRepository;
    }

    public SupplierPerformanceResponse getSupplierPerformance(Long supplierId) {
        if (supplierId == null) {
            return new SupplierPerformanceResponse(null, null, null, null, 0, 0, 0, 0, 0);
        }

        List<Rfq> rfqs = rfqRepository.findBySupplierId(supplierId);
        return calculatePerformance(supplierId, rfqs);
    }

    public Map<Long, SupplierPerformanceResponse> getBulkSupplierPerformance(List<Long> supplierIds) {
        if (supplierIds == null || supplierIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Long> distinctIds = supplierIds.stream().filter(Objects::nonNull).distinct().collect(Collectors.toList());
        if (distinctIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Rfq> allRfqs = rfqRepository.findBySupplierIdIn(distinctIds);
        Map<Long, List<Rfq>> rfqsBySupplier = allRfqs.stream()
                .filter(r -> r.getSupplierId() != null)
                .collect(Collectors.groupingBy(Rfq::getSupplierId));

        Map<Long, SupplierPerformanceResponse> resultMap = new HashMap<>();
        for (Long supplierId : distinctIds) {
            List<Rfq> supplierRfqs = rfqsBySupplier.getOrDefault(supplierId, Collections.emptyList());
            resultMap.put(supplierId, calculatePerformance(supplierId, supplierRfqs));
        }

        return resultMap;
    }

    private SupplierPerformanceResponse calculatePerformance(Long supplierId, List<Rfq> rfqs) {
        if (rfqs == null || rfqs.isEmpty()) {
            return new SupplierPerformanceResponse(supplierId, null, null, null, 0, 0, 0, 0, 0);
        }

        List<UUID> rfqIds = rfqs.stream().map(Rfq::getId).filter(Objects::nonNull).collect(Collectors.toList());
        List<Quotation> allQuotes = rfqIds.isEmpty() ? Collections.emptyList() : quotationRepository.findByRfqIdInOrderByCreatedAtAsc(rfqIds);

        // Group quotations by RFQ ID
        Map<UUID, List<Quotation>> quotesByRfq = allQuotes.stream()
                .filter(q -> q.getRfq() != null && q.getRfq().getId() != null)
                .collect(Collectors.groupingBy(q -> q.getRfq().getId()));

        long respondedRfqs = 0;
        long unrespondedRfqs = 0;
        long pendingRfqs = 0;
        long totalResponseTimeSeconds = 0;
        LocalDateTime now = LocalDateTime.now();

        for (Rfq rfq : rfqs) {
            List<Quotation> rfqQuotes = quotesByRfq.getOrDefault(rfq.getId(), Collections.emptyList());
            Optional<Quotation> firstSupplierQuote = rfqQuotes.stream()
                    .filter(q -> q.getActorType() == null || q.getActorType().equalsIgnoreCase("SUPPLIER"))
                    .findFirst();

            if (firstSupplierQuote.isPresent()) {
                respondedRfqs++;
                LocalDateTime rfqCreated = rfq.getCreatedAt() != null ? rfq.getCreatedAt() : now;
                LocalDateTime quoteCreated = firstSupplierQuote.get().getCreatedAt() != null ? firstSupplierQuote.get().getCreatedAt() : rfqCreated;
                long seconds = Math.max(0, Duration.between(rfqCreated, quoteCreated).getSeconds());
                totalResponseTimeSeconds += seconds;
            } else {
                // No response submitted yet
                if (rfq.getStatus() == RfqStatus.CANCELLED) {
                    // Cancelled before response -> excluded from performance calculations
                    continue;
                }

                LocalDateTime rfqCreated = rfq.getCreatedAt() != null ? rfq.getCreatedAt() : now;
                LocalDateTime deadline = rfq.getExpiresAt() != null
                        ? rfq.getExpiresAt()
                        : rfqCreated.plusHours(DEFAULT_RESPONSE_WINDOW_HOURS);

                if (now.isBefore(deadline) && rfq.getStatus() != RfqStatus.EXPIRED) {
                    // Still within valid response window -> PENDING
                    pendingRfqs++;
                } else {
                    // Response window has expired without quote -> UNRESPONDED
                    unrespondedRfqs++;
                }
            }
        }

        long eligibleRfqs = respondedRfqs + unrespondedRfqs;
        Integer responseRate = null;
        Long averageResponseTimeSeconds = null;
        String formattedResponseTime = null;

        if (eligibleRfqs > 0) {
            responseRate = (int) Math.round(((double) respondedRfqs / eligibleRfqs) * 100.0);
            if (respondedRfqs > 0) {
                averageResponseTimeSeconds = totalResponseTimeSeconds / respondedRfqs;
                formattedResponseTime = formatDuration(averageResponseTimeSeconds);
            }
        }

        return new SupplierPerformanceResponse(
                supplierId,
                responseRate,
                averageResponseTimeSeconds,
                formattedResponseTime,
                rfqs.size(),
                eligibleRfqs,
                respondedRfqs,
                unrespondedRfqs,
                pendingRfqs
        );
    }

    public static String formatDuration(Long seconds) {
        if (seconds == null) {
            return null;
        }
        if (seconds < 60) {
            return "1m";
        }
        if (seconds < 3600) {
            long m = seconds / 60;
            return m + "m";
        }
        if (seconds < 86400) {
            long h = seconds / 3600;
            long m = (seconds % 3600) / 60;
            if (m == 0) {
                return h + "h";
            }
            return h + "h " + m + "m";
        }

        long d = seconds / 86400;
        long h = (seconds % 86400) / 3600;
        if (h == 0) {
            return d + "d";
        }
        return d + "d " + h + "h";
    }
}
