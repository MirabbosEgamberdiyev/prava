package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Desktop/Web ilovaning bitta relizi (versiyasi).
 *
 * <p>Har bir satr bitta fayl formatiga to'g'ri keladi:
 * masalan, "Prava Desktop v1.2.0 — Windows NSIS (.exe)".</p>
 *
 * <p>Bir xil versiyaning turli formatlari (EXE, MSI, DEB...)
 * alohida satrlar sifatida saqlanadi.</p>
 */
@Entity
@Table(
    name = "app_releases",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_app_release_platform_type_version",
            columnNames = {"platform", "app_type", "release_version"}
        )
    },
    indexes = {
        @Index(name = "idx_ar_platform",     columnList = "platform"),
        @Index(name = "idx_ar_app_type",     columnList = "app_type"),
        @Index(name = "idx_ar_status",       columnList = "status"),
        @Index(name = "idx_ar_is_latest",    columnList = "is_latest"),
        @Index(name = "idx_ar_version_code", columnList = "version_code"),
        @Index(name = "idx_ar_release_date", columnList = "release_date")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppRelease extends BaseEntity {

    // ── Ilova identifikatori ──────────────────────────────────────────────

    /**
     * Ilova nomi (masalan "Prava Desktop Online", "Prava Test").
     */
    @Column(name = "app_name", nullable = false, length = 200)
    private String appName;

    // ── Platforma va tur ─────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(name = "platform", nullable = false, length = 20)
    private AppPlatform platform;

    @Enumerated(EnumType.STRING)
    @Column(name = "app_type", nullable = false, length = 30)
    private AppType appType;

    // ── Versiya ──────────────────────────────────────────────────────────

    /**
     * Semantic versioning: "1.2.3".
     * Java maydon nomi {@code appVersion} — BaseEntity.version (Long, optimistic lock)
     * bilan to'qnashuv oldini olish uchun.
     */
    @Column(name = "release_version", nullable = false, length = 30)
    private String appVersion;

    /**
     * Dasturiy taqqoslash uchun integer versiya kodi.
     * Masalan: 1.2.3 → 10203, 2.0.0 → 20000.
     * Katta qiymat = yangroq versiya.
     */
    @Column(name = "version_code", nullable = false)
    private Integer versionCode;

    // ── Holat ────────────────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private AppReleaseStatus status = AppReleaseStatus.DRAFT;

    /**
     * Ushbu platforma+tur uchun eng so'nggi reliz.
     * Yangi "latest" belgilanganda avvalgisi false ga o'tkaziladi.
     */
    @Column(name = "is_latest", nullable = false)
    @Builder.Default
    private Boolean isLatest = false;

    /**
     * Majburiy yangilash: true bo'lsa, eski versiyalar bu versiyaga
     * o'tishga majburlash xabari oladi.
     */
    @Column(name = "is_force_update", nullable = false)
    @Builder.Default
    private Boolean isForceUpdate = false;

    /**
     * Minimal qo'llab-quvvatlanadigan versiya (eskisi ishlamaydigan holat).
     * null bo'lsa — cheklov yo'q.
     */
    @Column(name = "min_supported_version", length = 30)
    private String minSupportedVersion;

    // ── Reliz ma'lumotlari ────────────────────────────────────────────────

    /**
     * Yangiliklar / Release notes — ko'p tilli.
     */
    @Column(name = "release_notes_uzl", columnDefinition = "TEXT")
    private String releaseNotesUzl;

    @Column(name = "release_notes_uzc", columnDefinition = "TEXT")
    private String releaseNotesUzc;

    @Column(name = "release_notes_ru", columnDefinition = "TEXT")
    private String releaseNotesRu;

    @Column(name = "release_notes_en", columnDefinition = "TEXT")
    private String releaseNotesEn;

    /** Reliz sanasi */
    @Column(name = "release_date")
    private LocalDate releaseDate;

    // ── Fayl ─────────────────────────────────────────────────────────────

    /**
     * Yuklab olish URL (lokal storage, S3, Cloudinary yoki GitHub Releases).
     */
    @Column(name = "download_url", length = 1000)
    private String downloadUrl;

    /**
     * Fayl hajmi (baytlarda).
     */
    @Column(name = "file_size")
    private Long fileSize;

    /**
     * SHA-256 checksum — fayl yaxlitligini tekshirish uchun.
     */
    @Column(name = "checksum", length = 64)
    private String checksum;

    // ── Statistika ───────────────────────────────────────────────────────

    @Column(name = "download_count", nullable = false)
    @Builder.Default
    private Long downloadCount = 0L;
}
