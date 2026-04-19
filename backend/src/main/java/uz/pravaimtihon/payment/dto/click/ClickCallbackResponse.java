package uz.pravaimtihon.payment.dto.click;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Click webhook reply. Click expects JSON with these exact keys.
 *
 * Click error codes (subset):
 *    0   OK
 *   -1   SIGN CHECK FAILED
 *   -2   Incorrect parameter amount
 *   -3   Action not found
 *   -4   Already paid
 *   -5   User does not exist
 *   -6   Transaction does not exist
 *   -7   Failed to update user
 *   -8   Error in request from click
 *   -9   Transaction cancelled
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ClickCallbackResponse {

    @JsonProperty("click_trans_id")
    private Long clickTransId;

    @JsonProperty("merchant_trans_id")
    private String merchantTransId;

    @JsonProperty("merchant_prepare_id")
    private Long merchantPrepareId;

    @JsonProperty("merchant_confirm_id")
    private Long merchantConfirmId;

    @JsonProperty("error")
    private Integer error;

    @JsonProperty("error_note")
    private String errorNote;

    public static ClickCallbackResponse ok(Long clickTransId, String merchantTransId, Long prepareId) {
        return ClickCallbackResponse.builder()
                .clickTransId(clickTransId)
                .merchantTransId(merchantTransId)
                .merchantPrepareId(prepareId)
                .error(0)
                .errorNote("Success")
                .build();
    }

    public static ClickCallbackResponse okConfirm(Long clickTransId, String merchantTransId,
                                                  Long prepareId, Long confirmId) {
        return ClickCallbackResponse.builder()
                .clickTransId(clickTransId)
                .merchantTransId(merchantTransId)
                .merchantPrepareId(prepareId)
                .merchantConfirmId(confirmId)
                .error(0)
                .errorNote("Success")
                .build();
    }

    public static ClickCallbackResponse error(Long clickTransId, String merchantTransId,
                                              int code, String note) {
        return ClickCallbackResponse.builder()
                .clickTransId(clickTransId)
                .merchantTransId(merchantTransId)
                .error(code)
                .errorNote(note)
                .build();
    }
}
