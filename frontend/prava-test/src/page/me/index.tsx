import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useTranslation } from "react-i18next";
import SEO from "../../components/common/SEO";
import {
  IconRun,
  IconFlame,
  IconAlertTriangle,
  IconTicket,
  IconTargetArrow,
  IconTrophy,
} from "@tabler/icons-react";
import {
  getFullStats,
  getWrongAnswers,
  getTopics,
  getExamHistory,
  getSavedQuestions,
  getCachedTotalQuestions,
  getCachedTotalTickets,
} from "../../services/desktopAdapter";
import { storageService } from "../../services/storageService";
import ResumeExamCard from "../../components/dashboard/ResumeExamCard";
import { OFFICIAL_TOPICS, findOfficialTopic } from "../../constants/topics";
import type {
  FullStats,
  WrongAnswerEntry,
  OfflineTopic,
  ExamResult,
  SavedQuestionEntry,
} from "../../types/desktop";
import { useLanguage } from "../../context/LanguageContext";
import {
  useDashboard,
  WelcomeBanner,
  NextBestActionCard,
  type NextBestActionProps,
  ProgressStats,
  LearningModesSection,
  SmartRecommendationSection,
  AnalyticsToolsSection,
} from "../../components/dashboard";

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
  const { language, localizeTopic } = useLanguage();
  const { openExamPicker } = useDashboard();

  const [stats, setStats] = useState<FullStats | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswerEntry[]>([]);
  const [topics, setTopics] = useState<OfflineTopic[]>([]);
  const [examHistory, setExamHistory] = useState<ExamResult[]>([]);
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestionEntry[]>([]);
  const [marathonSession, setMarathonSession] = useState<MarathonActiveSession | null>(null);

  const userId = user?.id ? Number(user.id) : 1;

  const loadData = useCallback(async () => {
    try {
      const [fullStats, wrongs, topicList, history, savedList] = await Promise.all([
        getFullStats(userId).catch(() => null),
        getWrongAnswers(userId).catch(() => []),
        getTopics().catch(() => []),
        getExamHistory(userId).catch(() => []),
        getSavedQuestions(userId).catch(() => []),
      ]);

      if (fullStats) setStats(fullStats);
      if (Array.isArray(wrongs)) setWrongAnswers(wrongs);
      if (Array.isArray(topicList)) setTopics(topicList);
      if (Array.isArray(history)) setExamHistory(history);
      if (Array.isArray(savedList)) setSavedQuestions(savedList);
      setMarathonSession(getActiveMarathonSession(userId));
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
  const qTotal = stats?.question_readiness?.total || getCachedTotalQuestions();
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
        const found = topicList.find((tp) => tp.id === tid) || findOfficialTopic(tid);
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

  // Deterministic Next Best Action Decision Engine (P1 -> P6)
  const nextBestAction: NextBestActionProps = useMemo(() => {
    // P1: Unfinished active Marathon session
    if (
      marathonSession &&
      Array.isArray(marathonSession.questions) &&
      marathonSession.questions.length > 0 &&
      marathonSession.current < marathonSession.questions.length
    ) {
      const curNum = marathonSession.current + 1;
      const totalNum = marathonSession.questions.length;
      return {
        badgeText: t("dashboard.nba.badgeContinue", "DAVOM ETTIRISH"),
        badgeBg: "rgba(139, 92, 246, 0.15)",
        badgeColor: "#7c3aed",
        title: t("dashboard.nba.marathonResumeTitle", "Marafonni to'xtatilgan joyidan davom eting"),
        subtitle: t(
          "dashboard.nba.marathonResumeDesc",
          "Siz {{total}} ta savoldan {{current}}-savolgacha yetib kelgansiz. To'xtab qolmang!",
          { current: curNum, total: totalNum }
        ),
        statPill: {
          icon: <IconRun size={14} />,
          text: `${curNum} / ${totalNum}`,
        },
        btnText: t("dashboard.nba.resumeBtn", "Davom ettirish →"),
        btnBg: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
        iconBoxBg: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)",
        icon: <IconRun size={26} stroke={2} />,
        onAction: () => navigate("/marafon"),
      };
    }

    // P2: Unresolved mistakes
    if (totalWrongs > 0) {
      return {
        badgeText: t("dashboard.nba.badgeFixMistakes", "XATOLARNI TUZATISH"),
        badgeBg: "rgba(239, 68, 68, 0.14)",
        badgeColor: "#dc2626",
        title: t("dashboard.nba.mistakesTitle", "Xatolar ustida ishlash tavsiya etiladi"),
        subtitle: t(
          "dashboard.nba.mistakesDesc",
          "Sizda {{count}} ta xato ishlangan savol to'planib qolgan. Ularni qayta ishlab mustahkamlang.",
          { count: totalWrongs }
        ),
        statPill: {
          icon: <IconFlame size={14} />,
          text: t("dashboard.nba.mistakesCount", {
            count: totalWrongs,
            defaultValue: `${totalWrongs} ta xato`,
          }),
        },
        btnText: t("dashboard.nba.fixMistakesBtn", "Xatolarni bartaraf etish →"),
        btnBg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        iconBoxBg: "linear-gradient(135deg, #f87171 0%, #dc2626 100%)",
        icon: <IconFlame size={26} stroke={2} />,
        onAction: () => navigate("/wrong-exam"),
      };
    }

    // P3: Severe weak topic identified (wrongCount >= 2)
    if (currentWeakTopics.length > 0 && currentWeakTopics[0].wrongCount >= 2) {
      const topWeak = currentWeakTopics[0];
      return {
        badgeText: t("dashboard.nba.badgeWeakTopic", "ZAIF MAVZU"),
        badgeBg: "rgba(245, 158, 11, 0.15)",
        badgeColor: "#d97706",
        title: t("dashboard.nba.weakTopicTitle", "Eng zaif mavzu: {{topic}}", {
          topic: topWeak.name,
        }),
        subtitle: t(
          "dashboard.nba.weakTopicDesc",
          "Ushbu mavzuda {{count}} ta xato qayd etildi. Imtihondan oldin bu mavzuni takrorlang.",
          { count: topWeak.wrongCount }
        ),
        statPill: {
          icon: <IconAlertTriangle size={14} />,
          text: t("dashboard.nba.mistakesCount", {
            count: topWeak.wrongCount,
            defaultValue: `${topWeak.wrongCount} ta xato`,
          }),
        },
        btnText: t("dashboard.nba.practiceTopicBtn", "Mavzuni kuchaytirish →"),
        btnBg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        iconBoxBg: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
        icon: <IconAlertTriangle size={26} stroke={2} />,
        onAction: () => navigate(`/marafon?topicId=${topWeak.id}`),
      };
    }

    // P4: Sequential ticket progression
    const totalTickets = getCachedTotalTickets() || 63;
    const nextTicketNum = Math.min(totalTickets, ticketsSolvedCount + 1);
    if (ticketsSolvedCount > 0 && nextTicketNum <= totalTickets) {
      return {
        badgeText: t("dashboard.nba.badgeNextTicket", "NAVBATDAGI BILET"),
        badgeBg: "rgba(16, 185, 129, 0.14)",
        badgeColor: "#059669",
        title: t("dashboard.nba.nextTicketTitle", "{{ticketNumber}}-biletni yechishga tayyormisiz?", {
          ticketNumber: nextTicketNum,
        }),
        subtitle: t(
          "dashboard.nba.nextTicketDesc",
          "Biletlarni tartib bilan yechish imtihon formatiga to'liq ko'nikish beradi."
        ),
        statPill: {
          icon: <IconTicket size={14} />,
          text: `${nextTicketNum} / ${totalTickets}`,
        },
        btnText: t("dashboard.nba.startTicketBtn", "Biletni boshlash →"),
        btnBg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        iconBoxBg: "linear-gradient(135deg, #34d399 0%, #059669 100%)",
        icon: <IconTicket size={26} stroke={2} />,
        onAction: () => navigate(`/tickets/${nextTicketNum}`),
      };
    }

    // P5: New User (0 tests practiced)
    if (qPracticed === 0) {
      return {
        badgeText: t("dashboard.nba.badgeDiagnostic", "DIAGNOSTIKA"),
        badgeBg: "rgba(2, 132, 199, 0.14)",
        badgeColor: "#0284c7",
        title: t("dashboard.nba.diagnosticTitle", "Bilim darajangizni aniqlash uchun sinov testi"),
        subtitle: t(
          "dashboard.nba.diagnosticDesc",
          "20 ta savoldan iborat boshlang'ich test orqali kuchli va zaif tomonlaringizni aniqlang."
        ),
        statPill: {
          icon: <IconTargetArrow size={14} />,
          text: t("dashboard.nba.questionsCount", { count: 20, defaultValue: "20 ta savol" }),
        },
        btnText: t("dashboard.nba.startDiagnosticBtn", "Diagnostik testni boshlash →"),
        btnBg: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
        iconBoxBg: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
        icon: <IconTargetArrow size={26} stroke={2} />,
        onAction: () => openExamPicker(),
      };
    }

    // P6: Exam Ready / High Mastery
    return {
      badgeText: t("dashboard.nba.badgeExamReady", "RASMIY IMTIHON"),
      badgeBg: "rgba(99, 102, 241, 0.15)",
      badgeColor: "#4f46e5",
      title: t("dashboard.nba.examReadyTitle", "Bilimingiz mustahkam! Davlat imtihonida sinang"),
      subtitle: t(
        "dashboard.nba.examReadyDesc",
        "Tayyorgarlik darajangiz yuqori ({{readiness}}%). Vaqt chegaralangan DTM simulyatorida kuchingizni sinab ko'ring.",
        { readiness: readinessPercent }
      ),
      statPill: {
        icon: <IconTrophy size={14} />,
        text: t("dashboard.nba.readyPct", {
          pct: readinessPercent,
          defaultValue: `${readinessPercent}% tayyor`,
        }),
      },
      btnText: t("dashboard.nba.startExamSimBtn", "Davlat imtihoni simulyatori →"),
      btnBg: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
      iconBoxBg: "linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)",
      icon: <IconTrophy size={26} stroke={2} />,
      onAction: () => openExamPicker(),
    };
  }, [
    marathonSession,
    totalWrongs,
    currentWeakTopics,
    ticketsSolvedCount,
    qPracticed,
    readinessPercent,
    t,
    navigate,
    openExamPicker,
  ]);

  return (
    <>
      <SEO
        title={`Prava Online - ${t("nav.home", "Bosh sahifa")}`}
        description={t(
          "dashboard.subtitle",
          "Haydovchilik imtihoniga tayyorlanishda davom eting. Maqsad yaqin!"
        )}
        canonical="/me"
        noIndex={true}
      />

      {/* 1. Welcome Section with quote and graphic */}
      <WelcomeBanner displayName={displayName} />

      {/* 2. [P0] Next Best Action Hero Card (Deterministic Pedagogical Next Step) */}
      {/* 1.5 Tugallanmagan imtihon (lokal marafon yoki server faol sessiyasi) */}
      <ResumeExamCard marathonSession={marathonSession} />

      <NextBestActionCard {...nextBestAction} />

      {/* 3. Three Gamified Progress Cards */}
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

      {/* 4. Four Learning Modes with live progress chips */}
      <LearningModesSection
        onOpenExamPicker={openExamPicker}
        totalTickets={getCachedTotalTickets()}
        totalQuestions={qTotal}
        ticketsSolvedCount={ticketsSolvedCount}
        topicsLearnedCount={topicsLearnedCount}
        totalTopicsCount={topics.length || 44}
        marathonCurrentIndex={marathonCurrentIndex}
        lastExamScore={lastExamScore}
      />

      {/* 5. Smart Recommendation & Weak Topics (Honest empty state / Mastery / Weak list) */}
      <SmartRecommendationSection
        weakTopics={currentWeakTopics}
        totalWrongs={totalWrongs}
        practicedCount={qPracticed}
      />

      {/* 6. Four Analytics & Personal Tools with live counters */}
      <AnalyticsToolsSection
        savedCount={savedCount}
        lastExamScore={lastExamScore}
      />
    </>
  );
}