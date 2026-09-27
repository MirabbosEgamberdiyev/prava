import { useEffect, useState } from "react";
import {
  ensureCurriculumStats,
  getCachedTotalQuestions,
  getCachedTotalTickets,
  subscribeCurriculumStats,
} from "../services/desktopAdapter";

export interface CurriculumCounts {
  /** 0 — hali noma'lum (yuklanmoqda yoki server javob bermadi). */
  tickets: number;
  questions: number;
  loaded: boolean;
}

/**
 * Bilet va savollar soni — faqat serverdan (W-10). Noma'lum bo'lsa 0 va
 * `loaded=false`: UI raqamsiz matn yoki skeleton ko'rsatishi kerak.
 */
/**
 * Matnlarga interpolyatsiya uchun: `{{tickets}}`, `{{questions}}` — lokal formatda.
 * Son hali noma'lum bo'lsa "…" (yuklanish belgisi) — noto'g'ri raqam hech qachon ko'rsatilmaydi.
 */
export function formatCount(n: number, locale?: string): string {
  if (!(n > 0)) return "…";
  try {
    return new Intl.NumberFormat(locale).format(n);
  } catch {
    return String(n);
  }
}

export function useCurriculumCountParams(locale?: string): { tickets: string; questions: string } {
  const c = useCurriculumCounts();
  return { tickets: formatCount(c.tickets, locale), questions: formatCount(c.questions, locale) };
}

export function useCurriculumCounts(): CurriculumCounts {
  const read = (): CurriculumCounts => {
    const tickets = getCachedTotalTickets();
    const questions = getCachedTotalQuestions();
    return { tickets, questions, loaded: tickets > 0 || questions > 0 };
  };
  const [counts, setCounts] = useState<CurriculumCounts>(read);
  useEffect(() => {
    const update = () => setCounts(read());
    const unsub = subscribeCurriculumStats(update);
    void ensureCurriculumStats().then(update);
    return unsub;
  }, []);
  return counts;
}
