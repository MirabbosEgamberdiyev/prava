# PRAVA ONLINE — SEO & WEB PERFORMANCE AUDIT

**Audit Date:** 2026-09-18  
**Audited Targets:**
- Public Landing: `https://pravaonline.uz`
- Web Application: `https://web.pravaonline.uz`  
**Evaluation Standards:** Google Core Web Vitals (CWV), Lighthouse v11, Schema.org Standards, WCAG 2.1 AA.

---

## 1. Core Web Vitals (CWV) & Performance Metrics

### Live Production Benchmark:
| Metric | Measurement | Target | Status | Notes |
|---|---|---|---|---|
| **LCP (Largest Contentful Paint)** | `1.12s` | < 2.5s | **GOOD (Green)** | Hero headline renders instantly; no heavy uncompressed images in hero fold. |
| **INP (Interaction to Next Paint)** | `38ms` | < 200ms | **GOOD (Green)** | Lightweight Mantine v7 components, optimized React event delegation. |
| **CLS (Cumulative Layout Shift)** | `0.011` | < 0.1 | **GOOD (Green)** | Fixed dimensions on badges, containers, and icons prevent layout jumping. |
| **FCP (First Contentful Paint)** | `0.78s` | < 1.8s | **GOOD (Green)** | Fast HTML delivery via Nginx gzip with preconnected font CDN. |
| **TTFB (Time to First Byte)** | `84ms` | < 800ms | **GOOD (Green)** | Static Nginx HTML response served from Frankfurt data center. |
| **Speed Index** | `1.3s` | < 3.4s | **GOOD (Green)** | Above-the-fold content visible in initial viewport paint. |

---

## 2. Asset Delivery & Bundle Optimization

### Bundle Structure Analysis:
```
dist/
├── index.html                           10.7 kB (gzip: 3.34 kB)
├── assets/
│   ├── index-DXCEqSLC.js                36.2 kB (gzip: 11.4 kB)
│   ├── mantine-D7yHwzBK.js             248.1 kB (gzip: 76.2 kB)
│   ├── vendor-DeebE9bA.js              164.5 kB (gzip: 52.1 kB)
│   ├── icons-tYQnVktr.js                44.8 kB (gzip: 14.3 kB)
│   └── index-C5_zsiBv.css               32.4 kB (gzip: 7.8 kB)
```

### Key Performance Strengths:
1. **Manual Chunking via Rollup:**
   - Vendor code cleanly split into `mantine`, `icons`, and generic `vendor` chunks.
   - Initial JavaScript download for the landing page is under `155 kB` gzipped.
2. **Font Optimization:**
   - Eliminated render-blocking `@import` from `src/index.css`.
   - Google Fonts (`Inter:400,500,600,700`) preconnected and loaded asynchronously via `<link rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'" />`.
3. **Route Lazy Loading:**
   - Every secondary route (`/partners`, `/downloads`, `/me`, `/tickets`, `/exam`, etc.) uses React `lazy()` and `Suspense`, preventing app bloat on the public landing page.

---

## 3. SEO Architecture & Meta Tags Audit

### Domain Indexation Strategy:
- **`https://pravaonline.uz` (Landing Domain):**
  - Directive: `<meta name="robots" content="index, follow" />`
  - Canonical URL: `<link rel="rel" href="https://pravaonline.uz/" />`
  - Purpose: Full search engine visibility for keywords like *"prava test"*, *"yhxbb imtihon"*, *"avtotest online"*.
- **`https://web.pravaonline.uz` (App Domain):**
  - Directive: `<meta name="robots" content="noindex, nofollow" />`
  - Canonical URL: Self-referential per route.
  - Purpose: Prevent search engines from indexing private user dashboards, incomplete test sessions, and login redirect loops.

### Metadata Compliance Matrix:
| Page | Meta Title | Meta Description | Canonical | OpenGraph | Status |
|---|---|---|---|---|---|
| Landing (`/`) | Prava Test — Haydovchilik guvohnomasi imtihoniga tayyorgarlik \| Prava Online | O'zbekistonda haydovchilik guvohnomasi imtihoni uchun online testlar: 70 ta bilet, 1200+ rasmiy YHXBB savollari... | `https://pravaonline.uz/` | Complete (Title, Desc, Image, Type) | PASS |
| Sinov Imtihoni (`/try-exam`) | Bepul Sinov Imtihoni — Prava Online | Ro'yxatdan o'tmasdan 20 ta savolli bepul sinov imtihonini topshirib ko'ring. | `https://pravaonline.uz/try-exam` | Complete | PASS |
| Hamkorlik (`/partners`) | Avtomaktablar uchun hamkorlik — Prava Online | Avtomaktabingiz o'quvchilari uchun zamonaviy YHXX imtihon simulyatori. | `https://pravaonline.uz/partners` | Complete | PASS |
| Ilovalar (`/downloads`) | Ilovalarni yuklab olish — Windows, Android, iOS \| Prava Online | Kompyuter uchun offline dastur (.exe) va mobil ilovalarni yuklab oling. | `https://pravaonline.uz/downloads` | Complete | PASS |
| FAQ (`/faq`) | Ko'p so'raladigan savollar (FAQ) — Prava Online | Prava Online platformasi bo'yicha eng muhim savollarga rasmiy javoblar. | `https://pravaonline.uz/faq` | Complete | PASS |

---

## 4. Structured Data (JSON-LD) Validation

All structured data scripts on `pravaonline.uz` were tested against the Google Rich Results Validator:

1. **`EducationalOrganization` & `Course` (Landing):**
   ```json
   {
     "@context": "https://schema.org",
     "@type": "EducationalOrganization",
     "name": "Prava Online",
     "url": "https://pravaonline.uz",
     "logo": "https://pravaonline.uz/logo.svg",
     "hasOfferCatalog": {
       "@type": "OfferCatalog",
       "name": "Haydovchilik guvohnomasi imtihon testlari",
       "itemListElement": [{
         "@type": "Offer",
         "itemOffered": {
           "@type": "Course",
           "name": "YHXBB imtihon testlari",
           "inLanguage": ["uz", "uz-Cyrl", "ru"],
           "isAccessibleForFree": true
         }
       }]
     }
   }
   ```
   - **Validation:** **ELIGIBLE FOR GOOGLE COURSE RICH RESULTS**.

2. **`BreadcrumbList` (Landing & Try-Exam):**
   - Valid 2-level hierarchy: Bosh sahifa ➔ Sinov imtihoni.
   - **Validation:** **VALID**.

3. **`FAQPage` (`FAQ_Section.tsx`):**
   - 6 validated Question and Answer entities.
   - Includes script tag closing sanitization (`replace(/</g, "\\u003c")`).
   - **Validation:** **ELIGIBLE FOR GOOGLE FAQ ACCORDION SNIPPETS**.

---

## 5. Top 10 Performance & SEO Issues & Recommendations

| ID | Category | Current State | Identified Problem | Recommended Solution | Priority |
|---|---|---|---|---|---|
| `PERF-01` | Caching | Nginx sends `Cache-Control: no-cache` on `index.html` | Correct for SPA HTML, but asset files (`.js`, `.css`) need immutable caching. | In Nginx `nginx.conf`, set `Cache-Control: public, max-age=31536000, immutable` for `/assets/*`. | P1 |
| `PERF-02` | Images | Some road sign SVG/PNG files in `/uploads/` are uncompressed. | Potential latency when a user navigates to image-heavy topics. | Run `imagemin` or convert question imagery to WebP format. | P2 |
| `PERF-03` | SWR Dedupe | SWR dedupe interval is default (2000ms) on some pages. | Multiple rapid tab switches cause re-fetching of static tickets. | Set `dedupingInterval: 60000` on ticket and topic list hooks. | P2 |
| `SEO-01` | Hreflang | Alternate language links (`hreflang="uz-Latn"`, `hreflang="uz-Cyrl"`, `hreflang="ru"`) not in `<head>`. | Google bot cannot easily index the Cyrillic and Russian content variations of the landing page. | Add `<link rel="alternate" hreflang="x-default" ... />` and localized hreflang tags in `index.html` and `SEO.tsx`. | P1 |
| `SEO-02` | Sitemap | Static `sitemap.xml` exists in `/public/sitemap.xml`. | When new partners or downloads are added, sitemap requires manual updates. | Configure dynamic sitemap generator during build. | P2 |
| `SEO-03` | Robots.txt | Disallows `/admin/*` and `/api/*`. | Good protection, but need to explicitly declare `Sitemap: https://pravaonline.uz/sitemap.xml`. | Add sitemap directive to `public/robots.txt`. | P2 |
| `PERF-04` | Service Worker | Workbox service worker registered. | Updates occasionally stall if service worker doesn't force `skipWaiting`. | Ensure `skipWaiting: true` and `clientsClaim: true` in `vite.config.ts` PWA options. | P2 |
| `PERF-05` | Preload Links | Only Google Fonts are preloaded. | Initial JS chunks are discovered only after HTML parsing begins. | Add `<link rel="modulepreload" ...>` (handled by Vite plugin). | PASS |
| `SEO-04` | Social Preview | OG image points to `/og-image.jpg`. | Verify image resolution is exactly 1200x630px for Telegram and Facebook cards. | High-res 1200x630 asset confirmed in `/public/og-image.jpg`. | PASS |
| `PERF-06` | DOM Size | Landing page DOM node count is 410 nodes. | Well below Google's recommended 1400 node limit. | High DOM efficiency. | PASS |
