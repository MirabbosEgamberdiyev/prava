import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

function isEditableTarget(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (el.isContentEditable) return true;
  return false;
}

function getScrollContainer(): HTMLElement | Window {
  const main = document.getElementById("main-content");
  if (main && (main.scrollHeight > main.clientHeight)) return main;
  const shellMain = document.querySelector<HTMLElement>(".shell-main");
  if (shellMain && (shellMain.scrollHeight > shellMain.clientHeight)) return shellMain;
  const shellBody = document.querySelector<HTMLElement>(".shell-body");
  if (shellBody && (shellBody.scrollHeight > shellBody.clientHeight)) return shellBody;
  return window;
}

function scrollTarget(target: HTMLElement | Window, delta: number, toTop?: boolean, toBottom?: boolean) {
  if (target === window) {
    if (toTop) window.scrollTo({ top: 0, behavior: "smooth" });
    else if (toBottom) window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    else window.scrollBy({ top: delta, behavior: "smooth" });
  } else {
    const el = target as HTMLElement;
    if (toTop) el.scrollTo({ top: 0, behavior: "smooth" });
    else if (toBottom) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    else el.scrollBy({ top: delta, behavior: "smooth" });
  }
}

/**
 * Enterprise Scroll Management (Stripe & Linear UX standard)
 * - PUSH / REPLACE navigation: scroll smoothly/instantly to top (0, 0)
 * - Hash navigation: smoothly scrolls to target element ID
 * - POP (Back/Forward): preserves browser native scroll restoration
 * - Universal keyboard scroll delegation: ensures PageDown/PageUp/ArrowDown/ArrowUp/Space/Home/End
 *   smoothly scroll the active container even when focus is not directly inside .shell-main
 */
export function ScrollManager() {
  const { pathname, search, hash } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // If navigating to a specific hash (e.g. #pricing-plans)
    if (hash) {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }

    // Clean up any stale modal or drawer scroll lock attributes on route change
    document.documentElement.removeAttribute("data-modal-open");
    document.body.removeAttribute("data-modal-open");
    document.documentElement.removeAttribute("data-mantine-scroll-locked");
    document.body.removeAttribute("data-mantine-scroll-locked");
    if (document.body.style.overflow === "hidden") {
      document.body.style.overflow = "";
    }
    if (document.documentElement.style.overflow === "hidden") {
      document.documentElement.style.overflow = "";
    }

    // For brand-new route transitions, scroll instantly to top so the page doesn't start midway
    if (navType !== "POP") {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
      const mainEl = document.getElementById("main-content");
      if (mainEl) {
        mainEl.scrollTop = 0;
      }
      document.querySelectorAll(".shell-main, .shell-body").forEach((el) => {
        el.scrollTop = 0;
      });
    }
  }, [pathname, search, hash, navType]);

  // Global keyboard scroll listener for accessibility and desktop UX
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in form controls or when modal is open
      if (isEditableTarget(e.target)) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (document.documentElement.hasAttribute("data-modal-open")) return;
      if (document.querySelector("[data-global-search-open]")) return;

      const target = getScrollContainer();
      const pageDelta = Math.round(window.innerHeight * 0.75);

      switch (e.key) {
        case "PageDown":
          e.preventDefault();
          scrollTarget(target, pageDelta);
          break;
        case "PageUp":
          e.preventDefault();
          scrollTarget(target, -pageDelta);
          break;
        case "ArrowDown":
          // Only scroll if focus is not on interactive control (button, select)
          if ((e.target as HTMLElement)?.tagName !== "BUTTON") {
            scrollTarget(target, 70);
          }
          break;
        case "ArrowUp":
          if ((e.target as HTMLElement)?.tagName !== "BUTTON") {
            scrollTarget(target, -70);
          }
          break;
        case " ": // Spacebar
          if ((e.target as HTMLElement)?.tagName !== "BUTTON") {
            e.preventDefault();
            scrollTarget(target, e.shiftKey ? -pageDelta : pageDelta);
          }
          break;
        case "Home":
          e.preventDefault();
          scrollTarget(target, 0, true, false);
          break;
        case "End":
          e.preventDefault();
          scrollTarget(target, 0, false, true);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return null;
}
