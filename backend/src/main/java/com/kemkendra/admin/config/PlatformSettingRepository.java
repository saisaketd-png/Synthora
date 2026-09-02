package com.kemkendra.admin.config;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlatformSettingRepository extends JpaRepository<PlatformSetting, String> {
    List<PlatformSetting> findByCategoryOrderByKeyAsc(String category);
    Optional<PlatformSetting> findByKey(String key);
}
