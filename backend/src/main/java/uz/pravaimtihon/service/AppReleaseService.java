package uz.pravaimtihon.service;

import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;
import uz.pravaimtihon.dto.request.AppReleaseRequest;
import uz.pravaimtihon.dto.response.AppReleaseResponse;
import uz.pravaimtihon.dto.response.AppUpdateCheckResponse;
import uz.pravaimtihon.entity.AppPlatform;
import uz.pravaimtihon.entity.AppReleaseStatus;
import uz.pravaimtihon.entity.AppType;

import java.util.List;

public interface AppReleaseService {

    // ── Admin CRUD ────────────────────────────────────────────────────────

    AppReleaseResponse create(AppReleaseRequest request, String createdBy);

    AppReleaseResponse update(Long id, AppReleaseRequest request, String updatedBy);

    AppReleaseResponse getById(Long id);

    Page<AppReleaseResponse> list(
            AppPlatform platform,
            AppType appType,
            AppReleaseStatus status,
            String appName,
            String version,
            int page, int size,
            String sortBy, String sortDir);

    void delete(Long id, String deletedBy);

    // ── Status management ─────────────────────────────────────────────────

    AppReleaseResponse setStatus(Long id, AppReleaseStatus newStatus, String updatedBy);

    AppReleaseResponse setLatest(Long id, String updatedBy);

    // ── Public: update check ──────────────────────────────────────────────

    AppUpdateCheckResponse checkUpdate(
            AppPlatform platform,
            AppType appType,
            int currentVersionCode,
            String language);

    List<AppReleaseResponse> getLatestReleases(String language);

    void incrementDownload(Long id);

    // ── File upload ───────────────────────────────────────────────────────

    AppReleaseResponse uploadInstallerFile(Long id, MultipartFile file, String updatedBy);

    /**
     * Yagona oddiy endpoint: admin appName + version + description + file beradi.
     * Platforma (Windows/Linux/macOS) fayl kengaytmasidan avtomatik aniqlanadi.
     *
     * @param appCategory "ONLINE" yoki "OFFLINE" — ilova internetga ulanadi yoki yo'q.
     *                    null bo'lsa "OFFLINE" deb qabul qilinadi.
     */
    AppReleaseResponse quickUpload(
            String appName,
            String version,
            String description,
            String appCategory,
            boolean isActive,
            MultipartFile file,
            String createdBy);

    /**
     * Mavjud relizni yangilash (fayl ixtiyoriy).
     */
    AppReleaseResponse quickUpdate(
            Long id,
            String appName,
            String version,
            String description,
            String appCategory,
            boolean isActive,
            MultipartFile file,
            String updatedBy);

    // ── Chunked upload (katta fayllar uchun: 100MB+) ─────────────────────

    /**
     * Chunked upload init: server'da yangi upload session ochadi va uploadId qaytaradi.
     *
     * @param fileName  Foydalanuvchi fayl nomi (kengaytma uchun)
     * @param totalSize Umumiy hajm (validatsiya uchun)
     * @return uploadId (UUID string)
     */
    String initChunkUpload(String fileName, long totalSize, String createdBy);

    /**
     * Bitta chunk'ni qabul qilib diskka append qiladi.
     *
     * @param uploadId   init'dan olingan UUID
     * @param chunkIndex 0-dan boshlanadi (sequential)
     * @param chunk      bo'lak (multipart)
     */
    void uploadChunk(String uploadId, int chunkIndex, MultipartFile chunk);

    /**
     * Chunked upload finalize: barcha chunk'lar yuklanganidan keyin
     * AppRelease yaratadi va faylni installer/ ga ko'chiradi (SHA-256 hisoblash bilan).
     */
    AppReleaseResponse completeChunkUpload(
            String uploadId,
            String appName,
            String version,
            String description,
            String appCategory,
            boolean isActive,
            String createdBy);

    /**
     * Mavjud release ni chunk upload bilan yangilash.
     */
    AppReleaseResponse completeChunkUpdate(
            Long releaseId,
            String uploadId,
            String appName,
            String version,
            String description,
            String appCategory,
            boolean isActive,
            String updatedBy);

    /**
     * Upload session ni bekor qilish va vaqtinchalik fayllarni o'chirish.
     */
    void cancelChunkUpload(String uploadId);
}
