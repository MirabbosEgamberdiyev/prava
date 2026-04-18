package uz.pravaimtihon.service;

import com.google.api.client.googleapis.auth.oauth2.*;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import uz.pravaimtihon.dto.google.GoogleUserInfo;
import uz.pravaimtihon.exception.BusinessException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class GoogleOAuthService {

    private final GoogleIdTokenVerifier verifier;
    private final RestTemplate restTemplate;

    @Value("${app.oauth.google.enabled:true}")
    private boolean enabled;

    public GoogleOAuthService(
            @Value("${app.google.client-id}") String clientId,
            @Value("${app.google.android-client-id:}") String androidClientId,
            @Value("${app.google.ios-client-id:}") String iosClientId,
            RestTemplate restTemplate
    ) {
        this.restTemplate = restTemplate;
        List<String> audiences = new ArrayList<>();
        audiences.add(clientId);
        if (androidClientId != null && !androidClientId.isBlank()) {
            audiences.add(androidClientId);
            log.info("Google OAuth: Android client ID configured");
        }
        if (iosClientId != null && !iosClientId.isBlank()) {
            audiences.add(iosClientId);
            log.info("Google OAuth: iOS client ID configured");
        }
        this.verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance()
        ).setAudience(audiences).build();
        log.info("Google OAuth: verifier configured with {} audience(s)", audiences.size());
    }

    public GoogleUserInfo verifyToken(String idToken) {
        if (!enabled) {
            throw new BusinessException("error.google.oauth.disabled");
        }

        try {
            log.debug("Verifying Google ID token");
            GoogleIdToken token = verifier.verify(idToken);
            if (token == null) {
                log.warn("Google ID token verification failed: token is null (invalid signature or wrong audience)");
                throw new BusinessException("error.google.token.invalid");
            }

            GoogleIdToken.Payload p = token.getPayload();
            log.info("Google ID token verified successfully for email: {}", p.getEmail());

            return GoogleUserInfo.builder()
                    .id(p.getSubject())
                    .email(p.getEmail())
                    .emailVerified(p.getEmailVerified())
                    .name((String) p.get("name"))
                    .givenName((String) p.get("given_name"))
                    .familyName((String) p.get("family_name"))
                    .picture((String) p.get("picture"))
                    .build();

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google ID token verification error: {}", e.getMessage());
            throw new BusinessException("error.google.token.invalid");
        }
    }

    @SuppressWarnings("unchecked")
    public GoogleUserInfo verifyAccessToken(String accessToken) {
        if (!enabled) {
            throw new BusinessException("error.google.oauth.disabled");
        }

        try {
            log.debug("Verifying Google access token via userinfo endpoint");
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + accessToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

            Map<String, Object> body = response.getBody();
            if (body == null || body.containsKey("error")) {
                log.warn("Google userinfo returned error or empty body");
                throw new BusinessException("error.google.token.invalid");
            }

            log.info("Google access token verified successfully for email: {}", body.get("email"));

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
