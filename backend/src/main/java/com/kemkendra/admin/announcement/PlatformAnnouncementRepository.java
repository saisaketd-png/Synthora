package com.kemkendra.admin.announcement;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PlatformAnnouncementRepository extends JpaRepository<PlatformAnnouncement, UUID> {
    Page<PlatformAnnouncement> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<PlatformAnnouncement> findByStatusOrderByCreatedAtDesc(String status);
    List<PlatformAnnouncement> findByStatusAndAudienceInOrderByCreatedAtDesc(String status, List<String> audiences);
}
