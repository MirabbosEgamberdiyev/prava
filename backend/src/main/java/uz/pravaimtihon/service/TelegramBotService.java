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
    private final TelegramAuthSessionStore authSessionStore;
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

    /** Texnik yordam akkaunti (t.me/<username>); kanal alohida — {@link #newsChannel}. */
    @Value("${app.telegram.support-username:pravaonline_support}")
    private String supportUsername;

    @Value("${app.telegram.news-channel:pravaonlineuz}")
    private String newsChannel;

    @Value("${app.telegram.web-app-url:https://web.pravaonline.uz}")
    private String webAppUrl;

    @Value("${app.telegram.android-download-url:https://pravaonline.uz/downloads}")
    private String androidDownloadUrl;

    /** @BotFather /setdescription — /start dan oldin bo'sh chatda ko'rinadi. */
    static final Map<String, String> BOT_DESCRIPTION = Map.of(
            "uz", "PRAVA ONLINE — Haydovchilik guvohnomasi imtihonlariga tayyorlanish bo‘yicha rasmiy bot.",
            "ru", "PRAVA ONLINE — официальный бот для подготовки к экзаменам на водительское удостоверение."
    );

    /** @BotFather /setabouttext — bot profilidagi qisqa matn. */
    static final Map<String, String> BOT_ABOUT = Map.of(
            "uz", "Avtomaktab testlari, biletlar, avtodrom simulyatori va 1v1 Oktagon bellashuvlari.",
            "ru", "Тесты автошколы, билеты, симулятор автодрома и дуэли 1 на 1 в Октагоне."
    );

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
        setupBotProfile();
    }

    /**
     * @BotFather parametrlari API orqali: tavsif (/setdescription), qisqa ma'lumot (/setabouttext) va
     * menyu tugmasi (/setmenubutton → Web App). Har ishga tushishda bir xil qiymat yoziladi (idempotent).
     */
    void setupBotProfile() {
        BOT_DESCRIPTION.forEach((lang, text) ->
                callBotApi("setMyDescription", localized(Map.of("description", text), lang)));
        BOT_ABOUT.forEach((lang, text) ->
                callBotApi("setMyShortDescription", localized(Map.of("short_description", text), lang)));
        callBotApi("setChatMenuButton", Map.of("menu_button", Map.of(
                "type", "web_app",
                "text", "Prava Online",
                "web_app", Map.of("url", baseUrl))));
    }

    /** "uz" — standart (til ko'rsatilmagan) qiymat; boshqalari language_code bilan. */
    private static Map<String, Object> localized(Map<String, Object> body, String lang) {
        Map<String, Object> copy = new HashMap<>(body);
        if (!"uz".equals(lang)) copy.put("language_code", lang);
        return copy;
    }

    private void callBotApi(String method, Map<String, Object> body) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            restTemplate.postForObject(getApiUrl() + "/" + method, new HttpEntity<>(body, headers), String.class);
        } catch (Exception e) {
            log.warn("Telegram {} failed: {}", method, e.getMessage());
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

        if (data.startsWith(SESSION_APPROVE_PREFIX) || data.startsWith(SESSION_REJECT_PREFIX)) {
            handleSessionDecision(chatId, callbackQueryId, from, data);
            return;
        }

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
            sendWelcomeMessage(chatId, selectedLang, firstName, token, loginUrl);
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

        // Ilovadan boshlangan "bir bosishda kirish" sessiyasi: kod yubormaymiz, aniq tasdiq so'raymiz
        if (payload != null && payload.startsWith("auth_")) {
            sendSessionConfirmation(chatId, lang, payload);
            return;
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

        sendWelcomeMessage(chatId, lang, firstName, token, loginUrl);
    }


    // ─────────────────────────────────────────────────────────────────────
    // Telegram session login (deep link + explicit confirmation)
    // ─────────────────────────────────────────────────────────────────────

    static final String SESSION_APPROVE_PREFIX = "tga:";
    static final String SESSION_REJECT_PREFIX = "tgr:";

    private static String platformLabel(String platform, AcceptLanguage lang) {
        String p = platform == null ? "web" : platform;
        return switch (p) {
            case "desktop" -> lang == AcceptLanguage.RU ? "Windows-приложение" : (lang == AcceptLanguage.UZC ? "Windows илова" : "Windows ilova");
            case "android", "ios", "mobile" -> lang == AcceptLanguage.RU ? "Мобильное приложение" : (lang == AcceptLanguage.UZC ? "Мобил илова" : "Mobil ilova");
            default -> lang == AcceptLanguage.RU ? "Веб-браузер" : (lang == AcceptLanguage.UZC ? "Веб-браузер" : "Veb-brauzer");
        };
    }

    /**
     * /start auth_<token>: so'rov qaysi qurilmadan kelganini ko'rsatib, "Tasdiqlash"/"Rad etish" tugmalarini yuboradi.
     * Avtomatik tasdiqlash YO'Q — aks holda begona odam yaratgan havolani bosgan foydalanuvchi o'z akkauntini
     * o'sha odamga topshirib qo'yardi (login phishing).
     */
    void sendSessionConfirmation(long chatId, AcceptLanguage lang, String sessionToken) {
        Optional<TelegramAuthSessionStore.DeviceInfo> info = authSessionStore.pendingDeviceInfo(sessionToken);
        if (info.isEmpty()) {
            String expired = switch (lang) {
                case RU -> "⌛ Ссылка для входа устарела. Нажмите «Войти через Telegram» в приложении ещё раз.";
                case UZC -> "⌛ Кириш ҳаволаси эскирган. Иловада «Telegram орқали кириш» тугмасини қайта босинг.";
                default -> "⌛ Kirish havolasi eskirgan. Ilovada «Telegram orqali kirish» tugmasini qayta bosing.";
            };
            sendMessage(chatId, expired, null);
            return;
        }
        TelegramAuthSessionStore.DeviceInfo d = info.get();
        // parse_mode=HTML: klient yuborgan qurilma nomi teg/havola sifatida talqin qilinmasin
        String device = platformLabel(d.platform(), lang) + (d.deviceName() != null ? " · " + htmlEscape(d.deviceName()) : "");
        String text = switch (lang) {
            case RU -> "🔐 Запрос на вход в Prava Online\n\nУстройство: " + device
                    + "\n\nЕсли это вы — нажмите «Подтвердить». Если вы не начинали вход, нажмите «Отклонить».";
            case UZC -> "🔐 Prava Online'га кириш сўрови\n\nҚурилма: " + device
                    + "\n\nАгар бу сиз бўлсангиз — «Тасдиқлаш»ни босинг. Кириш сўровини сиз юбормаган бўлсангиз, «Рад этиш»ни босинг.";
            default -> "🔐 Prava Online'ga kirish so'rovi\n\nQurilma: " + device
                    + "\n\nAgar bu siz bo'lsangiz — «Tasdiqlash»ni bosing. Kirishni siz boshlamagan bo'lsangiz, «Rad etish»ni bosing.";
        };
        String approve = lang == AcceptLanguage.RU ? "✅ Подтвердить" : (lang == AcceptLanguage.UZC ? "✅ Тасдиқлаш" : "✅ Tasdiqlash");
        String reject = lang == AcceptLanguage.RU ? "❌ Отклонить" : (lang == AcceptLanguage.UZC ? "❌ Рад этиш" : "❌ Rad etish");
        Map<String, Object> markup = Map.of("inline_keyboard", List.of(List.of(
                Map.of("text", approve, "callback_data", SESSION_APPROVE_PREFIX + sessionToken),
                Map.of("text", reject, "callback_data", SESSION_REJECT_PREFIX + sessionToken)
        )));
        sendMessage(chatId, text, markup);
    }

    static String htmlEscape(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    void handleSessionDecision(long chatId, String callbackQueryId, Map<String, Object> from, String data) {
        answerCallbackQuery(callbackQueryId);
        long telegramUserId = ((Number) from.get("id")).longValue();
        AcceptLanguage lang = getUserLanguage(telegramUserId);
        String sessionToken = data.substring(4);

        if (data.startsWith(SESSION_REJECT_PREFIX)) {
            authSessionStore.reject(sessionToken);
            sendMessage(chatId, switch (lang) {
                case RU -> "Вход отклонён. Никто не получил доступ к вашему аккаунту.";
                case UZC -> "Кириш рад этилди. Ҳеч ким аккаунтингизга кира олмади.";
                default -> "Kirish rad etildi. Hech kim akkauntingizga kira olmadi.";
            }, null);
            return;
        }

        String tgId = String.valueOf(telegramUserId);
        Optional<User> user = userRepository.findByTelegramIdAndDeletedFalse(tgId);
        if (user.isEmpty()) {
            String firstName = from.get("first_name") instanceof String f ? f : "";
            String lastName = from.get("last_name") instanceof String l ? l : "";
            String rawUsername = from.get("username") instanceof String u ? u : null;
            String safeFirst = sanitizeFirstName(firstName, rawUsername);
            String safeLast = sanitizeLastName(lastName);
            String safeUsername = sanitizeUsername(rawUsername);
            try {
                User newUser = userRepository.save(User.builder()
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
                user = Optional.of(newUser);
                log.info("Auto-registered new Telegram user during session approval: tg_id={}", telegramUserId);
            } catch (Exception e) {
                log.error("Failed to auto-register Telegram user during approval {}: {}", telegramUserId, e.getMessage());
            }
        }
        if (user.isEmpty() || !Boolean.TRUE.equals(user.get().getIsActive())) {
            sendMessage(chatId, lang == AcceptLanguage.RU ? "❌ Аккаунт недоступен." : "❌ Akkaunt faol emas.", null);
            return;
        }
        String username = from.get("username") instanceof String u ? u : null;
        boolean ok = authSessionStore.approve(sessionToken, telegramUserId, username, user.get().getId(),
                user.get().getPreferredLanguage());
        String reply = ok
                ? switch (lang) {
                    case RU -> "✅ Вход подтверждён. Вернитесь в приложение — вход выполнится автоматически.";
                    case UZC -> "✅ Кириш тасдиқланди. Иловага қайтинг — тизимга автоматик кирасиз.";
                    default -> "✅ Kirish tasdiqlandi. Ilovaga qayting — tizimga avtomatik kirasiz.";
                }
                : switch (lang) {
                    case RU -> "⌛ Запрос устарел или уже использован. Начните вход заново в приложении.";
                    case UZC -> "⌛ Сўров эскирган ёки ишлатилган. Иловада қайта кириб кўринг.";
                    default -> "⌛ So'rov eskirgan yoki allaqachon ishlatilgan. Ilovada qaytadan urinib ko'ring.";
                };
        sendMessage(chatId, reply, null);
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
                    💬 Telegram: @{support}
                    📣 {channelLabel}: @{channel}
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
                    💬 Telegram: @{support}
                    📣 {channelLabel}: @{channel}
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
                    💬 Telegram: @{support}
                    📣 {channelLabel}: @{channel}
                    🌐 Sayt: https://pravaonline.uz
                    """;
        };

        String channelLabel = switch (lang) {
            case RU -> "Канал";
            case UZC -> "Канал";
            default -> "Kanal";
        };
        message = message.replace("{support}", supportUsername)
                .replace("{channel}", newsChannel)
                .replace("{channelLabel}", channelLabel);

        Map<String, Object> replyMarkup = Map.of(
                "inline_keyboard", List.of(
                        List.of(
                                Map.of("text", "🌐 Saytga o'tish / Перейти на сайт", "url", baseUrl),
                                Map.of("text", "💬 Yordam / Поддержка", "url", "https://t.me/" + supportUsername)
                        ),
                        List.of(
                                Map.of("text", "📣 Kanal / Канал", "url", "https://t.me/" + newsChannel)
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

    /**
     * /start javobi: ism bilan salomlashish, bir martalik kirish kodi va tugmalar — bir bosishda kirish,
     * Android ilova, veb talqin, texnik yordam va til. Matn tanlangan tilda (Lotin, Kirill, Rus).
     */
    void sendWelcomeMessage(long chatId, AcceptLanguage lang, String firstName, String token, String loginUrl) {
        WelcomeMessage welcome = buildWelcome(lang, firstName, token, loginUrl);
        sendMessage(chatId, welcome.text(), welcome.markup());
    }

    record WelcomeMessage(String text, Map<String, Object> markup) {
    }

    WelcomeMessage buildWelcome(AcceptLanguage lang, String firstName, String token, String loginUrl) {
        String name = htmlEscape(sanitizeFirstName(firstName, null));
        String code = htmlEscape(token);
        String message;
        String enterSiteText;
        String androidText;
        String webText;
        String supportText;
        String changeLangText;

        switch (lang) {
            case RU -> {
                message = "👋 Здравствуйте, <b>" + name + "</b>!\n\n" +
                        "🚗 <b>PRAVA ONLINE</b> — подготовка к экзамену на водительские права: билеты, " +
                        "реальный экзамен, марафон, симулятор автодрома и дуэли 1 на 1 в Октагоне.\n\n" +
                        "🔐 Ваш код для входа:\n\n" +
                        "<code>" + code + "</code>\n\n" +
                        "Введите код в приложении Prava Online (нажмите на код, чтобы скопировать) " +
                        "или войдите в один клик кнопкой ниже.\n\n" +
                        "⚠️ Никому не передавайте этот код.";
                enterSiteText = "🚀 Войти в приложение";
                androidText = "📱 Android-приложение";
                webText = "🌐 Веб-версия";
                supportText = "💬 Техподдержка";
                changeLangText = "🌐 Сменить язык";
            }
            case UZC -> {
                message = "👋 Ассалому алайкум, <b>" + name + "</b>!\n\n" +
                        "🚗 <b>PRAVA ONLINE</b> — ҳайдовчилик гувоҳномаси имтиҳонига тайёргарлик: билетлар, " +
                        "реал имтиҳон, марафон, автодром симулятори ва Октагон 1v1 беллашувлари.\n\n" +
                        "🔐 Кириш кодингиз:\n\n" +
                        "<code>" + code + "</code>\n\n" +
                        "Кодни Prava Online иловасига киритинг (нусха олиш учун код устига босинг) " +
                        "ёки пастдаги тугма орқали бир босишда киринг.\n\n" +
                        "⚠️ Кодни ҳеч кимга берманг.";
                enterSiteText = "🚀 Иловага кириш";
                androidText = "📱 Android илова";
                webText = "🌐 Веб талқин";
                supportText = "💬 Техник ёрдам";
                changeLangText = "🌐 Тилни ўзгартириш";
            }
            default -> {
                message = "👋 Assalomu alaykum, <b>" + name + "</b>!\n\n" +
                        "🚗 <b>PRAVA ONLINE</b> — haydovchilik guvohnomasi imtihoniga tayyorgarlik: biletlar, " +
                        "real imtihon, marafon, avtodrom simulyatori va Oktagon 1v1 bellashuvlari.\n\n" +
                        "🔐 Kirish kodingiz:\n\n" +
                        "<code>" + code + "</code>\n\n" +
                        "Kodni Prava Online ilovasiga kiriting (nusxa olish uchun kod ustiga bosing) " +
                        "yoki pastdagi tugma orqali bir bosishda kiring.\n\n" +
                        "⚠️ Kodni hech kimga bermang.";
                enterSiteText = "🚀 Ilovaga kirish";
                androidText = "📱 Android ilova";
                webText = "🌐 Veb talqin";
                supportText = "💬 Texnik yordam";
                changeLangText = "🌐 Tilni o'zgartirish";
            }
        }

        List<List<Map<String, Object>>> keyboardRows = new ArrayList<>();
        if (loginUrl != null && !loginUrl.isBlank()) {
            keyboardRows.add(List.of(Map.of("text", enterSiteText, "url", loginUrl)));
        }
        keyboardRows.add(List.of(
                Map.of("text", androidText, "url", androidDownloadUrl),
                Map.of("text", webText, "url", webAppUrl)));
        keyboardRows.add(List.of(
                Map.of("text", supportText, "url", "https://t.me/" + supportUsername),
                Map.of("text", changeLangText, "callback_data", "choose_lang")));

        return new WelcomeMessage(message, Map.of("inline_keyboard", keyboardRows));
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
