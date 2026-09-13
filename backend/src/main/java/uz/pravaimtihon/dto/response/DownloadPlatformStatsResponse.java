package uz.pravaimtihon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DownloadPlatformStatsResponse {

    private Long totalDownloads;
    private Long totalUniqueUsers;
    private List<PlatformStatItem> platforms;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PlatformStatItem {
        private String platform; // WINDOWS, ANDROID, IOS, MACOS, LINUX
        private Long downloadCount;
        private Long uniqueUsers;
        private LocalDateTime lastDownload;
        private String latestVersion;
    }
}
