import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  IconArrowLeft,
  IconSearch,
  IconBook2,
  IconPlayerPlay,
  IconListNumbers,
  IconChevronDown,
  IconX,
} from "@tabler/icons-react";
import type { OfflineTopic } from "../../types/desktop";
import { getTopics } from "../../services/desktopAdapter";
import { useLanguage } from "../../context/LanguageContext";
import SEO from "../../components/common/SEO";
import "./topics.css";

interface PaletteItem {
  color: string;
  bg: string;
  border: string;
  bgDark: string;
  borderDark: string;
}

const PALETTES: PaletteItem[] = [
  { color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd", bgDark: "rgba(56, 189, 248, 0.12)", borderDark: "rgba(56, 189, 248, 0.28)" },
  { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", bgDark: "rgba(74, 222, 128, 0.12)", borderDark: "rgba(74, 222, 128, 0.28)" },
  { color: "#d97706", bg: "#fffbeb", border: "#fde68a", bgDark: "rgba(251, 191, 36, 0.12)", borderDark: "rgba(251, 191, 36, 0.28)" },
  { color: "#9333ea", bg: "#faf5ff", border: "#e9d5ff", bgDark: "rgba(192, 132, 252, 0.12)", borderDark: "rgba(192, 132, 252, 0.28)" },
  { color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc", bgDark: "rgba(45, 212, 191, 0.12)", borderDark: "rgba(45, 212, 191, 0.28)" },
  { color: "#db2777", bg: "#fdf2f8", border: "#fbcfe8", bgDark: "rgba(244, 114, 182, 0.12)", borderDark: "rgba(244, 114, 182, 0.28)" },
  { color: "#ea580c", bg: "#fff7ed", border: "#fed7aa", bgDark: "rgba(251, 146, 60, 0.12)", borderDark: "rgba(251, 146, 60, 0.28)" },
  { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", bgDark: "rgba(52, 211, 153, 0.12)", borderDark: "rgba(52, 211, 153, 0.28)" },
  { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", bgDark: "rgba(167, 139, 250, 0.12)", borderDark: "rgba(167, 139, 250, 0.28)" },
  { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", bgDark: "rgba(248, 113, 113, 0.12)", borderDark: "rgba(248, 113, 113, 0.28)" },
];

const PRESET_OPTIONS: (number | "all")[] = [10, 20, 30, 50, "all"];

export default function Topics_Page() {
  const { t } = useTranslation();
  const { localizeTopic } = useLanguage();
  const navigate = useNavigate();

  const [topics, setTopics] = useState<OfflineTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal setup state
  const [selectedTopic, setSelectedTopic] = useState<OfflineTopic | null>(null);
  const [selectedCountOption, setSelectedCountOption] = useState<number | "all">(10);

  useEffect(() => {
    getTopics()
      .then((data) => setTopics(Array.isArray(data) ? data : []))
      .catch(() => setTopics([]))
      .finally(() => setLoading(false));
  }, []);

  // Filtered topics
  const filteredTopics = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = Array.isArray(topics) ? topics : [];
    if (!query) return list;
    return list.filter((tp) => {
      const name = localizeTopic(tp).toLowerCase();
      const code = (tp.code || "").toLowerCase();
      const idMatch = String(tp.id) === query;
      return name.includes(query) || code.includes(query) || idMatch;
    });
  }, [topics, search, localizeTopic]);

  // Open modal for a topic
  const handleOpenModal = useCallback((topic: OfflineTopic) => {
    setSelectedTopic(topic);
    const avail = topic.question_count || 0;
    if (avail >= 10) {
      setSelectedCountOption(10);
    } else {
      setSelectedCountOption("all");
    }
  }, []);

  // Switch topic in modal dropdown
  const handleModalTopicChange = useCallback(
    (newTopicId: number) => {
      const found = topics.find((t) => t.id === newTopicId);
      if (found) {
        setSelectedTopic(found);
        const avail = found.question_count || 0;
        if (typeof selectedCountOption === "number" && selectedCountOption > avail) {
          setSelectedCountOption(avail >= 10 ? 10 : "all");
        }
      }
    },
    [topics, selectedCountOption]
  );

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedTopic) {
        setSelectedTopic(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTopic]);

  // Start exam with chosen parameters
  const handleStartTest = () => {
    if (!selectedTopic) return;
    const avail = selectedTopic.question_count || 0;
    let count = selectedCountOption === "all" ? 0 : selectedCountOption;
    if (count > avail && avail > 0) count = avail;

    const topicId = selectedTopic.id;
    setSelectedTopic(null);

    navigate(`/marafon?topicId=${topicId}&count=${count}&autoStart=true`, {
      state: {
        topicId,
        count,
        autoStart: true,
      },
    });
  };

  const modalAvailableCount = selectedTopic?.question_count || 0;

  return (
    <>
      <SEO
        title={t("topics.seoTitle", "Mavzular - YHQ nazariyasi va testlari")}
        description={t("topics.seoDesc", "Yo'l harakati qoidalari mavzulari bo'yicha nazariy bilimlar va savollar to'plami.")}
        canonical="/topics"
      />

      <div className="topics-page-wrapper">
        <main className="topics-page-container">
          {/* Header */}
          <div className="topics-page-header">
            <div className="topics-header-main">
              <button
                type="button"
                className="topics-back-btn"
                onClick={() => navigate("/me")}
                aria-label={t("common.back", "Orqaga")}
              >
                <IconArrowLeft size={20} stroke={2.2} />
              </button>
              <div className="topics-title-area">
                <div className="topics-title-row">
                  <h1 className="topics-page-title">{t("topics.title", "Mavzular")}</h1>
                  {!loading && topics.length > 0 && (
                    <span className="topics-count-badge">
                      {t("topics.countBadge", "{{count}} ta mavzu", { count: topics.length })}
                    </span>
                  )}
                </div>
                <p className="topics-page-subtitle">
                  {t(
                    "topics.subtitleFull",
                    "Yo'l harakati qoidalarini mavzulashtirilgan tarzda tizimli o'rganing va testdan o'ting."
                  )}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="topics-search-wrap">
              <IconSearch size={16} stroke={2} className="topics-search-icon" />
              <input
                className="topics-search-input"
                placeholder={t("topics.searchPlaceholder", "Mavzu qidirish...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="topics-search-clear"
                  onClick={() => setSearch("")}
                  aria-label={t("common.clear", "Tozalash")}
                >
                  <IconX size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="topics-empty-state">
              <div className="ds-spinner" />
              <p style={{ marginTop: 16, color: "var(--g-text-muted)" }}>
                {t("common.loading", "Yuklanmoqda...")}
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredTopics.length === 0 && (
            <div className="topics-empty-state">
              <div className="topics-empty-icon">
                <IconBook2 size={36} stroke={1.5} />
              </div>
              <div className="topics-empty-title">
                {search ? t("topics.notFound", "Mos keluvchi mavzu topilmadi") : t("topics.noTopics", "Mavzular mavjud emas")}
              </div>
              <p className="topics-empty-desc">
                {t("topics.emptyDesc", "Boshqa kalit so'z bilan qidirib ko'ring yoki filtrlarni tozalang.")}
              </p>
            </div>
          )}

          {/* Topics Grid matching Screenshot 1 */}
          {!loading && filteredTopics.length > 0 && (
            <div className="topics-grid">
              {filteredTopics.map((topic, idx) => {
                const pal = PALETTES[idx % PALETTES.length];
                const qCount = topic.question_count || 0;

                return (
                  <div
                    key={topic.id}
                    className="tpc-card"
                    style={
                      {
                        "--tpc-color": pal.color,
                        "--tpc-bg": pal.bg,
                        "--tpc-border": pal.border,
                        "--tpc-bg-dark": pal.bgDark,
                        "--tpc-border-dark": pal.borderDark,
                      } as React.CSSProperties
                    }
                    onClick={() => handleOpenModal(topic)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleOpenModal(topic);
                      }
                    }}
                  >
                    {/* Header: Icon + Order # */}
                    <div className="tpc-icon-wrap">
                      <div className="tpc-icon-box">
                        <IconBook2 size={22} stroke={1.8} />
                      </div>
                      <span className="tpc-order">#{idx + 1}</span>
                    </div>

                    {/* Name */}
                    <h3 className="tpc-name" title={localizeTopic(topic)}>
                      {localizeTopic(topic)}
                    </h3>

                    {/* Question Count */}
                    <div className="tpc-meta">
                      <IconListNumbers size={14} />
                      <span>{t("topics.questionCount", "{{count}} ta savol", { count: qCount })}</span>
                    </div>

                    {/* Start Test Button */}
                    <button
                      type="button"
                      className="tpc-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(topic);
                      }}
                    >
                      <IconPlayerPlay size={14} fill="currentColor" />
                      <span>{t("topics.startTest", "Testni boshlash")}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Test Setup Modal Dialog matching Screenshot 2 */}
          {selectedTopic && (
            <div
              className="topic-modal-backdrop"
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedTopic(null);
              }}
            >
              <div
                className="topic-modal-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="topic-modal-title"
              >
                {/* Header */}
                <div className="topic-modal-header">
                  <button
                    type="button"
                    className="topic-modal-back-btn"
                    onClick={() => setSelectedTopic(null)}
                    aria-label={t("common.back", "Orqaga")}
                  >
                    <IconArrowLeft size={18} stroke={2.2} />
                  </button>
                  <div className="topic-modal-title-box">
                    <div className="topic-modal-title-row">
                      <IconBook2 size={20} color="#0284c7" stroke={2} />
                      <span id="topic-modal-title" className="topic-modal-title">
                        {t("topics.modalTitle", "Mavzulashtirilgan test")}
                      </span>
                    </div>
                    <div className="topic-modal-subtitle">
                      {localizeTopic(selectedTopic)}
                    </div>
                  </div>
                </div>

                {/* Field 1: Topic Dropdown */}
                <div className="topic-modal-field">
                  <label className="topic-modal-label">
                    {t("topics.selectTopic", "Mavzuni tanlang")}
                  </label>
                  <div className="topic-modal-select-wrap">
                    <select
                      className="topic-modal-select"
                      value={selectedTopic.id}
                      onChange={(e) => handleModalTopicChange(Number(e.target.value))}
                    >
                      {topics.map((tp) => (
                        <option key={tp.id} value={tp.id}>
                          {localizeTopic(tp)} ({tp.question_count || 0})
                        </option>
                      ))}
                    </select>
                    <IconChevronDown className="topic-modal-select-arrow" size={18} />
                  </div>
                </div>

                {/* Field 2: Question Count Presets */}
                <div className="topic-modal-field">
                  <div className="topic-modal-label-row">
                    <label className="topic-modal-label">
                      {t("topics.questionCountLabel", "Savollar soni")}
                    </label>
                    <div className="topic-modal-avail">
                      <IconListNumbers size={15} />
                      <span>
                        {t("topics.availableCount", "Mavjud: {{count}}", {
                          count: modalAvailableCount,
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="topic-preset-row">
                    {PRESET_OPTIONS.map((opt) => {
                      const isAll = opt === "all";
                      const label = isAll ? t("common.all", "Barchasi") : String(opt);
                      const isSelected = selectedCountOption === opt;
                      // Disabled if specific number exceeds available questions
                      const isDisabled = !isAll && modalAvailableCount > 0 && opt > modalAvailableCount;

                      return (
                        <button
                          key={String(opt)}
                          type="button"
                          className={`topic-preset-btn ${isSelected ? "is-active" : ""}`}
                          disabled={isDisabled}
                          onClick={() => setSelectedCountOption(opt)}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit: Start Test */}
                <button
                  type="button"
                  className="topic-modal-start-btn"
                  onClick={handleStartTest}
                  disabled={modalAvailableCount === 0}
                >
                  <IconPlayerPlay size={16} fill="currentColor" />
                  <span>{t("topics.startTest", "Testni boshlash")}</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
