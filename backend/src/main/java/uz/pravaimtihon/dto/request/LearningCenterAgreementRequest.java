package uz.pravaimtihon.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class LearningCenterAgreementRequest {

    @NotNull(message = "validation.field.required")
    private Long learningCenterId;

    @NotNull(message = "validation.field.required")
    @Min(value = 1, message = "validation.value.min")
    @Max(value = 100_000, message = "validation.value.max")
    private Integer computerCount;

    private LocalDate startDate;

    @NotNull(message = "validation.field.required")
    private LocalDate endDate;

    /** PLANNED / ACTIVE / EXPIRED / CANCELLED. Default ACTIVE. */
    private String status;

    @PositiveOrZero
    @DecimalMax(value = "999999999999.99", message = "validation.value.max")
    private BigDecimal amount;

    @Size(max = 2000)
    private String note;
}
