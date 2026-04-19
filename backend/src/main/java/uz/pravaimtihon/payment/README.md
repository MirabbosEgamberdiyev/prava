# Payment module — plug-and-play

**Status: 100% WIRED.** Backend + frontend + exam gate + routes are all set up.
The only thing you have to do is provide credentials via `.env` and restart.

## Quick start (2 steps)

### 1. Create `.env` in project root

```
CLICK_SERVICE_ID=xxxxx
CLICK_MERCHANT_ID=xxxxx
CLICK_MERCHANT_USER_ID=xxxxx
CLICK_SECRET_KEY=xxxxxxxxxxxxxxxxxxx

PAYME_MERCHANT_ID=xxxxxxxxxxxxxxxxxxxxxxxx
PAYME_CASHBOX_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
PAYME_TEST_CASHBOX_KEY=optional-for-sandbox

# Optional overrides
PAYMENT_FRONTEND_BASE_URL=https://pravaonline.uz
PAYMENT_ENABLED=true
CLICK_ENABLED=true
PAYME_ENABLED=true
```

The config block (`app.payment.*`) is **already merged** into
`application.yaml` and `application-prod.yaml` — you don't need to copy anything
from `application-payment.yml.example` (it's kept only as reference).

### 2. Restart the app

On startup:
- In **prod profile** Flyway applies `V4__add_payment_tables.sql`.
- In **dev profile** Hibernate `ddl-auto: update` creates the tables from
  `@Entity` classes (same schema, same constraints).

That's it. Everything else — routes, buttons, access gate, exception handling —
is already wired into the codebase.

---

## Provider configuration (one-time)

Point Click and Payme at your public URLs in their dashboards:

| Provider | Endpoint | Dashboard setting |
|----------|----------|-------------------|
| Click prepare  | `POST https://pravaonline.uz/api/v1/payment/click/prepare`  | "Prepare URL" |
| Click complete | `POST https://pravaonline.uz/api/v1/payment/click/complete` | "Complete URL" |
| Payme JSON-RPC | `POST https://pravaonline.uz/api/v1/payment/payme`          | "Endpoint" |

## User-facing endpoints (JWT required)

| Verb | Path | Purpose |
|------|------|---------|
| `POST` | `/api/v1/payment/click/invoice` | body `{"packageId":42}` → returns `redirectUrl` |
| `POST` | `/api/v1/payment/payme/invoice` | body `{"packageId":42}` → returns `redirectUrl` |
| `GET`  | `/api/v1/payment/{paymentId}/status` | poll after user returns |

## Admin endpoints (ADMIN / SUPER_ADMIN)

| Verb | Path | Body |
|------|------|------|
| `PATCH` | `/api/v1/admin/packages/{id}/toggle-paid` | `{"paid": true, "price": 50000}` or `{"paid": false}` |
| `GET`   | `/api/v1/admin/packages/{id}/pricing`    | — |

---

## What's already wired

- **Exam gate** — `ExamService.startExam` and `ExamServiceV2.startExamInternal`
  both call `paymentAccessService.hasActiveAccess(...)`. Paid packages without
  access → `402 Payment Required`.
- **Frontend route** — `/payment/success` is registered in `routes/index.tsx`.
- **PaymentButtons modal** — `features/Package/components/Package_Card.tsx`
  opens a payment modal automatically when backend returns `402`.
- **Exception handler** — `PaymentExceptionHandler` catches `PaymentException`
  anywhere in the app and converts to JSON with the correct HTTP status.
- **Shared axios instance** — `payment/paymentApi.ts` reuses the project's
  `api` instance (cookie-based JWT, auto-refresh).

## Security model

- **Provider webhooks** (`/api/v1/payment/click/prepare|complete` and
  `/api/v1/payment/payme`) are on an isolated `@Order(1)` SecurityFilterChain
  with `permitAll`. Integrity is enforced by:
  - Click → MD5 sign_string verification
  - Payme → Basic Auth cashbox key (constant-time compare)
- **User invoice creation** goes through the existing SecurityFilterChain →
  JWT required (handled by the existing filter).
- **Admin toggle-paid** path is under `/api/v1/admin/**` → already ADMIN-only
  in your existing `SecurityConfig`. `@PreAuthorize` re-enforces it.

## Idempotency & edge cases

| Case | Handled by |
|------|-----------|
| Duplicate Click `complete` webhook | `PERFORMED` state short-circuits and returns OK |
| Duplicate Payme `PerformTransaction` | `PERFORMED` short-circuits and returns existing `perform_time` |
| Payme `CreateTransaction` with existing `ac.payment_id` | Adopts existing PENDING instead of creating a duplicate |
| Amount mismatch | rejected with `-31001` / Click `-2` |
| User not found | Click `-5`, Payme `-31050` |
| Package not found | Payme `-31050`, Click `-8` |
| Two concurrent webhooks | `PESSIMISTIC_WRITE` row lock on `payments` |
| Pending never completed | `PaymentSweeper` auto-cancels after `pending-timeout-minutes` |
| Bad signature / bad auth | Click `-1`, Payme `-32504` |
| Refund (Payme cancel after perform) | state → `REFUNDED`, access revoked |
| `UserPackageAccess` double-insert race | unique constraint + catch `DataIntegrityViolationException` |
