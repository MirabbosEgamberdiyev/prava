package uz.pravaimtihon.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/** Kuchli (strong) ETag yordamchilari. */
public final class ETags {

    private ETags() {
    }

    /** Qiymatdan SHA-256 asosidagi kuchli ETag: {@code "<32 hex>"}. */
    public static String strongOf(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest((value == null ? "" : value).getBytes(StandardCharsets.UTF_8));
            return "\"" + HexFormat.of().formatHex(digest, 0, 16) + "\"";
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    /**
     * {@code If-None-Match} sarlavhasi ETag'ga mosmi. Zaif prefiks ({@code W/}) olib tashlanadi
     * (proxy/CDN gzip qilganda ETag'ni zaiflashtiradi), ro'yxat ({@code a, b}) va {@code *} qo'llab-quvvatlanadi.
     */
    public static boolean matches(String ifNoneMatch, String etag) {
        if (ifNoneMatch == null || ifNoneMatch.isBlank() || etag == null) {
            return false;
        }
        String target = stripWeak(etag.trim());
        for (String candidate : ifNoneMatch.split(",")) {
            String c = candidate.trim();
            if (c.equals("*")) {
                return true;
            }
            if (stripWeak(c).equals(target)) {
                return true;
            }
        }
        return false;
    }

    private static String stripWeak(String tag) {
        return tag.startsWith("W/") ? tag.substring(2).trim() : tag;
    }
}
