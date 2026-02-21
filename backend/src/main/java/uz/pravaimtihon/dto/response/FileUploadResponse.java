package uz.pravaimtihon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * File Upload Response DTO
 * Returned after successful file upload
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileUploadResponse {
    private String fileName;        // Original or generated filename
    private String fileUrl;         // Full URL to access the file
    private String fileType;        // MIME type (e.g., "image/jpeg")
    private Long fileSize;          // Size in bytes
    private String storageType;     // LOCAL, S3, or CLOUDINARY
    private String message;         // Success message
}