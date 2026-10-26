package uz.pravaimtihon.payment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import uz.pravaimtihon.entity.ExamPackage;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.payment.config.PaymentProperties;
import uz.pravaimtihon.payment.entity.Payment;
import uz.pravaimtihon.payment.enums.PaymentProvider;
import uz.pravaimtihon.payment.enums.PaymentState;
import uz.pravaimtihon.payment.exception.PaymentException;
import uz.pravaimtihon.payment.repository.PaymentRepository;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InPaySignatureTest {

    @Mock
    private PaymentService paymentService;

    @Mock
    private PaymentAccessService accessService;

    @Mock
    private PaymentRepository paymentRepo;

    private PaymentProperties props;
    private ObjectMapper objectMapper;
    private InPayService inPayService;

    @BeforeEach
    void setUp() {
        props = new PaymentProperties();
        props.setEnabled(true);
        props.getInpay().setEnabled(true);
        props.getInpay().setWebhookSecret("test-secret-key-123");

        objectMapper = new ObjectMapper();
        inPayService = new InPayService(paymentService, accessService, props, objectMapper);
    }

    private static String computeHmacHex(String secret, byte[] data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] bytes = mac.doFinal(data);
        StringBuilder hex = new StringBuilder();
        for (byte b : bytes) {
            hex.append(String.format("%02x", b));
        }
        return hex.toString();
    }

    @Test
    void validHmacSignatureIsAccepted() throws Exception {
        byte[] body = "{\"status\":\"success\",\"order_id\":\"PR-INPAY-123\",\"amount\":50000}".getBytes(StandardCharsets.UTF_8);
        String validSig = computeHmacHex("test-secret-key-123", body);

        assertThat(inPayService.verifySignature(body, validSig)).isTrue();
    }

    @Test
    void tamperedBodyIsRejected() throws Exception {
        byte[] body = "{\"status\":\"success\",\"order_id\":\"PR-INPAY-123\",\"amount\":50000}".getBytes(StandardCharsets.UTF_8);
        String sig = computeHmacHex("test-secret-key-123", body);

        byte[] tamperedBody = "{\"status\":\"success\",\"order_id\":\"PR-INPAY-123\",\"amount\":99999}".getBytes(StandardCharsets.UTF_8);
        assertThat(inPayService.verifySignature(tamperedBody, sig)).isFalse();
    }

    @Test
    void wrongSecretIsRejected() throws Exception {
        byte[] body = "{\"status\":\"success\",\"order_id\":\"PR-INPAY-123\"}".getBytes(StandardCharsets.UTF_8);
        String wrongSig = computeHmacHex("wrong-secret", body);

        assertThat(inPayService.verifySignature(body, wrongSig)).isFalse();
    }

    @Test
    void missingSignatureHeaderIsRejectedWhenSecretIsConfigured() {
        byte[] body = "{\"status\":\"success\"}".getBytes(StandardCharsets.UTF_8);
        assertThat(inPayService.verifySignature(body, null)).isFalse();
        assertThat(inPayService.verifySignature(body, "")).isFalse();
        assertThat(inPayService.verifySignature(body, "   ")).isFalse();
    }

    @Test
    void missingSecretAllowsWebhookForDevSetup() {
        props.getInpay().setWebhookSecret(null);
        byte[] body = "{\"status\":\"success\"}".getBytes(StandardCharsets.UTF_8);
        assertThat(inPayService.verifySignature(body, null)).isTrue();
    }

    @Test
    void webhookSuccessfullyPerformsPaymentAndGrantsAccess() throws Exception {
        String orderId = "PR-INPAY-ABC1234567";
        byte[] body = ("{\"status\":\"success\",\"order_id\":\"" + orderId + "\",\"transaction_id\":\"tx-999\",\"amount\":50000}")
                .getBytes(StandardCharsets.UTF_8);
        String sig = computeHmacHex("test-secret-key-123", body);

        User mockUser = new User();
        mockUser.setId(10L);

        ExamPackage mockPkg = new ExamPackage();
        mockPkg.setId(5L);
        mockPkg.setPrice(BigDecimal.valueOf(50000));

        Payment mockPayment = Payment.builder()
                .user(mockUser)
                .examPackage(mockPkg)
                .amount(BigDecimal.valueOf(50000))
                .provider(PaymentProvider.INPAY)
                .state(PaymentState.PENDING)
                .merchantOrderId(orderId)
                .build();
        mockPayment.setId(100L);

        when(paymentService.repository()).thenReturn(paymentRepo);
        when(paymentRepo.findByMerchantOrderId(orderId)).thenReturn(Optional.of(mockPayment));
        when(paymentRepo.findByIdForUpdate(100L)).thenReturn(Optional.of(mockPayment));

        inPayService.handleWebhook(body, sig);

        assertThat(mockPayment.getState()).isEqualTo(PaymentState.PERFORMED);
        assertThat(mockPayment.getPaidAt()).isNotNull();
        assertThat(mockPayment.getProviderTransactionId()).isEqualTo("tx-999");

        verify(paymentRepo).save(mockPayment);
        verify(accessService).grant(mockUser, mockPkg, mockPayment);
    }

    @Test
    void webhookIdempotentReplayDoesNotDuplicateGrant() throws Exception {
        String orderId = "PR-INPAY-ABC1234567";
        byte[] body = ("{\"status\":\"success\",\"order_id\":\"" + orderId + "\"}")
                .getBytes(StandardCharsets.UTF_8);
        String sig = computeHmacHex("test-secret-key-123", body);

        Payment alreadyPerformed = Payment.builder()
                .state(PaymentState.PERFORMED)
                .merchantOrderId(orderId)
                .build();
        alreadyPerformed.setId(100L);

        when(paymentService.repository()).thenReturn(paymentRepo);
        when(paymentRepo.findByMerchantOrderId(orderId)).thenReturn(Optional.of(alreadyPerformed));
        when(paymentRepo.findByIdForUpdate(100L)).thenReturn(Optional.of(alreadyPerformed));

        inPayService.handleWebhook(body, sig);

        verify(paymentRepo, never()).save(any());
        verify(accessService, never()).grant(any(), any(), any());
    }

    @Test
    void webhookRejectsInvalidSignature() {
        byte[] body = "{\"status\":\"success\",\"order_id\":\"PR-INPAY-123\"}".getBytes(StandardCharsets.UTF_8);
        assertThatThrownBy(() -> inPayService.handleWebhook(body, "invalid-sig"))
                .isInstanceOf(PaymentException.class)
                .hasMessageContaining("Invalid X-InPAY-Signature");
    }
}
