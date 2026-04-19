package uz.pravaimtihon.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminTogglePackagePaidRequest {

    /** true  => pullik (price shart), false => bepul */
    @NotNull
    private Boolean paid;

    /** when paid=true — must be > 0. when paid=false — ignored. */
    @DecimalMin(value = "0.0", inclusive = false, message = "price must be > 0")
    @Digits(integer = 10, fraction = 2)
    private BigDecimal price;
}
