package uz.pravaimtihon.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Bilet yaratish so'rovi.
 * Biletda minimal 10 ta savol bo'lishi kerak (10, 15, 20, 25, ...).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Bilet yaratish so'rovi")
public class TicketCreateRequest {

    @Schema(description = "Bilet raqami (avtomatik belgilanadi agar ko'rsatilmasa)", example = "1")
    private Integer ticketNumber;

    @Schema(description = "Bilet nomi (UZL)", example = "Bilet #1")
    private String nameUzl;

    @Schema(description = "Bilet nomi (UZC)")
    private String nameUzc;

    @Schema(description = "Bilet nomi (EN)", example = "Ticket #1")
    private String nameEn;

    @Schema(description = "Bilet nomi (RU)", example = "Билет #1")
    private String nameRu;

    @Schema(description = "Tavsif (UZL)")
    private String descriptionUzl;

    @Schema(description = "Tavsif (UZC)")
    private String descriptionUzc;

    @Schema(description = "Tavsif (EN)")
    private String descriptionEn;

    @Schema(description = "Tavsif (RU)")
    private String descriptionRu;

    @Schema(description = "Paket ID (ixtiyoriy)", example = "1")
    private Long packageId;

    @Schema(description = "Mavzu ID (ixtiyoriy)", example = "1")
    private Long topicId;

    @NotNull(message = "validation.ticket.questions.required")
    @Size(min = 10, message = "validation.ticket.questions.min")
    @Schema(description = "Savol ID lari (minimal 10 ta)", required = true)
    private List<Long> questionIds;

    @Schema(description = "Savollar soni (default: questionIds soni, minimal 10)", example = "10")
    @Min(value = 10, message = "validation.ticket.questionCount.min")
    private Integer questionCount;

    @Schema(description = "Test davomiyligi (daqiqa)", example = "15")
    @Min(value = 5, message = "validation.ticket.duration.min")
    @Max(value = 60, message = "validation.ticket.duration.max")
    private Integer durationMinutes;

    @Schema(description = "O'tish bali (foiz)", example = "70")
    @Min(value = 1, message = "validation.ticket.passingScore.min")
    @Max(value = 100, message = "validation.ticket.passingScore.max")
    private Integer passingScore;
}
