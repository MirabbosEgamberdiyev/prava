package uz.pravaimtihon.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for exam-related settings.
 * Values are loaded from application.yaml under 'app.exam' prefix.
 *
 * ✅ ALL exam-related values are externalized here - NO magic numbers in code.
 */
@Configuration
@ConfigurationProperties(prefix = "app.exam")
@Getter
@Setter
public class ExamProperties {

    // ============================================
    // DEFAULT VALUES
    // ============================================

    /**
     * Default exam duration in minutes.
     * Used when creating packages without explicit duration.
     */
    private Integer defaultDurationMinutes = 30;

    /**
     * Default passing score percentage (0-100).
     * Used when creating packages without explicit passing score.
     */
    private Integer passingScorePercentage = 70;

    // ============================================
    // BOUNDARY VALUES
    // ============================================

    /**
     * Minimum exam duration in minutes.
     */
    private Integer minDurationMinutes = 5;

    /**
     * Maximum exam duration in minutes.
     */
    private Integer maxDurationMinutes = 180;

    /**
     * Minimum number of questions per exam.
     */
    private Integer minQuestionsPerExam = 1;

    /**
     * Maximum number of questions allowed per exam.
     */
    private Integer maxQuestionsPerExam = 100;

    // ============================================
    // MARATHON MODE CONFIGURATION
    // ============================================

    /**
     * Marathon mode minimum duration (minutes).
     * Duration = max(marathonMinDuration, questionCount)
     */
    private Integer marathonMinDurationMinutes = 10;

    /**
     * Marathon mode default passing score percentage.
     */
    private Integer marathonDefaultPassingScore = 70;

    /**
     * Marathon mode minimum questions.
     */
    private Integer marathonMinQuestions = 5;

    /**
     * Marathon mode maximum questions.
     */
    private Integer marathonMaxQuestions = 100;
}
