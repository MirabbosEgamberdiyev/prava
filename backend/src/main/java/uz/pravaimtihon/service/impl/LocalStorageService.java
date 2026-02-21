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
import uz.pravaimtihon.util.FileTypeUtil;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * ✅ OPTIMIZED: Local Storage Service
 * - Dynamic URL building (no hardcoded localhost)
 * - Proper file validation by category
 * - Clean error handling
 */
@Slf4j
@Service("localStorageService")
@RequiredArgsConstructor
public class LocalStorageService implements FileStorageService {

    private final StorageProperties storageProperties;

    @Value("${server.port:8080}")
    private int serverPort;

    @Value("${app.storage.local.base-url:#{null}}")
    private String configuredBaseUrl;

    private Path uploadDir;

    // Size limits by category
    private static final long IMAGE_MAX_SIZE_MB = 10;
    private static final long VIDEO_MAX_SIZE_MB = 500;
    private static final long DOCUMENT_MAX_SIZE_MB = 50;
    private static final long DEFAULT_MAX_SIZE_MB = 100;

    @PostConstruct
    public void init() {
        try {
            String uploadPath = storageProperties.getLocal().getUploadDir();
            this.uploadDir = Paths.get(uploadPath).toAbsolutePath().normalize();

            Files.createDirectories(uploadDir);
            log.info("✅ Local storage initialized: {}", uploadDir);

            // Create standard folders
            createFolder("questions");
            createFolder("profiles");
            createFolder("documents");
            createFolder("videos");
            createFolder("general");

        } catch (IOException e) {
            log.error("❌ Failed to create upload directory", e);
            throw new FileStorageException("Failed to create upload directory: " + e.getMessage());
        }
    }

    @Override
    public FileUploadResponse uploadFile(MultipartFile file, String folder) {
        try {
            // Detect file category and validate
            FileTypeUtil.FileCategory category = FileTypeUtil.detectFileCategory(file);
            validateFileByCategory(file, category);

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = FileTypeUtil.getFileExtension(originalFilename);
            String fileName = UUID.randomUUID().toString() + extension;

            // Create folder path
            Path folderPath = uploadDir.resolve(folder).normalize();
            Files.createDirectories(folderPath);

            // Save file
            Path targetPath = folderPath.resolve(fileName);

            // Security check
            if (!targetPath.startsWith(uploadDir)) {
                throw new FileStorageException("Invalid file path");
            }

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            // Build dynamic file URL
            String fileUrl = buildFileUrl(folder, fileName);

            log.info("✅ File uploaded to local storage: {} (Category: {}, Size: {})",
                    fileName, category, FileTypeUtil.formatFileSize(file.getSize()));

            return FileUploadResponse.builder()
                    .fileName(fileName)
                    .fileUrl(fileUrl)
                    .fileType(file.getContentType())
                    .fileSize(file.getSize())
                    .storageType("LOCAL")
                    .message("File uploaded successfully to local storage")
                    .build();

        } catch (IOException e) {
            log.error("❌ Failed to upload file to local storage", e);
            throw new FileStorageException("Failed to upload file: " + e.getMessage());
        }
    }

    @Override
    public boolean deleteFile(String fileUrl) {
        try {
            Path filePath = resolveFilePath(fileUrl);

            if (!Files.exists(filePath)) {
                log.warn("⚠️ File not found for deletion: {}", fileUrl);
                return false;
            }

            Files.delete(filePath);
            log.info("✅ File deleted from local storage: {}", fileUrl);
            return true;

        } catch (IOException e) {
            log.error("❌ Failed to delete file from local storage", e);
            return false;
        }
    }

    @Override
    public byte[] getFile(String fileUrl) {
        try {
            Path filePath = resolveFilePath(fileUrl);

            if (!Files.exists(filePath)) {
                throw new FileStorageException("File not found: " + fileUrl);
            }

            return Files.readAllBytes(filePath);

        } catch (IOException e) {
            log.error("❌ Failed to read file from local storage", e);
            throw new FileStorageException("Failed to read file: " + e.getMessage());
        }
    }

    @Override
    public boolean fileExists(String fileUrl) {
        try {
            Path filePath = resolveFilePath(fileUrl);
            return Files.exists(filePath);
        } catch (Exception e) {
            log.debug("File check failed: {}", fileUrl);
            return false;
        }
    }

    @Override
    public String getStorageType() {
        return "LOCAL";
    }

    // ==================== HELPER METHODS ====================

    /**
     * ✅ Build dynamic file URL
     */
    private String buildFileUrl(String folder, String fileName) {
        String baseUrl = getBaseUrl();
        return String.format("%s/api/v1/files/%s/%s", baseUrl, folder, fileName);
    }

    /**
     * ✅ Get dynamic base URL
     */
    private String getBaseUrl() {
        // Priority: configured > auto-detect
        if (configuredBaseUrl != null && !configuredBaseUrl.isBlank()) {
            return configuredBaseUrl;
        }

        // Fallback to localhost with dynamic port
        return "http://localhost:" + serverPort;
    }

    /**
     * ✅ Resolve file path from URL or filename
     */
    private Path resolveFilePath(String fileUrl) {
        try {
            // Extract folder and filename
            String relativePath;

            if (fileUrl.contains("/api/v1/files/")) {
                // URL format: http://localhost:8080/api/v1/files/questions/uuid.jpg
                relativePath = fileUrl.substring(fileUrl.indexOf("/api/v1/files/") + 14);
            } else if (fileUrl.startsWith("/")) {
                // Relative path: /questions/uuid.jpg
                relativePath = fileUrl.substring(1);
            } else {
                // Direct path: questions/uuid.jpg
                relativePath = fileUrl;
            }

            Path filePath = uploadDir.resolve(relativePath).normalize();

            // Security check
            if (!filePath.startsWith(uploadDir)) {
                throw new FileStorageException("Invalid file path: path traversal detected");
            }

            return filePath;

        } catch (Exception e) {
            log.error("❌ Failed to resolve file path: {}", fileUrl, e);
            throw new FileStorageException("Invalid file path: " + e.getMessage());
        }
    }

    /**
     * ✅ Validate file based on category
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

        log.debug("✅ File validation passed: {} - {} - {}",
                file.getOriginalFilename(), category, FileTypeUtil.formatFileSize(file.getSize()));
    }

    /**
     * ✅ Create folder if not exists
     */
    private void createFolder(String folderName) {
        try {
            Path folderPath = uploadDir.resolve(folderName);
            if (!Files.exists(folderPath)) {
                Files.createDirectories(folderPath);
                log.debug("📁 Created folder: {}", folderName);
            }
        } catch (IOException e) {
            log.warn("⚠️ Failed to create folder: {}", folderName);
        }
    }
}