package uz.pravaimtihon.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.dto.response.exam.LocalizedText;

import java.util.List;

/**
 * Admin panel uchun to'liq dashboard statistikasi.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DashboardStatsResponse {

    // ============================================
    // Asosiy statistikalar
    // ============================================

    private Long totalUsers;
    private Long totalQuestions;
    private Long totalPackages;
    private Long totalTickets;
    private Long totalExams;
    private Long completedExams;
    private Long activeExams;
    private Double averageScore;

    // ============================================
    // Vaqt bo'yicha statistikalar
    // ============================================

    private Long examsToday;
    private Long examsThisWeek;
    private Long examsThisMonth;
    private Long activeUsersToday;

    // ============================================
    // Imtihon turlari bo'yicha
    // ============================================

    private Long packageExams;
    private Long ticketExams;
    private Long marathonExams;

    // ============================================
    // O'tish statistikasi
    // ============================================

    private Long passedExams;
    private Long failedExams;
    private Double passRate;

    // ============================================
    // Eng mashhur paketlar va biletlar
    // ============================================

    private List<PopularPackageItem> popularPackages;
    private List<PopularTicketItem> popularTickets;

    // ============================================
    // Nested Classes
    // ============================================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PopularPackageItem {
        private Long packageId;
        private LocalizedText packageName;
        private Long usageCount;
        private Double averageScore;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PopularTicketItem {
        private Long ticketId;
        private Integer ticketNumber;
        private LocalizedText ticketName;
        private Long usageCount;
    }
}