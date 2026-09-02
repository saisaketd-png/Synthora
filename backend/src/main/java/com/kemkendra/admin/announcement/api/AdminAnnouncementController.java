package com.kemkendra.admin.announcement.api;

import com.kemkendra.admin.announcement.AdminAnnouncementService;
import com.kemkendra.admin.config.dto.AdminConfigDtos.*;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/announcements")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnnouncementController {

    private final AdminAnnouncementService announcementService;

    public AdminAnnouncementController(AdminAnnouncementService announcementService) {
        this.announcementService = announcementService;
    }

    @GetMapping
    public ResponseEntity<Page<PlatformAnnouncementDto>> getAnnouncements(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(announcementService.getAnnouncements(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlatformAnnouncementDto> getAnnouncement(@PathVariable UUID id) {
        return ResponseEntity.ok(announcementService.getAnnouncement(id));
    }

    @PostMapping
    public ResponseEntity<PlatformAnnouncementDto> createAnnouncement(
            @Valid @RequestBody CreateAnnouncementRequest request,
            Authentication authentication) {
        String actorEmail = authentication.getName();
        return ResponseEntity.ok(announcementService.createAnnouncement(request, actorEmail));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlatformAnnouncementDto> updateAnnouncement(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAnnouncementRequest request,
            Authentication authentication) {
        String actorEmail = authentication.getName();
        return ResponseEntity.ok(announcementService.updateAnnouncement(id, request, actorEmail));
    }

    @PostMapping("/preview")
    public ResponseEntity<AnnouncementPreviewResponse> previewAnnouncement(
            @Valid @RequestBody CreateAnnouncementRequest request) {
        return ResponseEntity.ok(announcementService.previewAnnouncement(request));
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<PlatformAnnouncementDto> publishAnnouncement(
            @PathVariable UUID id,
            Authentication authentication) {
        String actorEmail = authentication.getName();
        return ResponseEntity.ok(announcementService.publishAnnouncement(id, actorEmail));
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<PlatformAnnouncementDto> deactivateAnnouncement(
            @PathVariable UUID id,
            Authentication authentication) {
        String actorEmail = authentication.getName();
        return ResponseEntity.ok(announcementService.deactivateAnnouncement(id, actorEmail));
    }
}
