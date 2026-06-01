package uz.pravaimtihon.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;
import uz.pravaimtihon.entity.AppPlatform;
import uz.pravaimtihon.entity.AppReleaseStatus;
import uz.pravaimtihon.entity.AppType;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Ilova relizining to'liq ma'lumotlari (admin uchun).
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AppReleaseResponse {

    private Long              id;
    private String            appName;
    private AppPlatform       platform;
    private AppType           appType;
    private String            version;
    private Integer           versionCode;
    private AppReleaseStatus  status;
    private Boolean           isLatest;
    private Boolean           isForceUpdate;
    private String            minSupportedVersion;

    // Release notes (ko'p tilli)
    private String releaseNotesUzl;
    private String releaseNotesUzc;
    private String releaseNotesRu;
    private String releaseNotesEn;

    private LocalDate         releaseDate;
    private String            downloadUrl;
    private Long              fileSize;
    private String            fileSizeFormatted;   // "12.4 MB"
    private String            checksum;
    private Long              downloadCount;

    // Audit
    private LocalDateTime     createdAt;
    private String            createdBy;
    private LocalDateTime     updatedAt;
}
