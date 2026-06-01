package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.dto.response.AppReleaseResponse;
import uz.pravaimtihon.dto.response.AppUpdateCheckResponse;
import uz.pravaimtihon.entity.AppPlatform;
import uz.pravaimtihon.entity.AppType;
import uz.pravaimtihon.service.AppReleaseService;

import java.util.List;

/**
 * Jamoatchilik uchun ilova yangilanish tekshiruvi va eng so'nggi relizlar.
 *
 * <p>Base path: {@code /api/v1/public/app-releases}</p>
 * <p>Autentifikatsiya: talab qilinmaydi (PUBLIC)</p>
 */
@RestController
@RequestMapping("/api/v1/public/app-releases")
@RequiredArgsConstructor
@Tag(name = "App Releases (Public)", description = "Yangilanish tekshiruvi va eng so'nggi relizlar — PUBLIC")
public class PublicAppReleaseController {

    private final AppReleaseService service;

    /**
     * Desktop ilova uchun yangilanish tekshiruvi.
     *
     * <p>Tarix: ilova o'z versiyasini yuboradi, server yangi versiya
     * bor-yo'qligini qaytaradi.</p>
     *
     * <pre>
     * GET /api/v1/public/app-releases/check-update
     *   ?platform=WINDOWS
     *   &appType=WINDOWS_EXE
     *   &currentVersionCode=10000
     *   &lang=uzl
     * </pre>
     */
    @GetMapping("/check-update")
    @Operation(summary = "Yangilanish tekshiruvi (desktop ilova chaqiradi)")
    public ResponseEntity<ApiResponse<AppUpdateCheckResponse>> checkUpdate(
            @RequestParam String  platform,
            @RequestParam String  appType,
            @RequestParam int     currentVersionCode,
            @RequestParam(defaultValue = "uzl") String lang) {

        AppPlatform platformEnum;
        AppType typeEnum;
        try {
            platformEnum = AppPlatform.valueOf(platform.toUpperCase());
            typeEnum     = AppType.valueOf(appType.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Noto'g'ri platform yoki appType"));
        }

        AppUpdateCheckResponse result = service.checkUpdate(
                platformEnum, typeEnum, currentVersionCode, lang);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Barcha platformalar uchun eng so'nggi (isLatest=true, ACTIVE) relizlar.
     */
    @GetMapping("/latest")
    @Operation(summary = "Barcha platformalar uchun eng so'nggi relizlar")
    public ResponseEntity<ApiResponse<List<AppReleaseResponse>>> latestReleases(
            @RequestParam(defaultValue = "uzl") String lang) {

        List<AppReleaseResponse> releases = service.getLatestReleases(lang);
        return ResponseEntity.ok(ApiResponse.success(releases));
    }

    /**
     * Yuklab olish: download_count ni oshiradi va to'g'ri URL ga yo'naltiradi.
     */
    @GetMapping("/download/{id}")
    @Operation(summary = "Yuklab olish (statistika yuritadi, URL ga redirect qiladi)")
    public ResponseEntity<Void> download(@PathVariable Long id) {
        AppReleaseResponse release = service.getById(id);

        if (release.getDownloadUrl() == null || release.getDownloadUrl().isBlank()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        service.incrementDownload(id);

        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, release.getDownloadUrl())
                .build();
    }
}
