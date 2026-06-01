package uz.pravaimtihon.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

/**
 * Desktop ilova uchun yangilanish tekshiruvi javobi.
 *
 * <p>Desktop ilova bu endpointni chaqirib yangi versiya borligini
 * va majburiy yangilanish kerakligini biladi.</p>
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AppUpdateCheckResponse {

    /** Yangi versiya mavjudmi? */
    private Boolean hasUpdate;

    /** Majburiy yangilanish (true bo'lsa ilova ishlamaydi) */
    private Boolean forceUpdate;

    /** Joriy eng so'nggi versiya */
    private String  latestVersion;

    /** Versiya kodi (taqqoslash uchun) */
    private Integer latestVersionCode;

    /** Yuklab olish URL */
    private String  downloadUrl;

    /** Fayl hajmi (baytlarda) */
    private Long    fileSize;

    /** SHA-256 checksum */
    private String  checksum;

    /** Release notes (so'ralgan tildagi) */
    private String  releaseNotes;
}
