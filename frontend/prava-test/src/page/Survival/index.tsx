import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBlocker, useNavigate } from "react-router-dom";
import { Badge, Button, Group, Modal, Paper, Stack, Text, Title } from "@mantine/core";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBookmark,
  IconBookmarkFilled,
  IconCheck,
  IconFlame,
  IconHome2,
  IconRefresh,
  IconSteeringWheel,
  IconTrophy,
  IconX,
} from "@tabler/icons-react";
import { useAuth } from "../../auth/AuthContext";
import type { OfflineQuestion } from "../../types/desktop";
import {
  addWrongAnswer,
  getCachedTotalQuestions,
  getSavedQuestions,
  localizeExp,
  localizeOpt,
  localizeQ,
  parseOptions,
  recordQuestionAttempt,
  startMarathonSession,
  toggleSavedQuestion,
} from "../../services/desktopAdapter";
import ColorMode from "../../components/other/ColorMode";
import LanguagePicker from "../../components/language/LanguagePicker";
import ImageZoomModal, { ZoomableImage } from "../../components/common/ImageZoomModal";
import SEO from "../../components/common/SEO";
import { useExamHotkeys } from "../../hooks/useExamHotkeys";
import { errorKeyFor } from "../../types/errors";
import { reportError } from "../../utils/monitoring";
import { scopedUserId } from "../../utils/userScope";
import {
  applySurvivalAnswer,
  createSurvivalState,
  freshFromBatch,
  readSurvivalBest,
  shouldPrefetch,
  writeSurvivalBest,
  type BestStorage,
  type SurvivalState,
} from "./logic";
import { CenteredScreen, StatBox } from "./parts";

type Phase = "loading" | "error" | "empty" | "exam" | "result";
type MoreState = "idle" | "loading" | "error";

/** Bir so'rovda olinadigan savollar soni (marafon sessiyasi sifatida). */
const BATCH_SIZE = 100;
/** Ketma-ket shuncha partiyada yangi savol bo'lmasa — savollar bazasi tugagan deb hisoblanadi. */
const EMPTY_BATCHES_TO_EXHAUST = 2;
const ADVANCE_AFTER_CORRECT_MS = 800;
const RESULT_AFTER_WRONG_MS = 1600;

function getStorage(): BestStorage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

interface FailedInfo {
  question: OfflineQuestion;
  selected: number;
}

/**
 * "Xatogacha marafon" (Survival): tasodifiy savollar, vaqt cheklovisiz —
 * birinchi xatoda o'yin tugaydi. Joriy va eng yaxshi seriya ko'rsatiladi.
 *
 * Natija imtihon sifatida yuborilmaydi (submitExamSession/saveExamResult yo'q):
 * savollar 100 talik partiyalab olinadi va ularning ko'pchiligiga javob
 * berilmaydi — yuborilsa tarix/statistikada "yiqilgan marafon" yozuvlari paydo
 * bo'lardi. Har bir javob esa recordQuestionAttempt / addWrongAnswer orqali
 * qayd qilinadi (Marafon bilan bir xil).
 */
export default function Survival_Page() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = scopedUserId(user);

  const [phase, setPhase] = useState<Phase>("loading");
  const [loadError, setLoadError] = useState<unknown>(null);
  const [queue, setQueue] = useState<OfflineQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [run, setRun] = useState<SurvivalState>(() => createSurvivalState(readSurvivalBest(getStorage(), userId)));
  const [failed, setFailed] = useState<FailedInfo | null>(null);
  const [completedAll, setCompletedAll] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [moreState, setMoreState] = useState<MoreState>("idle");
  const [moreError, setMoreError] = useState<unknown>(null);
  const [giveUpOpen, setGiveUpOpen] = useState(false);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  /** Har start/qayta boshlashda oshadi — eski so'rov javoblari e'tiborsiz qoldiriladi. */
  const genRef = useRef(0);
  const seenRef = useRef<Set<number>>(new Set());
  const fetchingRef = useRef(false);
  const emptyBatchesRef = useRef(0);
  const runRef = useRef(run);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  /** Kutilayotgan so'rov javoblari va taymerlarni bekor qiladi (unmount). */
  const cancelPending = useCallback(() => {
    genRef.current++;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** Savollar partiyasini olib, yangilarini navbatga qo'shadi. Xatoda THROW qiladi. */
  const loadBatch = useCallback(async (gen: number): Promise<number | null> => {
    const { questions } = await startMarathonSession(undefined, BATCH_SIZE);
    if (gen !== genRef.current) return null;
    const fresh = freshFromBatch(Array.isArray(questions) ? questions : [], seenRef.current);
    for (const q of fresh) seenRef.current.add(q.id);
    if (fresh.length > 0) {
      emptyBatchesRef.current = 0;
      setQueue((prev) => [...prev, ...fresh]);
    } else {
      emptyBatchesRef.current += 1;
    }
    const total = getCachedTotalQuestions();
    if (emptyBatchesRef.current >= EMPTY_BATCHES_TO_EXHAUST || (total > 0 && seenRef.current.size >= total)) {
      setExhausted(true);
    }
    return fresh.length;
  }, []);

  const start = useCallback(async () => {
    const gen = ++genRef.current;
    clearTimer();
    seenRef.current = new Set();
    emptyBatchesRef.current = 0;
    fetchingRef.current = true;
    const fresh = createSurvivalState(readSurvivalBest(getStorage(), userId));
    runRef.current = fresh;
    setRun(fresh);
    setPhase("loading");
    setLoadError(null);
    setQueue([]);
    setCurrent(0);
    setSelected(null);
    setFailed(null);
    setCompletedAll(false);
    setExhausted(false);
    setMoreState("idle");
    setMoreError(null);
    setGiveUpOpen(false);
    try {
      const count = await loadBatch(gen);
      if (count === null) return;
      setPhase(count > 0 ? "exam" : "empty");
    } catch (err) {
      if (gen !== genRef.current) return;
      reportError("survival.start", err);
      setLoadError(err);
      setPhase("error");
    } finally {
      if (gen === genRef.current) fetchingRef.current = false;
    }
  }, [userId, loadBatch]);

  const fetchMore = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    const gen = genRef.current;
    setMoreState("loading");
    setMoreError(null);
    try {
      const count = await loadBatch(gen);
      if (count === null) return;
      setMoreState("idle");
    } catch (err) {
      if (gen !== genRef.current) return;
      reportError("survival.fetchMore", err);
      setMoreError(err);
      setMoreState("error");
    } finally {
      if (gen === genRef.current) fetchingRef.current = false;
    }
  }, [loadBatch]);

  // Boshlash (til o'zgarishi o'yinni qayta boshlamaydi — matnlar render paytida lokalizatsiya qilinadi).
  useEffect(() => {
    void start();
    return cancelPending;
  }, [start, cancelPending]);

  useEffect(() => {
    getSavedQuestions(userId)
      .then((entries) => {
        if (Array.isArray(entries)) {
          setSavedIds(new Set(entries.filter((e) => e?.question?.id != null).map((e) => e.question.id)));
        }
      })
      .catch((err) => reportError("survival.savedQuestions", err));
  }, [userId]);

  // Navbat tugashiga yaqin — keyingi partiyani oldindan yuklash.
  useEffect(() => {
    if (phase !== "exam" || moreState !== "idle") return;
    if (shouldPrefetch(current, queue.length, exhausted)) void fetchMore();
  }, [phase, moreState, current, queue.length, exhausted, fetchMore]);

  const finishRun = useCallback(() => {
    clearTimer();
    writeSurvivalBest(getStorage(), userId, runRef.current.best);
    setGiveUpOpen(false);
    setPhase("result");
  }, [userId]);

  // Barcha savollar tugadi va foydalanuvchi keyingisini kutyapti — g'alaba.
  useEffect(() => {
    if (phase === "exam" && exhausted && current >= queue.length && queue.length > 0) {
      setCompletedAll(true);
      finishRun();
    }
  }, [phase, exhausted, current, queue.length, finishRun]);

  const advance = useCallback(() => {
    clearTimer();
    if (runRef.current.ended) {
      finishRun();
      return;
    }
    setSelected(null);
    setCurrent((c) => c + 1);
  }, [finishRun]);

  const question: OfflineQuestion | undefined = phase === "exam" ? queue[current] : undefined;
  const options = question ? parseOptions(question.options_json) : [];

  const handleSelect = (optIdx: number) => {
    const q = question;
    if (!q || selected !== null || runRef.current.ended) return;
    if (optIdx < 0 || optIdx >= options.length) return;
    const ok = optIdx === q.correct_option;

    recordQuestionAttempt(userId, q.id, ok, "survival").catch((err) => reportError("survival.recordAttempt", err));
    if (!ok) addWrongAnswer(userId, q).catch((err) => reportError("survival.addWrongAnswer", err));

    const next = applySurvivalAnswer(runRef.current, ok);
    runRef.current = next;
    setRun(next);
    setSelected(optIdx);
    if (next.newRecord) writeSurvivalBest(getStorage(), userId, next.best);

    clearTimer();
    if (ok) {
      timerRef.current = setTimeout(advance, ADVANCE_AFTER_CORRECT_MS);
    } else {
      setFailed({ question: q, selected: optIdx });
      timerRef.current = setTimeout(finishRun, RESULT_AFTER_WRONG_MS);
    }
  };

  const handleToggleSave = (q: OfflineQuestion) => {
    toggleSavedQuestion(userId, q).catch((err) => reportError("survival.toggleSaved", err));
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(q.id)) next.delete(q.id);
      else next.add(q.id);
      return next;
    });
  };

  // Faol o'yin davomida sahifadan chiqishni tasdiqlash.
  const inRun = phase === "exam" && run.streak > 0 && !run.ended;
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => inRun && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!inRun) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [inRun]);

  const confirmOpen = giveUpOpen || blocker.state === "blocked";
  const closeConfirm = () => {
    if (blocker.state === "blocked") blocker.reset();
    setGiveUpOpen(false);
  };
  const confirmLeave = () => {
    if (blocker.state === "blocked") {
      clearTimer();
      writeSurvivalBest(getStorage(), userId, runRef.current.best);
      genRef.current++;
      blocker.proceed();
      return;
    }
    finishRun();
  };

  useExamHotkeys({
    enabled: phase === "exam",
    optionCount: options.length || undefined,
    blocked: confirmOpen || zoomSrc !== null,
    onSelect: handleSelect,
    onEnter: () => {
      if (selected !== null) advance();
    },
    onNext: () => {
      if (selected !== null) advance();
    },
  });

  const title = t("survival.title");

  // ─── LOADING ───
  if (phase === "loading") {
    return (
      <div className="loading-screen" role="status" aria-live="polite">
        <SEO title={title} description={t("survival.seoDesc")} canonical="/survival" noIndex />
        <div className="spinner" />
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  // ─── ERROR / EMPTY ───
  if (phase === "error" || phase === "empty") {
    const isError = phase === "error";
    return (
      <CenteredScreen>
        <SEO title={title} description={t("survival.seoDesc")} canonical="/survival" noIndex />
        <Paper withBorder radius="lg" p="lg" w="100%" maw={460}>
          <Stack gap="md" align="center" ta="center">
            <IconAlertTriangle size={40} color="var(--mantine-color-orange-6)" aria-hidden="true" />
            <Title order={2} size="h4">
              {isError ? t(errorKeyFor(loadError, "notification.startError")) : t("survival.empty")}
            </Title>
            {!isError && (
              <Text c="dimmed" size="sm">
                {t("survival.emptyDesc")}
              </Text>
            )}
            <Group justify="center" gap="sm" wrap="wrap">
              <Button variant="default" leftSection={<IconHome2 size={16} />} onClick={() => navigate("/me")}>
                {t("survival.backToDashboard")}
              </Button>
              <Button leftSection={<IconRefresh size={16} />} onClick={() => void start()}>
                {t("common.retry")}
              </Button>
            </Group>
          </Stack>
        </Paper>
      </CenteredScreen>
    );
  }

  // ─── RESULT ───
  if (phase === "result") {
    const fq = failed?.question ?? null;
    const fOpts = fq ? parseOptions(fq.options_json) : [];
    const correctOpt = fq ? fOpts[fq.correct_option] : undefined;
    const chosenOpt = fq && failed ? fOpts[failed.selected] : undefined;
    const exp = fq ? localizeExp(fq) : null;
    const allDone = completedAll && !run.ended;
    return (
      <CenteredScreen>
        <SEO title={title} description={t("survival.seoDesc")} canonical="/survival" noIndex />
        <Paper withBorder radius="lg" p={{ base: "md", sm: "xl" }} w="100%" maw={560} role="status">
          <Stack gap="md">
            <Group gap="xs" wrap="nowrap">
              <IconFlame size={28} color="var(--mantine-color-orange-6)" aria-hidden="true" />
              <Title order={2} size="h3" style={{ overflowWrap: "anywhere" }}>
                {allDone ? t("survival.allDone") : t("survival.over")}
              </Title>
            </Group>
            {run.newRecord && (
              <Badge size="lg" color="yellow" variant="light" leftSection={<IconTrophy size={14} />}>
                {t("survival.newRecord")}
              </Badge>
            )}
            <Group grow gap="sm">
              <StatBox value={run.streak} label={t("survival.streak")} />
              <StatBox value={run.best} label={t("survival.best")} />
            </Group>

            {fq && (
              <Paper withBorder radius="md" p="md" bg="var(--surface, transparent)">
                <Stack gap={8}>
                  <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                    {t("survival.failedOn")}
                  </Text>
                  <Text fw={600} style={{ overflowWrap: "anywhere" }}>
                    {localizeQ(fq)}
                  </Text>
                  {chosenOpt && (
                    <Text size="sm" c="red" style={{ overflowWrap: "anywhere" }}>
                      <IconX size={14} style={{ verticalAlign: "-2px" }} aria-hidden="true" />{" "}
                      {t("survival.yourAnswer")}: {localizeOpt(chosenOpt)}
                    </Text>
                  )}
                  {correctOpt && (
                    <Text size="sm" c="green" fw={600} style={{ overflowWrap: "anywhere" }}>
                      <IconCheck size={14} style={{ verticalAlign: "-2px" }} aria-hidden="true" />{" "}
                      {t("survival.correctAnswer")}: {localizeOpt(correctOpt)}
                    </Text>
                  )}
                  {exp && (
                    <Text size="sm" c="dimmed" style={{ overflowWrap: "anywhere", whiteSpace: "pre-line" }}>
                      <b>{t("survival.explanation")}:</b> {exp}
                    </Text>
                  )}
                </Stack>
              </Paper>
            )}

            <Group justify="flex-end" gap="sm" wrap="wrap">
              <Button variant="default" leftSection={<IconHome2 size={16} />} onClick={() => navigate("/me")}>
                {t("survival.backToDashboard")}
              </Button>
              <Button leftSection={<IconRefresh size={16} />} onClick={() => void start()} data-autofocus>
                {t("survival.retry")}
              </Button>
            </Group>
          </Stack>
        </Paper>
      </CenteredScreen>
    );
  }

  // ─── EXAM ───
  const answered = selected !== null;
  const confirmModal = (
    <Modal
      opened={confirmOpen}
      onClose={closeConfirm}
      centered
      size={420}
      zIndex={10000}
      title={<Text fw={800}>{t("survival.confirmTitle")}</Text>}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {t("survival.confirmDesc", { streak: run.streak })}
        </Text>
        <Group justify="flex-end" gap="sm" wrap="wrap">
          <Button variant="default" onClick={closeConfirm} data-autofocus>
            {t("survival.continue")}
          </Button>
          <Button color="red" onClick={confirmLeave}>
            {t("survival.giveUp")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );

  const topbar = (
    <div className="exam-topbar">
      <div className="exam-topbar-left">
        <button
          className="exam-finish-btn"
          type="button"
          onClick={() => {
            if (run.streak > 0 && !run.ended) setGiveUpOpen(true);
            else if (run.ended) finishRun();
            else navigate("/me");
          }}
        >
          {t("survival.giveUp")} <IconX size={15} />
        </button>
      </div>
      <div className="exam-topbar-center">
        <span className="exam-counter">{t("survival.questionNumber", { n: current + 1 })}</span>
      </div>
      <div className="exam-topbar-right">
        <span className="exam-score-chip green" title={t("survival.streak")} aria-label={`${t("survival.streak")}: ${run.streak}`}>
          <IconFlame size={13} aria-hidden="true" /> {run.streak}
        </span>
        <span className="exam-score-chip" title={t("survival.best")} aria-label={`${t("survival.best")}: ${run.best}`}>
          <IconTrophy size={13} aria-hidden="true" /> {run.best}
        </span>
        <ColorMode />
        <LanguagePicker />
      </div>
    </div>
  );

  // Navbatdagi savol hali yuklanmagan (keyingi partiya kutilmoqda yoki xato).
  if (!question) {
    return (
      <>
        <SEO title={title} description={t("survival.seoDesc")} canonical="/survival" noIndex />
        <div className="exam-screen">
          {topbar}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            {moreState === "error" ? (
              <Stack gap="sm" align="center" ta="center" maw={420}>
                <IconAlertTriangle size={32} color="var(--mantine-color-orange-6)" aria-hidden="true" />
                <Text fw={600}>{t(errorKeyFor(moreError, "common.loadError"))}</Text>
                <Button leftSection={<IconRefresh size={16} />} onClick={() => void fetchMore()}>
                  {t("common.retry")}
                </Button>
              </Stack>
            ) : (
              <Stack gap="sm" align="center" role="status" aria-live="polite">
                <div className="spinner" />
                <Text c="dimmed">{t("survival.loadingMore")}</Text>
              </Stack>
            )}
          </div>
        </div>
        {confirmModal}
      </>
    );
  }

  const isSaved = savedIds.has(question.id);

  return (
    <>
      <SEO title={title} description={t("survival.seoDesc")} canonical="/survival" noIndex />
      <div className="exam-screen">
        {topbar}

        <div className="exam-question-header">
          <p className="exam-question-text">{localizeQ(question)}</p>
          <button
            className={`exam-bookmark-btn${isSaved ? " saved" : ""}`}
            onClick={() => handleToggleSave(question)}
            aria-pressed={isSaved}
            aria-label={isSaved ? t("survival.bookmarkRemove") : t("survival.bookmarkAdd")}
            title={isSaved ? t("survival.bookmarkRemove") : t("survival.bookmarkAdd")}
            type="button"
          >
            {isSaved ? <IconBookmarkFilled size={18} /> : <IconBookmark size={18} />}
          </button>
        </div>

        <div className="exam-two-col">
          <div className="exam-col-options">
            {options.map((opt, idx) => {
              let cls = "exam-option";
              if (answered) {
                if (idx === question.correct_option) cls += " correct";
                else if (idx === selected) cls += " wrong";
              }
              return (
                <button
                  key={idx}
                  className={cls}
                  onClick={() => handleSelect(idx)}
                  disabled={answered}
                  type="button"
                >
                  <span className="exam-option-key">{idx + 1}</span>
                  <span className="exam-option-text">{localizeOpt(opt)}</span>
                  {answered && idx === question.correct_option && <IconCheck size={15} className="opt-icon correct" />}
                  {answered && idx === selected && idx !== question.correct_option && (
                    <IconX size={15} className="opt-icon wrong" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="exam-col-image">
            {question.image_path ? (
              <ZoomableImage path={question.image_path} className="exam-question-img" onOpen={(src) => setZoomSrc(src)} />
            ) : (
              <div className="exam-img-placeholder">
                <IconSteeringWheel size={52} stroke={1} color="var(--border)" />
                <span className="exam-placeholder-text">pravaonline.uz</span>
              </div>
            )}
          </div>
        </div>

        <ImageZoomModal src={zoomSrc} onClose={() => setZoomSrc(null)} />

        <div className="exam-bottom">
          <div className="exam-bottom-row" style={{ justifyContent: "space-between", gap: 8 }}>
            <Text size="xs" c="dimmed" visibleFrom="sm">
              {t("survival.hint")}
            </Text>
            <button
              className="exam-nav-btn primary"
              type="button"
              onClick={advance}
              disabled={!answered}
              style={{ marginLeft: "auto" }}
            >
              {run.ended ? t("survival.seeResult") : t("survival.next")} <IconArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
      {confirmModal}
    </>
  );
}

