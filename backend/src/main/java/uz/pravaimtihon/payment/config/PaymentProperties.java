package uz.pravaimtihon.payment.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * All payment-related config lives under the `app.payment` prefix.
 * See  application.yml  —  `app.payment.click.*`  and  `app.payment.payme.*`.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "app.payment")
public class PaymentProperties {

    /** Master on/off switch. */
    private boolean enabled = false;

    /** Public frontend base — used to build success/failed redirect URLs. */
    private String  frontendBaseUrl = "https://pravaonline.uz";

    /** Session default — how long a package access lasts. null = lifetime. */
    private Integer accessDays;

    /** PENDING → CANCELLED auto-sweep window (minutes). */
    private int pendingTimeoutMinutes = 30;

    private Click  click = new Click();
    private Payme  payme = new Payme();

    @Data
    public static class Click {
        private boolean enabled   = true;
        private Long    serviceId;
        private Long    merchantId;
        private Long    merchantUserId;
        private String  secretKey;
        /** The hosted checkout URL Click provides. */
        private String  checkoutUrl = "https://my.click.uz/services/pay";
        private String  returnPath  = "/payment/success";
    }

    @Data
    public static class Payme {
        private boolean enabled    = true;
        private String  merchantId;
        /** Cashbox key — used for Basic Auth verification of webhooks. */
        private String  cashboxKey;
        /** Also called "Test key" — if set we accept requests from this key as well. */
        private String  testCashboxKey;
        private String  checkoutBaseUrl = "https://checkout.paycom.uz";
        private String  returnPath      = "/payment/success";
        /** Soft cap — payments older than this (seconds) can be auto-cancelled. */
        private long    timeoutSeconds  = 43_200;   // 12 hours, matches Payme default
    }
}
