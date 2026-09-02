package com.kemkendra.notification.preference;

import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.notification.NotificationCategory;
import com.kemkendra.notification.preference.dto.NotificationPreferenceDtos.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional
public class NotificationPreferenceService {

    private final UserNotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;

    public NotificationPreferenceService(
            UserNotificationPreferenceRepository preferenceRepository,
            UserRepository userRepository) {
        this.preferenceRepository = preferenceRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public NotificationPreferencesResponse getPreferencesForUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AccessDeniedException("User not found"));

        List<UserNotificationPreference> existing = preferenceRepository.findByUser(user);
        Map<NotificationCategory, UserNotificationPreference> map = new EnumMap<>(NotificationCategory.class);
        for (UserNotificationPreference p : existing) {
            map.put(p.getCategory(), p);
        }

        List<NotificationPreferenceItemDto> items = new ArrayList<>();
        for (NotificationCategory cat : NotificationCategory.values()) {
            UserNotificationPreference pref = map.get(cat);
            boolean inApp = cat.isMandatory() || (pref == null || pref.isInAppEnabled());
            boolean email = cat.isMandatory() || (pref == null || pref.isEmailEnabled());
            items.add(new NotificationPreferenceItemDto(cat, inApp, email, cat.isMandatory()));
        }

        return new NotificationPreferencesResponse(items);
    }

    public NotificationPreferencesResponse updatePreferences(UUID userId, BulkUpdateNotificationPreferencesRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AccessDeniedException("User not found"));

        for (UpdateNotificationPreferenceRequest item : request.preferences()) {
            if (item.category() == null) continue;

            if (item.category().isMandatory()) {
                if ((item.inAppEnabled() != null && !item.inAppEnabled()) ||
                    (item.emailEnabled() != null && !item.emailEnabled())) {
                    throw new IllegalArgumentException("Mandatory notifications for category " + item.category() + " cannot be disabled.");
                }
            }

            UserNotificationPreference pref = preferenceRepository.findByUserAndCategory(user, item.category())
                    .orElseGet(() -> new UserNotificationPreference(user, item.category(), true, true));

            if (item.inAppEnabled() != null) {
                pref.setInAppEnabled(item.category().isMandatory() || item.inAppEnabled());
            }
            if (item.emailEnabled() != null) {
                pref.setEmailEnabled(item.category().isMandatory() || item.emailEnabled());
            }

            preferenceRepository.save(pref);
        }

        return getPreferencesForUser(userId);
    }

    @Transactional(readOnly = true)
    public boolean isInAppEnabled(UUID userId, NotificationCategory category) {
        if (category == null || category.isMandatory()) return true;
        return preferenceRepository.findByUserIdAndCategory(userId, category)
                .map(UserNotificationPreference::isInAppEnabled)
                .orElse(true);
    }

    @Transactional(readOnly = true)
    public boolean isEmailEnabled(UUID userId, NotificationCategory category) {
        if (category == null || category.isMandatory()) return true;
        return preferenceRepository.findByUserIdAndCategory(userId, category)
                .map(UserNotificationPreference::isEmailEnabled)
                .orElse(true);
    }
}
