package uz.pravaimtihon.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import uz.pravaimtihon.dto.telegram.TelegramSessionInitRequest;
import uz.pravaimtihon.dto.telegram.TelegramSessionInitResponse;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.repository.UserRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@DisplayName("Telegram session login (deep link + bot confirmation)")
class TelegramAuthSessionStoreTest {

    private TelegramAuthSessionStore store;

    @BeforeEach
    void setUp() {
        store = new TelegramAuthSessionStore();
        ReflectionTestUtils.setField(store, "botUsername", "pravaonlineuzbot");
    }

    private TelegramSessionInitResponse init(String platform, String redirect) {
        return store.createSession(TelegramSessionInitRequest.builder().platform(platform).deviceName("Chrome <b>x</b>")
                .redirectPath(redirect).build(), "1.2.3.4", "UA");
    }

    @Test
    @DisplayName("Init returns high-entropy token, poll secret and both deep links")
    void init() {
        TelegramSessionInitResponse r = init("web", "/exam");
        assertTrue(r.getToken().matches("auth_[0-9a-f]{48}"));
        assertTrue(r.getPollSecret().length() >= 43);
        assertEquals("tg://resolve?domain=pravaonlineuzbot&start=" + r.getToken(), r.getDirectAppUrl());
        assertEquals("https://t.me/pravaonlineuzbot?start=" + r.getToken(), r.getBotUrl());
        assertTrue(("start=" + r.getToken()).length() <= 64 + 6, "Telegram /start payload limit is 64 chars");
    }

    @Test
    @DisplayName("Poll requires the secret; tokens are issued exactly once")
    void pollOnce() {
        TelegramSessionInitResponse r = init("android", null);
        assertThrows(TelegramAuthSessionStore.PollSecretException.class, () -> store.poll(r.getToken(), "wrong"));
        assertThrows(TelegramAuthSessionStore.PollSecretException.class, () -> store.poll(r.getToken(), null));
        assertEquals(TelegramAuthSessionStore.Status.PENDING, store.poll(r.getToken(), r.getPollSecret()).status());

        assertTrue(store.approve(r.getToken(), 777L, "u", 5L, AcceptLanguage.RU));
        assertFalse(store.approve(r.getToken(), 888L, "attacker", 6L, AcceptLanguage.RU), "second approval ignored");

        TelegramAuthSessionStore.PollOutcome first = store.poll(r.getToken(), r.getPollSecret());
        assertTrue(first.approved());
        assertEquals(5L, first.userId());
        assertEquals("1.2.3.4", first.clientIp());
        assertEquals(TelegramAuthSessionStore.Status.CONSUMED, store.poll(r.getToken(), r.getPollSecret()).status());
    }

    @Test
    @DisplayName("Rejected / cancelled sessions can never be approved")
    void rejectCancel() {
        TelegramSessionInitResponse a = init("web", null);
        assertTrue(store.reject(a.getToken()));
        assertFalse(store.approve(a.getToken(), 1L, null, 1L, AcceptLanguage.UZL));
        assertEquals(TelegramAuthSessionStore.Status.REJECTED, store.poll(a.getToken(), a.getPollSecret()).status());

        TelegramSessionInitResponse b = init("web", null);
        assertThrows(TelegramAuthSessionStore.PollSecretException.class, () -> store.cancel(b.getToken(), "nope"));
        assertTrue(store.cancel(b.getToken(), b.getPollSecret()));
        assertFalse(store.approve(b.getToken(), 1L, null, 1L, AcceptLanguage.UZL));
    }

    @Test
    @DisplayName("Open redirects and unknown platforms are neutralised")
    void sanitising() {
        assertNull(TelegramAuthSessionStore.safeRedirect("//evil.com"));
        assertNull(TelegramAuthSessionStore.safeRedirect("https://evil.com"));
        assertNull(TelegramAuthSessionStore.safeRedirect("/\\evil.com"));
        assertEquals("/packages/5", TelegramAuthSessionStore.safeRedirect("/packages/5"));
        TelegramSessionInitResponse r = init("<script>", "//evil.com");
        assertEquals("web", store.pendingDeviceInfo(r.getToken()).orElseThrow().platform());
        assertTrue(TelegramAuthSessionStore.shortRef(r.getToken()).length() < r.getToken().length(), "logs carry only a prefix");
    }

    @Test
    @DisplayName("Bot: /start auth_<token> asks for confirmation and does NOT approve by itself (anti login-phishing)")
    void botRequiresExplicitConfirmation() {
        UserRepository users = mock(UserRepository.class);
        User u = User.builder().telegramId("777").firstName("Ali").preferredLanguage(AcceptLanguage.UZL).isActive(true).build();
        u.setId(5L);
        when(users.findByTelegramIdAndDeletedFalse(anyString())).thenReturn(Optional.of(u));
        TelegramBotService bot = new TelegramBotService(mock(TelegramTokenStore.class), store, users, mock(PasswordEncoder.class));

        TelegramSessionInitResponse r = init("desktop", null);
        Map<String, Object> from = new HashMap<>(Map.of("id", 777L, "first_name", "Ali"));
        Map<String, Object> update = Map.of("update_id", 1L, "message", Map.of(
                "chat", Map.of("id", 777L), "from", from, "text", "/start " + r.getToken()));
        bot.handleUpdate(update);
        assertEquals(TelegramAuthSessionStore.Status.PENDING, store.poll(r.getToken(), r.getPollSecret()).status());

        Map<String, Object> cb = Map.of("update_id", 2L, "callback_query", Map.of(
                "id", "q1", "from", from, "data", TelegramBotService.SESSION_APPROVE_PREFIX + r.getToken(),
                "message", Map.of("chat", Map.of("id", 777L))));
        bot.handleUpdate(cb);
        TelegramAuthSessionStore.PollOutcome out = store.poll(r.getToken(), r.getPollSecret());
        assertTrue(out.approved());
        assertEquals(5L, out.userId());
    }

    @Test
    @DisplayName("Bot: reject button blocks the session")
    void botReject() {
        UserRepository users = mock(UserRepository.class);
        when(users.findByTelegramIdAndDeletedFalse(anyString())).thenReturn(Optional.empty());
        TelegramBotService bot = new TelegramBotService(mock(TelegramTokenStore.class), store, users, mock(PasswordEncoder.class));
        TelegramSessionInitResponse r = init("web", null);
        Map<String, Object> cb = Map.of("update_id", 3L, "callback_query", Map.of(
                "id", "q2", "from", Map.of("id", 9L), "data", TelegramBotService.SESSION_REJECT_PREFIX + r.getToken(),
                "message", Map.of("chat", Map.of("id", 9L))));
        bot.handleUpdate(cb);
        assertEquals(TelegramAuthSessionStore.Status.REJECTED, store.poll(r.getToken(), r.getPollSecret()).status());
    }

    @Test
    @DisplayName("HTML in device names is escaped for the bot prompt")
    void htmlEscape() {
        assertEquals("a &lt;b&gt; &amp;", TelegramBotService.htmlEscape("a <b> &"));
        assertNotNull(List.of());
    }
}
