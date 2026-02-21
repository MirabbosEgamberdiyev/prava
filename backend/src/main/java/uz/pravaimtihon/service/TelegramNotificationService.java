package uz.pravaimtihon.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import uz.pravaimtihon.entity.ExamSession;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.enums.AcceptLanguage;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Sends Telegram notifications to users who registered via Telegram.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class TelegramNotificationService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.telegram.bot-token:}")
    private String botToken;

    @Value("${app.telegram.base-url:https://pravaonline.uz}")
    private String baseUrl;

    private static final int MAX_RETRIES = 3;

    private String getApiUrl() {
        return "https://api.telegram.org/bot" + botToken;
    }

    /**
     * Send exam result notification after exam completion.
     */
    @Async
    public void sendExamResultNotification(User user, ExamSession session) {
        if (botToken == null || botToken.isBlank()) return;
        if (user.getTelegramId() == null || user.getTelegramId().isBlank()) return;

        try {
            long chatId = Long.parseLong(user.getTelegramId());
            AcceptLanguage lang = user.getPreferredLanguage() != null
                    ? user.getPreferredLanguage() : AcceptLanguage.UZL;

            String emoji = Boolean.TRUE.equals(session.getIsPassed()) ? "✅" : "❌";
            String text = switch (lang) {
                case RU -> String.format("""
                        %s <b>Результат экзамена</b>

                        📝 Правильных: %d / %d
                        🎯 Процент: %.1f%%
                        %s

                        Продолжайте практиковаться на pravaonline.uz!
                        """,
                        emoji, session.getCorrectCount(), session.getTotalQuestions(),
                        session.getPercentage(),
                        Boolean.TRUE.equals(session.getIsPassed()) ? "🎉 Сдано!" : "📚 Попробуйте ещё раз");
                case EN -> String.format("""
                        %s <b>Exam Result</b>

                        📝 Correct: %d / %d
                        🎯 Score: %.1f%%
                        %s

                        Keep practicing at pravaonline.uz!
                        """,
                        emoji, session.getCorrectCount(), session.getTotalQuestions(),
                        session.getPercentage(),
                        Boolean.TRUE.equals(session.getIsPassed()) ? "🎉 Passed!" : "📚 Try again");
                case UZC -> String.format("""
                        %s <b>Имтиҳон натижаси</b>

                        📝 Тўғри: %d / %d
                        🎯 Фоиз: %.1f%%
                        %s

                        pravaonline.uz да машқ қилишни давом эттиринг!
                        """,
                        emoji, session.getCorrectCount(), session.getTotalQuestions(),
                        session.getPercentage(),
                        Boolean.TRUE.equals(session.getIsPassed()) ? "🎉 Ўтдингиз!" : "📚 Қайта уриниб кўринг");
                default -> String.format("""
                        %s <b>Imtihon natijasi</b>

                        📝 To'g'ri: %d / %d
                        🎯 Foiz: %.1f%%
                        %s

                        pravaonline.uz da mashq qilishni davom ettiring!
                        """,
                        emoji, session.getCorrectCount(), session.getTotalQuestions(),
                        session.getPercentage(),
                        Boolean.TRUE.equals(session.getIsPassed()) ? "🎉 O'tdingiz!" : "📚 Qayta urinib ko'ring");
            };

            // Add "View result" button
            String resultUrl = baseUrl + "/exam/result/" + session.getId();
            String btnText = switch (lang) {
                case RU -> "📋 Посмотреть результат";
                case EN -> "📋 View Result";
                case UZC -> "📋 Натижани кўриш";
                default -> "📋 Natijani ko'rish";
            };

            Map<String, Object> keyboard = Map.of(
                    "inline_keyboard", List.of(
                            List.of(Map.of("text", btnText, "url", resultUrl))
                    )
            );

            sendMessage(chatId, text.trim(), keyboard);
            log.info("Sent exam result notification to Telegram user: {}", user.getTelegramId());
        } catch (Exception e) {
            log.warn("Failed to send Telegram notification: {}", e.getMessage());
        }
    }

    /**
     * Send streak milestone notification.
     */
    @Async
    public void sendStreakMilestoneNotification(User user, int streakDays) {
        if (botToken == null || botToken.isBlank()) return;
        if (user.getTelegramId() == null || user.getTelegramId().isBlank()) return;

        try {
            long chatId = Long.parseLong(user.getTelegramId());
            AcceptLanguage lang = user.getPreferredLanguage() != null
                    ? user.getPreferredLanguage() : AcceptLanguage.UZL;

            String text = switch (lang) {
                case RU -> String.format("🔥 Поздравляем! Серия из %d подряд сданных экзаменов! Так держать!", streakDays);
                case EN -> String.format("🔥 Congratulations! %d exam pass streak! Keep going!", streakDays);
                case UZC -> String.format("🔥 Табриклаймиз! Кетма-кет %d та имтиҳон топширдингиз! Давом этинг!", streakDays);
                default -> String.format("🔥 Tabriklaymiz! Ketma-ket %d ta imtihon topshirdingiz! Davom eting!", streakDays);
            };

            sendMessage(chatId, text, null);
            log.info("Sent streak milestone notification to Telegram user: {}", user.getTelegramId());
        } catch (Exception e) {
            log.warn("Failed to send streak notification: {}", e.getMessage());
        }
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

        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                restTemplate.postForObject(getApiUrl() + "/sendMessage", request, String.class);
                return;
            } catch (Exception e) {
                if (attempt == MAX_RETRIES) {
                    log.error("Failed to send Telegram message to {} after {} attempts: {}", chatId, MAX_RETRIES, e.getMessage());
                } else {
                    log.warn("Telegram notification attempt {}/{} failed, retrying...", attempt, MAX_RETRIES);
                    try {
                        Thread.sleep(attempt * 500L);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        return;
                    }
                }
            }
        }
    }
}
