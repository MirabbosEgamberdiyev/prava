package uz.pravaimtihon.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.dto.response.exam.LocalizedText;

import java.time.LocalDateTime;
import java.util.List;

/**
 * To'liq statistika response - barcha filterlar bilan.
 * Admin va User uchun universal.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ComprehensiveStatisticsResponse {

    // ============================================
    // Filter ma'lumotlari (qaysi filter ishlatilgan)
    // ============================================
    private FilterInfo filter;

    // ============================================
    // Umumiy ko'rsatkichlar
    // ============================================
    private SummaryStats summary;

    // ============================================
    // Vaqt bo'yicha statistika
    // ============================================
    private TimeBasedStats timeStats;

    // ============================================
    // Batafsil ma'lumotlar
    // ============================================
    private List<ExamDetailItem> examDetails;

    // ============================================
    // Breakdown ma'lumotlari (per-ticket, per-package, per-topic)
    // ============================================
    private List<TicketBreakdownItem> ticketStats;
    private List<PackageBreakdownItem> packageStats;
    private List<TopicBreakdownItem> topicStats;
    private MarathonBreakdownItem marathonStats;

    // ============================================
    // Trend ma'lumotlari (oxirgi 30 kun)
    // ============================================
    private List<DailyTrendItem> dailyTrend;

    // ============================================
    // NESTED CLASSES
    // ============================================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FilterInfo {
        private Long userId;
        private String userName;
        private Long packageId;
        private LocalizedText packageName;
        private Long ticketId;
        private Integer ticketNumber;
        private LocalizedText ticketName;
        private Long topicId;
        private LocalizedText topicName;
        private String mode; // ALL, MARATHON, TICKET, PACKAGE
        private LocalDateTime fromDate;
        private LocalDateTime toDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SummaryStats {
        // Imtihonlar
        private Long totalExams;
        private Long completedExams;
        private Long inProgressExams;
        private Long abandonedExams;
        private Long expiredExams;

        // Natijalar
        private Long passedExams;
        private Long failedExams;
        private Double passRate;

        // Savollar
        private Long totalQuestions;
        private Long correctAnswers;
        private Long wrongAnswers;
        private Long unansweredQuestions;
        private Double accuracy;

        // Ball
        private Double averageScore;
        private Double bestScore;
        private Double worstScore;
        private Double medianScore;

        // Vaqt
        private Long totalTimeSpentSeconds;
        private Double averageTimePerExamSeconds;
        private Double averageTimePerQuestionSeconds;

        // Streak
        private Integer currentStreak;
        private Integer longestStreak;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TimeBasedStats {
        private Long examsToday;
        private Long examsYesterday;
        private Long examsThisWeek;
        private Long examsLastWeek;
        private Long examsThisMonth;
        private Long examsLastMonth;

        private Double averageScoreToday;
        private Double averageScoreThisWeek;
        private Double averageScoreThisMonth;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExamDetailItem {
        private Long sessionId;
        private LocalDateTime startedAt;
        private LocalDateTime finishedAt;
        private Integer durationSeconds;

        // Qaysi turdagi imtihon
        private String examType; // MARATHON, TICKET, PACKAGE
        private Long packageId;
        private LocalizedText packageName;
        private Long ticketId;
        private Integer ticketNumber;
        private LocalizedText ticketName;
        private Long topicId;
        private LocalizedText topicName;

        // Natijalar
        private Integer totalQuestions;
        private Integer correctCount;
        private Integer wrongCount;
        private Integer unansweredCount;
        private Double percentage;
        private Boolean isPassed;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DailyTrendItem {
        private LocalDateTime date;
        private Long examCount;
        private Long passedCount;
        private Long failedCount;
        private Double averageScore;
        private Long totalQuestions;
        private Long correctAnswers;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TicketBreakdownItem {
        private Long ticketId;
        private Integer ticketNumber;
        private LocalizedText ticketName;
        private Long totalExams;
        private Long passedExams;
        private Double averageScore;
        private Double bestScore;
        private String lastAttemptDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PackageBreakdownItem {
        private Long packageId;
        private LocalizedText packageName;
        private Long totalExams;
        private Long passedExams;
        private Long failedExams;
        private Double averageScore;
        private Double bestScore;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopicBreakdownItem {
        private Long topicId;
        private LocalizedText topicName;
        private String topicCode;
        private Long totalExams;
        private Long passedExams;
        private Double averageScore;
        private Double accuracy;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MarathonBreakdownItem {
        private Long totalExams;
        private Long passedExams;
        private Long failedExams;
        private Double averageScore;
        private Long totalCorrectAnswers;
        private Long totalQuestions;
        private Double accuracy;
    }
}
