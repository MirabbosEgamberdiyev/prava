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
}
