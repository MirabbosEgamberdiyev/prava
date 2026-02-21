package uz.pravaimtihon.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import uz.pravaimtihon.exception.FileStorageException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * ✅ Cached File Service - Reduces disk I/O
 * Images are cached in memory for faster access
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CachedFileService {

    /**
     * ✅ Get file with caching
     * Cache key: folder + filename
     * TTL: 1 hour (configured in application.yaml)
     */
    @Cacheable(value = "fileCache", key = "#folder + ':' + #filename")
    public byte[] getCachedFile(String folder, String filename) {
        try {
            Path uploadDir = Paths.get("uploads").toAbsolutePath().normalize();
            Path filePath = uploadDir.resolve(folder).resolve(filename).normalize();

            // Security check
            if (!filePath.startsWith(uploadDir)) {
                throw new FileStorageException("Invalid file path");
            }

            if (!Files.exists(filePath)) {
                log.warn("File not found: {}", filePath);
                throw new FileStorageException("File not found: " + filename);
            }

            byte[] fileData = Files.readAllBytes(filePath);
            log.debug("✅ File loaded (will be cached): {}/{}", folder, filename);

            return fileData;

        } catch (IOException e) {
            log.error("Error reading file: {}/{}", folder, filename, e);
            throw new FileStorageException("Failed to read file: " + e.getMessage());
        }
    }

    /**
     * ✅ Get content type
     */
    @Cacheable(value = "contentTypeCache", key = "#folder + ':' + #filename")
    public String getContentType(String folder, String filename) {
        try {
            Path uploadDir = Paths.get("uploads").toAbsolutePath().normalize();
            Path filePath = uploadDir.resolve(folder).resolve(filename).normalize();

            if (!Files.exists(filePath)) {
                return "application/octet-stream";
            }

            String contentType = Files.probeContentType(filePath);
            return contentType != null ? contentType : "application/octet-stream";

        } catch (IOException e) {
            log.error("Error detecting content type: {}/{}", folder, filename, e);
            return "application/octet-stream";
        }
    }

    /**
     * ✅ Check if file exists (cached)
     */
    @Cacheable(value = "fileExistsCache", key = "#folder + ':' + #filename")
    public boolean fileExists(String folder, String filename) {
        try {
            Path uploadDir = Paths.get("uploads").toAbsolutePath().normalize();
            Path filePath = uploadDir.resolve(folder).resolve(filename).normalize();

            return Files.exists(filePath);

        } catch (Exception e) {
            log.error("Error checking file existence: {}/{}", folder, filename, e);
            return false;
        }
    }
}