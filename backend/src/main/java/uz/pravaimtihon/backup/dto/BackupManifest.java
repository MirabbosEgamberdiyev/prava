package uz.pravaimtihon.backup.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Backup ZIP ichidagi manifest.json fayl strukturasi.
 * Barcha entity, fayl va checksum ma'lumotlarini saqlaydi.
 * Restore paytida schema va integrity validatsiya uchun ishlatiladi.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BackupManifest {

    /** Backup format versiyasi. Import uchun compatibility check. */
    private String version = "2.0";

    private String appName = "prava-online";

    /** Unique backup identifier (UUID). */
    private String backupId;

    private LocalDateTime createdAt;
    private String createdBy;
    private String sourceHost;

    /** Ilovaning build versiyasi (agar mavjud bo'lsa). */
    private String appVersion;

    /**
     * Har bir entity uchun zip path, row count va SHA-256 checksum.
     * Key: tableName (masalan "topics", "users").
     * Tartibi import paytidagi INSERT tartibini belgilaydi.
     */
    private Map<String, EntityInfo> entities = new LinkedHashMap<>();

    /** Media fayllar statistikasi. */
    private MediaInfo media = new MediaInfo();

    /**
     * Barcha data fayllarining birlashtirilgan SHA-256 checksumi.
     * Backup faylining to'liqligini tekshirish uchun.
     */
    private String globalDataChecksum;

    private boolean encrypted;

    /** null yoki "AES-256-GCM" */
    private String encryptionAlgorithm;

    // ─── Nested DTOs ────────────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EntityInfo {
        /** ZIP ichidagi path, masalan "data/01_topics.json" */
        private String zipPath;

        /** Ushbu fayldagi qatorlar soni. */
        private int rowCount;

        /** SHA-256 checksum: "sha256:hex..." formatida. */
        private String checksum;

        /** Join table ekanligini belgilaydi (id ustuni yo'q). */
        private boolean joinTable;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MediaInfo {
        private int fileCount;
        private long totalBytes;
        /** Global SHA-256 — barcha fayl mazmunlari ustida (per-file digest emas, yig'indi). */
        private String checksum;
        /** Per-file: yo'l → integritet ma'lumotlari. Restore vaqtida har bir fayl tekshiriladi. */
        private java.util.Map<String, MediaFileEntry> files = new java.util.LinkedHashMap<>();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MediaFileEntry {
        private long size;
        /** sha256:HEX shaklida — restore vaqtida fayl mazmunini tekshirish uchun. */
        private String checksum;
    }

    // ── Helper ───────────────────────────────────────────────────────────────
    public void addMediaFile(String relativePath, long size, String checksum) {
        if (this.media == null) this.media = new MediaInfo();
        this.media.getFiles().put(relativePath, new MediaFileEntry(size, checksum));
    }
}
