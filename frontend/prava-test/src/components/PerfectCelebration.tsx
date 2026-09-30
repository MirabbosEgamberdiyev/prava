import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  /** Bu bilet birinchi marta 100% bo'ldimi — to'liq animatsiya faqat shunda */
  firstTime: boolean;
  /** 5 daqiqadan tez yechildimi — "Chaqmoq" belgisi */
  fast: boolean;
  onDone: () => void;
}

const COLORS = ["#7950f2", "#0c8599", "#2f9e44", "#fab005", "#e03131", "#4dabf7"];

interface Piece {
  x: number; y: number; vx: number; vy: number;
  w: number; h: number; rot: number; vr: number; color: string;
}

/**
 * Bilet 100% yechilganda chiqadigan tabrik.
 * Konfetti canvas'da chiziladi (tashqi kutubxona yo'q, internetsiz ishlaydi).
 * Istalgan joyni bosish — darhol yopadi.
 */
export default function PerfectCelebration({ firstTime, fast, onDone }: Props) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [leaving, setLeaving] = useState(false);

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const duration = firstTime ? 3400 : 1800;

  // onDone ota-komponentda har render'da yangi funksiya bo'lishi mumkin —
  // taymerlar qayta boshlanmasligi uchun ref orqali ushlaymiz
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Avtomatik yopilish
  useEffect(() => {
    const fadeTimer = setTimeout(() => setLeaving(true), duration);
    const doneTimer = setTimeout(() => onDoneRef.current(), duration + 350);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, [duration]);

  // Konfetti
  useEffect(() => {
    if (reduceMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const count = firstTime ? 180 : 90;
    const pieces: Piece[] = [];

    // Ikki tomondan "otilgan" konfetti (pastki burchaklardan yuqoriga)
    for (let i = 0; i < count; i++) {
      const fromLeft = i % 2 === 0;
      pieces.push({
        x: fromLeft ? -10 : W() + 10,
        y: H() * (0.55 + Math.random() * 0.3),
        vx: (fromLeft ? 1 : -1) * (6 + Math.random() * 9),
        vy: -(9 + Math.random() * 11),
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
        color: COLORS[i % COLORS.length],
      });
    }

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, W(), H());
      const fade = Math.max(0, 1 - Math.max(0, elapsed - duration + 800) / 800);
      for (const p of pieces) {
        p.vy += 0.32;          // tortishish
        p.vx *= 0.985;         // havo qarshiligi
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        // "Aylanayotgan qog'oz" effekti — kenglik kosinus bilan o'zgaradi
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w * Math.abs(Math.cos(p.rot * 2)) + 1, p.h);
        ctx.restore();
      }
      if (elapsed < duration + 400) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [firstTime, duration, reduceMotion]);

  return (
    <div
      className={`pc-overlay${leaving ? " pc-leaving" : ""}`}
      onClick={onDone}
      role="dialog"
      aria-label={t("celebrate.title")}
    >
      <canvas ref={canvasRef} className="pc-canvas" />

      <div className={`pc-card${firstTime ? "" : " pc-card--compact"}`}>
        {firstTime && (
          <div className="pc-road" aria-hidden="true">
            <div className="pc-flag">
              {Array.from({ length: 12 }).map((_, i) => <span key={i} />)}
            </div>
            <svg className="pc-car" viewBox="0 0 64 30" width="64" height="30">
              <path d="M6 20 L10 11 Q12 7 17 7 L38 7 Q43 7 47 11 L53 17 Q60 18 60 22 L60 24 L4 24 L4 22 Q4 20 6 20 Z" fill="#7950f2" />
              <path d="M16 10 L24 10 L24 16 L12 16 Z M27 10 L37 10 Q40 10 43 13 L46 16 L27 16 Z" fill="#fff" opacity="0.85" />
              <circle cx="16" cy="24" r="5" fill="#212529" /><circle cx="16" cy="24" r="2" fill="#adb5bd" />
              <circle cx="47" cy="24" r="5" fill="#212529" /><circle cx="47" cy="24" r="2" fill="#adb5bd" />
            </svg>
            <div className="pc-lane" />
          </div>
        )}

        <div className="pc-score">100%</div>
        <div className="pc-title">{firstTime ? t("celebrate.title") : t("celebrate.again")}</div>
        <div className="pc-sub">{t("celebrate.sub")}</div>

        {fast && (
          <div className="pc-fast">⚡ {t("celebrate.fast")}</div>
        )}

        <div className="pc-hint">{t("celebrate.tap")}</div>
      </div>
    </div>
  );
}
