package uz.pravaimtihon.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Statistika filter so'rovi.
 * Barcha filterlar ixtiyoriy - faqat keraklisini ko'rsating.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Statistika filter parametrlari")
public class StatisticsFilterRequest {

    @Schema(description = "Foydalanuvchi ID (admin uchun)", example = "1")
    private Long userId;

    @Schema(description = "Paket ID", example = "1")
    private Long packageId;

    @Schema(description = "Bilet ID", example = "1")
    private Long ticketId;

    @Schema(description = "Mavzu ID", example = "1")
    private Long topicId;

    @Schema(description = "Imtihon turi: ALL, MARATHON, TICKET, PACKAGE", example = "ALL")
    private ExamMode mode;

    @Schema(description = "Boshlanish sanasi", example = "2024-01-01T00:00:00")
    private LocalDateTime fromDate;

    @Schema(description = "Tugash sanasi", example = "2024-12-31T23:59:59")
    private LocalDateTime toDate;

    @Schema(description = "Faqat tugatilganlar", example = "false")
    private Boolean completedOnly;

    @Schema(description = "Faqat muvaffaqiyatlilar", example = "false")
    private Boolean passedOnly;

    @Schema(description = "Batafsil ma'lumotlar (exam details)", example = "true")
    private Boolean includeDetails;

    @Schema(description = "Trend ma'lumotlari (daily trend)", example = "true")
    private Boolean includeTrend;

    @Schema(description = "Sahifa raqami", example = "0")
    private Integer page;

    @Schema(description = "Sahifa hajmi", example = "20")
    private Integer size;

    public enum ExamMode {
        ALL,
        MARATHON,
        TICKET,
        PACKAGE
    }

    // Default qiymatlar
    public ExamMode getMode() {
        return mode != null ? mode : ExamMode.ALL;
    }

    public Boolean getCompletedOnly() {
        return completedOnly != null ? completedOnly : false;
    }

    public Boolean getPassedOnly() {
        return passedOnly != null ? passedOnly : false;
    }

    public Boolean getIncludeDetails() {
        return includeDetails != null ? includeDetails : true;
    }

    public Boolean getIncludeTrend() {
        return includeTrend != null ? includeTrend : false;
    }

    public Integer getPage() {
        return page != null ? page : 0;
    }

    public Integer getSize() {
        return size != null ? Math.min(size, 100) : 20;
    }
}
