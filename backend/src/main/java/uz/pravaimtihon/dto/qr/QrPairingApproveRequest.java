package uz.pravaimtihon.dto.qr;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QrPairingApproveRequest {
    @NotBlank
    private String sessionId;
    @NotBlank
    private String challenge;
}
