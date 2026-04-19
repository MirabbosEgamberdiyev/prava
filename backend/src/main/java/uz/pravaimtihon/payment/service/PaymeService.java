package uz.pravaimtihon.payment.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.entity.ExamPackage;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.payment.config.PaymentProperties;
import uz.pravaimtihon.payment.dto.InvoiceResponse;
import uz.pravaimtihon.payment.dto.payme.JsonRpcError;
import uz.pravaimtihon.payment.dto.payme.JsonRpcRequest;
import uz.pravaimtihon.payment.dto.payme.JsonRpcResponse;
import uz.pravaimtihon.payment.entity.Payment;
import uz.pravaimtihon.payment.enums.PaymeErrorCode;
import uz.pravaimtihon.payment.enums.PaymentProvider;
import uz.pravaimtihon.payment.enums.PaymentState;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

/**
 * Payme Merchant API (JSON-RPC 2.0) implementation.
 *
 * Methods:
 *   CheckPerformTransaction
 *   CreateTransaction
 *   PerformTransaction
 *   CancelTransaction
 *   CheckTransaction
 *   GetStatement
 *
 * Amount units:  Payme uses TIYIN everywhere.  1 so'm = 100 tiyin.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymeService {

    private static final long PAYME_TIMEOUT_MS = 12L * 60L * 60L * 1000L;   // 12h

    private final PaymentService       paymentService;
    private final PaymentAccessService accessService;
    private final PaymentProperties    props;
    private final ObjectMapper         objectMapper;

    /* ------------------------------------------------------------------ */
    /*  Entry point                                                       */
    /* ------------------------------------------------------------------ */

    public JsonRpcResponse handle(String authHeader, JsonRpcRequest req) {
        if (!props.isEnabled() || !props.getPayme().isEnabled())
            return JsonRpcResponse.err(req == null ? null : req.getId(), unauthorized("Payme disabled"));

        if (!verifyAuth(authHeader))
            return JsonRpcResponse.err(req == null ? null : req.getId(), unauthorized("Bad basic auth"));

        if (req == null || req.getMethod() == null)
            return JsonRpcResponse.err(null, JsonRpcError.of(PaymeErrorCode.INVALID_REQUEST,
                    "Empty request", "Bo'sh so'rov", "Пустой запрос", null));

        log.info("[payme] <- method={} id={} params={}", req.getMethod(), req.getId(), req.getParams());

        try {
            return switch (req.getMethod()) {
                case "CheckPerformTransaction" -> checkPerformTransaction(req);
                case "CreateTransaction"       -> createTransaction(req);
                case "PerformTransaction"      -> performTransaction(req);
                case "CancelTransaction"       -> cancelTransaction(req);
                case "CheckTransaction"        -> checkTransaction(req);
                case "GetStatement"            -> getStatement(req);
                default -> JsonRpcResponse.err(req.getId(), JsonRpcError.of(
                        PaymeErrorCode.METHOD_NOT_FOUND,
                        "Method not found", "Metod topilmadi", "Метод не найден",
                        "method"));
            };
        } catch (Exception e) {
            log.error("[payme] unhandled error on method={}", req.getMethod(), e);
            return JsonRpcResponse.err(req.getId(), JsonRpcError.of(
                    PaymeErrorCode.INTERNAL_ERROR,
                    "Internal error", "Ichki xato", "Внутренняя ошибка",
                    null));
        }
    }

    /* ==================================================================
     *  METHOD:  CheckPerformTransaction
     * ================================================================== */
    @Transactional(readOnly = true)
    protected JsonRpcResponse checkPerformTransaction(JsonRpcRequest req) {
        JsonNode p = req.getParams();
        Long amountTiyin = asLong(p.get("amount"));
        Long packageId   = extractAccountOrderId(p);
        Long userId      = extractAccountUserId(p);

        if (packageId == null)
            return JsonRpcResponse.err(req.getId(), JsonRpcError.of(
                    PaymeErrorCode.ACCOUNT_NOT_FOUND,
                    "order_id missing", "order_id yo'q", "order_id отсутствует",
                    "order_id"));

        ExamPackage pkg;
        try { pkg = paymentService.requirePackage(packageId); }
        catch (Exception e) {
            return JsonRpcResponse.err(req.getId(), JsonRpcError.of(
                    PaymeErrorCode.ACCOUNT_NOT_FOUND,
                    "Order not found", "Buyurtma topilmadi", "Заказ не найден", "order_id"));
        }

        try { paymentService.guardPaymentAllowed(pkg); }
        catch (Exception e) {
            return JsonRpcResponse.err(req.getId(), JsonRpcError.of(
                    PaymeErrorCode.CANNOT_PERFORM_OPERATION,
                    e.getMessage(), "Bajarib bo'lmaydi", "Нельзя выполнить", null));
        }

        if (amountTiyin == null || !tiyinEquals(pkg.getPrice(), amountTiyin))
            return JsonRpcResponse.err(req.getId(), JsonRpcError.of(
                    PaymeErrorCode.INVALID_AMOUNT,
                    "Wrong amount", "Noto'g'ri summa", "Неверная сумма", "amount"));

        if (userId != null) {
            try { paymentService.requireUser(userId); }
            catch (Exception e) {
                return JsonRpcResponse.err(req.getId(), JsonRpcError.of(
                        PaymeErrorCode.ACCOUNT_NOT_FOUND,
                        "User not found", "Foydalanuvchi topilmadi",
                        "Пользователь не найден", "user_id"));
            }
            if (accessService.hasActiveAccess(userId, packageId))
                return JsonRpcResponse.err(req.getId(), JsonRpcError.of(
                        PaymeErrorCode.ORDER_ALREADY_PAID,
                        "Already paid", "Allaqachon to'langan", "Уже оплачено", null));
        }

        return JsonRpcResponse.ok(req.getId(), Map.of("allow", true));
    }

    /* ==================================================================
     *  METHOD:  CreateTransaction
     * ================================================================== */
    @Transactional
    protected JsonRpcResponse createTransaction(JsonRpcRequest req) {
        JsonNode p = req.getParams();
        String paymeId    = asText(p.get("id"));
        Long   amountTiyn = asLong(p.get("amount"));
        Long   time       = asLong(p.get("time"));
        Long   packageId  = extractAccountOrderId(p);
        Long   userId     = extractAccountUserId(p);
        Long   paymentId  = extractAccountPaymentId(p);

        if (paymeId == null)
            return JsonRpcResponse.err(req.getId(), JsonRpcError.of(
                    PaymeErrorCode.INVALID_REQUEST, "id missing", "id yo'q", "id отсутствует", "id"));

        // 1) idempotency — same paymeId already handled?
        Optional<Payment> byPayme = paymentService.repository()
                .findByProviderAndProviderTransactionId(PaymentProvider.PAYME, paymeId);
        if (byPayme.isPresent()) {
            Payment p0 = byPayme.get();
            if (p0.getState() == PaymentState.CREATED) {
                return JsonRpcResponse.ok(req.getId(), createTxResult(p0));
            }
            return JsonRpcResponse.err(req.getId(), JsonRpcError.of(
                    PaymeErrorCode.CANNOT_PERFORM_OPERATION,
                    "Cannot perform", "Bajarib bo'lmaydi", "Нельзя выполнить", "transaction"));
        }

        // 2) resolve package
        if (packageId == null)
            return JsonRpcResponse.err(req.getId(), JsonRpcError.of(
                    PaymeErrorCode.ACCOUNT_NOT_FOUND,
                    "order_id missing", "order_id yo'q", "order_id отсутствует", "order_id"));

        ExamPackage pkg;
        try { pkg = paymentService.requirePackage(packageId); }
        catch (Exception e) {
            return JsonRpcResponse.err(req.getId(), JsonRpcError.of(
                    PaymeErrorCode.ACCOUNT_NOT_FOUND,
                    "Order not found", "Buyurtma topilmadi", "Заказ не найден", "order_id"));
        }

        if (amountTiyn == null || !tiyinEquals(pkg.getPrice(), amountTiyn))
            return JsonRpcResponse.err(req.getId(), JsonRpcError.of(
                    PaymeErrorCode.INVALID_AMOUNT,
                    "Wrong amount", "Noto'g'ri summa", "Неверная сумма", "amount"));

        if (userId == null)
            return JsonRpcResponse.err(req.getId(), JsonRpcError.of(
                    PaymeErrorCode.ACCOUNT_NOT_FOUND,
                    "user_id missing", "user_id yo'q", "user_id отсутствует", "user_id"));

        User user;
        try { user = paymentService.requireUser(userId); }
        catch (Exception e) {
            return JsonRpcResponse.err(req.getId(), JsonRpcError.of(
                    PaymeErrorCode.ACCOUNT_NOT_FOUND,
                    "User not found", "Foydalanuvchi topilmadi",
                    "Пользователь не найден", "user_id"));
        }

        if (accessService.hasActiveAccess(userId, packageId))
            return JsonRpcResponse.err(req.getId(), JsonRpcError.of(
                    PaymeErrorCode.ORDER_ALREADY_PAID,
                    "Already paid", "Allaqachon to'langan", "Уже оплачено", null));

        // block duplicate CREATED transactions on same order
        if (paymentService.repository()
                .existsActiveCreatedFor(PaymentProvider.PAYME, userId, packageId))
            return JsonRpcResponse.err(req.getId(), JsonRpcError.of(
                    PaymeErrorCode.CANNOT_PERFORM_OPERATION,
                    "Another active transaction exists", "Boshqa faol tranzaktsiya mavjud",
                    "Существует другая активная транзакция", "transaction"));

        // 3) ADOPT existing PENDING if frontend created one via createCheckoutUrl
        //    (avoids double-insertion)
        Payment payment = null;
        if (paymentId != null) {
            var maybe = paymentService.repository().findByIdForUpdate(paymentId);
            if (maybe.isPresent()) {
                Payment cand = maybe.get();
                boolean matches = cand.getProvider() == PaymentProvider.PAYME
                        && cand.getState() == PaymentState.PENDING
                        && cand.getUser().getId().equals(userId)
                        && cand.getExamPackage().getId().equals(packageId);
                if (matches) payment = cand;
            }
        }
        if (payment == null) {
            payment = paymentService.createPending(user, pkg, PaymentProvider.PAYME);
        }

        payment.setProviderTransactionId(paymeId);
        payment.setPaymeCreateTime(time);
        payment.setPaymeStateCode(1);
        payment.setState(PaymentState.CREATED);
        payment.setRawLastRequest("CreateTransaction");

        return JsonRpcResponse.ok(req.getId(), createTxResult(payment));
    }

    /* ==================================================================
     *  METHOD:  PerformTransaction
     * ================================================================== */
    @Transactional
    protected JsonRpcResponse performTransaction(JsonRpcRequest req) {
        String paymeId = asText(req.getParams().get("id"));
        if (paymeId == null)
            return JsonRpcResponse.err(req.getId(), txNotFound());

        Payment p = paymentService.repository()
                .findByProviderTxForUpdate(PaymentProvider.PAYME, paymeId)
                .orElse(null);
        if (p == null) return JsonRpcResponse.err(req.getId(), txNotFound());

        // idempotent
        if (p.getState() == PaymentState.PERFORMED) {
            return JsonRpcResponse.ok(req.getId(), performTxResult(p));
        }

        if (p.getState() != PaymentState.CREATED)
            return JsonRpcResponse.err(req.getId(), JsonRpcError.of(
                    PaymeErrorCode.CANNOT_PERFORM_OPERATION,
                    "Cannot perform", "Bajarib bo'lmaydi", "Нельзя выполнить", "transaction"));

        // timeout check
        long createTime = p.getPaymeCreateTime() == null ? 0 : p.getPaymeCreateTime();
        if (createTime > 0 && Instant.now().toEpochMilli() - createTime > PAYME_TIMEOUT_MS) {
            p.setState(PaymentState.CANCELLED);
            p.setPaymeStateCode(-1);
            p.setPaymeCancelReason(4);
            p.setPaymeCancelTime(Instant.now().toEpochMilli());
            p.setCancelledAt(LocalDateTime.now());
            return JsonRpcResponse.err(req.getId(), JsonRpcError.of(
                    PaymeErrorCode.CANNOT_PERFORM_OPERATION,
                    "Transaction timeout", "Tranzaktsiya eskirgan", "Транзакция истекла", "transaction"));
        }

        long now = Instant.now().toEpochMilli();
        p.setPaymePerformTime(now);
        p.setPaymeStateCode(2);
        p.setState(PaymentState.PERFORMED);
        p.setPaidAt(LocalDateTime.now());
        p.setRawLastRequest("PerformTransaction");

        accessService.grant(p.getUser(), p.getExamPackage(), p);

        log.info("[payme] PERFORM paymentId={} paymeId={}", p.getId(), paymeId);
        return JsonRpcResponse.ok(req.getId(), performTxResult(p));
    }

    /* ==================================================================
     *  METHOD:  CancelTransaction
     * ================================================================== */
    @Transactional
    protected JsonRpcResponse cancelTransaction(JsonRpcRequest req) {
        String paymeId = asText(req.getParams().get("id"));
        Integer reason = asInt(req.getParams().get("reason"));

        if (paymeId == null)
            return JsonRpcResponse.err(req.getId(), txNotFound());

        Payment p = paymentService.repository()
                .findByProviderTxForUpdate(PaymentProvider.PAYME, paymeId)
                .orElse(null);
        if (p == null) return JsonRpcResponse.err(req.getId(), txNotFound());

        long now = Instant.now().toEpochMilli();

        // idempotent re-cancellation
        if (p.getState() == PaymentState.CANCELLED || p.getState() == PaymentState.REFUNDED)
            return JsonRpcResponse.ok(req.getId(), cancelTxResult(p));

        if (p.getState() == PaymentState.CREATED) {
            p.setState(PaymentState.CANCELLED);
            p.setPaymeStateCode(-1);
        } else if (p.getState() == PaymentState.PERFORMED) {
            // Refund flow — reverse the grant
            p.setState(PaymentState.REFUNDED);
            p.setPaymeStateCode(-2);
            accessService.revoke(p.getUser().getId(), p.getExamPackage().getId(),
                    "Payme cancellation reason=" + reason);
        } else {
            return JsonRpcResponse.err(req.getId(), JsonRpcError.of(
                    PaymeErrorCode.CANNOT_CANCEL_TRANSACTION,
                    "Cannot cancel", "Bekor qilib bo'lmaydi", "Нельзя отменить", "transaction"));
        }

        p.setPaymeCancelTime(now);
        p.setPaymeCancelReason(reason);
        p.setCancelledAt(LocalDateTime.now());
        p.setRawLastRequest("CancelTransaction");

        log.info("[payme] CANCEL paymentId={} state={} reason={}", p.getId(), p.getState(), reason);
        return JsonRpcResponse.ok(req.getId(), cancelTxResult(p));
    }

    /* ==================================================================
     *  METHOD:  CheckTransaction
     * ================================================================== */
    @Transactional(readOnly = true)
    protected JsonRpcResponse checkTransaction(JsonRpcRequest req) {
        String paymeId = asText(req.getParams().get("id"));
        if (paymeId == null) return JsonRpcResponse.err(req.getId(), txNotFound());

        Payment p = paymentService.repository()
                .findByProviderAndProviderTransactionId(PaymentProvider.PAYME, paymeId)
                .orElse(null);
        if (p == null) return JsonRpcResponse.err(req.getId(), txNotFound());

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("create_time",  p.getPaymeCreateTime()  == null ? 0 : p.getPaymeCreateTime());
        r.put("perform_time", p.getPaymePerformTime() == null ? 0 : p.getPaymePerformTime());
        r.put("cancel_time",  p.getPaymeCancelTime()  == null ? 0 : p.getPaymeCancelTime());
        r.put("transaction",  String.valueOf(p.getId()));
        r.put("state",        p.getPaymeStateCode()   == null ? 0 : p.getPaymeStateCode());
        r.put("reason",       p.getPaymeCancelReason());
        return JsonRpcResponse.ok(req.getId(), r);
    }

    /* ==================================================================
     *  METHOD:  GetStatement
     * ================================================================== */
    @Transactional(readOnly = true)
    protected JsonRpcResponse getStatement(JsonRpcRequest req) {
        Long from = asLong(req.getParams().get("from"));
        Long to   = asLong(req.getParams().get("to"));
        if (from == null || to == null)
            return JsonRpcResponse.err(req.getId(), JsonRpcError.of(
                    PaymeErrorCode.INVALID_PARAMS,
                    "from/to required", "from/to kerak", "Требуются from/to", null));

        LocalDateTime lFrom = LocalDateTime.ofInstant(Instant.ofEpochMilli(from), ZoneId.systemDefault());
        LocalDateTime lTo   = LocalDateTime.ofInstant(Instant.ofEpochMilli(to),   ZoneId.systemDefault());

        var list = paymentService.repository().findPerformedBetween(lFrom, lTo);
        List<Map<String, Object>> txs = new ArrayList<>(list.size());
        for (Payment p : list) {
            if (p.getProvider() != PaymentProvider.PAYME) continue;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id",           p.getProviderTransactionId());
            row.put("time",         p.getPaymeCreateTime() == null ? 0 : p.getPaymeCreateTime());
            row.put("amount",       p.getAmount().multiply(BigDecimal.valueOf(100)).longValueExact());
            row.put("account",      Map.of(
                    "order_id", String.valueOf(p.getExamPackage().getId()),
                    "user_id",  String.valueOf(p.getUser().getId())));
            row.put("create_time",  p.getPaymeCreateTime()  == null ? 0 : p.getPaymeCreateTime());
            row.put("perform_time", p.getPaymePerformTime() == null ? 0 : p.getPaymePerformTime());
            row.put("cancel_time",  p.getPaymeCancelTime()  == null ? 0 : p.getPaymeCancelTime());
            row.put("transaction",  String.valueOf(p.getId()));
            row.put("state",        p.getPaymeStateCode()   == null ? 0 : p.getPaymeStateCode());
            row.put("reason",       p.getPaymeCancelReason());
            row.put("receivers",    Collections.emptyList());
            txs.add(row);
        }
        return JsonRpcResponse.ok(req.getId(), Map.of("transactions", txs));
    }

    /* ==================================================================
     *  CHECKOUT URL
     * ================================================================== */

    @Transactional
    public InvoiceResponse createCheckoutUrl(User user, ExamPackage pkg) {
        assertEnabled();
        Payment p = paymentService.createPending(user, pkg, PaymentProvider.PAYME);

        long amountTiyin = pkg.getPrice().multiply(BigDecimal.valueOf(100)).longValueExact();
        // format: m=MERCHANT_ID;ac.order_id=PACKAGE_ID;ac.user_id=USER_ID;a=AMOUNT;c=RETURN_URL;l=uz
        String returnUrl = props.getFrontendBaseUrl() + props.getPayme().getReturnPath()
                + "?payment=" + p.getId();
        String params = "m=" + props.getPayme().getMerchantId()
                + ";ac.order_id=" + pkg.getId()
                + ";ac.user_id=" + user.getId()
                + ";ac.payment_id=" + p.getId()
                + ";a=" + amountTiyin
                + ";c=" + returnUrl
                + ";l=uz";
        String encoded = Base64.getEncoder().encodeToString(params.getBytes(StandardCharsets.UTF_8));
        String url = props.getPayme().getCheckoutBaseUrl() + "/" + encoded;

        log.info("[payme] invoice created paymentId={} amountTiyin={} url={}", p.getId(), amountTiyin, url);

        return InvoiceResponse.builder()
                .paymentId(p.getId())
                .merchantOrderId(p.getMerchantOrderId())
                .packageId(pkg.getId())
                .amount(pkg.getPrice())
                .provider(PaymentProvider.PAYME)
                .redirectUrl(url)
                .build();
    }

    /* ==================================================================
     *  AUTH & HELPERS
     * ================================================================== */

    boolean verifyAuth(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Basic "))
            return false;
        String decoded;
        try {
            decoded = new String(
                    Base64.getDecoder().decode(authHeader.substring("Basic ".length()).trim()),
                    StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) { return false; }

        String[] parts = decoded.split(":", 2);
        if (parts.length != 2) return false;
        if (!"Paycom".equals(parts[0])) return false;

        String given = parts[1];
        String prod  = props.getPayme().getCashboxKey();
        String test  = props.getPayme().getTestCashboxKey();
        return constantEq(given, prod) || constantEq(given, test);
    }

    private static boolean constantEq(String a, String b) {
        if (a == null || b == null || a.length() != b.length()) return false;
        int r = 0;
        for (int i = 0; i < a.length(); i++) r |= a.charAt(i) ^ b.charAt(i);
        return r == 0;
    }

    private static JsonRpcError unauthorized(String dbg) {
        return JsonRpcError.of(
                PaymeErrorCode.UNAUTHORIZED,
                "Unauthorized", "Ruxsat yo'q", "Не авторизован", dbg);
    }

    private static JsonRpcError txNotFound() {
        return JsonRpcError.of(
                PaymeErrorCode.TRANSACTION_NOT_FOUND,
                "Transaction not found", "Tranzaktsiya topilmadi",
                "Транзакция не найдена", "transaction");
    }

    private static Map<String, Object> createTxResult(Payment p) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("create_time", p.getPaymeCreateTime() == null ? Instant.now().toEpochMilli() : p.getPaymeCreateTime());
        r.put("transaction", String.valueOf(p.getId()));
        r.put("state",       p.getPaymeStateCode() == null ? 1 : p.getPaymeStateCode());
        return r;
    }

    private static Map<String, Object> performTxResult(Payment p) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("transaction",  String.valueOf(p.getId()));
        r.put("perform_time", p.getPaymePerformTime() == null ? Instant.now().toEpochMilli() : p.getPaymePerformTime());
        r.put("state",        p.getPaymeStateCode() == null ? 2 : p.getPaymeStateCode());
        return r;
    }

    private static Map<String, Object> cancelTxResult(Payment p) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("transaction", String.valueOf(p.getId()));
        r.put("cancel_time", p.getPaymeCancelTime() == null ? Instant.now().toEpochMilli() : p.getPaymeCancelTime());
        r.put("state",       p.getPaymeStateCode() == null ? -1 : p.getPaymeStateCode());
        return r;
    }

    private static Long extractAccountOrderId(JsonNode params) {
        if (params == null) return null;
        JsonNode acc = params.get("account");
        if (acc == null) return null;
        JsonNode n = acc.get("order_id");
        if (n == null) n = acc.get("package_id");
        return asLong(n);
    }

    private static Long extractAccountUserId(JsonNode params) {
        if (params == null) return null;
        JsonNode acc = params.get("account");
        if (acc == null) return null;
        return asLong(acc.get("user_id"));
    }

    private static Long extractAccountPaymentId(JsonNode params) {
        if (params == null) return null;
        JsonNode acc = params.get("account");
        if (acc == null) return null;
        JsonNode n = acc.get("payment_id");
        if (n == null) n = acc.get("paymentId");
        return asLong(n);
    }

    private static String asText(JsonNode n) {
        return (n == null || n.isNull()) ? null : n.asText(null);
    }

    private static Long asLong(JsonNode n) {
        if (n == null || n.isNull()) return null;
        if (n.isNumber()) return n.longValue();
        try { return Long.parseLong(n.asText()); } catch (NumberFormatException e) { return null; }
    }

    private static Integer asInt(JsonNode n) {
        if (n == null || n.isNull()) return null;
        if (n.isNumber()) return n.intValue();
        try { return Integer.parseInt(n.asText()); } catch (NumberFormatException e) { return null; }
    }

    private static boolean tiyinEquals(BigDecimal priceSum, long amountTiyin) {
        if (priceSum == null) return false;
        long expected = priceSum.multiply(BigDecimal.valueOf(100)).longValueExact();
        return expected == amountTiyin;
    }

    private void assertEnabled() {
        if (!props.isEnabled() || !props.getPayme().isEnabled())
            throw uz.pravaimtihon.payment.exception.PaymentException.badRequest("Payme payments are disabled");
        if (props.getPayme().getMerchantId() == null || props.getPayme().getCashboxKey() == null)
            throw uz.pravaimtihon.payment.exception.PaymentException.badRequest(
                    "Payme is not configured (set app.payment.payme.*)");
    }
}
