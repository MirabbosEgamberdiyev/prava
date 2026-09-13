import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
  IconBulb,
  IconClipboardList,
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

      // Calculate total questions attempted
      const readyQ = stats?.question_readiness?.ready ?? 0;
      const averageQ = stats?.question_readiness?.average ?? 0;
      const weakQ = stats?.question_readiness?.weak ?? 0;
      const totalPracticed = readyQ + averageQ + weakQ;

      // Synchronization: If 0 questions were ever practiced, mistakes count must be 0
      const effectiveWrongs = totalPracticed === 0 ? 0 : validWrongs.length;
      setTotalWrongs(effectiveWrongs);

      if (effectiveWrongs === 0 || totalPracticed === 0) {
        setWeakTopics([]);
        setProgressPct(0); // If 0 questions answered, masteryPercent is 0, NEVER 100%
        setLoading(false);
        return;
      }

      // Calculate mastery / readiness progress on practiced questions
      const correctCount = Math.max(0, totalPracticed - effectiveWrongs);
      const mastery = Math.round((correctCount / totalPracticed) * 100);
      setProgressPct(Math.min(100, Math.max(0, mastery)));

      // Group mistakes by topic
      const topicCountMap: Record<number, number> = {};
      for (const entry of validWrongs) {
        const tid = entry.question?.topic_id;
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
        .slice(0, 4); // Top weak topics

      setWeakTopics(sorted);
    } catch {
      setWeakTopics([]);
      setTotalWrongs(0);
      setProgressPct(0);
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

  const primaryWeakTopic = weakTopics[0];

  return (
    <div className="mistakes-two-cards-grid">
      {/* CARD 1: ⚠ ZAIF MAVZU ANIQLANDI */}
      <div className="mistakes-independent-card card-weak-topics">
        <div className="mistakes-ind-header">
          <span className="mistakes-badge-tag warning">
            <IconAlertTriangle size={14} stroke={2.5} />
            {t("home.weakTopicsBadge", "ZAIF MAVZU ANIQLANDI")}
          </span>
        </div>

        <div className="mistakes-ind-body">
          {weakTopics.length > 0 ? (
            <div className="weak-topics-mini-grid">
              {weakTopics.map((topic) => {
                const topicPct = Math.min(100, Math.max(12, Math.round((topic.count / totalWrongs) * 100)));
                return (
                  <div key={topic.topicId} className="weak-topic-mini-card">
                    <div className="weak-topic-mini-top">
                      <span className="weak-topic-mini-name">{topic.name}</span>
                      <span className="weak-topic-mini-count">
                        {topic.count} {t("home.mistakesCountLabel", "ta xato")}
                      </span>
                    </div>
                    <div className="weak-topic-mini-track">
                      <div
                        className="weak-topic-mini-bar"
                        style={{ width: `${topicPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mistakes-ind-fallback">
              {t("home.weakTopicDesc", "Xato qilingan savollar bo'yicha maxsus mashg'ulot o'ting.")}
            </p>
          )}
        </div>

        <div className="mistakes-ind-footer">
          <button
            className="mistakes-action-btn primary"
            onClick={() =>
              navigate(
                primaryWeakTopic
                  ? `/marafon?topicId=${primaryWeakTopic.topicId}`
                  : "/topics"
              )
            }
            type="button"
          >
            <span>{t("home.practiceTopic", "Shu mavzuni kuchaytirish")}</span>
            <IconArrowRight size={16} stroke={2.5} />
          </button>
        </div>
      </div>

      {/* CARD 2: 📋 BARCHA XATOLAR */}
      <div className="mistakes-independent-card card-all-mistakes">
        <div className="mistakes-ind-header">
          <span className="mistakes-badge-tag info">
            <IconClipboardList size={14} stroke={2.5} />
            {t("home.allMistakesBadge", "BARCHA XATOLAR")}
          </span>
        </div>

        <div className="mistakes-ind-body">
          <div className="all-mistakes-stat-row">
            <div className="all-mistakes-stat-item">
              <span className="all-mistakes-stat-label">
                {t("home.totalMistakesCountText", "Jami xatolar")}:
              </span>
              <span className="all-mistakes-stat-number">{totalWrongs}</span>
            </div>
          </div>

          <p className="all-mistakes-stat-desc">
            {t(
              "home.allMistakesDesc",
              "Jami to'plangan xatolar bazasi. Xatolaringiz ustida ishlab bilimingizni mustahkamlang."
            )}
          </p>

          <div className="all-mistakes-progress-section">
            <div className="all-mistakes-progress-head">
              <span className="all-mistakes-progress-label">
                {t("home.readinessProgress", "O'zlashtirish ko'rsatkichi:")}
              </span>
              <span className="all-mistakes-progress-val">{progressPct}%</span>
            </div>
            <div className="all-mistakes-progress-track">
              <div
                className="all-mistakes-progress-bar"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mistakes-ind-footer">
          <button
            className="mistakes-action-btn secondary"
            onClick={() => navigate("/wrong-answers")}
            type="button"
          >
            <span>{t("home.allMistakesBtn", "Xatolar ustida ishlash")}</span>
            <IconArrowRight size={16} stroke={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
