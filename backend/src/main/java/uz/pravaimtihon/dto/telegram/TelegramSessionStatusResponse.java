package uz.pravaimtihon.dto.telegram;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import uz.pravaimtihon.dto.response.UserResponse;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Telegram login sessiyasining joriy holati")
public class TelegramSessionStatusResponse {

    @Schema(description = "Sessiya holati: PENDING | APPROVED | CONSUMED | EXPIRED | CANCELLED | REJECTED", example = "APPROVED")
    private String status;

    @ToString.Exclude
    @Schema(description = "JWT Access Token (faqat APPROVED holatida)", example = "eyJhbGciOiJIUzI1Ni...")
    private String accessToken;

    @ToString.Exclude
    @Schema(description = "JWT Refresh Token (faqat APPROVED holatida)", example = "eyJhbGciOiJIUzI1Ni...")
    private String refreshToken;

    @Builder.Default
    @Schema(description = "Token turi", example = "Bearer")
    private String tokenType = "Bearer";

    @Schema(description = "Token amal qilish muddati (soniya)", example = "86400")
    private Long expiresIn;

    @Schema(description = "Foydalanuvchi ma'lumotlari (faqat APPROVED holatida)")
    private UserResponse user;

    @Schema(description = "Qo'shimcha yo'naltirish manzili (mavjud bo'lsa)", example = "/exam")
    private String redirectPath;
}
