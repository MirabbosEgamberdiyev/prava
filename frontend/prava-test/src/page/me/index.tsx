import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useTranslation } from "react-i18next";
import SEO from "../../components/common/SEO";
import {
  getFullStats,
  getWrongAnswers,
  getTopics,
  getExamHistory,
} from "../../services/desktopAdapter";
import { OFFICIAL_TOPICS, OFFICIAL_TOPIC_MAP } from "../../constants/topics";
import type {
  FullStats,
  WrongAnswerEntry,
  OfflineTopic,
  ExamResult,
} from "../../types/desktop";
import { useLanguage } from "../../context/LanguageContext";
import {
  useDashboard,
  WelcomeBanner,
  ProgressStats,
  LearningModesSection,
  SmartRecommendationSection,
  AnalyticsToolsSection,
} from "../../components/dashboard";

/**
 * Calculate active consecutive streak days from exam history dates
 */
function calculateStreak(history: ExamResult[]): number {
  if (!Array.isArray(history) || history.length === 0) return 1;

  const dates = new Set<string>();
  for (const item of history) {
    const raw = item.created_at;
    if (raw) {
      dates.add(raw.slice(0, 10)); // YYYY-MM-DD
    }
  }

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

  return Math.max(1, streak);
}

export default function User_Page() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { language, localizeTopic } = useLanguage();
  const { openExamPicker } = useDashboard();

  const [stats, setStats] = useState<FullStats | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswerEntry[]>([]);
  const [topics, setTopics] = useState<OfflineTopic[]>([]);
  const [examHistory, setExamHistory] = useState<ExamResult[]>([]);

  const userId = user?.id ? Number(user.id) : 1;

  const loadData = useCallback(async () => {
    try {
      const [fullStats, wrongs, topicList, history] = await Promise.all([
        getFullStats(userId).catch(() => null),
        getWrongAnswers(userId).catch(() => []),
        getTopics().catch(() => []),
        getExamHistory(userId).catch(() => []),
      ]);

      if (fullStats) setStats(fullStats);
      if (Array.isArray(wrongs)) setWrongAnswers(wrongs);
      if (Array.isArray(topicList)) setTopics(topicList);
      if (Array.isArray(history)) setExamHistory(history);
    } catch {
      // keep fallback
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
  const displayName = cleanName || t("dashboard.fallbackName", "Hurmatli haydovchi");

  // Dynamic EdTech Metrics
  const readyQ = stats?.question_readiness?.ready ?? 0;
  const averageQ = stats?.question_readiness?.average ?? 0;
  const weakQ = stats?.question_readiness?.weak ?? 0;
  const qPracticed = readyQ + averageQ + weakQ;
  const qTotal = stats?.question_readiness?.total || 1190;
  const qPercent = qTotal > 0 ? Math.min(100, Math.round((qPracticed / qTotal) * 100)) : 0;

  // Overall Readiness Score
  const readinessPercent =
    qTotal > 0
      ? Math.min(100, Math.round(((readyQ * 1.0 + averageQ * 0.5) / qTotal) * 100))
      : 0;

  // Gamified Level Label
  const levelLabel = useMemo(() => {
    if (readinessPercent < 25) return t("dashboard.stats.levelBeginner", "Boshlang'ich");
    if (readinessPercent < 55) return t("dashboard.stats.levelIntermediate", "O'rta");
    if (readinessPercent < 85) return t("dashboard.stats.levelAdvanced", "Yuqori");
    return t("dashboard.stats.levelReady", "Tayyor");
  }, [readinessPercent, t]);

  // Dynamic Daily Target & Progress
  const dailyTarget = 30;
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const todayQuestions = useMemo(() => {
    if (!Array.isArray(examHistory)) return 0;
    return examHistory
      .filter((e) => (e.created_at || "").slice(0, 10) === todayStr)
      .reduce((sum, e) => sum + (e.total_questions || 20), 0);
  }, [examHistory, todayStr]);

  const dailyDone = todayQuestions;
  const dailyPercent = Math.min(100, Math.round((dailyDone / dailyTarget) * 100));
  const streakDays = useMemo(() => calculateStreak(examHistory), [examHistory]);

  // Dynamic Weak Topics Aggregated from Real Mistakes
  const validWrongs = useMemo(() => {
    return Array.isArray(wrongAnswers) ? wrongAnswers.filter((w) => w && w.question) : [];
  }, [wrongAnswers]);

  const totalWrongs = validWrongs.length;

  const currentWeakTopics = useMemo(() => {
    const topicCountMap: Record<number, number> = {};
    for (const entry of validWrongs) {
      const tid = entry.question?.topic_id;
      if (tid != null) {
        topicCountMap[tid] = (topicCountMap[tid] || 0) + 1;
      }
    }

    const topicList = Array.isArray(topics) && topics.length > 0 ? topics : OFFICIAL_TOPICS;
    return Object.entries(topicCountMap)
      .map(([tidStr, count]) => {
        const tid = Number(tidStr);
        const found = topicList.find((tp) => tp.id === tid) || OFFICIAL_TOPIC_MAP[tid];
        const rawFallback =
          language === "ru"
            ? `Тема #${tid}`
            : language === "uzc"
            ? `Мавзу #${tid}`
            : `Mavzu #${tid}`;
        return {
          id: tid,
          name: found ? localizeTopic(found) : rawFallback,
          wrongCount: count,
        };
      })
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .slice(0, 5);
  }, [validWrongs, topics, language, localizeTopic]);

  return (
    <>
      <SEO
        title={`Prava Online - ${t("nav.home", "Bosh sahifa")}`}
        description={t("dashboard.subtitle", "Haydovchilik imtihoniga tayyorlanishda davom eting. Maqsad yaqin!")}
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

      {/* 3. Four Learning Modes (Mavzular, Biletlar, Marafon, Haqiqiy imtihon) */}
      <LearningModesSection onOpenExamPicker={openExamPicker} />

      {/* 4. Smart Recommendation & Weak Topics (5 items + Error card + Goal card) */}
      <SmartRecommendationSection
        weakTopics={currentWeakTopics}
        totalWrongs={totalWrongs}
      />

      {/* 5. Four Analytics & Personal Tools (Saqlanganlar, Statistika, Reyting, Tarix) */}
      <AnalyticsToolsSection />
    </>
  );
}