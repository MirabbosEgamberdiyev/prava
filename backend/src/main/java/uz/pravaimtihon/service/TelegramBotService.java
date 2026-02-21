package uz.pravaimtihon.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.enums.OAuthProvider;
import uz.pravaimtihon.enums.Role;
import uz.pravaimtihon.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;

import uz.pravaimtihon.entity.UserStatistics;
import uz.pravaimtihon.repository.UserStatisticsRepository;

import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

@Service
@Slf4j
@RequiredArgsConstructor
public class TelegramBotService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final TelegramTokenStore tokenStore;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserStatisticsRepository statisticsRepository;

    @Value("${app.telegram.bot-token:}")
    private String botToken;

    @Value("${app.telegram.bot-username:pravaonlineuzbot}")
    private String botUsername;

    @Value("${app.telegram.webhook-url:}")
    private String webhookUrl;

    @Value("${app.telegram.base-url:https://pravaonline.uz}")
    private String baseUrl;

    /** Secret token for webhook verification (generated on startup) */
    private String webhookSecretToken;

    /** Tracks the last processed update_id to skip duplicates */
    private final AtomicLong lastProcessedUpdateId = new AtomicLong(0);

    /** Max retry attempts for Telegram API calls */
    private static final int MAX_RETRIES = 3;

    public String getWebhookSecretToken() {
        return webhookSecretToken;
    }

    private String getApiUrl() {
        return "https://api.telegram.org/bot" + botToken;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void setupWebhook() {
        if (botToken == null || botToken.isBlank()) {
            log.warn("Telegram bot token not configured, skipping webhook setup");
            return;
        }

        String url = webhookUrl;
        if (url == null || url.isBlank()) {
            log.info("Telegram webhook URL not configured, skipping webhook setup");
            return;
        }

        try {
            // Generate a secret token for webhook verification
            webhookSecretToken = UUID.randomUUID().toString().replace("-", "");

            Map<String, Object> body = new HashMap<>();
            body.put("url", url);
            body.put("allowed_updates", List.of("message", "callback_query"));
            body.put("secret_token", webhookSecretToken);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            restTemplate.postForObject(getApiUrl() + "/setWebhook", request, String.class);
            log.info("Telegram webhook set to: {} (with secret token)", url);

            // Set bot commands menu
            setupBotCommands();
        } catch (Exception e) {
            log.warn("Failed to set Telegram webhook: {}", e.getMessage());
        }
    }

    private void setupBotCommands() {
        try {
            List<Map<String, String>> commands = List.of(
                    Map.of("command", "start", "description", "Boshlash / Start"),
                    Map.of("command", "help", "description", "Yordam / Help"),
                    Map.of("command", "lang", "description", "Tilni tanlash / Change language"),
                    Map.of("command", "stats", "description", "Statistika / My statistics")
            );
            Map<String, Object> body = Map.of("commands", commands);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            restTemplate.postForObject(getApiUrl() + "/setMyCommands", request, String.class);
            log.info("Telegram bot commands set successfully");
        } catch (Exception e) {
            log.warn("Failed to set Telegram bot commands: {}", e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    public void handleUpdate(Map<String, Object> update) {
        try {
            // Deduplication: skip already processed updates
            Number updateIdNum = (Number) update.get("update_id");
            if (updateIdNum != null) {
                long updateId = updateIdNum.longValue();
                long lastId = lastProcessedUpdateId.get();
                if (updateId <= lastId) {
                    log.debug("Skipping duplicate update_id: {}", updateId);
                    return;
                }
                lastProcessedUpdateId.set(updateId);
            }

            // Handle callback_query (inline keyboard responses)
            Map<String, Object> callbackQuery = (Map<String, Object>) update.get("callback_query");
            if (callbackQuery != null) {
                handleCallbackQuery(callbackQuery);
                return;
            }

            Map<String, Object> message = (Map<String, Object>) update.get("message");
            if (message == null) return;

            String text = (String) message.get("text");
            if (text == null) return;

            Map<String, Object> chat = (Map<String, Object>) message.get("chat");
            long chatId = ((Number) chat.get("id")).longValue();

            Map<String, Object> from = (Map<String, Object>) message.get("from");
            String firstName = from != null ? (String) from.get("first_name") : "";
            String lastName = from != null ? (String) from.get("last_name") : "";
            String username = from != null ? (String) from.get("username") : "";
            String languageCode = from != null ? (String) from.get("language_code") : "uz";
            long userId = from != null ? ((Number) from.get("id")).longValue() : chatId;

            if (text.startsWith("/start")) {
                String payload = text.length() > 7 ? text.substring(7).trim() : null;
                handleStartCommand(chatId, userId, firstName, lastName, username, languageCode, payload);
            } else if (text.equals("/help")) {
                handleHelpCommand(chatId, userId);
            } else if (text.equals("/lang")) {
                handleLangCommand(chatId, userId);
            } else if (text.equals("/stats")) {
                handleStatsCommand(chatId, userId);
            } else if (text.startsWith("/")) {
                // Unknown command — respond with help hint
                handleUnknownCommand(chatId, userId);
            }
        } catch (Exception e) {
            log.error("Error handling Telegram update: {}", e.getMessage(), e);
            // Try to send error message to user
            try {
                long chatId = 0;
                Map<String, Object> message = (Map<String, Object>) update.get("message");
                if (message != null) {
                    Map<String, Object> chat = (Map<String, Object>) message.get("chat");
                    if (chat != null) chatId = ((Number) chat.get("id")).longValue();
                }
                if (chatId > 0) {
                    sendMessage(chatId, "❌ Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.", null);
                }
            } catch (Exception ignored) {
                // Don't propagate error message failure
            }
        }
    }

    private AcceptLanguage getUserLanguage(long telegramUserId) {
        String tgId = String.valueOf(telegramUserId);
        return userRepository.findByTelegramIdAndDeletedFalse(tgId)
                .map(User::getPreferredLanguage)
                .orElse(AcceptLanguage.UZL);
    }

    private void handleHelpCommand(long chatId, long telegramUserId) {
        AcceptLanguage lang = getUserLanguage(telegramUserId);
        String helpText = switch (lang) {
            case RU -> """
                    <b>Prava Online Bot</b>

                    /start - Начать / Получить ссылку для входа
                    /help - Показать эту справку
                    /lang - Изменить язык
                    /stats - Моя статистика

                    Готовьтесь к экзамену на водительские права онлайн!
                    """;
            case EN -> """
                    <b>Prava Online Bot</b>

                    /start - Start / Get login link
                    /help - Show this help
                    /lang - Change language
                    /stats - My statistics

                    Prepare for your driving license exam online!
                    """;
            case UZC -> """
                    <b>Prava Online Bot</b>

                    /start - Бошлаш / Кириш ҳаволасини олиш
                    /help - Ёрдамни кўрсатиш
                    /lang - Тилни ўзгартириш
                    /stats - Менинг статистикам

                    Ҳайдовчилик гувоҳномаси имтиҳонига онлайн тайёрланинг!
                    """;
            default -> """
                    <b>Prava Online Bot</b>

                    /start - Boshlash / Kirish havolasini olish
                    /help - Yordamni ko'rsatish
                    /lang - Tilni o'zgartirish
                    /stats - Mening statistikam

                    Haydovchilik guvohnomasi imtihoniga online tayyorlaning!
                    """;
        };
        sendMessage(chatId, helpText.trim(), null);
    }

    private void handleLangCommand(long chatId, long telegramUserId) {
        AcceptLanguage lang = getUserLanguage(telegramUserId);
        sendLanguageSelectionKeyboard(chatId, lang);
    }

    private void handleUnknownCommand(long chatId, long telegramUserId) {
        AcceptLanguage lang = getUserLanguage(telegramUserId);
        String msg = switch (lang) {
            case RU -> "❓ Неизвестная команда. Нажмите /help чтобы увидеть доступные команды.";
            case EN -> "❓ Unknown command. Press /help to see available commands.";
            case UZC -> "❓ Номаълум буйруқ. Мавжуд буйруқларни кўриш учун /help босинг.";
            default -> "❓ Noma'lum buyruq. Mavjud buyruqlarni ko'rish uchun /help bosing.";
        };
        sendMessage(chatId, msg, null);
    }

    private void handleStatsCommand(long chatId, long telegramUserId) {
        AcceptLanguage lang = getUserLanguage(telegramUserId);
        String tgId = String.valueOf(telegramUserId);
        Optional<User> userOpt = userRepository.findByTelegramIdAndDeletedFalse(tgId);

        if (userOpt.isEmpty()) {
            String msg = switch (lang) {
                case RU -> "Вы еще не зарегистрированы. Нажмите /start";
                case EN -> "You are not registered yet. Press /start";
                case UZC -> "Сиз ҳали рўйхатдан ўтмагансиз. /start босинг";
                default -> "Siz hali ro'yxatdan o'tmagansiz. /start bosing";
            };
            sendMessage(chatId, msg, null);
            return;
        }

        User user = userOpt.get();
        List<UserStatistics> stats = statisticsRepository.findByUserId(user.getId());

        if (stats == null || stats.isEmpty()) {
            String noStats = switch (lang) {
                case RU -> "📊 У вас пока нет статистики. Начните экзамен на pravaonline.uz!";
                case EN -> "📊 You have no statistics yet. Start an exam at pravaonline.uz!";
                case UZC -> "📊 Сизда ҳали статистика йўқ. pravaonline.uz да имтиҳон бошланг!";
                default -> "📊 Sizda hali statistika yo'q. pravaonline.uz da imtihon boshlang!";
            };
            sendMessage(chatId, noStats, null);
            return;
        }

        long totalExams = stats.stream().mapToLong(UserStatistics::getTotalExams).sum();
        long passedExams = stats.stream().mapToLong(UserStatistics::getPassedExams).sum();
        double accuracy = stats.stream().mapToInt(UserStatistics::getTotalQuestions).sum() > 0
                ? stats.stream().mapToInt(UserStatistics::getCorrectAnswers).sum() * 100.0
                  / stats.stream().mapToInt(UserStatistics::getTotalQuestions).sum()
                : 0.0;

        String statsText = switch (lang) {
            case RU -> String.format("""
                    📊 <b>Ваша статистика</b>

                    📝 Всего экзаменов: %d
                    ✅ Сдано: %d
                    ❌ Не сдано: %d
                    🎯 Точность: %.1f%%
                    """, totalExams, passedExams, totalExams - passedExams, accuracy);
            case EN -> String.format("""
                    📊 <b>Your Statistics</b>

                    📝 Total exams: %d
                    ✅ Passed: %d
                    ❌ Failed: %d
                    🎯 Accuracy: %.1f%%
                    """, totalExams, passedExams, totalExams - passedExams, accuracy);
            case UZC -> String.format("""
                    📊 <b>Сизнинг статистикангиз</b>

                    📝 Жами имтиҳонлар: %d
                    ✅ Ўтганлар: %d
                    ❌ Ўтмаганлар: %d
                    🎯 Аниқлик: %.1f%%
                    """, totalExams, passedExams, totalExams - passedExams, accuracy);
            default -> String.format("""
                    📊 <b>Sizning statistikangiz</b>

                    📝 Jami imtihonlar: %d
                    ✅ O'tganlar: %d
                    ❌ O'tmaganlar: %d
                    🎯 Aniqlik: %.1f%%
                    """, totalExams, passedExams, totalExams - passedExams, accuracy);
        };
        sendMessage(chatId, statsText.trim(), null);
    }

    @SuppressWarnings("unchecked")
    private void handleCallbackQuery(Map<String, Object> callbackQuery) {
        String data = (String) callbackQuery.get("data");
        String callbackQueryId = String.valueOf(callbackQuery.get("id"));
        Map<String, Object> from = (Map<String, Object>) callbackQuery.get("from");

        if (data == null || from == null) return;

        long userId = ((Number) from.get("id")).longValue();

        Map<String, Object> message = (Map<String, Object>) callbackQuery.get("message");
        if (message == null) return;
        Map<String, Object> chat = (Map<String, Object>) message.get("chat");
        long chatId = ((Number) chat.get("id")).longValue();

        if (data.startsWith("lang_")) {
            AcceptLanguage selectedLang = switch (data) {
                case "lang_uzl" -> AcceptLanguage.UZL;
                case "lang_uzc" -> AcceptLanguage.UZC;
                case "lang_ru" -> AcceptLanguage.RU;
                case "lang_en" -> AcceptLanguage.EN;
                default -> null;
            };

            if (selectedLang == null) return;

            // Update user's preferred language in DB
            String tgId = String.valueOf(userId);
            Optional<User> userOpt = userRepository.findByTelegramIdAndDeletedFalse(tgId);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setPreferredLanguage(selectedLang);
                userRepository.save(user);
                log.info("Updated language to {} for Telegram user {}", selectedLang.getCode(), userId);
            }

            // Send confirmation message in selected language
            String confirmMsg = switch (selectedLang) {
                case UZL -> "Til tanlandi: O'zbekcha (Lotin) \u2705";
                case UZC -> "\u0422\u0438\u043b \u0442\u0430\u043d\u043b\u0430\u043d\u0434\u0438: \u040e\u0437\u0431\u0435\u043a\u0447\u0430 (\u041a\u0438\u0440\u0438\u043b\u043b) \u2705";
                case RU -> "\u042f\u0437\u044b\u043a \u0432\u044b\u0431\u0440\u0430\u043d: \u0420\u0443\u0441\u0441\u043a\u0438\u0439 \u2705";
                case EN -> "Language selected: English \u2705";
            };

            sendMessage(chatId, confirmMsg, null);
            answerCallbackQuery(callbackQueryId);
        }
    }

    private void answerCallbackQuery(String callbackQueryId) {
        if (botToken == null || botToken.isBlank()) return;
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("callback_query_id", callbackQueryId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            restTemplate.postForObject(getApiUrl() + "/answerCallbackQuery", request, String.class);
        } catch (Exception e) {
            log.error("Failed to answer callback query: {}", e.getMessage());
        }
    }

    private void handleStartCommand(long chatId, long telegramUserId, String firstName,
                                     String lastName, String username, String languageCode,
                                     String payload) {
        String tgId = String.valueOf(telegramUserId);
        Optional<User> existingUser = userRepository.findByTelegramIdAndDeletedFalse(tgId);

        // Resolve language: prefer user's saved preference, fallback to Telegram language_code
        AcceptLanguage lang;
        if (existingUser.isPresent()) {
            lang = existingUser.get().getPreferredLanguage();
        } else {
            lang = mapTelegramLanguage(languageCode);
            // Auto-register new Telegram user
            userRepository.save(User.builder()
                    .telegramId(tgId)
                    .telegramUsername(username)
                    .firstName(firstName != null ? firstName : "")
                    .lastName(lastName != null ? lastName : "")
                    .oauthProvider(OAuthProvider.TELEGRAM)
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(Role.USER)
                    .preferredLanguage(lang)
                    .isActive(true)
                    .build());
            log.info("Auto-registered new Telegram user: tg_id={}", telegramUserId);
        }

        // Generate one-time login token
        String token = tokenStore.generateToken(telegramUserId);
        String loginUrl = baseUrl + "/auth/telegram-callback?token=" + token;

        // Deep link support: /start exam_5 → redirect to /packages/5
        if (payload != null && payload.startsWith("exam_")) {
            try {
                String examId = payload.substring(5);
                loginUrl += "&redirect=/packages/" + examId;
            } catch (Exception e) {
                log.warn("Invalid deep link payload: {}", payload);
            }
        }

        sendWelcomeMessage(chatId, firstName, lang, loginUrl);
    }

    private AcceptLanguage mapTelegramLanguage(String languageCode) {
        if (languageCode == null) return AcceptLanguage.UZL;
        return switch (languageCode) {
            case "ru" -> AcceptLanguage.RU;
            case "en" -> AcceptLanguage.EN;
            default -> AcceptLanguage.UZL;
        };
    }

    private void sendWelcomeMessage(long chatId, String firstName, AcceptLanguage lang, String loginUrl) {
        String greeting;
        String loginBtnText;
        String openBtnText;

        switch (lang) {
            case RU -> {
                greeting = "Привет, " + firstName + "! 👋\n\n" +
                        "🚗 Добро пожаловать в Prava Online!\n\n" +
                        "Здесь вы можете подготовиться к экзамену на водительские права.\n\n" +
                        "✅ Тесты по билетам\n" +
                        "✅ Марафон режим\n" +
                        "✅ Экзамен по пакетам\n\n" +
                        "Нажмите кнопку ниже, чтобы войти на сайт!";
                loginBtnText = "🔑 Войти на сайт";
                openBtnText = "🌐 Открыть Prava Online";
            }
            case EN -> {
                greeting = "Hello, " + firstName + "! 👋\n\n" +
                        "🚗 Welcome to Prava Online!\n\n" +
                        "Prepare for your driving license exam here.\n\n" +
                        "✅ Ticket-based tests\n" +
                        "✅ Marathon mode\n" +
                        "✅ Package exams\n\n" +
                        "Click the button below to log in!";
                loginBtnText = "🔑 Log in to website";
                openBtnText = "🌐 Open Prava Online";
            }
            case UZC -> {
                greeting = "Салом, " + firstName + "! 👋\n\n" +
                        "🚗 Prava Online га хуш келибсиз!\n\n" +
                        "Бу ерда ҳайдовчилик гувоҳномаси имтиҳонига тайёрланинг.\n\n" +
                        "✅ Билетлар бўйича тестлар\n" +
                        "✅ Марафон режими\n" +
                        "✅ Пакетли имтиҳонлар\n\n" +
                        "Сайтга кириш учун пастдаги тугмани босинг!";
                loginBtnText = "🔑 Сайтга кириш";
                openBtnText = "🌐 Prava Online га кириш";
            }
            default -> {
                greeting = "Salom, " + firstName + "! 👋\n\n" +
                        "🚗 Prava Online ga xush kelibsiz!\n\n" +
                        "Bu yerda haydovchilik guvohnomasi imtihoniga tayyorlaning.\n\n" +
                        "✅ Biletlar bo'yicha testlar\n" +
                        "✅ Marafon rejimi\n" +
                        "✅ Paketli imtihonlar\n\n" +
                        "Saytga kirish uchun pastdagi tugmani bosing!";
                loginBtnText = "🔑 Saytga kirish";
                openBtnText = "🌐 Prava Online ga kirish";
            }
        }

        Map<String, Object> inlineKeyboard = Map.of(
                "inline_keyboard", List.of(
                        List.of(Map.of(
                                "text", loginBtnText,
                                "url", loginUrl
                        )),
                        List.of(Map.of(
                                "text", openBtnText,
                                "url", baseUrl
                        ))
                )
        );

        sendMessage(chatId, greeting, inlineKeyboard);

        // Send language selection keyboard
        sendLanguageSelectionKeyboard(chatId, lang);
    }

    private void sendLanguageSelectionKeyboard(long chatId, AcceptLanguage currentLang) {
        String langPrompt = switch (currentLang) {
            case RU -> "\uD83C\uDF10 \u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u044f\u0437\u044b\u043a / Tilni tanlang:";
            case EN -> "\uD83C\uDF10 Select your language / Tilni tanlang:";
            case UZC -> "\uD83C\uDF10 \u0422\u0438\u043b\u043d\u0438 \u0442\u0430\u043d\u043b\u0430\u043d\u0433 / Tilni tanlang:";
            default -> "\uD83C\uDF10 Tilni tanlang / \u0422\u0438\u043b\u043d\u0438 \u0442\u0430\u043d\u043b\u0430\u043d\u0433:";
        };

        Map<String, Object> langKeyboard = Map.of(
                "inline_keyboard", List.of(
                        List.of(
                                Map.of("text", "O'zbekcha", "callback_data", "lang_uzl"),
                                Map.of("text", "\u040e\u0437\u0431\u0435\u043a\u0447\u0430", "callback_data", "lang_uzc")
                        ),
                        List.of(
                                Map.of("text", "\u0420\u0443\u0441\u0441\u043a\u0438\u0439", "callback_data", "lang_ru"),
                                Map.of("text", "English", "callback_data", "lang_en")
                        )
                )
        );

        sendMessage(chatId, langPrompt, langKeyboard);
    }

    private void sendMessage(long chatId, String text, Map<String, Object> replyMarkup) {
        if (botToken == null || botToken.isBlank()) return;

        Map<String, Object> body = new HashMap<>();
        body.put("chat_id", chatId);
        body.put("text", text);
        body.put("parse_mode", "HTML");
        if (replyMarkup != null) {
            body.put("reply_markup", replyMarkup);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        // Retry with exponential backoff
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                restTemplate.postForObject(getApiUrl() + "/sendMessage", request, String.class);
                return; // Success
            } catch (Exception e) {
                if (attempt == MAX_RETRIES) {
                    log.error("Failed to send Telegram message after {} attempts: {}", MAX_RETRIES, e.getMessage());
                } else {
                    log.warn("Telegram sendMessage attempt {}/{} failed, retrying...", attempt, MAX_RETRIES);
                    try {
                        Thread.sleep(attempt * 500L); // 500ms, 1s, 1.5s
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        return;
                    }
                }
            }
        }
    }
}
