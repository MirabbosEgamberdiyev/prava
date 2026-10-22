package uz.pravaimtihon.octagon.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 4 xonali taklif/xona kodlarini terib topishdan (brute force) himoya.
 *
 * <p>Kod maydoni kichik (9000 ta), shuning uchun noto'g'ri urinishlar foydalanuvchi bo'yicha sanaladi —
 * WebSocket'ni qayta ulash hisoblagichni nollamaydi. Duel taklifi, guruh xonasi va REST orqali kodni
 * tekshirish bitta limitdan foydalanadi.</p>
 */
@Component
public class OctagonCodeGuard {

    public static final int MAX_FAILED_ATTEMPTS_PER_MINUTE = 10;
    static final long WINDOW_MS = 60_000L;

    private final Clock clock;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public OctagonCodeGuard() {
        this(Clock.systemUTC());
    }

    OctagonCodeGuard(Clock clock) {
        this.clock = clock;
    }

    private static final class Window {
        long startedAt;
        int failures;

        Window(long startedAt) {
            this.startedAt = startedAt;
        }
    }

    /** true — bu daqiqada noto'g'ri urinishlar limiti tugagan, kod tekshirilmaydi. */
    public boolean isBlocked(String userId) {
        if (userId == null) return true;
        Window w = windows.get(userId);
        if (w == null) return false;
        synchronized (w) {
            if (clock.millis() - w.startedAt >= WINDOW_MS) return false;
            return w.failures >= MAX_FAILED_ATTEMPTS_PER_MINUTE;
        }
    }

    public void recordFailure(String userId) {
        if (userId == null) return;
        long now = clock.millis();
        Window w = windows.computeIfAbsent(userId, k -> new Window(now));
        synchronized (w) {
            if (now - w.startedAt >= WINDOW_MS) {
                w.startedAt = now;
                w.failures = 0;
            }
            w.failures++;
        }
    }

    @Scheduled(fixedDelay = 5 * 60 * 1000L)
    public void evictExpired() {
        long now = clock.millis();
        windows.entrySet().removeIf(e -> now - e.getValue().startedAt >= WINDOW_MS);
    }

    int trackedUsers() {
        return windows.size();
    }
}
