import { createTheme, type MantineColorsTuple } from "@mantine/core";
import tokens from "./theme/design-tokens.json";

/**
 * Mantine theme — YAGONA MANBA: `src/theme/design-tokens.json`
 * (web, desktop va mobil ilovalar uchun umumiy). Qiymatlarni shu yerda
 * qattiq yozmang — tokenlar faylini o'zgartiring.
 */

const BRAND_SHADES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"] as const;

/** color.brand (50..900) → Mantine 10 ta shade (0..9). */
const brand = BRAND_SHADES.map(
  (k) => tokens.color.brand[k],
) as unknown as MantineColorsTuple;

const px = (v: number) => `${v / 16}rem`;

/** Montserrat + tizim shriftlari (fallback). */
const FONT_STACK = `"${tokens.font.family}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

export const theme = createTheme({
  primaryColor: "brand",
  colors: {
    brand,
    // Kodda `color="blue"` ko'p joyda ishlatilgan — ular ham brend palitrasini
    // olsin (Mantine default ko'k #228be6 boshqa ko'k tus sifatida chiqmasin).
    blue: brand,
  },

  /**
   * `primaryShade` — light rejimda 6-shade (#0284c7) ishlatiladi (oq fonda 4.7:1 kontrast).
   * Dark rejimda esa 4-shade (#38bdf8) ishlatiladi (to'q fonda 7.5:1 kontrast).
   */
  primaryShade: { light: 6, dark: 4 },

  /**
   * `autoContrast` — "filled" variantlarda matn rangi fon yorqinligiga qarab
   * avtomatik qora/oq bo'ladi. Bu sariq/yashil filled badge va tugmalardagi
   * oq-matn-sariq-fon (~1.8:1) kabi WCAG buzilishlarini yopadi.
   */
  autoContrast: true,
  luminanceThreshold: 0.3,

  fontFamily: FONT_STACK,

  /**
   * Imtihon davomida foydalanuvchi ketma-ket 20-50 ta savol o'qiydi.
   * Mantine standart line-height (md = 1.55) uzoq o'qish uchun zich.
   * Quyidagi shkala savol/javob matnini havodorroq qiladi.
   */
  fontSizes: {
    xs: px(tokens.font.size.xs),
    sm: px(tokens.font.size.sm),
    md: px(tokens.font.size.md),
    lg: px(tokens.font.size.lg),
    xl: px(tokens.font.size.xl),
  },
  lineHeights: {
    xs: "1.45",
    sm: "1.5",
    md: "1.6",
    lg: "1.65",
    xl: "1.65",
  },

  headings: {
    fontFamily: FONT_STACK,
    sizes: {
      h1: { fontSize: "2.125rem", lineHeight: "1.3", fontWeight: "700" },
      h2: { fontSize: "1.625rem", lineHeight: "1.35", fontWeight: "700" },
      h3: { fontSize: "1.325rem", lineHeight: "1.4", fontWeight: "600" },
      h4: { fontSize: "1.125rem", lineHeight: "1.45", fontWeight: "600" },
      // h5/h6 yetishmayotgan edi — Mantine default (0.875rem / 0.75rem) ga
      // tushib ketardi va h4 dan keskin kichrayib ierarxiyani buzardi.
      h5: { fontSize: "1rem", lineHeight: "1.5", fontWeight: "600" },
      h6: { fontSize: "0.9375rem", lineHeight: "1.5", fontWeight: "600" },
    },
  },

  /** Radius shkalasi — tokens.radius (xs tokenlarda yo'q: sm ning yarmi). */
  radius: {
    xs: px(tokens.radius.sm / 2),
    sm: px(tokens.radius.sm),
    md: px(tokens.radius.md),
    lg: px(tokens.radius.lg),
    xl: px(tokens.radius.xl),
  },

  // Kodda tugmalar/kartalar allaqachon `radius="md"` ni qo'lda uzatardi —
  // defaultni "md" qilib, `sm` bilan aralashib ketishiga chek qo'yamiz.
  defaultRadius: "md",

  components: {
    Card: {
      defaultProps: {
        radius: "lg",
      },
    },
    Paper: {
      defaultProps: {
        radius: "lg",
      },
    },
    Button: {
      defaultProps: {
        radius: "md",
      },
    },
    Modal: {
      defaultProps: {
        radius: "lg",
        centered: true,
      },
    },
    TextInput: {
      defaultProps: {
        radius: "md",
      },
    },
    PasswordInput: {
      defaultProps: {
        radius: "md",
      },
    },
    Select: {
      defaultProps: {
        radius: "md",
      },
    },
  },
});
