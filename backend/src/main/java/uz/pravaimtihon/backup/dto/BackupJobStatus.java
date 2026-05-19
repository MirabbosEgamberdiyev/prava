package uz.pravaimtihon.backup.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Async backup/restore jobining holatini kuzatuvchi DTO.
 * Thread-safe volatile fieldlar orqali progress yangilanadi.
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BackupJobStatus {

    public enum JobState { PENDING, RUNNING, COMPLETED, FAILED, CANCELLED }
    public enum JobType  { EXPORT, IMPORT }

    private final String      jobId;
    private final JobType     type;
    private final String      requestedBy;
    private final LocalDateTime startedAt = LocalDateTime.now();

    private volatile JobState     state           = JobState.PENDING;
    private volatile int          progressPercent = 0;
    private volatile String       phase           = "Queued";
    private volatile LocalDateTime completedAt;
    private volatile String       error;

    // EXPORT uchun: yaratilgan temp fayl yo'li
    private volatile String       tempFilePath;
    private volatile long         fileSizeBytes;
    private volatile BackupManifest manifest;

    // IMPORT uchun: restore natijalari
    private volatile String       restoreSummary;

    public BackupJobStatus(String jobId, JobType type, String requestedBy) {
        this.jobId       = jobId;
        this.type        = type;
        this.requestedBy = requestedBy;
    }

    public void markRunning(String phase) {
        this.state = JobState.RUNNING;
        this.phase = phase;
    }

    public void updateProgress(int percent, String phase) {
        this.progressPercent = percent;
        this.phase           = phase;
    }

    public void markCompleted(String phase) {
        this.state           = JobState.COMPLETED;
        this.progressPercent = 100;
        this.phase           = phase;
        this.completedAt     = LocalDateTime.now();
    }

    public void markFailed(String errorMsg) {
        this.state       = JobState.FAILED;
        this.error       = errorMsg;
        this.completedAt = LocalDateTime.now();
    }
}
