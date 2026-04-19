package uz.pravaimtihon.payment.dto.click;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request body Click sends to /prepare and /complete endpoints.
 * Click posts form-urlencoded fields with snake_case names.
 * Spring will bind both via ModelAttribute (form) or JSON via @JsonProperty.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClickCallbackRequest {

    @JsonProperty("click_trans_id")
    private Long clickTransId;

    @JsonProperty("service_id")
    private Long serviceId;

    @JsonProperty("click_paydoc_id")
    private Long clickPaydocId;

    @JsonProperty("merchant_trans_id")
    private String merchantTransId;   // our Payment.id stringified

    @JsonProperty("merchant_prepare_id")
    private Long merchantPrepareId;   // present on complete

    @JsonProperty("amount")
    private BigDecimal amount;        // in so'm (not tiyin for Click)

    @JsonProperty("action")
    private Integer action;           // 0 = prepare, 1 = complete

    @JsonProperty("error")
    private Integer error;

    @JsonProperty("error_note")
    private String errorNote;

    @JsonProperty("sign_time")
    private String signTime;

    @JsonProperty("sign_string")
    private String signString;
}
