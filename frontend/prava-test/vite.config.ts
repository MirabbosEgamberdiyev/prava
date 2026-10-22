import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  /*
   * W-21: production build'da console.log/debug/info/warn chaqiruvlari "pure"
   * deb belgilanadi (natijasi ishlatilmasa minifier olib tashlaydi) va
   * `debugger` o'chiriladi. console.error qoldiriladi (ErrorBoundary/monitoring).
   */
  esbuild:
    mode === 'production'
      ? {
          pure: ['console.log', 'console.debug', 'console.info', 'console.warn'],
          drop: ['debugger'],
        }
      : undefined,
  define: {
    // Har build paytida yangi timestamp — i18n cache bypass uchun
    __BUILD_TIME__: JSON.stringify(Date.now().toString()),
  },
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      /*
       * PERF: avval `['favicon.svg', 'logo.svg', 'icons/*.png', 'icons/*.svg']`
       * edi. `includeAssets` fayllarni precache'ga MAJBURAN qo'shadi va
       * `globIgnores` ga bo'ysunmaydi, shuning uchun 880KB ortiqcha SVG
       * (logo.svg 532KB + favicon.svg 116KB + 2×icon-*.svg 116KB) har bir
       * yangi foydalanuvchida service worker o'rnatilishida yuklab olinardi.
       * Faqat PWA manifestida haqiqatan ishlatiladigan PNG ikonkalar qoldi;
       * SVG'lar runtime `image-cache` (CacheFirst) orqali kerak bo'lganda
       * keshlanadi.
       */
      includeAssets: ['icons/icon-192x192.png', 'icons/icon-512x512.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Prava Online - Haydovchilik guvohnomasi imtihoniga tayyorlaning',
        short_name: 'Prava Online',
        description: "O'zbekistonda haydovchilik guvohnomasi imtihoniga online tayyorlanish platformasi",
        theme_color: '#228be6',
        background_color: '#1a1b1e',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        /*
         * PERF: `globPatterns` bu ulkan SVG'larni ham precache qilardi —
         * logo.svg (532KB), favicon.svg (116KB), icons/*.svg (2×116KB).
         * Ular service worker o'rnatilishi bilan MAJBURIY yuklanardi, ya'ni
         * telefon internetida birinchi tashrifda ortiqcha trafik.
         * Endi ular runtime `image-cache` (CacheFirst) orqali kerak
         * bo'lgandagina yuklanadi.
         * (og-image.svg va dfault.svg kodda umuman ishlatilmagani uchun
         *  butunlay o'chirildi — endi ro'yxatda ham kerak emas.)
         */
        globIgnores: [
          '**/node_modules/**/*',
          'logo.svg',
          'favicon.svg',
          'icons/*.svg',
          /*
           * P1-W6: katta rasmlar (public/images/**) va three.js/simulyator
           * chunk'lari precache'dan chiqarildi — ular faqat kerak bo'lganda
           * yuklanadi (rasmlar runtime `image-cache` orqali keshlanadi).
           */
          'images/**',
          '**/SimulatorCanvas3D*',
          '**/three*',
          '**/WebGLFallback*',
        ],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Yangi versiyaga darhol o'tish (kutib o'tirmaydi)
        skipWaiting: true,
        clientsClaim: true,
        // Eski deploylardan qolgan precache'larni tozalaydi
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        // API so'rovlari SPA fallback'ga tushmasligi kerak
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\/locales\/.*\.json$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'i18n-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
          {
            urlPattern: /^https?:\/\/.*\/api\/v[12]\/(packages|topics|tickets)(\?.*)?$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5,
              },
              networkTimeoutSeconds: 3,
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Eng katta chunk — "vendor-three" (~1 MB: three + @react-three). U faqat /simulator ichida lazy
    // yuklanadi (entry'ga kirmaydi); entry JS/CSS byudjeti scripts/check-bundle-size.mjs da (gzip) tekshiriladi.
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        // Three.js (+ @react-three) faqat 3D simulyatorda kerak: alohida "vendor-three" chunk'iga ajratiladi,
        // boshqa sahifalar uni yuklamaydi. Qolgan kutubxonalar barqaror vendor chunk'larida (kesh uchun).
        manualChunks(id) {
          // Rollup'ning CommonJS yordamchisi (getDefaultExportFromCjs) React bilan bir chunk'da bo'lishi shart:
          // u "i18n" chunk'iga tushib qolganda vendor ↔ i18n aylanma importi paydo bo'lib, react-i18next
          // yuklanayotganda React hali undefined edi — butun sayt oq ekran (2026-10-22 prod).
          if (id.includes('commonjsHelpers')) return 'vendor';
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules[\\/](three|@react-three|three-stdlib|troika-[^\\/]+|camera-controls|maath|meshline)[\\/]/.test(id)) {
            return 'vendor-three';
          }
          if (/node_modules[\\/]@mantine[\\/]/.test(id)) return 'mantine';
          if (/node_modules[\\/]@tabler[\\/]icons-react[\\/]/.test(id)) return 'icons';
          if (/node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'vendor';
          if (/node_modules[\\/](i18next|react-i18next|i18next-[^\\/]+)[\\/]/.test(id)) return 'i18n';
          return undefined;
        },
      },
    },
  },
}))
