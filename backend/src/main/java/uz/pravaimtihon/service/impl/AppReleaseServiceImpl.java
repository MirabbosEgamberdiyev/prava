package uz.pravaimtihon.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import uz.pravaimtihon.dto.request.AppReleaseRequest;
import uz.pravaimtihon.dto.response.AppReleaseResponse;
import uz.pravaimtihon.dto.response.AppUpdateCheckResponse;
import uz.pravaimtihon.entity.*;
import uz.pravaimtihon.repository.AppReleaseRepository;
import uz.pravaimtihon.service.AppReleaseService;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AppReleaseServiceImpl implements AppReleaseService {

    private final AppReleaseRepository repo;

    @Value("${app.storage.local.upload-dir:uploads}")
    private String uploadDir;

    // Ruxsat etilgan installer kengaytmalari
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".exe", ".msi", ".deb", ".rpm", ".appimage", ".tar.gz", ".dmg", ".pkg", ".zip"
    );

    // Installer fayllari uchun maksimal hajm: 1000 MB (1 GB)
    private static final long MAX_INSTALLER_SIZE = 1000L * 1024 * 1024;

    // ─────────────────────────────────────────────────────────────────────────
    // CRUD
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AppReleaseResponse create(AppReleaseRequest req, String createdBy) {
        // Unique versiya tekshiruvi
        if (repo.existsByPlatformAndAppTypeAndAppVersionAndDeletedFalse(
                req.getPlatform(), req.getAppType(), req.getAppVersion())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Bu platforma+tur uchun '" + req.getAppVersion() + "' versiyasi allaqachon mavjud");
        }

        AppRelease entity = AppRelease.builder()
                .appName(req.getAppName())
                .platform(req.getPlatform())
                .appType(req.getAppType())
                .appVersion(req.getAppVersion())
                .versionCode(req.getVersionCode())
                .status(req.getStatus() != null ? req.getStatus() : AppReleaseStatus.DRAFT)
                .isLatest(req.getIsLatest() != null && req.getIsLatest())
                .isForceUpdate(req.getIsForceUpdate() != null && req.getIsForceUpdate())
                .minSupportedVersion(req.getMinSupportedVersion())
                .releaseNotesUzl(req.getReleaseNotesUzl())
                .releaseNotesUzc(req.getReleaseNotesUzc())
                .releaseNotesRu(req.getReleaseNotesRu())
                .releaseNotesEn(req.getReleaseNotesEn())
                .releaseDate(req.getReleaseDate())
                .downloadUrl(req.getDownloadUrl())
                .fileSize(req.getFileSize())
                .checksum(req.getChecksum())
                .build();

        AppRelease saved = repo.save(entity);

        // Agar isLatest=true bo'lsa, boshqalarni false qilish
        if (Boolean.TRUE.equals(saved.getIsLatest())) {
            repo.unsetLatestForOthers(saved.getPlatform(), saved.getAppType(), saved.getId());
        }

        log.info("AppRelease yaratildi: id={}, platform={}, type={}, version={}, by={}",
                saved.getId(), saved.getPlatform(), saved.getAppType(), saved.getAppVersion(), createdBy);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public AppReleaseResponse update(Long id, AppReleaseRequest req, String updatedBy) {
        AppRelease entity = findOrThrow(id);

        // Unique versiya tekshiruvi (o'zini hisobga olmasdan)
        if (req.getAppVersion() != null && req.getVersionCode() != null) {
            if (repo.existsByPlatformAndAppTypeAndAppVersionAndIdNotAndDeletedFalse(
                    req.getPlatform() != null ? req.getPlatform() : entity.getPlatform(),
                    req.getAppType()  != null ? req.getAppType()  : entity.getAppType(),
                    req.getAppVersion(), id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Bu versiya allaqachon mavjud: " + req.getAppVersion());
            }
        }

        // Maydonlarni yangilash
        if (req.getAppName()            != null) entity.setAppName(req.getAppName());
        if (req.getPlatform()           != null) entity.setPlatform(req.getPlatform());
        if (req.getAppType()            != null) entity.setAppType(req.getAppType());
        if (req.getAppVersion()            != null) entity.setAppVersion(req.getAppVersion());
        if (req.getVersionCode()        != null) entity.setVersionCode(req.getVersionCode());
        if (req.getStatus()             != null) entity.setStatus(req.getStatus());
        if (req.getIsForceUpdate()      != null) entity.setIsForceUpdate(req.getIsForceUpdate());
        if (req.getMinSupportedVersion()!= null) entity.setMinSupportedVersion(req.getMinSupportedVersion());
        if (req.getReleaseNotesUzl()    != null) entity.setReleaseNotesUzl(req.getReleaseNotesUzl());
        if (req.getReleaseNotesUzc()    != null) entity.setReleaseNotesUzc(req.getReleaseNotesUzc());
        if (req.getReleaseNotesRu()     != null) entity.setReleaseNotesRu(req.getReleaseNotesRu());
        if (req.getReleaseNotesEn()     != null) entity.setReleaseNotesEn(req.getReleaseNotesEn());
        if (req.getReleaseDate()        != null) entity.setReleaseDate(req.getReleaseDate());
        if (req.getDownloadUrl()        != null) entity.setDownloadUrl(req.getDownloadUrl());
        if (req.getFileSize()           != null) entity.setFileSize(req.getFileSize());
        if (req.getChecksum()           != null) entity.setChecksum(req.getChecksum());

        // isLatest o'zgarishi
        if (req.getIsLatest() != null && !req.getIsLatest().equals(entity.getIsLatest())) {
            entity.setIsLatest(req.getIsLatest());
            if (Boolean.TRUE.equals(req.getIsLatest())) {
                repo.unsetLatestForOthers(entity.getPlatform(), entity.getAppType(), id);
            }
        }

        AppRelease saved = repo.save(entity);
        log.info("AppRelease yangilandi: id={}, by={}", id, updatedBy);
        return toResponse(saved);
    }

    @Override
    public AppReleaseResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Override
    public Page<AppReleaseResponse> list(
            AppPlatform platform, AppType appType, AppReleaseStatus status,
            String appName, String version,
            int page, int size, String sortBy, String sortDir) {

        Sort sort = "desc".equalsIgnoreCase(sortDir)
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return repo.findFiltered(
                platform,
                appType,
                status,
                blankToNull(appName),
                blankToNull(version),
                pageable
        ).map(this::toResponse);
    }

    @Override
    @Transactional
    public void delete(Long id, String deletedBy) {
        AppRelease entity = findOrThrow(id);
        entity.softDelete(deletedBy);
        repo.save(entity);
        log.info("AppRelease o'chirildi: id={}, by={}", id, deletedBy);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Status management
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AppReleaseResponse setStatus(Long id, AppReleaseStatus newStatus, String updatedBy) {
        AppRelease entity = findOrThrow(id);
        AppReleaseStatus old = entity.getStatus();
        entity.setStatus(newStatus);

        // YANKED bo'lsa isLatest ni false qilish
        if (newStatus == AppReleaseStatus.YANKED && Boolean.TRUE.equals(entity.getIsLatest())) {
            entity.setIsLatest(false);
        }

        AppRelease saved = repo.save(entity);
        log.info("AppRelease holati o'zgartirildi: id={}, {}→{}, by={}", id, old, newStatus, updatedBy);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public AppReleaseResponse setLatest(Long id, String updatedBy) {
        AppRelease entity = findOrThrow(id);

        if (entity.getStatus() != AppReleaseStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Faqat ACTIVE holatidagi relizni 'latest' qilish mumkin");
        }

        // Boshqalarni false qil
        repo.unsetLatestForOthers(entity.getPlatform(), entity.getAppType(), id);
        entity.setIsLatest(true);

        AppRelease saved = repo.save(entity);
        log.info("AppRelease latest qilindi: id={}, platform={}, type={}, version={}, by={}",
                id, entity.getPlatform(), entity.getAppType(), entity.getAppVersion(), updatedBy);
        return toResponse(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    public AppUpdateCheckResponse checkUpdate(
            AppPlatform platform, AppType appType,
            int currentVersionCode, String language) {

        // Eng yangi ACTIVE versiyani topish
        List<AppRelease> newer = repo.findNewerVersions(
                platform, appType, currentVersionCode,
                PageRequest.of(0, 1));

        if (newer.isEmpty()) {
            return AppUpdateCheckResponse.builder()
                    .hasUpdate(false)
                    .forceUpdate(false)
                    .build();
        }

        AppRelease latest = newer.get(0);
        return AppUpdateCheckResponse.builder()
                .hasUpdate(true)
                .forceUpdate(Boolean.TRUE.equals(latest.getIsForceUpdate()))
                .latestVersion(latest.getAppVersion())
                .latestVersionCode(latest.getVersionCode())
                .downloadUrl(latest.getDownloadUrl())
                .fileSize(latest.getFileSize())
                .checksum(latest.getChecksum())
                .releaseNotes(getReleaseNotes(latest, language))
                .build();
    }

    @Override
    public List<AppReleaseResponse> getLatestReleases(String language) {
        return repo.findAllByIsLatestTrueAndStatusAndDeletedFalse(AppReleaseStatus.ACTIVE)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void incrementDownload(Long id) {
        repo.incrementDownloadCount(id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // File Upload
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AppReleaseResponse uploadInstallerFile(Long id, MultipartFile file, String updatedBy) {
        AppRelease entity = findOrThrow(id);

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fayl bo'sh bo'lishi mumkin emas");
        }

        if (file.getSize() > MAX_INSTALLER_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("Fayl hajmi %d MB dan oshmasligi kerak (hozir: %s)",
                            MAX_INSTALLER_SIZE / (1024 * 1024), formatBytes(file.getSize())));
        }

        // Kengaytma tekshiruvi
        String originalName = file.getOriginalFilename() != null
                ? file.getOriginalFilename().toLowerCase() : "";
        boolean allowed = ALLOWED_EXTENSIONS.stream().anyMatch(ext ->
                originalName.endsWith(ext) || originalName.endsWith(ext.replace(".", "")));
        // .AppImage case-insensitive
        if (!allowed && !originalName.toLowerCase().endsWith("appimage")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Fayl turi qo'llab-quvvatlanmaydi: " + originalName);
        }

        try {
            // Installer papkasini yaratish
            Path installersDir = Paths.get(uploadDir).toAbsolutePath().normalize()
                    .resolve("installers");
            Files.createDirectories(installersDir);

            // UUID fayl nomi
            String ext = extractExtension(file.getOriginalFilename());
            String fileName = UUID.randomUUID().toString() + ext;
            Path targetPath = installersDir.resolve(fileName);

            // Security: path traversal check
            if (!targetPath.startsWith(installersDir)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Noto'g'ri fayl yo'li");
            }

            // Faylni yozish VA SHA-256 hisoblash — bir o'tishda
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (InputStream in = new DigestInputStream(file.getInputStream(), digest)) {
                Files.copy(in, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }
            String sha256 = HexFormat.of().formatHex(digest.digest());

            // DB URL: /api/v1/files/installers/{fileName}
            String fileUrl = "/api/v1/files/installers/" + fileName;

            // Entity yangilash
            entity.setDownloadUrl(fileUrl);
            entity.setFileSize(file.getSize());
            entity.setChecksum(sha256);

            AppRelease saved = repo.save(entity);

            log.info("Installer fayl yuklandi: id={}, file={}, size={}, sha256={}, by={}",
                    id, fileName, formatBytes(file.getSize()), sha256.substring(0, 8) + "...", updatedBy);

            return toResponse(saved);

        } catch (IOException e) {
            log.error("Fayl yuklashda xato: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Fayl saqlashda xato: " + e.getMessage());
        } catch (NoSuchAlgorithmException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "SHA-256 hisoblashda xato");
        }
    }

    /** Original fayl nomidan kengaytma oladi. .tar.gz ni to'g'ri qaytaradi. */
    private String extractExtension(String filename) {
        if (filename == null) return "";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".tar.gz")) return ".tar.gz";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : "";
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private AppRelease findOrThrow(Long id) {
        return repo.findById(id)
                .filter(r -> !Boolean.TRUE.equals(r.getDeleted()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Ilova relizi topilmadi: " + id));
    }

    private AppReleaseResponse toResponse(AppRelease r) {
        return AppReleaseResponse.builder()
                .id(r.getId())
                .appName(r.getAppName())
                .platform(r.getPlatform())
                .appType(r.getAppType())
                .version(r.getAppVersion())
                .versionCode(r.getVersionCode())
                .status(r.getStatus())
                .isLatest(r.getIsLatest())
                .isForceUpdate(r.getIsForceUpdate())
                .minSupportedVersion(r.getMinSupportedVersion())
                .releaseNotesUzl(r.getReleaseNotesUzl())
                .releaseNotesUzc(r.getReleaseNotesUzc())
                .releaseNotesRu(r.getReleaseNotesRu())
                .releaseNotesEn(r.getReleaseNotesEn())
                .releaseDate(r.getReleaseDate())
                .downloadUrl(r.getDownloadUrl())
                .fileSize(r.getFileSize())
                .fileSizeFormatted(formatBytes(r.getFileSize()))
                .checksum(r.getChecksum())
                .downloadCount(r.getDownloadCount())
                .createdAt(r.getCreatedAt())
                .createdBy(r.getCreatedBy())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    private String getReleaseNotes(AppRelease r, String lang) {
        if (lang == null) return r.getReleaseNotesUzl();
        return switch (lang.toLowerCase()) {
            case "uzc"      -> r.getReleaseNotesUzc() != null ? r.getReleaseNotesUzc() : r.getReleaseNotesUzl();
            case "ru"       -> r.getReleaseNotesRu()  != null ? r.getReleaseNotesRu()  : r.getReleaseNotesUzl();
            case "en"       -> r.getReleaseNotesEn()  != null ? r.getReleaseNotesEn()  : r.getReleaseNotesUzl();
            default         -> r.getReleaseNotesUzl() != null ? r.getReleaseNotesUzl() : r.getReleaseNotesEn();
        };
    }

    private String formatBytes(Long bytes) {
        if (bytes == null || bytes == 0) return null;
        if (bytes < 1024)                return bytes + " B";
        if (bytes < 1024 * 1024)         return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024)  return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }
}
