package uz.pravaimtihon.backup.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import uz.pravaimtihon.backup.dto.BackupJobStatus;
import uz.pravaimtihon.backup.dto.BackupJobStatus.JobState;
import uz.pravaimtihon.backup.dto.BackupJobStatus.JobType;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory backup/restore job registry.
 * <p>
 * Thread-safe. Completed/failed joblar 2 soatdan so'ng avtomatik tozalanadi
 * (temp fayllar ham o'chiriladi).
 * <p>
 * Distributed deployment uchun Redis ga ko'chish kerak bo'ladi, lekin
 * single-instance production uchun yetarli.
 */
@Slf4j
@Component
public class BackupJobRegistry {

    private final ConcurrentHashMap<String, BackupJobStatus> registry = new ConcurrentHashMap<>();

    public BackupJobStatus create(JobType type, String requestedBy) {
        String jobId = UUID.randomUUID().toString();
        BackupJobStatus job = new BackupJobStatus(jobId, type, requestedBy);
        registry.put(jobId, job);
        log.info("[BACKUP] Job created: id={} type={} by={}", jobId, type, requestedBy);
        return job;
    }

    public Optional<BackupJobStatus> find(String jobId) {
        return Optional.ofNullable(registry.get(jobId));
    }

    public Collection<BackupJobStatus> all() {
        return registry.values();
    }

    /** Har 30 daqiqada tugatilgan (COMPLETED/FAILED) va 2 soatdan eski joblarni tozalaydi. */
    @Scheduled(fixedDelay = 1_800_000)
    public void cleanupStale() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(2);
        registry.values().stream()
                .filter(j -> j.getState() == JobState.COMPLETED || j.getState() == JobState.FAILED)
                .filter(j -> j.getCompletedAt() != null && j.getCompletedAt().isBefore(cutoff))
                .forEach(j -> {
                    deleteTempFile(j.getTempFilePath());
                    registry.remove(j.getJobId());
                    log.info("[BACKUP] Stale job cleaned: {}", j.getJobId());
                });
    }

    public void deleteTempFile(String path) {
        if (path == null) return;
        try {
            Files.deleteIfExists(Path.of(path));
        } catch (IOException e) {
            log.warn("[BACKUP] Could not delete temp file {}: {}", path, e.getMessage());
        }
    }
}
