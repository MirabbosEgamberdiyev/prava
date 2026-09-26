import { defineConfig } from "vitest/config";

// Alohida konfiguratsiya: vite.config.ts dagi PWA/prerender plaginlari testlarga kerak emas.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
