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
})
