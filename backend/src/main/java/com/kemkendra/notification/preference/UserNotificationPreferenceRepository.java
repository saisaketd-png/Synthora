package com.kemkendra.notification.preference;

import com.kemkendra.identity.User;
import com.kemkendra.notification.NotificationCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserNotificationPreferenceRepository extends JpaRepository<UserNotificationPreference, UUID> {

    List<UserNotificationPreference> findByUser(User user);

    List<UserNotificationPreference> findByUserId(UUID userId);

    Optional<UserNotificationPreference> findByUserAndCategory(User user, NotificationCategory category);

    Optional<UserNotificationPreference> findByUserIdAndCategory(UUID userId, NotificationCategory category);
}
