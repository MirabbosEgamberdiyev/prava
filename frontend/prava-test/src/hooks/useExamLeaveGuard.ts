import { useCallback, useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";

/**
 * W-07: faol imtihon davomida sahifadan chiqishni to'sish.
 *
 *  - ilova ichidagi navigatsiya (havolalar, "orqaga" tugmasi) — react-router
 *    `useBlocker` (ilova data router — `createBrowserRouter` — ostida ishlaydi);
 *    sahifa `blocked=true` bo'lganda tasdiqlash oynasini ko'rsatadi;
 *  - sahifani yopish / yangilash — `beforeunload` (brauzerning o'z oynasi).
 *
 * Faqat pathname o'zgarganda to'siladi (masalan `?resume=1` ni olib tashlash
 * kabi query o'zgarishlari to'silmaydi).
 *
 * `release()` — sahifa o'zi ataylab navigatsiya qilishidan oldin (masalan,
 * submit'dan keyin natija sahifasiga o'tish) to'siqni darhol olib tashlaydi.
 */
export interface ExamLeaveGuard {
  /** Navigatsiya to'sildi — tasdiqlash oynasini ko'rsating. */
  blocked: boolean;
  /** "Davom etish": navigatsiyani bekor qiladi. */
  stay: () => void;
  /** "Chiqish": `onLeave` ni chaqirib, navigatsiyani davom ettiradi. */
  leave: () => void;
  /** Keyingi navigatsiyalarni to'smaslik (sahifaning o'z navigatsiyasi uchun). */
  release: () => void;
}

export function useExamLeaveGuard(active: boolean, onLeave?: () => void): ExamLeaveGuard {
  const activeRef = useRef(active);
  const releasedRef = useRef(false);
  const onLeaveRef = useRef(onLeave);

  useEffect(() => {
    activeRef.current = active;
    // Yangi imtihon boshlanganda (false→true) avvalgi `release` bekor qilinadi.
    if (active) releasedRef.current = false;
  }, [active]);
  useEffect(() => {
    onLeaveRef.current = onLeave;
  });

  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }: { currentLocation: { pathname: string }; nextLocation: { pathname: string } }) =>
        activeRef.current && !releasedRef.current && currentLocation.pathname !== nextLocation.pathname,
      [],
    ),
  );

  useEffect(() => {
    if (!active) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (releasedRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [active]);

  // To'sish endi kerak bo'lmasa (masalan, taymer tugab imtihon yakunlandi) — kutilayotgan navigatsiyani tiklash.
  useEffect(() => {
    if (!active && blocker.state === "blocked") blocker.reset();
  }, [active, blocker]);

  const stay = useCallback(() => {
    if (blocker.state === "blocked") blocker.reset();
  }, [blocker]);

  const leave = useCallback(() => {
    if (blocker.state !== "blocked") return;
    releasedRef.current = true;
    onLeaveRef.current?.();
    blocker.proceed();
  }, [blocker]);

  const release = useCallback(() => {
    releasedRef.current = true;
  }, []);

  return { blocked: blocker.state === "blocked", stay, leave, release };
}

export default useExamLeaveGuard;
