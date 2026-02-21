package uz.pravaimtihon.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import uz.pravaimtihon.service.ExamServiceV2;

/**
 * Imtihon sessiyalari uchun scheduled job.
 * Eskirgan sessiyalarni avtomatik EXPIRED qiladi.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ExamSessionScheduler {

    private final ExamServiceV2 examService;

    /**
     * Har 10 daqiqada eskirgan sessiyalarni tekshiradi.
     * Muddati o'tgan sessiyalar EXPIRED statusiga o'tkaziladi.
     */
    @Scheduled(fixedRate = 600000) // 10 daqiqa
    public void expireOldSessions() {
        try {
            int count = examService.expireOldSessions();
            if (count > 0) {
                log.info("Scheduled job: {} ta sessiya expired qilindi", count);
            }
        } catch (Exception e) {
            log.error("Scheduled job xatosi: {}", e.getMessage(), e);
        }
    }
}
