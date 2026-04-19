package uz.pravaimtihon.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.payment.enums.PaymentProvider;
import uz.pravaimtihon.payment.enums.PaymentState;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentStatusResponse {
    private Long            paymentId;
    private String          merchantOrderId;
    private PaymentProvider provider;
    private PaymentState    state;
    private BigDecimal      amount;
    private Long            packageId;
    private LocalDateTime   createdAt;
    private LocalDateTime   paidAt;
    private LocalDateTime   cancelledAt;
    private boolean         accessGranted;
}
