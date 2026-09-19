/**
 * Design System - Colors
 * Unified Semantic Color Tokens for PravaOnline
 * Stripe / Linear / Vercel grade dark and light themes
 */

export const colors = {
  // Primary Brand Scale (Prava Blue)
  primary: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#2196F3", // Brand Main
    600: "#1E88E5", // Hover
    700: "#1976D2", // Active
    800: "#1565C0",
    900: "#0D47A1",
    subtle: "rgba(33, 150, 243, 0.12)",
  },

  // Accent Cyan
  accent: {
    400: "#38BDF8", // Vibrant Cyan
    500: "#0EA5E9",
    600: "#0284C7",
    subtle: "rgba(56, 189, 248, 0.12)",
  },

  // Semantic Status Colors
  success: {
    500: "#10B981", // Emerald
    600: "#059669",
    subtle: "rgba(16, 185, 129, 0.12)",
  },
  warning: {
    500: "#F59E0B", // Amber
    600: "#D97706",
    subtle: "rgba(245, 158, 11, 0.12)",
  },
  danger: {
    500: "#EF4444", // Red
    600: "#DC2626",
    subtle: "rgba(239, 68, 68, 0.12)",
  },
  info: {
    500: "#0284C7", // Sky
    600: "#0369A1",
    subtle: "rgba(2, 132, 199, 0.12)",
  },

  // Light Mode Neutrals
  light: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceMuted: "#F1F5F9",
    surfaceElevated: "#FFFFFF",
    border: "#E2E8F0",
    borderSubtle: "rgba(0, 0, 0, 0.06)",
    text: "#0F172A",
    textMuted: "#64748B",
    textSubtle: "#94A3B8",
    inputBg: "#FFFFFF",
    inputBorder: "#E2E8F0",
    headerBg: "rgba(255, 255, 255, 0.85)",
    headerBorder: "rgba(0, 0, 0, 0.06)",
  },

  // Dark Mode Neutrals (Obsidian / Slate / Zinc)
  dark: {
    background: "#0A0F14", // Deep Obsidian Black
    surface: "#111827",    // Slate 900
    surfaceMuted: "#1E293B",// Slate 800
    surfaceElevated: "#1E293B",
    border: "rgba(255, 255, 255, 0.08)",
    borderSubtle: "rgba(255, 255, 255, 0.05)",
    text: "#F8FAFC",
    textMuted: "#94A3B8",
    textSubtle: "#64748B",
    inputBg: "#111827",
    inputBorder: "rgba(255, 255, 255, 0.12)",
    headerBg: "rgba(10, 15, 20, 0.85)",
    headerBorder: "rgba(255, 255, 255, 0.08)",
  },
} as const;

export type ColorTokens = typeof colors;
