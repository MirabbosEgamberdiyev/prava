import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  IconAlertTriangle,
  IconPlayerPlay,
  IconArrowRight,
  IconCheck,
  IconBulb,
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

  // If user has mistakes in a specific topic, show high-impact recommendation
  if (weakTopic) {
    const topicName = localizeTopic(weakTopic.topic);
    return (
      <div
        className="weak-topics-card"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderLeft: "4px solid #e03131",
          borderRadius: 14,
          padding: "16px 20px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: "1 1 300px" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "rgba(224,49,49,0.1)",
              color: "#e03131",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconAlertTriangle size={24} stroke={2} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: "rgba(224,49,49,0.12)",
                  color: "#e03131",
                }}
              >
                {t("home.weakTopicsBadge", "Zaif mavzu aniqlandi")}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {weakTopic.wrongCount} ta xato savol
              </span>
            </div>
            <h4
              style={{
                margin: "4px 0 0",
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              {topicName}
            </h4>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => navigate(`/marafon?topicId=${weakTopic.topic.id}`)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#e03131",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "9px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "transform 0.15s, opacity 0.15s",
            }}
            type="button"
          >
            <IconPlayerPlay size={15} />
            {t("home.practiceTopic", "Shu mavzuni kuchaytirish")}
          </button>
          <button
            onClick={() => navigate("/wrong-answers")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "var(--bg)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
            type="button"
          >
            {t("home.allMistakes", "Barcha xatolar")} ({totalWrongs})
            <IconArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // If user has 0 mistakes, show positive reinforcement
  return (
    <div
      className="weak-topics-card ready"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderLeft: "4px solid #2f9e44",
        borderRadius: 14,
        padding: "14px 20px",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 14,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "rgba(47,158,68,0.1)",
            color: "#2f9e44",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconCheck size={20} stroke={2.5} />
        </div>
        <div>
          <h4
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            {t("home.noWeakTopicsTitle", "Xatolar mavjud emas!")}
          </h4>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 12,
              color: "var(--text-muted)",
            }}
          >
            {t(
              "home.noWeakTopicsDesc",
              "Bilimlaringiz a'lo darajada. To'liq imtihon bilan o'zingizni sinab ko'ring."
            )}
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate("/exam?count=20")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "var(--bg)",
          color: "var(--text)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "7px 14px",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
        }}
        type="button"
      >
        <IconBulb size={15} color="#e67700" />
        {t("home.startExamBtn", "Sinov imtihoni topshirish")}
      </button>
    </div>
  );
}
