package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.dto.response.DatabaseBackupResponse;
import uz.pravaimtihon.dto.response.LogResponse;
import uz.pravaimtihon.dto.response.ServerInfoResponse;
import uz.pravaimtihon.service.impl.DatabaseBackupService;
import uz.pravaimtihon.service.impl.SystemMonitorService;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * System Monitor Controller - Server ma'lumotlari va log boshqaruvi
 * Faqat SUPER_ADMIN uchun
 */
@RestController
@RequestMapping("/api/v1/admin/system")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "System Monitor", description = "Server monitoring va log boshqaruvi (SUPER_ADMIN only)")
public class SystemMonitorController {

    private final SystemMonitorService systemMonitorService;
    private final DatabaseBackupService databaseBackupService;

    /**
     * Get full server information
     * GET /api/v1/admin/system/info
     */
    @GetMapping("/info")
    @Operation(
            summary = "Server ma'lumotlari",
            description = "OS, Memory, Disk, CPU, JVM, Database haqida to'liq ma'lumot"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Server info"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Faqat SUPER_ADMIN")
    })
    public ResponseEntity<ApiResponse<ServerInfoResponse>> getServerInfo() {
        log.info("Server info requested");
        ServerInfoResponse response = systemMonitorService.getServerInfo();
        return ResponseEntity.ok(ApiResponse.success("Server ma'lumotlari", response));
    }

    /**
     * Get log file content (last N lines)
     * GET /api/v1/admin/system/logs?lines=100&fromLine=1
     */
    @GetMapping("/logs")
    @Operation(
            summary = "Log faylni o'qish",
            description = "Log fayldan oxirgi N qator yoki belgilangan qatordan boshlab o'qish"
    )
    public ResponseEntity<ApiResponse<LogResponse>> getLogs(
            @Parameter(description = "Nechta qator olish", example = "100")
            @RequestParam(defaultValue = "100") int lines,

            @Parameter(description = "Qaysi qatordan boshlash (optional)", example = "1")
            @RequestParam(required = false) Integer fromLine) {

        log.info("Logs requested: lines={}, fromLine={}", lines, fromLine);
        LogResponse response = systemMonitorService.getLogContent(lines, fromLine);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Search logs for specific pattern
     * GET /api/v1/admin/system/logs/search?pattern=ERROR&maxResults=50
     */
    @GetMapping("/logs/search")
    @Operation(
            summary = "Loglarni qidirish",
            description = "Log faylda pattern bo'yicha qidirish (ERROR, WARN, exception, etc.)"
    )
    public ResponseEntity<ApiResponse<LogResponse>> searchLogs(
            @Parameter(description = "Qidiruv so'zi", example = "ERROR")
            @RequestParam String pattern,

            @Parameter(description = "Maksimal natijalar soni", example = "50")
            @RequestParam(defaultValue = "50") int maxResults) {

        log.info("Log search requested: pattern={}, maxResults={}", pattern, maxResults);
        LogResponse response = systemMonitorService.searchLogs(pattern, maxResults);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Clear (truncate) log file
     * DELETE /api/v1/admin/system/logs
     */
    @DeleteMapping("/logs")
    @Operation(
            summary = "Loglarni tozalash",
            description = "Log faylni tozalash (backup saqlanadi)"
    )
    public ResponseEntity<ApiResponse<LogResponse>> clearLogs() {
        log.warn("Log clear requested!");
        LogResponse response = systemMonitorService.clearLogs();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Download log file
     * GET /api/v1/admin/system/logs/download
     */
    @GetMapping("/logs/download")
    @Operation(
            summary = "Log faylni yuklab olish",
            description = "Log faylni to'liq yuklab olish"
    )
    public ResponseEntity<byte[]> downloadLogs() throws IOException {
        log.info("Log download requested");
        byte[] logContent = systemMonitorService.downloadLogs();

        String filename = "prava-online-logs-" +
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss")) +
                ".log";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.TEXT_PLAIN)
                .contentLength(logContent.length)
                .body(logContent);
    }

    /**
     * Trigger garbage collection
     * POST /api/v1/admin/system/gc
     */
    @PostMapping("/gc")
    @Operation(
            summary = "Garbage Collection ishga tushirish",
            description = "JVM garbage collection ni majburan ishga tushirish"
    )
    public ResponseEntity<ApiResponse<Map<String, Object>>> triggerGC() {
        log.warn("Garbage collection requested!");
        Map<String, Object> result = systemMonitorService.triggerGC();
        return ResponseEntity.ok(ApiResponse.success("Garbage collection completed", result));
    }

    /**
     * Health check with details
     * GET /api/v1/admin/system/health
     */
    @GetMapping("/health")
    @Operation(
            summary = "Health check",
            description = "Serverning sog'lig'ini tekshirish"
    )
    public ResponseEntity<ApiResponse<Map<String, Object>>> healthCheck() {
        ServerInfoResponse serverInfo = systemMonitorService.getServerInfo();

        Map<String, Object> health = Map.of(
                "status", "UP",
                "memoryUsagePercent", serverInfo.getMemoryUsagePercent(),
                "diskUsagePercent", serverInfo.getDiskUsagePercent(),
                "freeMemoryMB", serverInfo.getFreeMemoryMB(),
                "freeDiskGB", serverInfo.getFreeDiskGB(),
                "threadCount", serverInfo.getThreadCount(),
                "uptime", serverInfo.getJvmUptime(),
                "databaseConnected", serverInfo.getDatabaseInfo().get("connected")
        );

        return ResponseEntity.ok(ApiResponse.success("Server is healthy", health));
    }

    // ============================================
    // DATABASE BACKUP ENDPOINTS
    // ============================================

    /**
     * Get full database backup as JSON (view in browser)
     * GET /api/v1/admin/system/backup
     */
    @GetMapping("/backup")
    @Operation(
            summary = "Database backup (JSON)",
            description = "Barcha ma'lumotlarni JSON formatda ko'rish: Users, Topics, Questions, Packages, Tickets, ExamSessions, ExamAnswers, UserStatistics"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Backup muvaffaqiyatli yaratildi"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Faqat SUPER_ADMIN")
    })
    public ResponseEntity<ApiResponse<DatabaseBackupResponse>> getBackup() {
        log.info("Database backup requested");
        DatabaseBackupResponse backup = databaseBackupService.createFullBackup();
        return ResponseEntity.ok(ApiResponse.success("Database backup muvaffaqiyatli yaratildi", backup));
    }

    /**
     * Download full database backup as JSON file
     * GET /api/v1/admin/system/backup/download
     */
    @GetMapping("/backup/download")
    @Operation(
            summary = "Database backup yuklab olish",
            description = "Barcha ma'lumotlarni JSON fayl sifatida yuklab olish"
    )
    public ResponseEntity<ApiResponse<DatabaseBackupResponse>> downloadBackup() {
        log.info("Database backup download requested");
        DatabaseBackupResponse backup = databaseBackupService.createFullBackup();

        String filename = "prava-backup-" +
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss")) +
                ".json";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_JSON)
                .body(ApiResponse.success("Database backup", backup));
    }
}
