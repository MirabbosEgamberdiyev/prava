import { createTheme } from "@mantine/core";

/**
 * Prava Online Admin — dizayn tizimi (design tokens).
 *
 * Barcha tipografika shu yerdan boshqariladi: komponentlarda `style={{ fontSize }}`
 * yozish o'rniga Mantine `size` / `Title order` tokenlaridan foydalaning.
 */
export const theme = createTheme({
  primaryColor: "blue",
  // Kontrast: filled variantlarda matn rangini fon yorqinligiga qarab tanlaydi
  // (masalan sariq/lime badge ustida qora matn) — WCAG uchun muhim.
  autoContrast: true,
  luminanceThreshold: 0.4,

  fontFamily: '"Montserrat", sans-serif',
  fontFamilyMonospace:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',

  // Body matn shkalasi — 1.125 modul (major second) asosida
  fontSizes: {
    xs: "0.75rem",   // 12px — caption, meta
    sm: "0.875rem",  // 14px — jadval/forma matni (admin default)
    md: "1rem",      // 16px — asosiy paragraf
    lg: "1.125rem",  // 18px — karta sarlavhalari
    xl: "1.25rem",   // 20px — statistika raqamlari
  },

  // O'qish qulayligi: kichik matnga kattaroq line-height
  lineHeights: {
    xs: "1.5",
    sm: "1.55",
    md: "1.6",
    lg: "1.55",
    xl: "1.5",
  },

  headings: {
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: "600",
    sizes: {
      h1: { fontSize: "2rem", lineHeight: "1.25", fontWeight: "700" },
      h2: { fontSize: "1.625rem", lineHeight: "1.3", fontWeight: "700" },
      h3: { fontSize: "1.375rem", lineHeight: "1.35" },
      h4: { fontSize: "1.125rem", lineHeight: "1.4" },
      h5: { fontSize: "1rem", lineHeight: "1.45" },
      h6: { fontSize: "0.875rem", lineHeight: "1.5" },
    },
  },

  defaultRadius: "md",
  cursorType: "pointer",

  components: {
    Button: { defaultProps: { radius: "md" } },
    Card: { defaultProps: { radius: "md" } },
    Paper: { defaultProps: { radius: "md" } },
    Modal: { defaultProps: { radius: "md" } },
    // Admin jadvallari ko'p ustunli — default sm o'qishga qulayroq
    Table: { defaultProps: { fz: "sm", verticalSpacing: "sm" } },
  },
});
