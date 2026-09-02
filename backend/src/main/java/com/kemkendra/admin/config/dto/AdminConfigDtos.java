package com.kemkendra.admin.config.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class AdminConfigDtos {

    // =========================================================================
    // Platform Settings DTOs
    // =========================================================================

    public record PlatformSettingDto(
            String key,
            String value,
            String category,
            String dataType,
            String description,
            String impactWarning,
            String updatedBy,
            LocalDateTime updatedAt
    ) {}

    public record UpdatePlatformSettingRequest(
            @NotBlank(message = "Setting value cannot be blank")
            String value
    ) {}

    public record PlatformSettingsGroupDto(
            String category,
            List<PlatformSettingDto> settings
    ) {}

    public record PlatformSettingsResponse(
            List<PlatformSettingsGroupDto> groups
    ) {}

    // =========================================================================
    // Feature Controls DTOs
    // =========================================================================

    public record PlatformFeatureFlagDto(
            String key,
            String name,
            String description,
            String impactWarning,
            boolean enabled,
            boolean requiresConfirmation,
            boolean dangerous,
            String updatedBy,
            LocalDateTime updatedAt
    ) {}

    public record UpdateFeatureFlagRequest(
            @NotNull(message = "Enabled flag is required")
            Boolean enabled,
            Boolean confirmed
    ) {}

    public record FeatureFlagsResponse(
            List<PlatformFeatureFlagDto> features,
            boolean maintenanceModeActive
    ) {}

    // =========================================================================
    // Platform Announcements DTOs
    // =========================================================================

    public record PlatformAnnouncementDto(
            UUID id,
            String title,
            String message,
            String severity,
            String audience,
            String status,
            LocalDateTime startTime,
            LocalDateTime endTime,
            boolean sendInApp,
            boolean sendEmail,
            LocalDateTime publishedAt,
            String createdBy,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {}

    public record CreateAnnouncementRequest(
            @NotBlank(message = "Title is required")
            @Size(max = 255, message = "Title cannot exceed 255 characters")
            String title,

            @NotBlank(message = "Message is required")
            String message,

            @NotBlank(message = "Severity is required")
            String severity, // INFO, WARNING, CRITICAL

            @NotBlank(message = "Audience is required")
            String audience, // ALL, BUYERS, SUPPLIERS, ADMINS, VERIFIED_SUPPLIERS

            Boolean sendInApp,
            Boolean sendEmail,
            LocalDateTime startTime,
            LocalDateTime endTime
    ) {}

    public record UpdateAnnouncementRequest(
            @NotBlank(message = "Title is required")
            @Size(max = 255, message = "Title cannot exceed 255 characters")
            String title,

            @NotBlank(message = "Message is required")
            String message,

            @NotBlank(message = "Severity is required")
            String severity,

            @NotBlank(message = "Audience is required")
            String audience,

            Boolean sendInApp,
            Boolean sendEmail,
            LocalDateTime startTime,
            LocalDateTime endTime
    ) {}

    public record AnnouncementPreviewResponse(
            String title,
            String formattedMessage,
            String severity,
            String audience,
            long estimatedRecipientCount,
            boolean sendInApp,
            boolean sendEmail
    ) {}

    // =========================================================================
    // Catalog Taxonomy DTOs
    // =========================================================================

    public record CatalogTaxonomyDto(
            UUID id,
            String type,
            String name,
            String code,
            String description,
            boolean active,
            int displayOrder,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {}

    public record CreateTaxonomyRequest(
            @NotBlank(message = "Taxonomy type is required")
            String type,

            @NotBlank(message = "Name is required")
            @Size(max = 150, message = "Name cannot exceed 150 characters")
            String name,

            @NotBlank(message = "Code is required")
            @Size(max = 64, message = "Code cannot exceed 64 characters")
            String code,

            String description,
            Integer displayOrder
    ) {}

    public record UpdateTaxonomyRequest(
            @NotBlank(message = "Name is required")
            @Size(max = 150, message = "Name cannot exceed 150 characters")
            String name,

            String description,
            Boolean active,
            Integer displayOrder
    ) {}

    public record TaxonomyGroupDto(
            String type,
            List<CatalogTaxonomyDto> items
    ) {}

    public record TaxonomiesResponse(
            List<TaxonomyGroupDto> groups
    ) {}
}
