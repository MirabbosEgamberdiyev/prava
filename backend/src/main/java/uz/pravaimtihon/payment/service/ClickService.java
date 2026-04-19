package uz.pravaimtihon.payment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.entity.ExamPackage;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.payment.config.PaymentProperties;
import uz.pravaimtihon.payment.dto.InvoiceResponse;
import uz.pravaimtihon.payment.dto.click.ClickCallbackRequest;
import uz.pravaimtihon.payment.dto.click.ClickCallbackResponse;
import uz.pravaimtihon.payment.entity.Payment;
import uz.pravaimtihon.payment.enums.PaymentProvider;
import uz.pravaimtihon.payment.enums.PaymentState;
import uz.pravaimtihon.payment.exception.PaymentException;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;

/**
 * Click merchant protocol implementation.
 *
 *  ERROR CODES RETURNED TO CLICK:
 *     0 Success
 *    -1 SIGN CHECK FAILED
 *    -2 Incorrect parameter amount
 *    -3 Action not found
 *    -4 Already paid
 *    -5 User does not exist
 *    -6 Transaction does not exist
 *    -8 Error in request from click
 *    -9 Transaction cancelled
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ClickService {

    private final PaymentService        paymentService;
    private final PaymentAccessService  accessService;
    private final PaymentProperties     props;

    /* ------------------------------------------------------------------ */
    /*  PUBLIC API — user-facing                                          */
    /* ------------------------------------------------------------------ */

    @Transactional
    public InvoiceResponse createInvoice(User user, ExamPackage pkg) {
        assertEnabled();

        Payment p = paymentService.createPending(user, pkg, PaymentProvider.CLICK);
        // Click requires merchant_trans_id to be the same string throughout prepare/complete.
        // Use payment.id so prepare lookup is deterministic.
        String merchantTransId = String.valueOf(p.getId());
        p.setMerchantOrderId(merchantTransId);   // overwrite short uuid so click maps directly

        String redirect = buildCheckoutUrl(p.getId(), p.getAmount());
        log.info("[click] invoice created paymentId={} amount={} url={}", p.getId(), p.getAmount(), redirect);

        return InvoiceResponse.builder()
                .paymentId(p.getId())
                .merchantOrderId(p.getMerchantOrderId())
                .packageId(pkg.getId())
                .amount(p.getAmount())
                .provider(PaymentProvider.CLICK)
                .redirectUrl(redirect)
                .build();
    }

    /* ------------------------------------------------------------------ */
    /*  WEBHOOKS                                                          */
    /* ------------------------------------------------------------------ */

    @Transactional
    public ClickCallbackResponse prepare(ClickCallbackRequest req) {
        logRequest("prepare", req);
        assertEnabled();

        // 1. validate basic params
        if (req.getAction() == null || req.getAction() != 0)
            return err(req, -3, "Action not found");
        if (req.getMerchantTransId() == null || req.getMerchantTransId().isBlank())
            return err(req, -8, "merchant_trans_id is required");

        // 2. signature
        if (!verifySignature(req))
            return err(req, -1, "SIGN CHECK FAILED");

        // 3. resolve payment (pessimistic lock to avoid races)
        Long paymentId;
        try { paymentId = Long.parseLong(req.getMerchantTransId()); }
        catch (NumberFormatException e) { return err(req, -6, "Transaction does not exist"); }

        Payment p;
        try { p = paymentService.requirePaymentForUpdate(paymentId); }
        catch (PaymentException e) { return err(req, -6, "Transaction does not exist"); }

        if (p.getProvider() != PaymentProvider.CLICK)
            return err(req, -8, "Wrong provider");

        if (p.getUser() == null)
            return err(req, -5, "User does not exist");

        // 4. amount
        if (req.getAmount() == null || p.getAmount().compareTo(req.getAmount()) != 0)
            return err(req, -2, "Incorrect parameter amount");

        // 5. state checks
        if (p.getState() == PaymentState.PERFORMED)
            return err(req, -4, "Already paid");
        if (p.getState() == PaymentState.CANCELLED || p.getState() == PaymentState.REFUNDED)
            return err(req, -9, "Transaction cancelled");

        // 6. persist prepare
        p.setProviderTransactionId(String.valueOf(req.getClickTransId()));
        p.setMerchantPrepareId(p.getId()); // our prepare id = payment id (stable)
        p.setState(PaymentState.CREATED);
        p.setRawLastRequest("prepare");

        log.info("[click] PREPARE ok paymentId={} clickTxId={}", p.getId(), req.getClickTransId());
        return ClickCallbackResponse.ok(req.getClickTransId(), req.getMerchantTransId(), p.getMerchantPrepareId());
    }

    @Transactional
    public ClickCallbackResponse complete(ClickCallbackRequest req) {
        logRequest("complete", req);
        assertEnabled();

        if (req.getAction() == null || req.getAction() != 1)
            return err(req, -3, "Action not found");

        if (!verifySignature(req))
            return err(req, -1, "SIGN CHECK FAILED");

        Long paymentId;
        try { paymentId = Long.parseLong(req.getMerchantTransId()); }
        catch (NumberFormatException e) { return err(req, -6, "Transaction does not exist"); }

        Payment p;
        try { p = paymentService.requirePaymentForUpdate(paymentId); }
        catch (PaymentException e) { return err(req, -6, "Transaction does not exist"); }

        // idempotency — if we already handled this, just return OK (Click retries).
        if (p.getState() == PaymentState.PERFORMED) {
            log.info("[click] COMPLETE idempotent replay paymentId={}", p.getId());
            return ClickCallbackResponse.okConfirm(
                    req.getClickTransId(), req.getMerchantTransId(),
                    p.getMerchantPrepareId(), p.getId());
        }

        // client reported failure inside complete (error<0) — cancel
        if (req.getError() != null && req.getError() < 0) {
            if (p.getState() != PaymentState.CANCELLED && p.getState() != PaymentState.REFUNDED) {
                p.setState(PaymentState.CANCELLED);
                p.setCancelledAt(LocalDateTime.now());
                // ensure any previously granted access is removed
                accessService.revoke(p.getUser().getId(), p.getExamPackage().getId(),
                        "Click reported error=" + req.getError());
            }
            return ClickCallbackResponse.error(req.getClickTransId(), req.getMerchantTransId(),
                    -9, "Transaction cancelled");
        }

        if (req.getMerchantPrepareId() == null
                || !req.getMerchantPrepareId().equals(p.getMerchantPrepareId()))
            return err(req, -6, "Transaction does not exist");

        if (req.getAmount() == null || p.getAmount().compareTo(req.getAmount()) != 0)
            return err(req, -2, "Incorrect parameter amount");

        if (p.getState() == PaymentState.CANCELLED || p.getState() == PaymentState.REFUNDED)
            return err(req, -9, "Transaction cancelled");

        // All good — perform
        p.setState(PaymentState.PERFORMED);
        p.setPaidAt(LocalDateTime.now());
        p.setRawLastRequest("complete");

        accessService.grant(p.getUser(), p.getExamPackage(), p);

        log.info("[click] COMPLETE ok paymentId={} clickTxId={}", p.getId(), req.getClickTransId());
        return ClickCallbackResponse.okConfirm(
                req.getClickTransId(), req.getMerchantTransId(),
                p.getMerchantPrepareId(), p.getId());
    }

    /* ------------------------------------------------------------------ */
    /*  SIGNATURE                                                         */
    /* ------------------------------------------------------------------ */

    /**
     * sign_string = md5(
     *   click_trans_id + service_id + SECRET_KEY + merchant_trans_id
     *   + [merchant_prepare_id when action=1] + amount + action + sign_time
     * )
     */
    boolean verifySignature(ClickCallbackRequest r) {
        String secret = props.getClick().getSecretKey();
        if (secret == null || secret.isBlank()) {
            log.error("[click] secret_key not configured");
            return false;
        }

        StringBuilder raw = new StringBuilder()
                .append(nz(r.getClickTransId()))
                .append(nz(r.getServiceId()))
                .append(secret)
                .append(nz(r.getMerchantTransId()));
        if (r.getAction() != null && r.getAction() == 1)
            raw.append(nz(r.getMerchantPrepareId()));
        raw.append(formatAmount(r.getAmount()))
                .append(nz(r.getAction()))
                .append(nz(r.getSignTime()));

        String computed = md5Hex(raw.toString());
        boolean ok = computed.equalsIgnoreCase(r.getSignString());
        if (!ok) {
            log.warn("[click] sign check failed  computed={}  got={}", computed, r.getSignString());
        }
        return ok;
    }

    private static String nz(Object o) { return o == null ? "" : o.toString(); }

    /**
     * Click includes amount as submitted — keep trailing .00 if sent that way.
     * We normalize to what matches `amount` in the callback string exactly.
     */
    private static String formatAmount(BigDecimal a) {
        if (a == null) return "";
        // Strip trailing zeros beyond scale but keep integer-style if whole number
        BigDecimal v = a.stripTrailingZeros();
        return v.scale() < 0 ? v.setScale(0, java.math.RoundingMode.UNNECESSARY).toPlainString()
                             : v.toPlainString();
    }

    static String md5Hex(String s) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(s.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("MD5 unavailable", e);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  URL                                                               */
    /* ------------------------------------------------------------------ */

    public String buildCheckoutUrl(Long paymentId, BigDecimal amount) {
        String returnUrl = URLEncoder.encode(
                props.getFrontendBaseUrl() + props.getClick().getReturnPath() + "?payment=" + paymentId,
                StandardCharsets.UTF_8);
        return String.format(
                "%s?service_id=%d&merchant_id=%d&amount=%s&transaction_param=%d&return_url=%s",
                props.getClick().getCheckoutUrl(),
                props.getClick().getServiceId(),
                props.getClick().getMerchantId(),
                formatAmount(amount),
                paymentId,
                returnUrl);
    }

    /* ------------------------------------------------------------------ */

    private void assertEnabled() {
        if (!props.isEnabled() || !props.getClick().isEnabled())
            throw PaymentException.badRequest("Click payments are disabled");
        if (props.getClick().getServiceId() == null
                || props.getClick().getMerchantId() == null
                || props.getClick().getSecretKey() == null) {
            throw PaymentException.badRequest("Click is not configured (set app.payment.click.*)");
        }
    }

    private static ClickCallbackResponse err(ClickCallbackRequest r, int code, String note) {
        return ClickCallbackResponse.error(r.getClickTransId(), r.getMerchantTransId(), code, note);
    }

    private static void logRequest(String action, ClickCallbackRequest r) {
        log.info("[click] <- {} clickTxId={} merchantTxId={} action={} amount={} prepareId={}",
                action, r.getClickTransId(), r.getMerchantTransId(), r.getAction(), r.getAmount(),
                r.getMerchantPrepareId());
    }
}
