package uz.pravaimtihon.dto.telegram;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Telegram login sessiyasi boshlanganda qaytariladigan ma'lumotlar")
public class TelegramSessionInitResponse {

    @ToString.Exclude
    @Schema(description = "Bir martalik xavfsiz sessiya tokeni (botga /start parametri sifatida beriladi)",
            example = "auth_a1b2c3d4e5f6...")
    private String token;

    @ToString.Exclude
    @Schema(description = "Sessiya holatini xavfsiz tekshirish uchun maxfiy poll kaliti (faqat tashabbuskor klientga beriladi)",
            example = "poll_x9y8z7...")
    private String pollSecret;

    @Schema(description = "Telegram bot foydalanuvchi nomi", example = "pravaonlineuzbot")
    private String botUsername;

    @ToString.Exclude
    @Schema(description = "Telegram bot veb havolasi", example = "https://t.me/pravaonlineuzbot?start=auth_a1b2c3...")
    private String botUrl;

    @ToString.Exclude
    @Schema(description = "Telegram ilovasini to'g'ridan-to'g'ri ochuvchi native deep link",
            example = "tg://resolve?domain=pravaonlineuzbot&start=auth_a1b2c3...")
    private String directAppUrl;

    @Schema(description = "Sessiyaning amal qilish muddati (soniya)", example = "300")
    private long expiresInSeconds;
}
