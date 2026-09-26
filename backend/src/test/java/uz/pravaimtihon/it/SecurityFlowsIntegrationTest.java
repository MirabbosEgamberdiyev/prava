package uz.pravaimtihon.it;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.enums.Role;
import uz.pravaimtihon.repository.UserRepository;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Audit Faza 1–3 xavfsizlik tuzatishlarining uchidan-uchiga (HTTP → DB) tekshiruvi.
 * Haqiqiy PostgreSQL (Testcontainers). Docker bo'lmasa o'tkazib yuboriladi — CI'da doim ishlaydi.
 */
@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.jwt.secret=test-secret-test-secret-test-secret-test-secret-0123456789",
        "app.jwt.issuer=prava-test",
        "app.google.client-id=test-client-id.apps.googleusercontent.com",
        "app.init.question-data.enabled=false",
        "app.init.default-users.enabled=false",
        "app.telegram.bot-token=",
        "app.telegram.webhook-secret=it-webhook-secret",
        "app.payment.enabled=true",
        "app.payment.payme.cashbox-key=",
        "app.payment.payme.test-cashbox-key=",
        "app.security.rate-limit.enabled=false",
        "app.auth.cookie.secure=true",
        "spring.mail.username=test@example.com",
        "app.sms.eskiz.email=x",
        "app.sms.eskiz.password=x"
})
@AutoConfigureMockMvc
class SecurityFlowsIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;

    private String email;
    private static final String PASSWORD = "Str0ngPassw0rd!";

    @BeforeEach
    void createUser() {
        email = "it-" + UUID.randomUUID() + "@example.com";
        users.save(User.builder()
                .firstName("Test").email(email)
                .passwordHash(encoder.encode(PASSWORD))
                .role(Role.USER).isActive(true).isEmailVerified(true)
                .build());
    }

    private MvcResult login(boolean cookieMode) throws Exception {
        var req = post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"identifier\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}");
        if (cookieMode) req.header("X-Auth-Mode", "cookie");
        return mvc.perform(req).andExpect(status().isOk()).andReturn();
    }

    private String accessToken(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString()).at("/data/accessToken").asText();
    }

    // ── P0-1: Payme bo'sh kalit ────────────────────────────────────────────────
    @Test
    void paymeRejectsEmptyCashboxKey() throws Exception {
        String auth = "Basic " + Base64.getEncoder().encodeToString("Paycom:".getBytes(StandardCharsets.UTF_8));
        String body = mvc.perform(post("/api/v1/payment/payme").contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", auth)
                        .content("{\"id\":1,\"method\":\"CheckPerformTransaction\",\"params\":{\"amount\":100,\"account\":{\"order_id\":1}}}"))
                .andReturn().getResponse().getContentAsString();
        assertThat(json.readTree(body).at("/error/code").asInt()).isEqualTo(-32504);
    }

    // ── P0-2: Telegram webhook secret ──────────────────────────────────────────
    @Test
    void telegramWebhookRequiresSecret() throws Exception {
        mvc.perform(post("/api/v1/telegram/webhook").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/telegram/webhook").contentType(MediaType.APPLICATION_JSON)
                        .header("X-Telegram-Bot-Api-Secret-Token", "wrong").content("{}"))
                .andExpect(status().isForbidden());
    }

    // ── P1-W2: HttpOnly refresh cookie ─────────────────────────────────────────
    @Test
    void cookieModeLoginSetsHttpOnlyCookieAndRefreshWorksWithoutBody() throws Exception {
        MvcResult r = login(true);
        JsonNode data = json.readTree(r.getResponse().getContentAsString()).at("/data");
        assertThat(data.has("refreshToken") && !data.get("refreshToken").isNull()).isFalse();

        Cookie rt = r.getResponse().getCookie("prava_rt");
        assertThat(rt).isNotNull();
        assertThat(rt.isHttpOnly()).isTrue();
        assertThat(rt.getSecure()).isTrue();

        mvc.perform(post("/api/v1/auth/refresh").header("X-Auth-Mode", "cookie").cookie(rt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty());
    }

    @Test
    void legacyClientsStillGetRefreshTokenInBody() throws Exception {
        String body = login(false).getResponse().getContentAsString();
        assertThat(json.readTree(body).at("/data/refreshToken").asText()).isNotBlank();
    }

    // ── P1-B5: bloklangan foydalanuvchi tokeni darhol rad etiladi ─────────────
    @Test
    void blockedUserTokenIsRejectedImmediately() throws Exception {
        String token = accessToken(login(false));
        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token)).andExpect(status().isOk());

        User u = users.findByEmailAndDeletedFalse(email).orElseThrow();
        u.setIsActive(false);
        users.save(u);

        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().is4xxClientError());
    }

    // ── P1-B2: simulator endi mehmonlarga (userId=1) yozilmaydi ─────────────────
    @Test
    void simulatorSessionsRequireAuthentication() throws Exception {
        mvc.perform(get("/api/v1/simulator/sessions/1")).andExpect(status().is4xxClientError());
        mvc.perform(get("/api/v1/simulator/statistics")).andExpect(status().is4xxClientError());
    }

    // ── P1-B1: check-answer faqat faol sessiya savollari uchun ─────────────────
    @Test
    void checkAnswerOutsideActiveSessionIsRejected() throws Exception {
        String token = accessToken(login(false));
        mvc.perform(post("/api/v2/exams/check-answer").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"questionId\":1,\"selectedOptionIndex\":0}"))
                .andExpect(status().isNotFound());
    }

    // ── P1-M3: offline natija idempotent va javobsizlar hisobga olinadi ─────────
    @Test
    void offlineRecordIsIdempotentAndUsesTotalQuestions() throws Exception {
        String token = accessToken(login(false));
        String payload = "{\"clientSessionId\":\"real_1700000000000\",\"examType\":\"real\",\"durationSeconds\":600,"
                + "\"totalQuestions\":20,\"answers\":[{\"questionId\":999999,\"selectedOptionIndex\":null}]}";

        JsonNode first = json.readTree(mvc.perform(post("/api/v2/exams/record-offline")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).at("/data");
        JsonNode second = json.readTree(mvc.perform(post("/api/v2/exams/record-offline")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).at("/data");

        assertThat(second.get("sessionId").asLong()).isEqualTo(first.get("sessionId").asLong());
        assertThat(first.get("totalQuestions").asInt()).isEqualTo(20);
    }

    // ── Faza 3: public exam rules ──────────────────────────────────────────────
    @Test
    void examRulesArePublic() throws Exception {
        mvc.perform(get("/api/v1/public/exam-rules"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.marathon.secondsPerQuestion").value(60))
                .andExpect(jsonPath("$.data.real.maxWrong").value(2));
    }

    // ── Faza 5: offline-bundle v2 (savollar + mavzular + biletlar, ETag) ────────
    @Test
    void offlineBundleHasTopicsTicketsAndSupportsEtag() throws Exception {
        String token = accessToken(login(false));
        MvcResult first = mvc.perform(get("/api/v1/app/offline-bundle").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.version").isNotEmpty())
                .andExpect(jsonPath("$.data.questions").isArray())
                .andExpect(jsonPath("$.data.topics").isArray())
                .andExpect(jsonPath("$.data.tickets").isArray())
                .andReturn();
        String etag = first.getResponse().getHeader("ETag");
        assertThat(etag).isNotBlank();

        mvc.perform(get("/api/v1/app/offline-bundle").header("Authorization", "Bearer " + token)
                        .header("If-None-Match", etag))
                .andExpect(status().isNotModified());
    }

    // ── Faza 3: Accept-Language tahlili ────────────────────────────────────────
    @Test
    void browserAcceptLanguageSelectsRussianMessages() throws Exception {
        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .header("Accept-Language", "ru-RU,ru;q=0.9,en;q=0.8")
                        .content("{\"identifier\":\"" + email + "\",\"password\":\"wrong-password-1\"}"))
                .andReturn().getResponse().getContentAsString();
        assertThat(json.readTree(body).at("/message").asText()).containsPattern("[А-Яа-я]");
    }
}
