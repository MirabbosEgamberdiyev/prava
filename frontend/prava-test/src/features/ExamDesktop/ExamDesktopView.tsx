import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  IconBookmark,
  IconBookmarkFilled,
  IconBulb,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconFlag,
  IconX,
} from "@tabler/icons-react";
import type { OfflineQuestion } from "../../types/desktop";
import { localizeExp, localizeOpt, localizeQ, parseOptions } from "../../services/desktopAdapter";
import { clearExamStatus, setExamStatus, type ExamStatusMode } from "../../state/statusBarStore";
import { useExamShortcuts } from "../../hooks/useExamShortcuts";
import ExamTimerDisplay from "../../components/quiz/ExamTimerDisplay";
import { prioritizeQuestionImages } from "../../services/offlineMediaManagerPreload";
import { offlineMediaManager } from "../../services/offlineMediaManager";
import { getImageUrl } from "../../utils/imageUtils";
import { AnswerCard, type AnswerCardState } from "./components/AnswerCard";
import { QuestionNavigator } from "./components/QuestionNavigator";
import { QuestionImage } from "./components/QuestionImage";
import { ImageZoomViewer } from "./components/ImageZoomViewer";
import { ConfirmDialog, type ConfirmDialogAction } from "./components/ConfirmDialog";
import { useSplitPane } from "./useSplitPane";
import { acquireExamFocusMode } from "./focusMode";
import { countResults, resolveEscapeIntent, shouldConfirmFinish, type AnswerMap } from "./logic";
import { destroyCurrentWindow, registerExamCloseGuard } from "./windowCloseGuard";
import { MAX_KEYBOARD_OPTIONS } from "../../hooks/useExamShortcuts";
import "../../styles/exam-desktop.css";

export type AutoAdvance = "always" | "correct" | "never";

export interface ExamDesktopViewProps {
  mode: ExamStatusMode;
  /** Ready, translated label: "Imtihon", "Bilet #14", "Marafon"… */
  label: string;
  questions: OfflineQuestion[];
  current: number;
  answers: AnswerMap;
  /** Record an answer for `current` (the page ignores repeated answers). */
  onSelect: (optionIndex: number) => void;
  onGoto: (index: number) => void;
  /** Finish the exam (already confirmed by the user when questions were left unanswered). */
  onFinish: () => void;
  /** Absolute deadline (epoch ms); null/undefined = untimed. */
  deadline?: number | null;
  onTimeUp?: () => void;
  maxMistakes?: number;
  /** Show correct / wrong immediately after answering (default true). */
  revealAnswers?: boolean;
  /** Practice modes: show the explanation after answering. */
  showExplanation?: boolean;
  /** Auto-advance after answering: always, only after a correct answer, or never. */
  autoAdvance?: AutoAdvance;
  /** Enter must confirm the picked option (digits/click only pre-select). */
  confirmSelection?: boolean;
  bookmarkedIds: ReadonlySet<number>;
  onToggleBookmark: (q: OfflineQuestion) => void;
  showNavigator?: boolean;
  /** Extra header chips (streak, "N qoldi"…). */
  headerExtra?: ReactNode;
  finishLabel?: string;
  /** Title/description of the finish confirmation. */
  finishConfirmTitle?: string;
  finishConfirmDesc?: string;
  /** Ask before finishing even when every question is answered (e.g. survival "give up"). */
  alwaysConfirmFinish?: boolean;
  /**
   * Leave the exam without finishing it (Esc dialog → "Exit"). Called after `persistProgress`.
   * When omitted the exit option is not offered in-app (the window-close dialog still offers it).
   */
  onExit?: () => void;
  /** Flush the crash-recovery progress immediately (before exit / window close). */
  persistProgress?: () => Promise<void> | void;
  /** True when the exam can be resumed later (progress is persisted). Defaults to !!persistProgress. */
  progressSaved?: boolean;
}

type DialogReason = "finish" | "exit" | "close";

const AUTO_ADVANCE_MS = 700;

function ExamDesktopViewImpl(props: ExamDesktopViewProps) {
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
    revealAnswers = true,
    showExplanation = false,
    autoAdvance = "correct",
    confirmSelection = false,
    bookmarkedIds,
    onToggleBookmark,
    showNavigator = true,
    headerExtra,
    finishLabel,
    finishConfirmTitle,
    finishConfirmDesc,
    alwaysConfirmFinish = false,
    onExit,
    persistProgress,
    progressSaved = !!persistProgress,
  } = props;
  const { t, i18n } = useTranslation();
  const total = questions.length;
  const q = questions[current];
  const answered = q ? answers[current] : undefined;
  const { correct, wrong, answered: answeredCount } = useMemo(() => countResults(answers), [answers]);
  const isLast = current >= total - 1;

  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogReason | null>(null);
  const confirmOpen = dialog != null;
  const [pending, setPending] = useState<number | null>(null);
  const { containerRef, splitterProps } = useSplitPane();

  const options = useMemo(() => (q ? parseOptions(q.options_json) : []), [q]);
  // i18n.language in deps: re-localize when the language changes.
  const lang = i18n.language;
  const questionText = useMemo(() => (q ? localizeQ(q) : ""), [q, lang]);
  const optionTexts = useMemo(() => options.map((o) => localizeOpt(o)), [options, lang]);
  const explanation = useMemo(
    () => (showExplanation && answered && q ? localizeExp(q) : null),
    [showExplanation, answered, q, lang]
  );

  // ── Shell integration: focus mode, status bar ──
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

  // ── Preload ALL questions' images into local cache and browser memory immediately ──
  useEffect(() => {
    if (questions.length === 0) return;
    const paths = questions.map((x) => x.image_path).filter(Boolean) as string[];
    prioritizeQuestionImages(paths);
    paths.forEach((p) => {
      const src = offlineMediaManager.peekLocalImageUrl(p) ?? getImageUrl(p);
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }, [questions]);

  // Priority queue for current and upcoming questions on navigation
  useEffect(() => {
    if (total === 0) return;
    prioritizeQuestionImages(questions.slice(current, current + 5).map((x) => x.image_path));
  }, [current, questions, total]);

  // ── Per-question reset: pending pick ──
  useEffect(() => {
    setPending(null);
  }, [current]);

  // ── Window close (Tauri): never close silently during an exam — ask first ──
  const persistRef = useRef(persistProgress);
  persistRef.current = persistProgress;
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;
  const unregisterCloseRef = useRef<() => void>(() => {});
  useEffect(() => {
    const unregister = registerExamCloseGuard(() => setDialog("close"));
    unregisterCloseRef.current = unregister;
    return unregister;
  }, []);

  // ── Answer feedback (auto-advance) — only for a fresh answer on the current question ──
  const seen = useRef<{ index: number; answered: boolean }>({ index: current, answered: !!answered });
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onGotoRef = useRef(onGoto);
  onGotoRef.current = onGoto;

  useEffect(() => {
    const prev = seen.current;
    const nowAnswered = !!answered;
    seen.current = { index: current, answered: nowAnswered };
    if (prev.index !== current || prev.answered || !nowAnswered || !answered) return;
    const ok = answered.selected === answered.correct;
    const shouldAdvance = autoAdvance === "always" || (autoAdvance === "correct" && ok);
    if (shouldAdvance && current < total - 1) {
      advanceTimer.current = setTimeout(() => {
        advanceTimer.current = null;
        onGotoRef.current(current + 1);
      }, AUTO_ADVANCE_MS);
    }
  }, [answered, current, autoAdvance, total]);

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    },
    [current]
  );

  // ── Actions ──
  const goto = useCallback(
    (i: number) => {
      if (total === 0) return;
      onGotoRef.current(Math.max(0, Math.min(total - 1, i)));
    },
    [total]
  );

  /** Mouse "Finish" skips the dialog only when everything is answered; keyboard finishes always confirm. */
  const requestFinish = useCallback(
    (viaKeyboard = false) => {
      if (shouldConfirmFinish({ viaKeyboard, alwaysConfirm: alwaysConfirmFinish, answered: answeredCount, total }))
        setDialog("finish");
      else onFinish();
    },
    [alwaysConfirmFinish, answeredCount, total, onFinish]
  );
  const clickFinish = useCallback(() => requestFinish(false), [requestFinish]);

  const next = useCallback(() => {
    if (isLast) {
      if (answered) requestFinish(true);
      return;
    }
    goto(current + 1);
  }, [isLast, answered, requestFinish, goto, current]);

  const closeDialog = useCallback(() => setDialog(null), []);
  const confirmFinish = useCallback(() => {
    setDialog(null);
    onFinish();
  }, [onFinish]);
  const exitingRef = useRef(false);
  const confirmExit = useCallback(async (closingWindow: boolean) => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    setDialog(null);
    try {
      await persistRef.current?.();
    } catch {
      // best effort — the debounced saver also flushes on unmount
    }
    exitingRef.current = false;
    if (closingWindow) {
      unregisterCloseRef.current();
      await destroyCurrentWindow().catch(() => {});
      return;
    }
    onExitRef.current?.();
  }, []);

  const selectRef = useRef<(i: number) => void>(() => {});
  selectRef.current = (i: number) => {
    if (!q || answered || i < 0 || i >= options.length) return;
    if (confirmSelection) setPending(i);
    else onSelect(i);
  };
  const pick = useCallback((i: number) => selectRef.current(i), []);

  const toggleBookmark = useCallback(() => {
    if (q) onToggleBookmark(q);
  }, [q, onToggleBookmark]);

  const openZoom = useCallback(() => {
    if (!q?.image_path) return;
    const src = offlineMediaManager.peekLocalImageUrl(q.image_path) ?? getImageUrl(q.image_path);
    if (src) setZoomSrc(src);
  }, [q]);

  useExamShortcuts(total > 0, {
    onSelect: (i) => {
      if (confirmOpen || zoomSrc) return;
      pick(i);
    },
    onPrev: () => {
      if (!confirmOpen && !zoomSrc) goto(current - 1);
    },
    onNext: () => {
      if (!confirmOpen && !zoomSrc) goto(current + 1);
    },
    onSpace: () => {
      if (confirmOpen || zoomSrc) return;
      next();
    },
    onConfirm: () => {
      // While the dialog is open it handles Enter itself (focused button only).
      if (zoomSrc || confirmOpen) return;
      if (confirmSelection && pending != null && !answered) {
        onSelect(pending);
        setPending(null);
        return;
      }
      if (answered) next();
    },
    onEscape: () => {
      // Esc NEVER finishes or leaves the exam by itself — it always goes through the dialog.
      const intent = resolveEscapeIntent({ zoomOpen: !!zoomSrc, dialogOpen: confirmOpen });
      if (intent === "close-zoom") setZoomSrc(null);
      else if (intent === "close-dialog") setDialog(null);
      else setDialog("exit");
    },
    onBookmark: () => {
      if (!confirmOpen) toggleBookmark();
    },
    onZoom: () => {
      if (confirmOpen) return;
      if (zoomSrc) setZoomSrc(null);
      else openZoom();
    },
  });

  // ── Derived, memoized view data ──
  const cardStates = useMemo<AnswerCardState[]>(
    () =>
      options.map((_, i) => {
        if (!answered) return pending === i ? "pending" : "idle";
        if (!revealAnswers) return i === answered.selected ? "chosen" : "dim";
        if (i === answered.correct) return "correct";
        if (i === answered.selected) return "wrong";
        return "dim";
      }),
    [options, answered, pending, revealAnswers]
  );

  const flaggedIdx = useMemo(() => {
    const s = new Set<number>();
    questions.forEach((qq, i) => {
      if (bookmarkedIds.has(qq.id)) s.add(i);
    });
    return s;
  }, [questions, bookmarkedIds]);

  const navLegend = useMemo(
    () => ({
      current: t("examDesktop.navCurrent", "Joriy"),
      answered: t("examDesktop.navAnswered", "Javob berilgan"),
      correct: t("examDesktop.navCorrect", "To'g'ri"),
      wrong: t("examDesktop.navWrong", "Xato"),
      flagged: t("examDesktop.navFlagged", "Belgilangan"),
    }),
    [t]
  );
  const pageLabel = useCallback((from: number, to: number, n: number) => `${from}–${to} / ${n}`, []);
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
  const closeZoom = useCallback(() => setZoomSrc(null), []);
  const dialogView = useMemo(() => {
    if (!dialog) return null;
    const unansweredLeft = total - answeredCount;
    const finishText = finishLabel ?? t("examDesktop.finish", "Yakunlash");
    const actions: ConfirmDialogAction[] = [
      { id: "continue", label: t("examDesktop.continue", "Davom etish"), onClick: closeDialog },
    ];
    if (dialog === "finish") {
      actions.push({ id: "finish", label: finishText, variant: "danger", onClick: confirmFinish });
      return {
        title: finishConfirmTitle ?? t("examDesktop.finishConfirmTitle", "Imtihonni yakunlaysizmi?"),
        description:
          finishConfirmDesc ??
          (unansweredLeft > 0
            ? t("examDesktop.finishConfirmDesc", "{{count}} ta savolga javob berilmagan. Ular xato deb hisoblanadi.", {
                count: unansweredLeft,
              })
            : t("examDesktop.finishConfirmDescAll", "Barcha savollarga javob berildi. Natijani ko'rasizmi?")),
        actions,
      };
    }
    const closingWindow = dialog === "close";
    if (closingWindow || onExit) {
      actions.push({
        id: "exit",
        label: progressSaved
          ? t("examDesktop.exitSaved", "Chiqish (progress saqlanadi)")
          : t("examDesktop.exitUnsaved", "Chiqish (natija saqlanmaydi)"),
        onClick: () => void confirmExit(closingWindow),
      });
    }
    actions.push({ id: "finish", label: finishText, variant: "danger", onClick: confirmFinish });
    return {
      title: closingWindow
        ? t("examDesktop.closeConfirmTitle", "Imtihon davom etmoqda. Ilovani yopasizmi?")
        : t("examDesktop.exitConfirmTitle", "Imtihondan chiqasizmi?"),
      description: progressSaved
        ? t(
            "examDesktop.exitConfirmDescSaved",
            "Chiqsangiz, javoblaringiz saqlanadi va keyinroq davom ettirishingiz mumkin. Yakunlasangiz, natija hisoblanadi."
          )
        : t(
            "examDesktop.exitConfirmDescUnsaved",
            "Chiqsangiz, bu urinish saqlanmaydi. Yakunlasangiz, natija hisoblanadi."
          ),
      actions,
    };
  }, [
    dialog,
    total,
    answeredCount,
    finishLabel,
    finishConfirmTitle,
    finishConfirmDesc,
    onExit,
    progressSaved,
    t,
    closeDialog,
    confirmFinish,
    confirmExit,
  ]);
  const correctLabel = t("examDesktop.correctAnswer", "To'g'ri javob");
  const wrongLabel = t("examDesktop.yourAnswer", "Sizning javobingiz");

  if (!q) return null;
  const bookmarked = bookmarkedIds.has(q.id);
  const hasImage = !!q.image_path;
  const mistakesLeftDanger = maxMistakes != null && wrong >= maxMistakes;

  return (
    <div className="xd-root" data-mode={mode}>
      {/* ── Header ── */}
      <header className="xd-header">
        <div className="xd-header__left">
          <span className="xd-chip xd-chip--mode">{label}</span>
          <span className="xd-counter" aria-live="polite">
            {t("examDesktop.questionOf", "Savol")} <b>{current + 1}</b> / {total}
          </span>
          {headerExtra}
        </div>
        <div className="xd-header__center">
          {deadline ? <ExamTimerDisplay deadline={deadline} onTimeUp={onTimeUp ?? onFinish} /> : null}
        </div>
        <div className="xd-header__right">
          {revealAnswers && (
            <span className="xd-chip xd-chip--ok" title={t("examDesktop.correctCount", "To'g'ri javoblar")}>
              <IconCheck size={14} aria-hidden="true" /> {correct}
            </span>
          )}
          {revealAnswers && (
            <span
              className={`xd-chip xd-chip--bad${mistakesLeftDanger ? " is-danger" : ""}`}
              title={t("examDesktop.mistakes", "Xatolar")}
            >
              <IconX size={14} aria-hidden="true" /> {wrong}
              {maxMistakes != null ? ` / ${maxMistakes}` : ""}
            </span>
          )}
          <button
            type="button"
            className="xd-btn xd-btn--danger-ghost"
            onClick={clickFinish}
            onMouseDown={(e) => e.preventDefault()}
          >
            <IconFlag size={16} aria-hidden="true" />
            {finishLabel ?? t("examDesktop.finish", "Yakunlash")}
            <kbd className="xd-kbd">Esc</kbd>
          </button>
        </div>
      </header>

      {/* ── Split body ── */}
      <div className={`xd-split${hasImage ? "" : " xd-split--noimg"}`} ref={containerRef}>
        <section className="xd-center" aria-label={t("examDesktop.question", "Savol")}>
          <div className="xd-qhead">
            <span className="xd-qnum">{current + 1}</span>
            <p className="xd-qtext">{questionText}</p>
          </div>
          {hasImage && (
            <QuestionImage
              key={q.image_path!}
              path={q.image_path!}
              alt={questionText}
              onZoom={setZoomSrc}
              zoomHint={t("examDesktop.zoomOpen", "Kattalashtirish (Z)")}
              brokenLabel={t("examDesktop.imageUnavailable", "Rasm mavjud emas")}
            />
          )}
        </section>

        <div
          className="xd-splitter"
          role="separator"
          aria-orientation="vertical"
          title={t("examDesktop.resizeHint", "Kengligini o'zgartirish uchun suring (2× bosish — asl holat)")}
          {...splitterProps}
        />

        <aside className="xd-right">
          <div className="xd-answers" role="group" aria-label={t("examDesktop.answers", "Javoblar")}>
            {optionTexts.map((text, i) => (
              <AnswerCard
                key={i}
                index={i}
                text={text}
                state={cardStates[i]}
                disabled={!!answered}
                onPick={pick}
                correctLabel={correctLabel}
                wrongLabel={wrongLabel}
              />
            ))}
          </div>

          {confirmSelection && pending != null && !answered && (
            <button
              type="button"
              className="xd-btn xd-btn--primary xd-btn--block"
              onClick={() => {
                onSelect(pending);
                setPending(null);
              }}
            >
              {t("examDesktop.confirmAnswer", "Javobni tasdiqlash")} <kbd className="xd-kbd">↵</kbd>
            </button>
          )}

          {explanation && (
            <div className="xd-explain" role="note">
              <div className="xd-explain__title">
                <IconBulb size={16} aria-hidden="true" /> {t("examDesktop.explanation", "Izoh")}
              </div>
              <p className="xd-explain__text">{explanation}</p>
            </div>
          )}

          <div className="xd-actions">
            <button
              type="button"
              className="xd-btn"
              onClick={() => goto(current - 1)}
              onMouseDown={(e) => e.preventDefault()}
              disabled={current === 0}
            >
              <IconChevronLeft size={16} aria-hidden="true" /> {t("examDesktop.prev", "Oldingi")}{" "}
              <kbd className="xd-kbd">←</kbd>
            </button>
            <button
              type="button"
              className={`xd-btn${bookmarked ? " is-active" : ""}`}
              onClick={toggleBookmark}
              onMouseDown={(e) => e.preventDefault()}
              aria-pressed={bookmarked}
            >
              {bookmarked ? (
                <IconBookmarkFilled size={16} aria-hidden="true" />
              ) : (
                <IconBookmark size={16} aria-hidden="true" />
              )}
              {bookmarked ? t("examDesktop.bookmarked", "Belgilangan") : t("examDesktop.bookmark", "Belgilash")}{" "}
              <kbd className="xd-kbd">B</kbd>
            </button>
            {isLast ? (
              <button
                type="button"
                className="xd-btn xd-btn--primary"
                onClick={clickFinish}
                onMouseDown={(e) => e.preventDefault()}
              >
                {finishLabel ?? t("examDesktop.finish", "Yakunlash")} <IconCheck size={16} aria-hidden="true" />{" "}
                {/* i18n-ignore */}
                <kbd className="xd-kbd">Enter ↵</kbd>
              </button>
            ) : (
              <button
                type="button"
                className="xd-btn xd-btn--primary"
                onClick={() => goto(current + 1)}
                onMouseDown={(e) => e.preventDefault()}
              >
                {t("examDesktop.next", "Keyingi")} <IconChevronRight size={16} aria-hidden="true" />{" "}
                {/* i18n-ignore */}
                <kbd className="xd-kbd">Space ↵</kbd>
              </button>
            )}
          </div>

          {showNavigator && total > 1 && (
            <QuestionNavigator
              total={total}
              current={current}
              answers={answers}
              flagged={flaggedIdx}
              revealResults={revealAnswers}
              onGoto={goto}
              pageLabel={pageLabel}
              legend={navLegend}
            />
          )}

          <p className="xd-keys-hint" aria-hidden="true">
            <kbd className="xd-kbd">F1–F{Math.max(1, Math.min(options.length, MAX_KEYBOARD_OPTIONS))}</kbd>{" "}
            {t("examDesktop.hintAnswer", "javob")} · <kbd className="xd-kbd">← →</kbd>{" "}
            {t("examDesktop.hintNavigate", "savollar")} · <kbd className="xd-kbd">Z</kbd> {t("examDesktop.hintZoom", "rasm")}
          </p>
        </aside>
      </div>

      {zoomSrc && <ImageZoomViewer src={zoomSrc} alt={questionText} onClose={closeZoom} labels={zoomLabels} />}
      {dialogView && (
        <ConfirmDialog
          key={dialog ?? ""}
          title={dialogView.title}
          description={dialogView.description}
          actions={dialogView.actions}
          defaultFocusId="continue"
          onCancel={closeDialog}
        />
      )}
    </div>
  );
}

/** Shared split-view desktop exam UI (Real, Ticket, Marathon, Survival, WrongExam, Topic). */
export const ExamDesktopView = memo(ExamDesktopViewImpl);
export default ExamDesktopView;
