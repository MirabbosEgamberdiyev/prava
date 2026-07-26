import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  define: {
    // Har build paytida yangi timestamp — i18n cache bypass uchun
    __BUILD_TIME__: JSON.stringify(Date.now().toString()),
  },
  build: {
    // Prodda source map yo'q: aks holda butun TS manba kodi admin.pravaonline.uz
    // ostida ochiq turadi.
    sourcemap: false,
    rollupOptions: {
      output: {
        /**
         * Vendor kutubxonalarni alohida chunklarga ajratamiz.
         * Ilgari hammasi bitta 850 kB entry chunkda edi — har deployda
         * foydalanuvchi React/Mantine/icons ni qaytadan yuklab olardi.
         * Endi app kodi o'zgarganda vendor chunklar brauzer keshida qoladi.
         */
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mantine': [
            '@mantine/core',
            '@mantine/hooks',
            '@mantine/form',
            '@mantine/modals',
            '@mantine/notifications',
            '@mantine/dates',
            '@mantine/nprogress',
          ],
          'vendor-i18n': [
            'i18next',
            'react-i18next',
            'i18next-browser-languagedetector',
            'i18next-http-backend',
          ],
          'vendor-data': ['axios', 'swr', 'dayjs', 'js-cookie'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
})
