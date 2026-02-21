package uz.pravaimtihon.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import uz.pravaimtihon.dto.response.FileUploadResponse;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.exception.FileStorageException;
import uz.pravaimtihon.service.MessageService;
import uz.pravaimtihon.service.impl.FileStorageManager;

import java.util.ArrayList;
import java.util.List;

/**
 * ✅ File Service - Business Logic Layer
 * Moves all file operations logic from Controller to Service
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileService {

    private final FileStorageManager fileStorageManager;
    private final MessageService messageService;

    // ==================== UPLOAD OPERATIONS ====================

    /**
     * Upload single file
     */
    public FileUploadResponse uploadSingleFile(MultipartFile file, String folder, AcceptLanguage language) {
        validateFile(file, language);
        validateFolder(folder, language);

        try {
            log.info("📤 Uploading: {} to folder: {}", file.getOriginalFilename(), folder);
            return fileStorageManager.uploadFile(file, folder);
        } catch (FileStorageException e) {
            log.error("❌ Upload failed: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ Unexpected upload error", e);
            throw new FileStorageException(
                    messageService.getMessage("file.upload.failed", language) + ": " + e.getMessage()
            );
        }
    }

    /**
     * Upload multiple files
     */
    public UploadMultipleResult uploadMultipleFiles(MultipartFile[] files, String folder, AcceptLanguage language) {
        validateFolder(folder, language);

        List<FileUploadResponse> responses = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        log.info("📤 Uploading {} files to: {}", files.length, folder);

        for (MultipartFile file : files) {
            try {
                validateFile(file, language);
                FileUploadResponse response = fileStorageManager.uploadFile(file, folder);
                responses.add(response);
            } catch (Exception e) {
                String errorMsg = file.getOriginalFilename() + ": " + e.getMessage();
                errors.add(errorMsg);
                log.error("❌ Failed to upload: {}", errorMsg);
            }
        }

        return new UploadMultipleResult(responses, errors);
    }

    // ==================== DOWNLOAD OPERATIONS ====================

    /**
     * Download file by fileName
     */
    public FileDownloadResult downloadByFileName(String fileName, String folder, AcceptLanguage language) {
        validateFileName(fileName, language);
        validateFolder(folder, language);

        String fileUrl = fileStorageManager.buildFileUrl(folder, fileName);
        return downloadFile(fileUrl, fileName, language);
    }

    /**
     * Download file by fileUrl
     */
    public FileDownloadResult downloadByFileUrl(String fileUrl, AcceptLanguage language) {
        if (fileUrl == null || fileUrl.isBlank()) {
            throw new FileStorageException(
                    messageService.getMessage("file.url.required", language)
            );
        }

        String fileName = fileStorageManager.extractFilename(fileUrl);
        return downloadFile(fileUrl, fileName, language);
    }

    /**
     * Internal download helper
     */
    private FileDownloadResult downloadFile(String fileUrl, String fileName, AcceptLanguage language) {
        try {
            log.info("📥 Downloading: {}", fileName);
            byte[] fileData = fileStorageManager.getFile(fileUrl);
            String contentType = detectContentType(fileName);

            log.info("✅ Downloaded: {} ({} bytes)", fileName, fileData.length);
            return new FileDownloadResult(fileData, fileName, contentType);
        } catch (Exception e) {
            log.error("❌ Download failed: {}", e.getMessage());
            throw new FileStorageException(
                    messageService.getMessage("file.download.failed", language)
            );
        }
    }

    // ==================== UPDATE OPERATIONS ====================

    /**
     * Update file by fileName
     */
    public FileUploadResponse updateByFileName(String fileName, String folder,
                                               MultipartFile newFile, AcceptLanguage language) {
        validateFileName(fileName, language);
        validateFolder(folder, language);
        validateFile(newFile, language);

        String oldFileUrl = fileStorageManager.buildFileUrl(folder, fileName);
        return updateFile(oldFileUrl, folder, newFile, language);
    }

    /**
     * Update file by fileUrl
     */
    public FileUploadResponse updateByFileUrl(String fileUrl, MultipartFile newFile, AcceptLanguage language) {
        if (fileUrl == null || fileUrl.isBlank()) {
            throw new FileStorageException(
                    messageService.getMessage("file.url.required", language)
            );
        }

        validateFile(newFile, language);
        String folder = fileStorageManager.extractFolder(fileUrl);
        return updateFile(fileUrl, folder, newFile, language);
    }

    /**
     * Internal update helper
     */
    private FileUploadResponse updateFile(String oldFileUrl, String folder,
                                          MultipartFile newFile, AcceptLanguage language) {
        try {
            log.info("🔄 Updating file: {}", oldFileUrl);

            // Check if old file exists
            if (!fileStorageManager.fileExists(oldFileUrl)) {
                throw new FileStorageException(
                        messageService.getMessage("file.not.found", language)
                );
            }

            // Delete old file
            fileStorageManager.deleteFile(oldFileUrl);
            log.info("✅ Old file deleted");

            // Upload new file
            FileUploadResponse response = fileStorageManager.uploadFile(newFile, folder);
            log.info("✅ New file uploaded: {}", response.getFileUrl());

            return response;
        } catch (FileStorageException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ Update failed", e);
            throw new FileStorageException(
                    messageService.getMessage("file.update.failed", language)
            );
        }
    }

    // ==================== DELETE OPERATIONS ====================

    /**
     * Delete file by fileName
     */
    public boolean deleteByFileName(String fileName, String folder, AcceptLanguage language) {
        validateFileName(fileName, language);
        validateFolder(folder, language);

        String fileUrl = fileStorageManager.buildFileUrl(folder, fileName);
        return deleteFile(fileUrl, language);
    }

    /**
     * Delete file by fileUrl
     */
    public boolean deleteByFileUrl(String fileUrl, AcceptLanguage language) {
        if (fileUrl == null || fileUrl.isBlank()) {
            throw new FileStorageException(
                    messageService.getMessage("file.url.required", language)
            );
        }

        return deleteFile(fileUrl, language);
    }

    /**
     * Internal delete helper
     */
    private boolean deleteFile(String fileUrl, AcceptLanguage language) {
        try {
            log.info("🗑️ Deleting: {}", fileUrl);
            return fileStorageManager.deleteFile(fileUrl);
        } catch (Exception e) {
            log.error("❌ Delete failed: {}", e.getMessage());
            throw new FileStorageException(
                    messageService.getMessage("file.delete.failed", language)
            );
        }
    }

    // ==================== CHECK OPERATIONS ====================

    /**
     * Check if file exists by fileName
     */
    public boolean checkExistsByFileName(String fileName, String folder) {
        String fileUrl = fileStorageManager.buildFileUrl(folder, fileName);
        return fileStorageManager.fileExists(fileUrl);
    }

    /**
     * Check if file exists by fileUrl
     */
    public boolean checkExistsByFileUrl(String fileUrl) {
        return fileStorageManager.fileExists(fileUrl);
    }

    // ==================== VALIDATION METHODS ====================

    /**
     * Validate file
     */
    private void validateFile(MultipartFile file, AcceptLanguage language) {
        if (file == null || file.isEmpty()) {
            throw new FileStorageException(
                    messageService.getMessage("validation.file.empty", language)
            );
        }

        if (file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()) {
            throw new FileStorageException(
                    messageService.getMessage("file.invalid.filename", language)
            );
        }
    }

    /**
     * Validate fileName
     */
    private void validateFileName(String fileName, AcceptLanguage language) {
        if (fileName == null || fileName.isBlank()) {
            throw new FileStorageException(
                    messageService.getMessage("file.invalid.filename", language)
            );
        }

        // Security check
        if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            throw new FileStorageException(
                    messageService.getMessage("file.invalid.filename", language)
            );
        }
    }

    /**
     * Validate folder name
     */
    private void validateFolder(String folder, AcceptLanguage language) {
        if (folder == null || folder.isBlank()) {
            throw new FileStorageException(
                    messageService.getMessage("file.invalid.folder", language)
            );
        }

        // Security check
        if (folder.contains("..") || folder.contains("/") || folder.contains("\\")) {
            throw new FileStorageException(
                    messageService.getMessage("file.invalid.folder", language)
            );
        }
    }

    /**
     * Detect content type
     */
    private String detectContentType(String fileName) {
        try {
            String extension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
            return switch (extension) {
                case "jpg", "jpeg" -> "image/jpeg";
                case "png" -> "image/png";
                case "gif" -> "image/gif";
                case "webp" -> "image/webp";
                case "svg" -> "image/svg+xml";
                case "pdf" -> "application/pdf";
                case "doc" -> "application/msword";
                case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                case "mp4" -> "video/mp4";
                case "webm" -> "video/webm";
                default -> "application/octet-stream";
            };
        } catch (Exception e) {
            return "application/octet-stream";
        }
    }

    // ==================== RESULT CLASSES ====================

    public record UploadMultipleResult(
            List<FileUploadResponse> successfulUploads,
            List<String> errors
    ) {}

    public record FileDownloadResult(
            byte[] data,
            String fileName,
            String contentType
    ) {}
}