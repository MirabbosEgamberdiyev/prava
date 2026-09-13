import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  IconAlertTriangle,
  IconPlayerPlay,
  IconArrowRight,
  IconCheck,
  IconBulb,
  IconListCheck,
} from "@tabler/icons-react";
import { getWrongAnswers, getTopics } from "../../../services/desktopAdapter";
import type { OfflineTopic } from "../../../types/desktop";

interface WeakTopicInfo {
  topic: OfflineTopic;
  wrongCount: number;
  totalQuestions: number;
}

interface Props {
  userId: number;
}

export default function WeakTopicsWidget({ userId }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [weakTopic, setWeakTopic] = useState<WeakTopicInfo | null>(null);
  const [totalWrongs, setTotalWrongs] = useState(0);

  const localizeTopic = (tp: OfflineTopic): string => {
    if (!tp) return "";
    const l = i18n.language;
    if (l === "uzc" && tp.name_uzc) return tp.name_uzc;
    if (l === "ru" && tp.name_ru) return tp.name_ru;
    return tp.name_uzl || tp.name_ru || tp.name_uzc || "";
  };

  const loadData = async () => {
    try {
      const [wrongs, topics] = await Promise.all([
        getWrongAnswers(userId),
        getTopics(),
      ]);

      const validWrongs = Array.isArray(wrongs)
        ? wrongs.filter((w) => w && w.question)
        : [];
      setTotalWrongs(validWrongs.length);

      if (validWrongs.length === 0 || !Array.isArray(topics) || topics.length === 0) {
        setWeakTopic(null);
        setLoading(false);
        return;
      }

      // Count mistakes per topicId
      const countMap: Record<number, number> = {};
      for (const entry of validWrongs) {
        const tid = entry.question.topic_id;
        if (tid != null) {
          countMap[tid] = (countMap[tid] || 0) + 1;
        }
      }

      let maxTid: number | null = null;
      let maxCount = 0;
      for (const [tidStr, count] of Object.entries(countMap)) {
        if (count > maxCount) {
          maxCount = count;
          maxTid = Number(tidStr);
        }
      }

      if (maxTid != null && maxCount > 0) {
        const found = topics.find((tp) => tp.id === maxTid);
        if (found) {
          setWeakTopic({
            topic: found,
            wrongCount: maxCount,
            totalQuestions: found.question_count || 20,
          });
        } else {
          setWeakTopic(null);
        }
      } else {
        setWeakTopic(null);
      }
    } catch {
      setWeakTopic(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const onStorage = () => loadData();
    window.addEventListener("prava-storage-changed", onStorage);
    return () => window.removeEventListener("prava-storage-changed", onStorage);
  }, [userId]);

  if (loading) {
    return null;
  }

  // If user has mistakes (totalWrongs > 0), show 2 distinct equal-height cards
  if (totalWrongs > 0) {
    const topicName = weakTopic ? localizeTopic(weakTopic.topic) : "";
    const wrongCount = weakTopic ? weakTopic.wrongCount : totalWrongs;
    const totalQuestions = weakTopic?.totalQuestions || 20;
    const progressPct = Math.min(100, Math.round((wrongCount / Math.max(1, totalQuestions)) * 100));

    return (
      <div className="weak-topics-grid">
        {/* Card 1: Weak Topic Recommendation */}
        <div className="weak-topic-card">
          <div className="weak-card-header">
            <div className="weak-card-icon">
              <IconAlertTriangle size={20} stroke={2.2} />
            </div>
            <div className="weak-card-title-wrap">
              <div className="weak-card-badge-row">
                <span className="weak-card-badge">
                  {t("home.weakTopicBadge", "Zaif mavzu")}
                </span>
                <span className="weak-card-mistakes">
                  {t("home.topicMistakesCount", "{{count}} ta xato savol", { count: wrongCount })}
                </span>
              </div>
              <h4 className="weak-card-title">
                {weakTopic ? topicName : t("home.weakGeneralTitle", "Xatolar tahlili")}
              </h4>
            </div>
          </div>

          <div className="weak-card-body">
            {weakTopic ? (
              <div className="weak-progress-wrap">
                <div className="weak-progress-labels">
                  <span>{t("home.topicMistakesPct", "Mavzudagi xatolar ulushi")}</span>
                  <span className="weak-progress-pct">{progressPct}%</span>
                </div>
                <div className="weak-progress-track">
                  <div
                    className="weak-progress-bar"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="weak-card-desc">
                {t(
                  "home.weakTopicDesc",
                  "Xato qilingan savollar bo'yicha maxsus mashg'ulot o'ting."
                )}
              </p>
            )}
          </div>

          <div className="weak-card-action">
            <button
              className="weak-btn-primary"
              onClick={() => {
                if (weakTopic) {
                  navigate(`/marafon?topicId=${weakTopic.topic.id}`);
                } else {
                  navigate("/wrong-answers");
                }
              }}
              type="button"
            >
              <IconPlayerPlay size={15} />
              {t("home.practiceTopic", "Shu mavzuni kuchaytirish")}
            </button>
          </div>
        </div>

        {/* Card 2: All Mistakes Independent Sibling Card */}
        <div className="all-mistakes-card">
          <div className="weak-card-header">
            <div className="all-mistakes-icon">
              <IconListCheck size={20} stroke={2.2} />
            </div>
            <div className="weak-card-title-wrap">
              <div className="weak-card-badge-row">
                <span className="all-mistakes-badge">
                  {t("home.allMistakesBadge", "Barcha xatolar")}
                </span>
                <span className="all-mistakes-count">
                  {t("home.totalMistakesCount", "{{count}} ta xato javob", { count: totalWrongs })}
                </span>
              </div>
              <h4 className="weak-card-title">
                {t("home.allMistakesTitle", "Jami to'plangan xatolar bazasi")}
              </h4>
            </div>
          </div>

          <div className="weak-card-body">
            <p className="all-mistakes-desc">
              {t(
                "home.allMistakesDesc",
                "Jami to'plangan xatolar bazasi. Xatolaringiz ustida ishlab bilimingizni mustahkamlang."
              )}
            </p>
          </div>

          <div className="weak-card-action">
            <button
              className="all-mistakes-btn"
              onClick={() => navigate("/wrong-answers")}
              type="button"
            >
              {t("home.allMistakesBtn", "Xatolar ustida ishlash")}
              <IconArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user has 0 mistakes, show positive reinforcement
  return (
    <div className="weak-topics-empty-card">
      <div className="weak-empty-left">
        <div className="weak-empty-icon">
          <IconCheck size={20} stroke={2.5} />
        </div>
        <div>
          <h4 className="weak-empty-title">
            {t("home.noWeakTopicsTitle", "Xatolar mavjud emas!")}
          </h4>
          <p className="weak-empty-desc">
            {t(
              "home.noWeakTopicsDesc",
              "Bilimlaringiz a'lo darajada. To'liq imtihon bilan o'zingizni sinab ko'ring."
            )}
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate("/exam?count=20")}
        className="weak-empty-btn"
        type="button"
      >
        <IconBulb size={15} color="#e67700" />
        {t("home.startExamBtn", "Sinov imtihoni topshirish")}
      </button>
    </div>
  );
}
