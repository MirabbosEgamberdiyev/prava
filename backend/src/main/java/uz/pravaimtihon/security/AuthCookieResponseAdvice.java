package uz.pravaimtihon.security;

import lombok.RequiredArgsConstructor;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.dto.response.AuthResponse;

/**
 * Har qanday {@code ApiResponse<AuthResponse>} javobiga (login, register, Google, Telegram,
 * QR, refresh) refresh token HttpOnly cookie'sini qo'shadi. Cookie rejimidagi klient uchun
 * refresh token body'dan olib tashlanadi — JS unga umuman tegmaydi.
 */
@RestControllerAdvice
@RequiredArgsConstructor
public class AuthCookieResponseAdvice implements ResponseBodyAdvice<Object> {

    private final RefreshTokenCookies cookies;

    @Override
    public boolean supports(MethodParameter returnType, Class converterType) {
        return true;
    }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType,
                                  Class selectedConverterType, ServerHttpRequest request,
                                  ServerHttpResponse response) {
        if (!(body instanceof ApiResponse<?> api) || !(api.getData() instanceof AuthResponse auth)) {
            return body;
        }
        String refreshToken = auth.getRefreshToken();
        if (refreshToken == null || refreshToken.isBlank()) {
            return body;
        }
        response.getHeaders().add(RefreshTokenCookies.headerName(), cookies.setHeader(refreshToken));
        if (request instanceof ServletServerHttpRequest servletRequest
                && cookies.isCookieMode(servletRequest.getServletRequest())) {
            auth.setRefreshToken(null);
        }
        return body;
    }
}
