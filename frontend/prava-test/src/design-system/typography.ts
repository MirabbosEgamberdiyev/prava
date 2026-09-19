/**
 * Design System - Typography
 * Inter-based typography system with strict hierarchy
 */

export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Type scales
  scales: {
    h1: {
      fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
      lineHeight: "1.2",
      fontWeight: 700,
      letterSpacing: "-0.025em",
    },
    h2: {
      fontSize: "clamp(1.25rem, 2vw, 1.5rem)",
      lineHeight: "1.25",
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontSize: "clamp(1.05rem, 1.5vw, 1.25rem)",
      lineHeight: "1.3",
      fontWeight: 600,
      letterSpacing: "-0.015em",
    },
    bodyLg: {
      fontSize: "1rem",
      lineHeight: "1.5",
      fontWeight: 400,
    },
    body: {
      fontSize: "0.875rem", // 14px
      lineHeight: "1.45",
      fontWeight: 400,
    },
    bodySm: {
      fontSize: "0.8125rem", // 13px
      lineHeight: "1.4",
      fontWeight: 400,
    },
    caption: {
      fontSize: "0.75rem", // 12px
      lineHeight: "1.35",
      fontWeight: 500,
    },
    micro: {
      fontSize: "0.6875rem", // 11px
      lineHeight: "1.3",
      fontWeight: 500,
    },
  },
} as const;

export type TypographyTokens = typeof typography;
