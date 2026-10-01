import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Enterprise Scroll Management (Stripe & Linear UX standard)
 * - PUSH / REPLACE navigation: scroll smoothly/instantly to top (0, 0)
 * - Hash navigation: smoothly scrolls to target element ID
 * - POP (Back/Forward): preserves browser native scroll restoration
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

  return null;
}
