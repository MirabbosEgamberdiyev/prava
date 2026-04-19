package uz.pravaimtihon.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPackagePricingResponse {
    private Long        packageId;
    private String      nameUzl;
    private Boolean     isFree;
    private BigDecimal  price;
}
