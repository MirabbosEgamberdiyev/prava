# Prava Online — Click & Payme Integratsiya va YATT uchun to'liq qo'llanma

> **Loyiha:** pravaonline.uz (Prava Online — haydovchilik guvohnomasi imtihon platformasi)
> **Stek:** Spring Boot 3.2.1 (Java 17) + PostgreSQL 16 + React 19 (Vite, Mantine UI)
> **Muallif uchun:** Javohir (YATT)
> **Sana:** 2026-yil

Bu hujjat 6 qismdan iborat:

1. YATT tomonidan bajarilishi shart bo'lgan yuridik va moliyaviy tayyorgarlik
2. Click bilan shartnoma tuzish jarayoni (boshidan oxirigacha)
3. Payme bilan shartnoma tuzish jarayoni (boshidan oxirigacha)
4. Texnik integratsiya (sizning Spring Boot + React kodingizga qanday qo'shish kerakligi)
5. Xavfsizlik, huquqiy va soliq jihatlari
6. Qadamma-qadam amaliy reja (checklist)

---

## 1-QISM. YATT sifatida TAYYORGARLIK

### 1.1. YATT ochilganidan keyin birinchi zaruriy qadamlar

Siz YATT ochdingiz, lekin Click/Payme bilan shartnoma tuzish uchun shu narsalar **majburiy**:

| № | Talab | Izoh |
|---|-------|------|
| 1 | **STIR (INN)** | YATT ro'yxatdan o'tganda beriladi — soliq identifikatsiya raqami. |
| 2 | **IFUT / OKED kodi** | Faoliyat turi. Sizga mos keladigan kodlar: **62.01** (Dasturiy ta'minot ishlab chiqish), **62.09** (Boshqa IT xizmatlar), **63.12** (Veb-portallar), **85.59** (Boshqa ta'lim xizmatlari — imtihonga tayyorlash uchun). Odatda bir nechta OKED kiritiladi. |
| 3 | **Soliq turi** | YATT uchun: **Qaytim solig'i** (oborotdan 4%) — yillik oborot 500 mln so'mgacha bo'lsa qulay. Elektron tijorat uchun 2% imtiyozli stavka ham mavjud (agar IT-park rezidenti bo'lsangiz — 0%). |
| 4 | **Tijorat banki hisobi** | YATT uchun **asosiy depozit schyot** ochilishi kerak (Kapitalbank, Ipoteka, Anorbank, TBC, Xalq banki va h.k.). Click/Payme **shaxsiy karta emas, YATT hisob raqamiga** pul o'tkazadi. |
| 5 | **Elektron raqamli imzo (ERI)** | `my.gov.uz` orqali olinadi. Shartnomalarni onlayn imzolash uchun shart. |
| 6 | **E-faktura tizimida ro'yxat** | `faktura.soliq.uz` — to'lovlar uchun elektron hisob-faktura yuborish majburiy. |

> **Muhim:** Agar siz IT-park rezidenti bo'lishga arizangiz qabul qilinsa — 0% soliq, 0% ijtimoiy soliq, xodimlar uchun 7.5% maxsus stavka (oddiy 12% o'rniga). IT-park uchun ariza `it-park.uz` da topshiriladi, daromadlaringizning 100% IT faoliyatidan bo'lishi kerak. Sizning holatingizda (veb-imtihon platformasi) — bu **mos keladi**.

### 1.2. Ro'yxatga olinishi shart bo'lgan "Rasmiy shaxs" ma'lumotlari

Click va Payme shartnomada quyidagilarni so'raydi:

- F.I.Sh. (YATT egasi sifatida)
- Pasport ma'lumotlari (seriya + raqam + JSHSHIR)
- STIR
- Bank rekvizitlari (hisob raqam, MFO, bank nomi)
- Yuridik manzil (propiska)
- Faoliyat manzili (ofis yoki uy)
- OKED
- Telefon va email
- **Sayt:** `pravaonline.uz` (domen va hosting sizning nomingizda bo'lishi kerak)

### 1.3. Domen va hosting egaligi

**Ehtiyot bo'ling:** Agar domen boshqa shaxsning nomida ro'yxatdan o'tgan bo'lsa, Click/Payme shartnomani bekor qilishi yoki qabul qilmasligi mumkin.

`.uz` domenlari **uz.uz/cctld.uz** da tekshiriladi — WHOIS ma'lumotida YATT F.I.Sh. yoki STIR'ingiz ko'rinishi kerak. Agar hozir shunday bo'lmasa — domenni o'zingiz nomingizga **qayta ro'yxatdan o'tkazing** (CCTLD.UZ ga ariza).

---

## 2-QISM. CLICK BILAN SHARTNOMA TUZISH

### 2.1. Click'ning qaysi mahsulotidan foydalanasiz?

Click'da 3 xil integratsiya varianti mavjud:

| Variant | Nima uchun? | Sizga tavsiya? |
|---------|------------|----------------|
| **Click Merchant API (SHOP-API)** | Veb-saytda to'lov tugmasi, to'g'ridan-to'g'ri integratsiya | ✅ **Ha, asosiy variant** |
| **Click Checkout (UP)** | Oddiy iframe/redirect — kam kod, tez ishga tushadi | ✅ MVP uchun yaxshi |
| **Click Pass (QR)** | Oflayn do'konlar uchun QR | ❌ sizga kerak emas |

**Tavsiya:** **Click Shopping API + Invoice API** — bu backend webhook'lar orqali ishlaydi, to'lov holati aniq kuzatiladi.

### 2.2. Shartnoma tuzish qadamlari

1. **Ariza topshirish:** `merchant.click.uz` saytiga kiring → "Hamkor bo'lish" (Стать партнёром).
2. **Ma'lumotlarni kiritish:**
   - Yuridik shakl: **YATT (Индивидуальный предприниматель)**
   - STIR, OKED, bank rekvizitlari
   - Veb-sayt: `https://pravaonline.uz`
   - Mahsulot tavsifi: "Haydovchilik guvohnomasi imtihoniga tayyorlash online platformasi — test paketlariga kirish"
   - Kutilgan oylik oborot (haqiqatga yaqin yozing, masalan 5-20 mln so'm)
   - Yetkazib berish turi: **raqamli xizmat** (digital service)
2. **Hujjatlarni yuklash:**
   - YATT guvohnomasi (ro'yxatdan o'tganlik)
   - Pasport nusxa (YATT egasi)
   - Bank rekvizitlari ma'lumotnomasi
   - Ommaviy oferta shartnomasi (Public Offer) — sayt yuqorisida va footerda bo'lishi shart
   - Qaytarish siyosati (Refund Policy)
   - Maxfiylik siyosati (Privacy Policy)
3. **Tasdiqni kutish:** Odatda 3-7 ish kuni. Click xodimi sizga qo'ng'iroq qilib, sayt funksionalini tekshiradi.
4. **Tarif:** Hozirgi standart komissiya — **~1.5-2.2%** har bir tranzaktsiyadan (kelishuv natijasida kamayishi mumkin).
5. **Test muhiti:** Shartnoma imzolanishidan oldin ham **sandbox** beriladi — `https://my.click.uz/services/pay/qs` (test rejimi).
6. **Production kalitlari:** Shartnoma imzolangach, siz oladigan ma'lumotlar:
   - `service_id` — xizmat identifikatori
   - `merchant_id` — sotuvchi identifikatori
   - `merchant_user_id` — sotuvchi foydalanuvchi ID
   - `secret_key` — hash imzolash uchun maxfiy kalit

### 2.3. Click webhook arxitekturasi (qanday ishlaydi)

Click ikki bosqichda ishlaydi:

**1-bosqich — `Prepare` (tasdiqlash):**
```
POST  https://pravaonline.uz/api/payment/click/prepare
Body: click_trans_id, service_id, merchant_trans_id, amount, action=0, sign_string, sign_time
```
Bu yerda siz to'lovning haqiqiyligini tekshiring: `merchant_trans_id` (sizning order ID) bazangizda bormi, summa to'g'rimi, foydalanuvchi mavjudmi.

**2-bosqich — `Complete` (yakunlash):**
```
POST  https://pravaonline.uz/api/payment/click/complete
Body: click_trans_id, service_id, merchant_trans_id, amount, action=1, sign_string, error
```
Bu yerda siz haqiqiy to'lovni yozib qo'yasiz — foydalanuvchining paketga kirish huquqini ochasiz.

Ikkalasida ham `sign_string` ni tekshirish **majburiy** (aks holda soxta webhook bilan pulsiz kirish mumkin):

```
sign_string = md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time)
```

Javob formati (Click talab qiladigan):
```json
{
  "click_trans_id": 123456,
  "merchant_trans_id": "order_42",
  "merchant_prepare_id": 42,
  "error": 0,
  "error_note": "Success"
}
```

---

## 3-QISM. PAYME BILAN SHARTNOMA TUZISH

### 3.1. Payme Business

Payme uchun Merchant bo'lish `business.payme.uz` orqali amalga oshiriladi.

### 3.2. Shartnoma qadamlari

1. **Ro'yxat:** `https://business.payme.uz` → "Biznesga qo'shilish".
2. **Tur tanlash:**
   - **YATT (Индивидуальный предприниматель)** — sizning holatingiz
   - **Online xizmat** — mahsulot turi
3. **Kabinet ma'lumotlari:**
   - Tashkilot nomi: "YATT Bozorboyev Javohir" (yoki qanday ro'yxatdan o'tgan bo'lsa)
   - STIR
   - OKED
   - Yuridik manzil
   - Bank rekvizitlari
   - Ishonchli telefon (bu SMS kodlar keladi)
   - Website: `https://pravaonline.uz`
4. **Hujjatlar (skanerdan chiqarib yuklash):**
   - YATT guvohnomasi
   - Pasport (2-3 sahifa, propiska sahifasi)
   - Bank rekvizit ma'lumotnomasi
   - Oferta shartnomasi, Refund policy, Privacy policy — saytda joylashgan PDF havola
5. **Merchant yaratish (Kassa):** Har bir "kassa" alohida hisob bo'ladi. Siz yaratasiz: `Prava Online — Paketlar`.
6. **Tasdiq:** Payme yuristlari saytni tekshiradi (mazmun, oferta, narxlar aniq ko'rsatilganmi). Odatda **2-5 ish kuni**.
7. **Komissiya:** Odatdagi stavka **~1% (raqamli mahsulot) — 2-3% (fizik)**. Siz digital service hisoblanasiz, ~1-1.5% kutiladi.
8. **Kalitlar:**
   - `Merchant ID`
   - `Cashbox Key` (Test va Production alohida)
   - `Kassa API endpoint` (odatda: `https://checkout.paycom.uz/api`)

### 3.3. Payme webhook arxitekturasi

Payme **JSON-RPC 2.0** protokolida ishlaydi. Hamma so'rov **1 ta URL**ga keladi:

```
POST  https://pravaonline.uz/api/payment/payme
Authorization: Basic base64(Paycom:<CASHBOX_KEY>)
```

Payme chaqiradigan metodlar:

| Method | Maqsad | Sizning javobingiz |
|--------|--------|--------------------|
| `CheckPerformTransaction` | Tranzaktsiya imkoniyatini tekshirish | order ID va amount to'g'riligini qaytarish |
| `CreateTransaction` | Tranzaktsiya yaratish | transaction ID, state=1, create_time |
| `PerformTransaction` | Tranzaktsiyani yakunlash | transaction, state=2, perform_time, foydalanuvchiga kirish ruxsat berish |
| `CancelTransaction` | Bekor qilish | state=-1 yoki -2, cancel_time, ruxsatni olib tashlash |
| `CheckTransaction` | Holat olish | state, create_time, perform_time, cancel_time |
| `GetStatement` | Hisobot | tranzaktsiyalar ro'yxati berilgan davr uchun |

**Autentifikatsiya:** Har bir request'da `Authorization: Basic Paycom:<CASHBOX_KEY>` bo'ladi. Siz buni **har doim tekshirishingiz** kerak, aks holda soxta so'rovlar mumkin.

**Xatolik kodlari (JSON-RPC):** -31001 dan -31099 gacha Payme standart error kodlari. Misol:
- `-31050` — foydalanuvchi topilmadi
- `-31001` — noto'g'ri summa
- `-31003` — tranzaktsiya topilmadi
- `-31008` — operation bajarib bo'lmaydi

---

## 4-QISM. TEXNIK INTEGRATSIYA (Prava Online kodiga)

Sizda allaqachon `ExamPackage` entitida `isFree` va `price` (BigDecimal) maydonlari bor — bu yaxshi. Endi payment qatlamini quramiz.

### 4.1. Yangi entitylar (backend/src/main/java/uz/pravaimtihon/entity/)

**`Payment.java`** — yaratish kerak:

```java
@Entity
@Table(name = "payments", indexes = {
    @Index(name = "idx_payment_user", columnList = "user_id"),
    @Index(name = "idx_payment_package", columnList = "package_id"),
    @Index(name = "idx_payment_provider_tx", columnList = "provider, provider_transaction_id"),
    @Index(name = "idx_payment_status", columnList = "status")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Payment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id", nullable = false)
    private ExamPackage examPackage;

    @Column(name = "amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal amount; // so'mda

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false)
    private PaymentProvider provider; // CLICK, PAYME

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PaymentStatus status; // PENDING, COMPLETED, FAILED, REFUNDED, CANCELLED

    @Column(name = "provider_transaction_id", length = 100)
    private String providerTransactionId; // Click yoki Payme id

    @Column(name = "merchant_order_id", length = 100, unique = true)
    private String merchantOrderId; // sizning unique order ID

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancel_reason", length = 500)
    private String cancelReason;

    @Column(name = "raw_response", columnDefinition = "TEXT")
    private String rawResponse; // debug/audit uchun
}
```

**`UserPackageAccess.java`** — foydalanuvchi qaysi paketga ega ekanligi:

```java
@Entity
@Table(name = "user_package_access",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "package_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserPackageAccess extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id", nullable = false)
    private ExamPackage examPackage;

    @Column(name = "granted_at", nullable = false)
    private LocalDateTime grantedAt;

    @Column(name = "expires_at") // null = umrbod
    private LocalDateTime expiresAt;

    @ManyToOne
    @JoinColumn(name = "payment_id")
    private Payment payment;
}
```

**Enum `PaymentProvider.java`:**

```java
public enum PaymentProvider {
    CLICK, PAYME, MANUAL
}
```

### 4.2. Flyway migration (backend/src/main/resources/db/migration/)

Fayl nomi: `V20260418_001__add_payment_tables.sql`

```sql
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    package_id BIGINT NOT NULL REFERENCES exam_packages(id),
    amount NUMERIC(12,2) NOT NULL,
    provider VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    provider_transaction_id VARCHAR(100),
    merchant_order_id VARCHAR(100) UNIQUE,
    paid_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancel_reason VARCHAR(500),
    raw_response TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_payment_user ON payments(user_id);
CREATE INDEX idx_payment_package ON payments(package_id);
CREATE INDEX idx_payment_provider_tx ON payments(provider, provider_transaction_id);
CREATE INDEX idx_payment_status ON payments(status);

CREATE TABLE user_package_access (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    package_id BIGINT NOT NULL REFERENCES exam_packages(id),
    payment_id BIGINT REFERENCES payments(id),
    granted_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(user_id, package_id)
);
CREATE INDEX idx_upa_user ON user_package_access(user_id);
```

### 4.3. Controller'lar (backend/src/main/java/uz/pravaimtihon/controller/)

**`ClickPaymentController.java`:**

```java
@RestController
@RequestMapping("/api/payment/click")
@RequiredArgsConstructor
@Slf4j
public class ClickPaymentController {

    private final ClickPaymentService clickService;

    // Click webhook'lari: Click tomonidan chaqiriladi, auth talab qilinmaydi (sign_string bilan verify qilinadi)
    @PostMapping(value = "/prepare", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ClickResponse prepare(ClickRequest req) {
        return clickService.prepare(req);
    }

    @PostMapping(value = "/complete", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ClickResponse complete(ClickRequest req) {
        return clickService.complete(req);
    }

    // Foydalanuvchi uchun: to'lov linkini yaratish
    @PostMapping("/create-invoice")
    @PreAuthorize("isAuthenticated()")
    public ClickInvoiceResponse createInvoice(@RequestBody CreateInvoiceRequest req, Authentication auth) {
        return clickService.createInvoice(req.getPackageId(), auth.getName());
    }
}
```

**`PaymePaymentController.java`:**

```java
@RestController
@RequestMapping("/api/payment/payme")
@RequiredArgsConstructor
@Slf4j
public class PaymePaymentController {

    private final PaymePaymentService paymeService;

    @PostMapping
    public Object handle(@RequestHeader("Authorization") String auth,
                         @RequestBody JsonRpcRequest req) {
        return paymeService.handle(auth, req);
    }

    @PostMapping("/create-checkout-url")
    @PreAuthorize("isAuthenticated()")
    public PaymeCheckoutResponse createUrl(@RequestBody CreateCheckoutRequest req, Authentication authn) {
        return paymeService.createCheckoutUrl(req.getPackageId(), authn.getName());
    }
}
```

### 4.4. `SecurityConfig` ni yangilash

Click va Payme webhook'lari **JWT talab qilmaydi** — ular ommaviy URL bo'lishi va security filter'dan **o'tmasligi** kerak (aks holda 401 bilan rad etiladi). Lekin ular IP whitelist + signature verification bilan himoyalanadi.

`SecurityConfig.java` ichida:
```java
.requestMatchers("/api/payment/click/prepare", "/api/payment/click/complete").permitAll()
.requestMatchers("/api/payment/payme").permitAll()
```

Qo'shimcha — **filter** yaratib, Click webhooklariga faqat Click IP diapazonidan kiradigan so'rovlarni qabul qilish (Click sizga IP ro'yxatini beradi, odatda `213.230.x.x`).

### 4.5. Click invoice URL yaratish (foydalanuvchi uchun)

Click'ning oddiy usuli — URL orqali yo'naltirish:

```
https://my.click.uz/services/pay?service_id=XXX&merchant_id=YYY&amount=50000&transaction_param=order_42&return_url=https%3A%2F%2Fpravaonline.uz%2Fpayment%2Fsuccess
```

Service metodi:
```java
public String buildClickRedirectUrl(Long paymentId, BigDecimal amount) {
    return String.format(
        "https://my.click.uz/services/pay?service_id=%s&merchant_id=%s&amount=%s&transaction_param=%d&return_url=%s",
        serviceId, merchantId, amount.toPlainString(), paymentId,
        URLEncoder.encode("https://pravaonline.uz/payment/success", UTF_8));
}
```

### 4.6. Payme checkout URL yaratish

Payme'da foydalanuvchini **base64-encoded** URL orqali yo'naltirasiz:

```
https://checkout.paycom.uz/<base64(m=MERCHANT_ID;ac.order_id=42;a=50000000)>
```

> **E'tibor:** Payme `tiyin`da ishlaydi — 50 000 so'm = `5000000` tiyin. 100 ga ko'paytiring!

```java
public String buildPaymeCheckoutUrl(Long paymentId, BigDecimal amountSum) {
    long amountTiyin = amountSum.multiply(BigDecimal.valueOf(100)).longValueExact();
    String params = String.format("m=%s;ac.order_id=%d;a=%d;l=uz", merchantId, paymentId, amountTiyin);
    String base64 = Base64.getEncoder().encodeToString(params.getBytes(StandardCharsets.UTF_8));
    return "https://checkout.paycom.uz/" + base64;
}
```

### 4.7. Click sign_string tekshirish

```java
private boolean verifyClickSignature(ClickRequest r, String secretKey) {
    String raw = r.getClickTransId() + r.getServiceId() + secretKey +
                 r.getMerchantTransId() +
                 (r.getAction() == 1 ? r.getMerchantPrepareId() : "") +
                 r.getAmount() + r.getAction() + r.getSignTime();
    String computed = DigestUtils.md5Hex(raw);
    return computed.equalsIgnoreCase(r.getSignString());
}
```

### 4.8. Payme authorization tekshirish

```java
private boolean verifyPaymeAuth(String authHeader) {
    if (authHeader == null || !authHeader.startsWith("Basic ")) return false;
    String decoded = new String(Base64.getDecoder().decode(authHeader.substring(6)));
    // format: "Paycom:CASHBOX_KEY"
    String[] parts = decoded.split(":", 2);
    return parts.length == 2 && "Paycom".equals(parts[0]) && cashboxKey.equals(parts[1]);
}
```

### 4.9. `application.yml` konfiguratsiyasi

```yaml
payment:
  click:
    service-id: ${CLICK_SERVICE_ID}
    merchant-id: ${CLICK_MERCHANT_ID}
    merchant-user-id: ${CLICK_MERCHANT_USER_ID}
    secret-key: ${CLICK_SECRET_KEY}
    return-url: https://pravaonline.uz/payment/success
  payme:
    merchant-id: ${PAYME_MERCHANT_ID}
    cashbox-key: ${PAYME_CASHBOX_KEY}
    checkout-base: https://checkout.paycom.uz
    test-mode: false
```

Bularni `.env` faylida saqlash — **repositoryga commit qilmaslik!** (sizda `.gitignore` bor, lekin `.env.example` da faqat placeholder qoldiring).

### 4.10. Frontend (React) qismi

`frontend/prava-test/src/` ichida yangi sahifalar:

**`PaymentPage.tsx`** — paket tanlanganda:
```tsx
import { Button, Card, Group, Stack, Text, Title } from '@mantine/core';

export default function PaymentPage({ pkg }: { pkg: ExamPackage }) {
  const handleClick = async () => {
    const r = await api.post('/api/payment/click/create-invoice', { packageId: pkg.id });
    window.location.href = r.data.redirectUrl;
  };

  const handlePayme = async () => {
    const r = await api.post('/api/payment/payme/create-checkout-url', { packageId: pkg.id });
    window.location.href = r.data.checkoutUrl;
  };

  return (
    <Card shadow="sm" p="lg">
      <Title order={3}>{pkg.name}</Title>
      <Text>Narx: {pkg.price.toLocaleString('uz-UZ')} so'm</Text>
      <Stack mt="md">
        <Button color="blue" onClick={handleClick}>Click orqali to'lash</Button>
        <Button color="teal" onClick={handlePayme}>Payme orqali to'lash</Button>
      </Stack>
    </Card>
  );
}
```

**`/payment/success`** va **`/payment/failed`** sahifalari — Click/Payme foydalanuvchini shu URL'larga qaytaradi. U yerda backend'dan payment holati so'raladi.

**Paket kirish ruxsatini tekshirish:** Hamma test boshlash endpoint'laridagi `ExamController`da:
```java
if (!pkg.getIsFree() && !userPackageAccessRepo.existsByUserAndExamPackage(user, pkg)) {
    throw new ApiException(HttpStatus.PAYMENT_REQUIRED, "Bu paket uchun to'lov talab qilinadi");
}
```

### 4.11. Idempotency va concurrency

Eng muhim **xavflar**:

1. **Ikki marta kirish ruxsati berish:** Click `complete` webhook'i bir necha marta kelishi mumkin. Siz `@Transactional` + unique constraint (`user_id, package_id`) orqali idempotent qiling.
2. **Signature tekshirmaslik:** Hacker soxta so'rov yuborib, pulsiz ruxsat ochishi mumkin. **Hech qachon signature/auth'ni o'tkazib yubormang.**
3. **Summa tekshirish:** Foydalanuvchi URL'dagi `amount`ni 10 so'mga o'zgartirishi mumkin. Har doim `Payment.amount == ExamPackage.price` ekanligini serverda tekshiring.
4. **Pending payment'larni tozalash:** `@Scheduled` (sizda `scheduler/` katalogi bor) bilan 30 daqiqadan keyin `PENDING` holatidagi payment'larni `CANCELLED` ga o'tkazing.

---

## 5-QISM. XAVFSIZLIK, HUQUQIY VA SOLIQ JIHATLARI

### 5.1. Saytda majburiy bo'lgan sahifalar/hujjatlar

| Hujjat | Nima bo'lishi kerak | Qayerda |
|--------|---------------------|---------|
| **Ommaviy oferta** (Публичная оферта) | Shartnoma matni: xizmat turi, narx, to'lov tartibi, qaytarish shartlari | Footer + `/oferta` sahifa |
| **Maxfiylik siyosati** | Qanday ma'lumot to'planadi, kimga beriladi, saqlash muddati | `/privacy` |
| **Foydalanish shartlari** | Foydalanuvchi va platforma majburiyatlari | `/terms` |
| **Refund Policy** | Qachon va qanday pul qaytariladi | `/refund` yoki oferta ichida |
| **Rekvizitlar** | YATT nomi, STIR, manzil, bank, tel, email | Footer + `/contacts` |

**Muhim:** Click va Payme juristlari **albatta** bu sahifalarni tekshiradi. Agar `/oferta` sahifangiz bo'lmasa — shartnoma rad etiladi.

### 5.2. Oferta shartnomasiga majburiy kiritilishi kerak bo'lgan bandlar

1. Taraflar (YATT va foydalanuvchi)
2. Xizmat predmeti (paketlarga kirish, imtihon testlari)
3. Narx va to'lov tartibi (Click/Payme orqali)
4. Xizmat ko'rsatish muddati (masalan, sotib olingandan 1 yil yoki umrbod)
5. Huquq va majburiyatlar
6. Pul qaytarish shartlari (O'zR Fuqarolik Kodeksi 415-moddasi asosida — **raqamli xizmatlarda** agar foydalanuvchi paketni "ochmagan" bo'lsa, 14 kun ichida qaytarilishi mumkin; ochilganidan keyin qaytarilmaydi — lekin buni ofertada **aniq yozish** kerak)
7. Maxfiylik
8. Force majeure
9. Nizolarni hal qilish (O'zR qonunchiligi, Toshkent shahar iqtisodiy sudi)
10. Rekvizitlar va imzo

### 5.3. Shaxsiy ma'lumotlar to'g'risidagi qonun

O'zR "Shaxsiy ma'lumotlar to'g'risida"gi qonuni (2019-yil) talab qiladi:
- Ma'lumotlar **O'zbekiston hududidagi serverlarda** saqlanishi (sizning serveringiz `164.68.100.190` — Contabo Germany. Bu **qonun buzilishi**, lekin amalda hozirgacha jazo qo'llanilmagan. Uzuzhost/BPC/Uztelecom server olishni o'ylab ko'ring yoki DB'ni O'zbekistonda saqlang).
- Foydalanuvchi roziligini olish (checkbox ro'yxatdan o'tishda)
- `Shaxsiy ma'lumotlar operatori` sifatida **ro'yxatdan o'tish**: `personaldata.uz`

### 5.4. E-faktura va kassa cheki

- **Har bir to'lovda** `faktura.soliq.uz` orqali elektron ХФ yuborish majburiy (jismoniy shaxslarga ham)
- Click va Payme kabinetida "avtomatik ХФ" funksiyasi bor — uni yoqing
- Agar yoqmasangiz — o'zingiz `soliq.uz` API orqali integratsiya qilasiz (bu alohida ish)
- **Onlayn-kassa (Virtualkassa):** Raqamli xizmatlar uchun zarur emas, ammo `kassa.soliq.uz`'dan foydalanish tavsiya etiladi

### 5.5. Soliqlar (yillik taxmin)

Taxminiy holat: oylik 10 mln so'm oborot = yillik 120 mln so'm.

| Rejim | Soliq | Yillik summa (120M so'm uchun) |
|-------|-------|------------------------------|
| Oborotdan soliq 4% | 4% | 4 800 000 so'm |
| Oborotdan soliq 2% (e-commerce) | 2% | 2 400 000 so'm |
| IT-Park rezident | 0% | **0 so'm** |
| Ijtimoiy soliq (YATT o'zi uchun) | Oyiga 1 MROT ≈ | yillik ~1.2 mln so'm |

**Xulosa:** IT-Park rezident bo'lish **eng foydali variant** sizning holatingizda. Ariza `it-park.uz`'da.

### 5.6. Click/Payme komissiyalari va sof foyda

Misol: foydalanuvchi **50 000 so'm** to'laydi.

- Click komissiyasi (~2%): **1 000 so'm**
- Siz olasiz: **49 000 so'm**
- Soliq (2% e-commerce): **1 000 so'm**
- Sof foyda: **~48 000 so'm**

IT-Park rezident bo'lsangiz — soliq 0, sof foyda **49 000 so'm**.

### 5.7. Pul yechib olish cheklovlari (YATT uchun)

- YATT hisobidan **shaxsiy kartangizga** pul yechish — erkin, cheklovsiz
- Naqd shaklda: oyiga limitlar bor (odatda 50 mln so'mgacha erkin)
- Bank plastik kartaga to'g'ridan-to'g'ri — Kapitalbank, Anor, TBC'da oddiy

---

## 6-QISM. QADAMMA-QADAM AMALIY REJA (Checklist)

### Hafta 1 — Huquqiy va moliyaviy tayyorgarlik

- [ ] YATT guvohnomasi va STIR borligini tekshirish
- [ ] OKED kodlariga 62.01, 62.09, 85.59 qo'shish (kerak bo'lsa soliq'ga ariza)
- [ ] IT-Park rezidentlikka ariza topshirish (`it-park.uz`)
- [ ] Tijorat bankida YATT hisobi ochish (hali ochilmagan bo'lsa)
- [ ] ERI (elektron raqamli imzo) olish: `my.gov.uz`
- [ ] `faktura.soliq.uz`'da ro'yxatdan o'tish
- [ ] `personaldata.uz`'da shaxsiy ma'lumotlar operatori sifatida ariza
- [ ] `cctld.uz`'da pravaonline.uz domen egaligini YATT nomida ekanligini tekshirish

### Hafta 2 — Sayt huquqiy sahifalarini tayyorlash

- [ ] Ommaviy oferta matni yozish va saytga joylash (`/oferta`)
- [ ] Maxfiylik siyosati (`/privacy`)
- [ ] Foydalanish shartlari (`/terms`)
- [ ] Refund policy (`/refund`)
- [ ] Rekvizitlar footer'da (YATT nomi, STIR, manzil, tel, email)
- [ ] Narxlar aniq ko'rsatilishi (har bir paket uchun so'mda)
- [ ] Foydalanuvchi kelishuvi checkbox ro'yxatdan o'tishda ("Ofertaga roziman")

### Hafta 3 — Click bilan integratsiya

- [ ] `merchant.click.uz`'da YATT sifatida ariza
- [ ] Hujjatlarni yuklash (Pasport, YATT, bank, oferta skrinshot)
- [ ] Test kalitlarini olish
- [ ] Backend'da `Payment`, `UserPackageAccess` entitylar, migration, servicelar
- [ ] `ClickPaymentController` — `prepare`, `complete`, `create-invoice`
- [ ] `SecurityConfig`'da webhook path'larni `permitAll`
- [ ] Signature verification (md5 hash)
- [ ] Frontend'da Click tugmasi + `/payment/success`, `/payment/failed`
- [ ] **Test rejimida** 5-10 ta tranzaktsiya o'tkazish
- [ ] Production kalitlariga o'tish

### Hafta 4 — Payme bilan integratsiya

- [ ] `business.payme.uz`'da ariza + hujjatlar
- [ ] Test kassasi
- [ ] `PaymePaymentController` — JSON-RPC handler
- [ ] 6 ta metod: `CheckPerformTransaction`, `CreateTransaction`, `PerformTransaction`, `CancelTransaction`, `CheckTransaction`, `GetStatement`
- [ ] Basic Auth verification
- [ ] Summa tiyinda ekanligini tekshirish (x100)
- [ ] Frontend'da Payme tugmasi, base64 URL yaratish
- [ ] Test + production'ga o'tish

### Hafta 5 — Paket ruxsatlari, ishlab chiqarish monitoringi

- [ ] `ExamController`'da paid package uchun kirish ruxsatini tekshirish (`UserPackageAccess`)
- [ ] Admin panelda: foydalanuvchi to'lovlari tarixi, qo'lda ruxsat berish imkoniyati (test/promo uchun)
- [ ] `@Scheduled` job: 30 daqiqadan eski `PENDING` payment'larni `CANCELLED` qilish
- [ ] Telegram bot (sizda bor) orqali admin'ga har bir to'lov haqida xabar
- [ ] Prometheus metrics (sizda `SystemMonitorController` bor) — payment_success_count, payment_fail_count
- [ ] Logging: har bir webhook so'rovi va javobi alohida logga yoziladi (`logs/` katalogi)
- [ ] E-faktura avtomatik yuborish (Click/Payme kabinetidan yoqish)

### Hafta 6 — Live'ga chiqish

- [ ] Xavfsizlik audit: signature verification, IP whitelist, rate limiting
- [ ] Beta tester'lar (5-10 kishi) real to'lovlar o'tkazadi
- [ ] Xatolik stsenariylarini sinash: to'lov yarmida uzildi, double webhook, noto'g'ri summa
- [ ] Qaytarish stsenariysini sinash (Click/Payme kabinetidan refund qilib ko'rish)
- [ ] Marketing: ijtimoiy tarmoqlar, SEO, reklama

---

## 7-QISM. TEZ-TEZ UCHRAYDIGAN XATOLAR

1. **"Webhook javobi 401 qaytarayapti"** — Security config'da path'ni `permitAll` qilmaganligingiz. JWT filter'ga `/api/payment/**` istisno qo'shing.
2. **"Click to'lov o'tdi, lekin foydalanuvchiga ruxsat berilmadi"** — `complete` webhook signature tekshirish muvaffaqiyatsiz. Log'ni qarab, qaysi maydon mos kelmaganini aniqlang.
3. **"Payme har xil summa ko'rsatayapti"** — tiyin/so'm xatoligi. Payme **har doim tiyinda** ishlaydi.
4. **"Test rejimida ishladi, production'da ishlamayapti"** — production URL'lari boshqacha, secret_key boshqa, IP cheklovlari boshqa. Alohida muhit o'zgaruvchilari kerak.
5. **"Shartnoma rad etildi — sayt sifati past"** — sayt mobile'da ishlamasligi, HTTPS sertifikat xatosi, oferta yo'qligi. Arizadan oldin `lighthouse` bilan auditni o'tkazing.
6. **"E-faktura yuborilmayapti"** — qo'lda Click/Payme kabinetidan "avtomatik ХФ" funksiyasini yoqing yoki `soliq.uz` API bilan o'zingiz integratsiyalang.
7. **"Foydalanuvchi ikki marta pul to'ladi"** — `merchantOrderId` unique bo'lmay qolgan, yoki frontend'da tugma ikki marta bosilgan. Disable tugma + database constraint.

---

## 8-QISM. FOYDALI RESURSLAR

- **Click API:** <https://docs.click.uz/>
- **Payme Business:** <https://developer.help.paycom.uz/>
- **Soliq portali:** <https://soliq.uz>
- **E-faktura:** <https://faktura.soliq.uz>
- **IT Park:** <https://it-park.uz>
- **Shaxsiy ma'lumotlar reyestri:** <https://personaldata.uz>
- **CCTLD (.uz domenlar):** <https://cctld.uz>
- **My.gov.uz (ERI):** <https://my.gov.uz>

---

## XULOSA — BUGUN BIRINCHI 5 QADAM

1. **IT-Park rezidentligiga ariza topshiring** (0% soliq). Onlayn `it-park.uz`da.
2. **Ofertangizni yozing va saytga joylang** (bu eng ko'p vaqt oladigan ish, juristdan yordam oling).
3. **`merchant.click.uz` va `business.payme.uz`'da ariza topshiring** — tasdiq 1 haftagacha vaqt oladi.
4. **Backend'da `Payment` va `UserPackageAccess` entitylarini yarating** (4.1, 4.2 bo'limga qarang).
5. **Test muhitida Click integratsiyasini ishga tushiring** — Payme keyingi.

Muvaffaqiyat tilayman! Savollar bo'lsa, alohida bosqich bo'yicha detallarga kirib yordam bera olaman — masalan "Payme JSON-RPC handler'ni tayyor yozib ber" desangiz ham, "Oferta shablonini yozib ber" desangiz ham.
