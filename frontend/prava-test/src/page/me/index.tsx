import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import SEO from "../../components/common/SEO";
import { getFullStats } from "../../services/desktopAdapter";
import { resolveUserScopeId } from "../../utils/userScope";
import type { FullStats } from "../../types/desktop";
import { QRCodeSVG } from "qrcode.react";
import "./dashboard.css";
import {
  IconBook2,
  IconPencil,
  IconRun,
  IconChartBar,
  IconTicket,
  IconPlayerPlayFilled,
  IconBrandInstagram,
  IconBrandTelegram,
  IconBrandYoutube,
  IconWorld,
  IconAlertTriangle,
  IconBookmark,
  IconQuestionMark,
  IconTargetArrow,
  IconCalendar,
  IconChevronRight,
  IconArrowRight,
  IconBox,
  IconSettings,
  IconFlame,
  IconTrophy,
  IconBooks,
} from "@tabler/icons-react";

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    handle: "@pravaonlineuz",
    url: "https://www.instagram.com/pravaonlineuz/",
    icon: IconBrandInstagram,
    color: "#ffffff",
    className: "is-instagram",
  },
  {
    label: "Telegram",
    handle: "@pravaonlineuz",
    url: "https://t.me/pravaonlineuz",
    icon: IconBrandTelegram,
    color: "#ffffff",
    className: "is-telegram",
  },
  {
    label: "YouTube",
    handle: "@pravaonlineuz",
    url: "https://www.youtube.com/@pravaonlineuz",
    icon: IconBrandYoutube,
    color: "#ffffff",
    className: "is-youtube",
  },
  {
    // i18n-ignore
    label: "Website",
    handle: "pravaonline.uz",
    url: "https://pravaonline.uz/",
    icon: IconWorld,
    color: "#ffffff",
    className: "is-website",
  },
];

const EXAM_OPTIONS = [20, 40, 50, 60, 80, 100];

function getDaysUntilExam(targetDateStr: string | null): number {
  if (!targetDateStr) return 1;
  try {
    const target = new Date(targetDateStr);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  } catch {
    return 1;
  }
}

export default function User_Page() {
  const { t } = useTranslation();
  useLanguage();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [stats, setStats] = useState<FullStats | null>(null);
  const [showExamPicker, setShowExamPicker] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetDateInput, setTargetDateInput] = useState("");
  const [targetExamDate, setTargetExamDate] = useState<string | null>(() => {
    return localStorage.getItem("prava_target_exam_date") || null;
  });
  const [qrModal, setQrModal] = useState<typeof SOCIAL_LINKS[0] | null>(null);

  const userId = resolveUserScopeId(user);

  const loadData = useCallback(() => {
    getFullStats(userId).then(setStats).catch(() => {});
  }, [userId]);

  useEffect(() => {
    loadData();
    const handleStorageChange = () => loadData();
    window.addEventListener("prava-storage-changed", handleStorageChange);
    return () => window.removeEventListener("prava-storage-changed", handleStorageChange);
  }, [loadData]);

  // URL search params: if ?picker=exam, open exam modal
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("picker") === "exam") {
      setShowExamPicker(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const guestLabel = t("desktopShell.status.guest", "Mehmon");
  const userFallback = t("userMenu.user", "Foydalanuvchi");
  const rawName = isAuthenticated
    ? (user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.phoneNumber || "").trim()
    : "";
  const cleanName = rawName.includes("{{") ? "" : rawName;
  const displayName = cleanName || (isAuthenticated ? userFallback : guestLabel);
  const heroGreetingText = isAuthenticated && cleanName
    ? t("refDashboard.heroGreeting", { name: displayName, defaultValue: `Xush kelibsiz, ${displayName}! 👋` })
    : t("refDashboard.heroGreeting", { name: guestLabel, defaultValue: `Xush kelibsiz, ${guestLabel}! 👋` });

  const handleStartExam = (count: number) => {
    setShowExamPicker(false);
    navigate(`/exam?count=${count}`);
  };

  const handleSaveTargetDate = () => {
    if (targetDateInput) {
      localStorage.setItem("prava_target_exam_date", targetDateInput);
      setTargetExamDate(targetDateInput);
    }
    setShowTargetModal(false);
  };

  // Stats calculation
  const ticketReady = stats?.ticket_ready ?? 0;
  const ticketTotal = stats?.ticket_total && stats.ticket_total >= 64 ? stats.ticket_total : 64;
  const qReady = stats?.question_readiness?.ready ?? 0;
  const qAverage = stats?.question_readiness?.average ?? 0;
  const qTotal = stats?.question_readiness?.total && stats.question_readiness.total >= 1264 ? stats.question_readiness.total : 1264;

  const ticketReadyPct = ticketTotal > 0 ? Math.round((ticketReady / ticketTotal) * 100) : 0;
  const qPracticedPct = qTotal > 0 ? Math.round(((qReady + qAverage) / qTotal) * 100) : 0;
  const overallPct = ticketTotal > 0
    ? Math.round((ticketReadyPct + qPracticedPct) / 2)
    : qPracticedPct;

  const daysToExam = getDaysUntilExam(targetExamDate);

  return (
    <>
      <SEO
        title={`Prava Online - ${heroGreetingText}`}
        description={t("refDashboard.heroSubtitle", "Haydovchilik imtihoniga tayyorlanishni davom ettiring")}
        canonical="/me"
      />

      <div className="ref-dashboard-wrapper">
        <main className="ref-dashboard-container">
          {/* Hero Greeting */}
          <div className="ref-hero">
            <h1 className="ref-hero-greeting">
              {heroGreetingText}
            </h1>
            <p className="ref-hero-subtitle">
              {t("refDashboard.heroSubtitle", "Haydovchilik imtihoniga tayyorlanishni davom ettiring")}
            </p>
          </div>

          {/* 4 Progress Cards Row */}
          <section className="ref-progress-grid" aria-label={t("refDashboard.progressOverview", "Progress Overview")}>
            {/* Card 1: Ready Tickets */}
            <div
              className="ref-stat-card"
              onClick={() => navigate("/tickets")}
              title={t("refDashboard.readyTickets", "Tayyor biletlar")}
            >
              <div className="ref-stat-top">
                <div className="ref-stat-left">
                  <div className="ref-stat-icon-wrap" style={{ background: "#059669", color: "#ffffff" }}>
                    <IconTicket size={22} stroke={2.2} />
                  </div>
                  <div>
                    <div className="ref-stat-val">{ticketReady}/{ticketTotal}</div>
                    <div className="ref-stat-lbl">{t("refDashboard.readyTickets", "Tayyor biletlar")}</div>
                  </div>
                </div>
                <span className="ref-stat-pct" style={{ color: "#10b981" }}>
                  {ticketReadyPct}%
                </span>
              </div>
              <div className="ref-stat-progress-bar">
                <div
                  className="ref-stat-progress-fill"
                  style={{ width: `${ticketReadyPct}%`, background: "linear-gradient(90deg, #059669, #10b981)" }}
                />
              </div>
            </div>

            {/* Card 2: Solved Questions */}
            <div
              className="ref-stat-card"
              onClick={() => navigate("/statistics")}
              title={t("refDashboard.solvedQuestions", "Ishlangan savollar")}
            >
              <div className="ref-stat-top">
                <div className="ref-stat-left">
                  <div className="ref-stat-icon-wrap" style={{ background: "#7c3aed", color: "#ffffff" }}>
                    <IconQuestionMark size={22} stroke={2.5} />
                  </div>
                  <div>
                    <div className="ref-stat-val">{qReady + qAverage}/{qTotal}</div>
                    <div className="ref-stat-lbl">{t("refDashboard.solvedQuestions", "Ishlangan savollar")}</div>
                  </div>
                </div>
                <span className="ref-stat-pct" style={{ color: "#8b5cf6" }}>
                  {qPracticedPct}%
                </span>
              </div>
              <div className="ref-stat-progress-bar">
                <div
                  className="ref-stat-progress-fill"
                  style={{ width: `${qPracticedPct}%`, background: "linear-gradient(90deg, #7c3aed, #a855f7)" }}
                />
              </div>
            </div>

            {/* Card 3: Overall Readiness */}
            <div
              className="ref-stat-card"
              onClick={() => navigate("/statistics")}
              title={t("refDashboard.overallReadiness", "Umumiy tayyorgarlik")}
            >
              <div className="ref-stat-top">
                <div className="ref-stat-left">
                  <div className="ref-stat-icon-wrap" style={{ background: "#ef4444", color: "#ffffff" }}>
                    <IconTargetArrow size={22} stroke={2.2} />
                  </div>
                  <div>
                    <div className="ref-stat-val">{overallPct}%</div>
                    <div className="ref-stat-lbl">{t("refDashboard.overallReadiness", "Umumiy tayyorgarlik")}</div>
                  </div>
                </div>
                <span className="ref-stat-pct" style={{ color: "#ef4444" }}>
                  {overallPct}%
                </span>
              </div>
              <div className="ref-stat-progress-bar">
                <div
                  className="ref-stat-progress-fill"
                  style={{ width: `${overallPct}%`, background: "linear-gradient(90deg, #dc2626, #ef4444)" }}
                />
              </div>
            </div>

            {/* Card 4: Until Exam */}
            <div
              className="ref-stat-card"
              onClick={() => setShowTargetModal(true)}
              title={t("refDashboard.targetDateTitle", "Imtihon sanasini belgilash")}
            >
              <div className="ref-stat-top">
                <div className="ref-stat-left">
                  <div className="ref-stat-icon-wrap" style={{ background: "#f59e0b", color: "#ffffff" }}>
                    <IconCalendar size={22} stroke={2.2} />
                  </div>
                  <div>
                    <div className="ref-stat-val" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{t("refDashboard.daysLeft", { n: daysToExam })}</span>
                      <span style={{ fontSize: "14px" }}>✏️</span>
                    </div>
                    <div className="ref-stat-lbl">{t("refDashboard.untilExam", "Imtihongacha")}</div>
                  </div>
                </div>
                <div className="ref-stat-arrow-btn" aria-hidden="true">
                  <IconChevronRight size={18} stroke={2.5} />
                </div>
              </div>
            </div>
          </section>

          {/* Section 1: Main Actions */}
          <section className="ref-section" aria-label={t("refDashboard.mainActions", "Asosiy amallar")}>
            <div className="ref-section-head">
              <h2 className="ref-section-title">
                <span>⚡</span>
                <span>{t("refDashboard.mainActions", "Asosiy amallar")}</span>
              </h2>
            </div>

            <div className="ref-primary-grid">
              {/* Primary 1: Solve Tests */}
              <button
                type="button"
                className="ref-primary-card is-tests"
                onClick={() => setShowExamPicker(true)}
              >
                <div className="ref-primary-top-icon is-play">
                  <IconPlayerPlayFilled size={20} color="#10b981" />
                </div>
                <div className="ref-primary-content">
                  <div className="ref-primary-title">{t("refDashboard.solveTests", "Test yechish")}</div>
                  <div className="ref-primary-desc">{t("refDashboard.solveTestsDesc", "Sizga mos savollar")}</div>
                </div>
                {/* 3D Test Sheet SVG Graphic */}
                <div className="ref-primary-graphic" aria-hidden="true">
                  <svg width="86" height="86" viewBox="0 0 100 100" fill="none">
                    <rect x="24" y="14" width="56" height="74" rx="8" fill="#ffffff" fillOpacity="0.95" />
                    <rect x="32" y="26" width="30" height="5" rx="2.5" fill="#38bdf8" />
                    <rect x="32" y="38" width="40" height="4" rx="2" fill="#cbd5e1" />
                    <rect x="32" y="48" width="34" height="4" rx="2" fill="#cbd5e1" />
                    <rect x="32" y="58" width="38" height="4" rx="2" fill="#cbd5e1" />
                    <circle cx="68" cy="70" r="13" fill="#10b981" />
                    <path d="M63 70L67 74L73 66" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="ref-primary-arrow" aria-hidden="true">
                  <IconArrowRight size={18} stroke={2.5} />
                </div>
              </button>

              {/* Primary 2: Real Exam */}
              <button
                type="button"
                className="ref-primary-card is-exam"
                onClick={() => navigate("/exam?mode=real&count=20")}
              >
                <div className="ref-primary-top-icon">
                  <IconPencil size={22} color="#ffffff" stroke={2.2} />
                </div>
                <div className="ref-primary-content">
                  <div className="ref-primary-title">{t("refDashboard.realExam", "Real imtihon")}</div>
                  <div className="ref-primary-desc">{t("refDashboard.realExamDesc", "Imtihon sharoitida")}</div>
                </div>
                {/* 3D Clipboard Graphic */}
                <div className="ref-primary-graphic" aria-hidden="true">
                  <svg width="86" height="86" viewBox="0 0 100 100" fill="none">
                    <rect x="22" y="16" width="56" height="74" rx="8" fill="#ffffff" fillOpacity="0.95" />
                    <rect x="36" y="10" width="28" height="12" rx="4" fill="#0284c7" />
                    <rect x="30" y="34" width="40" height="5" rx="2.5" fill="#38bdf8" />
                    <rect x="30" y="46" width="34" height="4" rx="2" fill="#94a3b8" />
                    <rect x="30" y="56" width="38" height="4" rx="2" fill="#94a3b8" />
                    <circle cx="66" cy="70" r="11" fill="#0284c7" />
                    <path d="M62 70L65 73L71 67" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="ref-primary-arrow" aria-hidden="true">
                  <IconArrowRight size={18} stroke={2.5} />
                </div>
              </button>

              {/* Primary: Tickets */}
              <button
                type="button"
                className="ref-primary-card is-tickets"
                onClick={() => navigate("/tickets")}
              >
                <div className="ref-primary-top-icon">
                  <IconTicket size={22} color="#ffffff" stroke={2.2} />
                </div>
                <div className="ref-primary-content">
                  <div className="ref-primary-title">{t("refDashboard.tickets", "Biletlar")}</div>
                  <div className="ref-primary-desc">{t("refDashboard.ticketsDesc", "Bilet bo'yicha mashq")}</div>
                </div>
                {/* 3D Ticket Graphic */}
                <div className="ref-primary-graphic" aria-hidden="true">
                  <svg width="100" height="82" viewBox="0 0 100 82" fill="none">
                    <g transform="rotate(-8 45 40)">
                      <rect x="14" y="18" width="64" height="40" rx="7" fill="#fbbf24" fillOpacity="0.85" />
                      <path d="M14 40a6 6 0 0 1 0-12v12zM78 28a6 6 0 0 1 0 12V28z" fill="#f59e0b" />
                      <circle cx="46" cy="38" r="9" fill="#f59e0b" fillOpacity="0.9" />
                      <path d="M46 32l1.6 3.2 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#ffffff" />
                    </g>
                    <g transform="rotate(4 52 46)">
                      <rect x="18" y="22" width="64" height="40" rx="7" fill="#fef08a" />
                      <path d="M18 44a6 6 0 0 1 0-12v12zM82 32a6 6 0 0 1 0 12V32z" fill="#f59e0b" />
                      <line x1="36" y1="26" x2="36" y2="58" stroke="#fde047" strokeWidth="1.5" strokeDasharray="3 3" />
                      <circle cx="56" cy="42" r="10" fill="#f59e0b" />
                      <path d="M56 36l1.6 3.2 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#ffffff" />
                    </g>
                  </svg>
                </div>
                <div className="ref-primary-arrow" aria-hidden="true">
                  <IconArrowRight size={18} stroke={2.5} />
                </div>
              </button>
            </div>
          </section>

          {/* Section 2: Learning & Practice */}
          <section className="ref-section" aria-label={t("refDashboard.studyAndPractice", "O‘rganish va mashq qilish")}>
            <div className="ref-section-head">
              <h2 className="ref-section-title">
                <span>📖</span>
                <span>{t("refDashboard.studyAndPractice", "O‘rganish va mashq qilish")}</span>
              </h2>
              <button
                type="button"
                className="ref-section-link"
                onClick={() => navigate("/topics")}
              >
                <span>{t("refDashboard.viewAll", "Barchasini ko'rish")}</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>

            <div className="ref-secondary-grid">
              {/* Learn 1: Topics */}
              <div
                className="ref-secondary-card"
                onClick={() => navigate("/topics")}
                role="button"
                tabIndex={0}
              >
                <div className="ref-secondary-left">
                  <div className="ref-secondary-icon" style={{ background: "#0284c7", color: "#ffffff" }}>
                    <IconBook2 size={24} stroke={2} />
                  </div>
                  <div>
                    <div className="ref-secondary-title">{t("refDashboard.topics", "Mavzular")}</div>
                    <div className="ref-secondary-desc">{t("refDashboard.topicsDesc", "Mavzu bo'yicha o'rganish")}</div>
                  </div>
                </div>
                <div className="ref-secondary-arrow-btn" aria-hidden="true">
                  <IconChevronRight size={16} stroke={2.5} />
                </div>
              </div>

              {/* Learn 2: Materials */}
              <div
                className="ref-secondary-card"
                onClick={() => navigate("/signs")}
                role="button"
                tabIndex={0}
              >
                <div className="ref-secondary-left">
                  <div className="ref-secondary-icon" style={{ background: "#4338ca", color: "#ffffff" }}>
                    <IconBooks size={24} stroke={2} />
                  </div>
                  <div>
                    <div className="ref-secondary-title">{t("refDashboard.materials", "O‘quv materiallari")}</div>
                    <div className="ref-secondary-desc">{t("refDashboard.materialsDesc", "Nazariya va qo'llanmalar")}</div>
                  </div>
                </div>
                <div className="ref-secondary-arrow-btn" aria-hidden="true">
                  <IconChevronRight size={16} stroke={2.5} />
                </div>
              </div>

              {/* Learn 3: Marathon */}
              <div
                className="ref-secondary-card"
                onClick={() => navigate("/marafon")}
                role="button"
                tabIndex={0}
              >
                <div className="ref-secondary-left">
                  <div className="ref-secondary-icon" style={{ background: "#1e293b", color: "#fbbf24" }}>
                    <IconRun size={24} stroke={2} />
                  </div>
                  <div>
                    <div className="ref-secondary-title">{t("refDashboard.marathon", "Marafon")}</div>
                    <div className="ref-secondary-desc">{t("refDashboard.marathonDesc", "Barcha savollar ketma-ket")}</div>
                  </div>
                </div>
                <div className="ref-secondary-arrow-btn" aria-hidden="true">
                  <IconChevronRight size={16} stroke={2.5} />
                </div>
              </div>

              {/* Learn 4: Survival / Error Marathon */}
              <div
                className="ref-secondary-card"
                onClick={() => navigate("/survival")}
                role="button"
                tabIndex={0}
              >
                <div className="ref-secondary-left">
                  <div className="ref-secondary-icon" style={{ background: "#1e293b", color: "#ef4444" }}>
                    <IconFlame size={24} stroke={2} />
                  </div>
                  <div>
                    <div className="ref-secondary-title">{t("refDashboard.survival", "Xatogacha marafon")}</div>
                    <div className="ref-secondary-desc">{t("refDashboard.survivalDesc", "Xato qilmaguningizcha")}</div>
                  </div>
                </div>
                <div className="ref-secondary-arrow-btn" aria-hidden="true">
                  <IconChevronRight size={16} stroke={2.5} />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Results & Analysis */}
          <section className="ref-section" aria-label={t("refDashboard.resultsAndAnalysis", "Natijalar va tahlil")}>
            <div className="ref-section-head">
              <h2 className="ref-section-title">
                <span>📊</span>
                <span>{t("refDashboard.resultsAndAnalysis", "Natijalar va tahlil")}</span>
              </h2>
              <button
                type="button"
                className="ref-section-link"
                onClick={() => navigate("/statistics")}
              >
                <span>{t("refDashboard.viewAll", "Barchasini ko'rish")}</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>

            <div className="ref-secondary-grid">
              {/* Result 1: Wrong Answers */}
              <div
                className="ref-secondary-card"
                onClick={() => navigate("/wrong-answers")}
                role="button"
                tabIndex={0}
              >
                <div className="ref-secondary-left">
                  <div className="ref-secondary-icon" style={{ background: "#ef4444", color: "#ffffff" }}>
                    <IconAlertTriangle size={24} stroke={2} />
                  </div>
                  <div>
                    <div className="ref-secondary-title">{t("refDashboard.mistakes", "Xatolar ustida ishlash")}</div>
                    <div className="ref-secondary-desc">{t("refDashboard.mistakesDesc", "Xato javob berilgan savollar")}</div>
                  </div>
                </div>
                <div className="ref-secondary-arrow-btn" aria-hidden="true">
                  <IconChevronRight size={16} stroke={2.5} />
                </div>
              </div>

              {/* Result 2: Bookmarks */}
              <div
                className="ref-secondary-card"
                onClick={() => navigate("/saved-questions")}
                role="button"
                tabIndex={0}
              >
                <div className="ref-secondary-left">
                  <div className="ref-secondary-icon" style={{ background: "#d97706", color: "#ffffff" }}>
                    <IconBookmark size={24} stroke={2} />
                  </div>
                  <div>
                    <div className="ref-secondary-title">{t("refDashboard.bookmarks", "Tanlanganlar")}</div>
                    <div className="ref-secondary-desc">{t("refDashboard.bookmarksDesc", "Siz saqlagan savollar")}</div>
                  </div>
                </div>
                <div className="ref-secondary-arrow-btn" aria-hidden="true">
                  <IconChevronRight size={16} stroke={2.5} />
                </div>
              </div>

              {/* Result 3: Statistics */}
              <div
                className="ref-secondary-card"
                onClick={() => navigate("/statistics")}
                role="button"
                tabIndex={0}
              >
                <div className="ref-secondary-left">
                  <div className="ref-secondary-icon" style={{ background: "#10b981", color: "#ffffff" }}>
                    <IconChartBar size={24} stroke={2} />
                  </div>
                  <div>
                    <div className="ref-secondary-title">{t("refDashboard.statistics", "Statistika")}</div>
                    <div className="ref-secondary-desc">{t("refDashboard.statisticsDesc", "Natijalaringiz va progress")}</div>
                  </div>
                </div>
                <div className="ref-secondary-arrow-btn" aria-hidden="true">
                  <IconChevronRight size={16} stroke={2.5} />
                </div>
              </div>

              {/* Result 4: Ranking */}
              <div
                className="ref-secondary-card"
                onClick={() => navigate("/leaderboard")}
                role="button"
                tabIndex={0}
              >
                <div className="ref-secondary-left">
                  <div className="ref-secondary-icon" style={{ background: "#78350f", color: "#fbbf24" }}>
                    <IconTrophy size={24} stroke={2} />
                  </div>
                  <div>
                    <div className="ref-secondary-title">{t("refDashboard.ranking", "Reyting")}</div>
                    <div className="ref-secondary-desc">{t("refDashboard.rankingDesc", "Boshqa foydalanuvchilar")}</div>
                  </div>
                </div>
                <div className="ref-secondary-arrow-btn" aria-hidden="true">
                  <IconChevronRight size={16} stroke={2.5} />
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Other Features & Social Links */}
          <section className="ref-section" aria-label={t("refDashboard.otherFeatures", "Boshqa imkoniyatlar")}>
            <div className="ref-section-head">
              <h2 className="ref-section-title">
                <span>🔲</span>
                <span>{t("refDashboard.otherFeatures", "Boshqa imkoniyatlar")}</span>
              </h2>
            </div>

            <div className="ref-other-row">
              {/* Left 2 Cards: Packages & Settings */}
              <div className="ref-other-subgrid">
                <div
                  className="ref-secondary-card"
                  onClick={() => navigate("/packages")}
                  role="button"
                  tabIndex={0}
                >
                  <div className="ref-secondary-left">
                    <div className="ref-secondary-icon" style={{ background: "#7c3aed", color: "#ffffff" }}>
                      <IconBox size={24} stroke={2} />
                    </div>
                    <div>
                      <div className="ref-secondary-title">{t("refDashboard.packages", "Paketlar")}</div>
                      <div className="ref-secondary-desc">{t("refDashboard.packagesDesc", "Premium imkoniyatlar")}</div>
                    </div>
                  </div>
                  <div className="ref-secondary-arrow-btn" aria-hidden="true">
                    <IconChevronRight size={16} stroke={2.5} />
                  </div>
                </div>

                <div
                  className="ref-secondary-card"
                  onClick={() => navigate("/settings")}
                  role="button"
                  tabIndex={0}
                >
                  <div className="ref-secondary-left">
                    <div className="ref-secondary-icon" style={{ background: "#334155", color: "#ffffff" }}>
                      <IconSettings size={24} stroke={2} />
                    </div>
                    <div>
                      <div className="ref-secondary-title">{t("refDashboard.settings", "Sozlamalar")}</div>
                      <div className="ref-secondary-desc">{t("refDashboard.settingsDesc", "Ilova sozlamalari")}</div>
                    </div>
                  </div>
                  <div className="ref-secondary-arrow-btn" aria-hidden="true">
                    <IconChevronRight size={16} stroke={2.5} />
                  </div>
                </div>
              </div>

              {/* Right Card: Social Channels Banner */}
              <div className="ref-social-banner">
                <div className="ref-social-title">
                  <span>🔗</span>
                  <span>{t("refDashboard.usefulResources", "Foydali manbalarimiz")}</span>
                </div>
                <div className="ref-social-pills">
                  {SOCIAL_LINKS.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      className={`ref-social-pill ${s.className || ""}`}
                      onClick={() => setQrModal(s)}
                    >
                      <s.icon size={18} stroke={2} color="#ffffff" />
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* QR Modal */}
          {qrModal && (
            <div className="ref-modal-overlay" onClick={() => setQrModal(null)}>
              <div className="ref-modal-card" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <qrModal.icon size={26} stroke={2} color={qrModal.color} />
                  <h3 className="ref-modal-title" style={{ margin: 0 }}>{qrModal.label}</h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0" }}>
                  <div style={{ background: "#ffffff", padding: 14, borderRadius: 16 }}>
                    <QRCodeSVG
                      value={qrModal.url}
                      size={180}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="M"
                    />
                  </div>
                  <div style={{ marginTop: 14, fontWeight: 700, fontSize: 15, color: "#38bdf8" }}>
                    {qrModal.handle}
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--text-muted, #94a3b8)" }}>
                    {t("refDashboard.scanQrHint", "Kamerangiz orqali skanerlang")}
                  </p>
                </div>
                <div className="ref-modal-actions">
                  <button
                    type="button"
                    className="ref-modal-btn is-cancel"
                    onClick={() => setQrModal(null)}
                  >
                    {t("refDashboard.cancel", "Yopish")}
                  </button>
                  <a
                    href={qrModal.url}
                    target="_blank"
                    rel="noreferrer"
                    className="ref-modal-btn is-save"
                    style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
                  >
                    {t("refDashboard.openLink", "Havolani ochish")}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Exam Question Count Picker Modal */}
          {showExamPicker && (
            <div className="ref-modal-overlay" onClick={() => setShowExamPicker(false)}>
              <div className="ref-modal-card" onClick={(e) => e.stopPropagation()}>
                <h3 className="ref-modal-title">{t("refDashboard.examPickerTitle", "Nechta savoldan imtihon?")}</h3>
                <p className="ref-modal-desc">{t("refDashboard.examPickerDesc", "Imtihon savollari sonini va unga ajratiladigan vaqtni tanlang.")}</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                  {EXAM_OPTIONS.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => handleStartExam(count)}
                      style={{
                        background: "var(--surface-muted, rgba(255, 255, 255, 0.05))",
                        border: "1px solid var(--border, rgba(255, 255, 255, 0.12))",
                        borderRadius: 12,
                        padding: "12px 8px",
                        cursor: "pointer",
                        color: "var(--text, #fff)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ fontSize: 20, fontWeight: 800, color: "#38bdf8" }}>{count}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>{t("refDashboard.questionsCountSuffix", "ta savol")}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#10b981" }}>{t("refDashboard.minutesSuffix", "{{count}} daq", { count })}</span>
                    </button>
                  ))}
                </div>
                <div className="ref-modal-actions">
                  <button
                    type="button"
                    className="ref-modal-btn is-cancel"
                    onClick={() => setShowExamPicker(false)}
                  >
                    {t("refDashboard.cancel", "Bekor qilish")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Target Exam Date Picker Modal */}
          {showTargetModal && (
            <div className="ref-modal-overlay" onClick={() => setShowTargetModal(false)}>
              <div className="ref-modal-card" onClick={(e) => e.stopPropagation()}>
                <h3 className="ref-modal-title">{t("refDashboard.targetDateTitle", "Imtihon sanasini belgilash")}</h3>
                <p className="ref-modal-desc">
                  {t("refDashboard.targetDateDesc", "Maqsadli imtihon kuningizni tanlang. Tayyorgarlik kunlari avtomatik hisoblanadi.")}
                </p>
                <input
                  type="date"
                  className="ref-modal-input"
                  defaultValue={targetExamDate || ""}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setTargetDateInput(e.target.value)}
                />
                <div className="ref-modal-actions">
                  <button
                    type="button"
                    className="ref-modal-btn is-cancel"
                    onClick={() => setShowTargetModal(false)}
                  >
                    {t("refDashboard.cancel", "Bekor qilish")}
                  </button>
                  <button
                    type="button"
                    className="ref-modal-btn is-save"
                    onClick={handleSaveTargetDate}
                  >
                    {t("refDashboard.save", "Saqlash")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
