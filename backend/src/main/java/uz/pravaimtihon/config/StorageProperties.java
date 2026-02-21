package uz.pravaimtihon.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Storage Configuration Properties
 * Maps to app.storage.* in application.yml
 */
@Data
@Component
@ConfigurationProperties(prefix = "app.storage")
public class StorageProperties {

    private String type = "local"; // local, s3, cloudinary
    private Local local = new Local();
    private S3 s3 = new S3();
    private Cloudinary cloudinary = new Cloudinary();
    private boolean fallbackToLocal = true; // Auto fallback to local if primary fails

    /**
     * Local Storage Configuration
     */
    @Data
    public static class Local {
        private String uploadDir = "uploads";
        private String baseUrl = "http://localhost:8080";
    }

    /**
     * AWS S3 Configuration
     */
    @Data
    public static class S3 {
        private String bucket;
        private String region = "us-east-1";
        private String accessKey;
        private String secretKey;
        private String baseUrl;
    }

    /**
     * Cloudinary Configuration
     */
    @Data
    public static class Cloudinary {
        private String cloudName;
        private String apiKey;
        private String apiSecret;
        private String baseUrl;
    }
}