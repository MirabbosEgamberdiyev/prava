# PRAVA ONLINE — AUDIT REMEDIATION IMPLEMENTATION PLAN

**Date:** 2026-09-18  
**Scope:** Remediation of all P0 Critical and P1 High Priority issues discovered during the 360° Production Web Audit.

---

## 1. P0 Critical Fixes (Immediate Execution)

### P0-1: Result Page Mistake Practice & Retry CTAs
- **Target File:** `d:\My-project\PRAVA-ONLINE\prava\prava\frontend\prava-test\src\features\ExamResult\components\ExamResultPage.tsx`
- **Problem:** Currently, when an exam finishes, the result page provides only a single action: "Boshqaruv paneliga qaytish" (`/me`). If the user has made mistakes, there is no direct action to practice those mistakes or re-attempt the exam, creating a dead-end friction point in the primary learning loop.
- **Fix:**
  - Add primary CTA: "Xatolar ustida ishlash" (`/wrong-exam`) when `result.incorrectCount > 0`.
  - Add secondary CTA: "Qayta urinish" (`/exam` or retry session).
  - Retain tertiary CTA: "Boshqaruv paneliga qaytish" (`/me`).
  - Add translations for `examResult.practiceMistakes` and `examResult.retryExam` in `uzl`, `uzc`, and `ru`.

### P0-2: Topic Localization Fallback for "Eng Ko'p Xato Tushgan Yo'nalishlar"
- **Target Files:**
  - `d:\My-project\PRAVA-ONLINE\prava\prava\frontend\prava-test\src\context\LanguageContext.tsx`
  - `d:\My-project\PRAVA-ONLINE\prava\prava\frontend\prava-test\src\page\me\index.tsx`
- **Problem:** In Russian (`ru`) and Cyrillic (`uzc`) modes, if topics returned from the backend use camelCase fields (`nameRu`, `nameUzc`, `nameUzl`) or nested objects, `localizeTopic` fell back to Uzbek Latin or raw "Mavzu #ID" string.
- **Fix:**
  - Update `localizeTopic` in `LanguageContext.tsx` to check all potential field casing (`name_ru`, `nameRu`, `name?.ru`, `name_uzc`, `nameUzc`, `name?.uzc`, `name_uzl`, `nameUzl`, `name?.uzl`, `name`).
  - Ensure `OFFICIAL_TOPIC_MAP` provides rich multi-language names for any unmapped IDs.

### P0-3: Outdated Ticket Count Consistency ("1-dan 60-gacha" ➔ "1-dan 70-gacha")
- **Target Files:**
  - `d:\My-project\PRAVA-ONLINE\prava\prava\frontend\prava-test\src\page\me\index.tsx`
  - `d:\My-project\PRAVA-ONLINE\prava\prava\frontend\prava-test\src\services\desktopAdapter.ts`
  - `d:\My-project\PRAVA-ONLINE\prava\prava\frontend\prava-test\public\locales\uzl\translation.json`
  - `d:\My-project\PRAVA-ONLINE\prava\prava\frontend\prava-test\public\locales\uzc\translation.json`
  - `d:\My-project\PRAVA-ONLINE\prava\prava\frontend\prava-test\public\locales\ru\translation.json`
- **Problem:** The system contains 70 official tickets, and the landing page advertises 70 tickets. However, the dashboard mode description and `desktopAdapter.ts` fallback generator specified 60 tickets ("1-dan 60-gacha"), confusing students.
- **Fix:**
  - Update description to "1-dan 70-gacha rasmiy biletlar bilan mustahkamlash" in all 3 language bundles.
  - Update `desktopAdapter.ts` fallback loop to generate all 70 tickets (`for (let i = 1; i <= 70; i++)`).

---

## 2. P1 High Priority Fixes

### P1-1: Color Contrast Ratio (WCAG AA Compliance)
- **Target File:** `d:\My-project\PRAVA-ONLINE\prava\prava\frontend\prava-test\src\page\Topics\index.tsx`
- **Problem:** Palette item 10 in light mode uses `#ffa8a8` border and `#e03131` text on `#fff5f5`, which has insufficient contrast (2.6:1) for low-vision users.
- **Fix:** Adjust text color to `#c92a2a` and border to `#ff8787`, achieving > 4.5:1 contrast ratio.

### P1-2: Hreflang Tags in SEO Component
- **Target File:** `d:\My-project\PRAVA-ONLINE\prava\prava\frontend\prava-test\src\components\common\SEO.tsx`
- **Problem:** Canonical tag was present, but explicit `<link rel="alternate" hreflang="uz-Latn" ... />`, `hreflang="uz-Cyrl"`, and `hreflang="ru"` were not included in the head for search bots.
- **Fix:** Render alternate hreflang tags for all public marketing pages.

### P1-3: Accept-Language Header in Desktop Adapter
- **Target File:** `d:\My-project\PRAVA-ONLINE\prava\prava\frontend\prava-test\src\services\desktopAdapter.ts`
- **Problem:** When calling `/api/v1/app/topics`, the active language was not explicitly attached in the `Accept-Language` header, causing the backend to default to UZL.
- **Fix:** Attach active language header `Accept-Language: uzl | uzc | ru` to all app HTTP calls.

---

## 3. P2 & P3 Backlog Items

### P2 (Medium Priority):
1. **Interactive Web App Preview on Landing:** Transform `Landing_Device_Web_Card` from a simple button into a mini feature showcase card.
2. **Dynamic Mistake Test Notice:** When a user takes a `/wrong-exam` with < 20 mistakes, display an informative banner explaining that supplemental questions were added for thorough practice.
3. **Immutable Caching Headers in Nginx:** Configure 1-year immutable cache for `/assets/*.js` and `/assets/*.css`.
4. **SWR Deduplication Optimization:** Increase `dedupingInterval` to 60s for static topic and ticket lists.

### P3 (Low Priority):
1. **Lottie Confetti Animation:** Trigger confetti when student achieves 100% on the state exam simulator.
2. **Legal Terms Sidebar:** Add floating table of contents sidebar to `/terms` and `/privacy`.
3. **Driving School Lead Modal:** Add celebratory confirmation dialog upon submitting B2B partnership inquiry.

---

## 4. Verification & Regression Plan

1. **Typecheck & Build:** Run `tsc -b && vite build` in `frontend/prava-test` to ensure 0 TypeScript errors and 0 build warnings.
2. **Translation Key Integrity:** Verify that all 3 translation files (`uzl`, `uzc`, `ru`) maintain identical key structures.
3. **Contrast Verification:** Test light and dark mode colors with Chrome DevTools accessibility color contrast inspector.
4. **User Flow Testing:** Verify that clicking "Xatolar ustida ishlash" on `/exam/result/:id` correctly initiates `/wrong-exam` with the failed questions.
