package uz.pravaimtihon.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** B-08: admin — jarima yaratish/yangilash (PUT to'liq almashtiradi). */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yo'l harakati jarimasi (BHM koeffitsientlari bilan)")
public class TrafficFineRequest {

    @NotBlank
    @Size(max = 50)
    @Schema(example = "128-3-modda 1-qism")
    private String articleCode;

    @NotBlank
    @Size(max = 2000)
    private String titleUzl;

    @Size(max = 2000)
    private String titleUzc;

    @Size(max = 2000)
    private String titleRu;

    @NotNull
    @DecimalMin("0.00")
    @Digits(integer = 8, fraction = 2)
    @Schema(description = "Minimal jarima — BHM koeffitsienti", example = "1")
    private BigDecimal bhmMin;

    @DecimalMin("0.00")
    @Digits(integer = 8, fraction = 2)
    @Schema(description = "Maksimal jarima — BHM koeffitsienti (ixtiyoriy, >= bhmMin)", example = "3")
    private BigDecimal bhmMax;

    @Size(max = 2000)
    private String extraSanctionUzl;

    @Size(max = 2000)
    private String extraSanctionUzc;

    @Size(max = 2000)
    private String extraSanctionRu;

    private Integer sortOrder;

    @Schema(description = "Faol (default true)")
    private Boolean active;
}
