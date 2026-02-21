package uz.pravaimtihon.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ServerInfoResponse {

    // System Info
    private String osName;
    private String osVersion;
    private String osArch;
    private String javaVersion;
    private String javaVendor;

    // Memory Info (in MB)
    private long totalMemoryMB;
    private long usedMemoryMB;
    private long freeMemoryMB;
    private long maxMemoryMB;
    private double memoryUsagePercent;

    // Disk Info (in GB)
    private long totalDiskGB;
    private long usedDiskGB;
    private long freeDiskGB;
    private double diskUsagePercent;

    // CPU Info
    private int availableProcessors;
    private double systemLoadAverage;

    // JVM Info
    private long jvmUptimeSeconds;
    private String jvmUptime;
    private long threadCount;
    private long peakThreadCount;

    // Application Info
    private String applicationName;
    private String activeProfile;
    private LocalDateTime serverTime;

    // Log Info
    private String logFilePath;
    private long logFileSizeMB;

    // Database Info
    private Map<String, Object> databaseInfo;
}
