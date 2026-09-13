package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_download_events", indexes = {
        @Index(name = "idx_ade_platform", columnList = "platform"),
        @Index(name = "idx_ade_downloaded_at", columnList = "downloaded_at"),
        @Index(name = "idx_ade_client_ip", columnList = "client_ip")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppDownloadEvent extends BaseEntity {

    @Column(name = "platform", nullable = false, length = 30)
    private String platform; // WINDOWS, ANDROID, IOS, MACOS, LINUX

    @Column(name = "app_type", length = 30)
    private String appType;

    @Column(name = "release_version", length = 30)
    private String releaseVersion;

    @Column(name = "client_ip", length = 100)
    private String clientIp;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "downloaded_at", nullable = false)
    @Builder.Default
    private LocalDateTime downloadedAt = LocalDateTime.now();
}
