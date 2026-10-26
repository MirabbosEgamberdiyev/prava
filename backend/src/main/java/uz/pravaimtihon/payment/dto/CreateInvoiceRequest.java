package uz.pravaimtihon.payment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateInvoiceRequest {
    @NotNull
    private Long packageId;

    /**
     * Optional preferred payment method: "click", "payme", "plum", or "inpay".
     */
    private String method;

    public CreateInvoiceRequest(Long packageId) {
        this.packageId = packageId;
    }
}
