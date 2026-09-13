import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
  IconBulb,
} from "@tabler/icons-react";
import { getWrongAnswers, getTopics, getFullStats } from "../../../services/desktopAdapter";
import type { OfflineTopic } from "../../../types/desktop";

interface WeakTopicSummary {
  topicId: number;
  name: string;
  count: number;
}

interface Props {
  userId: number;
}

export default function WeakTopicsWidget({ userId }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [totalWrongs, setTotalWrongs] = useState(0);
  const [weakTopics, setWeakTopics] = useState<WeakTopicSummary[]>([]);
  const [progressPct, setProgressPct] = useState(0);

  const localizeTopic = (tp: OfflineTopic): string => {
    if (!tp) return "";
    const l = i18n.language;
    if (l === "uzc" && tp.name_uzc) return tp.name_uzc;
    if (l === "ru" && tp.name_ru) return tp.name_ru;
    return tp.name_uzl || tp.name_ru || tp.name_uzc || "";
  };

  const loadData = async () => {
    try {
      const [wrongs, topics, stats] = await Promise.all([
        getWrongAnswers(userId),
        getTopics(),
        getFullStats(userId).catch(() => null),
      ]);

      const validWrongs = Array.isArray(wrongs)
        ? wrongs.filter((w) => w && w.question)
        : [];
      setTotalWrongs(validWrongs.length);

      if (validWrongs.length === 0) {
        setWeakTopics([]);
        setProgressPct(100);
        setLoading(false);
        return;
      }

      // Calculate mastery / readiness progress
      const totalQ = stats?.question_readiness?.total ?? 1190;
      const readyQ = stats?.question_readiness?.ready ?? 0;
      let calculatedPct = 0;
      if (stats && totalQ > 0 && readyQ > 0) {
        calculatedPct = Math.min(100, Math.max(10, Math.round((readyQ / totalQ) * 100)));
      } else {
        calculatedPct = Math.min(100, Math.max(10, Math.round(((1190 - validWrongs.length) / 1190) * 100)));
      }
      setProgressPct(calculatedPct);

      // Group mistakes by topic
      const topicCountMap: Record<number, number> = {};
      for (const entry of validWrongs) {
        const tid = entry.question.topic_id;
        if (tid != null) {
          topicCountMap[tid] = (topicCountMap[tid] || 0) + 1;
        }
      }

      const topicList = Array.isArray(topics) ? topics : [];
      const sorted = Object.entries(topicCountMap)
        .map(([tidStr, count]) => {
          const tid = Number(tidStr);
          const found = topicList.find((tp) => tp.id === tid);
          return {
            topicId: tid,
            name: found ? localizeTopic(found) : `Mavzu #${tid}`,
            count,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 3); // Top 3 weakest topics

      setWeakTopics(sorted);
    } catch {
      setWeakTopics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const onStorage = () => loadData();
    window.addEventListener("prava-storage-changed", onStorage);
    return () => window.removeEventListener("prava-storage-changed", onStorage);
  }, [userId, i18n.language]);

  if (loading) {
    return null;
  }

  // If user has 0 mistakes, show positive reinforcement card
  if (totalWrongs === 0) {
    return (
      <div className="mistakes-practice-card empty-state">
        <div className="mistakes-empty-row">
          <div className="mistakes-empty-icon">
            <IconCheck size={24} stroke={2.5} />
          </div>
          <div className="mistakes-empty-info">
            <h4 className="mistakes-empty-title">
              {t("home.noWeakTopicsTitle", "Xatolar mavjud emas!")}
            </h4>
            <p className="mistakes-empty-desc">
              {t(
                "home.noWeakTopicsDesc",
                "Bilimlaringiz a'lo darajada. To'liq imtihon bilan o'zingizni sinab ko'ring."
              )}
            </p>
          </div>
          <button
            onClick={() => navigate("/exam?count=20")}
            className="mistakes-empty-cta"
            type="button"
          >
            <IconBulb size={16} />
            {t("home.startExamBtn", "Sinov imtihoni topshirish")}
          </button>
        </div>
      </div>
    );
  }

  // Single Consolidated Mistakes Practice Card
  return (
    <div className="mistakes-practice-card">
      {/* Top Header */}
      <div className="mistakes-card-top">
        <div className="mistakes-card-header-left">
          <div className="mistakes-card-icon">
            <IconAlertTriangle size={24} stroke={2.2} />
          </div>
          <div>
            <div className="mistakes-badge-row">
              <span className="mistakes-warning-badge">
                <IconAlertTriangle size={13} stroke={2.5} />
                {t("home.mistakesCardBadge", "XATOLAR USTIDA ISHLASH")}
              </span>
            </div>
            <div className="mistakes-card-count-text">
              {t("home.totalMistakesCountText", "Jami xato javoblar")}:{" "}
              <span className="mistakes-count-highlight">{totalWrongs}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weak Topics & Progress Grid */}
      <div className="mistakes-card-content-grid">
        {weakTopics.length > 0 ? (
          <div className="mistakes-weak-topics-col">
            <div className="mistakes-section-label">
              {t("home.weakestTopicsTitle", "Sizning eng zaif mavzularingiz:")}
            </div>
            <ul className="mistakes-topics-list">
              {weakTopics.map((item) => (
                <li key={item.topicId} className="mistakes-topic-item">
                  <span className="mistakes-topic-bullet">•</span>
                  <span className="mistakes-topic-name">{item.name}</span>
                  <span className="mistakes-topic-sep">—</span>
                  <span className="mistakes-topic-count">
                    {item.count} {t("home.mistakesCountLabel", "ta xato")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mistakes-weak-topics-col">
            <p className="mistakes-topics-fallback">
              {t(
                "home.allMistakesDesc",
                "Jami to'plangan xatolar bazasi. Xatolaringiz ustida ishlab bilimingizni mustahkamlang."
              )}
            </p>
          </div>
        )}

        {/* Progress Bar Column */}
        <div className="mistakes-progress-col">
          <div className="mistakes-progress-header">
            <span className="mistakes-section-label">
              {t("home.readinessProgress", "O'zlashtirish ko'rsatkichi:")}
            </span>
            <span className="mistakes-progress-val">{progressPct}%</span>
          </div>
          <div className="mistakes-progress-track">
            <div
              className="mistakes-progress-bar"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mistakes-progress-hint">
            {t(
              "home.mistakesProgressHint",
              "Xatolarni yechish orqali umumiy tayyorgarlik darajangizni oshiring"
            )}
          </p>
        </div>
      </div>

      {/* Centered Primary CTA Button */}
      <div className="mistakes-card-cta-row">
        <button
          className="mistakes-cta-btn"
          onClick={() => navigate("/wrong-answers")}
          type="button"
        >
          {t("home.practiceAllMistakes", "Xatolar ustida ishlash")}
          <IconArrowRight size={18} stroke={2.5} />
        </button>
      </div>
    </div>
  );
}
