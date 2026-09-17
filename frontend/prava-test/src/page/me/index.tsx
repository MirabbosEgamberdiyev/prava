import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useTranslation } from "react-i18next";
import ColorMode from "../../components/other/ColorMode";
import LanguagePicker from "../../components/language/LanguagePicker";
import SEO from "../../components/common/SEO";
import {
  getFullStats,
  getWrongAnswers,
  getTopics,
  getExamHistory,
  localizeTopic,
} from "../../services/desktopAdapter";
import type {
  FullStats,
  AppScreen,
  WrongAnswerEntry,
  OfflineTopic,
  ExamResult,
} from "../../types/desktop";
import { QRCodeSVG } from "../../components/common/QRCodeSVG";
import { Menu } from "@mantine/core";
import {
  IconBook2,
  IconPencil,
  IconRun,
  IconChartBar,
  IconLogout,
  IconTicket,
  IconBrandInstagram,
  IconBrandTelegram,
  IconBrandYoutube,
  IconAlertTriangle,
  IconBookmark,
  IconTargetArrow,
  IconTrophy,
  IconHistory,
  IconSettings,
  IconChevronDown,
  IconKey,
  IconFlame,
  IconArrowRight,
  IconCheck,
  IconSparkles,
} from "@tabler/icons-react";

import { useLanguage } from "../../context/LanguageContext";

const SOCIAL_LINKS = [
  {
    label: "Telegram",
    handle: "@pravaonlineuz",
    url: "https://t.me/pravaonlineuz",
    icon: IconBrandTelegram,
    gradient: "linear-gradient(135deg,#48cae4,#0096c7)",
    color: "#0088cc",
  },
  {
    label: "Instagram",
    handle: "@pravaonlineuz",
    url: "https://www.instagram.com/pravaonlineuz/",
    icon: IconBrandInstagram,
    gradient: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
    color: "#e1306c",
  },
  {
    label: "YouTube",
    handle: "@pravaonlineuz",
    url: "https://www.youtube.com/@pravaonlineuz",
    icon: IconBrandYoutube,
    gradient: "linear-gradient(135deg,#ff6b6b,#cc0000)",
    color: "#ff0000",
  },
];

const COLORS = [
  "#0284c7", "#0ea5e9", "#06b6d4", "#3b82f6",
  "#6366f1", "#8b5cf6", "#10b981", "#f59e0b",
];

function getColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

function getInitials(name: string) {
  const parts = (name || "").trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  return (name?.charAt(0) || "U").toUpperCase();
}

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

const EXAM_OPTIONS = [20, 40, 50, 60, 80, 100];

export default function User_Page() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  useLanguage();

  const [qrModal, setQrModal] = useState<typeof SOCIAL_LINKS[0] | null>(null);
  const [showExamPicker, setShowExamPicker] = useState(false);
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

  // Verified Dynamic EdTech Metrics
  const readyQ = stats?.question_readiness?.ready ?? 0;
  const averageQ = stats?.question_readiness?.average ?? 0;
  const weakQ = stats?.question_readiness?.weak ?? 0;
  const qPracticed = readyQ + averageQ + weakQ;
  const qTotal = stats?.question_readiness?.total || 1190;
  const qPercent = qTotal > 0 ? Math.min(100, Math.round((qPracticed / qTotal) * 100)) : 0;

  // Overall Readiness Score
  const readinessPercent = qTotal > 0
    ? Math.min(100, Math.round(((readyQ * 1.0 + averageQ * 0.5) / qTotal) * 100))
    : 0;

  // Gamified Level Label
  const levelLabel = useMemo(() => {
    if (readinessPercent < 25) return t("dashboard.beginnerLevel", "Boshlang'ich");
    if (readinessPercent < 55) return t("dashboard.intermediateLevel", "O'rta");
    if (readinessPercent < 85) return t("dashboard.advancedLevel", "Yuqori");
    return t("dashboard.readyLevel", "Tayyor");
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

  const dailyDone = todayQuestions > 0 ? todayQuestions : (qPracticed > 0 ? Math.min(dailyTarget, qPracticed) : 0);
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

    const topicList = Array.isArray(topics) ? topics : [];
    return Object.entries(topicCountMap)
      .map(([tidStr, count]) => {
        const tid = Number(tidStr);
        const found = topicList.find((tp) => tp.id === tid);
        return {
          id: tid,
          name: found ? localizeTopic(found) : `Mavzu #${tid}`,
          wrongCount: count,
        };
      })
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .slice(0, 4);
  }, [validWrongs, topics]);

  const handleNav = (screen: AppScreen) => {
    switch (screen) {
      case "exam":
        setShowExamPicker(true);
        break;
      case "topics":
        navigate("/topics");
        break;
      case "biletlar":
        navigate("/tickets");
        break;
      case "marathon":
        navigate("/marafon");
        break;
      case "stats":
        navigate("/statistics");
        break;
      case "wrong-answers":
        navigate("/wrong-answers");
        break;
      case "saved-questions":
        navigate("/saved-questions");
        break;
      case "leaderboard":
        navigate("/leaderboard");
        break;
      case "history":
        navigate("/history");
        break;
      default:
        break;
    }
  };

  const handleStartExam = (count: number) => {
    setShowExamPicker(false);
    navigate(`/exam?count=${count}`);
  };

  const primaryModes = [
    {
      screen: "topics" as AppScreen,
      title: t("dashboard.modes.topics.title", "Mavzular"),
      desc: t("dashboard.modes.topics.desc", "Nazariya va qoidalar bo'yicha bosqichma-bosqich o'rganish"),
      icon: IconBook2,
      accentColor: "#0284c7",
      gradient: "linear-gradient(135deg,#38bdf8,#0284c7)",
      recommended: readinessPercent < 35 || qPracticed < 100,
      isMarathon: false,
    },
    {
      screen: "biletlar" as AppScreen,
      title: t("dashboard.modes.tickets.title", "Biletlar"),
      desc: t("dashboard.modes.tickets.desc", "1-dan 60-gacha rasmiy biletlar bilan mustahkamlash"),
      icon: IconTicket,
      accentColor: "#0c8599",
      gradient: "linear-gradient(135deg,#38d9a9,#0c8599)",
      recommended: false,
      isMarathon: false,
    },
    {
      screen: "marathon" as AppScreen,
      title: t("dashboard.modes.marathon.title", "Marafon"),
      desc: t("dashboard.modes.marathon.desc", "Barcha 1190 ta savol ketma-ket, to'xtovsiz rejimda"),
      icon: IconRun,
      accentColor: "#8b5cf6",
      gradient: "linear-gradient(135deg,#a78bfa,#8b5cf6)",
      recommended: false,
      isMarathon: true,
    },
    {
      screen: "exam" as AppScreen,
      title: t("dashboard.modes.exam.title", "Haqiqiy Imtihon"),
      desc: t("dashboard.modes.exam.desc", "Vaqt chegaralangan rasmiy DTM test simulyatori"),
      icon: IconPencil,
      accentColor: "#f59f00",
      gradient: "linear-gradient(135deg,#ffa94d,#e67700)",
      recommended: false,
      isMarathon: false,
    },
  ];

  const secondaryTools = [
    {
      screen: "saved-questions" as AppScreen,
      title: t("dashboard.tools.saved.title", "Saqlanganlar"),
      desc: t("dashboard.tools.saved.desc", "Xatcho'p qo'yilgan savollar"),
      icon: IconBookmark,
      gradient: "linear-gradient(135deg,#38bdf8,#0284c7)",
    },
    {
      screen: "stats" as AppScreen,
      title: t("dashboard.tools.stats.title", "Statistika"),
      desc: t("dashboard.tools.stats.desc", "Batafsil o'rganish statistikasi"),
      icon: IconChartBar,
      gradient: "linear-gradient(135deg,#38d9a9,#0c8599)",
    },
    {
      screen: "leaderboard" as AppScreen,
      title: t("dashboard.tools.rating.title", "Reyting"),
      desc: t("dashboard.tools.rating.desc", "O'quvchilar reytingidagi o'rin"),
      icon: IconTrophy,
      gradient: "linear-gradient(135deg,#a78bfa,#8b5cf6)",
    },
    {
      screen: "history" as AppScreen,
      title: t("dashboard.tools.history.title", "Imtihon tarixi"),
      desc: t("dashboard.tools.history.desc", "Avvalgi sinov urinishlari tarixi"),
      icon: IconHistory,
      gradient: "linear-gradient(135deg,#ffa94d,#f59f00)",
    },
  ];

  return (
    <>
      <SEO
        title={`Prava Online - ${t("dashboard.mainModesTitle", "Asosiy ta'lim rejimlari")}`}
        description={t("dashboard.subtitle", "Haydovchilik imtihoniga tayyorlanishda davom eting")}
        canonical="/me"
        noIndex={true}
      />

      <div className="home-screen">
        {/* ================= 1. HEADER ================= */}
        <header className="home-header">
          <div className="home-header-inner">
            {/* Brand Logo */}
            <div
              className="home-header-logo"
              style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
              onClick={() => navigate("/me")}
            >
              <img
                src="/logo.png"
                width={34}
                height={34}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/logo.svg";
                }}
                alt="Prava"
              />
              <span className="home-header-brand">
                PRAVA<span className="brand-accent">ONLINE</span>
              </span>
            </div>

            {/* Right Zone Controls: Language Switcher, Theme Toggle, User Profile */}
            <div className="home-header-right">
              {/* Language Dropdown Selector */}
              <LanguagePicker />

              {/* Dark / Light Mode Switch */}
              <ColorMode />

              <div className="navbar-divider" aria-hidden="true" />

              {/* User Dropdown */}
              <Menu withinPortal shadow="md" width={220} position="bottom-end" radius="md">
                <Menu.Target>
                  <button
                    className="user-switcher"
                    type="button"
                    aria-label={displayName}
                  >
                    <div
                      className="user-switcher-avatar"
                      style={{ background: getColor(displayName) }}
                    >
                      {getInitials(displayName)}
                    </div>
                    <span className="user-switcher-name">{displayName}</span>
                    <IconChevronDown size={14} stroke={2} style={{ opacity: 0.6 }} />
                  </button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>{displayName}</Menu.Label>
                  <Menu.Item
                    leftSection={<IconSettings size={16} />}
                    onClick={() => navigate("/settings")}
                  >
                    {t("nav.settings", "Sozlamalar")}
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconHistory size={16} />}
                    onClick={() => navigate("/history")}
                  >
                    {t("dashboard.tools.history.title", "Imtihon tarixi")}
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconTrophy size={16} />}
                    onClick={() => navigate("/leaderboard")}
                  >
                    {t("dashboard.tools.rating.title", "Reyting")}
                  </Menu.Item>
                  {(user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") && (
                    <Menu.Item
                      leftSection={<IconKey size={16} />}
                      onClick={() => navigate("/admin/activation-codes")}
                    >
                      {t("nav.activationCodes", "Aktivatsiya kodlari")}
                    </Menu.Item>
                  )}
                  <Menu.Divider />
                  <Menu.Item
                    color="red"
                    leftSection={<IconLogout size={16} />}
                    onClick={logout}
                  >
                    {t("auth.logout", "Chiqish")}
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </div>
          </div>
        </header>

        {/* ================= MAIN CONTENT ================= */}
        <main className="home-content">
          <div className="home-inner">
            {/* 1. Greeting Section */}
            <div className="home-welcome">
              <h2>
                {t("dashboard.greeting", "Xush kelibsiz")},{" "}
                <span style={{ color: "#38bdf8" }}>{displayName}</span>!
              </h2>
              <p>{t("dashboard.subtitle", "Haydovchilik imtihoniga tayyorlanishda davom eting")}</p>
            </div>

            {/* 2. Three Gamified Metrics Bar */}
            <section className="home-stats-bar" aria-label={t("dashboard.metricsAria", "Metrikalar")}>
              {/* Metric 1: Daily Goal & Streak */}
              <article
                className="home-stat"
                onClick={() => handleNav("stats")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleNav("stats")}
              >
                <div className="home-stat-top">
                  <div
                    className="home-stat-icon"
                    style={{ background: "linear-gradient(135deg,#ff922b,#f76707)" }}
                  >
                    <IconFlame size={22} color="#fff" />
                  </div>
                  <div>
                    <div className="home-stat-value">
                      {dailyDone} / {dailyTarget}
                    </div>
                    <div className="home-stat-label">
                      {t("dashboard.dailyGoal", "Kunlik reja")} ({t("dashboard.questionsUnit", "savol")})
                    </div>
                  </div>
                  <span className="home-stat-pct" style={{ color: "#f76707" }}>
                    {dailyPercent}%
                  </span>
                </div>
                <div className="home-stat-bar">
                  <div
                    style={{
                      width: `${dailyPercent}%`,
                      background: "#f76707",
                      height: "100%",
                      borderRadius: "4px",
                      transition: "width .5s ease",
                    }}
                  />
                </div>
                <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#f76707" }}>
                  🔥 {t("dashboard.activeStreak", { count: streakDays })}
                </div>
              </article>

              {/* Metric 2: Solved Questions */}
              <article
                className="home-stat"
                onClick={() => handleNav("stats")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleNav("stats")}
              >
                <div className="home-stat-top">
                  <div
                    className="home-stat-icon"
                    style={{ background: "linear-gradient(135deg,#38bdf8,#0284c7)" }}
                  >
                    <IconCheck size={22} color="#fff" stroke={2.5} />
                  </div>
                  <div>
                    <div className="home-stat-value">
                      {qPracticed} / {qTotal} {t("dashboard.totalUnit", "ta")}
                    </div>
                    <div className="home-stat-label">
                      {t("dashboard.questionsSolved", "Yechilgan savollar")}
                    </div>
                  </div>
                  <span className="home-stat-pct" style={{ color: "#0284c7" }}>
                    {qPercent}%
                  </span>
                </div>
                <div className="home-stat-bar">
                  <div
                    style={{
                      width: `${qPercent}%`,
                      background: "#0284c7",
                      height: "100%",
                      borderRadius: "4px",
                      transition: "width .5s ease",
                    }}
                  />
                </div>
                <div style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)" }}>
                  {t("dashboard.totalQuestionsInDb", { total: qTotal })}
                </div>
              </article>

              {/* Metric 3: Overall Readiness */}
              <article
                className="home-stat"
                onClick={() => handleNav("stats")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleNav("stats")}
              >
                <div className="home-stat-top">
                  <div
                    className="home-stat-icon"
                    style={{ background: "linear-gradient(135deg,#38d9a9,#0c8599)" }}
                  >
                    <IconTargetArrow size={22} color="#fff" stroke={2.2} />
                  </div>
                  <div>
                    <div className="home-stat-value">
                      {readinessPercent}%
                    </div>
                    <div className="home-stat-label">
                      {t("dashboard.overallReadiness", "Umumiy tayyorgarlik")}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 800,
                      color: "#0c8599",
                      background: "rgba(12, 133, 153, 0.12)",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      marginLeft: "auto",
                    }}
                  >
                    🏆 {levelLabel}
                  </span>
                </div>
                <div className="home-stat-bar">
                  <div
                    style={{
                      width: `${readinessPercent}%`,
                      background: "#0c8599",
                      height: "100%",
                      borderRadius: "4px",
                      transition: "width .5s ease",
                    }}
                  />
                </div>
                <div style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)" }}>
                  {t("dashboard.steadyProgress", "Muntazam amaliyot bilan o'sish")}
                </div>
              </article>
            </section>

            {/* ================= 3. HERO: ASOSIY TA'LIM REJIMLARI (4 COLUMNS) ================= */}
            <section className="primary-edu-section" aria-label={t("dashboard.mainModesTitle", "Asosiy ta'lim rejimlari")}>
              <div className="section-headline">
                <h3>{t("dashboard.mainModesTitle", "Asosiy ta'lim rejimlari")}</h3>
                <p>{t("dashboard.selectFormat", "O'rganish ketma-ketligi bo'yicha rejimni tanlang")}</p>
              </div>

              <div className="primary-education-grid">
                {primaryModes.map((m) => (
                  <article
                    key={m.screen}
                    className={`primary-edu-card${m.isMarathon ? " marafon-featured" : ""}`}
                    style={{ "--edu-accent": m.accentColor } as React.CSSProperties}
                    onClick={() => handleNav(m.screen)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleNav(m.screen);
                      }
                    }}
                  >
                    {m.recommended && (
                      <span className="primary-edu-badge">
                        <IconSparkles size={11} stroke={2.5} style={{ verticalAlign: "middle", marginRight: 3 }} />
                        {t("dashboard.recommended", "TAVSIYA ETILADI")}
                      </span>
                    )}

                    <div className="primary-edu-top">
                      <div
                        className="primary-edu-icon"
                        style={{ background: m.gradient }}
                      >
                        <m.icon size={24} stroke={1.8} color="#fff" />
                      </div>
                    </div>

                    <div className="primary-edu-info">
                      <h4 className="primary-edu-title">{m.title}</h4>
                      <p className="primary-edu-desc">{m.desc}</p>
                    </div>

                    <div className="primary-edu-bottom">
                      <span className="primary-edu-cta-text">
                        {t("dashboard.start", "Boshlash")}
                      </span>
                      <div className={`primary-edu-action-arrow${m.isMarathon ? " marafon" : ""}`}>
                        <IconArrowRight size={16} stroke={2.5} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* ================= 4. AQLLI TAVSIYA VA XATOLAR (12 USTUNLI 7/5 NISBAT) ================= */}
            <section className="smart-recommendation-section" aria-label={t("dashboard.smartSectionTitle", "Aqlli tavsiya va xatolar ustida ishlash")}>
              <div className="section-headline">
                <h3>{t("dashboard.smartSectionTitle", "Aqlli tavsiya va xatolar ustida ishlash")}</h3>
                <p>{t("dashboard.smartSectionSubtitle", "Imtihon natijangizni oshirish uchun eng zaif mavzular va xatolarni tizimli bartaraf eting")}</p>
              </div>

              <div className="smart-recommendation-grid">
                {/* Left Column (7 cols): Weak Topics Interactive List */}
                <div className="smart-col-left">
                  <div>
                    <span className="smart-badge amber">
                      <IconAlertTriangle size={12} stroke={2.5} />
                      <span>{t("dashboard.weakTopicsTitle", "ZAIF MAVZULAR")}</span>
                    </span>
                    <h4 className="smart-col-title">{t("dashboard.weakTopicsSubtitle", "Eng ko'p xato tushgan yo'nalishlar")}</h4>
                  </div>

                  <div className="nba-topic-list" role="list">
                    {currentWeakTopics.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted)" }}>
                        <IconSparkles size={32} color="#0284c7" style={{ marginBottom: 8 }} />
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>
                          {t("dashboard.noMistakesYet", "Xatolar mavjud emas!")}
                        </div>
                        <div style={{ fontSize: "13px", marginTop: 4 }}>
                          {t("dashboard.noMistakesDesc", "Bilimlaringiz a'lo darajada. To'liq imtihon bilan o'zingizni sinab ko'ring.")}
                        </div>
                      </div>
                    ) : (
                      currentWeakTopics.map((topic) => (
                        <button
                          key={topic.id}
                          type="button"
                          className="nba-topic-item"
                          onClick={() => navigate(`/marafon?topicId=${topic.id}`)}
                          title={topic.name}
                        >
                          <span className="nba-topic-name">{topic.name}</span>
                          <span className="nba-topic-count">
                            {topic.wrongCount} {t("dashboard.mistakesCount", "ta xato")}
                          </span>
                          <IconArrowRight size={16} className="nba-topic-arrow" />
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Right Column (5 cols): Fix Mistakes Quick CTA */}
                <div className="smart-col-right">
                  <div>
                    <span className="smart-badge red">
                      <IconFlame size={12} stroke={2.5} />
                      <span>{t("dashboard.quickFix", "TEZKOR TUZATISH")}</span>
                    </span>
                    <h4 className="smart-col-title">
                      {totalWrongs} {t("dashboard.mistakesTitle", "ta xato javob")}
                    </h4>
                    <p className="smart-col-desc">{t("dashboard.mistakesDesc", "Xatolar ustida muntazam ishlash imtihondan birinchi urinishda o'tish imkonini 94% ga oshiradi.")}</p>
                  </div>

                  <button
                    type="button"
                    className="smart-fix-btn"
                    onClick={() => navigate(totalWrongs > 0 ? "/wrong-exam" : "/exam")}
                  >
                    <span>
                      {totalWrongs > 0
                        ? t("dashboard.fixMistakesBtn", "Eng zaif 20 ta savolni tuzatish")
                        : t("dashboard.startExamBtn", "Sinov imtihonini boshlash")}
                    </span>
                    <IconArrowRight size={18} stroke={2.5} />
                  </button>
                </div>
              </div>
            </section>

            {/* ================= 5. SECONDARY COMPACT TOOLS GRID (4 COLS) ================= */}
            <section className="secondary-tools-section" aria-label={t("dashboard.analyticsTitle", "Tahlil va shaxsiy vositalar")}>
              <div className="section-headline">
                <h3>{t("dashboard.analyticsTitle", "Tahlil va shaxsiy vositalar")}</h3>
                <p>{t("dashboard.personalToolsDesc", "Shaxsiy o'sish, natijalar va sinovlar monitoringi")}</p>
              </div>

              <div className="secondary-tools-grid">
                {secondaryTools.map((s) => (
                  <article
                    key={s.screen}
                    className="secondary-tool-card"
                    onClick={() => handleNav(s.screen)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleNav(s.screen);
                      }
                    }}
                  >
                    <div
                      className="secondary-tool-icon"
                      style={{ background: s.gradient }}
                    >
                      <s.icon size={20} stroke={1.8} color="#fff" />
                    </div>
                    <div className="secondary-tool-info">
                      <div className="secondary-tool-name">{s.title}</div>
                      <div className="secondary-tool-desc">{s.desc}</div>
                    </div>
                    <IconArrowRight size={16} className="secondary-tool-arrow" stroke={2} />
                  </article>
                ))}
              </div>
            </section>

            {/* ================= 6. MINIMAL FOOTER ================= */}
            <footer className="home-footer">
              <div className="home-footer-inner">
                <p className="home-footer-title">{t("dashboard.footerFollow", "BIZNI IJTIMOIY TARMOQLARDA KUZATING")}</p>
                <div className="home-footer-cards">
                  {SOCIAL_LINKS.map((item) => (
                    <button
                      key={item.label}
                      className="home-footer-btn"
                      onClick={() => {
                        if (typeof window !== "undefined" && window.innerWidth <= 768) {
                          window.open(item.url, "_blank", "noopener,noreferrer");
                        } else {
                          setQrModal(item);
                        }
                      }}
                      type="button"
                    >
                      <item.icon size={18} stroke={1.8} style={{ color: item.color }} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
                <p style={{ margin: "16px 0 0 0", textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
                  © {new Date().getFullYear()} PravaOnline. {t("dashboard.allRightsReserved", "Barcha huquqlar himoyalangan.")}
                </p>
              </div>
            </footer>
          </div>
        </main>

        {/* QR Code Modal for Social Channels */}
        {qrModal && (
          <div className="modal-overlay" onClick={() => setQrModal(null)}>
            <div className="qr-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="qr-modal-header" style={{ background: qrModal.gradient }}>
                <qrModal.icon size={24} stroke={1.8} color="#fff" />
                <span className="qr-modal-platform">{qrModal.label}</span>
              </div>
              <div className="qr-modal-body">
                <QRCodeSVG
                  value={qrModal.url}
                  size={180}
                  bgColor="transparent"
                  fgColor="currentColor"
                  level="M"
                  imageSettings={{
                    src: "/logo.svg",
                    width: 36,
                    height: 36,
                    excavate: true,
                  }}
                />
                <div className="qr-modal-url">{qrModal.handle}</div>
                <p className="qr-modal-hint">{t("dashboard.scanQrCode", "QR kodni skanerlang")}</p>
                <a
                  href={qrModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 10,
                    padding: "6px 14px",
                    background: "var(--surface-muted)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--primary)",
                    textDecoration: "none",
                  }}
                >
                  <span>{t("common.openDirectly", "Havola orqali ochish")}</span>
                  <IconArrowRight size={14} />
                </a>
              </div>
              <button
                className="qr-modal-close"
                onClick={() => setQrModal(null)}
                type="button"
                aria-label={t("common.close", "Yopish")}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Exam Count Picker Modal */}
        {showExamPicker && (
          <div className="modal-overlay" onClick={() => setShowExamPicker(false)}>
            <div className="modal-card exam-picker-modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">
                {t("dashboard.examQuestionCount", "Nechta savoldan imtihon?")}
              </h3>
              <div className="exam-picker-grid">
                {EXAM_OPTIONS.map((count) => (
                  <button
                    key={count}
                    className="exam-picker-btn"
                    onClick={() => handleStartExam(count)}
                    type="button"
                  >
                    <span className="exam-picker-num">{count}</span>
                    <span className="exam-picker-label">{t("dashboard.questionsUnit", "savol")}</span>
                    <span className="exam-picker-time">
                      {count} {t("dashboard.minutesUnit", "daq")}
                    </span>
                  </button>
                ))}
              </div>
              <button
                className="modal-btn-cancel"
                onClick={() => setShowExamPicker(false)}
                type="button"
              >
                {t("dashboard.cancel", "Bekor qilish")}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}