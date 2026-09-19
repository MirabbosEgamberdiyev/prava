/**
 * Design System - Shadows
 * Modern, subtle ambient SaaS shadows for light and dark modes
 */

export const shadows = {
  // Light mode shadows
  light: {
    xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    sm: "0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
    card: "0 10px 30px -5px rgba(0, 0, 0, 0.06), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
    header: "0 1px 3px 0 rgba(0, 0, 0, 0.04)",
  },

  // Dark mode shadows
  dark: {
    xs: "0 1px 2px 0 rgba(0, 0, 0, 0.4)",
    sm: "0 2px 4px 0 rgba(0, 0, 0, 0.45)",
    md: "0 4px 12px 0 rgba(0, 0, 0, 0.5)",
    lg: "0 12px 32px -4px rgba(0, 0, 0, 0.65)",
    card: "0 16px 40px -8px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.06)",
    header: "0 1px 3px 0 rgba(0, 0, 0, 0.3)",
  },
} as const;

export type ShadowTokens = typeof shadows;
