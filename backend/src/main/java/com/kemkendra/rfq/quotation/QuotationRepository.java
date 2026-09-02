package com.kemkendra.rfq.quotation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface QuotationRepository extends JpaRepository<Quotation, UUID>, JpaSpecificationExecutor<Quotation> {

    @Query("SELECT COALESCE(MAX(q.quotationVersion), 0) FROM Quotation q WHERE q.rfq.id = :rfqId")
    Integer findMaxQuotationVersionByRfqId(@Param("rfqId") UUID rfqId);

    List<Quotation> findByRfqIdOrderByQuotationVersionDesc(UUID rfqId);

    Optional<Quotation> findByIdAndRfqId(UUID id, UUID rfqId);

    Optional<Quotation> findFirstByRfqIdAndActorTypeOrderByCreatedAtAsc(UUID rfqId, String actorType);

    List<Quotation> findByRfqIdInOrderByCreatedAtAsc(List<UUID> rfqIds);
}
