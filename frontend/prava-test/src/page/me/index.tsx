import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { scopedUserId } from "../../utils/userScope";
import { reportError } from "../../utils/monitoring";
import { useCurriculumCounts } from "../../hooks/useCurriculumCounts";
import { useTranslation } from "react-i18next";
import SEO from "../../components/common/SEO";
import {
  getFullStats,
  getTopics,
  getExamHistory,
  getSavedQuestions,
} from "../../services/desktopAdapter";
import { storageService } from "../../services/storageService";
import { OFFICIAL_TOPICS } from "../../constants/topics";
import type {
  FullStats,
  OfflineTopic,
  ExamResult,
  SavedQuestionEntry,
} from "../../types/desktop";
import {
  useDashboard,
  WelcomeBanner,
  ProgressStats,
  LearningModesSection,
  AnalyticsToolsSection,
} from "../../components/dashboard";

/** Kunlik maqsad: yechilgan savollar soni (mahsulot sozlamasi, imtihon qoidasi emas). */
const DAILY_QUESTION_TARGET = 30;

interface MarathonActiveSession {
  questions: unknown[];
  current: number;
  answers: Record<number, unknown>;
  selTopic: number | null;
  countIdx: number;
  timestamp: number;
  sessionId?: number | null;
  /** Marafon tugash vaqti (ms, epoch). */
  deadline?: number;
}

function getActiveMarathonSession(userId: number): MarathonActiveSession | null {
  try {
    const raw = localStorage.getItem(`prava_marathon_active_session_${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.questions) && typeof parsed.current === "number") {
        return parsed;
      }
    }
  } catch {}
  return null;
}

/**
 * Calculate active consecutive streak days from exam history dates
 */
function calculateStreak(history: ExamResult[]): number {
  if (!Array.isArray(history) || history.length === 0) return 0;

  const dates = new Set<string>();
  for (const item of history) {
    const raw = item.created_at;
    if (raw) {
      dates.add(raw.slice(0, 10)); // YYYY-MM-DD
    }
  }

  if (dates.size === 0) return 0;

  const today = new Date();
  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    if (dates.has(dateStr)) {
      streak++;
    } else if (i === 0) {
      // If user hasn't finished an exam today yet, continue checking from yesterday
      continue;
    } else {
      break;
    }
  }

  return streak;
}

export default function User_Page() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { openExamPicker } = useDashboard();

  const [stats, setStats] = useState<FullStats | null>(null);
  const [topics, setTopics] = useState<OfflineTopic[]>([]);
  const [examHistory, setExamHistory] = useState<ExamResult[]>([]);
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestionEntry[]>([]);
  const [marathonSession, setMarathonSession] = useState<MarathonActiveSession | null>(null);

  const userId = scopedUserId(user);
  const counts = useCurriculumCounts();

  const loadData = useCallback(async () => {
    try {
      const [fullStats, topicList, history, savedList] = await Promise.all([
        getFullStats(userId).catch((err: unknown) => (reportError("me.fullStats", err), null)),
        getTopics().catch((err: unknown) => (reportError("me.topics", err), [])),
        getExamHistory(userId).catch((err: unknown) => (reportError("me.history", err), [])),
        getSavedQuestions(userId).catch((err: unknown) => (reportError("me.saved", err), [])),
      ]);

      if (fullStats) setStats(fullStats);
      if (Array.isArray(topicList)) setTopics(topicList);
      if (Array.isArray(history)) setExamHistory(history);
      if (Array.isArray(savedList)) setSavedQuestions(savedList);
      setMarathonSession(getActiveMarathonSession(userId));
    } catch (err) {
      reportError("me.load", err);
    }
  }, [userId]);

  useEffect(() => {
    loadData();

    // Re-fetch dynamically whenever tests are completed locally or synced
    const handleStorageChange = () => loadData();
    window.addEventListener("prava-storage-changed", handleStorageChange);
    return () => window.removeEventListener("prava-storage-changed", handleStorageChange);
  }, [loadData]);

  // Sanitized Dynamic User Name (Eliminates {{name}} template interpolation bugs)
  const rawName = (user?.fullName || user?.phoneNumber || "").trim();
  const cleanName = rawName.includes("{{") ? "" : rawName;
  const displayName = cleanName || t("dashboard.fallbackName");

  // Dynamic EdTech Metrics
  const readyQ = stats?.question_readiness?.ready ?? 0;
  const averageQ = stats?.question_readiness?.average ?? 0;
  const weakQ = stats?.question_readiness?.weak ?? 0;
  const qPracticed = readyQ + averageQ + weakQ;
  const qTotal = stats?.question_readiness?.total || counts.questions;
  const qPercent = qTotal > 0 ? Math.min(100, Math.round((qPracticed / qTotal) * 100)) : 0;

  // Overall Readiness Score
  const readinessPercent =
    qTotal > 0
      ? Math.min(100, Math.round(((readyQ * 1.0 + averageQ * 0.5) / qTotal) * 100))
      : 0;

  // Gamified Level Label
  const levelLabel = useMemo(() => {
    if (readinessPercent < 25) return t("dashboard.stats.levelBeginner");
    if (readinessPercent < 55) return t("dashboard.stats.levelIntermediate");
    if (readinessPercent < 85) return t("dashboard.stats.levelAdvanced");
    return t("dashboard.stats.levelReady");
  }, [readinessPercent, t]);

  // Dynamic Daily Target & Progress
  const dailyTarget = DAILY_QUESTION_TARGET;
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const todayQuestions = useMemo(() => {
    if (!Array.isArray(examHistory)) return 0;
    return examHistory
      .filter((e) => (e.created_at || "").slice(0, 10) === todayStr)
      .reduce((sum, e) => sum + (e.total_questions || 0), 0);
  }, [examHistory, todayStr]);

  const dailyDone = todayQuestions;
  const dailyPercent = Math.min(100, Math.round((dailyDone / dailyTarget) * 100));
  const streakDays = useMemo(() => calculateStreak(examHistory), [examHistory]);


  // Solved Tickets count (merging local ticket stats and server readiness)
  const ticketsSolvedCount = useMemo(() => {
    const localPassed = Object.values(storageService.getTicketStats()).filter(
      (t) => t.timesPassed > 0
    ).length;
    const serverReady = stats?.ticket_ready ?? 0;
    return Math.max(localPassed, serverReady);
  }, [stats?.ticket_ready]);

  // Topics learned count (mastered topics or >70% known)
  const topicsLearnedCount = useMemo(() => {
    if (!stats?.topic_readiness) return 0;
    return stats.topic_readiness.filter(
      (t) => t.mastered > 0 || (t.total > 0 && t.known / t.total >= 0.7)
    ).length;
  }, [stats?.topic_readiness]);

  // Last exam score
  const lastExamScore = useMemo(() => {
    if (Array.isArray(examHistory) && examHistory.length > 0) {
      return examHistory[0].score;
    }
    return null;
  }, [examHistory]);

  const savedCount = savedQuestions.length;
  const marathonCurrentIndex =
    marathonSession && marathonSession.current != null ? marathonSession.current + 1 : 0;

  return (
    <>
      <SEO
        title={`Prava Online - ${t("nav.home")}`}
        description={t(
          "dashboard.subtitle"
        )}
        canonical="/me"
        noIndex={true}
      />

      {/* 1. Welcome Section with quote and graphic */}
      <WelcomeBanner displayName={displayName} />

      {/* 2. Three Gamified Progress Cards */}
      <ProgressStats
        dailyDone={dailyDone}
        dailyTarget={dailyTarget}
        dailyPercent={dailyPercent}
        streakDays={streakDays}
        qPracticed={qPracticed}
        qTotal={qTotal}
        qPercent={qPercent}
        readinessPercent={readinessPercent}
        levelLabel={levelLabel}
        onNavigate={(route) => navigate(route)}
      />

      {/* 3. Four Learning Modes with live progress chips */}
      <LearningModesSection
        onOpenExamPicker={openExamPicker}
        totalTickets={counts.tickets}
        totalQuestions={qTotal}
        ticketsSolvedCount={ticketsSolvedCount}
        topicsLearnedCount={topicsLearnedCount}
        totalTopicsCount={topics.length || OFFICIAL_TOPICS.length}
        marathonCurrentIndex={marathonCurrentIndex}
        lastExamScore={lastExamScore}
      />

      {/* 4. Four Analytics & Personal Tools with live counters */}
      <AnalyticsToolsSection
        savedCount={savedCount}
        lastExamScore={lastExamScore}
      />
    </>
  );
}