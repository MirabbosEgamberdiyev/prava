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
import uz.pravaimtihon.payment.entity.Payment;
import uz.pravaimtihon.payment.enums.PaymentProvider;
import uz.pravaimtihon.payment.enums.PaymentState;
import uz.pravaimtihon.payment.exception.PaymentException;
import uz.pravaimtihon.payment.repository.PaymentRepository;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * inPAY.uz Payment Gateway Service.
 *
 * Supports payment via Click, Payme, Uzcard, Humo, and international cards.
 *
 * Flow:
 * 1. User selects a package and chooses inPAY.
 * 2. Backend gets/refreshes a dynamic Bearer token from GET /api/v1/authorization/?merchant_id=...&merchant_token=...
 * 3. Backend creates a PENDING payment record and requests inPAY via POST /api/v1/create/.
 * 4. inPAY returns a hosted checkout URL (pay_url) and generated order_id.
 * 5. User is redirected to pay_url to complete payment.
 * 6. inPAY notifies our webhook POST /api/v1/payment/inpay/webhook with HMAC-SHA256 signature.
 * 7. We verify the signature, mark payment as PERFORMED, and grant package access.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InPayService {

    private final PaymentService       paymentService;
    private final PaymentAccessService accessService;
    private final PaymentProperties    props;
    private final ObjectMapper         objectMapper;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private volatile String cachedBearerToken = null;
    private volatile long tokenExpiresAt = 0;

    /* ------------------------------------------------------------------ */
    /*  PUBLIC API — create invoice                                       */
    /* ------------------------------------------------------------------ */

    @Transactional
    public InvoiceResponse createInvoice(User user, ExamPackage pkg) {
        assertEnabled();

        PaymentProperties.Inpay inpayProps = props.getInpay();
        String merchantId = inpayProps.getMerchantId() != null ? String.valueOf(inpayProps.getMerchantId()) : null;
        String merchantToken = inpayProps.getApiToken();
        if (merchantToken == null || merchantToken.isBlank()) {
            throw PaymentException.badRequest("InPAY API token is not configured");
        }

        Payment p = paymentService.createPending(user, pkg, PaymentProvider.INPAY);

        String returnUrl = props.getFrontendBaseUrl() + inpayProps.getReturnPath()
                + "?payment=" + p.getId();
        String callbackUrl = props.getFrontendBaseUrl() + "/api/v1/payment/inpay/webhook";

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("amount", pkg.getPrice().longValue());
        requestBody.put("order_id", p.getMerchantOrderId());
        requestBody.put("callback_url", callbackUrl);
        requestBody.put("return_url", returnUrl);

        String desc = pkg.getNameUzl() != null && !pkg.getNameUzl().isBlank()
                ? pkg.getNameUzl()
                : "Paket #" + pkg.getId();
        requestBody.put("description", "Prava Online: " + desc);

        if (merchantId != null && !merchantId.isBlank()) {
            requestBody.put("merchant_id", merchantId);
        }
        requestBody.put("token", merchantToken);

        if (user.getPhoneNumber() != null && !user.getPhoneNumber().isBlank()) {
            String cleanPhone = user.getPhoneNumber().replaceAll("[^0-9]", "");
            if (!cleanPhone.isBlank()) {
                requestBody.put("phone", cleanPhone);
            }
        }

        String jsonPayload;
        try {
            jsonPayload = objectMapper.writeValueAsString(requestBody);
        } catch (Exception e) {
            log.error("[inpay] JSON serialization error", e);
            throw PaymentException.badRequest("Internal error serializing inPAY request");
        }

        String endpoint = buildCreateEndpoint(inpayProps.getApiUrl());
        log.info("[inpay] creating invoice paymentId={} merchantOrderId={} amount={} endpoint={}",
                p.getId(), p.getMerchantOrderId(), p.getAmount(), endpoint);

        HttpResponse<String> response = sendCreateRequest(endpoint, jsonPayload, false);
        int statusCode = response.statusCode();
        String responseBody = response.body();
        log.info("[inpay] response received status={} body={}", statusCode, responseBody);

        // Check if Bearer token expired and retry once
        if (statusCode == 401 || (responseBody != null && responseBody.contains("INVALID_TOKEN"))) {
            log.warn("[inpay] bearer token expired or invalid, refreshing and retrying...");
            invalidateBearerToken();
            response = sendCreateRequest(endpoint, jsonPayload, true);
            statusCode = response.statusCode();
            responseBody = response.body();
            log.info("[inpay] retry response received status={} body={}", statusCode, responseBody);
        }

        JsonNode root = null;
        try {
            if (responseBody != null && !responseBody.isBlank()) {
                root = objectMapper.readTree(responseBody);
            }
        } catch (Exception ignored) {}

        if (statusCode < 200 || statusCode >= 300) {
            log.error("[inpay] create invoice returned HTTP error status={} body={}", statusCode, responseBody);
            String errorMsg = extractErrorMessage(root, "inPAY hisob-faktura yaratishda xatolik (" + statusCode + ")");
            throw PaymentException.badRequest(errorMsg);
        }

        if (root != null && root.hasNonNull("success") && !root.get("success").asBoolean()) {
            String errorMsg = extractErrorMessage(root, "inPAY hisob-faktura rad etildi");
            throw PaymentException.badRequest(errorMsg);
        }

        String payUrl = extractPayUrl(responseBody);
        if (payUrl == null || payUrl.isBlank()) {
            log.error("[inpay] pay_url missing in inPAY response body: {}", responseBody);
            String errorMsg = extractErrorMessage(root, "inPAY to'lov havolasi qaytmadi");
            throw PaymentException.badRequest(errorMsg);
        }

        if (root != null) {
            String returnedOrderId = getFirstNonBlank(root, "order_id", "transaction_id", "id");
            if (returnedOrderId != null && !returnedOrderId.isBlank()) {
                p.setProviderTransactionId(returnedOrderId);
            }
        }

        p.setRawLastRequest("create_invoice_success");
        paymentService.repository().save(p);

        log.info("[inpay] invoice created successfully paymentId={} url={}", p.getId(), payUrl);

        return InvoiceResponse.builder()
                .paymentId(p.getId())
                .merchantOrderId(p.getMerchantOrderId())
                .packageId(pkg.getId())
                .amount(p.getAmount())
                .provider(PaymentProvider.INPAY)
                .redirectUrl(payUrl)
                .build();
    }

    private HttpResponse<String> sendCreateRequest(String endpoint, String jsonPayload, boolean forceRefresh) {
        String bearerToken = getOrFetchBearerToken(forceRefresh);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Bearer " + bearerToken.trim())
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                .build();

        try {
            return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException | InterruptedException e) {
            log.error("[inpay] HTTP request to inPAY failed", e);
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw PaymentException.badRequest("inPAY to'lov shlyuziga ulanishda xatolik yuz berdi");
        }
    }

    private synchronized void invalidateBearerToken() {
        this.cachedBearerToken = null;
        this.tokenExpiresAt = 0;
    }

    private synchronized String getOrFetchBearerToken(boolean forceRefresh) {
        long now = System.currentTimeMillis();
        if (!forceRefresh && cachedBearerToken != null && now < tokenExpiresAt) {
            return cachedBearerToken;
        }

        PaymentProperties.Inpay inpayProps = props.getInpay();
        String merchantId = inpayProps.getMerchantId() != null ? String.valueOf(inpayProps.getMerchantId()) : null;
        String merchantToken = inpayProps.getApiToken();

        if (merchantId == null || merchantId.isBlank() || merchantToken == null || merchantToken.isBlank()) {
            throw PaymentException.badRequest("InPAY merchant_id yoki api_token sozlanmagan");
        }

        String authUrl = buildAuthEndpoint(inpayProps.getApiUrl(), merchantId, merchantToken);
        log.info("[inpay] requesting bearer token for merchant_id={}", merchantId);

        HttpRequest authRequest = HttpRequest.newBuilder()
                .uri(URI.create(authUrl))
                .timeout(Duration.ofSeconds(10))
                .header("Accept", "application/json")
                .GET()
                .build();

        try {
            HttpResponse<String> response = httpClient.send(authRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.error("[inpay] auth endpoint error: status={} body={}", response.statusCode(), response.body());
                throw PaymentException.badRequest("InPAY avtorizatsiyadan o'tolmadi (" + response.statusCode() + ")");
            }

            JsonNode node = objectMapper.readTree(response.body());
            if (node.hasNonNull("bearer_token")) {
                String token = node.get("bearer_token").asText();
                this.cachedBearerToken = token;
                // InPAY bearer token is valid for 24h, cache for 20h
                this.tokenExpiresAt = System.currentTimeMillis() + Duration.ofHours(20).toMillis();
                log.info("[inpay] acquired new bearer token successfully");
                return token;
            } else {
                String msg = extractErrorMessage(node, "InPAY bearer_token olinmadi");
                throw PaymentException.badRequest(msg);
            }
        } catch (IOException | InterruptedException e) {
            log.error("[inpay] network error requesting bearer token", e);
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw PaymentException.badRequest("InPAY avtorizatsiya so'rovida aloqa xatosi");
        }
    }

    private String buildAuthEndpoint(String apiUrl, String merchantId, String merchantToken) {
        String base = (apiUrl != null && !apiUrl.isBlank()) ? apiUrl.trim() : "https://inpay.uz/api/v1";
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return base + "/authorization/?merchant_id="
                + URLEncoder.encode(merchantId.trim(), StandardCharsets.UTF_8)
                + "&merchant_token="
                + URLEncoder.encode(merchantToken.trim(), StandardCharsets.UTF_8);
    }

    private String extractErrorMessage(JsonNode node, String defaultMsg) {
        if (node != null) {
            if (node.hasNonNull("message")) return node.get("message").asText();
            if (node.hasNonNull("error")) return node.get("error").asText();
            if (node.hasNonNull("error_code")) return node.get("error_code").asText();
        }
        return defaultMsg;
    }

    /* ------------------------------------------------------------------ */
    /*  WEBHOOK PROCESSING                                                */
    /* ------------------------------------------------------------------ */

    @Transactional
    public void handleWebhook(byte[] rawBody, String signatureHeader) {
        assertEnabled();

        if (rawBody == null || rawBody.length == 0) {
            throw PaymentException.badRequest("Empty webhook body");
        }

        // 1. Signature check
        if (!verifySignature(rawBody, signatureHeader)) {
            log.error("[inpay-webhook] signature verification failed");
            throw PaymentException.unauthorized("Invalid X-InPAY-Signature");
        }

        // 2. Parse JSON payload
        JsonNode root;
        try {
            root = objectMapper.readTree(rawBody);
        } catch (Exception e) {
            log.error("[inpay-webhook] JSON parsing error", e);
            throw PaymentException.badRequest("Malformed JSON body");
        }

        log.info("[inpay-webhook] parsed payload: {}", root);

        String orderId = getFirstNonBlank(root, "order_id", "orderId");
        String txId = getFirstNonBlank(root, "transaction_id", "transactionId", "id");
        String status = getFirstNonBlank(root, "status", "event", "state");

        if (orderId == null || orderId.isBlank()) {
            log.error("[inpay-webhook] missing order_id in webhook");
            throw PaymentException.badRequest("Missing order_id");
        }

        // 3. Resolve payment record
        PaymentRepository repo = paymentService.repository();
        Payment payment = resolvePayment(orderId, txId, repo)
                .orElseThrow(() -> {
                    log.error("[inpay-webhook] Payment not found for orderId={} txId={}", orderId, txId);
                    return PaymentException.notFound("Payment not found for order_id: " + orderId);
                });

        // Pessimistic lock to prevent race conditions
        Payment p = repo.findByIdForUpdate(payment.getId()).orElse(payment);

        // 4. Idempotency guard: if already performed, return cleanly
        if (p.getState() == PaymentState.PERFORMED) {
            log.info("[inpay-webhook] idempotent replay for already PERFORMED paymentId={}", p.getId());
            return;
        }

        boolean isSuccess = isSuccessStatus(status);
        boolean isCancelled = isCancelledStatus(status);

        if (isSuccess) {
            p.setState(PaymentState.PERFORMED);
            p.setPaidAt(LocalDateTime.now());
            if (txId != null && !txId.isBlank()) {
                p.setProviderTransactionId(txId);
            }
            p.setRawLastRequest(new String(rawBody, StandardCharsets.UTF_8));
            repo.save(p);

            // Grant package access
            accessService.grant(p.getUser(), p.getExamPackage(), p);
            log.info("[inpay-webhook] payment PERFORMED and access granted: paymentId={} userId={} packageId={}",
                    p.getId(), p.getUser().getId(), p.getExamPackage().getId());
        } else if (isCancelled) {
            p.setState(PaymentState.CANCELLED);
            p.setCancelledAt(LocalDateTime.now());
            p.setRawLastRequest(new String(rawBody, StandardCharsets.UTF_8));
            repo.save(p);

            accessService.revoke(p.getUser().getId(), p.getExamPackage().getId(), "InPAY status=" + status);
            log.info("[inpay-webhook] payment CANCELLED: paymentId={} userId={} packageId={}",
                    p.getId(), p.getUser().getId(), p.getExamPackage().getId());
        } else {
            log.warn("[inpay-webhook] unhandled status '{}' for paymentId={}, raw={}", status, p.getId(), root);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  HELPERS                                                           */
    /* ------------------------------------------------------------------ */

    private void assertEnabled() {
        if (!props.isEnabled()) {
            throw PaymentException.badRequest("Payment module is disabled");
        }
        if (!props.getInpay().isEnabled()) {
            throw PaymentException.badRequest("InPAY provider is disabled");
        }
    }

    private String buildCreateEndpoint(String apiUrl) {
        String base = (apiUrl != null && !apiUrl.isBlank()) ? apiUrl.trim() : "https://inpay.uz/api/v1";
        if (base.endsWith("/")) {
            return base + "create/";
        }
        return base + "/create/";
    }

    private String extractPayUrl(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            if (root.hasNonNull("pay_url")) return root.get("pay_url").asText();
            if (root.hasNonNull("url")) return root.get("url").asText();
            if (root.hasNonNull("pay_url_link")) return root.get("pay_url_link").asText();
            if (root.hasNonNull("redirect_url")) return root.get("redirect_url").asText();
            if (root.hasNonNull("payment_url")) return root.get("payment_url").asText();

            // Nested data.pay_url check
            if (root.has("data") && root.get("data").isObject()) {
                JsonNode data = root.get("data");
                if (data.hasNonNull("pay_url")) return data.get("pay_url").asText();
                if (data.hasNonNull("url")) return data.get("url").asText();
            }
        } catch (Exception e) {
            log.error("[inpay] failed to parse response JSON: {}", responseBody, e);
        }
        return null;
    }

    private Optional<Payment> resolvePayment(String orderId, String txId, PaymentRepository repo) {
        // 1. By merchant order ID (e.g. PR-INPAY-...)
        if (orderId != null && !orderId.isBlank()) {
            Optional<Payment> byMerchantId = repo.findByMerchantOrderId(orderId);
            if (byMerchantId.isPresent()) {
                return byMerchantId;
            }
        }

        // 2. By provider transaction ID (matching inPAY's returned order_id or transaction_id)
        if (orderId != null && !orderId.isBlank()) {
            Optional<Payment> byTx = repo.findByProviderAndProviderTransactionId(PaymentProvider.INPAY, orderId);
            if (byTx.isPresent()) {
                return byTx;
            }
        }
        if (txId != null && !txId.isBlank()) {
            Optional<Payment> byTx = repo.findByProviderAndProviderTransactionId(PaymentProvider.INPAY, txId);
            if (byTx.isPresent()) {
                return byTx;
            }
        }

        // 3. By numeric ID
        try {
            Long numericId = Long.parseLong(orderId);
            Optional<Payment> byId = repo.findById(numericId);
            if (byId.isPresent()) {
                return byId;
            }
        } catch (NumberFormatException ignored) {}

        return Optional.empty();
    }

    boolean verifySignature(byte[] rawBody, String signatureHeader) {
        String secret = props.getInpay().getWebhookSecret();
        if (secret == null || secret.isBlank()) {
            // Webhook secret not set (e.g. initial dev setup)
            log.warn("[inpay-webhook] INPAY_WEBHOOK_SECRET is not set, skipping HMAC-SHA256 verification");
            return true;
        }

        if (signatureHeader == null || signatureHeader.isBlank()) {
            log.error("[inpay-webhook] missing X-InPAY-Signature header");
            return false;
        }

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.trim().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hmacBytes = mac.doFinal(rawBody);

            StringBuilder hex = new StringBuilder(hmacBytes.length * 2);
            for (byte b : hmacBytes) {
                hex.append(String.format("%02x", b));
            }
            String calculatedHex = hex.toString();

            boolean matchesHex = MessageDigest.isEqual(
                    calculatedHex.getBytes(StandardCharsets.UTF_8),
                    signatureHeader.trim().toLowerCase().getBytes(StandardCharsets.UTF_8)
            );

            if (matchesHex) return true;

            // Fallback: check base64 if provider sent base64
            String calculatedBase64 = java.util.Base64.getEncoder().encodeToString(hmacBytes);
            return MessageDigest.isEqual(
                    calculatedBase64.getBytes(StandardCharsets.UTF_8),
                    signatureHeader.trim().getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            log.error("[inpay-webhook] error verifying HMAC-SHA256 signature", e);
            return false;
        }
    }

    private boolean isSuccessStatus(String status) {
        if (status == null) return false;
        String s = status.trim().toLowerCase();
        return s.equals("success")
                || s.equals("completed")
                || s.equals("paid")
                || s.equals("payment.success")
                || s.equals("performed")
                || s.equals("ok");
    }

    private boolean isCancelledStatus(String status) {
        if (status == null) return false;
        String s = status.trim().toLowerCase();
        return s.equals("failed")
                || s.equals("cancelled")
                || s.equals("canceled")
                || s.equals("rejected")
                || s.equals("payment.failed");
    }

    private String getFirstNonBlank(JsonNode node, String... fieldNames) {
        for (String f : fieldNames) {
            if (node.hasNonNull(f)) {
                String val = node.get(f).asText();
                if (val != null && !val.isBlank()) {
                    return val.trim();
                }
            }
        }
        return null;
    }
}
