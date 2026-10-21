package uz.pravaimtihon.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import uz.pravaimtihon.exception.BaseException;
import uz.pravaimtihon.security.SecurityUtils;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Foydalanuvchi darajasidagi anti-scraping cheklovi (User-Level Rate Limiter).
 * Talab:
 * - 1 daqiqada 10 tadan ko'p yangi bilet/imtihon yoki 200 tadan ko'p yangi savol so'ralsa,
 *   foydalanuvchi qisqa muddatga (60 soniya) cheklanadi (429).
 * - Qayta-qayta buzilsa cooldown progressiv oshadi (60s → 120s → 240s ..., ko'pi bilan 15 daqiqa);
 *   30 daqiqa "toza" o'tsa hisoblagich nolga qaytadi.
 * - Admin/Super Admin rollari cheklovdan ozod qilinadi.
 * - Faol bo'lmagan yozuvlar har 30 daqiqada tozalanadi (xotira oqishi yo'q).
 */
@Slf4j
@Service
public class UserThrottlerService {

    public static final int MAX_STARTS_PER_WINDOW = 10;
    public static final int MAX_QUESTIONS_PER_WINDOW = 200;
    public static final Duration WINDOW_DURATION = Duration.ofSeconds(60);
    public static final Duration BLOCK_DURATION = Duration.ofSeconds(60);
    public static final Duration MAX_BLOCK_DURATION = Duration.ofMinutes(15);
    public static final Duration STRIKE_RESET_AFTER = Duration.ofMinutes(30);
    public static final long CLEANUP_INTERVAL_MS = 30 * 60 * 1000L;

    private static class StartRecord {
        final Instant timestamp;
        final int questionCount;

        StartRecord(Instant timestamp, int questionCount) {
            this.timestamp = timestamp;
            this.questionCount = questionCount;
        }
    }

    private static class UserState {
        final Deque<StartRecord> records = new ArrayDeque<>();
        Instant blockedUntil = null;
        Instant lastStrikeAt = null;
        int strikes = 0;
        /** Tozalovchi xaritadan olib tashlagan; bu obyektga endi yozilmaydi. */
        boolean evicted = false;
    }

    private final Map<Long, UserState> userStates = new ConcurrentHashMap<>();
    private final Clock clock;

    public UserThrottlerService() {
        this(Clock.systemUTC());
    }

    UserThrottlerService(Clock clock) {
        this.clock = clock;
    }

    /**
     * Yangi bilet/imtihon/mavzu so'rovini qayd qiladi va tekshiradi.
     * Limit oshsa BaseException(TOO_MANY_REQUESTS) tashlaydi.
     */
    public void recordAndCheck(Long userId, int questionCount) {
        if (userId == null) {
            return;
        }

        if (SecurityUtils.hasAnyRole("SUPER_ADMIN", "ADMIN")) {
            return;
        }

        while (true) {
            Instant now = clock.instant();
            UserState state = userStates.computeIfAbsent(userId, k -> new UserState());

            synchronized (state) {
                if (state.evicted) {
                    // Tozalovchi shu orada olib tashladi — yangi holat bilan qayta urinamiz.
                    continue;
                }
                check(userId, state, now, questionCount);
                return;
            }
        }
    }

    private void check(Long userId, UserState state, Instant now, int questionCount) {
        if (state.blockedUntil != null) {
            if (now.isBefore(state.blockedUntil)) {
                throw throttled(Duration.between(now, state.blockedUntil));
            }
            state.blockedUntil = null;
            state.records.clear();
        }

        pruneWindow(state, now);

        int currentStarts = state.records.size();
        int currentQuestions = state.records.stream().mapToInt(r -> r.questionCount).sum();

        if (currentStarts >= MAX_STARTS_PER_WINDOW || (currentQuestions + questionCount) > MAX_QUESTIONS_PER_WINDOW) {
            if (state.lastStrikeAt == null || now.isAfter(state.lastStrikeAt.plus(STRIKE_RESET_AFTER))) {
                state.strikes = 0;
            }
            state.strikes++;
            state.lastStrikeAt = now;
            Duration cooldown = cooldownFor(state.strikes);
            state.blockedUntil = now.plus(cooldown);
            log.warn("🚨 Too many starts for user {}: starts={}, questions={}, strike={}. Cooldown {}s.",
                    userId, currentStarts, currentQuestions, state.strikes, cooldown.toSeconds());
            throw throttled(cooldown);
        }

        state.records.addLast(new StartRecord(now, questionCount));
    }

    static Duration cooldownFor(int strikes) {
        int shift = Math.min(Math.max(strikes - 1, 0), 10);
        Duration cooldown = BLOCK_DURATION.multipliedBy(1L << shift);
        return cooldown.compareTo(MAX_BLOCK_DURATION) > 0 ? MAX_BLOCK_DURATION : cooldown;
    }

    private static BaseException throttled(Duration remaining) {
        long minutes = Math.max(1, (remaining.toSeconds() + 59) / 60);
        return new BaseException(
                "Juda ko'p so'rov yuborildi. Iltimos, " + minutes + " daqiqadan so'ng qayta urinib ko'ring.",
                HttpStatus.TOO_MANY_REQUESTS
        );
    }

    private static void pruneWindow(UserState state, Instant now) {
        Instant windowStart = now.minus(WINDOW_DURATION);
        while (!state.records.isEmpty() && state.records.peekFirst().timestamp.isBefore(windowStart)) {
            state.records.pollFirst();
        }
    }

    private static boolean isIdle(UserState state, Instant now) {
        if (state.blockedUntil != null && now.isBefore(state.blockedUntil)) {
            return false;
        }
        if (state.lastStrikeAt != null && !now.isAfter(state.lastStrikeAt.plus(STRIKE_RESET_AFTER))) {
            return false;
        }
        pruneWindow(state, now);
        return state.records.isEmpty();
    }

    /**
     * Faol bo'lmagan (oynasi bo'sh, bloklanmagan, yaqinda buzmagan) foydalanuvchilarni xotiradan o'chiradi.
     */
    @Scheduled(fixedDelay = CLEANUP_INTERVAL_MS, initialDelay = CLEANUP_INTERVAL_MS)
    public void cleanupIdleUsers() {
        int removed = evictIdle();
        if (removed > 0) {
            log.debug("UserThrottler cleanup: removed {} idle entries, {} remain", removed, userStates.size());
        }
    }

    int evictIdle() {
        Instant now = clock.instant();
        int[] removed = {0};
        userStates.entrySet().removeIf(entry -> {
            UserState state = entry.getValue();
            synchronized (state) {
                if (isIdle(state, now)) {
                    state.evicted = true;
                    removed[0]++;
                    return true;
                }
                return false;
            }
        });
        return removed[0];
    }

    public boolean isBlocked(Long userId) {
        if (userId == null) return false;
        UserState state = userStates.get(userId);
        if (state == null) return false;
        synchronized (state) {
            return state.blockedUntil != null && clock.instant().isBefore(state.blockedUntil);
        }
    }

    int trackedUsers() {
        return userStates.size();
    }

    public void resetUser(Long userId) {
        if (userId != null) {
            userStates.remove(userId);
        }
    }

    public void clearAll() {
        userStates.clear();
    }
}
