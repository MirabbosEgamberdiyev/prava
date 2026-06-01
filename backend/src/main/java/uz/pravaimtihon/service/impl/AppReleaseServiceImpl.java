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
    // Quick Upload / Quick Update  (soddalashtirilgan admin uchun)
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AppReleaseResponse quickUpload(String appName, String version, String description,
                                          String appCategory, boolean isActive,
                                          MultipartFile file, String createdBy) {
        if (file == null || file.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fayl yuklanmagan");

        String category = normalizeCategory(appCategory);

        // Platforma fayl kengaytmasidan avtomatik
        String origName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
        AppPlatform platform = detectPlatform(origName);
        AppType     appType  = detectAppType(origName);

        // Agar noma'lum kengaytma bo'lsa — WINDOWS .exe deb default qabul qilamiz
        if (platform == AppPlatform.WEB) platform = AppPlatform.WINDOWS;
        if (appType  == AppType.WEB_PWA) appType  = AppType.WINDOWS_EXE;

        // Fayl saqlanadi + SHA-256
        String[] uploaded = saveFileAndHash(file);
        int verCode = parseVersionCode(version);

        AppRelease entity = AppRelease.builder()
                .appName(appName.trim())
                .appCategory(category)
                .platform(platform)
                .appType(appType)
                .appVersion(version.trim())
                .versionCode(verCode)
                .status(isActive ? AppReleaseStatus.ACTIVE : AppReleaseStatus.DRAFT)
                .isLatest(false)
                .isForceUpdate(false)
                .releaseNotesUzl(description != null ? description.trim() : null)
                .releaseDate(java.time.LocalDate.now())
                .downloadUrl(uploaded[0])
                .fileSize(file.getSize())
                .checksum(uploaded[1])
                .downloadCount(0L)
                .build();

        AppRelease saved = repo.save(entity);

        // Bu platforma+kategoriya uchun birinchi active bo'lsa — latest qilamiz
        if (isActive && !repo.findByPlatformAndAppTypeAndIsLatestTrueAndDeletedFalse(
                platform, appType).isPresent()) {
            saved.setIsLatest(true);
            saved = repo.save(saved);
        }

        log.info("Quick upload: {} v{} [{}/{}] by {}", appName, version, category, platform, createdBy);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public AppReleaseResponse quickUpdate(Long id, String appName, String version,
                                          String description, String appCategory,
                                          boolean isActive, MultipartFile file, String updatedBy) {
        AppRelease entity = findOrThrow(id);

        if (appName != null && !appName.isBlank()) entity.setAppName(appName.trim());
        if (version != null && !version.isBlank()) {
            entity.setAppVersion(version.trim());
            entity.setVersionCode(parseVersionCode(version.trim()));
        }
        if (description != null) entity.setReleaseNotesUzl(description.trim());
        if (appCategory != null && !appCategory.isBlank())
            entity.setAppCategory(normalizeCategory(appCategory));
        entity.setStatus(isActive ? AppReleaseStatus.ACTIVE : AppReleaseStatus.DRAFT);

        // Fayl berilgan bo'lsa — yangilaymiz (platforma fayldan auto)
        if (file != null && !file.isEmpty()) {
            String origName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
            AppPlatform p = detectPlatform(origName);
            AppType     t = detectAppType(origName);
            if (p == AppPlatform.WEB) p = AppPlatform.WINDOWS;
            if (t == AppType.WEB_PWA) t = AppType.WINDOWS_EXE;
            entity.setPlatform(p);
            entity.setAppType(t);
            String[] uploaded = saveFileAndHash(file);
            entity.setDownloadUrl(uploaded[0]);
            entity.setFileSize(file.getSize());
            entity.setChecksum(uploaded[1]);
        }

        return toResponse(repo.save(entity));
    }

    /** "online" / "ONLINE" → "ONLINE"; null/bo'sh/boshqa → "OFFLINE" */
    private static String normalizeCategory(String c) {
        if (c == null) return "OFFLINE";
        String u = c.trim().toUpperCase();
        return "ONLINE".equals(u) ? "ONLINE" : "OFFLINE";
    }

    // ── Auto-detect helpers ───────────────────────────────────────────────────

    static AppPlatform detectPlatform(String filename) {
        String f = filename.toLowerCase();
        if (f.endsWith(".exe") || f.endsWith(".msi"))                         return AppPlatform.WINDOWS;
        if (f.endsWith(".deb") || f.endsWith(".rpm") ||
            f.endsWith(".appimage") || f.endsWith(".tar.gz"))                 return AppPlatform.LINUX;
        if (f.endsWith(".dmg") || f.endsWith(".pkg") || f.endsWith(".app"))  return AppPlatform.MACOS;
        return AppPlatform.WEB;
    }

    static AppType detectAppType(String filename) {
        String f = filename.toLowerCase();
        if (f.endsWith(".exe"))      return AppType.WINDOWS_EXE;
        if (f.endsWith(".msi"))      return AppType.WINDOWS_MSI;
        if (f.endsWith(".deb"))      return AppType.LINUX_DEB;
        if (f.endsWith(".rpm"))      return AppType.LINUX_RPM;
        if (f.endsWith(".appimage")) return AppType.LINUX_APPIMAGE;
        if (f.endsWith(".tar.gz"))   return AppType.LINUX_TARBALL;
        if (f.endsWith(".dmg"))      return AppType.MACOS_DMG;
        if (f.endsWith(".pkg"))      return AppType.MACOS_APP;
        return AppType.WEB_PWA;
    }

    /** "1.2.3" → 10203 */
    static int parseVersionCode(String version) {
        if (version == null || version.isBlank()) return 1000;
        try {
            String[] p = version.trim().replaceAll("[^0-9.]", "").split("\\.");
            if (p.length >= 3) return Integer.parseInt(p[0]) * 10000 + Integer.parseInt(p[1]) * 100 + Integer.parseInt(p[2]);
            if (p.length == 2) return Integer.parseInt(p[0]) * 10000 + Integer.parseInt(p[1]) * 100;
            return Integer.parseInt(p[0]) * 10000;
        } catch (Exception e) {
            return 1000;
        }
    }

    /**
     * Faylni diskka saqlaydi va SHA-256 hisoblaydi.
     * @return [fileUrl, sha256hex]
     */
    private String[] saveFileAndHash(MultipartFile file) {
        if (file.getSize() > MAX_INSTALLER_SIZE)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Fayl juda katta: " + formatBytes(file.getSize()) + " (max 1 GB)");
        try {
            Path installersDir = Paths.get(uploadDir).toAbsolutePath().normalize().resolve("installers");
            Files.createDirectories(installersDir);

            String ext      = extractExtension(file.getOriginalFilename());
            String fileName = UUID.randomUUID().toString() + ext;
            Path   target   = installersDir.resolve(fileName);

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (InputStream in = new DigestInputStream(file.getInputStream(), digest)) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
            String sha256 = HexFormat.of().formatHex(digest.digest());
            return new String[]{ "/api/v1/files/installers/" + fileName, sha256 };

        } catch (IOException | NoSuchAlgorithmException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Fayl saqlashda xato: " + e.getMessage());
        }
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
                .appCategory(r.getAppCategory() != null ? r.getAppCategory() : "OFFLINE")
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

    // ─────────────────────────────────────────────────────────────────────────
    // Chunked Upload (katta fayllar uchun)
    // ─────────────────────────────────────────────────────────────────────────

    /** Vaqtinchalik upload session: ext + chunklar soni + umumiy hajm */
    private record UploadSession(String fileName, String ext, long totalSize, String createdBy) {}

    /** uploadId → session */
    private final java.util.concurrent.ConcurrentHashMap<String, UploadSession> uploadSessions
            = new java.util.concurrent.ConcurrentHashMap<>();

    @Override
    @Transactional
    public String initChunkUpload(String fileName, long totalSize, String createdBy) {
        if (totalSize <= 0 || totalSize > MAX_INSTALLER_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Fayl hajmi noto'g'ri (max 1GB): " + formatBytes(totalSize));
        }
        String ext = extractExtension(fileName);
        boolean allowed = ALLOWED_EXTENSIONS.contains(ext.toLowerCase())
                || ".appimage".equalsIgnoreCase(ext);
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Fayl turi qo'llab-quvvatlanmaydi: " + fileName);
        }

        String uploadId = UUID.randomUUID().toString();

        try {
            Path tempDir = Paths.get(uploadDir).toAbsolutePath().normalize()
                    .resolve("installers").resolve(".tmp").resolve(uploadId);
            Files.createDirectories(tempDir);

            uploadSessions.put(uploadId, new UploadSession(fileName, ext, totalSize, createdBy));
            log.info("Chunked upload boshlandi: {} ({}), by={}",
                    uploadId, formatBytes(totalSize), createdBy);
            return uploadId;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Upload session yaratishda xato: " + e.getMessage());
        }
    }

    @Override
    public void uploadChunk(String uploadId, int chunkIndex, MultipartFile chunk) {
        UploadSession session = uploadSessions.get(uploadId);
        if (session == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Upload session topilmadi: " + uploadId);
        }
        if (chunk == null || chunk.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bo'sh chunk");
        }
        if (chunkIndex < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "chunkIndex < 0");
        }

        try {
            Path tempDir = Paths.get(uploadDir).toAbsolutePath().normalize()
                    .resolve("installers").resolve(".tmp").resolve(uploadId);
            Files.createDirectories(tempDir);
            Path chunkFile = tempDir.resolve(String.format("chunk-%06d", chunkIndex));

            try (InputStream in = chunk.getInputStream()) {
                Files.copy(in, chunkFile, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            log.error("Chunk yozishda xato: uploadId={}, chunk={}", uploadId, chunkIndex, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Chunk saqlashda xato: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public AppReleaseResponse completeChunkUpload(String uploadId, String appName, String version,
                                                  String description, String appCategory,
                                                  boolean isActive, String createdBy) {
        UploadSession session = uploadSessions.get(uploadId);
        if (session == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Upload session topilmadi: " + uploadId);
        }

        // Chunklarni birlashtiramiz + SHA-256 hisoblaymiz
        String[] uploaded = mergeChunks(uploadId, session.ext());

        // Platforma fayldan auto-detect
        AppPlatform platform = detectPlatform(session.fileName());
        AppType     appType  = detectAppType(session.fileName());
        if (platform == AppPlatform.WEB) platform = AppPlatform.WINDOWS;
        if (appType  == AppType.WEB_PWA) appType  = AppType.WINDOWS_EXE;

        String category = normalizeCategory(appCategory);
        int verCode = parseVersionCode(version);

        AppRelease entity = AppRelease.builder()
                .appName(appName.trim())
                .appCategory(category)
                .platform(platform)
                .appType(appType)
                .appVersion(version.trim())
                .versionCode(verCode)
                .status(isActive ? AppReleaseStatus.ACTIVE : AppReleaseStatus.DRAFT)
                .isLatest(false)
                .isForceUpdate(false)
                .releaseNotesUzl(description != null ? description.trim() : null)
                .releaseDate(java.time.LocalDate.now())
                .downloadUrl(uploaded[0])
                .fileSize(session.totalSize())
                .checksum(uploaded[1])
                .downloadCount(0L)
                .build();

        AppRelease saved = repo.save(entity);

        if (isActive && !repo.findByPlatformAndAppTypeAndIsLatestTrueAndDeletedFalse(platform, appType).isPresent()) {
            saved.setIsLatest(true);
            saved = repo.save(saved);
        }

        uploadSessions.remove(uploadId);
        log.info("Chunked upload yakunlandi: {} v{} [{}/{}], size={}, by={}",
                appName, version, category, platform, formatBytes(session.totalSize()), createdBy);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public AppReleaseResponse completeChunkUpdate(Long releaseId, String uploadId, String appName,
                                                  String version, String description,
                                                  String appCategory, boolean isActive,
                                                  String updatedBy) {
        AppRelease entity = findOrThrow(releaseId);
        UploadSession session = uploadSessions.get(uploadId);
        if (session == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Upload session topilmadi: " + uploadId);
        }

        if (appName != null && !appName.isBlank()) entity.setAppName(appName.trim());
        if (version != null && !version.isBlank()) {
            entity.setAppVersion(version.trim());
            entity.setVersionCode(parseVersionCode(version.trim()));
        }
        if (description != null) entity.setReleaseNotesUzl(description.trim());
        if (appCategory != null && !appCategory.isBlank())
            entity.setAppCategory(normalizeCategory(appCategory));
        entity.setStatus(isActive ? AppReleaseStatus.ACTIVE : AppReleaseStatus.DRAFT);

        // Chunklarni birlashtirish + SHA-256
        String[] uploaded = mergeChunks(uploadId, session.ext());

        AppPlatform platform = detectPlatform(session.fileName());
        AppType     appType  = detectAppType(session.fileName());
        if (platform == AppPlatform.WEB) platform = AppPlatform.WINDOWS;
        if (appType  == AppType.WEB_PWA) appType  = AppType.WINDOWS_EXE;
        entity.setPlatform(platform);
        entity.setAppType(appType);
        entity.setDownloadUrl(uploaded[0]);
        entity.setFileSize(session.totalSize());
        entity.setChecksum(uploaded[1]);

        AppRelease saved = repo.save(entity);
        uploadSessions.remove(uploadId);
        return toResponse(saved);
    }

    @Override
    public void cancelChunkUpload(String uploadId) {
        uploadSessions.remove(uploadId);
        try {
            Path tempDir = Paths.get(uploadDir).toAbsolutePath().normalize()
                    .resolve("installers").resolve(".tmp").resolve(uploadId);
            if (Files.exists(tempDir)) {
                Files.walk(tempDir)
                        .sorted(java.util.Comparator.reverseOrder())
                        .forEach(p -> { try { Files.delete(p); } catch (IOException ignored) {} });
            }
        } catch (IOException e) {
            log.warn("Chunk vaqtinchalik fayllarni o'chirishda xato: {}", uploadId, e);
        }
    }

    /** Barcha chunklarni final installer fayliga birlashtiradi va SHA-256 qaytaradi. */
    private String[] mergeChunks(String uploadId, String ext) {
        try {
            Path installersDir = Paths.get(uploadDir).toAbsolutePath().normalize().resolve("installers");
            Files.createDirectories(installersDir);

            String finalName = UUID.randomUUID().toString() + ext;
            Path target = installersDir.resolve(finalName);

            Path tempDir = installersDir.resolve(".tmp").resolve(uploadId);
            if (!Files.exists(tempDir)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chunk papkasi topilmadi");
            }

            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            // chunk-000000, chunk-000001, ... tartibida birlashtirish
            try (java.io.OutputStream out = Files.newOutputStream(target);
                 java.security.DigestOutputStream dos = new java.security.DigestOutputStream(out, digest);
                 java.util.stream.Stream<Path> chunks = Files.list(tempDir)) {

                java.util.List<Path> sorted = chunks
                        .filter(p -> p.getFileName().toString().startsWith("chunk-"))
                        .sorted()
                        .toList();

                if (sorted.isEmpty()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hech qanday chunk yuborilmagan");
                }

                byte[] buffer = new byte[64 * 1024]; // 64KB buffer
                for (Path chunk : sorted) {
                    try (InputStream in = Files.newInputStream(chunk)) {
                        int read;
                        while ((read = in.read(buffer)) > 0) {
                            dos.write(buffer, 0, read);
                        }
                    }
                }
            }

            String sha256 = HexFormat.of().formatHex(digest.digest());

            // Vaqtinchalik fayllarni o'chirish
            try (java.util.stream.Stream<Path> all = Files.walk(tempDir)) {
                all.sorted(java.util.Comparator.reverseOrder())
                   .forEach(p -> { try { Files.delete(p); } catch (IOException ignored) {} });
            }

            return new String[]{ "/api/v1/files/installers/" + finalName, sha256 };

        } catch (IOException | NoSuchAlgorithmException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Chunklarni birlashtirishda xato: " + e.getMessage());
        }
    }
}
