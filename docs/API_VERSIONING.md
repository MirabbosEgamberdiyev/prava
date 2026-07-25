# API versiyalash konvensiyasi

## Joriy holat

Loyihada ikkita API versiyasi bir vaqtda ishlatiladi:

- **`/api/v1/...`** — asosiy, tarixiy endpointlar (auth, admin CRUD, fayllar,
  eski exam controller va h.k.). Bu default.
- **`/api/v2/...`** — faqat quyidagi 4 ta controller uchun, eski `/api/v1`
  versiyasiga nisbatan buzuvchi (breaking) o'zgarish kiritilganda ochilgan:
  - `ExamControllerV2` → `/api/v2/exams` (eski `/api/v1/exams`ning
    kengaytirilgan/o'zgartirilgan javob formati)
  - `TicketController` → `/api/v2/tickets`
  - `UserStatisticsController` → `/api/v2/my-statistics`
  - `AdminStatisticsController` → `/api/v2/admin/statistics`

## Nega bittalashtirilmagan (v1'ga migratsiya qilinmagan)

`/api/v2/tickets` va `/api/v2/exams`ni Prava-desktop (Tauri/Rust) ilovasi
ham chaqiradi — bu alohida repo, alohida reliz siklida. `/api/v2/...`ni
`/api/v1/...`ga ko'chirish yoki path'ni o'zgartirish **desktop-app'ning
yangi versiyasi chiqmaguncha va o'quv markazlaridagi eski o'rnatilgan
nusxalar yangilanmaguncha ularni buzadi**. Shuning uchun bu audit
doirasida faqat **hujjatlashtirish** qilindi, path'lar o'zgartirilmadi.

## Kelajakda yangi endpoint qo'shishda

- Default holatda **`/api/v1`** ishlating.
- `/api/v2`ni faqat mavjud `/api/v1` endpoint bilan **backward-incompatible**
  o'zgarish kerak bo'lganda, va eski versiyani ham parallel saqlab qolib
  oching (deprecation davri bilan).
- Yangi, mustaqil funksiya uchun (v1 bilan ziddiyat yo'q) — v1'da qoldiring,
  version raqamini shunchaki oshirmang.
