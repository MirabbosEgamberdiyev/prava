import { useEffect, useRef, useState } from "react";

/**
 * Imtihon taymeri — deadline asosida (P2-W5).
 *
 * `components/quiz/QuizNav.tsx` dagi yondashuv umumiy hook'ga ko'chirildi:
 *  - deadline = start + duration; qolgan vaqt har tickda `deadline - Date.now()`
 *    dan hisoblanadi, shuning uchun fon tabida `setInterval` sekinlashsa ham
 *    taymer "orqada qolmaydi" (avvalgi `prev - 1` dekrement muammosi).
 *  - tab qayta ko'ringanda (`visibilitychange`) darhol qayta hisoblanadi.
 *  - `onExpire` ref orqali ROPPA-ROSA BIR MARTA chaqiriladi va hech qachon
 *    React state updater ichida emas (StrictMode'da updater ikki marta
 *    chaqirilib, ikki marta submit bo'lardi).
 *  - unmount / `running=false` da interval va listener tozalanadi.
 *  - 5 va 1 daqiqa chegarasi kesib o'tilganda `warning` qaytaradi
 *    (ekran o'quvchi uchun aria-live e'lon — `ExamTimerAnnouncer`).
 */
export type ExamTimerWarning = "five" | "one" | null;

export interface UseExamTimerOptions {
  /** Umumiy davomiylik (soniya). */
  durationSeconds: number;
  /** Taymer ishlayaptimi (masalan `phase === "exam"`). false→true o'tishida deadline qayta o'rnatiladi. */
  running: boolean;
  /** Vaqt tugaganda bir marta chaqiriladi. */
  onExpire?: () => void;
}

export interface UseExamTimerResult {
  /** Qolgan soniya (butun, >= 0). */
  timeLeft: number;
  /** Vaqt tugadimi. */
  isExpired: boolean;
  /** Oxirgi kesib o'tilgan ogohlantirish chegarasi. */
  warning: ExamTimerWarning;
}

const FIVE_MIN = 5 * 60;
const ONE_MIN = 60;

export function useExamTimer({
  durationSeconds,
  running,
  onExpire,
}: UseExamTimerOptions): UseExamTimerResult {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.round(durationSeconds)));
  const [warning, setWarning] = useState<ExamTimerWarning>(null);

  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Davomiylik faqat start paytida (running false→true) olinadi — imtihon
  // davomida qoidalar (exam-rules) kechikib yuklansa ham taymer qayta boshlanmaydi.
  const durationRef = useRef(durationSeconds);
  useEffect(() => {
    durationRef.current = durationSeconds;
  }, [durationSeconds]);

  const firedRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const total = Math.max(0, Math.round(durationRef.current));

    const deadline = Date.now() + total * 1000;
    firedRef.current = false;
    let lastRemaining = total;
    setTimeLeft(total);
    setWarning(null);

    let timer: ReturnType<typeof setInterval> | null = null;

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      document.removeEventListener("visibilitychange", onVisible);
    };

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);

      // Chegara kesib o'tilganda (boshlang'ich davomiylik chegaradan katta bo'lsa)
      if (lastRemaining > ONE_MIN && remaining <= ONE_MIN && remaining > 0) {
        setWarning("one");
      } else if (lastRemaining > FIVE_MIN && remaining <= FIVE_MIN && remaining > ONE_MIN) {
        setWarning("five");
      }
      lastRemaining = remaining;

      if (remaining <= 0 && !firedRef.current) {
        firedRef.current = true;
        stop();
        onExpireRef.current?.();
      }
    };

    function onVisible() {
      if (document.visibilityState === "visible") tick();
    }

    timer = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", onVisible);

    return stop;
  }, [running]);

  return { timeLeft, isExpired: timeLeft <= 0, warning };
}

export default useExamTimer;
