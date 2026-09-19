/**
 * Design System Z-Index Hierarchy Tokens
 */

export const zIndex = {
  hide: -1,
  auto: "auto",
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
  header: 9999,
  mobileNav: 10000,
  criticalAlert: 99999,
} as const;

export type ZIndexKey = keyof typeof zIndex;
