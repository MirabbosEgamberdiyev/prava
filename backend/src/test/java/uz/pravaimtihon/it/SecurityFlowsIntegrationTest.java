package uz.pravaimtihon.it;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
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
 * Haqiqiy PostgreSQL: Testcontainers (CI) yoki {@code IT_JDBC_URL} dagi lokal test bazasi — {@link ItDatabase}.
 * Ikkalasi ham bo'lmasa o'tkazib yuboriladi.
 */
@EnabledIf("uz.pravaimtihon.it.ItDatabase#available")
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

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        ItDatabase.register(registry);
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;

    @Autowired uz.pravaimtihon.service.TelegramTokenStore telegramTokenStore;

    private String email;
    private Long telegramUserId;

    @BeforeEach
    void createUser() {
        telegramUserId = 100000000L + Math.abs(UUID.randomUUID().hashCode() % 1000000);
        email = "it-" + UUID.randomUUID() + "@example.com";
        users.save(User.builder()
                .firstName("Test").email(email)
                .telegramId(String.valueOf(telegramUserId))
                .role(Role.USER).isActive(true).isEmailVerified(true)
                .build());
    }

    private MvcResult login(boolean cookieMode) throws Exception {
        String token = telegramTokenStore.generateToken(telegramUserId, "Test", "User", "testuser");
        var req = post("/api/v1/auth/telegram/token-login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"" + token + "\"}");
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
                .andExpect(jsonPath("$.data.real.maxWrong").value(3))
                // B-20: yagona manba — qo'shimcha maydonlar
                .andExpect(jsonPath("$.data.ticket.questionCount").value(20))
                .andExpect(jsonPath("$.data.ticket.passPercent").value(90))
                .andExpect(jsonPath("$.data.ticket.count").isNumber())
                .andExpect(jsonPath("$.data.marathon.defaultQuestionCount").value(20))
                .andExpect(jsonPath("$.data.survival.maxWrong").value(0))
                .andExpect(jsonPath("$.data.guest.questionCount").value(20))
                .andExpect(jsonPath("$.data.guest.maxWrong").value(3));
    }

    // ── B-03/B-04: real imtihon natijasi baholashda ishlatilgan o'tish balini ko'rsatadi ──
    @Test
    void offlineRealExamReportsMaxWrongBasedPassingScore() throws Exception {
        String token = accessToken(login(false));
        // Klientlar (web/desktop/mobile) BARCHA savollarni yuboradi, javobsizlari selectedOptionIndex=null bilan;
        // bo'sh "answers" @NotEmpty bilan 422 bo'ladi (bu kontrakt — klient hech qachon bo'sh ro'yxat yubormaydi).
        StringBuilder unanswered = new StringBuilder();
        for (int i = 1; i <= 20; i++) {
            unanswered.append(i > 1 ? "," : "").append("{\"questionId\":").append(900_000 + i)
                    .append(",\"selectedOptionIndex\":null,\"timeSpentSeconds\":30}");
        }
        String payload = "{\"clientSessionId\":\"real_pass_" + UUID.randomUUID() + "\",\"examType\":\"real\","
                + "\"durationSeconds\":600,\"totalQuestions\":20,\"answers\":[" + unanswered + "]}";
        mvc.perform(post("/api/v2/exams/record-offline").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.passingScore").value(85))
                .andExpect(jsonPath("$.data.maxWrong").value(3))
                .andExpect(jsonPath("$.data.examMode").value("REAL"))
                .andExpect(jsonPath("$.data.isPassed").value(false));
    }

    // ── B-08: jarimalar (public, ETag) ─────────────────────────────────────────
    @Test
    void publicFinesSupportStrongEtag() throws Exception {
        MvcResult first = mvc.perform(get("/api/v1/public/fines"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.bhm.amount").isNumber())
                .andExpect(jsonPath("$.data.version").isNotEmpty())
                .andExpect(jsonPath("$.data.fines").isArray())
                .andReturn();
        String etag = first.getResponse().getHeader("ETag");
        assertThat(etag).startsWith("\"");
        assertThat(first.getResponse().getHeader("Cache-Control")).contains("max-age=300");

        mvc.perform(get("/api/v1/public/fines").header("If-None-Match", "W/" + etag))
                .andExpect(status().isNotModified());
    }

    @Test
    void adminFinesRequireAdminRole() throws Exception {
        String token = accessToken(login(false));
        mvc.perform(get("/api/v1/admin/fines").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    // ── B-10: mehmon katalogi (savollarsiz) ────────────────────────────────────
    @Test
    void publicCatalogIsOpenAndHasNoQuestionBodies() throws Exception {
        mvc.perform(get("/api/v1/public/tickets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
        mvc.perform(get("/api/v1/public/topics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }

    // ── B-15: public statistika — soxta activeUsers yo'q ───────────────────────
    @Test
    void publicStatsHasRealCountsOnly() throws Exception {
        mvc.perform(get("/api/v1/public/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalQuestions").isNumber())
                .andExpect(jsonPath("$.data.totalTickets").isNumber())
                .andExpect(jsonPath("$.data.activeUsers").doesNotExist());
    }

    // ── B-01: QR pollSecret ─────────────────────────────────────────────────────
    @Test
    void qrPollSecretIsIssuedAndVerified() throws Exception {
        JsonNode init = json.readTree(mvc.perform(post("/api/v1/auth/qr/init").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"clientType\":\"DESKTOP\",\"deviceName\":\"IT Desktop\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).at("/data");
        String sessionId = init.get("sessionId").asText();
        String secret = init.get("pollSecret").asText();
        assertThat(secret).isNotBlank();
        assertThat(init.get("qrPayload").asText()).doesNotContain(secret);

        mvc.perform(get("/api/v1/auth/qr/status").param("sessionId", sessionId).header("X-QR-Poll-Secret", "wrong"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/auth/qr/status").param("sessionId", sessionId).header("X-QR-Poll-Secret", secret))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"));

        // cancel: challenge ham, pollSecret ham bo'lmasa bekor qilinmaydi
        mvc.perform(post("/api/v1/auth/qr/cancel").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sessionId\":\"" + sessionId + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cancelled").value(false));
        mvc.perform(post("/api/v1/auth/qr/cancel").contentType(MediaType.APPLICATION_JSON)
                        .header("X-QR-Poll-Secret", secret)
                        .content("{\"sessionId\":\"" + sessionId + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cancelled").value(true));
    }

    // ── Faza 5 + 2026-10-18: offline-bundle (faqat imzolangan Desktop/Mobile, AES-256-GCM, ETag) ──
    @Test
    void offlineBundleHasTopicsTicketsAndSupportsEtag() throws Exception {
        MvcResult loginResult = login(false);
        String token = accessToken(loginResult);
        long userId = json.readTree(loginResult.getResponse().getContentAsString()).at("/data/user/id").asLong();

        // Brauzer yoki imzosiz so'rov — rad etiladi
        mvc.perform(get("/api/v1/app/offline-bundle").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/app/offline-bundle").header("Authorization", "Bearer " + token)
                        .header("X-Client-Platform", "web"))
                .andExpect(status().isForbidden());

        String ts = String.valueOf(java.time.Instant.now().getEpochSecond());
        MvcResult first = mvc.perform(get("/api/v1/app/offline-bundle").header("Authorization", "Bearer " + token)
                        .header("X-Client-Platform", "desktop")
                        .header("X-App-Timestamp", ts)
                        .header("X-App-Signature", appSignature(userId, ts, "desktop")))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Encrypted-Algorithm", "AES-256-GCM"))
                .andReturn();
        String etag = first.getResponse().getHeader("ETag");
        assertThat(etag).isNotBlank();

        JsonNode bundle = json.readTree(bundleCrypto.decryptBundle(first.getResponse().getContentAsByteArray()));
        assertThat(bundle.at("/version").asText()).isNotBlank();
        assertThat(bundle.at("/questions").isArray()).isTrue();
        assertThat(bundle.at("/topics").isArray()).isTrue();
        assertThat(bundle.at("/tickets").isArray()).isTrue();

        String ts2 = String.valueOf(java.time.Instant.now().getEpochSecond());
        mvc.perform(get("/api/v1/app/offline-bundle").header("Authorization", "Bearer " + token)
                        .header("X-Client-Platform", "desktop")
                        .header("X-App-Timestamp", ts2)
                        .header("X-App-Signature", appSignature(userId, ts2, "desktop"))
                        .header("If-None-Match", etag))
                .andExpect(status().isNotModified());
    }

    @Autowired uz.pravaimtihon.service.BundleCryptoService bundleCrypto;

    /** Klientlar bilan bir xil imzo: HMAC-SHA256("offline-bundle:<userId>:<ts>:<platform>"). */
    private static String appSignature(long userId, String ts, String platform) throws Exception {
        javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
        mac.init(new javax.crypto.spec.SecretKeySpec(
                uz.pravaimtihon.service.BundleCryptoService.APP_HMAC_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] raw = mac.doFinal(("offline-bundle:" + userId + ":" + ts + ":" + platform).getBytes(StandardCharsets.UTF_8));
        return java.util.HexFormat.of().formatHex(raw);
    }

    // ── 2026-10-20: refresh token reuse (grace oynasidan keyin) butun oilani bekor qiladi ──
    @Autowired uz.pravaimtihon.repository.RefreshTokenRepository refreshTokens;

    @Test
    void refreshReuseAfterGraceWindowRevokesWholeFamily() throws Exception {
        JsonNode first = json.readTree(login(false).getResponse().getContentAsString()).at("/data");
        String oldRefresh = first.at("/refreshToken").asText();

        JsonNode rotated = json.readTree(mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + oldRefresh + "\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).at("/data");
        String newRefresh = rotated.at("/refreshToken").asText();
        String newAccess = rotated.at("/accessToken").asText();
        assertThat(newRefresh).isNotEqualTo(oldRefresh);

        // 15 s grace oynasi o'tgan deb belgilaymiz (testni 16 s kutmasdan)
        var old = refreshTokens.findByToken(oldRefresh).orElseThrow();
        old.setRevokedAt(java.time.LocalDateTime.now().minusMinutes(1));
        refreshTokens.saveAndFlush(old);

        mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + oldRefresh + "\"}"))
                .andExpect(status().isUnauthorized());

        // Oila bekor qilingan: yangi refresh ham, shu sessiyaning access token'i ham ishlamaydi
        mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + newRefresh + "\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + newAccess))
                .andExpect(status().isUnauthorized());
    }

    // ── 2026-10-20: noto'g'ri parametrlar 500 emas, 400 (stack trace/ichki xabar yo'q) ──
    @Test
    void badParametersAreClientErrorsNot500() throws Exception {
        String token = accessToken(login(false));
        mvc.perform(get("/api/v2/exams/abc/result").header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/public/news").param("page", "abc"))
                .andExpect(status().isBadRequest());
        String body = mvc.perform(get("/api/v1/public/news").param("page", "-5").param("size", "10"))
                .andExpect(status().isBadRequest())
                .andReturn().getResponse().getContentAsString();
        assertThat(body).doesNotContain("Page index").doesNotContain("java.");
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
