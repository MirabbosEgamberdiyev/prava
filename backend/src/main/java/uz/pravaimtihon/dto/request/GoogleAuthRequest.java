package uz.pravaimtihon.dto.request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoogleAuthRequest {

    private String idToken;

    private String accessToken;
}
