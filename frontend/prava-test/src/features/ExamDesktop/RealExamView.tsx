import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  IconAlertTriangle,
  IconBookmark,
  IconBookmarkFilled,
  IconBulb,
  IconHelp,
} from "@tabler/icons-react";
import { localizeExp, localizeOpt, localizeQ, parseOptions } from "../../services/desktopAdapter";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../auth/AuthContext";
import { QuestionImage } from "./components/QuestionImage";
import { ImageZoomViewer } from "./components/ImageZoomViewer";
import { remainingSecondsUntil } from "../../components/quiz/ExamTimerDisplay";
import { useExamShortcuts } from "../../hooks/useExamShortcuts";
import { countResults } from "./logic";
import { destroyCurrentWindow, registerExamCloseGuard } from "./windowCloseGuard";
import { acquireExamFocusMode } from "./focusMode";
import { clearExamStatus, setExamStatus } from "../../state/statusBarStore";
import type { ExamDesktopViewProps } from "./ExamDesktopView";
import "../../styles/real-exam.css";

const AUTO_ADVANCE_MS = 750;

/** Format seconds as 0:MM:SS (matching the AVTECH official state exam display) */
function formatClockHMS(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${h}:${mm}:${ss}`;
}

/**
 * Generates a realistic examination workstation/desk code (e.g., "A-13", "B-7", "C-21", "D-14").
 * Matches official Uzbek DYXHX / YHXBB automated testing centers (Toshkent Imtihon Markazi etc.)
 * where exam rooms are partitioned into sectors (A, B, C, D, E) with computer terminals (1–24).
 */
export function generateRandomDeskCode(customRand?: () => number): string {
  const rand = customRand || Math.random;
  const sectors = ["A", "B", "C", "D", "E"];
  const sector = sectors[Math.floor(rand() * sectors.length)];
  const deskNum = Math.floor(rand() * 24) + 1; // 1 to 24
  return `${sector}-${deskNum}`;
}

export const RealExamView = memo(function RealExamView(props: ExamDesktopViewProps) {
  const {
    mode,
    label,
    questions,
    current,
    answers,
    onSelect,
    onGoto,
    onFinish,
    deadline,
    onTimeUp,
    maxMistakes,
    autoAdvance = "correct",
    bookmarkedIds,
    onToggleBookmark,
    onExit,
    persistProgress,
    progressSaved = !!persistProgress,
    showNavigator = true,
    headerExtra,
    finishLabel,
    finishConfirmTitle,
    finishConfirmDesc,
  } = props;

  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();

  const total = questions.length;
  const q = questions[current];
  const answered = q ? answers[current] : undefined;
  const isBookmarked = q && bookmarkedIds ? bookmarkedIds.has(q.id) : false;
  const { wrong } = useMemo(() => countResults(answers), [answers]);
  const isLast = current >= total - 1;

  // Active question ref for bottom scroll
  const activeBoxRef = useRef<HTMLButtonElement | null>(null);

  // Modals & zoom state
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [izohModalOpen, setIzohModalOpen] = useState(false);

  // Candidate Name (uppercase, matching reference screenshot)
  const candidateName = useMemo(() => {
    if (user?.fullName && user.fullName.trim()) return user.fullName.toUpperCase();
    if (user?.firstName) {
      const combined = `${user.firstName} ${user.lastName || ""}`.trim();
      if (combined) return combined.toUpperCase();
    }
    if (user?.email) {
      return user.email.split("@")[0].toUpperCase();
    }
    return "ERGASHEV UMAR FAXRIDDIN O‘G‘LI";
  }, [user]);

  // Session-stable realistic desk code (e.g. "A-13", "B-7", "C-21", "D-14")
  const [sessionDeskCode] = useState(() => generateRandomDeskCode());
  const effectiveDeskCode = props.deskCode || sessionDeskCode;

  // Desk / Terminal / Mode code (e.g. "A-13", "B-7", "Bilet #14", "Marafon")
  const headerCode = useMemo(() => {
    if (mode === "real") return effectiveDeskCode;
    if (label && label.trim() && !["Imtihon", "Экзамен", "Имтиҳон"].includes(label.trim())) {
      return label;
    }
    return effectiveDeskCode;
  }, [mode, label, effectiveDeskCode]);

  const isDeskCodeLong = headerCode.length > 5;

  // Options & localized text
  const options = useMemo(() => (q ? parseOptions(q.options_json) : []), [q]);
  const questionText = useMemo(() => (q ? localizeQ(q) : ""), [q, language]);
  const optionTexts = useMemo(
    () => options.map((o) => localizeOpt(o)),
    [options, language]
  );
  const explanation = useMemo(
    () => (q ? localizeExp(q) : ""),
    [q, language]
  );

  // ── Shell Integration (Focus mode, status bar) ──
  useEffect(() => {
    const releaseFocus = acquireExamFocusMode();
    return () => {
      releaseFocus();
      clearExamStatus();
    };
  }, []);

  useEffect(() => {
    if (!q) return;
    setExamStatus({
      mode,
      label,
      questionNumber: current + 1,
      totalQuestions: total,
      deadline: deadline ?? null,
      mistakes: wrong,
      maxMistakes,
    });
  }, [mode, label, current, total, deadline, wrong, maxMistakes, q]);

  // ── Digital Timer (0:MM:SS) ──
  // If timed: countdown. If untimed (marathon/topics): stopwatch countup.
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    deadline ? remainingSecondsUntil(deadline) : 0
  );
  const onTimeUpRef = useRef(onTimeUp ?? onFinish);
  onTimeUpRef.current = onTimeUp ?? onFinish;

  useEffect(() => {
    let fired = false;
    const startEpoch = Date.now();

    const tick = () => {
      if (deadline) {
        const rem = remainingSecondsUntil(deadline);
        setSecondsLeft(rem);
        if (rem <= 0 && !fired) {
          fired = true;
          onTimeUpRef.current();
        }
      } else {
        const elapsed = Math.floor((Date.now() - startEpoch) / 1000);
        setSecondsLeft(elapsed);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  // ── Navigation ──
  const onGotoRef = useRef(onGoto);
  onGotoRef.current = onGoto;
  const goto = useCallback(
    (idx: number) => {
      if (total === 0) return;
      onGotoRef.current(Math.max(0, Math.min(total - 1, idx)));
    },
    [total]
  );

  // Auto-scroll active bottom cell into view
  useEffect(() => {
    if (activeBoxRef.current) {
      activeBoxRef.current.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
    }
  }, [current]);

  // ── Auto-advance after fresh answer ──
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenRef = useRef<{ index: number; answered: boolean }>({ index: current, answered: !!answered });

  useEffect(() => {
    const prev = seenRef.current;
    const nowAnswered = !!answered;
    seenRef.current = { index: current, answered: nowAnswered };

    if (prev.index !== current || prev.answered || !nowAnswered || !answered) return;

    const ok = answered.selected === answered.correct;
    const shouldAdvance = autoAdvance === "always" || (autoAdvance === "correct" && ok);

    if (shouldAdvance && current < total - 1) {
      advanceTimerRef.current = setTimeout(() => {
        advanceTimerRef.current = null;
        goto(current + 1);
      }, AUTO_ADVANCE_MS);
    }
  }, [answered, current, total, goto, autoAdvance]);

  useEffect(
    () => () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    },
    [current]
  );

  // ── Pick option ──
  const handlePick = useCallback(
    (index: number) => {
      if (!q || answered || index < 0 || index >= options.length) return;
      onSelect(index);
    },
    [q, answered, options.length, onSelect]
  );

  // ── Bookmark handler ──
  const handleToggleBookmark = useCallback(() => {
    if (q && onToggleBookmark) {
      onToggleBookmark(q);
    }
  }, [q, onToggleBookmark]);

  // ── Exit Dialog Handlers ──
  const persistRef = useRef(persistProgress);
  persistRef.current = persistProgress;
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  const handleConfirmExit = useCallback(
    async (closingWindow = false) => {
      setExitModalOpen(false);
      try {
        await persistRef.current?.();
      } catch {
        // best effort
      }
      if (closingWindow) {
        await destroyCurrentWindow().catch(() => {});
        return;
      }
      onExitRef.current?.();
    },
    []
  );

  const handleConfirmFinish = useCallback(() => {
    setExitModalOpen(false);
    onFinish();
  }, [onFinish]);

  // Tauri close guard
  useEffect(() => {
    const unregister = registerExamCloseGuard(() => setExitModalOpen(true));
    return unregister;
  }, []);

  // ── Shortcuts ──
  useExamShortcuts(total > 0, {
    onSelect: (i) => {
      if (exitModalOpen || izohModalOpen || zoomSrc) return;
      handlePick(i);
    },
    onPrev: () => {
      if (!exitModalOpen && !izohModalOpen && !zoomSrc) goto(current - 1);
    },
    onNext: () => {
      if (!exitModalOpen && !izohModalOpen && !zoomSrc) goto(current + 1);
    },
    onSpace: () => {
      if (exitModalOpen || izohModalOpen || zoomSrc) return;
      if (answered && !isLast) goto(current + 1);
    },
    onConfirm: () => {
      if (exitModalOpen || izohModalOpen || zoomSrc) return;
      if (answered && !isLast) goto(current + 1);
      else if (answered && isLast) onFinish();
    },
    onBookmark: () => {
      if (!exitModalOpen && !izohModalOpen) handleToggleBookmark();
    },
    onEscape: () => {
      if (zoomSrc) {
        setZoomSrc(null);
        return;
      }
      if (izohModalOpen) {
        setIzohModalOpen(false);
        return;
      }
      setExitModalOpen(true);
    },
    onZoom: () => {
      if (exitModalOpen || izohModalOpen) return;
      if (zoomSrc) setZoomSrc(null);
      else if (q?.image_path) setZoomSrc(q.image_path);
    },
  });

  const zoomLabels = useMemo(
    () => ({
      close: t("examDesktop.close", "Yopish"),
      zoomIn: t("examDesktop.zoomIn", "Kattalashtirish"),
      zoomOut: t("examDesktop.zoomOut", "Kichiklashtirish"),
      reset: t("examDesktop.zoomReset", "Asl o'lcham"),
      hint: t("examDesktop.zoomHint", "G'ildirak — masshtab, sichqoncha bilan suring"),
    }),
    [t]
  );

  if (!q) return null;

  const DEFAULT_QUESTION_IMAGE = "/question-default.svg";
  const imagePath = q.image_path || DEFAULT_QUESTION_IMAGE;
  const isUrgentTimer = deadline ? secondsLeft <= 60 : false;

  return (
    <div className="real-exam-viewport" data-mode={mode}>
      {/* ── Top Header ── */}
      <header className="real-exam-header" data-tauri-drag-region="deep">
        {/* Language Switcher Tabs */}
        <div className="real-exam-lang-tabs" role="tablist">
          <button
            type="button"
            className={`real-exam-lang-tab${language === "uzl" ? " is-active" : ""}`}
            onClick={() => setLanguage("uzl")}
          >
            O'zbek tili
          </button>
          <button
            type="button"
            className={`real-exam-lang-tab${language === "uzc" ? " is-active" : ""}`}
            onClick={() => setLanguage("uzc")}
          >
            Ўзбек тили
          </button>
          <button
            type="button"
            className={`real-exam-lang-tab${language === "ru" ? " is-active" : ""}`}
            onClick={() => setLanguage("ru")}
          >
            Русский язык
          </button>
        </div>

        {/* Candidate Full Name */}
        <div className="real-exam-candidate-name">{candidateName}</div>

        {/* Desk Code / Mode Label & Exit Button */}
        <div className="real-exam-header-right">
          {headerExtra && <div className="real-exam-header-extra">{headerExtra}</div>}
          <div
            className={`real-exam-desk-code ${isDeskCodeLong ? "is-label" : ""}`}
            title={headerCode}
          >
            {headerCode}
          </div>
          <button
            type="button"
            className="real-exam-exit-btn"
            onClick={() => setExitModalOpen(true)}
            title={t("examDesktop.finish", "Chiqish (Esc)")}
          >
            <span className="real-exam-exit-icon">✕</span>
            <span className="real-exam-exit-label">Esc</span>
          </button>
        </div>
      </header>

      {/* ── Green Question Title Banner ── */}
      <div className="real-exam-question-bar">
        <div className="real-exam-question-text">{questionText}</div>
      </div>

      {/* ── Main Two-Column Screen Body ── */}
      <div className="real-exam-main">
        {/* Left Column: Options, Izoh Button & Saqlash Button */}
        <div className="real-exam-options-col">
          <div className="real-exam-options-list" role="group" aria-label={t("examDesktop.answers", "Javoblar")}>
            {optionTexts.map((text, idx) => {
              const isPicked = answered?.selected === idx;
              const isCorrectOpt = answered?.correct === idx;
              const isWrongChoice = isPicked && !isCorrectOpt;

              let cardClass = "real-exam-option-card";
              if (answered) {
                if (isPicked && isCorrectOpt) {
                  cardClass += " is-correct";
                } else if (isWrongChoice) {
                  cardClass += " is-wrong";
                } else if (isCorrectOpt && mode !== "real") {
                  cardClass += " is-correct";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  className={cardClass}
                  onClick={() => handlePick(idx)}
                  disabled={!!answered}
                >
                  <div className="real-exam-option-fbadge">F{idx + 1}</div>
                  <div className="real-exam-option-text">{text}</div>
                </button>
              );
            })}
          </div>

          {/* Action Buttons Row: Izoh (Explanation) + Saqlash / Belgilash (Bookmark) */}
          <div className="real-exam-actions-row">
            <button
              type="button"
              className="real-exam-action-btn real-exam-izoh-btn"
              onClick={() => setIzohModalOpen(true)}
              title={t("examDesktop.explanation", "Savol izohini ko'rish")}
            >
              <IconBulb size={17} aria-hidden="true" />
              <span>{t("examDesktop.explanation", "Izoh")}</span>
            </button>

            <button
              type="button"
              className={`real-exam-action-btn real-exam-bookmark-btn${isBookmarked ? " is-active" : ""}`}
              onClick={handleToggleBookmark}
              title={t("examDesktop.bookmarkHint", "Savolni saqlash / belgilash (B)")}
            >
              {isBookmarked ? (
                <IconBookmarkFilled size={17} aria-hidden="true" />
              ) : (
                <IconBookmark size={17} aria-hidden="true" />
              )}
              <span>
                {isBookmarked
                  ? t("examDesktop.bookmarked", "Saqlangan")
                  : t("examDesktop.bookmark", "Saqlash")}
              </span>
              <kbd className="real-exam-kbd">B</kbd>
            </button>
          </div>
        </div>

        {/* Right Column: Slate Card with Digital Timer Header and Question Image */}
        <div className="real-exam-image-col">
          <div className="real-exam-image-card">
            {/* Embedded Digital Clock Header (0:MM:SS) — strictly above the image */}
            <div className="real-exam-image-card-header">
              <div
                className={`real-exam-timer-box${isUrgentTimer ? " is-urgent" : ""}`}
                title={deadline ? t("exam.timeRemaining", "Qolgan vaqt") : t("exam.elapsedTime", "O'tgan vaqt")}
              >
                {formatClockHMS(secondsLeft)}
              </div>
            </div>

            {/* Question Illustration (Maximized, 90-95% container, zero overlay, object-fit contain) */}
            <div className="real-exam-image-wrap">
              <QuestionImage
                key={imagePath + "_" + q.id}
                path={imagePath}
                alt={questionText}
                onZoom={setZoomSrc}
                zoomHint={t("examDesktop.zoomOpen", "Kattalashtirish (Z)")}
                brokenLabel={t("examDesktop.imageUnavailable", "Rasm mavjud emas")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Navigation Strip (1 to N) ── */}
      {showNavigator && (
        <div className="real-exam-bottom-container">
          <nav className="real-exam-bottom-strip" aria-label={t("examDesktop.navigation", "Savollar navigatsiyasi")}>
            {Array.from({ length: total }, (_, i) => {
              const ans = answers[i];
              const isCurrent = i === current;
              const qItem = questions[i];
              const isFlagged = qItem && bookmarkedIds ? bookmarkedIds.has(qItem.id) : false;

              let boxClass = "real-exam-bottom-box";
              if (ans) {
                if (ans.selected === ans.correct) boxClass += " is-correct";
                else boxClass += " is-wrong";
              }
              if (isCurrent) {
                boxClass += " is-current";
              }
              if (isFlagged) {
                boxClass += " is-flagged";
              }

              return (
                <button
                  key={i}
                  ref={isCurrent ? activeBoxRef : undefined}
                  type="button"
                  className={boxClass}
                  onClick={() => goto(i)}
                  aria-current={isCurrent ? "true" : undefined}
                >
                  {i + 1}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* ── Image Zoom Viewer Modal ── */}
      {zoomSrc && (
        <ImageZoomViewer
          src={zoomSrc}
          alt={questionText}
          onClose={() => setZoomSrc(null)}
          labels={zoomLabels}
        />
      )}

      {/* ── Izoh (Explanation) Modal ── */}
      {izohModalOpen && (
        <div className="real-exam-modal-backdrop" onClick={() => setIzohModalOpen(false)}>
          <div className="real-exam-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="real-exam-modal-title">
              <IconHelp size={22} color="#38bdf8" />
              {t("examDesktop.explanation", "Savol izohi")}
            </h3>
            <p className="real-exam-modal-desc">
              {explanation || t("examDesktop.noExplanation", "Ushbu savol uchun qo'shimcha izoh kiritilmagan.")}
            </p>
            <div className="real-exam-modal-actions">
              <button
                type="button"
                className="real-exam-modal-btn primary"
                onClick={() => setIzohModalOpen(false)}
              >
                {t("examDesktop.close", "Tushunarli / Yopish")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Exit / Finish Confirmation Modal ── */}
      {exitModalOpen && (
        <div className="real-exam-modal-backdrop" onClick={() => setExitModalOpen(false)}>
          <div className="real-exam-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="real-exam-modal-title">
              <IconAlertTriangle size={22} color="#f59e0b" />
              {finishConfirmTitle || t("examDesktop.exitConfirmTitle", "Imtihondan chiqasizmi?")}
            </h3>
            <p className="real-exam-modal-desc">
              {finishConfirmDesc || (progressSaved
                ? t(
                    "examDesktop.exitConfirmDescSaved",
                    "Chiqsangiz, javoblaringiz saqlanadi va keyinroq davom ettirishingiz mumkin. Yakunlasangiz, natija hisoblanadi."
                  )
                : t(
                    "examDesktop.exitConfirmDescUnsaved",
                    "Chiqsangiz, bu urinish saqlanmaydi. Yakunlasangiz, natija hisoblanadi."
                  ))}
            </p>
            <div className="real-exam-modal-actions">
              <button
                type="button"
                className="real-exam-modal-btn secondary"
                onClick={() => setExitModalOpen(false)}
              >
                {t("examDesktop.continue", "Davom etish")}
              </button>
              {onExit && (
                <button
                  type="button"
                  className="real-exam-modal-btn secondary"
                  onClick={() => void handleConfirmExit(false)}
                >
                  {t("common.exit", "Chiqish")}
                </button>
              )}
              <button
                type="button"
                className="real-exam-modal-btn danger"
                onClick={handleConfirmFinish}
              >
                {finishLabel || t("examDesktop.finish", "Yakunlash")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default RealExamView;
