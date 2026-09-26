package uz.pravaimtihon.payment.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

/**
 * To'lov konfiguratsiyasini ishga tushishda tekshiradi.
 *
 * <ul>
 *   <li>Prod'da Payme test rejimi yoqilgan bo'lsa — ilova ishga tushmaydi
 *       (sandbox kaliti bilan bepul paket olish xavfi).</li>
 *   <li>To'lov yoqilgan, lekin kalitlar bo'sh bo'lsa — ERROR log. Webhook'lar
 *       bo'sh kalitni baribir rad etadi, shuning uchun bu xavfsiz holat,
 *       lekin to'lovlar ishlamaydi.</li>
 * </ul>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentConfigValidator {

    private final PaymentProperties props;
    private final Environment env;

    @PostConstruct
    void validate() {
        boolean prod = env.acceptsProfiles(Profiles.of("prod"));

        if (prod && props.getPayme().isTestMode()) {
            throw new IllegalStateException(
                    "app.payment.payme.test-mode=true is not allowed in the prod profile");
        }
        if (!props.isEnabled()) return;

        if (props.getPayme().isEnabled() && isBlank(props.getPayme().getCashboxKey())) {
            log.error("[payment] Payme enabled but PAYME_CASHBOX_KEY is blank — all Payme webhooks will be rejected");
        }
        if (props.getClick().isEnabled() && isBlank(props.getClick().getSecretKey())) {
            log.error("[payment] Click enabled but CLICK_SECRET_KEY is blank — all Click callbacks will be rejected");
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
