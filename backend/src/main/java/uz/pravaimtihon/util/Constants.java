package uz.pravaimtihon.util;

import lombok.experimental.UtilityClass;

@UtilityClass
public class Constants {

    // JWT
    public static final String JWT_TOKEN_PREFIX = "Bearer ";
    public static final String JWT_HEADER_NAME = "Authorization";

    // Pagination
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;

    // Exam - NOTE: Actual values are now in ExamProperties (application.yaml)
    // These are kept only for backward compatibility with validation annotations
    // Use ExamProperties for runtime access
    @Deprecated(forRemoval = true)
    public static final int MIN_EXAM_DURATION = 5;
    @Deprecated(forRemoval = true)
    public static final int MAX_EXAM_DURATION = 180;
    @Deprecated(forRemoval = true)
    public static final int MIN_QUESTIONS_PER_EXAM = 1;
    @Deprecated(forRemoval = true)
    public static final int MAX_QUESTIONS_PER_EXAM = 100;
    @Deprecated(forRemoval = true)
    public static final double DEFAULT_PASSING_SCORE = 70.0;

    // Verification
    public static final int VERIFICATION_CODE_LENGTH = 6;
    public static final int VERIFICATION_CODE_EXPIRY_MINUTES = 5;
    public static final int MAX_VERIFICATION_ATTEMPTS = 3;
    public static final int MAX_CODES_PER_HOUR = 5;

    // Cache TTL (seconds)
    public static final long CACHE_TTL_QUESTIONS = 1800; // 30 minutes
    public static final long CACHE_TTL_PACKAGES = 1800; // 30 minutes
    public static final long CACHE_TTL_TOPICS = 7200; // 2 hours
    public static final long CACHE_TTL_LEADERBOARD = 300; // 5 minutes
    public static final long CACHE_TTL_STATS = 600; // 10 minutes

    // Rate Limiting
    public static final int RATE_LIMIT_REQUESTS_PER_MINUTE = 60;

    // File Upload
    public static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    public static final String[] ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/jpg"};
}
