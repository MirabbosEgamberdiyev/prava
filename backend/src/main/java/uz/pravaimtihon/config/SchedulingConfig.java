package uz.pravaimtihon.config;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class SchedulingConfig {
    // Scheduled tasks are defined in service classes:
    // - VerificationService.cleanupExpiredCodes()
    // - ExamService.cleanupExpiredSessions()
    // - RefreshTokenCleanupTask (add this)
}