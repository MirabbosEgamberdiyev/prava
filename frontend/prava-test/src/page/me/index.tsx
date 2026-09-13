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
  IconPlayerPlayFilled,
  IconBrandInstagram,
  IconBrandTelegram,
  IconBrandYoutube,
  IconWorld,
  IconAlertTriangle,
  IconBookmark,
  IconQuestionMark,
  IconTargetArrow,
  IconTrophy,
  IconHistory,
  IconSettings,
  IconChevronDown,
  IconKey,
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
  {
    label: "Website",
    handle: "pravaonline.uz",
    url: "https://pravaonline.uz/",
    icon: IconWorld,
    gradient: "linear-gradient(135deg,#4dabf7,#1971c2)",
    color: "#1971c2",
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

  const menus = [
    {
      icon: <IconPencil size={28} stroke={1.5} color="#fff" />,
      label: t("home.exam", "Imtihon"),
      desc: t("home.examDesc", "Haqiqiy imtihon formatida bilimingizni sinab ko'ring"),
      color: "#7950f2",
      gradient: "linear-gradient(135deg,#9775fa,#7950f2)",
      screen: "exam" as AppScreen,
      featured: true,
    },
    {
      icon: <IconBook2 size={28} stroke={1.5} color="#fff" />,
      label: t("home.topics", "Mavzular"),
      desc: t("home.topicsDesc", "Yo'l harakati qoidalarini mavzular bo'yicha o'rganing"),
      color: "#1971c2",
      gradient: "linear-gradient(135deg,#4dabf7,#1971c2)",
      screen: "topics" as AppScreen,
    },
    {
      icon: <IconTicket size={28} stroke={1.5} color="#fff" />,
      label: t("home.biletlar", "Biletlar"),
      desc: t("home.biletlarDesc", "Barcha biletlarni ketma-ket yechib chiqing"),
      color: "#0c8599",
      gradient: "linear-gradient(135deg,#38d9a9,#0c8599)",
      screen: "biletlar" as AppScreen,
    },
    {
      icon: <IconRun size={28} stroke={1.5} color="#fff" />,
      label: t("home.marathon", "Marafon"),
      desc: t("home.marathonDesc", "Barcha savollar ketma-ket"),
      color: "#e03131",
      gradient: "linear-gradient(135deg,#f06595,#c2255c)",
      screen: "marathon" as AppScreen,
    },
    {
      icon: <IconChartBar size={28} stroke={1.5} color="#fff" />,
      label: t("home.stats", "Statistika"),
      desc: t("home.statsDesc", "Natijalaringiz va progress"),
      color: "#e67700",
      gradient: "linear-gradient(135deg,#ffa94d,#e67700)",
      screen: "stats" as AppScreen,
    },
    {
      icon: <IconAlertTriangle size={28} stroke={1.5} color="#fff" />,
      label: t("home.wrongAnswers", "Xatolar"),
      desc: t("home.wrongAnswersDesc", "Xato javob berilgan savollar"),
      color: "#e03131",
      gradient: "linear-gradient(135deg,#ff6b6b,#e03131)",
      screen: "wrong-answers" as AppScreen,
    },
    {
      icon: <IconBookmark size={28} stroke={1.5} color="#fff" />,
      label: t("home.saved", "Saqlangan"),
      desc: t("home.savedDesc", "Siz saqlagan savollar"),
      color: "#1971c2",
      gradient: "linear-gradient(135deg,#4dabf7,#1971c2)",
      screen: "saved-questions" as AppScreen,
    },
    {
      icon: <IconTrophy size={28} stroke={1.5} color="#fff" />,
      label: t("home.leaderboard", "Reyting"),
      desc: t("home.leaderboardDesc", "Barcha foydalanuvchilar o'rtasidagi o'rningiz"),
      color: "#f59f00",
      gradient: "linear-gradient(135deg,#fcc419,#f59f00)",
      screen: "leaderboard" as AppScreen,
    },
    {
      icon: <IconHistory size={28} stroke={1.5} color="#fff" />,
      label: t("home.history", "Imtihon tarixi"),
      desc: t("home.historyDesc", "Topshirilgan testlar va imtihonlar natijalari"),
      color: "#1098ad",
      gradient: "linear-gradient(135deg,#22b8cf,#1098ad)",
      screen: "history" as AppScreen,
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
            <div className="home-welcome">
              <h2>{t("home.welcome", { name: userName })}</h2>
              <p>{t("home.subtitle", "Haydovchilik guvohnomasi imtihoniga tayyorgarlik ko'ring")}</p>
            </div>

            <div className="home-stats-bar">
              {(() => {
                const ticketReady = stats?.ticket_ready ?? 0;
                const ticketAverage = stats?.ticket_average ?? 0;
                const ticketTotal = stats?.ticket_total ?? 60;
                const qReady = stats?.question_readiness.ready ?? 0;
                const qAverage = stats?.question_readiness.average ?? 0;
                const qWeak = stats?.question_readiness.weak ?? 0;
                const qTotal = stats?.question_readiness.total ?? 1190;
                const qPracticed = qReady + qAverage + qWeak;

                const ticketReadyPct =
                  ticketTotal > 0 ? Math.round((ticketReady / ticketTotal) * 100) : 0;
                const ticketAvgPct =
                  ticketTotal > 0 ? Math.round((ticketAverage / ticketTotal) * 100) : 0;
                const qPracticedPct =
                  qTotal > 0 ? Math.round((qPracticed / qTotal) * 100) : 0;
                const overallPct =
                  ticketTotal > 0
                    ? Math.round((ticketReadyPct + qPracticedPct) / 2)
                    : qPracticedPct;

                const cards = [
                  {
                    icon: <IconTicket size={22} color="#fff" />,
                    gradient: "linear-gradient(135deg,#38d9a9,#0c8599)",
                    accentColor: "#0c8599",
                    value: `${ticketReady}/${ticketTotal}`,
                    pct: ticketReadyPct,
                    label: t("home.ticketsReady", "Tayyor biletlar"),
                    bars: [
                      { pct: ticketReadyPct, color: "#0c8599" },
                      { pct: ticketAvgPct, color: "#e67700" },
                      {
                        pct: Math.max(0, 100 - ticketReadyPct - ticketAvgPct),
                        color: "var(--border)",
                      },
                    ],
                  },
                  {
                    icon: <IconQuestionMark size={22} color="#fff" />,
                    gradient: "linear-gradient(135deg,#9775fa,#7950f2)",
                    accentColor: "#7950f2",
                    value: `${qPracticed}/${qTotal}`,
                    pct: qPracticedPct,
                    label: t("home.questionsPracticed", "Ishlangan savollar"),
                    bars: [
                      { pct: Math.round((qReady / qTotal) * 100), color: "#7950f2" },
                      { pct: Math.round((qAverage / qTotal) * 100), color: "#e67700" },
                      { pct: Math.round((qWeak / qTotal) * 100), color: "#ff6b6b" },
                      {
                        pct: Math.max(0, 100 - qPracticedPct),
                        color: "var(--border)",
                      },
                    ],
                  },
                  {
                    icon: <IconTargetArrow size={22} color="#fff" />,
                    gradient:
                      overallPct >= 80
                        ? "linear-gradient(135deg,#69db7c,#2f9e44)"
                        : overallPct >= 40
                        ? "linear-gradient(135deg,#ffa94d,#e67700)"
                        : "linear-gradient(135deg,#ff6b6b,#e03131)",
                    accentColor:
                      overallPct >= 80 ? "#2f9e44" : overallPct >= 40 ? "#e67700" : "#e03131",
                    value: `${overallPct}%`,
                    pct: overallPct,
                    label: t("home.overallReadiness", "Umumiy tayyorgarlik"),
                    bars: [
                      {
                        pct: overallPct,
                        color:
                          overallPct >= 80
                            ? "#2f9e44"
                            : overallPct >= 40
                            ? "#e67700"
                            : "#e03131",
                      },
                      { pct: Math.max(0, 100 - overallPct), color: "var(--border)" },
                    ],
                  },
                ];

                return cards.map((s, i) => (
                  <div
                    key={i}
                    className="home-stat"
                    onClick={() => handleNav("stats")}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="home-stat-top">
                      <div className="home-stat-icon" style={{ background: s.gradient }}>
                        {s.icon}
                      </div>
                      <div>
                        <div className="home-stat-value">{s.value}</div>
                        <div className="home-stat-label">{s.label}</div>
                      </div>
                      <span className="home-stat-pct" style={{ color: s.accentColor }}>
                        {s.pct}%
                      </span>
                    </div>
                    <div className="home-stat-bar">
                      {s.bars.map(
                        (b, j) =>
                          b.pct > 0 && (
                            <div
                              key={j}
                              style={{
                                width: `${b.pct}%`,
                                background: b.color,
                                height: "100%",
                                borderRadius:
                                  j === 0
                                    ? "4px 0 0 4px"
                                    : j === s.bars.length - 1
                                    ? "0 4px 4px 0"
                                    : 0,
                                transition: "width .5s ease",
                              }}
                            />
                          )
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Smart Weak Topics AI Advisor */}
            <WeakTopicsWidget userId={userId} />

            <div className="home-menu-grid">
              {menus.map((m, i) => (
                <button
                  key={m.screen}
                  className={`home-menu-card${m.featured ? " featured" : ""}`}
                  onClick={() => handleNav(m.screen)}
                  style={{ "--accent": m.color } as React.CSSProperties}
                  type="button"
                >
                  {m.featured && (
                    <span className="home-menu-badge">
                      {t("home.featuredBadge", "Tavsiya etiladi")}
                    </span>
                  )}
                  <span className="home-menu-num">{i + 1}</span>
                  <div
                    className="home-menu-icon"
                    style={{ background: m.gradient ?? m.color + "18" }}
                  >
                    {m.icon}
                  </div>
                  <div className="home-menu-label">{m.label}</div>
                  <div className="home-menu-desc">{m.desc}</div>
                  <span className="home-menu-start">
                    <IconPlayerPlayFilled size={13} />
                    {t("home.start", "Boshlash")}
                  </span>
                </button>
              ))}
            </div>

            {/* Footer */}
            <footer className="home-footer">
              <div className="home-footer-inner">
                <p className="home-footer-title">{t("home.socialTitle", "Bizni ijtimoiy tarmoqlarda kuzating")}</p>
                <div className="home-footer-cards">
                  {SOCIAL_LINKS.map((s) => (
                    <button
                      key={s.label}
                      className="home-footer-btn"
                      style={{ background: s.gradient }}
                      onClick={() => setQrModal(s)}
                      type="button"
                    >
                      <s.icon size={20} stroke={1.8} color="#fff" />
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
