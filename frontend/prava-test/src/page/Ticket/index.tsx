import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import type { OfflineTicket, TicketStat } from "../../types/desktop";
import { getTickets, getPublicTickets, getTicketStats, getLang } from "../../services/desktopAdapter";
import { useCurriculumCounts } from "../../hooks/useCurriculumCounts";
import { useExamRules } from "../../services/examRules";
import { scopedUserId } from "../../utils/userScope";
import { loginPath, registerPath } from "../../utils/returnTo";
import { errorKeyFor } from "../../types/errors";
import { reportError } from "../../utils/monitoring";
import SEO from "../../components/common/SEO";
import {
  IconTicket,
  IconClock,
  IconListNumbers,
  IconCheck,
  IconPlayerPlay,
  IconLock,
} from "@tabler/icons-react";
import styles from "../../components/dashboard/Dashboard.module.css";

export default function Tickets_Page() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const userId = scopedUserId(user);
  const counts = useCurriculumCounts();
  const rules = useExamRules();

  const [tickets, setTickets] = useState<OfflineTicket[]>([]);
  const [statsMap, setStatsMap] = useState<Record<number, TicketStat>>({});
  const [loading, setLoading] = useState(true);
  /** Yuklash xatosi uchun i18n kaliti (null — xato yo'q). */
  const [errorKey, setErrorKey] = useState<string | null>(null);
  /** Mehmon va ochiq endpoint hali yo'q — ro'yxat o'rniga login CTA. */
  const [guestLocked, setGuestLocked] = useState(false);

  const localizeName = (tk: OfflineTicket): string => {
    if (!tk) return "";
    const l = getLang();
    if (l === "uzc" && tk.name_uzc) return tk.name_uzc;
    if (l === "ru" && tk.name_ru) return tk.name_ru;
    return tk.name_uzl || tk.name_ru || tk.name_uzc || `${t("home.biletlar")} #${tk.ticket_number || ""}`;
  };

  const loadData = useCallback(() => {
    setLoading(true);
    setErrorKey(null);
    // W-06: mehmonlar ochiq ro'yxatni ko'radi (GET /api/v1/public/tickets); endpoint
    // hali bo'lmasa — login CTA. Biletni boshlash login talab qiladi (returnTo bilan).
    const ticketsPromise: Promise<OfflineTicket[] | null> = isAuthenticated ? getTickets() : getPublicTickets();
    Promise.all([ticketsPromise, isAuthenticated ? getTicketStats(userId) : Promise.resolve([])])
      .then(([tkts, stats]) => {
        setGuestLocked(tkts === null);
        setTickets(Array.isArray(tkts) ? tkts : []);
        const map: Record<number, TicketStat> = {};
        if (Array.isArray(stats)) {
          for (const s of stats) {
            if (s && s.ticket_id != null) map[s.ticket_id] = s;
          }
        }
        setStatsMap(map);
      })
      .catch((err: unknown) => {
        reportError("tickets.load", err);
        setErrorKey(errorKeyFor(err));
      })
      .finally(() => setLoading(false));
  }, [userId, isAuthenticated]);

  useEffect(() => {
    loadData();
    const onStorage = () => loadData();
    window.addEventListener("prava-storage-changed", onStorage);
    return () => window.removeEventListener("prava-storage-changed", onStorage);
  }, [loadData]);

  const onStartTicket = (ticket: OfflineTicket) => {
    const target = `/tickets/${ticket.id}`;
    // Mehmon: login'dan keyin aynan shu biletning 1-savoliga qaytadi.
    navigate(isAuthenticated ? target : loginPath(target));
  };

  const totalCount = tickets.length || counts.tickets;
  const questionsPerTicket = rules.real.questionCount;

  return (
    <>
      <SEO
        title={
          totalCount > 0
            ? t("seo.tickets.title", { count: totalCount })
            : t("seo.tickets.titleGeneric")
        }
        description={
          totalCount > 0
            ? t("seo.tickets.desc", { count: totalCount })
            : t("seo.tickets.descGeneric")
        }
        canonical="/tickets"
        noIndex={true}
      />
      {/* Page Header */}
        <div className={styles.innerPageHeader}>
          <div className={styles.innerPageHeaderLeft}>
            <div className={styles.innerPageTitleRow}>
              <h1 className={styles.innerPageTitle}>
                {t("home.biletlar")}
              </h1>
              {!loading && !errorKey && !isAuthenticated && tickets.length > 0 && (
          <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "0 0 12px" }}>
            {t("tickets.guestHint")}
          </p>
        )}

        {!loading && !errorKey && tickets.length > 0 && (
                <span className={styles.innerPageCountChip}>
                  {tickets.length} {t("tickets.unit")}
                </span>
              )}
            </div>
            <p className={styles.innerPageSubtitle}>
              {totalCount > 0
                ? t("tickets.subtitle", { count: totalCount, questions: questionsPerTicket })
                : t("tickets.subtitleGeneric", { questions: questionsPerTicket })}
            </p>
          </div>
        </div>

        {loading && (
          <div className="loading-screen" style={{ minHeight: 320 }}>
            <div className="spinner" />
            <p style={{ marginTop: 12, color: "var(--text-muted)", fontSize: 14 }}>
              {t("common.loading")}
            </p>
          </div>
        )}

        {!loading && errorKey && (
          <div className="empty-state" role="alert" style={{ padding: "60px 20px", textAlign: "center" }}>
            <h4 style={{ fontSize: 17, fontWeight: 700, margin: "8px 0 0", color: "var(--text)" }}>
              {t(errorKey)}
            </h4>
            <button type="button" className="saas-btn-primary" onClick={loadData} style={{ marginTop: 12 }}>
              {t("common.retry")}
            </button>
          </div>
        )}

        {!loading && !errorKey && guestLocked && (
          <div className="empty-state" style={{ padding: "48px 20px", textAlign: "center" }}>
            <IconLock size={32} stroke={1.5} color="var(--text-muted)" />
            <h4 style={{ fontSize: 17, fontWeight: 700, margin: "12px 0 4px", color: "var(--text)" }}>
              {t("tickets.guestLockedTitle")}
            </h4>
            <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 auto", maxWidth: 420 }}>
              {t("tickets.guestLockedDesc")}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
              <button type="button" className="saas-btn-primary" onClick={() => navigate(loginPath("/tickets"))}>
                {t("guestHome.login")}
              </button>
              <button
                type="button"
                className="saas-btn-primary"
                style={{ background: "transparent", color: "var(--primary)", border: "1px solid var(--primary)" }}
                onClick={() => navigate(registerPath("/tickets"))}
              >
                {t("guestHome.register")}
              </button>
            </div>
          </div>
        )}

        {!loading && !errorKey && !guestLocked && tickets.length === 0 && (
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
              <IconTicket size={32} stroke={1.5} color="var(--text-muted)" />
            </div>
            <h4 style={{ fontSize: 17, fontWeight: 700, margin: "8px 0 0", color: "var(--text)" }}>
              {t("common.noData")}
            </h4>
            <button
              type="button"
              className="saas-btn-primary"
              onClick={loadData}
              style={{ marginTop: 8 }}
            >
              {t("common.retry")}
            </button>
          </div>
        )}

        {!loading && tickets.length > 0 && (
          <div className={styles.ticketsInnerGrid}>
            {tickets.map((ticket) => {
              const stat = statsMap[ticket.id];
              const done = stat?.times_done ?? 0;
              const passed = stat?.times_passed ?? 0;
              const bestCorrect = stat?.best_correct ?? 0;

              const badgeType =
                done === 0 ? null : passed > 0 ? "passed" : "ongoing";

              const btnLabel =
                done > 0
                  ? t("tickets.continue")
                  : t("tickets.start");

              const isBlocked = ticket.is_blocked === true;

              return (
                <div
                  key={ticket.id}
                  className={`tc-card ${done > 0 && !isBlocked ? "tc-card--active" : ""}`}
                  style={isBlocked ? { opacity: 0.72, position: "relative" } : {}}
                >
                  {/* ── Bloklangan overlay belgisi ── */}
                  {isBlocked && (
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        background: "rgba(0,0,0,0.55)",
                        borderRadius: 6,
                        padding: "3px 8px",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 600,
                        zIndex: 1,
                      }}
                    >
                      <IconLock size={12} /> {t("tickets.blocked")}
                    </div>
                  )}

                  {/* ── Top: sarlavha (chap) + raqam badge (o'ng) ── */}
                  <div className="tc-header">
                    <div className="tc-title-group">
                      <span className="tc-title">{localizeName(ticket)}</span>
                      {!isBlocked && badgeType && (
                        <span className={`tc-badge tc-badge--${badgeType}`}>
                          {badgeType === "passed"
                            ? t("tickets.badgePassed")
                            : t("tickets.badgeOngoing")}
                        </span>
                      )}
                    </div>
                    <div className="tc-num-badge">#{ticket.ticket_number}</div>
                  </div>

                  {/* ── Meta: savol, vaqt ── */}
                  <div className="tc-meta">
                    <span className="tc-meta-item">
                      <IconListNumbers size={13} />
                      {ticket.question_count} {t("common.questions")}
                    </span>
                    <span className="tc-meta-item">
                      <IconClock size={13} />
                      {ticket.duration_minutes} {t("common.min")}
                    </span>
                  </div>

                  {/* ── Statistika (faqat ishlangan biletlarda) ── */}
                  {!isBlocked && done > 0 && (
                    <div className="tc-stats">
                      <div className="tc-stat-row">
                        <span className="tc-stat-label">
                          <IconClock size={12} />
                          {(() => {
                            const totalSec = stat?.total_seconds ?? 0;
                            const m = Math.floor(totalSec / 60);
                            const s = totalSec % 60;
                            return m > 0
                              ? `${m} ${t("common.min")} ${s}s`
                              : `${s}s`;
                          })()}
                        </span>
                        <span
                          className={`tc-stat-val ${
                            bestCorrect >=
                            Math.ceil((ticket.question_count * ticket.passing_score) / 100)
                              ? "tc-val-green"
                              : "tc-val-red"
                          }`}
                        >
                          <IconCheck size={12} />
                          {bestCorrect}/{ticket.question_count}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ── Bajarish / Bloklangan tugmasi ── */}
                  <div className="tc-footer">
                    {isBlocked ? (
                      <button
                        className="tc-start-btn"
                        disabled
                        style={{
                          background: "var(--border)",
                          color: "var(--text-muted)",
                          cursor: "not-allowed",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                        type="button"
                      >
                        <IconLock size={15} />
                        {t("tickets.blocked")}
                      </button>
                    ) : (
                      <button
                        className="tc-start-btn"
                        onClick={() => onStartTicket(ticket)}
                        type="button"
                      >
                        {isAuthenticated ? <IconPlayerPlay size={15} /> : <IconLock size={15} />}
                        {isAuthenticated ? btnLabel : t("guestHome.loginToStart")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </>
  );
}
