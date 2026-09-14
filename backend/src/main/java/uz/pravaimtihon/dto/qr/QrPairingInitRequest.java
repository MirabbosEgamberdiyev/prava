package uz.pravaimtihon.dto.qr;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QrPairingInitRequest {
    private String clientType;
    private String clientVersion;
    private String deviceName;
    private String deviceUuid;
}
