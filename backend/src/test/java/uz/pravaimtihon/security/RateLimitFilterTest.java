package uz.pravaimtihon.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitFilterTest {

    private RateLimitFilter filter;

    @BeforeEach
    void setUp() {
        filter = new RateLimitFilter();
        ReflectionTestUtils.setField(filter, "enabled", true);
        ReflectionTestUtils.setField(filter, "requestsPerMinute", 60);
        ReflectionTestUtils.setField(filter, "authRequestsPerMinute", 5);
    }

    @Test
    void shouldNotFilterStaticAssetsAndNonApiRoutes() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/index.html");
        assertThat(filter.shouldNotFilter(request)).isTrue();

        request = new MockHttpServletRequest("GET", "/assets/main.js");
        assertThat(filter.shouldNotFilter(request)).isTrue();

        request = new MockHttpServletRequest("GET", "/v3/api-docs");
        assertThat(filter.shouldNotFilter(request)).isTrue();
    }

    @Test
    void shouldFilterApiRoutes() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/auth/login");
        assertThat(filter.shouldNotFilter(request)).isFalse();

        request = new MockHttpServletRequest("GET", "/api/v1/public/guest-exam");
        assertThat(filter.shouldNotFilter(request)).isFalse();

        request = new MockHttpServletRequest("POST", "/api/v2/tickets/start-secure");
        assertThat(filter.shouldNotFilter(request)).isFalse();

        request = new MockHttpServletRequest("GET", "/api/v1/files/questions/123.jpg");
        assertThat(filter.shouldNotFilter(request)).isFalse();
    }

    @Test
    void authEndpointsAreLimitedStrictly() throws ServletException, IOException {
        String ip = "192.0.2.1";

        // Limit is set to 5 in setUp()
        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/auth/login");
            req.setRemoteAddr(ip);
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(req, res, new MockFilterChain());
            assertThat(res.getStatus()).isEqualTo(200);
        }

        // 6th attempt must be 429 TOO_MANY_REQUESTS
        MockHttpServletRequest blockedReq = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        blockedReq.setRemoteAddr(ip);
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        filter.doFilter(blockedReq, blockedRes, new MockFilterChain());
        assertThat(blockedRes.getStatus()).isEqualTo(429);
        assertThat(blockedRes.getContentAsString()).contains("Too many requests");
    }

    @Test
    void imageDownloadsDoNotStarveApiBucket() throws ServletException, IOException {
        String ip = "192.0.2.3";
        // General API limit is 60 in setUp(); an offline image warm-up sends far more than that.
        for (int i = 0; i < 200; i++) {
            MockHttpServletRequest img = new MockHttpServletRequest("GET", "/api/v1/files/general/i" + i + ".jpg");
            img.setRemoteAddr(ip);
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(img, res, new MockFilterChain());
            assertThat(res.getStatus()).isEqualTo(200);
        }
        // The same IP can still call the API (e.g. OKTAGON ticket) right after the image burst
        MockHttpServletRequest api = new MockHttpServletRequest("POST", "/api/v1/octagon/ticket");
        api.setRemoteAddr(ip);
        MockHttpServletResponse apiRes = new MockHttpServletResponse();
        filter.doFilter(api, apiRes, new MockFilterChain());
        assertThat(apiRes.getStatus()).isEqualTo(200);
    }

    @Test
    void imageBucketItselfIsBounded() throws ServletException, IOException {
        String ip = "192.0.2.4";
        int ok = 0;
        for (int i = 0; i < 300; i++) {
            MockHttpServletRequest img = new MockHttpServletRequest("GET", "/api/v1/files/signs/s" + i + ".png");
            img.setRemoteAddr(ip);
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(img, res, new MockFilterChain());
            if (res.getStatus() == 200) ok++;
        }
        assertThat(ok).isBetween(240, 245); // 240/min (+ refill during the loop)
    }

    @Test
    void guestExamIsRateLimited() throws ServletException, IOException {
        String ip = "192.0.2.2";

        // Guest exam limit is 10
        for (int i = 0; i < 10; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/v1/public/guest-exam");
            req.setRemoteAddr(ip);
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(req, res, new MockFilterChain());
            assertThat(res.getStatus()).isEqualTo(200);
        }

        // 11th request must be 429
        MockHttpServletRequest blocked = new MockHttpServletRequest("GET", "/api/v1/public/guest-exam");
        blocked.setRemoteAddr(ip);
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        filter.doFilter(blocked, blockedRes, new MockFilterChain());
        assertThat(blockedRes.getStatus()).isEqualTo(429);
    }
}
