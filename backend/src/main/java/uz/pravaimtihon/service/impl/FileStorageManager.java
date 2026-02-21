package uz.pravaimtihon.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import uz.pravaimtihon.config.StorageProperties;
import uz.pravaimtihon.dto.response.FileUploadResponse;
import uz.pravaimtihon.exception.FileStorageException;
import uz.pravaimtihon.service.FileStorageService;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

/**
 * ✅ OPTIMIZED: Smart File Storage Manager
 * - Dynamic URL building (no hardcoded localhost)
 * - Intelligent storage type detection
 * - Proper fallback mechanism
 * - Works with LOCAL, S3, and Cloudinary
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageManager implements FileStorageService {

    private final StorageProperties storageProperties;
    private final LocalStorageService localStorageService;
    private final S3StorageService s3StorageService;
    private final CloudinaryStorageService cloudinaryStorageService;

    @Value("${server.port:8080}")
    private int serverPort;

    @Value("${app.storage.local.base-url:#{null}}")
    private String configuredBaseUrl;

    // ==================== CORE METHODS ====================

    @Override
    public FileUploadResponse uploadFile(MultipartFile file, String folder) {
        FileStorageService primaryService = getPrimaryStorageService();

        try {
            log.info("📤 Uploading to {} storage: {}", primaryService.getStorageType(), file.getOriginalFilename());
            FileUploadResponse response = primaryService.uploadFile(file, folder);

            // Ensure local URLs are dynamic
            if ("LOCAL".equals(response.getStorageType())) {
                response.setFileUrl(buildDynamicLocalUrl(response.getFileUrl()));
            }

            return response;

        } catch (Exception e) {
            log.error("❌ Upload failed with {}: {}", primaryService.getStorageType(), e.getMessage());

            // Smart fallback
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
        if (isNullOrBlank(fileUrl)) {
            return false;
        }

        String storageType = detectStorageType(fileUrl);
        FileStorageService service = getStorageServiceByType(storageType);

        try {
            return service.fileExists(fileUrl);
        } catch (Exception e) {
            log.debug("Check exists failed for {}: {}", storageType, e.getMessage());
            return false;
        }
    }

    @Override
    public String getStorageType() {
        return getPrimaryStorageService().getStorageType();
    }

    // ==================== SMART HELPER METHODS ====================

    /**
     * ✅ Get primary storage service
     */
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

    /**
     * ✅ Get storage service by detected type
     */
    private FileStorageService getStorageServiceByType(String type) {
        return switch (type.toUpperCase()) {
            case "S3" -> s3StorageService;
            case "CLOUDINARY" -> cloudinaryStorageService;
            default -> localStorageService;
        };
    }

    /**
     * ✅ SMART: Accurate storage type detection
     */
    private String detectStorageType(String fileUrl) {
        if (isNullOrBlank(fileUrl)) {
            return "LOCAL";
        }

        String normalized = fileUrl.toLowerCase().trim();

        // S3 patterns
        if (normalized.contains("amazonaws.com") ||
                normalized.contains(".s3.") ||
                normalized.matches(".*s3[.-].*\\.amazonaws\\.com.*")) {
            return "S3";
        }

        // Cloudinary patterns
        if (normalized.contains("cloudinary.com") ||
                normalized.contains("res.cloudinary.com")) {
            return "CLOUDINARY";
        }

        // Local patterns - expanded detection
        if (normalized.contains("localhost") ||
                normalized.contains("127.0.0.1") ||
                normalized.contains("/api/v1/files/") ||
                normalized.startsWith("/uploads/") ||
                !normalized.startsWith("http")) {
            return "LOCAL";
        }

        // If configured base URL matches, it's local
        if (configuredBaseUrl != null && normalized.startsWith(configuredBaseUrl.toLowerCase())) {
            return "LOCAL";
        }

        return "LOCAL"; // Safe default
    }

    /**
     * ✅ Build dynamic local URL (no hardcoded localhost)
     */
    private String buildDynamicLocalUrl(String fileUrl) {
        if (isNullOrBlank(fileUrl)) {
            return fileUrl;
        }

        // Extract path from URL
        String path = fileUrl;

        // Remove existing base URL if present
        if (path.contains("/api/v1/files/")) {
            path = path.substring(path.indexOf("/api/v1/files/"));
        } else if (path.contains("/uploads/")) {
            path = "/api/v1/files" + path.substring(path.indexOf("/uploads/") + 8);
        }

        // Use configured base URL or build from server
        String baseUrl = getBaseUrl();
        return baseUrl + path;
    }

    /**
     * ✅ Get dynamic base URL
     */
    private String getBaseUrl() {
        // Priority: configured > detected
        if (!isNullOrBlank(configuredBaseUrl)) {
            return configuredBaseUrl;
        }

        // Fallback to localhost with dynamic port
        return "http://localhost:" + serverPort;
    }

    /**
     * ✅ Extract filename from any URL type
     */
    public String extractFilename(String fileUrl) {
        if (isNullOrBlank(fileUrl)) {
            return null;
        }

        try {
            // Decode URL-encoded characters
            String decoded = URLDecoder.decode(fileUrl, StandardCharsets.UTF_8);

            // Extract filename after last '/'
            String[] parts = decoded.split("/");
            String filename = parts[parts.length - 1];

            // Remove query parameters
            if (filename.contains("?")) {
                filename = filename.substring(0, filename.indexOf("?"));
            }

            // Remove fragment
            if (filename.contains("#")) {
                filename = filename.substring(0, filename.indexOf("#"));
            }

            return filename;
        } catch (Exception e) {
            log.error("Failed to extract filename from: {}", fileUrl, e);
            return null;
        }
    }

    /**
     * ✅ Extract folder from URL
     */
    public String extractFolder(String fileUrl) {
        if (isNullOrBlank(fileUrl)) {
            return "general";
        }

        try {
            // For LOCAL: /api/v1/files/{folder}/{filename}
            if (fileUrl.contains("/api/v1/files/")) {
                String afterFiles = fileUrl.substring(fileUrl.indexOf("/api/v1/files/") + 14);
                if (afterFiles.contains("/")) {
                    return afterFiles.substring(0, afterFiles.indexOf("/"));
                }
            }

            // For cloud storage: look for known folder names in path
            String[] parts = fileUrl.split("/");
            for (int i = parts.length - 2; i >= 0; i--) {
                String part = parts[i];
                if (part.matches("questions|profiles|documents|videos|general")) {
                    return part;
                }
            }
        } catch (Exception e) {
            log.debug("Failed to extract folder from: {}", fileUrl);
        }

        return "general";
    }

    /**
     * ✅ Build file URL by fileName and folder
     */
    public String buildFileUrl(String folder, String fileName) {
        String baseUrl = getBaseUrl();
        return String.format("%s/api/v1/files/%s/%s", baseUrl, folder, fileName);
    }

    /**
     * ✅ Check if should fallback to local
     */
    private boolean shouldFallbackToLocal(FileStorageService primaryService) {
        return storageProperties.isFallbackToLocal()
                && !"LOCAL".equals(primaryService.getStorageType());
    }

    /**
     * ✅ Fallback to local storage
     */
    private FileUploadResponse fallbackToLocal(MultipartFile file, String folder, String failedStorage) {
        log.info("🔄 Falling back to LOCAL storage");
        try {
            FileUploadResponse response = localStorageService.uploadFile(file, folder);
            response.setFileUrl(buildDynamicLocalUrl(response.getFileUrl()));
            response.setMessage(response.getMessage() + " (Fallback from " + failedStorage + ")");
            return response;
        } catch (Exception e) {
            log.error("❌ Fallback to local also failed", e);
            throw new FileStorageException("Failed with both primary and fallback storage");
        }
    }

    /**
     * ✅ Check if S3 is configured
     */
    private boolean isS3Configured() {
        StorageProperties.S3 s3 = storageProperties.getS3();
        return !isNullOrBlank(s3.getBucket())
                && !isNullOrBlank(s3.getAccessKey())
                && !isNullOrBlank(s3.getSecretKey());
    }

    /**
     * ✅ Check if Cloudinary is configured
     */
    private boolean isCloudinaryConfigured() {
        StorageProperties.Cloudinary cloudinary = storageProperties.getCloudinary();
        return !isNullOrBlank(cloudinary.getCloudName())
                && !isNullOrBlank(cloudinary.getApiKey())
                && !isNullOrBlank(cloudinary.getApiSecret());
    }

    /**
     * ✅ Null/blank check utility
     */
    private boolean isNullOrBlank(String str) {
        return str == null || str.trim().isEmpty();
    }
}