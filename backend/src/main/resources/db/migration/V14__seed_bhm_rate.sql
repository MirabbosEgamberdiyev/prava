-- B-08: boshlang'ich BHM qiymati — klientlardagi DEFAULT_BHM = 375 000 so'm
-- (prava-desktop-online/src/config/bhm.ts, prava-mobile/lib/bhm.ts).
--
-- DIQQAT: klient kodida kuchga kirish sanasi ko'rsatilmagan. 375 000 so'mlik BHM 2024-yil 1-avgustdan
-- amalda deb qabul qilindi — egasi rasmiy manbadan tekshirib, zarur bo'lsa admin API orqali
-- (POST /api/v1/admin/fines/bhm) yangi qiymat qo'shsin; tarix saqlanadi.
--
-- Jarimalar ro'yxati (traffic_fines) bu yerda to'ldirilmaydi: klientlarda BHM koeffitsientli jarimalar
-- ro'yxati mavjud emas ("Jarimalar"/Penalties sahifalari amaliy imtihon jarima BALLARI — practical_penalties).
-- Yuridik ma'lumotni to'qib chiqarmaslik uchun ro'yxat admin API orqali kiritiladi.
--
-- Idempotent: jadval bo'sh bo'lsagina qo'shiladi.
INSERT INTO bhm_rates (amount, effective_from)
SELECT 375000.00, DATE '2024-08-01'
WHERE NOT EXISTS (SELECT 1 FROM bhm_rates);
