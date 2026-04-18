package uz.pravaimtihon.dto.request;

import jakarta.validation.constraints.AssertTrue;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoogleAuthRequest {

    private String idToken;

    private String accessToken;

    @AssertTrue(message = "idToken yoki accessToken kamida bittasi bo'lishi shart")
    private boolean isTokenProvided() {
        return (idToken != null && !idToken.isBlank())
                || (accessToken != null && !accessToken.isBlank());
    }
}
