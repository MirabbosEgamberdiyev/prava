package uz.pravaimtihon.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Generates AES-256-GCM activation tokens that are verified by
 * {@code Prava-desktop/src-tauri/src/license.rs}.
 *
 * <h3>Token wire format</h3>
 * <pre>
 *   base64url_no_padding( nonce[12] || AES-256-GCM-ciphertext(JSON) )
 * </pre>
 *
 * <h3>JSON payload</h3>
 * <pre>
 *   {
 *     "machine_id": "&lt;lowercase-hex-32-chars&gt;",
 *     "expires_at": "2025-12-31T23:59:59Z",
 *     "issued_at":  "2025-01-01T12:00:00Z",
 *     "product":    "prava-desktop"
 *   }
 * </pre>
 *
 * <h3>Key</h3>
 * {@code b"PrAvA-SeCrEt-KeY-2024-OfFlInE!!!"} — 32 ASCII bytes.
 * Must match {@code SECRET_KEY} in {@code license.rs}.
 *
 * <p><b>Note:</b> Each call produces a different token because the
 * GCM nonce is randomised; the uniqueness constraint on the DB column
 * is satisfied automatically.</p>
 */
@Service
@Slf4j
public class Ed25519LicenseService {

    // ── Constants (must match Prava-desktop license.rs exactly) ──────────────
    private static final byte[] SECRET_KEY =
            "PrAvA-SeCrEt-KeY-2024-OfFlInE!!!".getBytes(StandardCharsets.ISO_8859_1);

    private static final int    NONCE_BYTES  = 12;
    private static final int    GCM_TAG_BITS = 128;
    private static final String PRODUCT      = "prava-desktop";

    /** Matches chrono's default Utc serialisation: "2025-12-31T23:59:59Z" */
    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'");

    private final SecureRandom random = new SecureRandom();
    private final ObjectMapper mapper = new ObjectMapper();

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Generates an AES-256-GCM activation token for the given machine.
     *
     * @param machineId 32-char lowercase-hex fingerprint shown by the desktop app
     * @param startDate validity start (stored in DB; not in token — desktop has no start-date check)
     * @param endDate   validity end → becomes {@code expires_at} in the JSON payload
     * @return base64url (no padding) encoded token, ready to hand to the user
     */
    public String generateToken(String machineId, LocalDate startDate, LocalDate endDate) {
        try {
            // ── Build JSON payload ────────────────────────────────────────────
            ZonedDateTime issuedAt  = ZonedDateTime.now(ZoneOffset.UTC);
            // End of the last valid day (23:59:59 UTC)
            ZonedDateTime expiresAt = endDate.atTime(23, 59, 59).atZone(ZoneOffset.UTC);

            Map<String, String> payload = new LinkedHashMap<>();
            // machine_id MUST be lowercase — get_machine_id() in Rust returns lowercase hex
            payload.put("machine_id", machineId.toLowerCase());
            payload.put("expires_at", expiresAt.format(FMT));
            payload.put("issued_at",  issuedAt.format(FMT));
            payload.put("product",    PRODUCT);

            byte[] plaintext = mapper.writeValueAsBytes(payload);

            // ── AES-256-GCM encrypt ───────────────────────────────────────────
            byte[] nonce = new byte[NONCE_BYTES];
            random.nextBytes(nonce);

            SecretKeySpec  keySpec   = new SecretKeySpec(SECRET_KEY, "AES");
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_BITS, nonce);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmSpec);
            byte[] ciphertext = cipher.doFinal(plaintext); // includes 16-byte auth tag

            // ── Assemble: nonce || ciphertext ─────────────────────────────────
            byte[] token = new byte[NONCE_BYTES + ciphertext.length];
            System.arraycopy(nonce,      0, token, 0,           NONCE_BYTES);
            System.arraycopy(ciphertext, 0, token, NONCE_BYTES, ciphertext.length);

            // ── Base64url (no padding) — matches URL_SAFE_NO_PAD in Rust ──────
            return Base64.getUrlEncoder().withoutPadding().encodeToString(token);

        } catch (Exception e) {
            log.error("License token generation failed for machine={}", machineId, e);
            throw new RuntimeException("License token generation failed: " + e.getMessage(), e);
        }
    }
}
