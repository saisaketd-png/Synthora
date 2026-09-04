package com.kemkendra.notification;

import com.kemkendra.notification.dto.NotificationResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Manages Server-Sent Events (SSE) subscriptions for real-time notification
 * and procurement state delivery directly to active user sessions.
 */
@Service
public class NotificationStreamService {

    private static final Logger log = LoggerFactory.getLogger(NotificationStreamService.class);
    private static final long SSE_TIMEOUT = 30 * 60 * 1000L; // 30 minutes
    public static final int MAX_EMITTERS_PER_USER = 5;

    private final Map<UUID, CopyOnWriteArrayList<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(UUID userId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError(e -> removeEmitter(userId, emitter));

        userEmitters.compute(userId, (id, existingList) -> {
            CopyOnWriteArrayList<SseEmitter> list = (existingList != null) ? existingList : new CopyOnWriteArrayList<>();
            while (list.size() >= MAX_EMITTERS_PER_USER) {
                SseEmitter oldest = list.remove(0);
                try {
                    oldest.complete();
                } catch (Exception ignored) {
                }
            }
            list.add(emitter);
            return list;
        });

        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data(Map.of("status", "connected", "userId", userId.toString())));
        } catch (IOException e) {
            removeEmitter(userId, emitter);
        }

        return emitter;
    }

    public void removeEmitter(UUID userId, SseEmitter emitter) {
        userEmitters.computeIfPresent(userId, (id, list) -> {
            list.remove(emitter);
            return list.isEmpty() ? null : list;
        });
    }

    public int getActiveEmitterCount(UUID userId) {
        CopyOnWriteArrayList<SseEmitter> list = userEmitters.get(userId);
        return list != null ? list.size() : 0;
    }

    public int getTotalActiveUsers() {
        return userEmitters.size();
    }

    public void sendNotification(UUID recipientId, NotificationResponse notification, long unreadCount) {
        CopyOnWriteArrayList<SseEmitter> emitters = userEmitters.get(recipientId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        Map<String, Object> payload = Map.of(
                "notification", notification,
                "unreadCount", unreadCount
        );

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .id(notification.id().toString())
                        .data(payload));
            } catch (Exception e) {
                removeEmitter(recipientId, emitter);
            }
        }
    }

    @Scheduled(fixedRate = 25000)
    public void sendHeartbeat() {
        for (Map.Entry<UUID, CopyOnWriteArrayList<SseEmitter>> entry : userEmitters.entrySet()) {
            UUID userId = entry.getKey();
            for (SseEmitter emitter : entry.getValue()) {
                try {
                    emitter.send(SseEmitter.event().name("ping").data("heartbeat"));
                } catch (Exception e) {
                    removeEmitter(userId, emitter);
                }
            }
        }
    }
}
