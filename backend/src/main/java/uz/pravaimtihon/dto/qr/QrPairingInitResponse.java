package uz.pravaimtihon.dto.qr;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QrPairingInitResponse {
    private String sessionId;
    private String challenge;
    private String qrPayload;
    private long expiresIn;
    private long createdAt;
}
