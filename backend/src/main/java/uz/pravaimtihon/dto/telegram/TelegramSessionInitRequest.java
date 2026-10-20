package uz.pravaimtihon.dto.telegram;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Telegram login sessiyasini boshlash so'rovi")
public class TelegramSessionInitRequest {

    @Schema(description = "Klient platformasi: web | mobile | desktop", example = "web")
    private String platform;

    @Schema(description = "Qurilma nomi yoki identifikatori (ixtiyoriy)", example = "Chrome Windows")
    private String deviceName;

    @Schema(description = "Muvaffaqiyatli kirishdan keyingi yo'naltirish manzili (ixtiyoriy)", example = "/exam")
    private String redirectPath;
}
