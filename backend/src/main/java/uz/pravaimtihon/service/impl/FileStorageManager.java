package uz.pravaimtihon.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import uz.pravaimtihon.config.StorageProperties;
import uz.pravaimtihon.dto.response.FileUploadResponse;
import uz.pravaimtihon.exception.FileStorageException;
import uz.pravaimtihon.service.FileStorageService;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

/**
 * ✅ FIXED: Smart File Storage Manager
 * - Relative URL support (localhost hardcode yo'q)
 * - LOCAL, S3, Cloudinary bilan ishlaydi
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageManager implements FileStorageService {

    private final StorageProperties storageProperties;
    private final LocalStorageService localStorageService;
    private final S3StorageService s3StorageService;
    private final CloudinaryStorageService cloudinaryStorageService;

    // ==================== CORE METHODS ====================

    @Override
    public FileUploadResponse uploadFile(MultipartFile file, String folder) {
        FileStorageService primaryService = getPrimaryStorageService();

        try {
            log.info("📤 Uploading to {} storage: {}", primaryService.getStorageType(), file.getOriginalFilename());
            return primaryService.uploadFile(file, folder);
            // ✅ LocalStorageService endi relative URL qaytaradi
            // S3/Cloudinary o'z to'liq URL ini qaytaradi — bu to'g'ri

        } catch (Exception e) {
            log.error("❌ Upload failed with {}: {}", primaryService.getStorageType(), e.getMessage());

            if (shouldFallbackToLocal(primaryService)) {
                return fallbackToLocal(file, folder, primaryService.getStorageType());
            }

            throw new FileStorageException("Upload failed: " + e.getMessage());
        }
    }

    @Override
    public boolean deleteFile(String fileUrl) {
        if (isNullOrBlank(fileUrl)) {
            log.warn("⚠️ Attempted to delete null/empty fileUrl");
            return false;
        }

        String storageType = detectStorageType(fileUrl);
        FileStorageService service = getStorageServiceByType(storageType);

        try {
            boolean deleted = service.deleteFile(fileUrl);
            log.info(deleted ? "✅ Deleted from {}: {}" : "⚠️ Not found in {}: {}",
                    storageType, fileUrl);
            return deleted;
        } catch (Exception e) {
            log.error("❌ Delete failed from {}: {}", storageType, e.getMessage());
            return false;
        }
    }

    @Override
    public byte[] getFile(String fileUrl) {
        if (isNullOrBlank(fileUrl)) {
            throw new FileStorageException("File URL cannot be null or empty");
        }

        String storageType = detectStorageType(fileUrl);
        FileStorageService service = getStorageServiceByType(storageType);

        try {
            return service.getFile(fileUrl);
        } catch (Exception e) {
            log.error("❌ Failed to get file from {}: {}", storageType, e.getMessage());
            throw new FileStorageException("Failed to retrieve file: " + e.getMessage());
        }
    }

    @Override
    public boolean fileExists(String fileUrl) {
        if (isNullOrBlank(fileUrl)) return false;

        String storageType = detectStorageType(fileUrl);
        FileStorageService service = getStorageServiceByType(storageType);

        try {
            return service.fileExists(fileUrl);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String getStorageType() {
        return getPrimaryStorageService().getStorageType();
    }

    // ==================== PUBLIC HELPERS ====================

    /**
     * ✅ File URL dan folder va filename ni ajratib olish
     * Relative: /api/v1/files/questions/uuid.jpg
     * Absolute: http://localhost:8080/api/v1/files/questions/uuid.jpg
     */
    public String extractFilename(String fileUrl) {
        if (isNullOrBlank(fileUrl)) return null;

        try {
            String decoded = URLDecoder.decode(fileUrl, StandardCharsets.UTF_8);
            String[] parts = decoded.split("/");
            String filename = parts[parts.length - 1];

            if (filename.contains("?")) filename = filename.substring(0, filename.indexOf("?"));
            if (filename.contains("#")) filename = filename.substring(0, filename.indexOf("#"));

            return filename;
        } catch (Exception e) {
            log.error("Failed to extract filename from: {}", fileUrl, e);
            return null;
        }
    }

    public String extractFolder(String fileUrl) {
        if (isNullOrBlank(fileUrl)) return "general";

        try {
            if (fileUrl.contains("/api/v1/files/")) {
                String afterFiles = fileUrl.substring(fileUrl.indexOf("/api/v1/files/") + 14);
                if (afterFiles.contains("/")) {
                    return afterFiles.substring(0, afterFiles.indexOf("/"));
                }
            }

            String[] parts = fileUrl.split("/");
            for (int i = parts.length - 2; i >= 0; i--) {
                if (parts[i].matches("questions|profiles|documents|videos|general")) {
                    return parts[i];
                }
            }
        } catch (Exception e) {
            log.debug("Failed to extract folder from: {}", fileUrl);
        }

        return "general";
    }

    /**
     * ✅ Relative URL yasaydi — frontend VITE_API_URL + bu = to'liq URL
     */
    public String buildFileUrl(String folder, String fileName) {
        return String.format("/api/v1/files/%s/%s", folder, fileName);
    }

    // ==================== PRIVATE HELPERS ====================

    private FileStorageService getPrimaryStorageService() {
        String type = storageProperties.getType().toLowerCase();

        return switch (type) {
            case "s3" -> {
                if (!isS3Configured()) {
                    log.warn("S3 not configured, falling back to LOCAL");
                    yield localStorageService;
                }
                yield s3StorageService;
            }
            case "cloudinary" -> {
                if (!isCloudinaryConfigured()) {
                    log.warn("Cloudinary not configured, falling back to LOCAL");
                    yield localStorageService;
                }
                yield cloudinaryStorageService;
            }
            default -> localStorageService;
        };
    }

    private FileStorageService getStorageServiceByType(String type) {
        return switch (type.toUpperCase()) {
            case "S3"         -> s3StorageService;
            case "CLOUDINARY" -> cloudinaryStorageService;
            default           -> localStorageService;
        };
    }

    /**
     * ✅ Storage type aniqlash
     * Relative URL (/api/v1/files/...) → LOCAL
     * amazonaws.com → S3
     * cloudinary.com → CLOUDINARY
     */
    private String detectStorageType(String fileUrl) {
        if (isNullOrBlank(fileUrl)) return "LOCAL";

        String normalized = fileUrl.toLowerCase().trim();

        if (normalized.contains("amazonaws.com") || normalized.contains(".s3.")) return "S3";
        if (normalized.contains("cloudinary.com")) return "CLOUDINARY";

        // Relative yoki localhost → LOCAL
        return "LOCAL";
    }

    private boolean shouldFallbackToLocal(FileStorageService primaryService) {
        return storageProperties.isFallbackToLocal()
                && !"LOCAL".equals(primaryService.getStorageType());
    }

    private FileUploadResponse fallbackToLocal(MultipartFile file, String folder, String failedStorage) {
        log.info("🔄 Falling back to LOCAL storage (from {})", failedStorage);
        try {
            FileUploadResponse response = localStorageService.uploadFile(file, folder);
            response.setMessage(response.getMessage() + " (Fallback from " + failedStorage + ")");
            return response;
        } catch (Exception e) {
            log.error("❌ Fallback to local also failed", e);
            throw new FileStorageException("Failed with both primary and fallback storage");
        }
    }

    private boolean isS3Configured() {
        StorageProperties.S3 s3 = storageProperties.getS3();
        return !isNullOrBlank(s3.getBucket())
                && !isNullOrBlank(s3.getAccessKey())
                && !isNullOrBlank(s3.getSecretKey());
    }

    private boolean isCloudinaryConfigured() {
        StorageProperties.Cloudinary cloudinary = storageProperties.getCloudinary();
        return !isNullOrBlank(cloudinary.getCloudName())
                && !isNullOrBlank(cloudinary.getApiKey())
                && !isNullOrBlank(cloudinary.getApiSecret());
    }

    private boolean isNullOrBlank(String str) {
        return str == null || str.trim().isEmpty();
    }
}