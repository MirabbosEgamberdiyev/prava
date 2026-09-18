# PRAVA ONLINE — MASTER CARD AUDIT & SEMANTIC EVALUATION

**Total Cards Documented:** 168 Cards  
**Status Key:**
- `CORRECT`: Ergonomically well-placed, clear purpose, high user value.
- `MISPLACED`: Correct purpose but wrong visual hierarchy or position.
- `DUPLICATE`: Redundant with another card or action on the same page.
- `UNNECESSARY`: Low user value, adds cognitive friction.
- `WRONG PRIORITY`: Too prominent or too subdued for its user importance.
- `MISSING CONTEXT`: Lacks crucial explanatory details or translations.
- `MISSING`: Critical missing card or action required to complete user journey.

---

## 1. Master Card Map

| ID | Page | Section | Card Name | Semantic Purpose | Current Position | Status | Recommendation |
|---|---|---|---|---|---|---|---|
| `CRD-001` | Landing (`/`) | Hero Banner | Official Regulation Badge | Establish state IIV YHXBB legitimacy | Top center of Hero | CORRECT | Keep as primary trust anchor |
| `CRD-002` | Landing (`/`) | Hero Banner | Primary CTA Button | Convert visitors to web app login/register | Hero bottom center (Left) | CORRECT | Visual dominant CTA (`#0284c7`) |
| `CRD-003` | Landing (`/`) | Hero Banner | Secondary CTA Button | Allow 0-friction test before registration | Hero bottom center (Right) | CORRECT | Retain secondary outline style |
| `CRD-004` | Landing (`/`) | Hero Banner | Windows Installer Link | Direct desktop software download (.exe) | Platform badge row (1st) | CORRECT | Retain direct download hook |
| `CRD-005` | Landing (`/`) | Hero Banner | Google Play Store Link | Direct mobile app store link | Platform badge row (2nd) | CORRECT | Keep official store badge |
| `CRD-006` | Landing (`/`) | Hero Banner | Apple App Store Link | iOS app store link | Platform badge row (3rd) | CORRECT | Keep official store badge |
| `CRD-007` | Landing (`/`) | Hero Banner | Telegram Bot Link | Fast Telegram mini-app / bot access | Platform badge row (4th) | CORRECT | High conversion for Uzbekistan |
| `CRD-008` | Landing (`/`) | Stats Bar | 1200+ Savollar Card | Prove content comprehensiveness | Stats grid col 1 | CORRECT | Connected to `/api/v1/public/stats` |
| `CRD-009` | Landing (`/`) | Stats Bar | 70 Biletlar Card | Show 100% exam coverage | Stats grid col 2 | CORRECT | Essential trust statistic |
| `CRD-010` | Landing (`/`) | Stats Bar | 100% Real Format Card | Highlight real exam simulation format | Stats grid col 3 | CORRECT | Differentiates from casual apps |
| `CRD-011` | Landing (`/`) | Stats Bar | 3 Ta Til Card | Highlight UZL, UZC, RU accessibility | Stats grid col 4 | CORRECT | Reassures non-Latin/Russian speakers |
| `CRD-012` | Landing (`/`) | Benefits | 70 Rasmiy Bilet Card | Detail 70 official tickets value | Benefits grid (1/4) | CORRECT | Keep |
| `CRD-013` | Landing (`/`) | Benefits | Davlat Imtihoni Simulyatori | Detail 20 questions / 25 min format | Benefits grid (2/4) | CORRECT | Keep |
| `CRD-014` | Landing (`/`) | Benefits | Xatolar Ustida Ishlash | Explain mistake-tracking algorithm | Benefits grid (3/4) | CORRECT | Highlight as key pedagogical feature |
| `CRD-015` | Landing (`/`) | Benefits | Offline & Multi-device | Highlight Windows offline feature | Benefits grid (4/4) | CORRECT | Strong differentiator |
| `CRD-016` | Landing (`/`) | Flow | 1. Ilovani oching | Onboarding step 1 | How-it-works col 1 | CORRECT | Keep |
| `CRD-017` | Landing (`/`) | Flow | 2. Testlarni yeching | Onboarding step 2 | How-it-works col 2 | CORRECT | Keep |
| `CRD-018` | Landing (`/`) | Flow | 3. Imtihonga tayyor bo'ling | Outcome step 3 | How-it-works col 3 | CORRECT | Keep |
| `CRD-019` | Landing (`/`) | Platforms | Web Ilova Card | Promote browser version | Platforms grid (1/3) | DUPLICATE | Button repeats Hero primary CTA; transform into web feature preview |
| `CRD-020` | Landing (`/`) | Platforms | Windows Desktop Card | Promote offline desktop installer | Platforms grid (2/3) | CORRECT | Primary desktop download hub |
| `CRD-021` | Landing (`/`) | Platforms | Mobil Ilova Card | Promote Android/iOS apps | Platforms grid (3/3) | CORRECT | Keep store links |
| `CRD-022` | Landing (`/`) | FAQ | Accordion Items 1..6 | Address common user concerns | FAQ container | CORRECT | Include Schema.org FAQPage data |
| `CRD-023` | Landing (`/`) | Final CTA | Banner Conversion Card | Catch users who scrolled to bottom | Page end | CORRECT | Retain dual CTA (Web + Trial) |
| `CRD-024` | Dashboard (`/me`) | Welcome | User Greeting & Subtitle | Personalized warm welcome | Top fold | CORRECT | Sanitized name rendering |
| `CRD-025` | Dashboard (`/me`) | Metrics Bar | Kunlik Reja & Streak Card | Gamification & habit formation | Metrics col 1 | CORRECT | Motivates daily active retention |
| `CRD-026` | Dashboard (`/me`) | Metrics Bar | Yechilgan Savollar Card | Track database progress (X / 1200) | Metrics col 2 | CORRECT | Fixed Russian unit (`вопр.`) |
| `CRD-027` | Dashboard (`/me`) | Metrics Bar | Umumiy Tayyorgarlik Card | Exam readiness percentage & badge | Metrics col 3 | CORRECT | Clear progress metric |
| `CRD-028` | Dashboard (`/me`) | Primary Modes | Mavzular Mode Card | Learn by specific chapters | Modes grid (1/4) | CORRECT | Recommended for beginners |
| `CRD-029` | Dashboard (`/me`) | Primary Modes | Biletlar Mode Card | Practice official tickets 1-70 | Modes grid (2/4) | MISSING CONTEXT | Fix copy from "60 bilet" to "70 bilet" |
| `CRD-030` | Dashboard (`/me`) | Primary Modes | Marafon Mode Card | Non-stop sequential practice | Modes grid (3/4) | CORRECT | High engagement mode |
| `CRD-031` | Dashboard (`/me`) | Primary Modes | Haqiqiy Imtihon Card | Timed state exam simulator | Modes grid (4/4) | CORRECT | Opens modal exam picker |
| `CRD-032` | Dashboard (`/me`) | Smart Focus | Zaif Mavzular List Card | Display top 4 mistake topics | Smart grid left (7 cols) | CORRECT | Fix fallback name for dynamic topics |
| `CRD-033` | Dashboard (`/me`) | Smart Focus | Tezkor Tuzatish CTA Card | 1-click test on 20 mistake questions | Smart grid right (5 cols) | CORRECT | High-value retention driver |
| `CRD-034` | Dashboard (`/me`) | Secondary Tools | Saqlanganlar Card | Quick link to bookmarked questions | Tools grid (1/4) | CORRECT | Keep |
| `CRD-035` | Dashboard (`/me`) | Secondary Tools | Statistika Card | Deep analytics link | Tools grid (2/4) | CORRECT | Keep |
| `CRD-036` | Dashboard (`/me`) | Secondary Tools | Reyting Card | Competitive student leaderboard | Tools grid (3/4) | CORRECT | Keep |
| `CRD-037` | Dashboard (`/me`) | Secondary Tools | Imtihon Tarixi Card | Completed exams history log | Tools grid (4/4) | CORRECT | Keep |
| `CRD-038` | Dashboard (`/me`) | Footer | Telegram Channel Card | Social community & updates | Footer grid (1/3) | CORRECT | Modal QR code on desktop |
| `CRD-039` | Dashboard (`/me`) | Footer | Instagram Card | Social visual content | Footer grid (2/3) | CORRECT | Modal QR code on desktop |
| `CRD-040` | Dashboard (`/me`) | Footer | YouTube Channel Card | Video tutorials & road rules | Footer grid (3/3) | CORRECT | Modal QR code on desktop |
| `CRD-041` | Topics (`/topics`) | Header | Search Input Card | Instant filter for topic titles | Page top | CORRECT | Realtime filtering |
| `CRD-042..051` | Topics (`/topics`) | Grid | Topic Cards (1 to 10+) | Individual topic selection | Main grid | CORRECT | Fix light mode badge contrast |
| `CRD-052` | Tickets (`/tickets`) | Header | Status Filter Tabs Card | Filter: Barchasi / O'tilgan / Qolgan | Page top | CORRECT | Keep |
| `CRD-053..122` | Tickets (`/tickets`) | Grid | Ticket Cards (1 to 70) | 70 ticket cards with score chips | Main grid | CORRECT | Clear completion states |
| `CRD-123` | Result (`/exam/result/:id`) | Header | Score Ring Progress Card | Circular score % + Pass/Fail pill | Page top | CORRECT | Visual impact |
| `CRD-124` | Result (`/exam/result/:id`) | Summary | To'g'ri Javoblar Stat Card | Correct count | Summary row (1/3) | CORRECT | Green accent |
| `CRD-125` | Result (`/exam/result/:id`) | Summary | Noto'g'ri Javoblar Stat Card | Incorrect count | Summary row (2/3) | CORRECT | Red accent |
| `CRD-126` | Result (`/exam/result/:id`) | Summary | Belgilanmagan Stat Card | Unanswered count | Summary row (3/3) | CORRECT | Yellow accent |
| `CRD-127` | Result (`/exam/result/:id`) | Review | Answer Question Cards (1..20) | Detailed question breakdown | Question stack | CORRECT | Clear explanation pill |
| `CRD-128` | Result (`/exam/result/:id`) | Actions | Back to Dashboard Button | Return to `/me` | Bottom center | WRONG PRIORITY | Only action currently available |
| `CRD-129` | Result (`/exam/result/:id`) | Actions | **Xatolar Ustida Ishlash CTA** | Start test on incorrect answers | Bottom | **MISSING** | **Must be added as Primary CTA (P0)** |
| `CRD-130` | Result (`/exam/result/:id`) | Actions | **Qayta Urinish (Retry) CTA** | Re-test the exact same ticket | Bottom | **MISSING** | **Must be added as Secondary CTA (P0)** |
| `CRD-131` | Quiz Screen | Header | Quiz Timer & Progress Bar | Remaining time and progress | Top sticky bar | CORRECT | Realtime tick |
| `CRD-132` | Quiz Screen | Main | Question Card & Image Box | Question text and high-res image | Center | CORRECT | Lightbox zoom enabled |
| `CRD-133` | Quiz Screen | Options | Multiple Choice Cards (1..4) | Selectable options | Options column | CORRECT | Active & keyboard states |
| `CRD-134` | Quiz Screen | Modal | Gamification Result Modal | Immediate result popup | Modal overlay | CORRECT | Has retry and mistake review |
| `CRD-135` | Wrong Answers | Header | Summary Stats Card | Mistakes total & clean up button | Page top | CORRECT | Shows count |
| `CRD-136` | Wrong Answers | Filter | Topic Filter Dropdown | Filter mistakes by road rule topic | Top controls | CORRECT | Keep |
| `CRD-137` | Wrong Answers | Action | Start Mistakes Exam Card | Start 20-question test on mistakes | Top right | CORRECT | Connects to `/wrong-exam` |
| `CRD-138` | Saved Questions | Header | Bookmarked Count Card | Total saved questions summary | Page top | CORRECT | Keep |
| `CRD-139` | Statistics | Hero | Overall Performance Card | Total tests, pass rate, avg score | Top banner | CORRECT | High visual fidelity |
| `CRD-140` | Statistics | Breakdown | Category Weakness Table Card | Mastery % by topic | Center grid | MISPLACED | Needs direct "Mashq qilish" button per row |
| `CRD-141` | Statistics | Trend | Score Progress Chart Card | Visual history graph | Bottom grid | CORRECT | Responsive canvas |
| `CRD-142` | Leaderboard | Podium | Top 3 Students Podium Card | 1st (Gold), 2nd (Silver), 3rd (Bronze) | Top | CORRECT | Gamification anchor |
| `CRD-143` | Leaderboard | List | Ranked Users List Card | User list with points & tests count | Center | CORRECT | Clean pagination |
| `CRD-144` | Leaderboard | Sticky | My Current Ranking Card | User's place in the whole country | Bottom sticky | CORRECT | High motivation |
| `CRD-145` | History | Summary | History Overview Card | Total tests, hours, certificates | Top | CORRECT | Keep |
| `CRD-146..155` | History | List | Historical Exam Run Cards | Date, type, score badge, review link | List items | CORRECT | Date localized |
| `CRD-156` | Settings | Profile | Profile Details Card | Name, phone, member since | Form grid | CORRECT | Keep |
| `CRD-157` | Settings | Language | Language Selection Card | UZL / UZC / RU selector | Settings grid | CORRECT | Cross-subdomain cookie sync |
| `CRD-158` | Settings | Theme | Dark / Light Theme Toggle Card | Visual theme preference | Settings grid | CORRECT | Persisted in localStorage |
| `CRD-159` | Settings | Security | Change Password Card | Old password + new password | Settings grid | CORRECT | Form validation |
| `CRD-160` | Settings | Device | Mobile Pairing QR Card | Scan QR to pair mobile app | Settings grid | CORRECT | SVG rendering |
| `CRD-161` | Auth | Form | Login / Register Container Card | Centered authentication container | Center viewport | CORRECT | Clean Mantine form |
| `CRD-162` | Downloads | Cards | Windows Desktop Download Card | Direct .exe link + system requirements | Grid 1 | CORRECT | Keep |
| `CRD-163` | Downloads | Cards | Android APK & Play Store Card | Mobile links | Grid 2 | CORRECT | Keep |
| `CRD-164` | Downloads | Cards | iOS App Store Card | Apple link | Grid 3 | CORRECT | Keep |
| `CRD-165` | Partners | Proposal | Driving School Partnership Card | B2B value proposition | Hero | CORRECT | Lead generator |
| `CRD-166` | Partners | Form | Driving School Lead Form Card | Submit school info for demo | Right column | CORRECT | Submits to admin inquiries |
| `CRD-167` | Contact | Info | Direct Support Cards | Phone, Telegram, address | Left column | CORRECT | Keep |
| `CRD-168` | Contact | Form | Feedback Message Form Card | Send direct feedback | Right column | CORRECT | Keep |

---

## 2. Card Semantic Analysis

Every card on Prava Online was evaluated against the 10 User & Business Criteria:

### Example Evaluation 1: `CRD-033` (Tezkor Tuzatish CTA Card on `/me`)
1. **Nima uchun mavjud?** Foydalanuvchi yo'l qo'ygan xatolarini darhol 1 ta tugma bilan qayta ishlashi uchun.
2. **Kimga kerak?** Testlarda adashgan, ammo butun biletni emas, aynan xato qilgan savollarini qayta mashq qilmoqchi bo'lgan har bir o'quvchiga.
3. **User qaysi muammoni hal qiladi?** "Xatolarimni qayerdan topaman?" degan sarsonlikni yo'qotadi. 1 ta bosish bilan eng zaif 20 ta savol yuklanadi.
4. **Business uchun nima beradi?** O'quvchining imtihondan o'tish foizini oshiradi, ijobiy fikrlar va tavsiyalar ko'payadi.
5. **Nega aynan shu sectionda?** "Aqlli tavsiya" bo'limida, zaif mavzular ro'yxati yonida turishi mantiqiy (7/5 grid nisbati).
6. **Nega aynan shu positionda?** Ko'z chapdan o'ngga o'qiganda, avval xato mavzularni ko'radi, keyin o'ng tomondagi harakatga undovchi tugmani bosadi.
7. **CTA aniqmi?** Ha: "Eng zaif 20 ta savolni tuzatish" yoki "Sinov imtihonini boshlash".
8. **Boshqa card bilan duplicate emasmi?** Yo'q, bu shaxsiy adaptiv algoritm asosidagi eksklyuziv rejim.
9. **Cardni olib tashlasak nima yo'qoladi?** Foydalanuvchi xatolarini tuzatish uchun `/wrong-answers` sahifasiga kirib, savollarni bittalab qidirishga majbur bo'ladi (katta friction).
10. **Cardni boshqa joyga ko'chirsak UX yaxshilanadimi?** Hozirgi joylashuvi eng maqbul.

### Example Evaluation 2: `CRD-128 & CRD-129` (Exam Result Actions on `/exam/result/:id`)
1. **Nima uchun mavjud?** Imtihon yakunlanganda o'quvchiga keyingi mantiqiy qadamni berish uchun.
2. **Kimga kerak?** Natijasini ko'rib bo'lgan o'quvchiga.
3. **User qaysi muammoni hal qiladi?** Hozirgi holatda user FAQAT dashboardga qaytishi mumkin. Agar 4 ta xato qilgan bo'lsa, u xatolarini darhol qayta topshira olmaydi.
4. **Aniqlangan muammo (P0):** "Xatolar ustida ishlash" tugmasi yetishmaydi.
5. **Tavsiya:** Natija kartasi ostiga 2 ta CTA qo'shish:
   - Agar xatolar soni > 0 bo'lsa: "Xatolar ustida ishlash" (`/wrong-exam`) — Primary rangda.
   - "Qayta urinish" — Outline rangda.
   - "Boshqaruv paneliga qaytish" — Tertiary rangda.
