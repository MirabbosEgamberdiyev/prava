package uz.pravaimtihon.service;

import jakarta.annotation.PostConstruct;
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

    @Value("${app.telegram.bot-token:}")
    private String botToken;

    @Value("${app.telegram.bot-username:pravaonlineuzbot}")
    private String botUsername;

    @Value("${app.telegram.webhook-url:}")
    private String webhookUrl;

    @Value("${app.telegram.base-url:https://pravaonline.uz}")
    private String baseUrl;

    @Value("${app.telegram.webhook-secret:}")
    private String configuredWebhookSecret;

    /** Secret token for webhook verification */
    private String webhookSecretToken;

    /** Tracks the last processed update_id to skip duplicates */
    private final AtomicLong lastProcessedUpdateId = new AtomicLong(0);

    /** Max retry attempts for Telegram API calls */
    private static final int MAX_RETRIES = 3;

    @PostConstruct
    public void initSecret() {
        if (configuredWebhookSecret != null && !configuredWebhookSecret.isBlank()) {
            webhookSecretToken = configuredWebhookSecret.trim();
        } else {
            // SECURITY: hardcoded fallback olib tashlandi. Secret bo'lmasa webhook barcha so'rovlarni rad etadi.
            webhookSecretToken = null;
            log.error("TELEGRAM_WEBHOOK_SECRET is not set — Telegram webhook will reject all updates");
            return;
        }
        log.info("Telegram webhookSecretToken initialized");
    }

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
            // Use configured secret or generate a secret token for webhook verification
            if (webhookSecretToken == null || webhookSecretToken.isBlank()) {
                if (configuredWebhookSecret != null && !configuredWebhookSecret.isBlank()) {
                    webhookSecretToken = configuredWebhookSecret.trim();
                } else {
                    webhookSecretToken = UUID.randomUUID().toString().replace("-", "");
                }
            }

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
                    Map.of("command", "start", "description", "Kirish kodi / Код входа"),
                    Map.of("command", "lang", "description", "Tilni tanlash / Выбрать язык"),
                    Map.of("command", "help", "description", "Yordam va ma'lumot / Помощь")
            );
            Map<String, Object> body = Map.of("commands", commands);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            restTemplate.postForObject(getApiUrl() + "/setMyCommands", request, String.class);
            log.info("Telegram bot commands set successfully (auth + language + help)");
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

            Map<String, Object> chat = (Map<String, Object>) message.get("chat");
            long chatId = ((Number) chat.get("id")).longValue();

            Map<String, Object> from = (Map<String, Object>) message.get("from");
            String firstName = from != null ? (String) from.get("first_name") : "";
            String lastName = from != null ? (String) from.get("last_name") : "";
            String username = from != null ? (String) from.get("username") : "";
            String languageCode = from != null ? (String) from.get("language_code") : "uz";
            long userId = from != null ? ((Number) from.get("id")).longValue() : chatId;

            // Handle contact sharing (phone number linking)
            Map<String, Object> contact = (Map<String, Object>) message.get("contact");
            if (contact != null) {
                handleContactMessage(chatId, userId, from, contact);
                return;
            }

            String text = (String) message.get("text");
            if (text == null) return;

            if (text.startsWith("/help") || text.startsWith("/yordam") || text.startsWith("/info")) {
                AcceptLanguage userLang = getUserLanguage(userId);
                sendHelpMessage(chatId, userLang);
                return;
            }

            if (text.startsWith("/lang") || text.startsWith("/language") || text.startsWith("/settings")) {
                AcceptLanguage userLang = getUserLanguage(userId);
                sendLanguageSelectionKeyboard(chatId, userLang);
                return;
            }

            // Pure authentication: /start or any text generates one-time login token
            String payload = text.startsWith("/start") && text.length() > 7 ? text.substring(7).trim() : null;
            handleStartCommand(chatId, userId, firstName, lastName, username, languageCode, payload);
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

        if ("choose_lang".equals(data)) {
            AcceptLanguage currentLang = getUserLanguage(userId);
            sendLanguageSelectionKeyboard(chatId, currentLang);
            answerCallbackQuery(callbackQueryId);
            return;
        }

        if (data.startsWith("lang_")) {
            AcceptLanguage selectedLang = switch (data) {
                case "lang_uzl" -> AcceptLanguage.UZL;
                case "lang_uzc" -> AcceptLanguage.UZC;
                case "lang_ru" -> AcceptLanguage.RU;
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
                default -> "Til tanlandi: O'zbekcha (Lotin) \u2705";
            };

            sendMessage(chatId, confirmMsg, null);
            answerCallbackQuery(callbackQueryId);

            String firstName = from.get("first_name") != null ? (String) from.get("first_name") : "";
            String lastName = from.get("last_name") != null ? (String) from.get("last_name") : "";
            String username = from.get("username") != null ? (String) from.get("username") : "";
            String token = tokenStore.generateToken(userId, firstName, lastName, username);
            String loginUrl = baseUrl + "/auth/telegram-callback?token=" + token;
            sendWelcomeMessage(chatId, selectedLang, token, loginUrl);
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

    private String sanitizeFirstName(String firstName, String fallback) {
        String name = (firstName != null && !firstName.isBlank()) ? firstName.trim() : null;
        if (name == null && fallback != null && !fallback.isBlank()) {
            name = fallback.trim();
        }
        if (name == null || name.isBlank()) {
            name = "Foydalanuvchi";
        }
        if (name.length() < 2) {
            name = name + " User";
        }
        if (name.length() > 50) {
            name = name.substring(0, 50);
        }
        return name;
    }

    private String sanitizeLastName(String lastName) {
        if (lastName == null || lastName.isBlank()) return null;
        String trimmed = lastName.trim();
        return trimmed.length() > 50 ? trimmed.substring(0, 50) : trimmed;
    }

    private String sanitizeUsername(String username) {
        if (username == null || username.isBlank()) return null;
        String trimmed = username.trim();
        return trimmed.length() > 100 ? trimmed.substring(0, 100) : trimmed;
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
            String safeFirst = sanitizeFirstName(firstName, username);
            String safeLast = sanitizeLastName(lastName);
            String safeUsername = sanitizeUsername(username);

            // Auto-register new Telegram user safely
            try {
                userRepository.save(User.builder()
                        .telegramId(tgId)
                        .telegramUsername(safeUsername)
                        .firstName(safeFirst)
                        .lastName(safeLast)
                        .oauthProvider(OAuthProvider.TELEGRAM)
                        .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                        .role(Role.USER)
                        .preferredLanguage(lang)
                        .isActive(true)
                        .build());
                log.info("Auto-registered new Telegram user: tg_id={}", telegramUserId);
            } catch (Exception e) {
                log.error("Failed to auto-register Telegram user {}: {}", telegramUserId, e.getMessage());
            }
        }

        // Generate one-time login token with user metadata
        String token = tokenStore.generateToken(telegramUserId, firstName, lastName, username);
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

        sendWelcomeMessage(chatId, lang, token, loginUrl);
    }

    private void handleContactMessage(long chatId, long userId, Map<String, Object> from, Map<String, Object> contact) {
        try {
            // SECURITY: user_id MAJBURIY. Qo'lda yaratilgan kontakt kartasida user_id bo'lmaydi —
            // uni qabul qilish istalgan telefon raqamini "tasdiqlangan" deb bog'lashga imkon berardi.
            Number contactUserIdNum = (Number) contact.get("user_id");
            if (contactUserIdNum == null || contactUserIdNum.longValue() != userId) {
                AcceptLanguage lang = getUserLanguage(userId);
                String warning = switch (lang) {
                    case RU -> "⚠️ Пожалуйста, отправьте свой собственный номер телефона через кнопку контактов.";
                    case UZC -> "⚠️ Илтимос, контакт тугмаси орқали фақат ўзингизнинг телефон рақамингизни юборинг.";
                    default -> "⚠️ Iltimos, kontakt tugmasi orqali faqat o'zingizning telefon raqamingizni yuboring.";
                };
                sendMessage(chatId, warning, null);
                return;
            }

            String rawPhone = (String) contact.get("phone_number");
            if (rawPhone == null || rawPhone.isBlank()) return;

            String clean = rawPhone.replaceAll("[^0-9]", "");
            if (clean.length() == 9) {
                clean = "998" + clean;
            } else if (clean.startsWith("8") && clean.length() == 10) {
                clean = "998" + clean.substring(1);
            }

            if (!clean.matches("^998[0-9]{9}$")) {
                log.warn("Invalid phone number format received from Telegram (len={})", clean.length());
                return;
            }

            String tgId = String.valueOf(userId);
            AcceptLanguage lang = getUserLanguage(userId);

            Optional<User> byPhone = userRepository.findByPhoneNumberAndDeletedFalse(clean);
            if (byPhone.isPresent()) {
                User existing = byPhone.get();
                // SECURITY: xodim akkauntlari bot orqali hech qachon bog'lanmaydi, va boshqa
                // Telegram akkauntiga bog'langan foydalanuvchi jimgina qayta bog'lanmaydi.
                boolean staff = existing.getRole() != Role.USER;
                boolean linkedElsewhere = existing.getTelegramId() != null
                        && !existing.getTelegramId().isBlank()
                        && !existing.getTelegramId().equals(tgId);
                if (staff || linkedElsewhere) {
                    log.warn("Refused Telegram link for user {} (staff={}, linkedElsewhere={})",
                            existing.getId(), staff, linkedElsewhere);
                    String refuse = switch (lang) {
                        case RU -> "⚠️ Этот номер уже привязан к другому аккаунту. Обратитесь в поддержку.";
                        case UZC -> "⚠️ Бу рақам бошқа аккаунтга уланган. Қўллаб-қувватлаш хизматига мурожаат қилинг.";
                        default -> "⚠️ Bu raqam boshqa akkauntga ulangan. Qo'llab-quvvatlash xizmatiga murojaat qiling.";
                    };
                    sendMessage(chatId, refuse, null);
                    return;
                }
                existing.setTelegramId(tgId);
                if (from != null && from.get("username") != null) {
                    existing.setTelegramUsername((String) from.get("username"));
                }
                existing.setIsPhoneVerified(true);
                userRepository.save(existing);
                log.info("Linked existing phone user {} to Telegram ID {}", existing.getId(), tgId);
            } else {
                Optional<User> byTg = userRepository.findByTelegramIdAndDeletedFalse(tgId);
                if (byTg.isPresent()) {
                    User tgUser = byTg.get();
                    tgUser.setPhoneNumber(clean);
                    tgUser.setIsPhoneVerified(true);
                    userRepository.save(tgUser);
                    log.info("Updated Telegram user {} with a verified phone number", tgId);
                } else {
                    String firstName = from != null ? (String) from.get("first_name") : "User";
                    String lastName = from != null ? (String) from.get("last_name") : null;
                    String username = from != null ? (String) from.get("username") : null;
                    userRepository.save(User.builder()
                            .telegramId(tgId)
                            .telegramUsername(username)
                            .phoneNumber(clean)
                            .isPhoneVerified(true)
                            .firstName(sanitizeFirstName(firstName, username))
                            .lastName(sanitizeLastName(lastName))
                            .oauthProvider(OAuthProvider.TELEGRAM)
                            .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                            .role(Role.USER)
                            .preferredLanguage(lang)
                            .isActive(true)
                            .build());
                    log.info("Registered new user via Telegram contact, Telegram ID {}", tgId);
                }
            }

            String formattedPhone = "+" + clean.substring(0, 3) + " " + clean.substring(3, 5) + " " +
                    clean.substring(5, 8) + " " + clean.substring(8, 10) + " " + clean.substring(10, 12);

            String successMsg = switch (lang) {
                case RU -> String.format("✅ Телефон номер <b>%s</b> успешно привязан к вашему аккаунту Prava Online!", formattedPhone);
                case UZC -> String.format("✅ <b>%s</b> телефон рақами Prava Online аккаунтингизга муваффақиятли уланди!", formattedPhone);
                default -> String.format("✅ <b>%s</b> telefon raqami Prava Online akkauntingizga muvaffaqiyatli ulandi!", formattedPhone);
            };

            sendMessage(chatId, successMsg, null);
        } catch (Exception e) {
            log.error("Failed to handle contact message from Telegram user {}: {}", userId, e.getMessage(), e);
        }
    }

    private void sendHelpMessage(long chatId, AcceptLanguage lang) {
        String message = switch (lang) {
            case RU -> """
                    🚗 <b>Prava Online — Официальный бот платформы</b>

                    Этот бот предназначен для быстрой и безопасной авторизации в приложениях Prava Online (Web, Desktop, Mobile).

                    <b>Доступные команды:</b>
                    /start — Получить 5-значный код для входа
                    /lang — Сменить язык интерфейса (O'zbek / Ўзбекча / Русский)
                    /help — Справка и контакты поддержки

                    <b>Как войти:</b>
                    1. Нажмите /start и получите код.
                    2. Введите полученный 5-значный код в приложении Prava Online или нажмите кнопку «Войти на сайт».

                    <b>Служба поддержки:</b>
                    📞 Телефон: +998 99 391 25 05
                    💬 Telegram: @pravaonlineuz
                    🌐 Сайт: https://pravaonline.uz
                    """;
            case UZC -> """
                    🚗 <b>Prava Online — Платформанинг расмий боти</b>

                    Ушбу бот Prava Online иловаларига (Web, Desktop, Mobile) тезкор ва хавфсиз кириш учун мўлжалланган.

                    <b>Мавжуд буйруқлар:</b>
                    /start — Кириш учун 5 хонали тасдиқлаш кодини олиш
                    /lang — Тилни ўзгартириш (O'zbek / Ўзбекча / Русский)
                    /help — Ёрдам ва маълумот

                    <b>Қандай кирилади:</b>
                    1. /start буйруғини босинг ва кодни олинг.
                    2. Кодни Prava Online иловасига киритинг ёки «Сайтга кириш» тугмасини босинг.

                    <b>Қўллаб-қувватлаш хизмати:</b>
                    📞 Телефон: +998 99 391 25 05
                    💬 Telegram: @pravaonlineuz
                    🌐 Сайт: https://pravaonline.uz
                    """;
            default -> """
                    🚗 <b>Prava Online — Platformaning rasmiy boti</b>

                    Ushbu bot Prava Online ilovalariga (Web, Desktop, Mobile) tezkor va xavfsiz kirish uchun mo'ljallangan.

                    <b>Mavjud buyruqlar:</b>
                    /start — Kirish uchun 5 xonali tasdiqlash kodini olish
                    /lang — Tilni o'zgartirish (O'zbek / Ўзбекcha / Русский)
                    /help — Yordam va ma'lumot

                    <b>Qanday kiriladi:</b>
                    1. /start buyrug'ini bosing va kodni oling.
                    2. Kodni Prava Online ilovasiga kiriting yoki «Saytga kirish» tugmasini bosing.

                    <b>Qo'llab-quvvatlash xizmati:</b>
                    📞 Telefon: +998 99 391 25 05
                    💬 Telegram: @pravaonlineuz
                    🌐 Sayt: https://pravaonline.uz
                    """;
        };

        Map<String, Object> replyMarkup = Map.of(
                "inline_keyboard", List.of(
                        List.of(
                                Map.of("text", "🌐 Saytga o'tish / Перейти на сайт", "url", baseUrl),
                                Map.of("text", "📞 Aloqa / Поддержка", "url", "https://t.me/pravaonlineuz")
                        )
                )
        );

        sendMessage(chatId, message.trim(), replyMarkup);
    }

    private AcceptLanguage mapTelegramLanguage(String languageCode) {
        if (languageCode == null) return AcceptLanguage.UZL;
        return switch (languageCode) {
            case "ru" -> AcceptLanguage.RU;
            case "uzc" -> AcceptLanguage.UZC;
            default -> AcceptLanguage.UZL;
        };
    }

    private void sendWelcomeMessage(long chatId, AcceptLanguage lang, String token, String loginUrl) {
        String message;
        String enterSiteText;
        String changeLangText;

        switch (lang) {
            case RU -> {
                message = "🔐 <b>Prava Online</b>\n\n" +
                        "Ваш код подтверждения:\n\n" +
                        "<code>" + token + "</code>\n\n" +
                        "Введите этот код в приложение Prava Online (нажмите на код для копирования).\n\n" +
                        "⚠️ Не передавайте код третьим лицам.";
                enterSiteText = "🚀 Войти на сайт (В один клик)";
                changeLangText = "🌐 Сменить язык";
            }
            case UZC -> {
                message = "🔐 <b>Prava Online</b>\n\n" +
                        "Тасдиқлаш кодингиз:\n\n" +
                        "<code>" + token + "</code>\n\n" +
                        "Ушбу кодни Prava Online иловасига киритинг (нусха олиш учун код устига босинг).\n\n" +
                        "⚠️ Кодни бошқа одамларга берманг.";
                enterSiteText = "🚀 Сайтга кириш (Бир босишда)";
                changeLangText = "🌐 Тилни ўзгартириш";
            }
            default -> {
                message = "🔐 <b>Prava Online</b>\n\n" +
                        "Tasdiqlash kodingiz:\n\n" +
                        "<code>" + token + "</code>\n\n" +
                        "Ushbu kodni Prava Online ilovasiga kiriting (nusxa olish uchun kod ustiga bosing).\n\n" +
                        "⚠️ Kodni boshqa odamlarga bermang.";
                enterSiteText = "🚀 Saytga kirish (Bir bosishda)";
                changeLangText = "🌐 Tilni o'zgartirish";
            }
        }

        List<List<Map<String, Object>>> keyboardRows = new ArrayList<>();
        if (loginUrl != null && !loginUrl.isBlank()) {
            keyboardRows.add(List.of(Map.of("text", enterSiteText, "url", loginUrl)));
        }
        keyboardRows.add(List.of(Map.of("text", changeLangText, "callback_data", "choose_lang")));

        Map<String, Object> replyMarkup = Map.of("inline_keyboard", keyboardRows);
        sendMessage(chatId, message, replyMarkup);
    }

    private void sendLanguageSelectionKeyboard(long chatId, AcceptLanguage currentLang) {
        String langPrompt = switch (currentLang) {
            case RU -> "🌐 Выберите язык:";
            case UZC -> "🌐 Тилни танланг:";
            default -> "🌐 Tilni tanlang:";
        };

        Map<String, Object> langKeyboard = Map.of(
                "inline_keyboard", List.of(
                        List.of(
                                Map.of("text", "O'zbekcha (Lotin)" + (currentLang == AcceptLanguage.UZL ? " ✅" : ""), "callback_data", "lang_uzl"),
                                Map.of("text", "\u040e\u0437\u0431\u0435\u043a\u0447\u0430 (\u041a\u0438\u0440\u0438\u043b\u043b)" + (currentLang == AcceptLanguage.UZC ? " ✅" : ""), "callback_data", "lang_uzc")
                        ),
                        List.of(
                                Map.of("text", "\u0420\u0443\u0441\u0441\u043a\u0438\u0439" + (currentLang == AcceptLanguage.RU ? " ✅" : ""), "callback_data", "lang_ru")
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
