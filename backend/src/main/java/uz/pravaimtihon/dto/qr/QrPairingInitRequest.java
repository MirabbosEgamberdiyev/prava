package uz.pravaimtihon.dto.qr;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class QrPairingInitRequest {
    private String clientType;
    private String clientVersion;
    private String deviceName;
    private String deviceUuid;
    private String platform;
    private String deviceId;
}
