package com.kemkendra.admin.config;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlatformFeatureFlagRepository extends JpaRepository<PlatformFeatureFlag, String> {
    Optional<PlatformFeatureFlag> findByKey(String key);
}
