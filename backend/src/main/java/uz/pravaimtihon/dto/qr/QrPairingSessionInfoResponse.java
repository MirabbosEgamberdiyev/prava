package uz.pravaimtihon.dto.qr;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QrPairingSessionInfoResponse {
    private String sessionId;
    private String deviceName;
    private String clientType;
    private String clientVersion;
    private String status;
    private long createdAt;
    private long expiresAt;
    private boolean isExpired;
}
