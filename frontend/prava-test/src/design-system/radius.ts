/**
 * Design System - Radius
 * Unified Corner Radius Tokens
 */

export const radius = {
  none: "0px",
  xs: "4px",
  sm: "6px",
  md: "10px",
  lg: "14px",
  card: "16px",
  cardLg: "20px",
  full: "9999px",
} as const;

export type RadiusTokens = typeof radius;
