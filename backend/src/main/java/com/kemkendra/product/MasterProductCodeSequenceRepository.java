package com.kemkendra.product;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MasterProductCodeSequenceRepository extends JpaRepository<MasterProductCodeSequence, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM MasterProductCodeSequence s WHERE s.prefix = :prefix")
    Optional<MasterProductCodeSequence> findByPrefixForUpdate(@Param("prefix") String prefix);
}
