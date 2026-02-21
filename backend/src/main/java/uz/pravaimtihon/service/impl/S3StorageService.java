package uz.pravaimtihon.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import uz.pravaimtihon.config.StorageProperties;
import uz.pravaimtihon.dto.response.FileUploadResponse;
import uz.pravaimtihon.exception.FileStorageException;
import uz.pravaimtihon.service.FileStorageService;
import uz.pravaimtihon.util.FileTypeUtil;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.UUID;

/**
 * Enhanced AWS S3 Storage Implementation
 * Supports all file types: images, videos, documents, etc.
 */
@Slf4j
@Service("s3StorageService")
@RequiredArgsConstructor
public class S3StorageService implements FileStorageService {

    private final StorageProperties storageProperties;
    private S3Client s3Client;

    private static final long DEFAULT_MAX_SIZE_MB = 100; // 100MB default
    private static final long IMAGE_MAX_SIZE_MB = 10;
    private static final long VIDEO_MAX_SIZE_MB = 500; // 500MB for videos

    @PostConstruct
    public void init() {
        try {
            if (isS3Configured()) {
                StorageProperties.S3 s3Config = storageProperties.getS3();

                AwsBasicCredentials credentials = AwsBasicCredentials.create(
                        s3Config.getAccessKey(),
                        s3Config.getSecretKey()
                );

                this.s3Client = S3Client.builder()
                        .region(Region.of(s3Config.getRegion()))
                        .credentialsProvider(StaticCredentialsProvider.create(credentials))
                        .build();

                log.info("S3 Client initialized successfully");
            } else {
                log.warn("S3 is not properly configured. S3 storage will not be available.");
            }
        } catch (Exception e) {
            log.error("Failed to initialize S3 client", e);
        }
    }

    @Override
    public FileUploadResponse uploadFile(MultipartFile file, String folder) {
        if (!isS3Configured() || s3Client == null) {
            throw new FileStorageException("S3 storage is not configured");
        }

        try {
            // Detect file category and validate
            FileTypeUtil.FileCategory category = FileTypeUtil.detectFileCategory(file);
            validateFileByCategory(file, category);

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = FileTypeUtil.getFileExtension(originalFilename);
            String fileName = UUID.randomUUID().toString() + extension;
            String key = folder + "/" + fileName;

            // Upload to S3
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(storageProperties.getS3().getBucket())
                    .key(key)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .build();

            s3Client.putObject(putObjectRequest,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            // Build file URL
            String fileUrl = buildS3Url(key);

            log.info("File uploaded to S3: {} (Category: {}, Size: {})",
                    fileUrl, category, FileTypeUtil.formatFileSize(file.getSize()));

            return FileUploadResponse.builder()
                    .fileName(fileName)
                    .fileUrl(fileUrl)
                    .fileType(file.getContentType())
                    .fileSize(file.getSize())
                    .storageType("S3")
                    .message("File uploaded successfully to S3")
                    .build();

        } catch (IOException e) {
            log.error("Failed to upload file to S3", e);
            throw new FileStorageException("Failed to upload file to S3: " + e.getMessage());
        } catch (S3Exception e) {
            log.error("S3 error during file upload", e);
            throw new FileStorageException("S3 error: " + e.awsErrorDetails().errorMessage());
        }
    }

    @Override
    public boolean deleteFile(String fileUrl) {
        if (!isS3Configured() || s3Client == null) {
            throw new FileStorageException("S3 storage is not configured");
        }

        try {
            String key = extractKeyFromUrl(fileUrl);

            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(storageProperties.getS3().getBucket())
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
            log.info("File deleted from S3: {}", fileUrl);
            return true;

        } catch (S3Exception e) {
            log.error("Failed to delete file from S3", e);
            throw new FileStorageException("Failed to delete file from S3: " + e.awsErrorDetails().errorMessage());
        }
    }

    @Override
    public byte[] getFile(String fileUrl) {
        if (!isS3Configured() || s3Client == null) {
            throw new FileStorageException("S3 storage is not configured");
        }

        try {
            String key = extractKeyFromUrl(fileUrl);

            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(storageProperties.getS3().getBucket())
                    .key(key)
                    .build();

            return s3Client.getObjectAsBytes(getObjectRequest).asByteArray();

        } catch (S3Exception e) {
            log.error("Failed to get file from S3", e);
            throw new FileStorageException("Failed to get file from S3: " + e.awsErrorDetails().errorMessage());
        }
    }

    @Override
    public boolean fileExists(String fileUrl) {
        if (!isS3Configured() || s3Client == null) {
            return false;
        }

        try {
            String key = extractKeyFromUrl(fileUrl);

            HeadObjectRequest headObjectRequest = HeadObjectRequest.builder()
                    .bucket(storageProperties.getS3().getBucket())
                    .key(key)
                    .build();

            s3Client.headObject(headObjectRequest);
            return true;

        } catch (NoSuchKeyException e) {
            return false;
        } catch (S3Exception e) {
            log.error("Error checking file existence in S3", e);
            return false;
        }
    }

    @Override
    public String getStorageType() {
        return "S3";
    }

    // ==================== HELPER METHODS ====================

    private boolean isS3Configured() {
        StorageProperties.S3 s3Config = storageProperties.getS3();
        return s3Config.getBucket() != null && !s3Config.getBucket().isEmpty()
                && s3Config.getAccessKey() != null && !s3Config.getAccessKey().isEmpty()
                && s3Config.getSecretKey() != null && !s3Config.getSecretKey().isEmpty();
    }

    private void validateFileByCategory(MultipartFile file, FileTypeUtil.FileCategory category) {
        if (file.isEmpty()) {
            throw new FileStorageException("Cannot upload empty file");
        }

        // Determine max size based on category
        long maxSizeMB = switch (category) {
            case IMAGE -> IMAGE_MAX_SIZE_MB;
            case VIDEO -> VIDEO_MAX_SIZE_MB;
            case DOCUMENT, OTHER -> DEFAULT_MAX_SIZE_MB;
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

        log.debug("File validation passed: {} - {} - {}",
                file.getOriginalFilename(), category, FileTypeUtil.formatFileSize(file.getSize()));
    }

    private String buildS3Url(String key) {
        String baseUrl = storageProperties.getS3().getBaseUrl();
        if (baseUrl != null && !baseUrl.isEmpty()) {
            return baseUrl + "/" + key;
        }

        // Default S3 URL format
        return String.format("https://%s.s3.%s.amazonaws.com/%s",
                storageProperties.getS3().getBucket(),
                storageProperties.getS3().getRegion(),
                key);
    }

    private String extractKeyFromUrl(String fileUrl) {
        // Extract key from S3 URL
        if (fileUrl.contains(".amazonaws.com/")) {
            return fileUrl.substring(fileUrl.indexOf(".amazonaws.com/") + 15);
        }
        return fileUrl;
    }
}