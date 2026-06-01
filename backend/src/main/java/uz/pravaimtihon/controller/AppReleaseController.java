package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import uz.pravaimtihon.dto.request.AppReleaseRequest;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.dto.response.AppReleaseResponse;
import uz.pravaimtihon.dto.response.PageResponse;
import uz.pravaimtihon.entity.AppPlatform;
import uz.pravaimtihon.entity.AppReleaseStatus;
import uz.pravaimtihon.entity.AppType;
import uz.pravaimtihon.service.AppReleaseService;

import java.util.Map;

/**
 * Admin: ilova relizlarini boshqarish.
 *
 * <p>Base path: {@code /api/v1/admin/app-releases}</p>
 * <p>Ruxsat: ADMIN va SUPER_ADMIN</p>
 */
@RestController
@RequestMapping("/api/v1/admin/app-releases")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "App Releases (Admin)", description = "Ilova versiyalarini boshqarish — ADMIN+")
public class AppReleaseController {

    private final AppReleaseService service;

    // ── Create ────────────────────────────────────────────────────────────

    @PostMapping
    @Operation(summary = "Yangi ilova relizi yaratish")
    public ResponseEntity<ApiResponse<AppReleaseResponse>> create(
            @Valid @RequestBody AppReleaseRequest request,
            Authentication auth) {

        AppReleaseResponse resp = service.create(request, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Ilova relizi yaratildi", resp));
    }

    // ── Update ────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    @Operation(summary = "Ilova relizini yangilash")
    public ResponseEntity<ApiResponse<AppReleaseResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody AppReleaseRequest request,
            Authentication auth) {

        AppReleaseResponse resp = service.update(id, request, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Ilova relizi yangilandi", resp));
    }

    // ── Get by ID ─────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    @Operation(summary = "ID bo'yicha ilova relizini olish")
    public ResponseEntity<ApiResponse<AppReleaseResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    // ── List (paginated + filtered) ───────────────────────────────────────

    @GetMapping
    @Operation(summary = "Ilova relizlari ro'yxati (filtrlash va sahifalash)")
    public ResponseEntity<ApiResponse<Page<AppReleaseResponse>>> list(
            @RequestParam(required = false) String platform,
            @RequestParam(required = false) String appType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String appName,
            @RequestParam(required = false) String version,
            @RequestParam(defaultValue = "0")           int page,
            @RequestParam(defaultValue = "20")          int size,
            @RequestParam(defaultValue = "releaseDate") String sortBy,
            @RequestParam(defaultValue = "desc")        String sortDir) {

        AppPlatform platformEnum = parseEnum(AppPlatform.class, platform);
        AppType     typeEnum     = parseEnum(AppType.class,     appType);
        AppReleaseStatus statusEnum = parseEnum(AppReleaseStatus.class, status);

        Page<AppReleaseResponse> result = service.list(
                platformEnum, typeEnum, statusEnum, appName, version,
                page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── Delete ────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @Operation(summary = "Ilova relizini o'chirish (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            Authentication auth) {

        service.delete(id, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Ilova relizi o'chirildi", null));
    }

    // ── Set status ────────────────────────────────────────────────────────

    @PatchMapping("/{id}/status")
    @Operation(summary = "Ilova relizi holatini o'zgartirish")
    public ResponseEntity<ApiResponse<AppReleaseResponse>> setStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {

        String statusStr = body != null ? body.getOrDefault("status", "") : "";
        AppReleaseStatus newStatus;
        try {
            newStatus = AppReleaseStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Noto'g'ri status: " + statusStr));
        }

        AppReleaseResponse resp = service.setStatus(id, newStatus, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Holat yangilandi", resp));
    }

    // ── Set latest ────────────────────────────────────────────────────────

    @PatchMapping("/{id}/set-latest")
    @Operation(summary = "Bu versiyani 'latest' (eng so'nggi) deb belgilash")
    public ResponseEntity<ApiResponse<AppReleaseResponse>> setLatest(
            @PathVariable Long id,
            Authentication auth) {

        AppReleaseResponse resp = service.setLatest(id, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Eng so'nggi versiya belgilandi", resp));
    }

    // ── File upload ───────────────────────────────────────────────────────

    @PostMapping(value = "/{id}/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Installer faylini serverga yuklash (SHA-256 auto-hisoblanadi)")
    public ResponseEntity<ApiResponse<AppReleaseResponse>> uploadFile(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Authentication auth) {

        AppReleaseResponse resp = service.uploadInstallerFile(id, file, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Fayl muvaffaqiyatli yuklandi", resp));
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private <E extends Enum<E>> E parseEnum(Class<E> type, String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Enum.valueOf(type, value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
