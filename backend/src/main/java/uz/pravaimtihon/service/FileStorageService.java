package uz.pravaimtihon.service;

import org.springframework.web.multipart.MultipartFile;
import uz.pravaimtihon.dto.response.FileUploadResponse;

/**
 * Enhanced File Storage Service Interface
 * Supports multiple file types: images, videos, PDFs, documents, etc.
 */
public interface FileStorageService {

    /**
     * Upload file to configured storage
     * @param file - MultipartFile from request
     * @param folder - folder name (e.g., "questions", "profiles", "documents")
     * @return FileUploadResponse with URL and metadata
     */
    FileUploadResponse uploadFile(MultipartFile file, String folder);

    /**
     * Delete file from storage
     * @param fileUrl - full file URL or path
     * @return true if deleted successfully
     */
    boolean deleteFile(String fileUrl);

    /**
     * Get file as byte array
     * @param fileUrl - full file URL or path
     * @return byte array of file content
     */
    byte[] getFile(String fileUrl);

    /**
     * Check if file exists in storage
     * @param fileUrl - full file URL or path
     * @return true if file exists
     */
    boolean fileExists(String fileUrl);

    /**
     * Get current storage type
     * @return storage type (LOCAL, S3, CLOUDINARY)
     */
    String getStorageType();

    /**
     * Validate file before upload
     * @param file - file to validate
     * @param allowedTypes - allowed MIME types (null = all types allowed)
     * @param maxSizeMB - maximum file size in MB
     * @throws uz.pravaimtihon.exception.FileStorageException if validation fails
     */
    default void validateFile(MultipartFile file, String[] allowedTypes, long maxSizeMB) {
        if (file == null || file.isEmpty()) {
            throw new uz.pravaimtihon.exception.FileStorageException("Cannot upload empty file");
        }

        // Check file size
        long maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.getSize() > maxSizeBytes) {
            throw new uz.pravaimtihon.exception.FileStorageException(
                    String.format("File size exceeds maximum limit of %d MB", maxSizeMB)
            );
        }

        // Check file type if specified
        if (allowedTypes != null && allowedTypes.length > 0) {
            String contentType = file.getContentType();
            if (contentType == null) {
                throw new uz.pravaimtihon.exception.FileStorageException("Cannot determine file type");
            }

            boolean isAllowed = false;
            for (String allowedType : allowedTypes) {
                if (contentType.startsWith(allowedType)) {
                    isAllowed = true;
                    break;
                }
            }

            if (!isAllowed) {
                throw new uz.pravaimtihon.exception.FileStorageException(
                        "File type not allowed: " + contentType
                );
            }
        }
    }
}