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

    // ── Quick Upload (soddalashtirilgan: faqat nom+versiya+fayl) ─────────────

    /**
     * Sodda yuklash endpointi: fayldan platforma auto, kategoriya admin tanlovi.
     *
     * @param appCategory "ONLINE" (server bilan ishlaydi) yoki "OFFLINE" (internetsiz)
     */
    @PostMapping(value = "/quick-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Sodda yuklash: faqat fayl + nom + versiya + kategoriya")
    public ResponseEntity<ApiResponse<AppReleaseResponse>> quickUpload(
            @RequestParam("appName")                                 String        appName,
            @RequestParam("version")                                 String        version,
            @RequestParam(value = "releaseNotesUzl", required = false) String      releaseNotesUzl,
            @RequestParam(value = "releaseNotesUzc", required = false) String      releaseNotesUzc,
            @RequestParam(value = "releaseNotesRu",  required = false) String      releaseNotesRu,
            @RequestParam(value = "releaseNotesEn",  required = false) String      releaseNotesEn,
            @RequestParam(value = "appCategory",  defaultValue = "OFFLINE") String appCategory,
            @RequestParam(value = "isActive",     defaultValue = "true") boolean  isActive,
            @RequestParam("file")                                    MultipartFile file,
            Authentication auth) {

        AppReleaseResponse resp = service.quickUpload(
                appName, version, releaseNotesUzl, releaseNotesUzc, releaseNotesRu, releaseNotesEn,
                appCategory, isActive, file, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Ilova muvaffaqiyatli qo'shildi", resp));
    }

    @PutMapping(value = "/{id}/quick-update", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Sodda yangilash (fayl ixtiyoriy)")
    public ResponseEntity<ApiResponse<AppReleaseResponse>> quickUpdate(
            @PathVariable Long id,
            @RequestParam(value = "appName",         required = false) String        appName,
            @RequestParam(value = "version",         required = false) String        version,
            @RequestParam(value = "releaseNotesUzl", required = false) String        releaseNotesUzl,
            @RequestParam(value = "releaseNotesUzc", required = false) String        releaseNotesUzc,
            @RequestParam(value = "releaseNotesRu",  required = false) String        releaseNotesRu,
            @RequestParam(value = "releaseNotesEn",  required = false) String        releaseNotesEn,
            @RequestParam(value = "appCategory",     required = false) String        appCategory,
            @RequestParam(value = "isActive",        defaultValue = "true") boolean  isActive,
            @RequestParam(value = "file",            required = false) MultipartFile file,
            Authentication auth) {

        AppReleaseResponse resp = service.quickUpdate(
                id, appName, version, releaseNotesUzl, releaseNotesUzc, releaseNotesRu, releaseNotesEn,
                appCategory, isActive, file, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Ilova yangilandi", resp));
    }

    // ─── Chunked Upload (katta fayllar uchun: 100MB+) ──────────────────────

    /** 1-qadam: upload session boshlash → uploadId qaytaradi */
    @PostMapping("/chunk-init")
    @Operation(summary = "Chunked upload boshlash")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> chunkInit(
            @RequestBody java.util.Map<String, Object> body,
            Authentication auth) {

        String fileName = String.valueOf(body.getOrDefault("fileName", ""));
        long   totalSize = Long.parseLong(String.valueOf(body.getOrDefault("totalSize", "0")));

        String uploadId = service.initChunkUpload(fileName, totalSize, auth.getName());
        return ResponseEntity.ok(ApiResponse.success(java.util.Map.of(
                "uploadId",   uploadId,
                "chunkSize",  5 * 1024 * 1024,   // tavsiya: 5MB
                "fileName",   fileName,
                "totalSize",  totalSize
        )));
    }

    /** 2-qadam: bo'lakni yuborish */
    @PostMapping(value = "/chunk-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Bitta chunkni yuborish")
    public ResponseEntity<ApiResponse<Void>> chunkUpload(
            @RequestParam("uploadId")   String uploadId,
            @RequestParam("chunkIndex") int    chunkIndex,
            @RequestParam("chunk")      MultipartFile chunk) {

        service.uploadChunk(uploadId, chunkIndex, chunk);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** 3-qadam: yangi AppRelease yaratish (NEW) */
    @PostMapping("/chunk-complete")
    @Operation(summary = "Chunked upload yakunlash — yangi reliz")
    public ResponseEntity<ApiResponse<AppReleaseResponse>> chunkComplete(
            @RequestBody java.util.Map<String, Object> body,
            Authentication auth) {

        String uploadId    = String.valueOf(body.get("uploadId"));
        String appName     = String.valueOf(body.get("appName"));
        String version     = String.valueOf(body.get("version"));
        String releaseNotesUzl = body.get("releaseNotesUzl") != null ? String.valueOf(body.get("releaseNotesUzl")) : null;
        String releaseNotesUzc = body.get("releaseNotesUzc") != null ? String.valueOf(body.get("releaseNotesUzc")) : null;
        String releaseNotesRu  = body.get("releaseNotesRu")  != null ? String.valueOf(body.get("releaseNotesRu"))  : null;
        String releaseNotesEn  = body.get("releaseNotesEn")  != null ? String.valueOf(body.get("releaseNotesEn"))  : null;
        String appCategory = body.get("appCategory") != null ? String.valueOf(body.get("appCategory")) : "OFFLINE";
        boolean isActive   = body.get("isActive") == null || Boolean.parseBoolean(String.valueOf(body.get("isActive")));

        AppReleaseResponse resp = service.completeChunkUpload(
                uploadId, appName, version, releaseNotesUzl, releaseNotesUzc, releaseNotesRu, releaseNotesEn,
                appCategory, isActive, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Ilova muvaffaqiyatli yuklandi", resp));
    }

    /** 3-qadam (UPDATE): mavjud relizni yangilash */
    @PutMapping("/{id}/chunk-complete")
    @Operation(summary = "Chunked upload yakunlash — mavjud relizni yangilash")
    public ResponseEntity<ApiResponse<AppReleaseResponse>> chunkCompleteUpdate(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Object> body,
            Authentication auth) {

        String uploadId    = String.valueOf(body.get("uploadId"));
        String appName     = body.get("appName")     != null ? String.valueOf(body.get("appName"))     : null;
        String version     = body.get("version")     != null ? String.valueOf(body.get("version"))     : null;
        String releaseNotesUzl = body.get("releaseNotesUzl") != null ? String.valueOf(body.get("releaseNotesUzl")) : null;
        String releaseNotesUzc = body.get("releaseNotesUzc") != null ? String.valueOf(body.get("releaseNotesUzc")) : null;
        String releaseNotesRu  = body.get("releaseNotesRu")  != null ? String.valueOf(body.get("releaseNotesRu"))  : null;
        String releaseNotesEn  = body.get("releaseNotesEn")  != null ? String.valueOf(body.get("releaseNotesEn"))  : null;
        String appCategory = body.get("appCategory") != null ? String.valueOf(body.get("appCategory")) : null;
        boolean isActive   = body.get("isActive") == null || Boolean.parseBoolean(String.valueOf(body.get("isActive")));

        AppReleaseResponse resp = service.completeChunkUpdate(
                id, uploadId, appName, version, releaseNotesUzl, releaseNotesUzc, releaseNotesRu, releaseNotesEn,
                appCategory, isActive, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Ilova yangilandi", resp));
    }

    /** Optional: upload bekor qilish */
    @DeleteMapping("/chunk-cancel/{uploadId}")
    @Operation(summary = "Chunked upload bekor qilish")
    public ResponseEntity<ApiResponse<Void>> chunkCancel(@PathVariable String uploadId) {
        service.cancelChunkUpload(uploadId);
        return ResponseEntity.ok(ApiResponse.success(null));
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
