package uz.pravaimtihon.payment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Auto-cancels PENDING payments older than `app.payment.pending-timeout-minutes`.
 * Runs every 5 minutes. Disabled when `app.payment.enabled=false`.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentSweeper {

    private final PaymentService paymentService;

    @Value("${app.payment.enabled:false}")
    private boolean paymentEnabled;

    @Scheduled(fixedDelayString = "${app.payment.sweeper-delay-ms:300000}",
               initialDelayString = "${app.payment.sweeper-initial-delay-ms:60000}")
    public void sweep() {
        if (!paymentEnabled) return;
        try {
            int n = paymentService.cancelExpiredPending();
            if (n > 0) log.info("[payment] sweeper cancelled {} stale PENDING payments", n);
        } catch (Exception e) {
            log.error("[payment] sweeper failed", e);
        }
    }
}
