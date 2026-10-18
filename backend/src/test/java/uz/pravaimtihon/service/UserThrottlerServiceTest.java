package uz.pravaimtihon.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import uz.pravaimtihon.exception.BaseException;

import static org.junit.jupiter.api.Assertions.*;

class UserThrottlerServiceTest {

    private UserThrottlerService throttlerService;

    @BeforeEach
    void setUp() {
        throttlerService = new UserThrottlerService();
        throttlerService.clearAll();
    }

    @Test
    void allowsTwoStartsWithinWindow() {
        Long userId = 100L;
        // 1st start (10 questions)
        assertDoesNotThrow(() -> throttlerService.recordAndCheck(userId, 10));
        // 2nd start (10 questions)
        assertDoesNotThrow(() -> throttlerService.recordAndCheck(userId, 10));

        assertFalse(throttlerService.isBlocked(userId));
    }

    @Test
    void blocksOnThirdStartWithinWindow() {
        Long userId = 200L;
        throttlerService.recordAndCheck(userId, 10);
        throttlerService.recordAndCheck(userId, 10);

        // 3rd start should trigger throttling
        BaseException ex = assertThrows(BaseException.class, () -> throttlerService.recordAndCheck(userId, 10));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatus());
        assertTrue(ex.getMessage().contains("429 Account Throttled"));
        assertTrue(throttlerService.isBlocked(userId));

        // Subsequent call while throttled continues to be rejected
        BaseException ex2 = assertThrows(BaseException.class, () -> throttlerService.recordAndCheck(userId, 10));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex2.getStatus());
    }

    @Test
    void blocksWhenQuestionCountExceedsWindowMax() {
        Long userId = 300L;
        throttlerService.recordAndCheck(userId, 25);

        // Next batch of 25 questions would total 50 questions (> 40 limit)
        BaseException ex = assertThrows(BaseException.class, () -> throttlerService.recordAndCheck(userId, 25));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatus());
        assertTrue(throttlerService.isBlocked(userId));
    }

    @Test
    void unblockedAfterReset() {
        Long userId = 400L;
        throttlerService.recordAndCheck(userId, 10);
        throttlerService.recordAndCheck(userId, 10);
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
