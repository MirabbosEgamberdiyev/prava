import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { OfflineTopic } from "../../types/desktop";
import { getTopics } from "../../services/desktopAdapter";
import { useDesktopTheme } from "../../context/DesktopThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import SEO from "../../components/common/SEO";
import {
  IconSearch,
  IconBook2,
  IconPlayerPlay,
  IconListNumbers,
  IconX,
} from "@tabler/icons-react";
import styles from "../../components/dashboard/Dashboard.module.css";

// Light mode palette (WCAG AA compliant contrast ratio >= 4.5:1)
const PALETTE = [
  { bg: "#e7f5ff", color: "#1971c2", border: "#74c0fc" },
  { bg: "#ebfbee", color: "#2b8a3e", border: "#8ce99a" },
  { bg: "#fef3c7", color: "#b45309", border: "#fcd34d" },
  { bg: "#f3f0ff", color: "#6741d9", border: "#b197fc" },
  { bg: "#e3fafc", color: "#0b7285", border: "#66d9e8" },
  { bg: "#fff0f6", color: "#c2255c", border: "#f783ac" },
  { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  { bg: "#e6fcf5", color: "#087f5b", border: "#63e6be" },
  { bg: "#f8f0fc", color: "#9c36b5", border: "#da77f2" },
  { bg: "#fff5f5", color: "#c92a2a", border: "#ff8787" },
];

// Dark mode palette
const PALETTE_DARK = [
  { bg: "#1864ab22", color: "#74c0fc", border: "#1971c240" },
  { bg: "#2f9e4422", color: "#8ce99a", border: "#2f9e4440" },
  { bg: "#e6770022", color: "#ffd43b", border: "#e6770040" },
  { bg: "#6741d922", color: "#b197fc", border: "#6741d940" },
  { bg: "#0c859922", color: "#66d9e8", border: "#0c859940" },
  { bg: "#c2255c22", color: "#f783ac", border: "#c2255c40" },
  { bg: "#e8590c22", color: "#ffa94d", border: "#e8590c40" },
  { bg: "#09926822", color: "#63e6be", border: "#09926840" },
  { bg: "#9c36b522", color: "#da77f2", border: "#9c36b540" },
  { bg: "#e0313122", color: "#ffa8a8", border: "#e0313140" },
];

export default function Topics_Page() {
  const { t } = useTranslation();
  const { localizeTopic } = useLanguage();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<OfflineTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getTopics()
      .then(setTopics)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const { resolvedTheme } = useDesktopTheme();
  const isDark = resolvedTheme === "dark";

  const onStartTopicTest = (topicId: number) => {
    navigate(`/marafon?topicId=${topicId}`);
  };

  const filtered = (Array.isArray(topics) ? topics : []).filter((tp) =>
    localizeTopic(tp).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <SEO
        title={t("seo.topics.title", "Mavzular — YHQ Qoidalari bo'yicha Testlar")}
        description={t("seo.topics.desc", "Yo'l harakati qoidalari mavzulari bo'yicha testlar.")}
        canonical="/topics"
        noIndex={true}
      />
      {/* Page Header */}
        <div className={styles.innerPageHeader}>
          <div className={styles.innerPageHeaderLeft}>
            <div className={styles.innerPageTitleRow}>
              <h1 className={styles.innerPageTitle}>
                {t("topics.title", "Mavzular")}
              </h1>
              {!loading && (
                <span className={styles.innerPageCountChip}>
                  {topics.length} {t("topics.unit", "ta mavzu")}
                </span>
              )}
            </div>
            <p className={styles.innerPageSubtitle}>
              {t(
                "topics.subtitle",
                "Yo'l harakati qoidalarini mavzulashtirilgan tarzda tizimli o'rganing va testdan o'ting."
              )}
            </p>
          </div>

          {/* Search */}
          <div className={styles.innerPageActions}>
            <div className={styles.innerSearchWrap}>
              <IconSearch size={16} className={styles.innerSearchIcon} />
              <input
                className={styles.innerSearchInput}
                placeholder={t("topics.search", "Mavzuni qidirish...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={t("topics.search", "Mavzuni qidirish")}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute",
                    right: 10,
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label={t("common.clear", "Tozalash")}
                >
                  <IconX size={15} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading-screen" style={{ minHeight: 320 }}>
            <div className="spinner" />
            <p style={{ marginTop: 12, color: "var(--text-muted)", fontSize: 14 }}>
              {t("common.loading", "Mavzular yuklanmoqda...")}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="empty-state"
            style={{
              padding: "60px 20px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "var(--surface-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconBook2 size={32} stroke={1.5} color="var(--text-muted)" />
            </div>
            <h4 style={{ fontSize: 17, fontWeight: 700, margin: "8px 0 0", color: "var(--text)" }}>
              {search
                ? t("topics.notFound", "Mavzu topilmadi")
                : t("topics.noTopics", "Mavzular mavjud emas")}
            </h4>
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: 0, maxWidth: 360 }}>
              {search
                ? t("topics.tryAnotherSearch", "Qidiruv so'zini o'zgartirib ko'ring yoki tozalang.")
                : t("topics.noTopicsDesc", "Hozircha tizimda mavzular mavjud emas.")}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{
                  marginTop: 8,
                  padding: "8px 18px",
                  borderRadius: 8,
                  background: "var(--primary)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {t("common.clearSearch", "Qidiruvni tozalash")}
              </button>
            )}
          </div>
        ) : (
          <div className={styles.topicsInnerGrid}>
            {filtered.map((topic, idx) => {
              const pal = isDark
                ? PALETTE_DARK[idx % PALETTE_DARK.length]
                : PALETTE[idx % PALETTE.length];

              return (
                <div
                  key={topic.id}
                  className="tpc-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => onStartTopicTest(topic.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onStartTopicTest(topic.id);
                    }
                  }}
                  style={
                    {
                      "--tpc-color": pal.color,
                      "--tpc-bg": pal.bg,
                      "--tpc-border": pal.border,
                    } as React.CSSProperties
                  }
                >
                  {/* Icon + order */}
                  <div className="tpc-icon-wrap">
                    <IconBook2 size={22} stroke={1.5} />
                    <span className="tpc-order">#{idx + 1}</span>
                  </div>

                  {/* Name */}
                  <p className="tpc-name">{localizeTopic(topic)}</p>

                  {/* Question count */}
                  <div className="tpc-meta">
                    <IconListNumbers size={13} />
                    {topic.question_count} {t("common.questions", "savol")}
                  </div>

                  {/* Test button */}
                  <button
                    className="tpc-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartTopicTest(topic.id);
                    }}
                    type="button"
                  >
                    <IconPlayerPlay size={14} />
                    {t("topics.startTest", "Testni boshlash")}
                  </button>
                </div>
              );
            })}
          </div>
        )}
    </>
  );
}
