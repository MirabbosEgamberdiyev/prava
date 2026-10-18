package uz.pravaimtihon.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import uz.pravaimtihon.exception.BaseException;
import uz.pravaimtihon.security.SecurityUtils;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Foydalanuvchi darajasidagi anti-scraping cheklovi (User-Level Rate Limiter).
 * Talab:
 * - 1 daqiqada 2 tadan ko'p yangi bilet yoki 40 tadan ko'p yangi savol so'ralsa,
 *   akkaunt 1 soatga avtomatik bloklanadi (429 Account Throttled).
 * - Admin/Super Admin rollari cheklovdan ozod qilinadi.
 */
@Slf4j
@Service
public class UserThrottlerService {

    public static final int MAX_STARTS_PER_WINDOW = 2;
    public static final int MAX_QUESTIONS_PER_WINDOW = 40;
    public static final Duration WINDOW_DURATION = Duration.ofSeconds(60);
    public static final Duration BLOCK_DURATION = Duration.ofHours(1);

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
    }

    private final Map<Long, UserState> userStates = new ConcurrentHashMap<>();

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

        Instant now = Instant.now();
        UserState state = userStates.computeIfAbsent(userId, k -> new UserState());

        synchronized (state) {
            if (state.blockedUntil != null) {
                if (now.isBefore(state.blockedUntil)) {
                    long remainingMin = Duration.between(now, state.blockedUntil).toMinutes() + 1;
                    log.warn("🚨 User {} is throttled for another {} min", userId, remainingMin);
                    throw new BaseException(
                            "429 Account Throttled: Shubhali faollik aniqlandi. Akkaunt 1 soatga cheklandi.",
                            HttpStatus.TOO_MANY_REQUESTS
                    );
                } else {
                    state.blockedUntil = null;
                    state.records.clear();
                }
            }

            Instant windowStart = now.minus(WINDOW_DURATION);
            while (!state.records.isEmpty() && state.records.peekFirst().timestamp.isBefore(windowStart)) {
                state.records.pollFirst();
            }

            int currentStarts = state.records.size();
            int currentQuestions = state.records.stream().mapToInt(r -> r.questionCount).sum();

            if (currentStarts >= MAX_STARTS_PER_WINDOW || (currentQuestions + questionCount) > MAX_QUESTIONS_PER_WINDOW) {
                state.blockedUntil = now.plus(BLOCK_DURATION);
                log.warn("🚨 Iterative scraping detected for user {}: starts={}, questions={}. Throttling for 1 hour.",
                        userId, currentStarts, currentQuestions);
                throw new BaseException(
                        "429 Account Throttled: Shubhali faollik aniqlandi. Akkaunt 1 soatga cheklandi.",
                        HttpStatus.TOO_MANY_REQUESTS
                    );
            }

            state.records.addLast(new StartRecord(now, questionCount));
        }
    }

    public boolean isBlocked(Long userId) {
        if (userId == null) return false;
        UserState state = userStates.get(userId);
        if (state == null || state.blockedUntil == null) return false;
        return Instant.now().isBefore(state.blockedUntil);
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
