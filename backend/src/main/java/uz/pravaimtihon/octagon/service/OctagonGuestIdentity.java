package uz.pravaimtihon.octagon.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import java.util.regex.Pattern;

/**
 * Server tomonidan imzolangan mehmon (guest) identifikatori.
 *
 * Avval mehmon ID'si klientda {@code "guest_" + Math.random()} bilan yaratilardi va server uni so'zsiz
 * qabul qilardi. Mehmon ID'lari boshqa o'yinchilarga ochiq yuboriladi (match_found, room a'zolari,
 * challenge), shuning uchun har kim begona ID bilan ticket olib, uning jangiga "reconnect" qilib
 * kirib olishi mumkin edi. Endi klient faqat server bergan token ({@code g1.<id>.<imzo>}) bilan
 * o'zini tanitadi; token sir, ID esa ochiq.
 */
@Component
public class OctagonGuestIdentity {

    private static final String PREFIX = "g1.";
    private static final Pattern ID_PART = Pattern.compile("[0-9a-f]{16}");
    private static final SecureRandom RANDOM = new SecureRandom();

    private final byte[] key;

    public OctagonGuestIdentity(@Value("${app.jwt.secret}") String jwtSecret) {
        try {
            this.key = MessageDigest.getInstance("SHA-256")
                    .digest((jwtSecret + "|octagon-guest-v1").getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 mavjud emas", e);
        }
    }

    /** Yangi mehmon tokeni. */
    public String issueToken() {
        byte[] raw = new byte[8];
        RANDOM.nextBytes(raw);
        String idPart = HexFormat.of().formatHex(raw);
        return PREFIX + idPart + "." + sign(idPart);
    }

    /**
     * Tokenni tekshiradi va ochiq mehmon ID'sini ({@code guest_<hex>}) qaytaradi; noto'g'ri bo'lsa {@code null}.
     */
    public String verifyToken(String token) {
        if (token == null || !token.startsWith(PREFIX)) return null;
        String[] parts = token.substring(PREFIX.length()).split("\\.");
        if (parts.length != 2 || !ID_PART.matcher(parts[0]).matches()) return null;
        byte[] expected = sign(parts[0]).getBytes(StandardCharsets.US_ASCII);
        byte[] actual = parts[1].getBytes(StandardCharsets.US_ASCII);
        if (!MessageDigest.isEqual(expected, actual)) return null;
        return "guest_" + parts[0];
    }

    public static boolean isGuestId(String userId) {
        return userId != null && userId.startsWith("guest_");
    }

    private String sign(String idPart) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            byte[] sig = mac.doFinal(idPart.getBytes(StandardCharsets.US_ASCII));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(sig).substring(0, 22);
        } catch (Exception e) {
            throw new IllegalStateException("HMAC xatosi", e);
        }
    }
}
