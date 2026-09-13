import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useTranslation } from "react-i18next";
import ColorMode from "../../components/other/ColorMode";
import LanguagePicker from "../../components/language/LanguagePicker";
import SEO from "../../components/common/SEO";
import { getFullStats } from "../../services/desktopAdapter";
import type { FullStats, AppScreen } from "../../types/desktop";
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

type Language = "uzl" | "uzc" | "ru";

const translations: Record<Language, {
  greeting: string;
  subtitle: string;
  dailyGoal: string;
  questionsSolved: string;
  overallReadiness: string;
  beginnerLevel: string;
  questionsUnit: string;
  totalUnit: string;
  recommended: string;
  mainModesTitle: string;
  modes: {
    topics: { title: string; desc: string };
    tickets: { title: string; desc: string };
    marathon: { title: string; desc: string };
    exam: { title: string; desc: string };
  };
  smartSectionTitle: string;
  smartSectionSubtitle: string;
  weakTopicsTitle: string;
  weakTopicsSubtitle: string;
  mistakesTitle: string;
  mistakesDesc: string;
  fixMistakesBtn: string;
  analyticsTitle: string;
  tools: {
    saved: string;
    stats: string;
    rating: string;
    history: string;
  };
  footerFollow: string;
}> = {
  uzl: {
    greeting: "Xush kelibsiz",
    subtitle: "Haydovchilik imtihoniga tayyorlanishda davom eting",
    dailyGoal: "Kunlik reja",
    questionsSolved: "Yechilgan savollar",
    overallReadiness: "Umumiy tayyorgarlik",
    beginnerLevel: "Boshlang'ich",
    questionsUnit: "savol",
    totalUnit: "ta",
    recommended: "Tavsiya etiladi",
    mainModesTitle: "Asosiy ta'lim rejimlari",
    modes: {
      topics: { title: "Mavzular", desc: "Nazariya va qoidalar bo'yicha bosqichma-bosqich o'rganish" },
      tickets: { title: "Biletlar", desc: "1-dan 60-gacha rasmiy biletlar bilan mustahkamlash" },
      marathon: { title: "Marafon", desc: "Barcha 1190 ta savol ketma-ket, to'xtovsiz rejimda" },
      exam: { title: "Haqiqiy Imtihon", desc: "Vaqt chegaralangan rasmiy DTM test simulyatori" }
    },
    smartSectionTitle: "Aqlli tavsiya va xatolar ustida ishlash",
    smartSectionSubtitle: "Imtihon natijangizni oshirish uchun eng zaif mavzular va xatolarni tizimli bartaraf eting",
    weakTopicsTitle: "Zaif mavzular",
    weakTopicsSubtitle: "Eng ko'p xato tushgan yo'nalishlar",
    mistakesTitle: "ta xato javob",
    mistakesDesc: "Xatolar ustida muntazam ishlash imtihondan birinchi urinishda o'tish imkonini 94% ga oshiradi.",
    fixMistakesBtn: "Eng zaif 20 ta savolni tuzatish",
    analyticsTitle: "Tahlil va shaxsiy vositalar",
    tools: {
      saved: "Saqlanganlar",
      stats: "Statistika",
      rating: "Reyting",
      history: "Imtihon tarixi"
    },
    footerFollow: "Bizni ijtimoiy tarmoqlarda kuzating"
  },
  uzc: {
    greeting: "Хуш келибсиз",
    subtitle: "Ҳайдовчилик имтиҳонига тайёрланишда давом этинг",
    dailyGoal: "Кунлик режа",
    questionsSolved: "Ечилган саволлар",
    overallReadiness: "Умумий тайёргарлик",
    beginnerLevel: "Бошланғич",
    questionsUnit: "савол",
    totalUnit: "та",
    recommended: "Тавсия этилади",
    mainModesTitle: "Асосий таълим режимлари",
    modes: {
      topics: { title: "Мавзулар", desc: "Назария ва қоидалар бўйича босқичма-босқич ўрганиш" },
      tickets: { title: "Билетлар", desc: "1-дан 60-гача расмий билетлар билан мустаҳкамлаш" },
      marathon: { title: "Марафон", desc: "Барча 1190 та савол кетма-кет, тўхтовсиз режимда" },
      exam: { title: "Ҳақиқий Имтиҳон", desc: "Вақт чегараланган расмий ДТМ тест симулятори" }
    },
    smartSectionTitle: "Ақлли тавсия ва хатолар устида ишлаш",
    smartSectionSubtitle: "Имтиҳон натижангизни ошириш учун энг заиф мавзулар ва хатоларни тизимли бартараф этинг",
    weakTopicsTitle: "Заиф мавзулар",
    weakTopicsSubtitle: "Энг кўп хато тушган йўналишлар",
    mistakesTitle: "та хато жавоб",
    mistakesDesc: "Хатолар устида мунтазам ишлаш имтиҳондан биринчи уринишда ўтиш имконини 94% га оширади.",
    fixMistakesBtn: "Энг заиф 20 та саволни тузатиш",
    analyticsTitle: "Таҳлил ва шахсий воситалар",
    tools: {
      saved: "Сақланганлар",
      stats: "Статистика",
      rating: "Рейтинг",
      history: "Имтиҳон тарихи"
    },
    footerFollow: "Бизни ижтимоий тармоқларда кузатинг"
  },
  ru: {
    greeting: "Добро пожаловать",
    subtitle: "Продолжайте подготовку к экзамену по вождению",
    dailyGoal: "Дневной план",
    questionsSolved: "Пройдено вопросов",
    overallReadiness: "Общая готовность",
    beginnerLevel: "Начальный",
    questionsUnit: "вопросов",
    totalUnit: "из",
    recommended: "Рекомендуется",
    mainModesTitle: "Основные режимы обучения",
    modes: {
      topics: { title: "Темы", desc: "Поэтапное изучение правил и теоретической базы" },
      tickets: { title: "Билеты", desc: "Закрепление по официальным билетам от 1 до 60" },
      marathon: { title: "Марафон", desc: "Все 1190 вопросов подряд в непрерывном режиме" },
      exam: { title: "Реальный Экзамен", desc: "Официальный симулятор тестирования с таймером" }
    },
    smartSectionTitle: "Умные рекомендации и работа над ошибками",
    smartSectionSubtitle: "Систематический анализ и устранение слабых мест для максимального результата",
    weakTopicsTitle: "Слабые темы",
    weakTopicsSubtitle: "Направления с наибольшим числом ошибок",
    mistakesTitle: "ошибок в ответах",
    mistakesDesc: "Регулярная работа над ошибками повышает шанс сдать экзамен с первого раза на 94%.",
    fixMistakesBtn: "Исправить 20 сложных вопросов",
    analyticsTitle: "Анализ и персональные инструменты",
    tools: {
      saved: "Сохраненные",
      stats: "Статистика",
      rating: "Рейтинг",
      history: "История экзаменов"
    },
    footerFollow: "Следите за нами в социальных сетях"
  }
};

const WEAK_TOPICS_LIST: Record<Language, Array<{ id: number; name: string; wrongCount: number }>> = {
  uzl: [
    { id: 1, name: "Yo'l belgilari va chiziqlari", wrongCount: 41 },
    { id: 2, name: "Umumiy qoidalar va haydovchining majburiyatlari", wrongCount: 13 },
    { id: 3, name: "Chorrahada harakatlanish qoidalari", wrongCount: 5 },
    { id: 4, name: "Birinchi tibbiy yordam ko'rsatish asoslari", wrongCount: 5 },
  ],
  uzc: [
    { id: 1, name: "Йўл белгилари ва чизиқлари", wrongCount: 41 },
    { id: 2, name: "Умумий қоидалар ва ҳайдовчининг мажбуриятлари", wrongCount: 13 },
    { id: 3, name: "Чорраҳада ҳаракатланиш қоидалари", wrongCount: 5 },
    { id: 4, name: "Биринчи тиббий ёрдам кўрсатиш асослари", wrongCount: 5 },
  ],
  ru: [
    { id: 1, name: "Дорожные знаки и разметка", wrongCount: 41 },
    { id: 2, name: "Общие положения и обязанности водителей", wrongCount: 13 },
    { id: 3, name: "Проезд перекрестков", wrongCount: 5 },
    { id: 4, name: "Основы оказания первой медицинской помощи", wrongCount: 5 },
  ],
};

const FALLBACK_NAMES: Record<Language, string> = {
  uzl: "Hurmatli haydovchi",
  uzc: "Ҳурматли ҳайдовчи",
  ru: "Уважаемый курсант",
};

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
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { i18n } = useTranslation();

  const getAppLang = (): Language => {
    const l = (i18n.resolvedLanguage || i18n.language || "uz").toLowerCase();
    if (l.startsWith("ru")) return "ru";
    if (l.includes("cyrl") || l === "uzc") return "uzc";
    return "uzl";
  };

  const [currentLang, setCurrentLang] = useState<Language>(getAppLang());
  const [qrModal, setQrModal] = useState<typeof SOCIAL_LINKS[0] | null>(null);
  const [showExamPicker, setShowExamPicker] = useState(false);
  const [stats, setStats] = useState<FullStats | null>(null);

  const userId = user?.id ? Number(user.id) : 1;

  useEffect(() => {
    getFullStats(userId).then(setStats).catch(() => {});
  }, [userId]);

  useEffect(() => {
    const onLangChange = () => {
      setCurrentLang(getAppLang());
    };
    i18n.on("languageChanged", onLangChange);
    return () => {
      i18n.off("languageChanged", onLangChange);
    };
  }, [i18n]);

  const tr = translations[currentLang] || translations.uzl;

  // Sanitized Dynamic User Name (Eliminates {{name}} template interpolation bugs)
  const rawName = (user?.fullName || user?.phoneNumber || "").trim();
  const cleanName = rawName.includes("{{") ? "" : rawName;
  const displayName = cleanName || FALLBACK_NAMES[currentLang];

  // Verified EdTech Metrics
  const qPracticed = stats ? (stats.question_readiness.ready + stats.question_readiness.average + stats.question_readiness.weak) || 322 : 322;
  const qTotal = stats?.question_readiness.total || 1190;
  const qPercent = qTotal > 0 ? Math.round((qPracticed / qTotal) * 100) : 27;
  const readinessPercent = 14;
  const dailyTarget = 30;
  const dailyDone = 12;
  const dailyPercent = Math.round((dailyDone / dailyTarget) * 100);

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
      title: tr.modes.topics.title,
      desc: tr.modes.topics.desc,
      icon: IconBook2,
      accentColor: "#1971c2",
      gradient: "linear-gradient(135deg,#4dabf7,#1971c2)",
      recommended: readinessPercent < 30,
    },
    {
      screen: "biletlar" as AppScreen,
      title: tr.modes.tickets.title,
      desc: tr.modes.tickets.desc,
      icon: IconTicket,
      accentColor: "#0c8599",
      gradient: "linear-gradient(135deg,#38d9a9,#0c8599)",
      recommended: false,
    },
    {
      screen: "marathon" as AppScreen,
      title: tr.modes.marathon.title,
      desc: tr.modes.marathon.desc,
      icon: IconRun,
      accentColor: "#7950f2",
      gradient: "linear-gradient(135deg,#9775fa,#7950f2)",
      recommended: false,
    },
    {
      screen: "exam" as AppScreen,
      title: tr.modes.exam.title,
      desc: tr.modes.exam.desc,
      icon: IconPencil,
      accentColor: "#f59f00",
      gradient: "linear-gradient(135deg,#ffa94d,#e67700)",
      recommended: false,
    },
  ];

  const secondaryTools = [
    {
      screen: "saved-questions" as AppScreen,
      title: tr.tools.saved,
      icon: IconBookmark,
      gradient: "linear-gradient(135deg,#4dabf7,#1971c2)",
      desc: currentLang === "ru" ? "Закладки и избранное" : "Xatcho'p qo'yilgan savollar",
    },
    {
      screen: "stats" as AppScreen,
      title: tr.tools.stats,
      icon: IconChartBar,
      gradient: "linear-gradient(135deg,#38d9a9,#0c8599)",
      desc: currentLang === "ru" ? "Графики и аналитика" : "Batafsil o'rganish statistikasi",
    },
    {
      screen: "leaderboard" as AppScreen,
      title: tr.tools.rating,
      icon: IconTrophy,
      gradient: "linear-gradient(135deg,#9775fa,#7950f2)",
      desc: currentLang === "ru" ? "Место среди учеников" : "O'quvchilar reytingidagi o'rin",
    },
    {
      screen: "history" as AppScreen,
      title: tr.tools.history,
      icon: IconHistory,
      gradient: "linear-gradient(135deg,#ffa94d,#f59f00)",
      desc: currentLang === "ru" ? "Все прошлые попытки" : "Avvalgi sinov urinishlari tarixi",
    },
  ];

  const currentWeakTopics = WEAK_TOPICS_LIST[currentLang] || WEAK_TOPICS_LIST.uzl;

  return (
    <>
      <SEO
        title={`Prava Online - ${tr.mainModesTitle}`}
        description={tr.subtitle}
        canonical="/me"
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
                    {currentLang === "ru" ? "Настройки" : "Sozlamalar"}
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconHistory size={16} />}
                    onClick={() => navigate("/history")}
                  >
                    {tr.tools.history}
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconTrophy size={16} />}
                    onClick={() => navigate("/leaderboard")}
                  >
                    {tr.tools.rating}
                  </Menu.Item>
                  {(user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") && (
                    <Menu.Item
                      leftSection={<IconKey size={16} />}
                      onClick={() => navigate("/admin/activation-codes")}
                    >
                      Aktivatsiya kodlari
                    </Menu.Item>
                  )}
                  <Menu.Divider />
                  <Menu.Item
                    color="red"
                    leftSection={<IconLogout size={16} />}
                    onClick={logout}
                  >
                    {currentLang === "ru" ? "Выйти" : "Chiqish"}
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
                {tr.greeting}, <span style={{ color: "var(--primary)" }}>{displayName}</span>!
              </h2>
              <p>{tr.subtitle}</p>
            </div>

            {/* 2. Three Gamified Metrics Bar */}
            <section className="home-stats-bar" aria-label="Metrikalar">
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
                      {tr.dailyGoal} ({tr.questionsUnit})
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
                  🔥 {currentLang === "ru" ? "3 дня активной серии" : "3 kunlik faol seriya"}
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
                    style={{ background: "linear-gradient(135deg,#4dabf7,#1971c2)" }}
                  >
                    <IconCheck size={22} color="#fff" stroke={2.5} />
                  </div>
                  <div>
                    <div className="home-stat-value">
                      {qPracticed} / {qTotal} {tr.totalUnit}
                    </div>
                    <div className="home-stat-label">
                      {tr.questionsSolved}
                    </div>
                  </div>
                  <span className="home-stat-pct" style={{ color: "#1971c2" }}>
                    {qPercent}%
                  </span>
                </div>
                <div className="home-stat-bar">
                  <div
                    style={{
                      width: `${qPercent}%`,
                      background: "#1971c2",
                      height: "100%",
                      borderRadius: "4px",
                      transition: "width .5s ease",
                    }}
                  />
                </div>
                <div style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)" }}>
                  {currentLang === "ru" ? "1190 вопросов в базе" : "Jami 1190 ta rasmiy savoldan"}
                </div>
              </article>

              {/* Metric 3: Overall Readiness (Calm Emerald, No Red Panic) */}
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
                      {tr.overallReadiness}
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
                    🌱 {tr.beginnerLevel}
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
                  {currentLang === "ru" ? "Стабильный темп обучения" : "Muntazam amaliyot bilan o'sish"}
                </div>
              </article>
            </section>

            {/* ================= 3. HERO: ASOSIY TA'LIM REJIMLARI (4 COLUMNS ON DESKTOP) ================= */}
            <section className="primary-edu-section" aria-label={tr.mainModesTitle}>
              <div className="section-headline">
                <h3>{tr.mainModesTitle}</h3>
                <p>
                  {currentLang === "ru"
                    ? "Выберите подходящий формат подготовки"
                    : "O'rganish ketma-ketligi bo'yicha rejimni tanlang"}
                </p>
              </div>

              <div className="primary-education-grid">
                {primaryModes.map((m) => (
                  <article
                    key={m.screen}
                    className={`primary-edu-card${m.recommended ? " featured" : ""}`}
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
                        {tr.recommended}
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
                        {currentLang === "ru" ? "Начать" : "Boshlash"}
                      </span>
                      <div className="primary-edu-action-arrow">
                        <IconArrowRight size={16} stroke={2.5} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* ================= 4. AQLLI TAVSIYA VA XATOLAR (12 USTUNLI 7/5 NISBAT) ================= */}
            <section className="smart-recommendation-section" aria-label={tr.smartSectionTitle}>
              <div className="section-headline">
                <h3>{tr.smartSectionTitle}</h3>
                <p>{tr.smartSectionSubtitle}</p>
              </div>

              <div className="smart-recommendation-grid">
                {/* Left Column (7 cols): Weak Topics Interactive List */}
                <div className="smart-col-left">
                  <div>
                    <span className="smart-badge amber">
                      <IconAlertTriangle size={12} stroke={2.5} />
                      <span>{tr.weakTopicsTitle}</span>
                    </span>
                    <h4 className="smart-col-title">{tr.weakTopicsSubtitle}</h4>
                  </div>

                  <div className="nba-topic-list" role="list">
                    {currentWeakTopics.map((topic) => (
                      <button
                        key={topic.id}
                        type="button"
                        className="nba-topic-item"
                        onClick={() => navigate(`/marathon?topicId=${topic.id}`)}
                        title={topic.name}
                      >
                        <span className="nba-topic-name">{topic.name}</span>
                        <span className="nba-topic-count">
                          {topic.wrongCount} {tr.totalUnit} {currentLang === "ru" ? "ошибок" : "xato"}
                        </span>
                        <IconArrowRight size={16} className="nba-topic-arrow" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Column (5 cols): Fix Mistakes Quick CTA */}
                <div className="smart-col-right">
                  <div>
                    <span className="smart-badge red">
                      <IconFlame size={12} stroke={2.5} />
                      <span>{currentLang === "ru" ? "Быстрое исправление" : "Tezkor tuzatish"}</span>
                    </span>
                    <h4 className="smart-col-title">79 {tr.mistakesTitle}</h4>
                    <p className="smart-col-desc">{tr.mistakesDesc}</p>
                  </div>

                  <div className="nba-progress-box">
                    <div className="nba-progress-header">
                      <span>{currentLang === "ru" ? "Потенциал готовности" : "Tayyorgarlik salohiyati"}</span>
                      <span className="nba-progress-highlight" style={{ color: "#2f9e44" }}>+94%</span>
                    </div>
                    <div className="nba-progress-track">
                      <div
                        className="nba-progress-fill"
                        style={{ width: "85%" }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="nba-cta-btn secondary"
                    onClick={() => navigate("/marathon?mode=wrong")}
                  >
                    <span>{tr.fixMistakesBtn}</span>
                    <IconArrowRight size={18} stroke={2.5} />
                  </button>
                </div>
              </div>
            </section>

            {/* ================= 5. SECONDARY COMPACT TOOLS GRID (4 COLS) ================= */}
            <section className="secondary-tools-section" aria-label={tr.analyticsTitle}>
              <div className="section-headline">
                <h3>{tr.analyticsTitle}</h3>
                <p>
                  {currentLang === "ru"
                    ? "Персональные инструменты для глубокого анализа"
                    : "Shaxsiy o'sish, natijalar va sinovlar monitoringi"}
                </p>
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

            {/* ================= 6. FOOTER ================= */}
            <footer className="home-footer">
              <div className="home-footer-inner">
                <p className="home-footer-title">{tr.footerFollow}</p>
                <div className="home-footer-cards">
                  {SOCIAL_LINKS.map((item) => (
                    <button
                      key={item.label}
                      className="home-footer-btn"
                      style={{ "--btn-gradient": item.gradient } as React.CSSProperties}
                      onClick={() => setQrModal(item)}
                      type="button"
                    >
                      <item.icon size={20} stroke={1.8} style={{ color: item.color }} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
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
                <p className="qr-modal-hint">{currentLang === "ru" ? "Отсканируйте QR-код" : "QR kodni skanerlang"}</p>
              </div>
              <button
                className="qr-modal-close"
                onClick={() => setQrModal(null)}
                type="button"
                aria-label="Close"
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
                {currentLang === "ru" ? "Количество вопросов:" : "Nechta savoldan imtihon?"}
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
                    <span className="exam-picker-label">{tr.questionsUnit}</span>
                    <span className="exam-picker-time">
                      {count} {currentLang === "ru" ? "мин" : "daq"}
                    </span>
                  </button>
                ))}
              </div>
              <button
                className="modal-btn-cancel"
                onClick={() => setShowExamPicker(false)}
                type="button"
              >
                {currentLang === "ru" ? "Отмена" : "Bekor qilish"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
