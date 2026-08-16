package com.synthora.rfq.quotation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface QuotationRepository extends JpaRepository<Quotation, UUID> {

    @Query("SELECT COALESCE(MAX(q.quotationVersion), 0) FROM Quotation q WHERE q.rfq.id = :rfqId")
    Integer findMaxQuotationVersionByRfqId(@Param("rfqId") UUID rfqId);

    java.util.List<Quotation> findByRfqIdOrderByQuotationVersionDesc(UUID rfqId);

    java.util.Optional<Quotation> findByIdAndRfqId(UUID id, UUID rfqId);
}
