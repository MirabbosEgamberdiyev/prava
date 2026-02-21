package uz.pravaimtihon.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TelegramTokenLoginRequest {

    @NotBlank(message = "validation.telegram.token.required")
    private String token;
}
