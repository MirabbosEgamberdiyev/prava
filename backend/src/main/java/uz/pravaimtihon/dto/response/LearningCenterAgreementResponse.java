package uz.pravaimtihon.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearningCenterAgreementResponse {
    private Long id;
    private Long learningCenterId;
    private String learningCenterName;
    private Integer computerCount;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private BigDecimal amount;
    private String note;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    /** Hisoblanadi: bugun = endDate gacha qancha kun qoldi. */
    private Long daysRemaining;
}
