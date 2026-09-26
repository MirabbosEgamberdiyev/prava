package uz.pravaimtihon.payment.service;

import org.junit.jupiter.api.Test;
import uz.pravaimtihon.payment.config.PaymentProperties;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;

/** Audit P0-1: Payme webhook bo'sh kalit bilan autentifikatsiyadan o'tmasligi kerak. */
class PaymeAuthTest {

    private static String basic(String user, String pass) {
        return "Basic " + Base64.getEncoder().encodeToString((user + ":" + pass).getBytes(StandardCharsets.UTF_8));
    }

    private static PaymeService service(String prodKey, String testKey, boolean testMode) {
        PaymentProperties props = new PaymentProperties();
        props.getPayme().setCashboxKey(prodKey);
        props.getPayme().setTestCashboxKey(testKey);
        props.getPayme().setTestMode(testMode);
        return new PaymeService(null, null, props, null);
    }

    @Test
    void emptyPasswordIsRejectedWhenKeysAreNotConfigured() {
        PaymeService s = service("", "", false);
        assertThat(s.verifyAuth(basic("Paycom", ""))).isFalse();
        assertThat(s.verifyAuth(basic("Paycom", " "))).isFalse();
    }

    @Test
    void emptyPasswordIsRejectedEvenIfOnlyTestKeyIsBlank() {
        PaymeService s = service("prod-secret", null, false);
        assertThat(s.verifyAuth(basic("Paycom", ""))).isFalse();
    }

    @Test
    void correctProdKeyIsAccepted() {
        PaymeService s = service("prod-secret", "", false);
        assertThat(s.verifyAuth(basic("Paycom", "prod-secret"))).isTrue();
        assertThat(s.verifyAuth(basic("Paycom", "prod-secreT"))).isFalse();
        assertThat(s.verifyAuth(basic("Other", "prod-secret"))).isFalse();
    }

    @Test
    void testKeyAcceptedOnlyInTestMode() {
        assertThat(service("prod", "sandbox", false).verifyAuth(basic("Paycom", "sandbox"))).isFalse();
        assertThat(service("prod", "sandbox", true).verifyAuth(basic("Paycom", "sandbox"))).isTrue();
    }

    @Test
    void malformedHeadersAreRejected() {
        PaymeService s = service("prod", "", false);
        assertThat(s.verifyAuth(null)).isFalse();
        assertThat(s.verifyAuth("Bearer x")).isFalse();
        assertThat(s.verifyAuth("Basic !!!notbase64")).isFalse();
    }
}
