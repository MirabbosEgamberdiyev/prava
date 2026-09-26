package uz.pravaimtihon.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

/** Audit P1-B8: IP header'lariga faqat ishonchli proxy'dan kelganda ishoniladi. */
class ClientIpResolverTest {

    private static MockHttpServletRequest req(String remote, String realIp, String xff) {
        MockHttpServletRequest r = new MockHttpServletRequest();
        r.setRemoteAddr(remote);
        if (realIp != null) r.addHeader("X-Real-IP", realIp);
        if (xff != null) r.addHeader("X-Forwarded-For", xff);
        return r;
    }

    @Test
    void spoofedHeadersFromPublicClientAreIgnored() {
        assertThat(ClientIpResolver.resolve(req("203.0.113.9", "1.2.3.4", "5.6.7.8"))).isEqualTo("203.0.113.9");
    }

    @Test
    void headersFromLocalNginxAreTrusted() {
        assertThat(ClientIpResolver.resolve(req("127.0.0.1", "198.51.100.7", null))).isEqualTo("198.51.100.7");
        // Docker bridge gateway
        assertThat(ClientIpResolver.resolve(req("172.18.0.1", null, "9.9.9.9, 198.51.100.7"))).isEqualTo("198.51.100.7");
    }

    @Test
    void hostnamesAreNeverResolved() {
        assertThat(ClientIpResolver.isTrustedProxy("localhost.evil.com")).isFalse();
        assertThat(ClientIpResolver.isTrustedProxy("")).isFalse();
    }
}
