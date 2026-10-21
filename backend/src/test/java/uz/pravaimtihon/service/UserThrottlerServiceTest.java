package uz.pravaimtihon.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import uz.pravaimtihon.exception.BaseException;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.*;

class UserThrottlerServiceTest {

    /** Testlar uchun qo'lda suriladigan soat. */
    private static final class MutableClock extends Clock {
        private Instant now = Instant.parse("2026-10-21T08:00:00Z");

        void advance(Duration d) {
            now = now.plus(d);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }

    private MutableClock clock;
    private UserThrottlerService throttlerService;

    @BeforeEach
    void setUp() {
        clock = new MutableClock();
        throttlerService = new UserThrottlerService(clock);
        throttlerService.clearAll();
    }

    private void startTimes(Long userId, int times, int questions) {
        for (int i = 0; i < times; i++) {
            throttlerService.recordAndCheck(userId, questions);
        }
    }

    @Test
    void limitsMatchProductRequirements() {
        assertEquals(10, UserThrottlerService.MAX_STARTS_PER_WINDOW);
        assertEquals(200, UserThrottlerService.MAX_QUESTIONS_PER_WINDOW);
        assertEquals(Duration.ofSeconds(60), UserThrottlerService.BLOCK_DURATION);
    }

    @Test
    void allowsTenStartsWithinWindow() {
        Long userId = 100L;
        // 10 ta real imtihon (20 savoldan) = 200 savol — chegarada, ruxsat etiladi.
        assertDoesNotThrow(() -> startTimes(userId, 10, 20));
        assertFalse(throttlerService.isBlocked(userId));
    }

    @Test
    void blocksOnEleventhStartWithFriendlyMessage() {
        Long userId = 200L;
        startTimes(userId, 10, 10);

        BaseException ex = assertThrows(BaseException.class, () -> throttlerService.recordAndCheck(userId, 10));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatus());
        assertEquals("Juda ko'p so'rov yuborildi. Iltimos, 1 daqiqadan so'ng qayta urinib ko'ring.", ex.getMessage());
        assertTrue(throttlerService.isBlocked(userId));

        // Cooldown davomida so'rovlar rad etiladi.
        clock.advance(Duration.ofSeconds(30));
        BaseException ex2 = assertThrows(BaseException.class, () -> throttlerService.recordAndCheck(userId, 10));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex2.getStatus());
    }

    @Test
    void cooldownLastsSixtySecondsNotAnHour() {
        Long userId = 250L;
        startTimes(userId, 10, 10);
        assertThrows(BaseException.class, () -> throttlerService.recordAndCheck(userId, 10));

        clock.advance(Duration.ofSeconds(59));
        assertTrue(throttlerService.isBlocked(userId));

        clock.advance(Duration.ofSeconds(2));
        assertFalse(throttlerService.isBlocked(userId));
        assertDoesNotThrow(() -> throttlerService.recordAndCheck(userId, 10));
    }

    @Test
    void startsOutsideWindowDoNotCount() {
        Long userId = 260L;
        startTimes(userId, 10, 10);
        clock.advance(Duration.ofSeconds(61));
        assertDoesNotThrow(() -> startTimes(userId, 10, 10));
        assertFalse(throttlerService.isBlocked(userId));
    }

    @Test
    void blocksWhenQuestionCountExceedsWindowMax() {
        Long userId = 300L;
        throttlerService.recordAndCheck(userId, 150);

        // Keyingi 60 ta savol jami 210 bo'ladi (> 200).
        BaseException ex = assertThrows(BaseException.class, () -> throttlerService.recordAndCheck(userId, 60));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatus());
        assertTrue(throttlerService.isBlocked(userId));
    }

    @Test
    void repeatedViolationsEscalateCooldownProgressively() {
        Long userId = 350L;

        startTimes(userId, 10, 10);
        assertThrows(BaseException.class, () -> throttlerService.recordAndCheck(userId, 10));
        clock.advance(Duration.ofSeconds(61));

        startTimes(userId, 10, 10);
        BaseException second = assertThrows(BaseException.class, () -> throttlerService.recordAndCheck(userId, 10));
        assertTrue(second.getMessage().contains("2 daqiqadan"), second.getMessage());

        clock.advance(Duration.ofSeconds(90));
        assertTrue(throttlerService.isBlocked(userId), "2-buzilishda cooldown 120 soniya");
        clock.advance(Duration.ofSeconds(31));
        assertFalse(throttlerService.isBlocked(userId));

        assertEquals(Duration.ofSeconds(60), UserThrottlerService.cooldownFor(1));
        assertEquals(Duration.ofSeconds(240), UserThrottlerService.cooldownFor(3));
        assertEquals(Duration.ofMinutes(15), UserThrottlerService.cooldownFor(50));
    }

    @Test
    void strikesResetAfterQuietPeriod() {
        Long userId = 360L;
        startTimes(userId, 10, 10);
        assertThrows(BaseException.class, () -> throttlerService.recordAndCheck(userId, 10));

        clock.advance(UserThrottlerService.STRIKE_RESET_AFTER.plusMinutes(1));
        startTimes(userId, 10, 10);
        BaseException again = assertThrows(BaseException.class, () -> throttlerService.recordAndCheck(userId, 10));
        assertTrue(again.getMessage().contains("1 daqiqadan"), again.getMessage());
    }

    @Test
    void cleanupEvictsIdleUsersButKeepsActiveOnes() {
        throttlerService.recordAndCheck(1L, 10);           // tez orada bo'sh qoladi
        startTimes(2L, 10, 10);
        assertThrows(BaseException.class, () -> throttlerService.recordAndCheck(2L, 10)); // bloklangan
        assertEquals(2, throttlerService.trackedUsers());

        clock.advance(Duration.ofSeconds(61));
        throttlerService.recordAndCheck(3L, 10);           // hozir faol

        // 1 — bo'sh; 2 — cooldown tugagan, lekin yaqinda buzgan (strike tarixi saqlanadi); 3 — faol.
        assertEquals(1, throttlerService.evictIdle());
        assertEquals(2, throttlerService.trackedUsers());

        clock.advance(UserThrottlerService.STRIKE_RESET_AFTER.plusMinutes(1));
        assertEquals(2, throttlerService.evictIdle());
        assertEquals(0, throttlerService.trackedUsers());

        // Tozalangandan keyin foydalanuvchi odatdagidek ishlay oladi.
        assertDoesNotThrow(() -> startTimes(2L, 10, 10));
    }

    @Test
    void unblockedAfterReset() {
        Long userId = 400L;
        startTimes(userId, 10, 10);
        assertThrows(BaseException.class, () -> throttlerService.recordAndCheck(userId, 10));
        assertTrue(throttlerService.isBlocked(userId));

        throttlerService.resetUser(userId);
        assertFalse(throttlerService.isBlocked(userId));
        assertDoesNotThrow(() -> throttlerService.recordAndCheck(userId, 10));
    }

    @Test
    void ignoresNullUserId() {
        assertDoesNotThrow(() -> throttlerService.recordAndCheck(null, 100));
        assertFalse(throttlerService.isBlocked(null));
    }
}
