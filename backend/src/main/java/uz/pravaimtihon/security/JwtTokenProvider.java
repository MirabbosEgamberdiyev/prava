package uz.pravaimtihon.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String secretKey;

    @Value("${app.jwt.access-token-expiration}")
    private long accessTokenExpiration;

    @Value("${app.jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    // B6/A2: katta fayl yuklab olish (masalan Backup ZIP) uchun — brauzer <a href>
    // orqali Authorization header qo'shib bo'lmaydi, shuning uchun URL query-paramda
    // yuboriladigan, alohida maqsadli, QISQA MUDDATLI (default 5 daq) token.
    @Value("${app.jwt.download-token-expiration:300000}")
    private long downloadTokenExpiration;

    @Value("${app.jwt.issuer}")
    private String issuer;

    private static final String CLAIM_TOKEN_TYPE = "typ";
    private static final String TOKEN_TYPE_DOWNLOAD = "download";

    /**
     * Fail-fast: kalit muammosi birinchi login paytida emas, ilova ishga
     * tushishida darrov aniqlanadi.
     */
    @jakarta.annotation.PostConstruct
    void validateConfiguration() {
        getSignInKey();
        log.info("JWT konfiguratsiyasi tekshirildi (issuer={}, access-token TTL={} ms)",
                issuer, accessTokenExpiration);
    }

    /**
     * ✅ Access Token yaratish
     */
    public String generateAccessToken(UserDetails userDetails) {
        Map<String, Object> extraClaims = new HashMap<>();
        if (userDetails instanceof CustomUserDetails customUserDetails) {
            extraClaims.put("userId", customUserDetails.getId());
            extraClaims.put("role", customUserDetails.getRole().name());
            extraClaims.put("language", customUserDetails.getLanguage().getCode());
        }
        return buildToken(extraClaims, userDetails, accessTokenExpiration);
    }

    /**
     * B6/A2: Qisqa muddatli, faqat GET-download uchun ishlatiladigan token.
     * Header o'rniga URL query-paramda yuborilishi mumkin (masalan Backup ZIP).
     */
    public String generateDownloadToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put(CLAIM_TOKEN_TYPE, TOKEN_TYPE_DOWNLOAD);
        return buildToken(claims, userDetails, downloadTokenExpiration);
    }

    /** Token "download" turidan ekanligini tekshiradi (asosiy access-token emas). */
    public boolean isDownloadToken(String token) {
        try {
            String type = extractClaim(token, claims -> claims.get(CLAIM_TOKEN_TYPE, String.class));
            return TOKEN_TYPE_DOWNLOAD.equals(type);
        } catch (Exception e) {
            return false;
        }
    }

    // AUDIT: `generateRefreshToken(...)` OLIB TASHLANDI.
    // U hech qayerda ishlatilmasdi (haqiqiy refresh token AuthService'da
    // UUID sifatida yaratilib, DB'da rotate/revoke qilinadi), lekin xavfli
    // "token confusion" tuzog'i edi: u access-token bilan bir xil kalit va
    // bir xil `subject` bilan imzolangan JWT qaytarardi, ya'ni 30 KUNLIK
    // refresh tokenni oddiy `Authorization: Bearer` sifatida ishlatish
    // mumkin bo'lardi va DB'dagi revoke mexanizmi butunlay chetlab o'tilardi.

    /**
     * ✅ Tokenni qurish (0.12.3 standardi bo'yicha)
     */
    private String buildToken(
            Map<String, Object> extraClaims,
            UserDetails userDetails,
            long expiration
    ) {
        return Jwts.builder()
                .claims(extraClaims) // setClaims o'rniga
                .subject(userDetails.getUsername()) // setSubject o'rniga
                .issuer(issuer)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignInKey()) // SignatureAlgorithm berish endi shart emas
                .compact();
    }

    /**
     * ✅ Token validatsiyasi
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            if (username == null || userDetails.getUsername() == null) {
                return false;
            }
            return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (Exception e) {
            log.error("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Long extractUserId(String token) {
        return extractClaim(token, claims -> claims.get("userId", Long.class));
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * ✅ FIXED: JJWT 0.12.3 uchun extractAllClaims
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignInKey()) // verifyWith ishlatiladi
                .build()
                .parseSignedClaims(token)   // parseClaimsJws o'rniga
                .getPayload();              // getBody o'rniga getPayload
    }

    /**
     * ✅ SecretKey generatsiyasi.
     * Kalit bir marta hisoblanadi va startup'da qat'iy tekshiriladi.
     */
    private SecretKey getSignInKey() {
        SecretKey key = cachedKey;
        if (key == null) {
            synchronized (this) {
                key = cachedKey;
                if (key == null) {
                    key = buildAndValidateKey();
                    cachedKey = key;
                }
            }
        }
        return key;
    }

    private volatile SecretKey cachedKey;

    /**
     * AUDIT: avval har bir token operatsiyasida kalit qayta decode qilinardi va
     * HECH QANDAY kuch tekshiruvi yo'q edi. Endi:
     *  - kalit kamida 256 bit (32 bayt) bo'lishi shart (HS256 talabi);
     *  - git'ga tushib ketgan ma'lum default kalitlar TAQIQLANADI —
     *    ular bilan ishga tushirishga urinish darrov xato beradi.
     */
    private SecretKey buildAndValidateKey() {
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException(
                    "app.jwt.secret (JWT_SECRET) o'rnatilmagan. " +
                    "Yarating: openssl rand -base64 48");
        }
        for (String leaked : LEAKED_SECRETS) {
            if (leaked.equals(secretKey.trim())) {
                throw new IllegalStateException(
                        "JWT_SECRET sifatida git repo'da ochiq turgan (komprometatsiya " +
                        "qilingan) default kalit ishlatilmoqda. Uni ALMASHTIRING: " +
                        "openssl rand -base64 48");
            }
        }

        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secretKey);
        } catch (Exception e) {
            // Base64 bo'lmasa — xom baytlar sifatida qabul qilamiz (orqaga moslik).
            keyBytes = secretKey.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        }

        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                    "app.jwt.secret juda qisqa: " + (keyBytes.length * 8) + " bit. " +
                    "HS256 uchun kamida 256 bit (32 bayt) kerak.");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /** Git tarixida ochiq qolgan, endi ishlatish taqiqlangan default kalitlar. */
    private static final String[] LEAKED_SECRETS = {
            "MirabbosEgamberdiyevPravaOnlineSecretKey1234567890123456789012345678901",
            "PravaOnlineProductionSecretKey2024MustBe32CharsOrMoreForSecurity!"
    };

    public long getAccessTokenExpiration() {
        return accessTokenExpiration;
    }

    public long getRefreshTokenExpiration() {
        return refreshTokenExpiration;
    }
}