package com.kemkendra.admin.announcement;

import com.kemkendra.admin.audit.AuditAction;
import com.kemkendra.admin.audit.AuditService;
import com.kemkendra.admin.config.dto.AdminConfigDtos.*;
import com.kemkendra.common.ResourceNotFoundException;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.notification.Notification;
import com.kemkendra.notification.NotificationCategory;
import com.kemkendra.notification.NotificationEntityType;
import com.kemkendra.notification.NotificationPriority;
import com.kemkendra.notification.NotificationService;
import com.kemkendra.notification.NotificationType;
import com.kemkendra.notification.email.EmailNotificationService;
import com.kemkendra.product.Supplier;
import com.kemkendra.product.SupplierRepository;
import com.kemkendra.seller.SupplierVerificationStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminAnnouncementService {

    private static final Logger log = LoggerFactory.getLogger(AdminAnnouncementService.class);

    private final PlatformAnnouncementRepository announcementRepository;
    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;
    private final NotificationService notificationService;
    private final EmailNotificationService emailNotificationService;
    private final AuditService auditService;

    public AdminAnnouncementService(
            PlatformAnnouncementRepository announcementRepository,
            UserRepository userRepository,
            SupplierRepository supplierRepository,
            NotificationService notificationService,
            EmailNotificationService emailNotificationService,
            AuditService auditService) {
        this.announcementRepository = announcementRepository;
        this.userRepository = userRepository;
        this.supplierRepository = supplierRepository;
        this.notificationService = notificationService;
        this.emailNotificationService = emailNotificationService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<PlatformAnnouncementDto> getAnnouncements(Pageable pageable) {
        return announcementRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public PlatformAnnouncementDto getAnnouncement(UUID id) {
        return announcementRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found: " + id));
    }

    @Transactional
    public PlatformAnnouncementDto createAnnouncement(CreateAnnouncementRequest request, String actorEmail) {
        PlatformAnnouncement announcement = new PlatformAnnouncement();
        announcement.setTitle(request.title().trim());
        announcement.setMessage(request.message().trim());
        announcement.setSeverity(normalizeSeverity(request.severity()));
        announcement.setAudience(normalizeAudience(request.audience()));
        announcement.setStatus("DRAFT");
        announcement.setSendInApp(request.sendInApp() == null || request.sendInApp());
        announcement.setSendEmail(Boolean.TRUE.equals(request.sendEmail()));
        announcement.setStartTime(request.startTime());
        announcement.setEndTime(request.endTime());
        announcement.setCreatedBy(actorEmail);

        PlatformAnnouncement saved = announcementRepository.save(announcement);

        auditService.recordByEmail(
                actorEmail,
                AuditAction.ANNOUNCEMENT_CREATED,
                com.kemkendra.admin.audit.AuditTargetType.PLATFORM_ANNOUNCEMENT,
                saved.getId().toString(),
                "Created announcement: " + saved.getTitle()
        );

        return toDto(saved);
    }

    @Transactional
    public PlatformAnnouncementDto updateAnnouncement(UUID id, UpdateAnnouncementRequest request, String actorEmail) {
        PlatformAnnouncement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found: " + id));

        if ("PUBLISHED".equals(announcement.getStatus())) {
            throw new IllegalStateException("Cannot edit an already published announcement. Create a new announcement instead.");
        }

        announcement.setTitle(request.title().trim());
        announcement.setMessage(request.message().trim());
        announcement.setSeverity(normalizeSeverity(request.severity()));
        announcement.setAudience(normalizeAudience(request.audience()));
        announcement.setSendInApp(request.sendInApp() == null || request.sendInApp());
        announcement.setSendEmail(Boolean.TRUE.equals(request.sendEmail()));
        announcement.setStartTime(request.startTime());
        announcement.setEndTime(request.endTime());

        PlatformAnnouncement saved = announcementRepository.save(announcement);

        auditService.recordByEmail(
                actorEmail,
                AuditAction.ANNOUNCEMENT_UPDATED,
                com.kemkendra.admin.audit.AuditTargetType.PLATFORM_ANNOUNCEMENT,
                saved.getId().toString(),
                "Updated draft announcement: " + saved.getTitle()
        );

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public AnnouncementPreviewResponse previewAnnouncement(CreateAnnouncementRequest request) {
        List<User> recipients = resolveRecipients(normalizeAudience(request.audience()));
        return new AnnouncementPreviewResponse(
                request.title().trim(),
                request.message().trim(),
                normalizeSeverity(request.severity()),
                normalizeAudience(request.audience()),
                recipients.size(),
                request.sendInApp() == null || request.sendInApp(),
                Boolean.TRUE.equals(request.sendEmail())
        );
    }

    @Transactional
    public PlatformAnnouncementDto publishAnnouncement(UUID id, String actorEmail) {
        PlatformAnnouncement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found: " + id));

        if ("PUBLISHED".equals(announcement.getStatus())) {
            return toDto(announcement);
        }

        announcement.setStatus("PUBLISHED");
        announcement.setPublishedAt(LocalDateTime.now());
        PlatformAnnouncement saved = announcementRepository.save(announcement);

        // Resolve audience
        List<User> recipients = resolveRecipients(announcement.getAudience());
        log.info("Publishing announcement '{}' (ID: {}) to {} recipients", announcement.getTitle(), announcement.getId(), recipients.size());

        NotificationPriority priority = mapSeverityToPriority(announcement.getSeverity());

        // Dispatch notifications via NotificationService & EmailNotificationService
        for (User user : recipients) {
            Notification notif = null;
            if (announcement.isSendInApp() || announcement.isSendEmail()) {
                notif = notificationService.createNotification(
                        user.getId(),
                        NotificationType.SYSTEM_ANNOUNCEMENT,
                        NotificationCategory.SYSTEM,
                        priority,
                        announcement.getTitle(),
                        announcement.getMessage(),
                        NotificationEntityType.DOCUMENT,
                        announcement.getId()
                );
            }
            if (announcement.isSendEmail() && emailNotificationService != null && notif != null) {
                emailNotificationService.sendNotificationEmail(notif);
            }
        }

        auditService.recordByEmail(
                actorEmail,
                AuditAction.ANNOUNCEMENT_PUBLISHED,
                com.kemkendra.admin.audit.AuditTargetType.PLATFORM_ANNOUNCEMENT,
                saved.getId().toString(),
                "Published platform announcement: " + saved.getTitle() + " to audience: " + saved.getAudience()
        );

        return toDto(saved);
    }

    @Transactional
    public PlatformAnnouncementDto deactivateAnnouncement(UUID id, String actorEmail) {
        PlatformAnnouncement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found: " + id));

        announcement.setStatus("DEACTIVATED");
        PlatformAnnouncement saved = announcementRepository.save(announcement);

        auditService.recordByEmail(
                actorEmail,
                AuditAction.ANNOUNCEMENT_DEACTIVATED,
                com.kemkendra.admin.audit.AuditTargetType.PLATFORM_ANNOUNCEMENT,
                saved.getId().toString(),
                "Deactivated announcement: " + saved.getTitle()
        );

        return toDto(saved);
    }

    private List<User> resolveRecipients(String audience) {
        List<User> activeUsers = userRepository.findAll().stream()
                .filter(u -> u.getStatus() == UserStatus.ACTIVE)
                .toList();

        return switch (audience) {
            case "BUYERS" -> activeUsers.stream().filter(u -> u.getRole() == UserRole.USER).toList();
            case "SUPPLIERS" -> activeUsers.stream().filter(u -> u.getRole() == UserRole.SUPPLIER).toList();
            case "ADMINS" -> activeUsers.stream().filter(u -> u.getRole() == UserRole.ADMIN).toList();
            case "VERIFIED_SUPPLIERS" -> {
                Set<UUID> verifiedUserIds = supplierRepository.findAll().stream()
                        .filter(s -> Boolean.TRUE.equals(s.getVerified()) || s.getVerificationStatus() == SupplierVerificationStatus.VERIFIED)
                        .map(s -> s.getUser() != null ? s.getUser().getId() : null)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet());
                yield activeUsers.stream()
                        .filter(u -> u.getRole() == UserRole.SUPPLIER && verifiedUserIds.contains(u.getId()))
                        .toList();
            }
            default -> activeUsers; // ALL
        };
    }

    private String normalizeSeverity(String sev) {
        if (sev == null) return "INFO";
        String s = sev.trim().toUpperCase();
        if ("WARNING".equals(s) || "CRITICAL".equals(s)) return s;
        return "INFO";
    }

    private String normalizeAudience(String aud) {
        if (aud == null) return "ALL";
        String a = aud.trim().toUpperCase();
        if (Set.of("ALL", "BUYERS", "SUPPLIERS", "ADMINS", "VERIFIED_SUPPLIERS").contains(a)) return a;
        return "ALL";
    }

    private NotificationPriority mapSeverityToPriority(String severity) {
        return switch (severity) {
            case "CRITICAL" -> NotificationPriority.CRITICAL;
            case "WARNING" -> NotificationPriority.HIGH;
            default -> NotificationPriority.NORMAL;
        };
    }

    private PlatformAnnouncementDto toDto(PlatformAnnouncement a) {
        return new PlatformAnnouncementDto(
                a.getId(),
                a.getTitle(),
                a.getMessage(),
                a.getSeverity(),
                a.getAudience(),
                a.getStatus(),
                a.getStartTime(),
                a.getEndTime(),
                a.isSendInApp(),
                a.isSendEmail(),
                a.getPublishedAt(),
                a.getCreatedBy(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}
