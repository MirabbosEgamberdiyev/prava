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
     * Yagona oddiy endpoint: fayl yuklanadi + platforma avtomatik aniqlanadi.
     *
     * <p>Admin faqat: appName, version, description, file beradi.
     * Tizim: platform, appType, checksum, fileSize, releaseDate, isLatest avtomatik hisoblaydi.</p>
     */
    AppReleaseResponse quickUpload(
            String appName,
            String version,
            String description,
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
            boolean isActive,
            MultipartFile file,
            String updatedBy);
}
