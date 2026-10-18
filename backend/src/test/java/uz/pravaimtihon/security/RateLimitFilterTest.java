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
