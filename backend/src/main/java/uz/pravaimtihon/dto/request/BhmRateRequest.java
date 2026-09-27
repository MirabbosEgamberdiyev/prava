package uz.pravaimtihon.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/** B-08: admin — yangi BHM miqdorini belgilash (tarix saqlanadi). */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BhmRateRequest {

    @NotNull
    @DecimalMin("1")
    @Digits(integer = 12, fraction = 2)
    @Schema(description = "BHM miqdori, so'mda", example = "375000")
    private BigDecimal amount;

    @NotNull
    @Schema(description = "Kuchga kirish sanasi (YYYY-MM-DD)", example = "2024-08-01")
    private LocalDate effectiveFrom;
}
