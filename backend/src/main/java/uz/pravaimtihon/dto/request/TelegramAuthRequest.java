package uz.pravaimtihon.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * DTO for Telegram Login Widget authentication data.
 * Accepts both snake_case (Telegram native) and camelCase (frontend) field names.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TelegramAuthRequest {

    @NotNull(message = "validation.telegram.id.required")
    private Long id;

    @NotBlank(message = "validation.telegram.first_name.required")
    @JsonProperty("first_name")
    @JsonAlias("firstName")
    private String firstName;

    @JsonProperty("last_name")
    @JsonAlias("lastName")
    private String lastName;

    private String username;

    @JsonProperty("photo_url")
    @JsonAlias("photoUrl")
    private String photoUrl;

    @NotNull(message = "validation.telegram.auth_date.required")
    @JsonProperty("auth_date")
    @JsonAlias("authDate")
    private Long authDate;

    @NotBlank(message = "validation.telegram.hash.required")
    private String hash;
}
