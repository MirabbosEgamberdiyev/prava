package uz.pravaimtihon.service;

import com.google.api.client.googleapis.auth.oauth2.*;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import uz.pravaimtihon.dto.google.GoogleUserInfo;
import uz.pravaimtihon.exception.BusinessException;

import java.util.Collections;
import java.util.Map;

@Service
@Slf4j
public class GoogleOAuthService {

    private final GoogleIdTokenVerifier verifier;

    @Value("${app.oauth.google.enabled:true}")
    private boolean enabled;

    public GoogleOAuthService(
            @Value("${app.google.client-id}") String clientId
    ) {
        this.verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance()
        ).setAudience(Collections.singletonList(clientId)).build();
    }

    public GoogleUserInfo verifyToken(String idToken) {
        if (!enabled) {
            throw new BusinessException("error.google.oauth.disabled");
        }

        try {
            GoogleIdToken token = verifier.verify(idToken);
            if (token == null) {
                throw new BusinessException("error.google.token.invalid");
            }

            GoogleIdToken.Payload p = token.getPayload();

            return GoogleUserInfo.builder()
                    .id(p.getSubject())
                    .email(p.getEmail())
                    .emailVerified(p.getEmailVerified())
                    .name((String) p.get("name"))
                    .givenName((String) p.get("given_name"))
                    .familyName((String) p.get("family_name"))
                    .picture((String) p.get("picture"))
                    .build();

        } catch (Exception e) {
            throw new BusinessException("error.google.token.invalid");
        }
    }

    @SuppressWarnings("unchecked")
    public GoogleUserInfo verifyAccessToken(String accessToken) {
        if (!enabled) {
            throw new BusinessException("error.google.oauth.disabled");
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<Map> response = restTemplate.getForEntity(
                    "https://www.googleapis.com/oauth2/v3/userinfo?access_token=" + accessToken,
                    Map.class
            );

            Map<String, Object> body = response.getBody();
            if (body == null || body.containsKey("error")) {
                throw new BusinessException("error.google.token.invalid");
            }

            return GoogleUserInfo.builder()
                    .id((String) body.get("sub"))
                    .email((String) body.get("email"))
                    .emailVerified(Boolean.TRUE.equals(body.get("email_verified")))
                    .name((String) body.get("name"))
                    .givenName((String) body.get("given_name"))
                    .familyName((String) body.get("family_name"))
                    .picture((String) body.get("picture"))
                    .build();

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to verify Google access token: {}", e.getMessage());
            throw new BusinessException("error.google.token.invalid");
        }
    }
}
