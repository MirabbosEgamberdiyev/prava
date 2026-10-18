package uz.pravaimtihon.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;

/**
 * Offline savollar to'plamini (offline-bundle) AES-256-GCM yordamida shifrlash xizmati.
 * Shifrlangan paket formati:
 * [MAGIC: "PRAVSEED" (8 bayt)] + [IV / Nonce (12 bayt)] + [Ciphertext + 16 bayt Tag]
 *
 * Kalit derivatsiyasi Desktop (Rust) va Mobile (Native) qatlamlari bilan 100% mos keladi.
 */
@Slf4j
@Service
public class BundleCryptoService {

    private static final byte[] PUBKEY = new byte[]{
            (byte) 0xfd, (byte) 0xd1, (byte) 0xa2, (byte) 0xd2, (byte) 0xca, 0x27, (byte) 0xcc, 0x19,
            (byte) 0xe8, (byte) 0xe5, (byte) 0x5c, 0x01, (byte) 0xb2, 0x16, (byte) 0x81, 0x0c,
            (byte) 0x00, (byte) 0x3c, (byte) 0x3b, (byte) 0x14, (byte) 0x44, (byte) 0x84, (byte) 0xf8, (byte) 0xd8,
            (byte) 0x5f, (byte) 0xd3, (byte) 0x15, (byte) 0xd6, (byte) 0x1b, (byte) 0x61, (byte) 0xb7, (byte) 0x3e
    };

    private static final byte[] MAGIC = "PRAVSEED".getBytes(StandardCharsets.US_ASCII);
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128; // bits

    private final SecretKey masterKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public BundleCryptoService() {
        try {
            MessageDigest sha512 = MessageDigest.getInstance("SHA-512");
            byte[] h512 = sha512.digest(PUBKEY);

            byte[] salt = "PRAVA-SEED-ENC-2024\0".getBytes(StandardCharsets.UTF_8);

            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            sha256.update(PUBKEY);
            sha256.update(Arrays.copyOfRange(h512, 0, 16));
            sha256.update(salt);
            byte[] keyBytes = sha256.digest();

            this.masterKey = new SecretKeySpec(keyBytes, "AES");
            log.info("BundleCryptoService initialized with AES-256-GCM key");
        } catch (Exception e) {
            throw new IllegalStateException("Failed to initialize BundleCryptoService AES key", e);
        }
    }

    /**
     * Plaintext JSON baytlarini AES-256-GCM bilan shifrlaydi.
     */
    public byte[] encryptBundle(byte[] plaintext) throws Exception {
        byte[] iv = new byte[GCM_IV_LENGTH];
        secureRandom.nextBytes(iv);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.ENCRYPT_MODE, masterKey, spec);

        byte[] ciphertext = cipher.doFinal(plaintext);

        ByteArrayOutputStream out = new ByteArrayOutputStream(MAGIC.length + iv.length + ciphertext.length);
        out.write(MAGIC);
        out.write(iv);
        out.write(ciphertext);
        return out.toByteArray();
    }

    /**
     * Shifrlangan binary paketni ochadi (testlar va verifikatsiya uchun).
     */
    public byte[] decryptBundle(byte[] encrypted) throws Exception {
        if (encrypted.length < MAGIC.length + GCM_IV_LENGTH + 16) {
            throw new IllegalArgumentException("Encrypted payload too short");
        }
        for (int i = 0; i < MAGIC.length; i++) {
            if (encrypted[i] != MAGIC[i]) {
                throw new IllegalArgumentException("Invalid magic header");
            }
        }
        byte[] iv = Arrays.copyOfRange(encrypted, MAGIC.length, MAGIC.length + GCM_IV_LENGTH);
        byte[] ciphertext = Arrays.copyOfRange(encrypted, MAGIC.length + GCM_IV_LENGTH, encrypted.length);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.DECRYPT_MODE, masterKey, spec);
        return cipher.doFinal(ciphertext);
    }
}
