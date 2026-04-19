package uz.pravaimtihon.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.payment.enums.PaymentProvider;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {
    private Long             paymentId;
    private String           merchantOrderId;
    private Long             packageId;
    private BigDecimal       amount;
    private PaymentProvider  provider;
    private String           redirectUrl;
}
