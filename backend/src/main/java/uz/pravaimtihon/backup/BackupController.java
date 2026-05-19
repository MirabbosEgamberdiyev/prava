package uz.pravaimtihon.backup;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import uz.pravaimtihon.backup.dto.BackupJobStatus;
import uz.pravaimtihon.backup.dto.BackupJobStatus.JobType;
import uz.pravaimtihon.backup.dto.ClearOptions;
import uz.pravaimtihon.backup.dto.ImportOptions;
import uz.pravaimtihon.backup.service.BackupJobRegistry;
import uz.pravaimtihon.backup.service.ProductionBackupService;
import uz.pravaimtihon.backup.service.ProductionRestoreService;
import uz.pravaimtihon.dto.response.ApiResponse;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Backup va Restore endpointlari.
 *
 * <pre>
 * ── EXPORT ──────────────────────────────────────────────────────────────────
 * POST /api/v1/admin/backup/export              → async job ishga tushiradi
 * GET  /api/v1/admin/backup/export/{jobId}      → holat JSON
 * GET  /api/v1/admin/backup/export/{jobId}/download → ZIP yuklab olish
 *
 * ── IMPORT ──────────────────────────────────────────────────────────────────
 * POST /api/v1/admin/backup/import              → ZIP yuklaydi, restore ishga tushiradi
 * GET  /api/v1/admin/backup/import/{jobId}      → restore holati
 *
 * ── CLEAR ───────────────────────────────────────────────────────────────────
 * POST /api/v1/admin/backup/clear               → ma'lumotlarni selektiv tozalash
 *
 * ── UTILITY ─────────────────────────────────────────────────────────────────
 * GET  /api/v1/admin/backup/jobs                → barcha active joblar ro'yxati
 * </pre>
 *
 * Barcha endpoint'lar faqat SUPER_ADMIN uchun.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/backup")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Backup & Restore", description = "Production-grade backup/restore (SUPER_ADMIN only)")
public class BackupController {

    /** Maksimal import fayl hajmi: 500 MB */
    private static final long MAX_IMPORT_SIZE_BYTES = 500L * 1024 * 1024;

    private final ProductionBackupService  backupService;
    private final ProductionRestoreService restoreService;
    private final BackupJobRegistry        jobRegistry;

    // ════════════════════════════════════════════════════════════════════════
    // EXPORT
    // ════════════════════════════════════════════════════════════════════════

    @PostMapping("/export")
    @Operation(
            summary = "Backup eksportni ishga tushirish",
            description = "Async backup jarayonini ishga tushiradi. Javobdagi jobId orqali holat kuzatiladi."
    )
    public ResponseEntity<ApiResponse<Map<String, Object>>> startExport(
            @Parameter(description = "Backup ni shifrlash (AES-256-GCM)")
            @RequestParam(defaultValue = "false") boolean encrypt,

            @Parameter(description = "Shifrlash paroli (encrypt=true bo'lsa majburiy)")
            @RequestParam(required = false) String password,

            @AuthenticationPrincipal UserDetails user) {

        if (encrypt && (password == null || password.isBlank())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("encrypt=true bo'lsa password majburiy"));
        }

        BackupJobStatus job = jobRegistry.create(JobType.EXPORT, user.getUsername());
        backupService.startExport(job.getJobId(), encrypt, password);

        log.info("[BACKUP] Export initiated by={} jobId={}", user.getUsername(), job.getJobId());

        return ResponseEntity.accepted().body(ApiResponse.success("Backup ishga tushirildi", Map.of(
                "jobId",   job.getJobId(),
                "status",  job.getState(),
                "message", "GET /api/v1/admin/backup/export/" + job.getJobId() + " orqali kuzating"
        )));
    }

    @GetMapping("/export/{jobId}")
    @Operation(summary = "Backup holati (JSON)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getExportStatus(
            @PathVariable String jobId) {

        BackupJobStatus job = jobRegistry.find(jobId).orElse(null);
        if (job == null || job.getType() != JobType.EXPORT) {
            return ResponseEntity.notFound().build();
        }

        if (job.getState() == BackupJobStatus.JobState.FAILED) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Backup muvaffaqiyatsiz tugadi: " + job.getError()));
        }

        return ResponseEntity.ok(ApiResponse.success("Backup holati", buildStatusMap(job)));
    }

    @GetMapping("/export/{jobId}/download")
    @Operation(summary = "Backup ZIP yuklab olish")
    public ResponseEntity<?> downloadExport(@PathVariable String jobId) throws IOException {

        BackupJobStatus job = jobRegistry.find(jobId).orElse(null);
        if (job == null || job.getType() != JobType.EXPORT) {
            return ResponseEntity.notFound().build();
        }

        return switch (job.getState()) {
            case COMPLETED -> streamBackupFile(job);
            case FAILED    -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                  .body(ApiResponse.error("Backup muvaffaqiyatsiz tugadi: " + job.getError()));
            default        -> ResponseEntity.accepted()
                                  .body(ApiResponse.success("Backup hali tayyor emas", buildStatusMap(job)));
        };
    }

    // ════════════════════════════════════════════════════════════════════════
    // IMPORT
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Backup ZIP faylni yuklaydi va async restore ishga tushiradi.
     *
     * Selective import parametrlari (default = true = import qilinadi):
     *   importUsers, importTopics, importQuestions, importExamPackages,
     *   importExamSessions, importUserStatistics, importPayments,
     *   importTokens, importUserPackageAccess, importMedia
     */
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Backup'dan restore ishga tushirish",
            description = """
                    ZIP backup faylini yuklaydi va async restore jarayonini ishga tushiradi.
                    Selective import: qaysi jadvallarni import qilishni import* parametrlari bilan belgilash mumkin.
                    """
    )
    public ResponseEntity<ApiResponse<Map<String, Object>>> startImport(
            @Parameter(description = "Backup ZIP fayli (max 500MB)")
            @RequestPart("file") MultipartFile file,

            @Parameter(description = "Mavjud ma'lumotlarni o'chirib to'liq restore (EHTIYOT!)")
            @RequestParam(defaultValue = "false") boolean forceReplace,

            @Parameter(description = "Shifrlangan backup paroli")
            @RequestParam(required = false) String password,

            // ── Selective import options ──────────────────────────────────
            @RequestParam(defaultValue = "true") boolean importUsers,
            @RequestParam(defaultValue = "true") boolean importTopics,
            @RequestParam(defaultValue = "true") boolean importQuestions,
            @RequestParam(defaultValue = "true") boolean importExamPackages,
            @RequestParam(defaultValue = "true") boolean importExamSessions,
            @RequestParam(defaultValue = "true") boolean importUserStatistics,
            @RequestParam(defaultValue = "true") boolean importPayments,
            @RequestParam(defaultValue = "true") boolean importTokens,
            @RequestParam(defaultValue = "true") boolean importUserPackageAccess,
            @RequestParam(defaultValue = "true") boolean importMedia,

            @AuthenticationPrincipal UserDetails user) throws IOException {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Fayl bo'sh"));
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || !originalName.toLowerCase().endsWith(".zip")) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Faqat .zip fayl qabul qilinadi"));
        }

        if (file.getSize() > MAX_IMPORT_SIZE_BYTES) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "Fayl hajmi juda katta: " + (file.getSize() / 1024 / 1024) + "MB. Maksimal: 500MB"));
        }

        // ImportOptions yaratish
        ImportOptions options = new ImportOptions();
        options.setImportUsers(importUsers);
        options.setImportTopics(importTopics);
        options.setImportQuestions(importQuestions);
        options.setImportExamPackages(importExamPackages);
        options.setImportExamSessions(importExamSessions);
        options.setImportUserStatistics(importUserStatistics);
        options.setImportPayments(importPayments);
        options.setImportTokens(importTokens);
        options.setImportUserPackageAccess(importUserPackageAccess);
        options.setImportMedia(importMedia);

        Path tempZip = Files.createTempFile("prava-import-", ".zip");
        file.transferTo(tempZip.toFile());

        BackupJobStatus job = jobRegistry.create(JobType.IMPORT, user.getUsername());
        restoreService.startRestore(job.getJobId(), tempZip.toString(), forceReplace, password, options);

        log.info("[RESTORE] Import initiated by={} jobId={} force={} size={}KB",
                user.getUsername(), job.getJobId(), forceReplace, file.getSize() / 1024);

        return ResponseEntity.accepted().body(ApiResponse.success("Restore ishga tushirildi", Map.of(
                "jobId",   job.getJobId(),
                "status",  job.getState(),
                "message", "GET /api/v1/admin/backup/import/" + job.getJobId() + " orqali kuzating"
        )));
    }

    @GetMapping("/import/{jobId}")
    @Operation(summary = "Restore holati")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getImportStatus(
            @PathVariable String jobId) {

        BackupJobStatus job = jobRegistry.find(jobId).orElse(null);
        if (job == null || job.getType() != JobType.IMPORT) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> data = buildStatusMap(job);
        if (job.getRestoreSummary() != null) {
            data.put("summary", job.getRestoreSummary());
        }
        if (job.getTableResults() != null) {
            data.put("tableResults", job.getTableResults());
        }

        return ResponseEntity.ok(ApiResponse.success("Restore holati", data));
    }

    // ════════════════════════════════════════════════════════════════════════
    // CLEAR — selektiv tozalash
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Ma'lumotlarni selektiv tozalaydi.
     *
     * DIQQAT: Bu operatsiya qaytarib bo'lmaydi! Backup qilgandan keyin ishlating.
     *
     * Request body misoli:
     * <pre>
     * {
     *   "clearExamSessions": true,
     *   "clearPayments": true,
     *   "clearUsers": false,
     *   "clearTopics": false,
     *   "clearMedia": false
     * }
     * </pre>
     */
    @PostMapping("/clear")
    @Operation(
            summary = "Ma'lumotlarni selektiv tozalash (QAYTARIB BO'LMAYDI!)",
            description = """
                    Tanlangan jadvallarni TRUNCATE qiladi. FK constraint'lar vaqtinchalik o'chiriladi.
                    clearUsers=true yoki clearTopics=true tanlansa, ularga bog'liq BARCHA jadvallar ham tozalanadi.
                    DIQQAT: Bu operatsiyadan oldin albatta backup qiling!
                    """
    )
    public ResponseEntity<ApiResponse<Map<String, Object>>> clearData(
            @RequestBody ClearOptions options,
            @AuthenticationPrincipal UserDetails user) {

        if (options == null || options.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Hech narsa tanlanmagan. Kamida bitta clear* opsiyasini true qiling."));
        }

        log.warn("[CLEAR] Selective clear requested by={} options={}", user.getUsername(), options);

        List<String> clearedTables = restoreService.clearData(options);

        log.warn("[CLEAR] Completed by={} cleared={}", user.getUsername(), clearedTables);

        return ResponseEntity.ok(ApiResponse.success("Tozalash muvaffaqiyatli bajarildi", Map.of(
                "clearedTables", clearedTables,
                "clearedCount",  clearedTables.size(),
                "mediaCleared",  options.isClearMedia(),
                "clearedBy",     user.getUsername()
        )));
    }

    // ════════════════════════════════════════════════════════════════════════
    // UTILITY
    // ════════════════════════════════════════════════════════════════════════

    @GetMapping("/jobs")
    @Operation(summary = "Barcha backup/restore joblar ro'yxati")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listJobs() {
        List<Map<String, Object>> jobs = jobRegistry.all().stream()
                .map(this::buildStatusMap)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Active jobs", jobs));
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private ResponseEntity<Resource> streamBackupFile(BackupJobStatus job) throws IOException {
        Path tempFile = Path.of(job.getTempFilePath());

        if (!Files.exists(tempFile)) {
            return ResponseEntity.status(HttpStatus.GONE).build();
        }

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));
        String filename  = "prava-backup-" + timestamp + ".zip";

        Resource resource = new FileSystemResource(tempFile);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString())
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(job.getFileSizeBytes())
                .body(resource);
    }

    private Map<String, Object> buildStatusMap(BackupJobStatus job) {
        var map = new java.util.LinkedHashMap<String, Object>();
        map.put("jobId",           job.getJobId());
        map.put("type",            job.getType());
        map.put("state",           job.getState());
        map.put("progressPercent", job.getProgressPercent());
        map.put("phase",           job.getPhase());
        map.put("startedAt",       job.getStartedAt());
        map.put("completedAt",     job.getCompletedAt());
        if (job.getError() != null) {
            map.put("error", job.getError());
        }
        if (job.getType() == JobType.EXPORT && job.getState() == BackupJobStatus.JobState.COMPLETED) {
            map.put("fileSizeKB",   job.getFileSizeBytes() / 1024);
            map.put("downloadUrl",  "/api/v1/admin/backup/export/" + job.getJobId() + "/download");
            if (job.getManifest() != null) {
                map.put("backupId", job.getManifest().getBackupId());
                map.put("entities", job.getManifest().getEntities().entrySet().stream()
                        .collect(java.util.stream.Collectors.toMap(
                                Map.Entry::getKey,
                                e -> e.getValue().getRowCount())));
            }
        }
        return map;
    }
}
