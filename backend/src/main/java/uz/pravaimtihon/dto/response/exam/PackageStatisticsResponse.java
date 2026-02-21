package uz.pravaimtihon.dto.response.exam;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Paket statistikasi - foydalanuvchi uchun paket bo'yicha batafsil ma'lumot.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PackageStatisticsResponse {

    /**
     * Paket ID
     */
    private Long packageId;

    /**
     * Paket nomi (4 tilda)
     */
    private LocalizedText packageName;

    /**
     * Mavzu ID (agar mavjud bo'lsa)
     */
    private Long topicId;

    /**
     * Mavzu nomi (4 tilda)
     */
    private LocalizedText topicName;

    // ============================================
    // Paket ma'lumotlari
    // ============================================

    /**
     * Paketdagi savollar soni
     */
    private Integer totalQuestionsInPackage;

    /**
     * Paketdagi testlar soni (imtihonlar)
     */
    private Integer totalTestsInPackage;

    /**
     * O'tish bali (foiz)
     */
    private Integer passingScore;

    /**
     * Test davomiyligi (daqiqa)
     */
    private Integer durationMinutes;

    // ============================================
    // Foydalanuvchi statistikasi
    // ============================================

    /**
     * Foydalanuvchi topshirgan testlar soni
     */
    private Integer completedTests;

    /**
     * Foydalanuvchi muvaffaqiyatli o'tgan testlar soni
     */
    private Integer passedTests;

    /**
     * Foydalanuvchi muvaffaqiyatsiz topshirgan testlar soni
     */
    private Integer failedTests;

    /**
     * Jami to'g'ri javoblar (barcha testlar bo'yicha)
     */
    private Integer totalCorrectAnswers;

    /**
     * Jami noto'g'ri javoblar (barcha testlar bo'yicha)
     */
    private Integer totalIncorrectAnswers;

    /**
     * Jami javob berilmagan savollar
     */
    private Integer totalUnansweredQuestions;

    /**
     * O'rtacha ball (foiz)
     */
    private Double averagePercentage;

    /**
     * Eng yuqori ball (foiz)
     */
    private Double bestPercentage;

    /**
     * Eng past ball (foiz)
     */
    private Double worstPercentage;

    /**
     * O'rtacha test davomiyligi (soniya)
     */
    private Double averageTestDuration;

    /**
     * Oxirgi test sanasi
     */
    private LocalDateTime lastTestDate;

    /**
     * Birinchi test sanasi
     */
    private LocalDateTime firstTestDate;

    // ============================================
    // Progress
    // ============================================

    /**
     * Umumiy progress foizi (completedTests / totalTestsInPackage * 100)
     * Bu maydon paket ichidagi biletlar soniga bog'liq
     */
    private Double progressPercentage;

    /**
     * Muvaffaqiyat darajasi (passedTests / completedTests * 100)
     */
    private Double successRate;
}
