package uz.pravaimtihon.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Base64;

/**
 * Generates Ed25519-signed activation tokens.
 *
 * <h3>Algoritm (HTML generator va Prava-desktop activation.rs bilan 100% mos)</h3>
 * <pre>
 *   EPOCH     = 2024-01-01 UTC
 *   startDays = daysBetween(EPOCH, startDate)         // u16, big-endian
 *   endDays   = daysBetween(EPOCH, endDate)           // u16, big-endian
 *   data[4]   = [ startDays>>8, startDays&0xFF, endDays>>8, endDays&0xFF ]
 *   message   = UTF8(machineId.toUpperCase()) + 0x7C + data[4]
 *   sig[64]   = Ed25519.sign(message, PRIVATE_KEY)
 *   token68   = data[4] + sig[64]                     // 68 bytes
 *   token     = base64url_no_padding(token68)  +  '.' every 8 chars
 * </pre>
 *
 * <h3>Xavfsizlik eslatmasi</h3>
 * PRIVATE_KEY_SEED hech qachon tashqariga chiqmasligi kerak.
 * HTML generatordagi kalit bilan aynan bir xil bo'lishi shart.
 */
@Service
@Slf4j
public class Ed25519LicenseService {

    // ══════════════════════════════════════════════════════════════════════════
    // ⚠️ AUDIT — KRITIK: bu yerda litsenziya IMZOLASH PRIVATE KEY'i to'g'ridan-
    // to'g'ri kodda (git repo'da) yozilgan edi. Repo'ga kirish huquqi bo'lgan
    // (yoki jar'ni dekompilyatsiya qilgan) har kim CHEKSIZ, ixtiyoriy machine-id
    // uchun amal qiluvchi desktop litsenziya tokenlarini o'zi generatsiya qila
    // oladi — ya'ni butun aktivatsiya/monetizatsiya modeli chetlab o'tiladi.
    //
    // Endi seed `app.license.ed25519.seed` (env: LICENSE_ED25519_SEED, base64
    // yoki hex, 32 bayt) orqali beriladi.
    //
    // TO'LIQ REMEDIATSIYA (bu kod o'zi qila olmaydi — operator qadami):
    //   1) Yangi Ed25519 kalit juftini generatsiya qiling.
    //   2) Desktop ilova (activation.rs) ichidagi PUBLIC key'ni yangilang va
    //      yangi build tarqating.
    //   3) LICENSE_ED25519_SEED ni serverdagi .env ga qo'ying.
    //   4) Eski seed'ni KOMPROMETATSIYA QILINGAN deb hisoblang.
    // Kalit almashtirilgunicha eski (leaked) seed fallback sifatida ishlaydi,
    // aks holda barcha mavjud litsenziyalar bir zumda buzilardi.
    // ══════════════════════════════════════════════════════════════════════════

    /** Legacy (git'ga tushib ketgan, komprometatsiya qilingan) seed — faqat fallback. */
    private static final byte[] LEGACY_LEAKED_SEED = {
        (byte)0x07, (byte)0x92, (byte)0xb6, (byte)0xf7,
        (byte)0x25, (byte)0xd9, (byte)0x44, (byte)0x33,
        (byte)0xf0, (byte)0x82, (byte)0x92, (byte)0x66,
        (byte)0x85, (byte)0xae, (byte)0x5c, (byte)0x37,
        (byte)0xe0, (byte)0xd7, (byte)0x6c, (byte)0x1b,
        (byte)0xf2, (byte)0x45, (byte)0x2f, (byte)0x0b,
        (byte)0x7b, (byte)0xc5, (byte)0xf6, (byte)0xc0,
        (byte)0x87, (byte)0xd0, (byte)0x34, (byte)0x56,
    };

    /**
     * EPOCH: activation.rs / HTML generator ikkalasida ham 2024-01-01 UTC.
     * dateToDays() → Math.floor((date - EPOCH) / 86_400_000)
     */
    private static final LocalDate EPOCH = LocalDate.of(2024, 1, 1);

    /** Precomputed Ed25519 private key (application startup'da bir marta quriladi). */
    private final PrivateKey privateKey;

    public Ed25519LicenseService(
            @Value("${app.license.ed25519.seed:}") String configuredSeed) {

        byte[] seed;
        if (configuredSeed != null && !configuredSeed.isBlank()) {
            seed = decodeSeed(configuredSeed.trim());
            log.info("Ed25519LicenseService: imzolash kaliti konfiguratsiyadan olindi (env)");
        } else {
            seed = LEGACY_LEAKED_SEED;
            log.error("═══════════════════════════════════════════════════════════════");
            log.error("XAVFSIZLIK OGOHLANTIRISHI: LICENSE_ED25519_SEED o'rnatilmagan!");
            log.error("Litsenziya imzolash uchun kodga yozilgan (git'da OCHIQ bo'lgan)");
            log.error("eski kalit ishlatilmoqda — uni bilgan har kim soxta desktop");
            log.error("litsenziya generatsiya qila oladi. Kalitni almashtiring va");
            log.error("LICENSE_ED25519_SEED ni .env ga qo'shing.");
            log.error("═══════════════════════════════════════════════════════════════");
        }

        this.privateKey = buildPrivateKey(seed);
        log.info("Ed25519LicenseService initialized (algorithm: Ed25519, epoch: {})", EPOCH);
    }

    /** Seed'ni base64 (standart yoki url-safe) yoki hex ko'rinishidan 32 baytga aylantiradi. */
    private static byte[] decodeSeed(String raw) {
        byte[] decoded;
        try {
            if (raw.length() == 64 && raw.matches("(?i)[0-9a-f]+")) {
                decoded = new byte[32];
                for (int i = 0; i < 32; i++) {
                    decoded[i] = (byte) Integer.parseInt(raw.substring(i * 2, i * 2 + 2), 16);
                }
            } else if (raw.indexOf('-') >= 0 || raw.indexOf('_') >= 0) {
                decoded = Base64.getUrlDecoder().decode(raw);
            } else {
                decoded = Base64.getDecoder().decode(raw);
            }
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException(
                    "app.license.ed25519.seed noto'g'ri formatda (base64 yoki 64 belgili hex kutilgan)", e);
        }
        if (decoded.length != 32) {
            throw new IllegalStateException(
                    "app.license.ed25519.seed aynan 32 bayt bo'lishi kerak, keldi: " + decoded.length);
        }
        return decoded;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Berilgan machine ID va sanalar uchun Ed25519 token yaratadi.
     *
     * <p>Bu metod <b>deterministik</b>: bir xil machine_id + bir xil sanalar = bir xil token.
     * Shuning uchun caller tomonida dublikat tekshiruvi qo'shimcha qiymat beradi.</p>
     *
     * @param machineId  Desktop ilovadan olingan machine identifier
     * @param startDate  Amal qilish boshlanish sanasi
     * @param endDate    Amal qilish tugash sanasi
     * @return           Aktivatsiya tokeni (base64url + '.' har 8 ta belgi)
     */
    public String generateToken(String machineId, LocalDate startDate, LocalDate endDate) {
        try {
            // 1. Kunlarni hisoblash (EPOCH dan beri)
            int startDays = (int) ChronoUnit.DAYS.between(EPOCH, startDate);
            int endDays   = (int) ChronoUnit.DAYS.between(EPOCH, endDate);

            validateDays("startDays", startDays);
            validateDays("endDays",   endDays);

            // 2. 4 baytli data: startDays (u16 BE) + endDays (u16 BE)
            byte[] data = {
                (byte)(startDays >> 8), (byte)(startDays & 0xFF),
                (byte)(endDays   >> 8), (byte)(endDays   & 0xFF),
            };

            // 3. Imzolanadigan xabar: UTF8(machineId.toUpperCase()) + '|'(0x7C) + data[4]
            byte[] midBytes = machineId.toUpperCase().getBytes(StandardCharsets.UTF_8);
            byte[] message  = new byte[midBytes.length + 1 + 4];
            System.arraycopy(midBytes, 0, message, 0,                midBytes.length);
            message[midBytes.length] = 0x7C; // '|'
            System.arraycopy(data,    0, message, midBytes.length + 1, 4);

            // 4. Ed25519 imzo (64 bayt)
            Signature signer = Signature.getInstance("Ed25519");
            signer.initSign(privateKey);
            signer.update(message);
            byte[] signature = signer.sign(); // 64 bytes (RFC 8032)

            if (signature.length != 64) {
                throw new IllegalStateException(
                    "Ed25519 signature must be 64 bytes, got: " + signature.length);
            }

            // 5. tokenBytes[68] = data[4] + signature[64]
            byte[] tokenBytes = new byte[68];
            System.arraycopy(data,      0, tokenBytes, 0,  4);
            System.arraycopy(signature, 0, tokenBytes, 4, 64);

            // 6. base64url (no padding) + har 8 ta belgidan keyin '.'
            //    btoa + replaceAll('+','-').replaceAll('/','_').replaceAll('=','') bilan bir xil
            String b64 = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);

            StringBuilder sb = new StringBuilder(b64.length() + b64.length() / 8);
            for (int i = 0; i < b64.length(); i++) {
                if (i > 0 && i % 8 == 0) sb.append('.');
                sb.append(b64.charAt(i));
            }

            String token = sb.toString();
            log.debug("Token generated for machine='{}', start={}, end={}, tokenLen={}",
                      machineId, startDate, endDate, token.length());
            return token;

        } catch (Exception e) {
            log.error("Ed25519 token generation failed for machine={}", machineId, e);
            throw new RuntimeException("Token generation failed: " + e.getMessage(), e);
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * 32 baytli raw seed dan Ed25519 PrivateKey yaratadi.
     *
     * Java 17 native Ed25519 support.
     * PKCS#8 OneAsymmetricKey DER format (RFC 8410):
     *
     *   30 2e          SEQUENCE (46 bytes)
     *     02 01 00     INTEGER 0  (version)
     *     30 05        SEQUENCE (5 bytes)
     *       06 03 2b 65 70   OID 1.3.101.112 (id-EdDSA / Ed25519)
     *     04 22        OCTET STRING (34 bytes)
     *       04 20      OCTET STRING (32 bytes) = raw seed
     *       [32 bytes]
     */
    private static PrivateKey buildPrivateKey(byte[] seed) {
        if (seed.length != 32) {
            throw new IllegalArgumentException("Ed25519 seed must be exactly 32 bytes");
        }
        try {
            // PKCS#8 DER prefix for Ed25519 raw seed (16 bayt sabit prefiks)
            byte[] prefix = {
                0x30, 0x2e,               // SEQUENCE (46 bytes)
                0x02, 0x01, 0x00,         // INTEGER 0 (version)
                0x30, 0x05,               // SEQUENCE (5 bytes)
                0x06, 0x03, 0x2b, 0x65, 0x70, // OID 1.3.101.112
                0x04, 0x22,               // OCTET STRING (34 bytes)
                0x04, 0x20,               // OCTET STRING (32 bytes) = seed
            };

            byte[] pkcs8 = new byte[prefix.length + seed.length]; // 16 + 32 = 48 bytes
            System.arraycopy(prefix, 0, pkcs8, 0,             prefix.length);
            System.arraycopy(seed,   0, pkcs8, prefix.length, seed.length);

            KeyFactory kf = KeyFactory.getInstance("Ed25519");
            return kf.generatePrivate(new PKCS8EncodedKeySpec(pkcs8));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to initialize Ed25519 private key: " + e.getMessage(), e);
        }
    }

    /** u16 oralig'i (0–65535): 2024 yildan 2203 yilgacha yetarli. */
    private static void validateDays(String name, int days) {
        if (days < 0 || days > 65535) {
            throw new IllegalArgumentException(
                name + " out of u16 range: " + days +
                " (dates must be between 2024-01-01 and ~2203-10-17)");
        }
    }
}
