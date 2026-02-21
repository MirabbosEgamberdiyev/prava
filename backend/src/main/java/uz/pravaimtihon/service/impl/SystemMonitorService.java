package uz.pravaimtihon.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import uz.pravaimtihon.dto.response.LogResponse;
import uz.pravaimtihon.dto.response.ServerInfoResponse;

import javax.sql.DataSource;
import java.io.*;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.RuntimeMXBean;
import java.lang.management.ThreadMXBean;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Slf4j
@RequiredArgsConstructor
public class SystemMonitorService {

    private final Environment environment;
    private final DataSource dataSource;

    @Value("${logging.file.name:logs/prava-online.log}")
    private String logFilePath;

    @Value("${spring.application.name:prava-online}")
    private String applicationName;

    /**
     * Get full server information
     */
    public ServerInfoResponse getServerInfo() {
        Runtime runtime = Runtime.getRuntime();
        MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();
        RuntimeMXBean runtimeMXBean = ManagementFactory.getRuntimeMXBean();
        ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();

        // Memory calculations
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long maxMemory = runtime.maxMemory();
        long usedMemory = totalMemory - freeMemory;

        // Disk calculations
        File root = new File("/");
        if (System.getProperty("os.name").toLowerCase().contains("win")) {
            root = new File("C:\\");
        }
        long totalDisk = root.getTotalSpace();
        long freeDisk = root.getFreeSpace();
        long usedDisk = totalDisk - freeDisk;

        // JVM uptime
        long uptimeMillis = runtimeMXBean.getUptime();
        Duration uptime = Duration.ofMillis(uptimeMillis);
        String uptimeFormatted = String.format("%d days, %d hours, %d minutes",
                uptime.toDays(),
                uptime.toHoursPart(),
                uptime.toMinutesPart());

        // Log file size
        long logSizeMB = 0;
        try {
            Path logPath = Paths.get(logFilePath);
            if (Files.exists(logPath)) {
                logSizeMB = Files.size(logPath) / (1024 * 1024);
            }
        } catch (IOException e) {
            log.warn("Could not get log file size: {}", e.getMessage());
        }

        // Active profile
        String[] activeProfiles = environment.getActiveProfiles();
        String activeProfile = activeProfiles.length > 0 ? String.join(", ", activeProfiles) : "default";

        return ServerInfoResponse.builder()
                // System Info
                .osName(System.getProperty("os.name"))
                .osVersion(System.getProperty("os.version"))
                .osArch(System.getProperty("os.arch"))
                .javaVersion(System.getProperty("java.version"))
                .javaVendor(System.getProperty("java.vendor"))
                // Memory Info
                .totalMemoryMB(totalMemory / (1024 * 1024))
                .usedMemoryMB(usedMemory / (1024 * 1024))
                .freeMemoryMB(freeMemory / (1024 * 1024))
                .maxMemoryMB(maxMemory / (1024 * 1024))
                .memoryUsagePercent(Math.round((double) usedMemory / totalMemory * 100 * 10) / 10.0)
                // Disk Info
                .totalDiskGB(totalDisk / (1024 * 1024 * 1024))
                .usedDiskGB(usedDisk / (1024 * 1024 * 1024))
                .freeDiskGB(freeDisk / (1024 * 1024 * 1024))
                .diskUsagePercent(Math.round((double) usedDisk / totalDisk * 100 * 10) / 10.0)
                // CPU Info
                .availableProcessors(runtime.availableProcessors())
                .systemLoadAverage(ManagementFactory.getOperatingSystemMXBean().getSystemLoadAverage())
                // JVM Info
                .jvmUptimeSeconds(uptimeMillis / 1000)
                .jvmUptime(uptimeFormatted)
                .threadCount(threadMXBean.getThreadCount())
                .peakThreadCount(threadMXBean.getPeakThreadCount())
                // Application Info
                .applicationName(applicationName)
                .activeProfile(activeProfile)
                .serverTime(LocalDateTime.now())
                // Log Info
                .logFilePath(logFilePath)
                .logFileSizeMB(logSizeMB)
                // Database Info
                .databaseInfo(getDatabaseInfo())
                .build();
    }

    /**
     * Get database connection info
     */
    private Map<String, Object> getDatabaseInfo() {
        Map<String, Object> dbInfo = new HashMap<>();
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            dbInfo.put("databaseProductName", metaData.getDatabaseProductName());
            dbInfo.put("databaseProductVersion", metaData.getDatabaseProductVersion());
            dbInfo.put("driverName", metaData.getDriverName());
            dbInfo.put("driverVersion", metaData.getDriverVersion());
            dbInfo.put("url", metaData.getURL());
            dbInfo.put("userName", metaData.getUserName());
            dbInfo.put("connected", true);
        } catch (Exception e) {
            dbInfo.put("connected", false);
            dbInfo.put("error", e.getMessage());
        }
        return dbInfo;
    }

    /**
     * Get log file content (last N lines)
     */
    public LogResponse getLogContent(int lines, Integer fromLine) {
        Path logPath = Paths.get(logFilePath);

        if (!Files.exists(logPath)) {
            return LogResponse.builder()
                    .logFilePath(logFilePath)
                    .message("Log file not found")
                    .lines(Collections.emptyList())
                    .build();
        }

        try {
            long fileSize = Files.size(logPath);
            LocalDateTime lastModified = LocalDateTime.ofInstant(
                    Files.getLastModifiedTime(logPath).toInstant(),
                    ZoneId.systemDefault()
            );

            List<String> allLines = Files.readAllLines(logPath);
            long totalLines = allLines.size();

            List<String> resultLines;
            int from, to;

            if (fromLine != null && fromLine > 0) {
                // Get specific range
                from = Math.max(0, fromLine - 1);
                to = Math.min((int) totalLines, from + lines);
                resultLines = allLines.subList(from, to);
            } else {
                // Get last N lines
                from = Math.max(0, (int) totalLines - lines);
                to = (int) totalLines;
                resultLines = allLines.subList(from, to);
            }

            return LogResponse.builder()
                    .logFilePath(logFilePath)
                    .totalLines(totalLines)
                    .fileSizeBytes(fileSize)
                    .fileSizeMB(String.format("%.2f MB", fileSize / (1024.0 * 1024.0)))
                    .lastModified(lastModified)
                    .lines(resultLines)
                    .fromLine(from + 1)
                    .toLine(to)
                    .build();

        } catch (IOException e) {
            log.error("Error reading log file: {}", e.getMessage());
            return LogResponse.builder()
                    .logFilePath(logFilePath)
                    .message("Error reading log file: " + e.getMessage())
                    .lines(Collections.emptyList())
                    .build();
        }
    }

    /**
     * Search logs for specific pattern
     */
    public LogResponse searchLogs(String pattern, int maxResults) {
        Path logPath = Paths.get(logFilePath);

        if (!Files.exists(logPath)) {
            return LogResponse.builder()
                    .logFilePath(logFilePath)
                    .message("Log file not found")
                    .lines(Collections.emptyList())
                    .build();
        }

        try {
            long fileSize = Files.size(logPath);

            List<String> matchingLines;
            try (Stream<String> stream = Files.lines(logPath)) {
                matchingLines = stream
                        .filter(line -> line.toLowerCase().contains(pattern.toLowerCase()))
                        .limit(maxResults)
                        .collect(Collectors.toList());
            }

            return LogResponse.builder()
                    .logFilePath(logFilePath)
                    .fileSizeBytes(fileSize)
                    .fileSizeMB(String.format("%.2f MB", fileSize / (1024.0 * 1024.0)))
                    .lines(matchingLines)
                    .totalLines((long) matchingLines.size())
                    .message("Found " + matchingLines.size() + " matching lines for pattern: " + pattern)
                    .build();

        } catch (IOException e) {
            log.error("Error searching log file: {}", e.getMessage());
            return LogResponse.builder()
                    .logFilePath(logFilePath)
                    .message("Error searching log file: " + e.getMessage())
                    .lines(Collections.emptyList())
                    .build();
        }
    }

    /**
     * Clear (truncate) log file
     */
    public LogResponse clearLogs() {
        Path logPath = Paths.get(logFilePath);

        if (!Files.exists(logPath)) {
            return LogResponse.builder()
                    .logFilePath(logFilePath)
                    .message("Log file not found")
                    .build();
        }

        try {
            long oldSize = Files.size(logPath);

            // Create backup before clearing
            String backupName = logFilePath + ".backup." + System.currentTimeMillis();
            Files.copy(logPath, Paths.get(backupName));

            // Truncate the log file
            new FileWriter(logPath.toFile(), false).close();

            log.info("Log file cleared. Old size: {} MB, Backup saved to: {}",
                    String.format("%.2f", oldSize / (1024.0 * 1024.0)), backupName);

            return LogResponse.builder()
                    .logFilePath(logFilePath)
                    .message("Log file cleared successfully. Old size: " +
                            String.format("%.2f MB", oldSize / (1024.0 * 1024.0)) +
                            ". Backup saved to: " + backupName)
                    .fileSizeBytes(0)
                    .fileSizeMB("0.00 MB")
                    .totalLines(0L)
                    .build();

        } catch (IOException e) {
            log.error("Error clearing log file: {}", e.getMessage());
            return LogResponse.builder()
                    .logFilePath(logFilePath)
                    .message("Error clearing log file: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Download log file as bytes
     */
    public byte[] downloadLogs() throws IOException {
        Path logPath = Paths.get(logFilePath);
        if (!Files.exists(logPath)) {
            throw new FileNotFoundException("Log file not found: " + logFilePath);
        }
        return Files.readAllBytes(logPath);
    }

    /**
     * Trigger garbage collection (use with caution)
     */
    public Map<String, Object> triggerGC() {
        Runtime runtime = Runtime.getRuntime();

        long beforeFree = runtime.freeMemory();
        long beforeTotal = runtime.totalMemory();
        long beforeUsed = beforeTotal - beforeFree;

        System.gc();

        // Wait a bit for GC to complete
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        long afterFree = runtime.freeMemory();
        long afterTotal = runtime.totalMemory();
        long afterUsed = afterTotal - afterFree;

        long freedMemory = beforeUsed - afterUsed;

        Map<String, Object> result = new HashMap<>();
        result.put("beforeUsedMB", beforeUsed / (1024 * 1024));
        result.put("afterUsedMB", afterUsed / (1024 * 1024));
        result.put("freedMB", freedMemory / (1024 * 1024));
        result.put("message", "Garbage collection triggered. Freed approximately " +
                (freedMemory / (1024 * 1024)) + " MB");

        log.info("GC triggered. Before: {} MB, After: {} MB, Freed: {} MB",
                beforeUsed / (1024 * 1024), afterUsed / (1024 * 1024), freedMemory / (1024 * 1024));

        return result;
    }
}
