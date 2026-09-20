import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconSearch,
  IconX,
  IconBook2,
  IconTicket,
  IconPencil,
  IconRun,
  IconDirections,
  IconRoad,
  IconSteeringWheel,
  IconBuildingSkyscraper,
  IconBook,
  IconGavel,
  IconChartBar,
  IconBookmark,
  IconAlertTriangle,
  IconTrophy,
  IconHistory,
  IconSettings,
} from "@tabler/icons-react";
import { OFFICIAL_TOPICS } from "../../constants/topics";
import { useLanguage } from "../../context/LanguageContext";
import styles from "./Dashboard.module.css";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExamPicker: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  category: string;
  icon: React.ComponentType<{ size?: number; stroke?: number; color?: string }>;
  action: () => void;
}

export const DashboardSearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectExamPicker,
}) => {
  const { t } = useTranslation();
  const { localizeTopic } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const allItems: SearchItem[] = useMemo(() => {
    const items: SearchItem[] = [
      {
        id: "mode-exam",
        title: t("dashboard.modes.examTitle", "Haqiqiy Imtihon"),
        category: t("dashboard.categories.exam", "Imtihon"),
        icon: IconPencil,
        action: () => {
          onClose();
          onSelectExamPicker();
        },
      },
      {
        id: "mode-marathon",
        title: t("dashboard.modes.marathonTitle", "Marafon"),
        category: t("dashboard.categories.practice", "Amaliyot"),
        icon: IconRun,
        action: () => {
          onClose();
          navigate("/marafon");
        },
      },
      {
        id: "mode-tickets",
        title: t("dashboard.modes.ticketsTitle", "Biletlar"),
        category: t("dashboard.categories.tickets", "Biletlar"),
        icon: IconTicket,
        action: () => {
          onClose();
          navigate("/tickets");
        },
      },
      {
        id: "mode-topics",
        title: t("dashboard.modes.topicsTitle", "Mavzular"),
        category: t("dashboard.categories.topics", "Mavzular"),
        icon: IconBook2,
        action: () => {
          onClose();
          navigate("/topics");
        },
      },
      {
        id: "section-signs",
        title: t("dashboard.nav.signs", "Yo'l belgilari"),
        category: t("nav.learn", "O'rganish"),
        icon: IconDirections,
        action: () => {
          onClose();
          navigate("/signs");
        },
      },
      {
        id: "section-markings",
        title: t("dashboard.nav.markings", "Yo'l chiziqlari"),
        category: t("nav.learn", "O'rganish"),
        icon: IconRoad,
        action: () => {
          onClose();
          navigate("/markings");
        },
      },
      {
        id: "section-autodrom",
        title: t("dashboard.nav.autodrom", "Avtodrom"),
        category: t("nav.learn", "O'rganish"),
        icon: IconSteeringWheel,
        action: () => {
          onClose();
          navigate("/practical-exam");
        },
      },
      {
        id: "section-exam-centers",
        title: t("dashboard.nav.examCenters", "Imtihon markazlari"),
        category: t("nav.learn", "O'rganish"),
        icon: IconBuildingSkyscraper,
        action: () => {
          onClose();
          navigate("/exam-centers");
        },
      },
      {
        id: "section-rules",
        title: t("dashboard.nav.rules", "YHQ Qoidalari"),
        category: t("nav.learn", "O'rganish"),
        icon: IconBook,
        action: () => {
          onClose();
          navigate("/rules");
        },
      },
      {
        id: "section-penalties",
        title: t("dashboard.nav.penalties", "Jarimalar"),
        category: t("nav.learn", "O'rganish"),
        icon: IconGavel,
        action: () => {
          onClose();
          navigate("/penalties");
        },
      },
      {
        id: "section-stats",
        title: t("dashboard.nav.stats", "Statistika"),
        category: t("nav.tools", "Vositalar"),
        icon: IconChartBar,
        action: () => {
          onClose();
          navigate("/statistics");
        },
      },
      {
        id: "section-saved",
        title: t("dashboard.nav.saved", "Saqlangan savollar"),
        category: t("nav.tools", "Vositalar"),
        icon: IconBookmark,
        action: () => {
          onClose();
          navigate("/saved-questions");
        },
      },
      {
        id: "section-wrong",
        title: t("nav.wrongAnswers", "Xato javoblar ustida ishlash"),
        category: t("nav.tools", "Vositalar"),
        icon: IconAlertTriangle,
        action: () => {
          onClose();
          navigate("/wrong-answers");
        },
      },
      {
        id: "section-rating",
        title: t("dashboard.nav.rating", "Reyting"),
        category: t("nav.tools", "Vositalar"),
        icon: IconTrophy,
        action: () => {
          onClose();
          navigate("/leaderboard");
        },
      },
      {
        id: "section-history",
        title: t("nav.history", "Imtihon tarixi"),
        category: t("nav.tools", "Vositalar"),
        icon: IconHistory,
        action: () => {
          onClose();
          navigate("/history");
        },
      },
      {
        id: "section-settings",
        title: t("dashboard.nav.settings", "Sozlamalar"),
        category: t("nav.tools", "Vositalar"),
        icon: IconSettings,
        action: () => {
          onClose();
          navigate("/settings");
        },
      },
    ];

    // Add Topics
    OFFICIAL_TOPICS.forEach((topic) => {
      items.push({
        id: `topic-${topic.id}`,
        title: localizeTopic(topic),
        category: t("dashboard.categories.topics", "Mavzular"),
        icon: IconBook2,
        action: () => {
          onClose();
          navigate(`/marafon?topicId=${topic.id}`);
        },
      });
    });

    // Add first 10 popular tickets quick search
    for (let i = 1; i <= 20; i++) {
      items.push({
        id: `ticket-${i}`,
        title: `${i}-${t("dashboard.ticketNum", "bilet")}`,
        category: t("dashboard.categories.tickets", "Biletlar"),
        icon: IconTicket,
        action: () => {
          onClose();
          navigate(`/tickets?ticketId=${i}`);
        },
      });
    }

    return items;
  }, [t, localizeTopic, navigate, onClose, onSelectExamPicker]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems.slice(0, 8);
    return allItems
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [allItems, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? filteredItems.length - 1 : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.searchModalOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("dashboard.searchModalLabel", "Global qidiruv")}
    >
      <div
        className={styles.searchModalCard}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.searchModalInputRow}>
          <IconSearch size={20} className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            className={styles.searchModalInput}
            placeholder={t("dashboard.searchPlaceholder", "Mavzu, savol yoki qoida qidirish...")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
            aria-label={t("common.close", "Yopish")}
          >
            <IconX size={18} />
          </button>
        </div>

        <div className={styles.searchModalResults}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
              {t("dashboard.noSearchResults", "Hech narsa topilmadi")}
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.searchResultItem} ${
                  idx === selectedIndex ? styles.searchResultItemActive : ""
                }`}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <item.icon size={18} color="#0284c7" />
                  <span className={styles.searchResultTitle}>{item.title}</span>
                </div>
                <span className={styles.searchResultCategory}>{item.category}</span>
              </button>
            ))
          )}
        </div>

        <div className={styles.searchModalFooter}>
          <span>
            <kbd className={styles.searchKbd}>↑</kbd> <kbd className={styles.searchKbd}>↓</kbd> {t("dashboard.navigate", "harakatlanish")}
          </span>
          <span>
            <kbd className={styles.searchKbd}>Enter</kbd> {t("dashboard.select", "tanlash")}
          </span>
          <span>
            <kbd className={styles.searchKbd}>ESC</kbd> {t("dashboard.close", "yopish")}
          </span>
        </div>
      </div>
    </div>
  );
};
