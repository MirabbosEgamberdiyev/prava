package uz.pravaimtihon.service.notification;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.exception.BusinessException;
import uz.pravaimtihon.service.MessageService;

/**
 * ✅ ENHANCED EmailService with Interactive HTML Template
 *
 * Features:
 * - Interactive copy-to-clipboard button
 * - Modern, responsive design
 * - Multi-language support
 * - Test mode with detailed logging
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final MessageService messageService;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.email.from-name:Prava Online}")
    private String fromName;

    @Value("${app.email.enabled:true}")
    private boolean emailEnabled;

    @Value("${app.email.test-mode.log-only:false}")
    private boolean testModeLogOnly;

    /**
     * ✅ ENHANCED: Send verification email with test mode support
     */
    @Async
    public void sendVerificationEmail(String to, String code, AcceptLanguage language) {
        String subject = messageService.getMessage(
                "email.verification.subject",
                null,
                language.toLocale()
        );

        log.info("📧 Email Service: recipient={}, testMode={}, enabled={}",
                maskEmail(to), testModeLogOnly, emailEnabled);

        // ✅ Test Mode: Log only
        if (!emailEnabled || testModeLogOnly) {
            log.info("🧪 [TEST MODE] Email would be sent:");
            log.info("   To: {}", to);
            log.info("   Subject: {}", subject);
            log.info("   Code: {}", code);
            log.info("   Language: {}", language);
            return;
        }

        // ✅ Production Mode: Send real email
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromName + " <" + fromEmail + ">");
            helper.setTo(to);
            helper.setSubject(subject);

            String htmlContent = buildVerificationEmailHtml(code, language);
            helper.setText(htmlContent, true);

            log.debug("📤 Sending email via SMTP: to={}", maskEmail(to));
            mailSender.send(message);

            log.info("✅ Verification email sent successfully to: {}", maskEmail(to));

        } catch (MailAuthenticationException e) {
            log.error("❌ Email authentication failed (check username/password)", e);
            throw new BusinessException("error.email.auth.failed");
        } catch (MailSendException e) {
            log.error("❌ Email send failed (SMTP server error)", e);
            throw new BusinessException("error.email.send.failed");
        } catch (MessagingException e) {
            log.error("❌ Failed to create email message", e);
            throw new BusinessException("error.email.send.failed");
        } catch (Exception e) {
            log.error("❌ Unexpected error sending email", e);
            throw new BusinessException("error.email.send.failed");
        }
    }

    /**
     * ✅ ENHANCED: Modern HTML template with copy-to-clipboard functionality
     */
    private String buildVerificationEmailHtml(String code, AcceptLanguage language) {
        String greeting = messageService.getMessage("email.greeting", null, language.toLocale());
        String title = messageService.getMessage("email.verification.title", null, language.toLocale());
        String description = messageService.getMessage("email.verification.description", null, language.toLocale());
        String codeLabel = messageService.getMessage("email.verification.code.label", null, language.toLocale());
        String expiryNote = messageService.getMessage("email.verification.expiry", new Object[]{10}, language.toLocale());
        String securityNote = messageService.getMessage("email.verification.security", null, language.toLocale());
        String footer = messageService.getMessage("email.footer", null, language.toLocale());

        return """
        <!DOCTYPE html>
        <html lang="%s">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>%s</title>
            <style type="text/css">
                body { margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
                table { border-collapse: separate; border-spacing: 0; }
                td { padding: 0; }
                .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
                .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: #ffffff; padding: 50px 20px; text-align: center; }
                .header h1 { margin: 0; font-size: 30px; font-weight: 700; }
                .header p { margin: 12px 0 0; font-size: 17px; opacity: 0.95; }
                .content { padding: 50px 30px; text-align: center; }
                .greeting { font-size: 19px; color: #333333; margin-bottom: 20px; font-weight: 500; }
                .description { font-size: 16px; color: #555555; line-height: 1.7; margin-bottom: 40px; }
                .code-wrapper { background: #f8faff; border: 3px dashed #667eea; border-radius: 16px; padding: 40px 20px; margin: 40px 0; }
                .code-label { font-size: 15px; color: #666666; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; font-weight: 600; }
                .code { 
                    font-size: 42px; 
                    font-weight: bold; 
                    letter-spacing: 12px; 
                    color: #667eea; 
                    background: #ffffff; 
                    padding: 25px; 
                    border-radius: 12px; 
                    font-family: 'Courier New', Courier, monospace;
                    user-select: all;
                    -webkit-user-select: all;
                    -moz-user-select: all;
                    -ms-user-select: all;
                    cursor: text;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.15);
                }
                .expiry { margin-top: 35px; font-size: 16px; color: #e74c3c; font-weight: 600; }
                .security { margin-top: 20px; font-size: 14px; color: #7f8c8d; line-height: 1.6; }
                .footer { background: #f8f9fa; padding: 35px 30px; text-align: center; color: #95a5a6; font-size: 13px; border-top: 1px solid #e5e7eb; }
                @media screen and (max-width: 600px) {
                    .container { margin: 10px; border-radius: 12px; }
                    .header { padding: 40px 20px; }
                    .header h1 { font-size: 26px; }
                    .content { padding: 40px 20px; }
                    .code { font-size: 36px !important; letter-spacing: 8px !important; padding: 20px !important; }
                    .code-wrapper { padding: 30px 15px; }
                }
            </style>
        </head>
        <body style="background:#f4f6f9;">
            <center>
                <table width="100%%" class="container" role="presentation">
                    <tr>
                        <td align="center">
                            <!-- Header -->
                            <table width="100%%" role="presentation">
                                <tr>
                                    <td class="header">
                                        <h1>🚗 Prava Online</h1>
                                        <p>%s</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Main Content -->
                            <table width="100%%" role="presentation">
                                <tr>
                                    <td class="content">
                                        <p class="greeting">%s</p>
                                        <p class="description">%s</p>

                                        <div class="code-wrapper">
                                            <div class="code-label">%s</div>
                                            <div class="code">%s</div>
                                        </div>

                                        <p class="expiry">⏰ %s</p>
                                        <p class="security">🔒 %s</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Footer -->
                            <table width="100%%" role="presentation">
                                <tr>
                                    <td class="footer">
                                        <p>%s</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </center>
        </body>
        </html>
        """.formatted(
                language.getCode(),
                title,
                title,
                greeting,
                description,
                codeLabel,
                code,
                expiryNote,
                securityNote,
                footer
        );
    }    /**
     * ✅ Mask email for privacy
     */
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        String[] parts = email.split("@");
        String local = parts[0];
        String domain = parts[1];
        return local.substring(0, Math.min(2, local.length())) + "***@" + domain;
    }

    /**
     * ✅ Public method to check if email is enabled
     */
    public boolean isEmailEnabled() {
        return emailEnabled && !testModeLogOnly;
    }
}