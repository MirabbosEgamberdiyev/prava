package uz.pravaimtihon.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Refresh token'ni HttpOnly cookie orqali berish/o'qish.
 *
 * <p>SECURITY: avval web ilova refresh token'ni JS o'qiy oladigan cookie'da (js-cookie,
 * butun {@code .pravaonline.uz} domeni, 30 kun) saqlardi — istalgan XSS uni o'g'irlardi.
 * Endi server uni {@code HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth} cookie qilib
 * beradi. {@value #MODE_HEADER}: {@value #MODE_COOKIE} yuborgan klient (web, admin) body'da
 * refresh token olmaydi. Mobil va desktop (cross-site webview) avvalgidek body'dan foydalanadi.
 */
@Component
public class RefreshTokenCookies {

    public static final String COOKIE_NAME = "prava_rt";
    public static final String MODE_HEADER = "X-Auth-Mode";
    public static final String MODE_COOKIE = "cookie";
    private static final String PATH = "/api/v1/auth";

    @Value("${app.auth.cookie.secure:true}")
    private boolean secure;

    @Value("${app.jwt.refresh-token-expiration:2592000000}")
    private long refreshTtlMs;

    public boolean isCookieMode(HttpServletRequest request) {
        return request != null && MODE_COOKIE.equalsIgnoreCase(request.getHeader(MODE_HEADER));
    }

    public String read(HttpServletRequest request) {
        if (request == null || request.getCookies() == null) return null;
        for (Cookie c : request.getCookies()) {
            if (COOKIE_NAME.equals(c.getName()) && c.getValue() != null && !c.getValue().isBlank()) {
                return c.getValue();
            }
        }
        return null;
    }

    public String setHeader(String refreshToken) {
        return build(refreshToken, Duration.ofMillis(refreshTtlMs)).toString();
    }

    public String clearHeader() {
        return build("", Duration.ZERO).toString();
    }

    private ResponseCookie build(String value, Duration maxAge) {
        return ResponseCookie.from(COOKIE_NAME, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Strict")
                .path(PATH)
                .maxAge(maxAge)
                .build();
    }

    public static String headerName() {
        return HttpHeaders.SET_COOKIE;
    }
}
