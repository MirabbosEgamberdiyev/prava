import React, { useEffect, useState, useSyncExternalStore } from "react";
import { IconRefresh } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { imagePreloader } from "../OctagonImagePreloader";

interface Props {
  /** Savolning xom rasm yo'li (server qaytargan). Bo'lmasa — hech narsa chizilmaydi. */
  path?: string | null;
  questionId: number;
}

/** Yengil inline placeholder (tarmoqsiz ham ko'rinadi). */
const PlaceholderSvg: React.FC = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
    <rect x="6" y="12" width="60" height="48" rx="8" stroke="#475569" strokeWidth="3" />
    <circle cx="25" cy="29" r="6" stroke="#475569" strokeWidth="3" />
    <path d="M10 54l17-16 11 10 9-8 15 14" stroke="#475569" strokeWidth="3" strokeLinejoin="round" />
    <path d="M52 8l12 12M64 8L52 20" stroke="#f87171" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/**
 * Oktagon savol rasmi: oldindan yuklangan bo'lsa xotiradan darhol chiziladi; yuklanmasa —
 * oq ekran yoki "qotish" o'rniga placeholder va "Qayta yuklash" tugmasi.
 */
export const OctagonQuestionImage: React.FC<Props> = ({ path, questionId }) => {
  const { t } = useTranslation();
  const status = useSyncExternalStore(
    (cb) => imagePreloader.subscribe(cb),
    () => imagePreloader.getStatus(path)
  );
  const [renderFailed, setRenderFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    setRenderFailed(false);
    // Preload ulgurmagan bo'lsa (masalan, qayta ulanishdan keyin) — shu rasmni darhol navbatga qo'yamiz
    if (path && imagePreloader.getStatus(path) === "idle") {
      void imagePreloader.preloadImages([path]);
    }
  }, [path, questionId]);

  if (!path) return null;

  const failed = status === "error" || renderFailed;
  const src = imagePreloader.getSrc(path);

  const handleRetry = async () => {
    setRetrying(true);
    setRenderFailed(false);
    try {
      await imagePreloader.retry(path);
    } finally {
      setRetrying(false);
    }
  };

  if (failed || !src) {
    return (
      <div className="oct-question-img-box oct-question-img-fallback" role="img" aria-label={t("octagon.arena.imageFailed")}>
        <PlaceholderSvg />
        <span className="oct-img-fallback-text">{t("octagon.arena.imageFailed")}</span>
        <button type="button" className="oct-img-retry-btn" onClick={handleRetry} disabled={retrying}>
          <IconRefresh size={16} className={retrying ? "oct-spin-icon" : undefined} />
          <span>{t("octagon.arena.imageRetry")}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="oct-question-img-box">
      <img
        key={`${questionId}_${path}`}
        src={src}
        alt={t("octagon.arena.imageAlt")}
        className="oct-question-img"
        loading="eager"
        decoding="sync"
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        onError={() => setRenderFailed(true)}
      />
    </div>
  );
};
