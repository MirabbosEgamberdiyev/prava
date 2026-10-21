package uz.pravaimtihon.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.repository.UserRepository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

@DisplayName("Telegram bot /start welcome message and BotFather texts")
class TelegramWelcomeMessageTest {

    private TelegramBotService bot;

    @BeforeEach
    void setUp() {
        bot = new TelegramBotService(mock(TelegramTokenStore.class), mock(TelegramAuthSessionStore.class),
                mock(UserRepository.class), mock(PasswordEncoder.class));
        ReflectionTestUtils.setField(bot, "supportUsername", "pravaonline_support");
        ReflectionTestUtils.setField(bot, "webAppUrl", "https://web.pravaonline.uz");
        ReflectionTestUtils.setField(bot, "androidDownloadUrl", "https://pravaonline.uz/downloads");
    }

    @SuppressWarnings("unchecked")
    private static List<String> buttonTargets(Map<String, Object> markup) {
        List<List<Map<String, Object>>> rows = (List<List<Map<String, Object>>>) markup.get("inline_keyboard");
        return rows.stream().flatMap(List::stream)
                .map(b -> String.valueOf(b.getOrDefault("url", b.get("callback_data"))))
                .collect(Collectors.toList());
    }

    @Test
    @DisplayName("Welcome: greeting, one-time code and app/android/web/support/language buttons")
    void welcomeHasCodeAndButtons() {
        TelegramBotService.WelcomeMessage w = bot.buildWelcome(AcceptLanguage.UZL, "Ali", "12345",
                "https://pravaonline.uz/auth/telegram-callback?token=12345");

        assertTrue(w.text().contains("Assalomu alaykum, <b>Ali</b>"));
        assertTrue(w.text().contains("<code>12345</code>"));
        assertEquals(List.of(
                "https://pravaonline.uz/auth/telegram-callback?token=12345",
                "https://pravaonline.uz/downloads",
                "https://web.pravaonline.uz",
                "https://t.me/pravaonline_support",
                "choose_lang"), buttonTargets(w.markup()));
    }

    @Test
    @DisplayName("Welcome is localized (Cyrillic, Russian) and escapes HTML in the user's name")
    void localizedAndEscaped() {
        assertTrue(bot.buildWelcome(AcceptLanguage.UZC, "Ali", "1", "u").text().contains("Ассалому алайкум"));
        assertTrue(bot.buildWelcome(AcceptLanguage.RU, "Ali", "1", "u").text().contains("Здравствуйте"));
        String text = bot.buildWelcome(AcceptLanguage.UZL, "<b>x</b>", "1", "u").text();
        assertTrue(text.contains("&lt;b&gt;x&lt;/b&gt;"), text);
    }

    @Test
    @DisplayName("BotFather description/about texts match the partner's wording")
    void botFatherTexts() {
        assertEquals("PRAVA ONLINE — Haydovchilik guvohnomasi imtihonlariga tayyorlanish bo‘yicha rasmiy bot.",
                TelegramBotService.BOT_DESCRIPTION.get("uz"));
        assertEquals("Avtomaktab testlari, biletlar, avtodrom simulyatori va 1v1 Oktagon bellashuvlari.",
                TelegramBotService.BOT_ABOUT.get("uz"));
        assertTrue(TelegramBotService.BOT_ABOUT.get("uz").length() <= 120, "Telegram short description limit");
        assertNotNull(TelegramBotService.BOT_DESCRIPTION.get("ru"));
    }
}
