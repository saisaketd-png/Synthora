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
import java.util.stream.Collectors;

@Service
public class PlatformPolicyService {

    private static final Logger log = LoggerFactory.getLogger(PlatformPolicyService.class);

    private final PlatformSettingRepository settingRepository;
    private final AuditService auditService;
    private final Map<String, String> cache = new ConcurrentHashMap<>();

    public PlatformPolicyService(PlatformSettingRepository settingRepository, AuditService auditService) {
        this.settingRepository = settingRepository;
        this.auditService = auditService;
    }

    @jakarta.annotation.PostConstruct
    @Transactional
    public void initDefaults() {
        seedSettingIfMissing("QUOTATION_DEFAULT_VALIDITY_DAYS", "14", "COMMERCIAL", "INTEGER", "Default validity period in days for submitted supplier quotations.", "Changing this affects the default expiration date calculated for newly submitted quotations.");
        seedSettingIfMissing("MINIMUM_LEAD_TIME_DAYS", "1", "COMMERCIAL", "INTEGER", "Minimum delivery lead time days suppliers must specify when quoting.", "Suppliers cannot submit quotations with a lead time less than this value.");
        seedSettingIfMissing("ALLOWED_CURRENCIES", "INR,USD,EUR", "COMMERCIAL", "STRING", "Comma-separated ISO currency codes accepted on the marketplace.", "Only quotations and offerings in these currencies can be created.");
        seedSettingIfMissing("BUYER_RFQ_DAILY_LIMIT", "50", "BUYER", "INTEGER", "Maximum number of RFQs an individual buyer account can submit per calendar day.", "Prevents automated spam and bulk request flooding from buyer accounts.");
        seedSettingIfMissing("PLATFORM_SUPPORT_EMAIL", "support@kemkendra.com", "COMMUNICATION", "STRING", "Public support contact email displayed in legal and compliance notices.", "Appears in system notifications, legal disclaimers, and customer support links.");
        seedSettingIfMissing("MAX_DOCUMENT_SIZE_MB", "10", "COMPLIANCE", "INTEGER", "Maximum allowed document file upload size in megabytes.", "Uploading files larger than this configured size will be rejected by the validation pipeline.");
        seedSettingIfMissing("DOCUMENT_RETENTION_DAYS", "2555", "COMPLIANCE", "INTEGER", "Document record audit retention period in days (default 7 years).", "Affects archival compliance and commercial document retention policies.");
    }

    private void seedSettingIfMissing(String key, String value, String category, String dataType, String desc, String warning) {
        if (settingRepository.findByKey(key).isEmpty()) {
            PlatformSetting s = new PlatformSetting(key, value, category, dataType, desc, warning, "SYSTEM_BOOTSTRAP");
            settingRepository.save(s);
            cache.put(key, value);
        }
    }

    public String getSettingValue(String key, String defaultValue) {
        if (cache.containsKey(key)) {
            return cache.get(key);
        }
        return settingRepository.findByKey(key)
                .map(setting -> {
                    cache.put(key, setting.getValue());
                    return setting.getValue();
                })
                .orElse(defaultValue);
    }

    public int getIntSetting(String key, int defaultValue) {
        String val = getSettingValue(key, String.valueOf(defaultValue));
        try {
            return Integer.parseInt(val.trim());
        } catch (NumberFormatException e) {
            log.warn("Invalid integer platform setting value for key {}: '{}'. Using default {}", key, val, defaultValue);
            return defaultValue;
        }
    }

    public Set<String> getCommaSeparatedSet(String key, String defaultCsv) {
        String val = getSettingValue(key, defaultCsv);
        if (val == null || val.isBlank()) return Set.of();
        return Arrays.stream(val.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    @Transactional(readOnly = true)
    public PlatformSettingsResponse getAllSettingsGrouped() {
        List<PlatformSetting> all = settingRepository.findAll();
        Map<String, List<PlatformSettingDto>> grouped = all.stream()
                .map(this::toDto)
                .collect(Collectors.groupingBy(PlatformSettingDto::category));

        List<PlatformSettingsGroupDto> groups = grouped.entrySet().stream()
                .map(e -> new PlatformSettingsGroupDto(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(PlatformSettingsGroupDto::category))
                .toList();

        return new PlatformSettingsResponse(groups);
    }

    @Transactional
    public PlatformSettingDto updateSetting(String key, UpdatePlatformSettingRequest request, String actorEmail) {
        PlatformSetting setting = settingRepository.findByKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Platform setting not found for key: " + key));

        String oldValue = setting.getValue();
        String newValue = request.value().trim();

        // Validate data type
        if ("INTEGER".equalsIgnoreCase(setting.getDataType())) {
            try {
                int parsed = Integer.parseInt(newValue);
                if (parsed < 0) {
                    throw new IllegalArgumentException("Integer setting cannot be negative: " + key);
                }
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Value must be a valid integer for setting: " + key);
            }
        }

        setting.setValue(newValue);
        setting.setUpdatedBy(actorEmail);
        PlatformSetting saved = settingRepository.save(savedSetting(setting));
        cache.put(key, newValue);

        // Record Audit
        auditService.recordByEmail(
                actorEmail,
                AuditAction.PLATFORM_SETTING_UPDATED,
                com.kemkendra.admin.audit.AuditTargetType.PLATFORM_SETTING,
                key,
                "Updated setting " + key + " from '" + oldValue + "' to '" + newValue + "'"
        );

        log.info("Platform setting updated: key={}, oldValue={}, newValue={}, updatedBy={}", key, oldValue, newValue, actorEmail);
        return toDto(saved);
    }

    private PlatformSetting savedSetting(PlatformSetting s) {
        return s;
    }

    public void clearCache() {
        cache.clear();
    }

    private PlatformSettingDto toDto(PlatformSetting s) {
        return new PlatformSettingDto(
                s.getKey(),
                s.getValue(),
                s.getCategory(),
                s.getDataType(),
                s.getDescription(),
                s.getImpactWarning(),
                s.getUpdatedBy(),
                s.getUpdatedAt()
        );
    }
}
