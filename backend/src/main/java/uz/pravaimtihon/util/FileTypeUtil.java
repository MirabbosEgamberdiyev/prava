package uz.pravaimtihon.util;

import lombok.experimental.UtilityClass;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;

/**
 * File Type Detection and Validation Utility
 */
@UtilityClass
public class FileTypeUtil {

    // Allowed file types
    public static final String[] IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"};
    public static final String[] VIDEO_TYPES = {"video/mp4", "video/webm", "video/ogg", "video/avi", "video/quicktime"};
    public static final String[] DOCUMENT_TYPES = {
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain"
    };

    public enum FileCategory {
        IMAGE("image"),
        VIDEO("video"),
        DOCUMENT("document"),
        OTHER("other");

        private final String value;

        FileCategory(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }
    }

    /**
     * Detect file category from content type
     */
    public static FileCategory detectFileCategory(String contentType) {
        if (contentType == null) {
            return FileCategory.OTHER;
        }

        if (contentType.startsWith("image/")) {
            return FileCategory.IMAGE;
        } else if (contentType.startsWith("video/")) {
            return FileCategory.VIDEO;
        } else if (contentType.startsWith("application/") || contentType.startsWith("text/")) {
            return FileCategory.DOCUMENT;
        }

        return FileCategory.OTHER;
    }

    /**
     * Detect file category from MultipartFile
     */
    public static FileCategory detectFileCategory(MultipartFile file) {
        return detectFileCategory(file.getContentType());
    }

    /**
     * Check if file is an image
     */
    public static boolean isImage(String contentType) {
        return contentType != null && contentType.startsWith("image/");
    }

    /**
     * Check if file is a video
     */
    public static boolean isVideo(String contentType) {
        return contentType != null && contentType.startsWith("video/");
    }

    /**
     * Check if file is a document
     */
    public static boolean isDocument(String contentType) {
        if (contentType == null) return false;
        return contentType.startsWith("application/") || contentType.startsWith("text/");
    }

    /**
     * Check if content type is allowed
     */
    public static boolean isAllowedType(String contentType, String[] allowedTypes) {
        if (contentType == null || allowedTypes == null) {
            return false;
        }

        for (String allowedType : allowedTypes) {
            if (contentType.startsWith(allowedType) || contentType.equals(allowedType)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get file extension from filename
     */
    public static String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }

    /**
     * Get file extension from MultipartFile
     */
    public static String getFileExtension(MultipartFile file) {
        return getFileExtension(file.getOriginalFilename());
    }

    /**
     * Get all allowed file types
     */
    public static String[] getAllAllowedTypes() {
        List<String> allTypes = new java.util.ArrayList<>();
        allTypes.addAll(Arrays.asList(IMAGE_TYPES));
        allTypes.addAll(Arrays.asList(VIDEO_TYPES));
        allTypes.addAll(Arrays.asList(DOCUMENT_TYPES));
        return allTypes.toArray(new String[0]);
    }

    /**
     * Get human-readable file size
     */
    public static String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String pre = "KMGTPE".charAt(exp - 1) + "";
        return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
    }
}