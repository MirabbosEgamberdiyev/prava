import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import ColorMode from "../../components/other/ColorMode";
import LanguagePicker from "../../components/language/LanguagePicker";
import SEO from "../../components/common/SEO";
import { getFullStats } from "../../services/desktopAdapter";
import type { FullStats, AppScreen } from "../../types/desktop";
import { QRCodeSVG } from "../../components/common/QRCodeSVG";
import WeakTopicsWidget from "../../features/Home/components/WeakTopicsWidget";
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
} from "@tabler/icons-react";

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    handle: "@pravaonlineuz",
    url: "https://www.instagram.com/pravaonlineuz/",
    icon: IconBrandInstagram,
    gradient: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
    color: "#e1306c",
  },
  {
    label: "Telegram",
    handle: "@pravaonlineuz",
    url: "https://t.me/pravaonlineuz",
    icon: IconBrandTelegram,
    gradient: "linear-gradient(135deg,#48cae4,#0096c7)",
    color: "#0088cc",
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
  "#1971c2", "#2f9e44", "#e03131", "#7950f2",
  "#e67700", "#0c8599", "#c2255c", "#5c7cfa",
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

const EXAM_OPTIONS = [20, 40, 50, 60, 80, 100];

export default function User_Page() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<FullStats | null>(null);
  const [qrModal, setQrModal] = useState<typeof SOCIAL_LINKS[0] | null>(null);
  const [showExamPicker, setShowExamPicker] = useState(false);

  const userId = user?.id ? Number(user.id) : 1;
  const userName = user?.fullName || user?.phoneNumber || "Foydalanuvchi";

  useEffect(() => {
    getFullStats(userId).then(setStats).catch(() => {});
    const onStorage = () => {
      getFullStats(userId).then(setStats).catch(() => {});
    };
    window.addEventListener("prava-storage-changed", onStorage);
    return () => window.removeEventListener("prava-storage-changed", onStorage);
  }, [userId]);

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

  const ticketReady = stats?.ticket_ready ?? 0;
  const ticketTotal = stats?.ticket_total ?? 60;
  const qReady = stats?.question_readiness.ready ?? 0;
  const qAverage = stats?.question_readiness.average ?? 0;
  const qWeak = stats?.question_readiness.weak ?? 0;
  const qTotal = stats?.question_readiness.total ?? 1190;
  const qPracticed = qReady + qAverage + qWeak;
  const qPracticedPct = qTotal > 0 ? Math.round((qPracticed / qTotal) * 100) : 0;
  const overallPct = qPracticedPct;

  // Daily goal progress (Gamification)
  const dailyTarget = 30;
  const dailyDone = Math.min(dailyTarget, (qPracticed % dailyTarget) || (qPracticed > 0 ? 12 : 0));
  const dailyPct = Math.round((dailyDone / dailyTarget) * 100);

  // Gamified motivation level text
  const levelLabel =
    overallPct < 30
      ? t("home.levelBeginner", "Boshlang‘ich daraja 🌱")
      : overallPct < 70
      ? t("home.levelProgress", "O‘sish jarayonida 🚀")
      : t("home.levelMaster", "Yuqori tayyorgarlik 🏆");

  // Primary Education Modes (Core 4 Learning Modes)
  const primaryEducationModes = [
    {
      screen: "topics" as AppScreen,
      title: t("home.topics", "Mavzular bo'yicha o'rganish"),
      desc: t("home.topicsDesc", "Yo'l harakati qoidalarini nazariya va rasmiy testlar asosida tizimli o'rganing"),
      icon: IconBook2,
      accentColor: "#1971c2",
      gradient: "linear-gradient(135deg,#4dabf7,#1971c2)",
      featured: overallPct < 30, // New learner recommendation
      badgeText: t("home.featuredBadge", "Tavsiya etiladi"),
    },
    {
      screen: "biletlar" as AppScreen,
      title: t("home.biletlar", "Biletlar"),
      desc: t("home.biletlarDesc", `Standart 1–60 biletlar bo'yicha ketma-ket mashq qiling (${ticketReady}/${ticketTotal} ta tayyor)`),
      icon: IconTicket,
      accentColor: "#0c8599",
      gradient: "linear-gradient(135deg,#38d9a9,#0c8599)",
      featured: false,
      badgeText: "",
    },
    {
      screen: "marathon" as AppScreen,
      title: t("home.marathon", "Marafon"),
      desc: t("home.marathonDesc", "Barcha 1190 ta savol ketma-ket, to'xtovsiz amaliyot"),
      icon: IconRun,
      accentColor: "#7950f2",
      gradient: "linear-gradient(135deg,#9775fa,#7950f2)",
      featured: false,
      badgeText: "",
    },
    {
      screen: "exam" as AppScreen,
      title: t("home.exam", "Haqiqiy Imtihon"),
      desc: t("home.examDesc", "Davlat test markazi andozasi — 20 savol, 20 daqiqa vaqt nazorati"),
      icon: IconPencil,
      accentColor: "#f59f00",
      gradient: "linear-gradient(135deg,#ffa94d,#e67700)",
      featured: overallPct >= 75,
      badgeText: t("home.readyForExamBadge", "Sinovga tayyormisiz?"),
    },
  ];

  // Secondary Tools (Compact 4 Tools)
  const secondaryTools = [
    {
      screen: "wrong-answers" as AppScreen,
      title: t("home.wrongAnswers", "Barcha xatolar arxivi"),
      desc: t("home.wrongAnswersDesc", "Tahlil qilish va qayta yechish"),
      icon: IconAlertTriangle,
      gradient: "linear-gradient(135deg,#ffa94d,#f59f00)",
    },
    {
      screen: "saved-questions" as AppScreen,
      title: t("home.saved", "Saqlangan savollar"),
      desc: t("home.savedDesc", "Xatcho'p qo'yilgan savollar"),
      icon: IconBookmark,
      gradient: "linear-gradient(135deg,#4dabf7,#1971c2)",
    },
    {
      screen: "stats" as AppScreen,
      title: t("home.stats", "Statistika va Natijalar"),
      desc: t("home.statsDesc", "Batafsil o'rganish dinamikasi"),
      icon: IconChartBar,
      gradient: "linear-gradient(135deg,#38d9a9,#0c8599)",
    },
    {
      screen: "leaderboard" as AppScreen,
      title: t("home.leaderboard", "Reyting va Yutuqlar"),
      desc: t("home.leaderboardDesc", "O'quvchilar orasidagi o'rningiz"),
      icon: IconTrophy,
      gradient: "linear-gradient(135deg,#9775fa,#7950f2)",
    },
  ];

  return (
    <>
      <SEO
        title="Prava Online - Bosh sahifa"
        description="Prava Online haydovchilik guvohnomasi imtihoniga tayyorgarlik platformasi."
        canonical="/me"
      />
      <div className="home-screen">
        {/* Header */}
        <header className="home-header">
          <div className="home-header-inner">
            <div
              className="home-header-logo"
              style={{ display: "flex", alignItems: "center", gap: 10, cursor: "default" }}
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
            <div className="home-header-right">
              <ColorMode />
              <LanguagePicker />
              <div className="navbar-divider" aria-hidden="true" />

              <Menu withinPortal shadow="md" width={220} position="bottom-end" radius="md">
                <Menu.Target>
                  <button
                    className="user-switcher"
                    type="button"
                    aria-label={userName}
                  >
                    <div
                      className="user-switcher-avatar"
                      style={{ background: getColor(userName) }}
                    >
                      {getInitials(userName)}
                    </div>
                    <span className="user-switcher-name">{userName}</span>
                    <IconChevronDown size={14} stroke={2} style={{ opacity: 0.6 }} />
                  </button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>{userName}</Menu.Label>
                  <Menu.Item
                    leftSection={<IconSettings size={16} />}
                    onClick={() => navigate("/settings")}
                  >
                    {t("settings.title", "Sozlamalar va Profil")}
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconHistory size={16} />}
                    onClick={() => navigate("/history")}
                  >
                    {t("history.title", "Imtihon tarixi")}
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconTrophy size={16} />}
                    onClick={() => navigate("/leaderboard")}
                  >
                    {t("leaderboard.title", "Peshqadamlar reytingi")}
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
                    {t("common.logout", "Chiqish")}
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="home-content">
          <div className="home-inner">
            {/* 1. Greeting with Motivational Subheader */}
            <div className="home-welcome">
              <h2>{t("home.welcome", `Xush kelibsiz, ${userName}!`)}</h2>
              <p>
                {t(
                  "home.welcomeSubtitle",
                  "Bugungi o‘rganish natijangizni yangilang va imtihonga yanada yaqinlashing"
                )}
              </p>
            </div>

            {/* 2. Three Key Metrics (Gamification & Encouragement) */}
            <section className="home-stats-bar" aria-label="Asosiy ko'rsatkichlar">
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
                      {t("home.dailyGoalText", "Bugungi reja (savol)")}
                    </div>
                  </div>
                  <span className="home-stat-pct" style={{ color: "#f76707" }}>
                    {dailyPct}%
                  </span>
                </div>
                <div className="home-stat-bar">
                  <div
                    style={{
                      width: `${Math.max(5, dailyPct)}%`,
                      background: "#f76707",
                      height: "100%",
                      borderRadius: "4px",
                      transition: "width .5s ease",
                    }}
                  />
                </div>
                <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#f76707" }}>
                  🔥 {t("home.dailyStreakText", "3 kunlik faol seriya")}
                </div>
              </article>

              {/* Metric 2: Practiced Questions */}
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
                    style={{ background: "linear-gradient(135deg,#4dabf7,#1971c2)" }}
                  >
                    <IconCheck size={22} color="#fff" stroke={2.5} />
                  </div>
                  <div>
                    <div className="home-stat-value">
                      {qPracticed} / {qTotal}
                    </div>
                    <div className="home-stat-label">
                      {t("home.questionsPracticed", "Yechilgan savollar")}
                    </div>
                  </div>
                  <span className="home-stat-pct" style={{ color: "#1971c2" }}>
                    {qPracticedPct}%
                  </span>
                </div>
                <div className="home-stat-bar">
                  <div
                    style={{
                      width: `${Math.max(5, qPracticedPct)}%`,
                      background: "#1971c2",
                      height: "100%",
                      borderRadius: "4px",
                      transition: "width .5s ease",
                    }}
                  />
                </div>
                <div style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)" }}>
                  {t("home.practicedSub", "Jami 1190 ta savoldan o'zlashtirildi")}
                </div>
              </article>

              {/* Metric 3: Overall Readiness (Pleasant Amber, No Stress) */}
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
                    style={{ background: "linear-gradient(135deg,#fcc419,#f59f00)" }}
                  >
                    <IconTargetArrow size={22} color="#fff" />
                  </div>
                  <div>
                    <div className="home-stat-value">{overallPct}%</div>
                    <div className="home-stat-label">
                      {t("home.overallReadiness", "Umumiy o'zlashtirish")}
                    </div>
                  </div>
                  <span className="home-stat-pct" style={{ color: "#f59f00" }}>
                    {overallPct}%
                  </span>
                </div>
                <div className="home-stat-bar">
                  <div
                    style={{
                      width: `${Math.max(5, overallPct)}%`,
                      background: "#f59f00",
                      height: "100%",
                      borderRadius: "4px",
                      transition: "width .5s ease",
                    }}
                  />
                </div>
                <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#d97706" }}>
                  {levelLabel}
                </div>
              </article>
            </section>

            {/* 3. Dynamic "Next Best Action" Focus Block */}
            <WeakTopicsWidget userId={userId} />

            {/* 4. Primary 4-Education Modes (2x2 Clean Clickable Grid) */}
            <section className="primary-edu-section" aria-label="Asosiy ta'lim rejimlari">
              <div className="section-headline">
                <h3>{t("home.primaryEduTitle", "Asosiy ta'lim rejimlari")}</h3>
                <p>{t("home.primaryEduSubtitle", "O'rganish ketma-ketligi bo'yicha rejimni tanlang")}</p>
              </div>
              <div className="primary-education-grid">
                {primaryEducationModes.map((m) => (
                  <article
                    key={m.screen}
                    className={`primary-edu-card${m.featured ? " featured" : ""}`}
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
                    {m.featured && (
                      <span className="primary-edu-badge">
                        {m.badgeText}
                      </span>
                    )}
                    <div className="primary-edu-left">
                      <div
                        className="primary-edu-icon"
                        style={{ background: m.gradient }}
                      >
                        <m.icon size={26} stroke={1.8} color="#fff" />
                      </div>
                      <div className="primary-edu-info">
                        <h4 className="primary-edu-title">{m.title}</h4>
                        <p className="primary-edu-desc">{m.desc}</p>
                      </div>
                    </div>
                    <div className="primary-edu-action-arrow">
                      <IconArrowRight size={18} stroke={2.5} />
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* 5. Secondary Tools Grid (4 Compact Analytics Cards) */}
            <section className="secondary-tools-section" aria-label="Tahlil va shaxsiy vositalar">
              <div className="section-headline">
                <h3>{t("home.secondaryToolsTitle", "Tahlil va shaxsiy vositalar")}</h3>
                <p>{t("home.secondaryToolsSubtitle", "Xatolaringiz, saqlangan savollar va shaxsiy natijalaringiz")}</p>
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

            {/* Footer */}
            <footer className="home-footer">
              <div className="home-footer-inner">
                <p className="home-footer-title">{t("home.socialTitle", "Bizni ijtimoiy tarmoqlarda kuzating")}</p>
                <div className="home-footer-cards">
                  {SOCIAL_LINKS.map((s) => (
                    <button
                      key={s.label}
                      className="home-footer-btn"
                      style={{ "--btn-gradient": s.gradient } as React.CSSProperties}
                      onClick={() => setQrModal(s)}
                      type="button"
                    >
                      <s.icon size={20} stroke={1.8} />
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </footer>

            {/* QR Modal */}
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
                    <p className="qr-modal-hint">{t("home.scanQr", "QR kodni skanerlang")}</p>
                  </div>
                  <button
                    className="qr-modal-close"
                    onClick={() => setQrModal(null)}
                    type="button"
                    aria-label={t("common.cancel", "Bekor qilish")}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Exam Picker Modal */}
            {showExamPicker && (
              <div className="modal-overlay" onClick={() => setShowExamPicker(false)}>
                <div
                  className="modal-card exam-picker-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="modal-title">{t("home.examPickerTitle", "Nechta savoldan imtihon?")}</h3>
                  <div className="exam-picker-grid">
                    {EXAM_OPTIONS.map((count) => (
                      <button
                        key={count}
                        className="exam-picker-btn"
                        onClick={() => handleStartExam(count)}
                        type="button"
                      >
                        <span className="exam-picker-num">{count}</span>
                        <span className="exam-picker-label">{t("home.questionUnit", "ta savol")}</span>
                        <span className="exam-picker-time">{count} {t("home.minuteUnit", "daq")}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    className="modal-btn-cancel"
                    onClick={() => setShowExamPicker(false)}
                    type="button"
                  >
                    {t("common.cancel", "Bekor qilish")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
