import type { ComponentType } from "react";
import {
  IconAlertTriangle,
  IconBookmark,
  IconBook2,
  IconChartBar,
  IconClipboardCheck,
  IconLayoutDashboard,
  IconPackage,
  IconRun,
  IconFlame,
  IconSchool,
  IconSettings,
  IconSteeringWheel,
  IconTicket,
  IconTrophy,
} from "@tabler/icons-react";
import { isLearnPath } from "./routes";

export interface ShellNavItem {
  id: string;
  path: string;
  /** i18n key under desktopShell.nav */
  labelKey: string;
  fallback: string;
  icon: ComponentType<{ size?: number; stroke?: number }>;
  match: (pathname: string) => boolean;
  /** Displayed in the tooltip (e.g. "Ctrl+,"). */
  shortcut?: string;
  /**
   * Needs a signed-in account (per-user data or a protected exam workflow). Guests still see the
   * item, marked with a lock; the page itself shows a login prompt (D-22).
   */
  requiresAuth?: boolean;
}

export interface ShellNavSection {
  id: string;
  labelKey: string;
  fallback: string;
  items: ShellNavItem[];
}

const starts = (...prefixes: string[]) => (p: string) =>
  prefixes.some((x) => p === x || p.startsWith(`${x}/`));

/**
 * Pedagogically structured navigation sections:
 * 1. ASOSIY (Home/Overview)
 * 2. O‘RGANISH (Theory, Topics, Learning materials)
 * 3. MASHQ (Practice, Tickets, Marathon, Survival)
 * 4. XATOLAR (Remediation, Wrong answers, Bookmarks)
 * 5. IMTIHON (Examination, Real YHXDX, 3D Simulator)
 * 6. NATIJALAR (Analytics, Statistics, Leaderboard)
 */
export const SHELL_NAV_SECTIONS: ShellNavSection[] = [
  {
    id: "main",
    labelKey: "desktopShell.sections.main",
    fallback: "Asosiy",
    items: [
      { id: "home", path: "/me", labelKey: "desktopShell.nav.home", fallback: "Asosiy", icon: IconLayoutDashboard, match: starts("/me") },
      { id: "topics", path: "/topics", labelKey: "desktopShell.nav.topics", fallback: "Mavzular", icon: IconBook2, match: starts("/topics") },
      { id: "learn", path: "/signs", labelKey: "desktopShell.nav.learn", fallback: "O'quv materiallari", icon: IconSchool, match: (p) => isLearnPath(p) || p === "/materials" },
    ],
  },
  {
    id: "practice",
    labelKey: "desktopShell.sections.practice",
    fallback: "Mashq qilish",
    items: [
      { id: "tickets", path: "/tickets", labelKey: "desktopShell.nav.tickets", fallback: "Biletlar", icon: IconTicket, match: starts("/tickets") },
      { id: "marathon", path: "/marafon", labelKey: "desktopShell.nav.marathon", fallback: "Marafon", icon: IconRun, match: starts("/marafon", "/marathon"), requiresAuth: true },
      { id: "survival", path: "/survival", labelKey: "desktopShell.nav.survival", fallback: "Xatogacha marafon", icon: IconFlame, match: starts("/survival"), requiresAuth: true },
    ],
  },
  {
    id: "remediation",
    labelKey: "desktopShell.sections.remediation",
    fallback: "Xatolar ustida ishlash",
    items: [
      { id: "wrong", path: "/wrong-answers", labelKey: "desktopShell.nav.wrongWork", fallback: "Xatolar ustida ishlash", icon: IconAlertTriangle, match: starts("/wrong-answers", "/wrong-exam", "/mistakes"), requiresAuth: true },
      { id: "saved", path: "/saved-questions", labelKey: "desktopShell.nav.saved", fallback: "Tanlanganlar", icon: IconBookmark, match: starts("/saved-questions", "/bookmarks"), requiresAuth: true },
    ],
  },
  {
    id: "exam",
    labelKey: (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) ? "desktopShell.sections.exam" : "desktopShell.sections.examOnly",
    fallback: (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) ? "Imtihon & Simulator" : "Imtihon",
    items: [
      { id: "exam", path: "/exam", labelKey: "desktopShell.nav.realExam", fallback: "Real imtihon", icon: IconClipboardCheck, match: starts("/exam"), requiresAuth: true },
      ...((typeof window !== "undefined" && "__TAURI_INTERNALS__" in window)
        ? [{ id: "simulator", path: "/simulator", labelKey: "desktopShell.nav.simulator", fallback: "3D Simulator", icon: IconSteeringWheel, match: starts("/simulator") }]
        : []),
    ],
  },
  {
    id: "analytics",
    labelKey: "desktopShell.sections.analytics",
    fallback: "Natijalar",
    items: [
      { id: "stats", path: "/statistics", labelKey: "desktopShell.nav.statistics", fallback: "Statistika", icon: IconChartBar, match: starts("/statistics", "/history"), requiresAuth: true },
      { id: "rating", path: "/leaderboard", labelKey: "desktopShell.nav.rating", fallback: "Reyting", icon: IconTrophy, match: starts("/leaderboard", "/ranking") },
    ],
  },
];

export const SHELL_NAV_MAIN: ShellNavItem[] = SHELL_NAV_SECTIONS.flatMap((s) => s.items);

export const SHELL_NAV_FOOTER: ShellNavItem[] = [
  { id: "packages", path: "/packages", labelKey: "desktopShell.nav.packages", fallback: "Paketlar", icon: IconPackage, match: starts("/packages", "/payment") },
  { id: "settings", path: "/settings", labelKey: "desktopShell.nav.settings", fallback: "Sozlamalar", icon: IconSettings, match: starts("/settings"), shortcut: "Ctrl+," },
];

export const SHELL_NAV_ALL: ShellNavItem[] = [...SHELL_NAV_MAIN, ...SHELL_NAV_FOOTER];

export function findNavItem(pathname: string): ShellNavItem | null {
  return SHELL_NAV_ALL.find((i) => i.match(pathname)) ?? null;
}
