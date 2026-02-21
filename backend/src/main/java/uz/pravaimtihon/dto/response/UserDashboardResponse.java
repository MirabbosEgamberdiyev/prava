package uz.pravaimtihon.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.dto.response.exam.LocalizedText;

import java.util.List;

/**
 * User panel uchun to'liq dashboard statistikasi.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserDashboardResponse {

    // ============================================
    // Umumiy statistika
    // ============================================

    /**
     * Jami imtihonlar soni
     */
    private Long totalExams;

    /**
     * Muvaffaqiyatli o'tilgan imtihonlar
     */
    private Long passedExams;

    /**
     * Muvaffaqiyatsiz imtihonlar
     */
    private Long failedExams;

    /**
     * O'rtacha ball (foiz)
     */
    private Double averageScore;

    /**
     * Eng yaxshi ball (foiz)
     */
    private Double bestScore;

    /**
     * Joriy ketma-ketlik (streak)
     */
    private Integer currentStreak;

    /**
     * Eng uzun ketma-ketlik
     */
    private Integer longestStreak;

    /**
     * Jami sarflangan vaqt (soniya)
     */
    private Long totalTimeSpentSeconds;

    // ============================================
    // Paket statistikasi
    // ============================================

    /**
     * Paket bo'yicha statistikalar
     */
    private List<PackageStatItem> packageStats;

    // ============================================
    // Bilet statistikasi
    // ============================================

    /**
     * Bilet bo'yicha statistikalar
     */
    private List<TicketStatItem> ticketStats;

    // ============================================
    // Marathon statistikasi
    // ============================================

    /**
     * Marathon statistikasi
     */
    private MarathonStatItem marathonStats;

    // ============================================
    // Nested Classes
    // ============================================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PackageStatItem {
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
    public static class TicketStatItem {
        private Long ticketId;
        private Integer ticketNumber;
        private LocalizedText ticketName;
        private Long totalExams;
        private Long passedExams;
        private Double averageScore;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MarathonStatItem {
        private Long totalExams;
        private Long passedExams;
        private Long failedExams;
        private Double averageScore;
        private Long totalCorrectAnswers;
        private Long totalQuestions;
        private Double accuracy;
    }
}
