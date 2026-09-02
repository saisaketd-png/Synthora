package com.kemkendra.admin.config;

import com.kemkendra.admin.audit.AuditAction;
import com.kemkendra.admin.audit.AuditService;
import com.kemkendra.admin.config.dto.AdminConfigDtos.*;
import com.kemkendra.common.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class FeatureToggleService {

    private static final Logger log = LoggerFactory.getLogger(FeatureToggleService.class);

    private final PlatformFeatureFlagRepository featureFlagRepository;
    private final AuditService auditService;
    private final Map<String, Boolean> cache = new ConcurrentHashMap<>();

    public FeatureToggleService(PlatformFeatureFlagRepository featureFlagRepository, AuditService auditService) {
        this.featureFlagRepository = featureFlagRepository;
        this.auditService = auditService;
    }

    @jakarta.annotation.PostConstruct
    @Transactional
    public void initDefaults() {
        seedFlagIfMissing("MARKETPLACE_RFQ_ENABLED", "RFQ Creation", "Allows buyers to submit chemical RFQs across verified suppliers.", "Disabling this will prevent buyers from posting new RFQs. Existing RFQs and negotiations will continue unaffected.", true, false, false);
        seedFlagIfMissing("MARKETPLACE_QUOTATION_ENABLED", "Quotation Submission", "Allows suppliers to submit quotations for active RFQs.", "Disabling this will prevent suppliers from submitting new quotes. Existing quotations remain viewable and actionable.", true, false, false);
        seedFlagIfMissing("MARKETPLACE_ORDERS_ENABLED", "Purchase Order Creation", "Allows buyers to accept quotes and generate binding purchase orders.", "Disabling this prevents buyers from issuing new purchase orders.", true, false, false);
        seedFlagIfMissing("MARKETPLACE_SHIPMENTS_ENABLED", "Shipment Tracking & Updates", "Allows suppliers to dispatch shipments and update tracking details.", "Disabling this will block suppliers from creating or updating shipment dispatch tracking.", true, false, false);
        seedFlagIfMissing("BUYER_REGISTRATION_ENABLED", "Buyer Self-Registration", "Allows new enterprise chemical buyers to register accounts.", "Disabling this blocks new buyer registrations across public registration flows.", true, false, false);
        seedFlagIfMissing("SUPPLIER_REGISTRATION_ENABLED", "Supplier Self-Registration", "Allows chemical manufacturers and distributors to register.", "Disabling this blocks new supplier onboarding registrations.", true, false, false);
        seedFlagIfMissing("SUPPLIER_VERIFICATION_SUBMISSION_ENABLED", "Supplier Verification Submission", "Allows registered suppliers to submit KYC and compliance evidence for admin review.", "Disabling this prevents suppliers from submitting verification dossiers.", true, false, false);
        seedFlagIfMissing("SUPPLIER_OFFERINGS_ENABLED", "Supplier Offering Creation", "Allows verified suppliers to publish product offerings against catalog items.", "Disabling this prevents suppliers from listing new product offerings.", true, false, false);
        seedFlagIfMissing("ADMIN_OFFERING_CREATION_ENABLED", "Admin-Created Supplier Offerings", "Permits administrators to create verified supplier offerings on behalf of partners.", "Disabling this restricts offering creation exclusively to authenticated supplier representatives.", true, false, false);
        seedFlagIfMissing("MAINTENANCE_MODE_ENABLED", "Platform Maintenance Mode", "Restricts public and commercial trading interactions for scheduled platform maintenance.", "CRITICAL: Enabling Maintenance Mode restricts public and commercial marketplace interactions for buyers and suppliers. Administrators retain full access to administrative operations and control centers.", false, true, true);
    }

    private void seedFlagIfMissing(String key, String name, String desc, String warning, boolean enabled, boolean requiresConf, boolean dangerous) {
        if (featureFlagRepository.findByKey(key).isEmpty()) {
            PlatformFeatureFlag f = new PlatformFeatureFlag(key, name, desc, warning, enabled, requiresConf, dangerous, "SYSTEM_BOOTSTRAP");
            featureFlagRepository.save(f);
            cache.put(key, enabled);
        }
    }

    public boolean isFeatureEnabled(String key) {
        if (cache.containsKey(key)) {
            return cache.get(key);
        }
        return featureFlagRepository.findByKey(key)
                .map(flag -> {
                    cache.put(key, flag.isEnabled());
                    return flag.isEnabled();
                })
                .orElse(true); // default open if not registered
    }

    public boolean isMaintenanceModeActive() {
        return isFeatureEnabled("MAINTENANCE_MODE_ENABLED");
    }

    @Transactional(readOnly = true)
    public FeatureFlagsResponse getAllFeatures() {
        List<PlatformFeatureFlagDto> features = featureFlagRepository.findAll().stream()
                .map(this::toDto)
                .sorted(Comparator.comparing(PlatformFeatureFlagDto::key))
                .toList();

        return new FeatureFlagsResponse(features, isMaintenanceModeActive());
    }

    @Transactional
    public PlatformFeatureFlagDto updateFeatureFlag(String key, UpdateFeatureFlagRequest request, String actorEmail) {
        PlatformFeatureFlag flag = featureFlagRepository.findByKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Feature flag not found for key: " + key));

        boolean oldState = flag.isEnabled();
        boolean newState = request.enabled();

        if (oldState == newState) {
            return toDto(flag);
        }

        // Enforce explicit confirmation for dangerous / confirmation-required toggles
        if ((flag.isDangerous() || flag.isRequiresConfirmation()) && !Boolean.TRUE.equals(request.confirmed())) {
            throw new IllegalArgumentException("Explicit confirmation is required to modify feature: " + key);
        }

        flag.setEnabled(newState);
        flag.setUpdatedBy(actorEmail);
        PlatformFeatureFlag saved = featureFlagRepository.save(flag);
        cache.put(key, newState);

        // Record Audit
        AuditAction action;
        if ("MAINTENANCE_MODE_ENABLED".equals(key)) {
            action = newState ? AuditAction.MAINTENANCE_MODE_ENABLED : AuditAction.MAINTENANCE_MODE_DISABLED;
        } else {
            action = newState ? AuditAction.FEATURE_ENABLED : AuditAction.FEATURE_DISABLED;
        }

        auditService.recordByEmail(
                actorEmail,
                action,
                com.kemkendra.admin.audit.AuditTargetType.PLATFORM_FEATURE_FLAG,
                key,
                "Feature " + key + (newState ? " ENABLED" : " DISABLED")
        );

        log.info("Feature flag updated: key={}, oldState={}, newState={}, updatedBy={}", key, oldState, newState, actorEmail);
        return toDto(saved);
    }

    public void clearCache() {
        cache.clear();
    }

    private PlatformFeatureFlagDto toDto(PlatformFeatureFlag f) {
        return new PlatformFeatureFlagDto(
                f.getKey(),
                f.getName(),
                f.getDescription(),
                f.getImpactWarning(),
                f.isEnabled(),
                f.isRequiresConfirmation(),
                f.isDangerous(),
                f.getUpdatedBy(),
                f.getUpdatedAt()
        );
    }
}
