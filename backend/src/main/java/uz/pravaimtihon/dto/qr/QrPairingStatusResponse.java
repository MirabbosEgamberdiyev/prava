package uz.pravaimtihon.dto.qr;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.dto.response.UserResponse;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QrPairingStatusResponse {
    private String status;
    private String accessToken;
    private String refreshToken;
    private Long expiresIn;
    private UserResponse user;
}
