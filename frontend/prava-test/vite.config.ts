import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
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
        ],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
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
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          mantine: [
            '@mantine/core',
            '@mantine/hooks',
            '@mantine/notifications',
            '@mantine/form',
          ],
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
          ],
          icons: [
            '@tabler/icons-react',
          ],
        },
      },
    },
  },
})
