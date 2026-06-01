package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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
     * Server base URL — 302 redirect uchun absolyut URL yasash.
     * application.yaml: app.storage.local.base-url
     * Produksiyada: https://164.68.100.190:8080 yoki https://pravaonline.uz
     */
    @Value("${app.storage.local.base-url:http://localhost:8080}")
    private String serverBaseUrl;

    // ── Check update ──────────────────────────────────────────────────────

    @GetMapping("/check-update")
    @Operation(summary = "Yangilanish tekshiruvi (desktop ilova chaqiradi)")
    public ResponseEntity<ApiResponse<AppUpdateCheckResponse>> checkUpdate(
            @RequestParam String  platform,
            @RequestParam String  appType,
            @RequestParam int     currentVersionCode,
            @RequestParam(defaultValue = "uzl") String lang,
            HttpServletRequest request) {

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

        // downloadUrl ni absolyut qilib qaytarish
        if (result.getDownloadUrl() != null && result.getDownloadUrl().startsWith("/")) {
            result.setDownloadUrl(resolveAbsoluteUrl(result.getDownloadUrl(), request));
        }

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── Latest releases ───────────────────────────────────────────────────

    @GetMapping("/latest")
    @Operation(summary = "Barcha platformalar uchun eng so'nggi relizlar")
    public ResponseEntity<ApiResponse<List<AppReleaseResponse>>> latestReleases(
            @RequestParam(defaultValue = "uzl") String lang) {

        List<AppReleaseResponse> releases = service.getLatestReleases(lang);
        return ResponseEntity.ok(ApiResponse.success(releases));
    }

    // ── Download redirect ─────────────────────────────────────────────────

    /**
     * download_count ni oshiradi va faylga yo'naltiradi.
     *
     * <p>Relative URL bo'lsa → absolyut qiladi (HTTP 302 RFC talabi).
     * Masalan: {@code /api/v1/files/installers/uuid.exe}
     * → {@code https://pravaonline.uz/api/v1/files/installers/uuid.exe}</p>
     */
    @GetMapping("/download/{id}")
    @Operation(summary = "Yuklab olish (statistika yuritadi, URL ga redirect)")
    public ResponseEntity<Void> download(
            @PathVariable Long id,
            HttpServletRequest request) {

        AppReleaseResponse release = service.getById(id);

        if (release.getDownloadUrl() == null || release.getDownloadUrl().isBlank()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        service.incrementDownload(id);

        // Absolyut URL yasash
        String location = resolveAbsoluteUrl(release.getDownloadUrl(), request);

        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, location)
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    /**
     * Relative URL ni absolyut qiladi.
     * Birinchi X-Forwarded-Proto/Host headerlarni tekshiradi (nginx proxy uchun),
     * aks holda application.yaml dagi base-url ishlatiladi.
     */
    private String resolveAbsoluteUrl(String url, HttpServletRequest request) {
        if (url == null) return null;
        // Allaqachon absolyut
        if (url.startsWith("http://") || url.startsWith("https://")) return url;

        // Nginx orqasidagi real URL ni aniqlash
        String proto = request.getHeader("X-Forwarded-Proto");
        String host  = request.getHeader("X-Forwarded-Host");

        if (proto != null && host != null) {
            return proto + "://" + host + url;
        }

        // application.yaml dagi base-url
        String base = serverBaseUrl;
        if (base.endsWith("/")) base = base.substring(0, base.length() - 1);
        return base + url;
    }
}
