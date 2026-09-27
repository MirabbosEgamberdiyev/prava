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

    /**
     * Faqat tashabbuskor (desktop) uchun poll kaliti — 32 bayt, base64url. QR payload'ga KIRMAYDI.
     * /status, /poll va /cancel so'rovlarida {@code X-QR-Poll-Secret} sarlavhasida yuboriladi.
     */
    private String pollSecret;
}
