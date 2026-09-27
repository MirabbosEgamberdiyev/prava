package uz.pravaimtihon.service;

import org.junit.jupiter.api.Test;
import uz.pravaimtihon.dto.qr.QrPairingInitRequest;
import uz.pravaimtihon.dto.qr.QrPairingInitResponse;
import uz.pravaimtihon.enums.AcceptLanguage;

import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** B-01 / B-13 / B-18: QR juftlash — pollSecret, bir martalik iste'mol, bekor qilish. */
class QrPairingSessionStoreTest {

    private static QrPairingSessionStore store(boolean allowLegacy) {
        return new QrPairingSessionStore("https://example.test", allowLegacy);
    }

    private static QrPairingInitResponse init(QrPairingSessionStore store) {
        return store.createSession(QrPairingInitRequest.builder().deviceName("Desk").deviceUuid("uuid-1").build(),
                "10.0.0.5", "PravaDesktop/2.0");
    }

    @Test
    void pollSecretIsIssuedButNotInQrPayload() {
        QrPairingInitResponse r = init(store(true));
        assertThat(r.getPollSecret()).isNotBlank();
        assertThat(Base64.getUrlDecoder().decode(r.getPollSecret())).hasSize(32);
        assertThat(r.getQrPayload()).doesNotContain(r.getPollSecret());
        assertThat(r.getQrPayload()).contains(r.getSessionId()).contains(r.getChallenge());
    }

    @Test
    void wrongPollSecretIsRejectedEvenInLegacyMode() {
        QrPairingSessionStore store = store(true);
        QrPairingInitResponse r = init(store);
        assertThatThrownBy(() -> store.poll(r.getSessionId(), "not-the-secret"))
                .isInstanceOf(QrPairingSessionStore.PollSecretException.class);
    }

    @Test
    void missingPollSecretAllowedOnlyInLegacyMode() {
        QrPairingSessionStore legacy = store(true);
        QrPairingInitResponse r1 = init(legacy);
        assertThat(legacy.poll(r1.getSessionId(), null).status()).isEqualTo(QrPairingSessionStore.Status.PENDING);

        QrPairingSessionStore strict = store(false);
        QrPairingInitResponse r2 = init(strict);
        assertThatThrownBy(() -> strict.poll(r2.getSessionId(), null))
                .isInstanceOf(QrPairingSessionStore.PollSecretException.class);
        assertThat(strict.poll(r2.getSessionId(), r2.getPollSecret()).status())
                .isEqualTo(QrPairingSessionStore.Status.PENDING);
    }

    @Test
    void approvedSessionIsConsumedExactlyOnceWithInitiatorDeviceInfo() {
        QrPairingSessionStore store = store(false);
        QrPairingInitResponse r = init(store);

        assertThat(store.approveSession(r.getSessionId(), "wrong-challenge", 7L, AcceptLanguage.RU)).isFalse();
        assertThat(store.approveSession(r.getSessionId(), r.getChallenge(), 7L, AcceptLanguage.RU)).isTrue();
        // ikkinchi marta tasdiqlab bo'lmaydi
        assertThat(store.approveSession(r.getSessionId(), r.getChallenge(), 8L, AcceptLanguage.RU)).isFalse();

        QrPairingSessionStore.PollOutcome first = store.poll(r.getSessionId(), r.getPollSecret());
        assertThat(first.approved()).isTrue();
        assertThat(first.userId()).isEqualTo(7L);
        assertThat(first.language()).isEqualTo(AcceptLanguage.RU);
        assertThat(first.initIp()).isEqualTo("10.0.0.5");
        assertThat(first.initUserAgent()).isEqualTo("PravaDesktop/2.0");
        assertThat(first.deviceUuid()).isEqualTo("uuid-1");

        QrPairingSessionStore.PollOutcome second = store.poll(r.getSessionId(), r.getPollSecret());
        assertThat(second.approved()).isFalse();
        assertThat(second.status()).isEqualTo(QrPairingSessionStore.Status.CONSUMED);
        assertThat(second.userId()).isNull();
    }

    @Test
    void cancelRequiresChallengeOrPollSecret() {
        QrPairingSessionStore store = store(true);
        QrPairingInitResponse r = init(store);

        assertThat(store.cancelSession(r.getSessionId(), null, null)).isFalse();
        assertThat(store.cancelSession(r.getSessionId(), "bad", "bad")).isFalse();
        assertThat(store.poll(r.getSessionId(), r.getPollSecret()).status()).isEqualTo(QrPairingSessionStore.Status.PENDING);

        assertThat(store.cancelSession(r.getSessionId(), null, r.getPollSecret())).isTrue();
        assertThat(store.poll(r.getSessionId(), r.getPollSecret()).status()).isEqualTo(QrPairingSessionStore.Status.CANCELLED);

        QrPairingInitResponse r2 = init(store);
        assertThat(store.cancelSession(r2.getSessionId(), r2.getChallenge(), null)).isTrue();
    }

    @Test
    void cancelledSessionCannotBeApproved() {
        QrPairingSessionStore store = store(true);
        QrPairingInitResponse r = init(store);
        store.cancelSession(r.getSessionId(), r.getChallenge(), null);
        assertThat(store.approveSession(r.getSessionId(), r.getChallenge(), 1L, AcceptLanguage.UZL)).isFalse();
    }

    @Test
    void unknownSessionPollsAsExpired() {
        assertThat(store(false).poll("nope", "x").status()).isEqualTo(QrPairingSessionStore.Status.EXPIRED);
    }

    @Test
    void scanMarksSessionScannedOnlyWithValidChallenge() {
        QrPairingSessionStore store = store(true);
        QrPairingInitResponse r = init(store);
        assertThat(store.getSessionInfo(r.getSessionId(), "bad")).isNull();
        assertThat(store.getSessionInfo(r.getSessionId(), r.getChallenge()).getStatus()).isEqualTo("SCANNED");
    }
}
