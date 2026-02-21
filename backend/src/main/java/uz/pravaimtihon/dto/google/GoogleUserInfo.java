package uz.pravaimtihon.dto.google;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoogleUserInfo {

    private String id;            // Google "sub"
    private String email;
    private String name;
    private String givenName;
    private String familyName;
    private String picture;
    private Boolean emailVerified;
}
