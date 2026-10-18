package uz.pravaimtihon.service;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class BundleCryptoServiceTest {

    private final BundleCryptoService cryptoService = new BundleCryptoService();

    @Test
    void encryptAndDecryptRoundTripSucceeds() throws Exception {
        String testJson = "{\"version\":\"v2-test\",\"questions\":[{\"id\":1,\"text\":{\"uzl\":\"Sinov savoli\"}}]}";
        byte[] plaintext = testJson.getBytes(StandardCharsets.UTF_8);

        byte[] encrypted = cryptoService.encryptBundle(plaintext);

        assertNotNull(encrypted);
        // Header: "PRAVSEED" (8 bytes) + IV (12 bytes) + ciphertext + tag (16 bytes)
        assertTrue(encrypted.length >= 8 + 12 + plaintext.length + 16);
        assertEquals((byte) 'P', encrypted[0]);
        assertEquals((byte) 'R', encrypted[1]);
        assertEquals((byte) 'A', encrypted[2]);
        assertEquals((byte) 'V', encrypted[3]);
        assertEquals((byte) 'S', encrypted[4]);
        assertEquals((byte) 'E', encrypted[5]);
        assertEquals((byte) 'E', encrypted[6]);
        assertEquals((byte) 'D', encrypted[7]);

        byte[] decrypted = cryptoService.decryptBundle(encrypted);
        assertEquals(testJson, new String(decrypted, StandardCharsets.UTF_8));
    }

    @Test
    void tamperingWithCiphertextFailsAuthentication() throws Exception {
        byte[] plaintext = "{\"sensitive\":\"data\"}".getBytes(StandardCharsets.UTF_8);
        byte[] encrypted = cryptoService.encryptBundle(plaintext);

        // Tamper with last byte (part of authentication tag)
        encrypted[encrypted.length - 1] ^= 0x01;

        assertThrows(Exception.class, () -> cryptoService.decryptBundle(encrypted));
    }

    @Test
    void appSignatureVerificationSucceedsForValidHmac() throws Exception {
        long now = java.time.Instant.now().getEpochSecond();
        String platform = "desktop";
        Long userId = 42L;

        String dataToSign = "offline-bundle:42:" + now + ":desktop";
        javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
        mac.init(new javax.crypto.spec.SecretKeySpec(BundleCryptoService.APP_HMAC_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] raw = mac.doFinal(dataToSign.getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder();
        for (byte b : raw) hex.append(String.format("%02x", b));

        boolean valid = cryptoService.verifyAppSignature(platform, String.valueOf(now), hex.toString(), userId);
        assertTrue(valid);
    }

    @Test
    void appSignatureVerificationFailsForWebPlatformOrTamperedSig() {
        long now = java.time.Instant.now().getEpochSecond();
        assertFalse(cryptoService.verifyAppSignature("web", String.valueOf(now), "bad_signature", 42L));
        assertFalse(cryptoService.verifyAppSignature("desktop", String.valueOf(now), "bad_signature", 42L));
        // Expired timestamp (10 minutes ago)
        assertFalse(cryptoService.verifyAppSignature("desktop", String.valueOf(now - 600), "signature", 42L));
    }
}
