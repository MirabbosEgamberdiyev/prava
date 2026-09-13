package uz.pravaimtihon.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import uz.pravaimtihon.dto.request.ContactInquiryRequest;
import uz.pravaimtihon.dto.response.ContactInquiryResponse;
import uz.pravaimtihon.entity.ContactInquiry;
import uz.pravaimtihon.enums.InquiryDeliveryStatus;
import uz.pravaimtihon.repository.ContactInquiryRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Service
@Slf4j
@RequiredArgsConstructor
public class ContactInquiryService {

    private final ContactInquiryRepository inquiryRepository;
    private final JavaMailSender mailSender;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.contact.admin-email:${ADMIN_NOTIFICATION_EMAIL:mirabbosegamberdiyev3@gmail.com,info@pravaonline.uz}}")
    private String adminEmail;

    @Value("${app.contact.from-email:${MAIL_FROM:${spring.mail.username:info@pravaonline.uz}}}")
    private String fromEmail;

    @Value("${app.email.from-name:Prava Online}")
    private String fromName;

    @Value("${app.email.enabled:true}")
    private boolean emailEnabled;

    @Value("${app.telegram.bot-token:}")
    private String botToken;

    @Value("${app.telegram.admin-chat-id:}")
    private String adminChatId;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Transactional
    public ContactInquiryResponse processInquiry(ContactInquiryRequest request, String clientIp) {
        LocalDateTime now = LocalDateTime.now();
        String formattedDate = now.format(FORMATTER);
        String ticketId = "CORP-" + (10000 + ThreadLocalRandom.current().nextInt(90000));

        String telegramUser = request.getTelegram() != null && !request.getTelegram().isBlank()
                ? (request.getTelegram().trim().startsWith("@") ? request.getTelegram().trim() : "@" + request.getTelegram().trim())
                : "Ko‘rsatilmagan";

        String comment = request.getComment() != null && !request.getComment().isBlank()
                ? request.getComment().trim()
                : "Ko‘rsatilmagan";

        String region = request.getRegion() != null && !request.getRegion().isBlank()
                ? request.getRegion().trim()
                : "Ko‘rsatilmagan";

        String computerCount = request.getComputerCount() != null && !request.getComputerCount().isBlank()
                ? request.getComputerCount().trim()
                : "Ko‘rsatilmagan";

        String orgType = request.getOrganizationType() != null && !request.getOrganizationType().isBlank()
                ? request.getOrganizationType().trim()
                : "Ko‘rsatilmagan";

        String safeIp = (clientIp != null && !clientIp.isBlank()) ? clientIp.trim() : "unknown";

        // 1. Audit Log: Create & persist entity in PostgreSQL database (Zero Data Loss guarantee)
        ContactInquiry inquiry = ContactInquiry.builder()
                .ticketId(ticketId)
                .organization(request.getOrganization().trim())
                .fullName(request.getFullName().trim())
                .phone(request.getPhone().trim())
                .telegram(telegramUser)
                .region(region)
                .organizationType(orgType)
                .computerCount(computerCount)
                .comment(comment)
                .clientIp(safeIp)
                .deliveryStatus(InquiryDeliveryStatus.CHANNELS_FAILED)
                .telegramDelivered(false)
                .emailDelivered(false)
                .build();

        try {
            inquiry = inquiryRepository.save(inquiry);
        } catch (Exception e) {
            log.error("[AUDIT DB ERROR] Failed to save inquiry to database: {}", e.getMessage(), e);
        }

        // Server Audit Log
        log.info("[AUDIT LOG - INQUIRY CREATED] requestId={} | dateTime={} | organization={} | fullName={} | phone={} | telegram={} | region={} | orgType={} | computerCount={} | ip={}",
                ticketId, formattedDate, request.getOrganization().trim(), request.getFullName().trim(),
                request.getPhone().trim(), telegramUser, region, orgType,
                computerCount, safeIp);

        List<String> deliveryErrors = new ArrayList<>();

        // 2. Telegram Delivery (Instant & reliable)
        boolean telegramSent = false;
        try {
            telegramSent = deliverTelegramNotification(ticketId, request, telegramUser, comment, safeIp, formattedDate);
        } catch (Exception e) {
            String errorMsg = "Telegram delivery failed: " + e.getMessage();
            log.error("[TELEGRAM CHANNEL ERROR] requestId={}: {}", ticketId, errorMsg);
            deliveryErrors.add(errorMsg);
        }

        // 3. Email Delivery (HTML template to admin inbox)
        boolean emailSent = false;
        try {
            emailSent = deliverHtmlEmail(ticketId, request, telegramUser, comment, safeIp, formattedDate);
        } catch (Exception e) {
            String errorMsg = "Email delivery failed: " + e.getMessage();
            log.error("[EMAIL CHANNEL ERROR] requestId={}: {}", ticketId, errorMsg);
            deliveryErrors.add(errorMsg);
        }

        // 4. Delivery Status Evaluation
        InquiryDeliveryStatus status = (emailSent || telegramSent) ? InquiryDeliveryStatus.FULL_DELIVERY : InquiryDeliveryStatus.CHANNELS_FAILED;

        // Update database audit record
        try {
            inquiry.setTelegramDelivered(telegramSent);
            inquiry.setEmailDelivered(emailSent);
            inquiry.setDeliveryStatus(status);
            if (!deliveryErrors.isEmpty()) {
                inquiry.setErrorMessage(String.join(" | ", deliveryErrors));
            }
            inquiryRepository.save(inquiry);
        } catch (Exception e) {
            log.error("[AUDIT DB ERROR] Failed to update delivery status: {}", e.getMessage());
        }

        log.info("[AUDIT LOG - INQUIRY PROCESSED] requestId={} | status={} | emailSent={} | telegramSent={}",
                ticketId, status, emailSent, telegramSent);

        String userFeedback = "Mutaxassisimiz murojaatingizni qabul qildi. Tez orada siz bilan bog‘lanamiz.";

        return ContactInquiryResponse.builder()
                .ticketId(ticketId)
                .delivered(emailSent || telegramSent)
                .telegramSent(telegramSent)
                .emailSent(emailSent)
                .deliveryStatus(status)
                .message(userFeedback)
                .createdAt(now)
                .build();
    }

    private boolean deliverTelegramNotification(String ticketId, ContactInquiryRequest request,
                                               String telegramUser, String comment,
                                               String clientIp, String formattedDate) {
        if (botToken == null || botToken.isBlank() || adminChatId == null || adminChatId.isBlank()) {
            log.info("[TELEGRAM CHANNEL SKIPPED] bot-token or admin-chat-id not configured.");
            return false;
        }

        String orgType = (request.getOrganizationType() != null && !request.getOrganizationType().isBlank())
                ? request.getOrganizationType().trim() : "Ko‘rsatilmagan";
        String region = (request.getRegion() != null && !request.getRegion().isBlank())
                ? request.getRegion().trim() : "Ko‘rsatilmagan";
        String computers = (request.getComputerCount() != null && !request.getComputerCount().isBlank())
                ? request.getComputerCount().trim() + " ta" : "Ko‘rsatilmagan";

        String text = String.format("""
                🏢 <b>YANGI HAMKORLIK SO‘ROVI</b>

                🎫 <b>Murojaat raqami:</b> #%s
                📅 <b>Vaqt:</b> %s

                🏛 <b>Tashkilot:</b> %s
                👤 <b>Mas'ul shaxs:</b> %s
                📞 <b>Telefon:</b> <code>%s</code>
                💬 <b>Telegram:</b> %s
                📍 <b>Hudud:</b> %s
                🏷 <b>Tashkilot turi:</b> %s
                💻 <b>Kompyuterlar:</b> %s

                📝 <b>Izoh:</b>
                <i>%s</i>

                🌐 <b>IP:</b> <code>%s</code>
                """,
                ticketId, formattedDate,
                escapeHtml(request.getOrganization()),
                escapeHtml(request.getFullName()),
                escapeHtml(request.getPhone()),
                telegramUser,
                escapeHtml(region),
                escapeHtml(orgType),
                escapeHtml(computers),
                escapeHtml(comment),
                clientIp
        );

        try {
            String url = "https://api.telegram.org/bot" + botToken.trim() + "/sendMessage";
            Map<String, Object> payload = new HashMap<>();
            payload.put("chat_id", adminChatId.trim());
            payload.put("text", text.trim());
            payload.put("parse_mode", "HTML");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

            restTemplate.postForObject(url, entity, String.class);
            log.info("✅ [TELEGRAM SENT] requestId={} notification delivered to chat {}", ticketId, adminChatId);
            return true;
        } catch (Exception e) {
            log.error("❌ [TELEGRAM FAILED] Failed to send telegram notification: {}", e.getMessage());
            return false;
        }
    }

    private boolean deliverHtmlEmail(String ticketId, ContactInquiryRequest request,
                                    String telegramUser, String comment,
                                    String clientIp, String formattedDate) {
        if (adminEmail == null || adminEmail.isBlank()) {
            log.warn("[EMAIL CHANNEL SKIPPED] ADMIN_NOTIFICATION_EMAIL is not configured.");
            return false;
        }

        String subject = "[Yangi Hamkorlik So‘rovi] " + request.getOrganization().trim();
        String htmlContent = buildHtmlEmailTemplate(ticketId, request, telegramUser, comment, clientIp, formattedDate);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String sender = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail.trim() : "info@pravaonline.uz";
            helper.setFrom(fromName + " <" + sender + ">");

            String[] recipients = Arrays.stream(adminEmail.split(","))
                    .map(String::trim)
                    .filter(e -> !e.isBlank())
                    .toArray(String[]::new);

            if (recipients.length == 0) {
                log.warn("[EMAIL CHANNEL SKIPPED] No valid recipients in adminEmail: {}", adminEmail);
                return false;
            }

            helper.setTo(recipients);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✅ [EMAIL SENT] requestId={} successfully sent to {}", ticketId, Arrays.toString(recipients));
            return true;
        } catch (Exception e) {
            log.error("❌ [EMAIL FAILED] Failed to send email to {}: {}", adminEmail, e.getMessage());
            return false;
        }
    }

    private String buildHtmlEmailTemplate(String ticketId, ContactInquiryRequest request,
                                          String telegramUser, String comment,
                                          String clientIp, String formattedDate) {
        String cleanPhone = request.getPhone().replaceAll("[^0-9+]", "");
        String cleanTg = telegramUser.replace("@", "");

        String safeRegion = (request.getRegion() != null && !request.getRegion().isBlank()) ? request.getRegion().trim() : "Ko‘rsatilmagan";
        String safeTg = (!telegramUser.equals("Ko‘rsatilmagan") && !telegramUser.equals("-") && !telegramUser.isBlank()) ? telegramUser : "Ko‘rsatilmagan";
        String safeTgDisplay = safeTg.startsWith("@")
                ? String.format("<a href=\"https://t.me/%s\" style=\"color: #0284c7; text-decoration: none;\">%s</a>", escapeHtml(safeTg.substring(1)), escapeHtml(safeTg))
                : escapeHtml(safeTg);
        String safeComp = (request.getComputerCount() != null && !request.getComputerCount().isBlank() && !request.getComputerCount().equals("-") && !request.getComputerCount().equals("Ko‘rsatilmagan")) ? request.getComputerCount().trim() + " ta" : "Ko‘rsatilmagan";
        String safeComment = (comment != null && !comment.isBlank() && !comment.equals("-") && !comment.equals("Ko‘rsatilmagan")) ? comment : "Ko‘rsatilmagan";

        return String.format("""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Yangi Hamkorlik So‘rovi</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
                    <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 15px;">
                        <tr>
                            <td align="center">
                                <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #0f172a 0%%, #1e293b 100%%); padding: 36px 32px; text-align: left;">
                                            <span style="background: #2563eb; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; padding: 5px 12px; border-radius: 20px; display: inline-block; margin-bottom: 12px;">Prava Desktop Enterprise</span>
                                            <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 700; line-height: 1.3;">Yangi Hamkorlik So‘rovi</h1>
                                            <p style="color: #94a3b8; font-size: 13px; margin: 8px 0 0 0;">
                                                Murojaat raqami: <strong style="color: #38bdf8; font-family: monospace; font-size: 14px;">#%s</strong> &bull; %s
                                            </p>
                                        </td>
                                    </tr>
                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 32px;">
                                            <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 14px;">
                                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                                    <td style="padding: 12px 0; color: #64748b; width: 40%%; font-weight: 500;">Tashkilot nomi:</td>
                                                    <td style="padding: 12px 0; color: #0f172a; font-weight: 700; font-size: 15px;">%s</td>
                                                </tr>
                                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                                    <td style="padding: 12px 0; color: #64748b; font-weight: 500;">Mas'ul shaxs (F.I.Sh.):</td>
                                                    <td style="padding: 12px 0; color: #0f172a; font-weight: 600;">%s</td>
                                                </tr>
                                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                                    <td style="padding: 12px 0; color: #64748b; font-weight: 500;">Telefon raqami:</td>
                                                    <td style="padding: 12px 0; color: #2563eb; font-weight: 700; font-size: 15px;">
                                                        <a href="tel:%s" style="color: #2563eb; text-decoration: none;">%s</a>
                                                    </td>
                                                </tr>
                                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                                    <td style="padding: 12px 0; color: #64748b; font-weight: 500;">Telegram:</td>
                                                    <td style="padding: 12px 0; color: #0284c7; font-weight: 600;">
                                                        %s
                                                    </td>
                                                </tr>
                                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                                    <td style="padding: 12px 0; color: #64748b; font-weight: 500;">Hudud:</td>
                                                    <td style="padding: 12px 0; color: #0f172a; font-weight: 500;">%s</td>
                                                </tr>
                                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                                    <td style="padding: 12px 0; color: #64748b; font-weight: 500;">Tashkilot turi:</td>
                                                    <td style="padding: 12px 0; color: #0f172a; font-weight: 500;">%s</td>
                                                </tr>
                                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                                    <td style="padding: 12px 0; color: #64748b; font-weight: 500;">Kompyuterlar soni:</td>
                                                    <td style="padding: 12px 0; color: #0f172a; font-weight: 600;">%s</td>
                                                </tr>
                                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                                    <td style="padding: 12px 0; color: #64748b; font-weight: 500;">Foydalanuvchi IP manzili:</td>
                                                    <td style="padding: 12px 0; color: #475569; font-family: monospace; font-size: 13px;">%s</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 16px 0 6px 0; color: #64748b; font-weight: 500; vertical-align: top;" colspan="2">Qo‘shimcha izoh yoki talablar:</td>
                                                </tr>
                                                <tr>
                                                    <td colspan="2" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; color: #334155; font-size: 14px; line-height: 1.6;">
                                                        %s
                                                    </td>
                                                </tr>
                                            </table>

                                            <!-- Action CTA buttons -->
                                            <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 30px;">
                                                <tr>
                                                    <td align="center">
                                                        <a href="tel:%s" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; margin-right: 12px;">Qo‘ng‘iroq qilish</a>
                                                        <a href="https://t.me/pravaonlineuz" style="background-color: #0284c7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">Telegramda bog‘lanish</a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; line-height: 1.5;">
                                            Ushbu bildirishnoma <strong>Prava Online Enterprise Notification Engine</strong> orqali yuborildi.<br>
                                            Server vaqti: %s
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """,
                ticketId, formattedDate,
                escapeHtml(request.getOrganization()),
                escapeHtml(request.getFullName()),
                cleanPhone, escapeHtml(request.getPhone()),
                safeTgDisplay,
                escapeHtml(safeRegion),
                escapeHtml(request.getOrganizationType() != null ? request.getOrganizationType() : "Ko‘rsatilmagan"),
                escapeHtml(safeComp),
                escapeHtml(clientIp),
                escapeHtml(safeComment),
                cleanPhone,
                formattedDate
        );
    }

    private String escapeHtml(String text) {
        if (text == null) return "-";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
