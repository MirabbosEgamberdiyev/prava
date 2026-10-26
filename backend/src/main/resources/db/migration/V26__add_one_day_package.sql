-- =====================================================================
--  V26: 1 kunlik (5 000 so'm) paketini qo'shish
-- =====================================================================

INSERT INTO exam_packages (
    id, name_uzl, name_uzc, name_ru, name_en,
    description_uzl, description_uzc, description_ru, description_en,
    price, duration_minutes, question_count, passing_score,
    generation_type, is_active, is_free, order_index,
    created_at, deleted, version
) VALUES (
    7, '1 kun', '1 кун', '1 день', '1 day',
    '1 kunlik to''liq kirish (barcha biletlar, OKTAGON va Real Exam)',
    '1 кунлик тўлиқ кириш (барча билетлар, OKTAGON ва Real Exam)',
    'Полный доступ на 1 день (все билеты, Октагон и Госэкзамен)',
    'Full 1-day access (all tickets, OKTAGON, and Real Exam)',
    5000.00, 25, 700, 18,
    'AUTO_RANDOM', true, false, 0,
    NOW(), false, 0
) ON CONFLICT (id) DO UPDATE SET
    price = 5000.00,
    is_active = true,
    deleted = false,
    name_uzl = '1 kun',
    name_uzc = '1 кун',
    name_ru = '1 день',
    name_en = '1 day';

SELECT setval('exam_packages_id_seq', GREATEST((SELECT MAX(id) FROM exam_packages), 7));
