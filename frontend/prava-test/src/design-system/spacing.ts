/**
 * Design System - Spacing
 * Consistent 4px/8px-based spacing tokens
 */

export const spacing = {
  "2xs": "2px",
  xs: "4px",
  sm: "8px",
  md: "12px",
  base: "16px",
  lg: "20px",
  xl: "24px",
  "2xl": "32px",
  "3xl": "40px",
  "4xl": "48px",
  "5xl": "64px",
} as const;

export type SpacingTokens = typeof spacing;
