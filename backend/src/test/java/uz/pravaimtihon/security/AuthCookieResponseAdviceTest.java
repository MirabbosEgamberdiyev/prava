package uz.pravaimtihon.security;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.dto.response.AuthResponse;

import static org.assertj.core.api.Assertions.assertThat;

/** Audit P1-W2: refresh token HttpOnly cookie'da; cookie rejimidagi klient body'da olmaydi. */
class AuthCookieResponseAdviceTest {

    private final RefreshTokenCookies cookies = new RefreshTokenCookies();
    private final AuthCookieResponseAdvice advice = new AuthCookieResponseAdvice(cookies);

    AuthCookieResponseAdviceTest() {
        ReflectionTestUtils.setField(cookies, "secure", true);
        ReflectionTestUtils.setField(cookies, "refreshTtlMs", 60_000L);
    }

    private ServletServerHttpResponse write(MockHttpServletRequest request, ApiResponse<AuthResponse> body) {
        ServletServerHttpResponse response = new ServletServerHttpResponse(new MockHttpServletResponse());
        advice.beforeBodyWrite(body, null, MediaType.APPLICATION_JSON, null,
                new ServletServerHttpRequest(request), response);
        return response;
    }

    private static ApiResponse<AuthResponse> authBody() {
        return ApiResponse.<AuthResponse>builder()
                .success(true)
                .data(AuthResponse.builder().accessToken("a").refreshToken("r-123").build())
                .build();
    }

    @Test
    void setsHttpOnlyCookieAndStripsBodyInCookieMode() {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader(RefreshTokenCookies.MODE_HEADER, RefreshTokenCookies.MODE_COOKIE);
        ApiResponse<AuthResponse> body = authBody();

        ServletServerHttpResponse res = write(req, body);

        String setCookie = res.getHeaders().getFirst(HttpHeaders.SET_COOKIE);
        assertThat(setCookie).contains("prava_rt=r-123", "HttpOnly", "Secure", "SameSite=Strict", "Path=/api/v1/auth");
        assertThat(body.getData().getRefreshToken()).isNull();
    }

    @Test
    void legacyClientsStillReceiveBodyToken() {
        ApiResponse<AuthResponse> body = authBody();
        write(new MockHttpServletRequest(), body);
        assertThat(body.getData().getRefreshToken()).isEqualTo("r-123");
    }
}
