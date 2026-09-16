package uz.pravaimtihon.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uz.pravaimtihon.service.TelegramBotService;

import java.net.UnknownHostException;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/telegram")
@RequiredArgsConstructor
@Slf4j
public class TelegramWebhookController {

    private final TelegramBotService telegramBotService;

    @Value("${app.telegram.ip-validation.enabled:true}")
    private boolean ipValidationEnabled;

    // Telegram server IP ranges: 149.154.160.0/20 and 91.108.0.0/16 subnets
    private static final String[][] TELEGRAM_IP_RANGES = {
            {"149.154.160.0", "149.154.175.255"},  // 149.154.160.0/20
            {"91.108.4.0", "91.108.7.255"},         // 91.108.4.0/22
            {"91.108.8.0", "91.108.11.255"},        // 91.108.8.0/22
            {"91.108.12.0", "91.108.15.255"},       // 91.108.12.0/22
            {"91.108.16.0", "91.108.19.255"},       // 91.108.16.0/22
            {"91.108.20.0", "91.108.23.255"},       // 91.108.20.0/22
            {"91.108.56.0", "91.108.59.255"},       // 91.108.56.0/22
    };

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(@RequestBody Map<String, Object> update,
                                                  HttpServletRequest request) {
        // Verify X-Telegram-Bot-Api-Secret-Token header first (Telegram's official authentication method)
        String expectedSecret = telegramBotService.getWebhookSecretToken();
        String receivedSecret = request.getHeader("X-Telegram-Bot-Api-Secret-Token");

        boolean hasSecretConfigured = expectedSecret != null && !expectedSecret.isBlank();

        if (hasSecretConfigured) {
            if (!expectedSecret.equals(receivedSecret)) {
                log.warn("Webhook request with invalid secret token from IP: {}", getClientIp(request));
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden");
            }
        } else if (ipValidationEnabled && !isValidTelegramIp(request)) {
            String clientIp = getClientIp(request);
            log.warn("Webhook request from unauthorized IP: {}", clientIp);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden");
        }

        telegramBotService.handleUpdate(update);
        return ResponseEntity.ok("ok");
    }

    private boolean isValidTelegramIp(HttpServletRequest request) {
        String clientIp = getClientIp(request);

        // Allow localhost in dev mode
        if (isLocalhost(clientIp)) {
            return true;
        }

        try {
            long ipLong = ipToLong(clientIp);
            for (String[] range : TELEGRAM_IP_RANGES) {
                long rangeStart = ipToLong(range[0]);
                long rangeEnd = ipToLong(range[1]);
                if (ipLong >= rangeStart && ipLong <= rangeEnd) {
                    return true;
                }
            }
        } catch (UnknownHostException e) {
            log.error("Failed to parse IP address: {}", clientIp);
        }

        return false;
    }

    private boolean isLocalhost(String ip) {
        if (ip == null || ip.isBlank()) return false;
        String trimmed = ip.trim();
        if ("127.0.0.1".equals(trimmed) || "0:0:0:0:0:0:0:1".equals(trimmed) || "::1".equals(trimmed)) {
            return true;
        }
        // Allow internal docker bridge and private networks
        return trimmed.startsWith("172.") || trimmed.startsWith("10.") || trimmed.startsWith("192.168.");
    }

    /**
     * ⚠️ AUDIT — XAVFSIZLIK: avval `X-Forwarded-For` ning BIRINCHI qiymati
     * olinardi. Nginx `$proxy_add_x_forwarded_for` klient bergan header'ga
     * o'zini qo'shadi, ya'ni birinchi element hujumchi nazoratida. Shu sabab
     * "Telegram IP diapazoni" tekshiruvi `X-Forwarded-For: 149.154.160.1`
     * yuborish bilan arzimas tarzda chetlab o'tilardi.
     *
     * Endi `X-Real-IP` (nginx doim qayta yozadi) → XFF ning OXIRGI hop'i →
     * `remoteAddr` tartibida olinadi.
     */
    private String getClientIp(HttpServletRequest request) {
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            String[] hops = xForwardedFor.split(",");
            String lastHop = hops[hops.length - 1].trim();
            if (!lastHop.isEmpty()) {
                return lastHop;
            }
        }
        return request.getRemoteAddr();
    }

    /**
     * AUDIT: avval `InetAddress.getByName(...)` ishlatilgan edi. U argument IP
     * bo'lmasa DNS so'rov yuboradi — ya'ni header orqali kelgan ixtiyoriy
     * hostname request thread'ida bloklovchi DNS lookup'ni keltirib chiqarardi
     * (DoS / tashqi so'rov vektori). Endi faqat sof IPv4 matni parse qilinadi,
     * tarmoqqa umuman chiqilmaydi.
     */
    private long ipToLong(String ipAddress) throws UnknownHostException {
        if (ipAddress == null) {
            throw new UnknownHostException("null IP");
        }
        String[] octets = ipAddress.trim().split("\\.");
        if (octets.length != 4) {
            throw new UnknownHostException("IPv4 emas: " + ipAddress);
        }
        long result = 0;
        for (String octet : octets) {
            int value;
            try {
                value = Integer.parseInt(octet);
            } catch (NumberFormatException e) {
                throw new UnknownHostException("Noto'g'ri IPv4: " + ipAddress);
            }
            if (value < 0 || value > 255) {
                throw new UnknownHostException("Noto'g'ri IPv4 oktet: " + ipAddress);
            }
            result = (result << 8) | value;
        }
        return result;
    }
}
