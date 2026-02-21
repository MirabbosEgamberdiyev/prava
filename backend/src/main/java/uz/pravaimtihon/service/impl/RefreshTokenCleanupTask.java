package uz.pravaimtihon.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.repository.RefreshTokenRepository;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenCleanupTask {

    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * Cleanup expired and revoked tokens - runs daily at 2 AM
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupTokens() {
        log.info("Cleaning up expired and revoked refresh tokens");

        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(7);
        refreshTokenRepository.deleteExpiredTokens(cutoffDate);

        log.info("Token cleanup completed");
    }
}