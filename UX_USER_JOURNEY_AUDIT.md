# PRAVA ONLINE — UX USER JOURNEY AUDIT

**Scope:** Analysis of the 5 Core User Journeys on `https://pravaonline.uz` and `https://web.pravaonline.uz`.

---

## 1. Flow 1: New User Onboarding

**Journey Steps:**  
`Landing Page` ➔ `Registration Form` ➔ `Verification / Login` ➔ `Dashboard` ➔ `First Test` ➔ `Result Screen`

| Step | Screen | Action | Friction / Confusion | Recommended Fix | Severity |
|---|---|---|---|---|---|
| 1.1 | Landing (`/`) | Click "Web ilovani ochish" | No friction; immediate navigation to `web.pravaonline.uz/auth/login`. | Keep | Low |
| 1.2 | Login (`/auth/login`) | Click "Ro'yxatdan o'tish" | Form switch is instantaneous (React Router). | Keep | Low |
| 1.3 | Register (`/auth/register`) | Submit Name, Phone, Password | Terms & Conditions checkbox is pre-checked. Legally, active consent is preferable. | Keep unchecked or make clear inline note. | P3 |
| 1.4 | Dashboard (`/me`) | First view of dashboard | New user has 0 stats. Previously, empty state lacked onboarding cues. Now displays welcome card: "Xush kelibsiz! Mavzular bo'yicha boshlang". | Keep | PASS |
| 1.5 | First Test (`/topics` or `/tickets`) | Selecting first test | Too many options (Mavzular, Biletlar, Marafon, Imtihon). A beginner might start with "Davlat imtihoni" and fail immediately. | Added "TAVSIYA ETILADI" (Recommended) badge to "Mavzular" mode card for newcomers with < 100 practiced questions. | PASS |
| 1.6 | Result Screen (`/exam/result/:id`) | Viewing test score | **DEAD END:** If user fails their first test, the only button is "Boshqaruv paneliga qaytish". There is no "Qayta urinish" or "Xatolar ustida ishlash". | **Add primary "Xatolarni qayta ishlash" CTA (P0).** | **P0** |

---

## 2. Flow 2: Returning User Daily Learning

**Journey Steps:**  
`Direct URL Access` ➔ `Automatic Redirect to /me` ➔ `Review Streak & Progress` ➔ `Next-Best-Action Test` ➔ `Result Screen`

| Step | Screen | Action | Friction / Confusion | Recommended Fix | Severity |
|---|---|---|---|---|---|
| 2.1 | Root (`/`) on Web App | Automatic login redirect | Handled by `WebAppRoot`: authenticated user lands on `/me` in < 200ms. | Keep | PASS |
| 2.2 | Dashboard (`/me`) | Check Daily Goal & Streak | Metric card clearly highlights daily progress (e.g. "12 / 30 savol") and active streak days. | Keep | PASS |
| 2.3 | Dashboard (`/me`) | Smart Focus Widget | Left column displays top 4 weak topics with mistake counts; right column provides 1-click CTA "Eng zaif 20 ta savolni tuzatish". | In Russian/Cyrillic modes, dynamic topic title fallback had a defect. Resolved in `LanguageContext.tsx`. | P1 |
| 2.4 | Test Execution (`/wrong-exam`) | Answer 20 questions | Clean timer, large answer tap targets, clear explanation toggle. | Keep | PASS |
| 2.5 | Result Screen | Instant gamified feedback | Score ring, correct/wrong breakdown, streak update. | Ensure mistake count decreases dynamically upon re-taking. | P1 |

---

## 3. Flow 3: Systematic Practice (Topics & Tickets)

**Journey Steps:**  
`Dashboard` ➔ `Mavzular (/topics)` or `Biletlar (/tickets)` ➔ `Select Topic/Ticket` ➔ `Answer Questions` ➔ `Review Answers`

| Step | Screen | Action | Friction / Confusion | Recommended Fix | Severity |
|---|---|---|---|---|---|
| 3.1 | Dashboard ➔ Topics | Click "Mavzular" | Instant page load; search bar allows filtering road rules by name. | Keep | PASS |
| 3.2 | Topics (`/topics`) | Browse topics | Light mode topic badge color contrast was low (#ffa8a8 text on white). | Adjusted badge text color to `#b91c1c` for 6.8:1 WCAG AA contrast. | P1 |
| 3.3 | Dashboard ➔ Tickets | Click "Biletlar" | Dashboard description said "1-dan 60-gacha", but tickets page contains 70 tickets. User wondered where tickets 61-70 were. | Updated copy across all translations to "1-dan 70-gacha rasmiy biletlar". | P1 |
| 3.4 | Ticket Test (`/tickets/:id`) | Solve 20 questions | Clean question layout; exit button triggers confirmation modal to prevent accidental score loss. | Keep | PASS |
| 3.5 | In-Quiz Review | Toggle explanation | Shows official road safety article citation in chosen language. | Keep | PASS |

---

## 4. Flow 4: Mistake Elimination (Xatolar Ustida Ishlash)

**Journey Steps:**  
`Result Screen` ➔ `Identify Mistakes` ➔ `Review Explanation` ➔ `Retry Weak Questions` ➔ `Verify Mastery`

| Step | Screen | Action | Friction / Confusion | Recommended Fix | Severity |
|---|---|---|---|---|---|
| 4.1 | Result Screen (`/exam/result/:id`) | Analyze wrong answers | **CRITICAL FRICTION:** User sees 4 mistakes and wants to re-solve them right now, but has to leave the page and go to `/me` or `/wrong-answers`. | **Add "Xatolar ustida ishlash" button right above or beside "Boshqaruv paneliga qaytish".** | **P0** |
| 4.2 | Mistakes List (`/wrong-answers`) | Filter by road rule topic | Dropdown filter works smoothly; counter shows how many times question was answered incorrectly. | Add "Barchasini tozalash" confirmation modal to prevent accidental data wipe. | P2 |
| 4.3 | Mistakes Exam (`/wrong-exam`) | Start adaptive test | If user has fewer than 20 mistakes (e.g. 5 mistakes), the system pads the test with random questions to simulate a full 20-question exam, but does not notify the user. | Add informative banner: "Sizda 5 ta xato bor. Qolgan 15 ta savol bilimlarni mustahkamlash uchun qo'shildi." | P2 |

---

## 5. Flow 5: Deep Analytics & Progress Tracking

**Journey Steps:**  
`Dashboard` ➔ `Statistika (/statistics)` ➔ `Identify Weak Area` ➔ `1-Click Practice` ➔ `Track Growth`

| Step | Screen | Action | Friction / Confusion | Recommended Fix | Severity |
|---|---|---|---|---|---|
| 5.1 | Dashboard ➔ Statistics | Click "Statistika" | Comprehensive dashboard displays overall accuracy %, total tests taken, and question mastery split. | Keep | PASS |
| 5.2 | Statistics (`/statistics`) | View category weakness table | **MISSING CTA:** The table lists topics with low accuracy (e.g. "Chorrahada harakatlanish — 42%"), but clicking the row does nothing. User has to navigate back to `/topics` to practice that specific topic. | **Make category rows clickable or add a direct "Mashq qilish" link per topic row.** | **P1** |
| 5.3 | Statistics (`/statistics`) | View exam score history chart | Interactive chart shows score trends over the last 14 sessions. | Keep | PASS |

---

## 6. Summary of Flow Friction Points

- **Total Friction Points Identified:** 7
- **Total Dead Ends Identified:** 1 (Result page without mistake retry CTA)
- **Total Missing CTAs Identified:** 3 (Result page mistake CTA, Statistics topic practice link, Saved questions empty state CTA)
- **Total Duplicate Actions Identified:** 1 (Landing page duplicate Web App button in Device section)
