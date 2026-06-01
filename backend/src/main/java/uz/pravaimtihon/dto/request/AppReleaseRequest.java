package uz.pravaimtihon.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import uz.pravaimtihon.entity.AppPlatform;
import uz.pravaimtihon.entity.AppReleaseStatus;
import uz.pravaimtihon.entity.AppType;

import java.time.LocalDate;

/**
 * Ilova relizini yaratish / yangilash so'rovi.
 */
@Data
public class AppReleaseRequest {

    // ── Identifikator ─────────────────────────────────────────────────────

    @NotBlank(message = "Ilova nomi majburiy")
    @Size(max = 200, message = "Ilova nomi 200 belgidan oshmasligi kerak")
    private String appName;

    // ── Platforma ─────────────────────────────────────────────────────────

    @NotNull(message = "Platforma tanlanishi shart")
    private AppPlatform platform;

    @NotNull(message = "Ilova turi tanlanishi shart")
    private AppType appType;

    // ── Versiya ───────────────────────────────────────────────────────────

    @NotBlank(message = "Versiya raqami majburiy")
    @Pattern(
        regexp = "^\\d+\\.\\d+\\.\\d+$",
        message = "Versiya formati noto'g'ri (masalan: 1.2.3)"
    )
    @Size(max = 30)
    private String appVersion;

    @NotNull(message = "Versiya kodi majburiy")
    @Min(value = 1, message = "Versiya kodi 1 dan katta bo'lishi kerak")
    private Integer versionCode;

    // ── Holat ─────────────────────────────────────────────────────────────

    private AppReleaseStatus status;

    private Boolean isLatest;

    private Boolean isForceUpdate;

    @Size(max = 30)
    private String minSupportedVersion;

    // ── Reliz ma'lumotlari ────────────────────────────────────────────────

    private String releaseNotesUzl;
    private String releaseNotesUzc;
    private String releaseNotesRu;
    private String releaseNotesEn;

    private LocalDate releaseDate;

    // ── Fayl ─────────────────────────────────────────────────────────────

    @Size(max = 1000, message = "URL 1000 belgidan oshmasligi kerak")
    private String downloadUrl;

    /** Fayl hajmi (baytlarda) */
    private Long fileSize;

    @Size(max = 64, message = "SHA-256 checksum 64 belgi")
    private String checksum;
}
