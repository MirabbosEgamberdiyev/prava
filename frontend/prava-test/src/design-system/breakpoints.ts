/**
 * Design System Breakpoint Tokens
 * Supports all target viewport tiers:
 * - Ultra-compact mobile: 320px, 360px, 375px
 * - Standard mobile: 390px, 414px, 480px
 * - Tablets & Foldables: 768px, 820px
 * - Small laptops & Desktops: 1024px, 1280px
 * - Standard & Ultra-wide displays: 1440px, 1920px, 2560px
 */

export const breakpoints = {
  xs: 320,
  mobileSm: 360,
  mobileMd: 375,
  mobileLg: 390,
  mobileXl: 414,
  sm: 480,
  md: 768,
  tabletLg: 820,
  lg: 1024,
  xl: 1280,
  "2xl": 1440,
  "3xl": 1920,
  "4xl": 2560,
} as const;

export type BreakpointKey = keyof typeof breakpoints;

export const mediaQueries = {
  xs: `(min-width: ${breakpoints.xs}px)`,
  sm: `(min-width: ${breakpoints.sm}px)`,
  md: `(min-width: ${breakpoints.md}px)`,
  lg: `(min-width: ${breakpoints.lg}px)`,
  xl: `(min-width: ${breakpoints.xl}px)`,
  "2xl": `(min-width: ${breakpoints["2xl"]}px)`,
  "3xl": `(min-width: ${breakpoints["3xl"]}px)`,
  "4xl": `(min-width: ${breakpoints["4xl"]}px)`,

  // Max-width helpers
  mobileMax: `(max-width: ${breakpoints.md - 1}px)`,
  tabletMax: `(max-width: ${breakpoints.lg - 1}px)`,
  laptopMax: `(max-width: ${breakpoints.xl - 1}px)`,
} as const;
