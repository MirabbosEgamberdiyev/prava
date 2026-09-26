import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import useSWR from "swr";
import { IconPlayerPlay, IconRotateClockwise } from "@tabler/icons-react";

/**
 * "Tugallanmagan imtihonni davom ettirish" kartasi (Android paritet).
 *
 * Manbalar:
 *  1. Lokal marafon sessiyasi (`prava_marathon_active_session_<userId>`);
 *  2. Server: `GET /api/v2/exams/active` (paket / bilet / marafon sessiyasi).
 * Ikkalasi bir xil sessiya bo'lsa (sessionId mos) — bitta karta ko'rsatiladi.
 */

export interface LocalMarathonSession {
  questions: unknown[];
  current: number;
  answers: Record<number, unknown>;
  sessionId?: number | null;
  deadline?: number;
}

interface ActiveExamResponse {
  data?: {
    sessionId?: number;
    packageId?: number | null;
    packageName?: string | null;
    totalQuestions?: number;
    expiresAt?: string | null;
  } | null;
}

interface Props {
  marathonSession: LocalMarathonSession | null;
}

function minutesLeft(until: number | null | undefined, now: number): number | null {
  if (until == null || !Number.isFinite(until)) return null;
  return Math.max(0, Math.ceil((until - now) / 60000));
}

export default function ResumeExamCard({ marathonSession }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Server faol sessiyasi (bo'lmasa `data: null`). Xato — jim (karta ko'rinmaydi).
  const { data: activeResp } = useSWR<ActiveExamResponse>("/api/v2/exams/active", {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });
  const server = activeResp?.data ?? null;

  const local =
    marathonSession &&
    Array.isArray(marathonSession.questions) &&
    marathonSession.questions.length > 0
      ? marathonSession
      : null;

  if (!local && !server?.sessionId) return null;

  const now = Date.now();
  // Lokal marafon ustun (savollar va javoblar lokal saqlangan — to'liq davom etadi)
  const useLocal = !!local && (!server?.sessionId || !server.packageId || local.sessionId === server.sessionId);

  let title: string;
  let desc: string;
  let target: string;
  let left: number | null;

  if (useLocal && local) {
    const answered = Object.keys(local.answers || {}).length;
    title = t("dashboard.resume.marathonTitle", "Tugallanmagan marafon");
    desc = t("dashboard.resume.progress", "{{answered}} / {{total}} ta savolga javob berilgan", {
      answered,
      total: local.questions.length,
    });
    target = "/marafon?resume=1";
    left = minutesLeft(local.deadline, now);
  } else {
    const parsed = server?.expiresAt ? Date.parse(server.expiresAt) : NaN;
    const isPackage = server?.packageId != null;
    title = isPackage
      ? t("dashboard.resume.examTitle", "Tugallanmagan imtihon")
      : t("dashboard.resume.marathonTitle", "Tugallanmagan marafon");
    desc =
      (isPackage && server?.packageName) ||
      t("dashboard.resume.questions", "{{count}} ta savol", { count: server?.totalQuestions ?? 0 });
    target = isPackage ? `/packages/${server?.packageId}` : "/marafon";
    left = minutesLeft(Number.isNaN(parsed) ? null : parsed, now);
  }

  return (
    <section
      aria-label={t("dashboard.resume.aria", "Tugallanmagan imtihon")}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        padding: "16px 20px",
        marginBottom: 20,
        borderRadius: "var(--radius-lg, 16px)",
        border: "1px solid var(--primary)",
        background: "var(--surface)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div
          aria-hidden="true"
          style={{
            width: 44,
            height: 44,
            flexShrink: 0,
            borderRadius: "var(--radius-md, 12px)",
            background: "rgba(var(--primary-rgb), 0.12)",
            color: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconRotateClockwise size={24} />
        </div>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{title}</h2>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
            {desc}
            {left != null &&
              ` • ${
                left > 0
                  ? t("dashboard.resume.minutesLeft", "{{count}} daqiqa qoldi", { count: left })
                  : t("dashboard.resume.timeUp", "Vaqt tugagan — natijani yuboring")
              }`}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigate(target)}
        style={{
          minHeight: 44,
          padding: "10px 20px",
          borderRadius: "var(--radius-md, 12px)",
          border: "none",
          background: "var(--primary)",
          color: "var(--on-primary, #fff)",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <IconPlayerPlay size={18} />
        <span>{t("dashboard.resume.continue", "Davom ettirish")}</span>
      </button>
    </section>
  );
}
