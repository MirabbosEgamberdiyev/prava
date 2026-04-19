package uz.pravaimtihon.payment.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * A SECOND, higher-priority security chain that covers ONLY the provider webhooks
 * ( Click prepare / complete  and  Payme JSON-RPC ).
 *
 * These endpoints are authenticated by the providers themselves:
 *   – Click: md5 signature verified in the service
 *   – Payme: Basic Auth verified in the service
 *
 * Because this chain is @Order(1), the default chain in SecurityConfig is unchanged.
 * The existing rules there still apply to everything else  — including  the user-facing
 * /api/v1/payment/... endpoints, which require JWT like any other authenticated API.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class PaymentSecurityConfig {

    public static final String CLICK_PREPARE_PATH   = "/api/v1/payment/click/prepare";
    public static final String CLICK_COMPLETE_PATH  = "/api/v1/payment/click/complete";
    public static final String PAYME_WEBHOOK_PATH   = "/api/v1/payment/payme";

    @Bean
    @Order(1)
    public SecurityFilterChain paymentWebhookSecurityFilterChain(HttpSecurity http) throws Exception {
        log.info("[payment] Registering isolated security chain for provider webhooks");

        http
                .securityMatcher(CLICK_PREPARE_PATH, CLICK_COMPLETE_PATH, PAYME_WEBHOOK_PATH)
                .csrf(AbstractHttpConfigurer::disable)
                .cors(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a.anyRequest().permitAll());

        return http.build();
    }
}
