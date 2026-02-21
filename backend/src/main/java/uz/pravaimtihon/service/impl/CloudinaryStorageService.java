package uz.pravaimtihon.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import uz.pravaimtihon.config.StorageProperties;
import uz.pravaimtihon.dto.response.FileUploadResponse;
import uz.pravaimtihon.exception.FileStorageException;
import uz.pravaimtihon.service.FileStorageService;
import uz.pravaimtihon.util.FileTypeUtil;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;

/**
 * ✅ ENHANCED Cloudinary Storage Implementation
 * Supports: Images, Videos, PDFs, Documents, and more
 */
@Slf4j
@Service("cloudinaryStorageService")
@RequiredArgsConstructor
public class CloudinaryStorageService implements FileStorageService {

    private final StorageProperties storageProperties;
    private Cloudinary cloudinary;

    // Size limits by category
    private static final long IMAGE_MAX_SIZE_MB = 10;
    private static final long VIDEO_MAX_SIZE_MB = 500;
    private static final long DOCUMENT_MAX_SIZE_MB = 50;
    private static final long DEFAULT_MAX_SIZE_MB = 100;

    @PostConstruct
    public void init() {
        try {
            if (isCloudinaryConfigured()) {
                StorageProperties.Cloudinary config = storageProperties.getCloudinary();

                this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                        "cloud_name", config.getCloudName(),
                        "api_key", config.getApiKey(),
                        "api_secret", config.getApiSecret(),
                        "secure", true
                ));

                log.info("✅ Cloudinary client initialized successfully");
            } else {
                log.warn("⚠️ Cloudinary is not properly configured. Cloudinary storage will not be available.");
            }
        } catch (Exception e) {
            log.error("❌ Failed to initialize Cloudinary client", e);
        }
    }

    @Override
    public FileUploadResponse uploadFile(MultipartFile file, String folder) {
        if (!isCloudinaryConfigured() || cloudinary == null) {
            throw new FileStorageException("Cloudinary storage is not configured");
        }

        try {
            // Detect file category and validate
            FileTypeUtil.FileCategory category = FileTypeUtil.detectFileCategory(file);
            validateFileByCategory(file, category);

            // Generate unique public ID
            String extension = FileTypeUtil.getFileExtension(file.getOriginalFilename());
            String publicId = folder + "/" + UUID.randomUUID().toString();

            // Determine resource type based on file category
            String resourceType = determineResourceType(category);

            // Upload to Cloudinary
            Map<String, Object> uploadParams = ObjectUtils.asMap(
                    "public_id", publicId,
                    "folder", folder,
                    "resource_type", resourceType,
                    "overwrite", false
            );

            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);

            String fileUrl = (String) uploadResult.get("secure_url");
            String fileName = (String) uploadResult.get("public_id");

            log.info("✅ File uploaded to Cloudinary: {} (Category: {}, Size: {})",
                    fileUrl, category, FileTypeUtil.formatFileSize(file.getSize()));

            return FileUploadResponse.builder()
                    .fileName(fileName)
                    .fileUrl(fileUrl)
                    .fileType(file.getContentType())
                    .fileSize(file.getSize())
                    .storageType("CLOUDINARY")
                    .message("File uploaded successfully to Cloudinary")
                    .build();

        } catch (IOException e) {
            log.error("❌ Failed to upload file to Cloudinary", e);
            throw new FileStorageException("Failed to upload file to Cloudinary: " + e.getMessage());
        } catch (Exception e) {
            log.error("❌ Cloudinary error during file upload", e);
            throw new FileStorageException("Cloudinary error: " + e.getMessage());
        }
    }

    @Override
    public boolean deleteFile(String fileUrl) {
        if (!isCloudinaryConfigured() || cloudinary == null) {
            throw new FileStorageException("Cloudinary storage is not configured");
        }

        try {
            String publicId = extractPublicId(fileUrl);

            // Try to delete as different resource types
            Map deleteResult = cloudinary.uploader().destroy(publicId,
                    ObjectUtils.asMap("resource_type", "image"));

            String result = (String) deleteResult.get("result");

            // If not found as image, try video
            if (!"ok".equals(result)) {
                deleteResult = cloudinary.uploader().destroy(publicId,
                        ObjectUtils.asMap("resource_type", "video"));
                result = (String) deleteResult.get("result");
            }

            // If not found as video, try raw (documents)
            if (!"ok".equals(result)) {
                deleteResult = cloudinary.uploader().destroy(publicId,
                        ObjectUtils.asMap("resource_type", "raw"));
                result = (String) deleteResult.get("result");
            }

            boolean success = "ok".equals(result);
            if (success) {
                log.info("✅ File deleted from Cloudinary: {}", fileUrl);
            } else {
                log.warn("⚠️ Failed to delete file from Cloudinary: {}", fileUrl);
            }

            return success;

        } catch (Exception e) {
            log.error("❌ Failed to delete file from Cloudinary", e);
            throw new FileStorageException("Failed to delete file from Cloudinary: " + e.getMessage());
        }
    }

    @Override
    public byte[] getFile(String fileUrl) {
        // Cloudinary serves files via CDN, direct byte access not typically needed
        throw new UnsupportedOperationException(
                "Direct file retrieval not supported for Cloudinary. Use the file URL directly.");
    }

    @Override
    public boolean fileExists(String fileUrl) {
        if (!isCloudinaryConfigured() || cloudinary == null) {
            return false;
        }

        try {
            String publicId = extractPublicId(fileUrl);

            // Try different resource types
            try {
                Map result = cloudinary.api().resource(publicId,
                        ObjectUtils.asMap("resource_type", "image"));
                if (result != null && result.containsKey("public_id")) return true;
            } catch (Exception ignored) {}

            try {
                Map result = cloudinary.api().resource(publicId,
                        ObjectUtils.asMap("resource_type", "video"));
                if (result != null && result.containsKey("public_id")) return true;
            } catch (Exception ignored) {}

            try {
                Map result = cloudinary.api().resource(publicId,
                        ObjectUtils.asMap("resource_type", "raw"));
                return result != null && result.containsKey("public_id");
            } catch (Exception ignored) {}

            return false;
        } catch (Exception e) {
            log.debug("File does not exist in Cloudinary: {}", fileUrl);
            return false;
        }
    }

    @Override
    public String getStorageType() {
        return "CLOUDINARY";
    }

    // ==================== HELPER METHODS ====================

    private boolean isCloudinaryConfigured() {
        StorageProperties.Cloudinary config = storageProperties.getCloudinary();
        return config.getCloudName() != null && !config.getCloudName().isEmpty()
                && config.getApiKey() != null && !config.getApiKey().isEmpty()
                && config.getApiSecret() != null && !config.getApiSecret().isEmpty();
    }

    /**
     * Validate file based on its category
     */
    private void validateFileByCategory(MultipartFile file, FileTypeUtil.FileCategory category) {
        if (file.isEmpty()) {
            throw new FileStorageException("Cannot upload empty file");
        }

        // Determine max size based on category
        long maxSizeMB = switch (category) {
            case IMAGE -> IMAGE_MAX_SIZE_MB;
            case VIDEO -> VIDEO_MAX_SIZE_MB;
            case DOCUMENT -> DOCUMENT_MAX_SIZE_MB;
            case OTHER -> DEFAULT_MAX_SIZE_MB;
        };

        // Validate size
        long maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.getSize() > maxSizeBytes) {
            throw new FileStorageException(
                    String.format("File size exceeds maximum limit of %d MB for %s files",
                            maxSizeMB, category.name().toLowerCase())
            );
        }

        // Validate content type
        String contentType = file.getContentType();
        if (contentType == null) {
            throw new FileStorageException("Cannot determine file type");
        }

        // Check if file type is supported
        boolean isSupported = switch (category) {
            case IMAGE -> FileTypeUtil.isAllowedType(contentType, FileTypeUtil.IMAGE_TYPES);
            case VIDEO -> FileTypeUtil.isAllowedType(contentType, FileTypeUtil.VIDEO_TYPES);
            case DOCUMENT -> FileTypeUtil.isAllowedType(contentType, FileTypeUtil.DOCUMENT_TYPES);
            case OTHER -> true; // Allow other types with size limit
        };

        if (!isSupported && category != FileTypeUtil.FileCategory.OTHER) {
            throw new FileStorageException(
                    String.format("File type not supported: %s for category %s",
                            contentType, category.name())
            );
        }

        log.debug("✅ File validation passed: {} - {} - {}",
                file.getOriginalFilename(), category, FileTypeUtil.formatFileSize(file.getSize()));
    }

    /**
     * Determine Cloudinary resource type based on file category
     */
    private String determineResourceType(FileTypeUtil.FileCategory category) {
        return switch (category) {
            case IMAGE -> "image";
            case VIDEO -> "video";
            case DOCUMENT, OTHER -> "raw"; // Raw for non-image/video files
        };
    }

    /**
     * Extract public_id from Cloudinary URL
     */
    private String extractPublicId(String fileUrl) {
        // Example URL formats:
        // https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/uuid.jpg
        // https://res.cloudinary.com/cloud-name/video/upload/v1234567890/folder/uuid.mp4
        // https://res.cloudinary.com/cloud-name/raw/upload/v1234567890/folder/uuid.pdf

        if (fileUrl.contains("/upload/")) {
            String afterUpload = fileUrl.substring(fileUrl.indexOf("/upload/") + 8);

            // Remove version prefix (v1234567890/)
            if (afterUpload.matches("v\\d+/.*")) {
                afterUpload = afterUpload.substring(afterUpload.indexOf("/") + 1);
            }

            // Remove file extension
            if (afterUpload.contains(".")) {
                afterUpload = afterUpload.substring(0, afterUpload.lastIndexOf("."));
            }

            return afterUpload;
        }

        return fileUrl;
    }
}