package uz.pravaimtihon.service.impl;

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
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * ✅ FIXED: Local Storage Service
 * - Relative URL qaytaradi (localhost hardcode yo'q)
 * - Frontend VITE_API_URL env orqali to'liq URL yasaydi
 */
@Slf4j
@Service("localStorageService")
@RequiredArgsConstructor
public class LocalStorageService implements FileStorageService {

    private final StorageProperties storageProperties;

    private Path uploadDir;

    private static final long IMAGE_MAX_SIZE_MB    = 10;
    private static final long VIDEO_MAX_SIZE_MB    = 500;
    private static final long DOCUMENT_MAX_SIZE_MB = 50;
    private static final long DEFAULT_MAX_SIZE_MB  = 100;

    @PostConstruct
    public void init() {
        try {
            String uploadPath = storageProperties.getLocal().getUploadDir();
            this.uploadDir = Paths.get(uploadPath).toAbsolutePath().normalize();

            Files.createDirectories(uploadDir);
            log.info("✅ Local storage initialized: {}", uploadDir);

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
            FileTypeUtil.FileCategory category = FileTypeUtil.detectFileCategory(file);
            validateFileByCategory(file, category);

            String originalFilename = file.getOriginalFilename();
            String extension = FileTypeUtil.getFileExtension(originalFilename);
            String fileName = UUID.randomUUID().toString() + extension;

            Path folderPath = uploadDir.resolve(folder).normalize();
            Files.createDirectories(folderPath);

            Path targetPath = folderPath.resolve(fileName);

            if (!targetPath.startsWith(uploadDir)) {
                throw new FileStorageException("Invalid file path");
            }

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            // ✅ RELATIVE URL — localhost hardcode yo'q
            String fileUrl = buildRelativeUrl(folder, fileName);

            log.info("✅ File uploaded: {} ({})", fileName, FileTypeUtil.formatFileSize(file.getSize()));

            return FileUploadResponse.builder()
                    .fileName(fileName)
                    .fileUrl(fileUrl)
                    .fileType(file.getContentType())
                    .fileSize(file.getSize())
                    .storageType("LOCAL")
                    .message("File uploaded successfully")
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
            log.info("✅ File deleted: {}", fileUrl);
            return true;

        } catch (IOException e) {
            log.error("❌ Failed to delete file: {}", e.getMessage());
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
            log.error("❌ Failed to read file: {}", e.getMessage());
            throw new FileStorageException("Failed to read file: " + e.getMessage());
        }
    }

    @Override
    public boolean fileExists(String fileUrl) {
        try {
            Path filePath = resolveFilePath(fileUrl);
            return Files.exists(filePath);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String getStorageType() {
        return "LOCAL";
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * ✅ Relative URL — "/api/v1/files/questions/uuid.jpg"
     * Frontend VITE_API_URL + bu path = to'liq URL
     */
    private String buildRelativeUrl(String folder, String fileName) {
        return String.format("/api/v1/files/%s/%s", folder, fileName);
    }

    /**
     * Har qanday formatdagi URL yoki path dan file system path ni oladi:
     * - http://localhost:8080/api/v1/files/questions/uuid.jpg
     * - /api/v1/files/questions/uuid.jpg
     * - questions/uuid.jpg
     */
    private Path resolveFilePath(String fileUrl) {
        try {
            String relativePath;

            if (fileUrl.contains("/api/v1/files/")) {
                relativePath = fileUrl.substring(fileUrl.indexOf("/api/v1/files/") + 14);
            } else if (fileUrl.startsWith("/")) {
                relativePath = fileUrl.substring(1);
            } else {
                relativePath = fileUrl;
            }

            Path filePath = uploadDir.resolve(relativePath).normalize();

            if (!filePath.startsWith(uploadDir)) {
                throw new FileStorageException("Path traversal detected: " + fileUrl);
            }

            return filePath;

        } catch (FileStorageException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ Failed to resolve path: {}", fileUrl, e);
            throw new FileStorageException("Invalid file path: " + e.getMessage());
        }
    }

    private void validateFileByCategory(MultipartFile file, FileTypeUtil.FileCategory category) {
        if (file.isEmpty()) {
            throw new FileStorageException("Cannot upload empty file");
        }

        long maxSizeMB = switch (category) {
            case IMAGE    -> IMAGE_MAX_SIZE_MB;
            case VIDEO    -> VIDEO_MAX_SIZE_MB;
            case DOCUMENT -> DOCUMENT_MAX_SIZE_MB;
            case OTHER    -> DEFAULT_MAX_SIZE_MB;
        };

        long maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.getSize() > maxSizeBytes) {
            throw new FileStorageException(
                    String.format("File size exceeds %d MB limit for %s files",
                            maxSizeMB, category.name().toLowerCase())
            );
        }

        if (file.getContentType() == null) {
            throw new FileStorageException("Cannot determine file type");
        }
    }

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