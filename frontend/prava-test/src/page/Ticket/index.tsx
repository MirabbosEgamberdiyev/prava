import { resolveUserScopeId } from "@/utils/userScope";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useAuthModal } from "../../auth/AuthModalContext";
import { useTariffPaywall } from "../../context/TariffPaywallContext";
import type { OfflineTicket, TicketStat } from "../../types/desktop";
import { getTickets, getTicketStats, pickLocalized } from "../../services/desktopAdapter";
import SEO from "../../components/common/SEO";
import {
  IconArrowLeft,
  IconTicket,
  IconSearch,
  IconX,
  IconLock,
  IconStarFilled,
  IconCheck,
  IconPlayerPlay,
  IconClock,
} from "@tabler/icons-react";
import "./ticket.css";

type FilterStatus = "all" | "passed" | "untouched";

export default function Tickets_Page() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { openPaywall } = useTariffPaywall();
  const userId = resolveUserScopeId(user);

  const [tickets, setTickets] = useState<OfflineTicket[]>([]);
  const [statsMap, setStatsMap] = useState<Record<number, TicketStat>>({});
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  const localizeName = useCallback((tk: OfflineTicket): string => {
    if (!tk) return "";
    return pickLocalized({
      uzl:
        tk.name_uzl ||
        tk.name_ru ||
        tk.name_uzc ||
        t("examDesktop.modeTicket", "Bilet #{{n}}", { n: tk.ticket_number || "" }),
      uzc: tk.name_uzc,
      ru: tk.name_ru,
    });
  }, [t]);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([getTickets(), getTicketStats(userId)])
      .then(([tkts, stats]) => {
        setTickets(Array.isArray(tkts) ? tkts : []);
        const map: Record<number, TicketStat> = {};
        if (Array.isArray(stats)) {
          for (const s of stats) {
            if (s && s.ticket_id != null) map[s.ticket_id] = s;
          }
        }
        setStatsMap(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    loadData();
    const onStorage = () => loadData();
    window.addEventListener("prava-storage-changed", onStorage);
    return () => window.removeEventListener("prava-storage-changed", onStorage);
  }, [loadData]);

  const onStartTicket = (ticket: OfflineTicket) => {
    const isFree = (ticket.ticket_number || 0) <= 50;
    const isSubscribed = Boolean((user as any)?.hasSubscription || (user as any)?.packageActive);
    if ((!isFree && !isSubscribed) || ticket.is_blocked) {
      openPaywall(t("tariff.unlockTicketReason", "Ushbu biletni ochish uchun tarifga obuna bo'ling"));
      return;
    }
    if (!isAuthenticated) {
      openAuthModal({ returnUrl: `/tickets/${ticket.id}` });
      return;
    }
    navigate(`/tickets/${ticket.id}`);
  };

  // Filter & Sort
  const processedTickets = useMemo(() => {
    const list = tickets.filter((tk) => {
      const q = search.trim().toLowerCase();
      const numMatch = String(tk.ticket_number).includes(q);
      const nameMatch = localizeName(tk).toLowerCase().includes(q);
      if (q && !numMatch && !nameMatch) return false;

      const stat = statsMap[tk.id];
      const done = stat?.times_done ?? 0;
      const passed = stat?.times_passed ?? 0;

      if (statusFilter === "passed") return passed > 0;
      if (statusFilter === "untouched") return done === 0;
      return true;
    });

    list.sort((a, b) => (a.ticket_number || 0) - (b.ticket_number || 0));
    return list;
  }, [tickets, search, statusFilter, statsMap, localizeName]);

  return (
    <>
      <SEO
        title={t("tickets.seoTitle", "Biletlar - YHXBB imtihon biletlari")}
        description={t("tickets.seoDesc", "YHXBB imtihon biletlarini yeching. Har bir biletda real imtihon savollari mavjud.")}
        canonical="/tickets"
      />

      <div className="ds-page-wrapper">
        <main className="ds-page-container">
          {/* Header */}
          <div className="ds-page-header">
            <div className="ds-header-left">
              <button
                type="button"
                className="ds-back-btn"
                onClick={() => navigate("/me")}
                aria-label={t("common.back", "Orqaga")}
              >
                <IconArrowLeft size={20} stroke={2.2} />
              </button>
              <div>
                <h1 className="ds-page-title">
                  <span>🎟️</span>
                  <span>{t("home.biletlar", "Biletlar")}</span>
                  {!loading && tickets.length > 0 && (
                    <span className="ds-badge ds-badge-orange" style={{ marginLeft: 8 }}>
                      {tickets.length}
                    </span>
                  )}
                </h1>
                <p className="ds-page-desc">
                  {t("tickets.subtitle", { count: tickets.length || 70, questions: 20 })}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="ds-search-box">
              <IconSearch size={16} stroke={2} className="ds-search-icon" />
              <input
                className="ds-search-input"
                placeholder={t("tickets.searchPlaceholder", "Bilet raqami yoki nomi...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--g-text-muted)",
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

          {/* Filter Tabs */}
          <div className="ds-tabs-row" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "all"}
              className={`ds-tab-pill ${statusFilter === "all" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              {t("tickets.allTickets", "Barcha biletlar")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "untouched"}
              className={`ds-tab-pill ${statusFilter === "untouched" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("untouched")}
            >
              {t("tickets.untouchedOnly", "Faqat ishlanmagan")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "passed"}
              className={`ds-tab-pill ${statusFilter === "passed" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("passed")}
            >
              {t("tickets.passedOnly", "O'tilganlar")}
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="ds-empty-state">
              <div className="ds-spinner" />
              <p style={{ marginTop: 16, color: "var(--g-text-muted)" }}>
                {t("common.loading", "Yuklanmoqda...")}
              </p>
            </div>
          )}

          {/* Empty */}
          {!loading && processedTickets.length === 0 && (
            <div className="ds-empty-state">
              <div className="ds-empty-icon">
                <IconTicket size={36} stroke={1.5} />
              </div>
              <div className="ds-empty-title">
                {search ? t("tickets.notFound", "Bilet topilmadi") : t("common.noData", "Ma'lumot topilmadi")}
              </div>
              <p className="ds-empty-desc">
                {t("tickets.emptyDesc", "Boshqa raqam bilan qidirib ko'ring yoki filtrlarni tozalang.")}
              </p>
            </div>
          )}

          {/* Tickets Grid matching Reference Design */}
          {!loading && processedTickets.length > 0 && (
            <div className="ref-tickets-grid">
              {processedTickets.map((ticket) => {
                const stat = statsMap[ticket.id];
                const done = stat?.times_done ?? 0;
                const passed = stat?.times_passed ?? 0;
                const bestCorrect = stat?.best_correct ?? 0;
                const qCount = ticket.question_count || 20;
                const isPerfect = qCount > 0 && bestCorrect >= qCount;
                const isFree = (ticket.ticket_number || 0) <= 50;
                const isSubscribed = Boolean((user as any)?.hasSubscription || (user as any)?.packageActive);
                const isLocked = (!isFree && !isSubscribed) || ticket.is_blocked === true;

                // Color calculation for the donut gauge
                const pct = qCount > 0 ? Math.min(100, Math.round((bestCorrect / qCount) * 100)) : 0;
                const strokeColor =
                  isLocked
                    ? "var(--g-purple)"
                    : passed > 0
                    ? "#10b981"
                    : done > 0
                    ? "#38bdf8"
                    : "rgba(255, 255, 255, 0.1)";

                const circumference = 2 * Math.PI * 30; // r = 30
                const strokeDashoffset = circumference - (pct / 100) * circumference;

                return (
                  <div
                    key={ticket.id}
                    className={`ref-ticket-card ${isLocked ? "is-locked" : ""}`}
                    onClick={() => onStartTicket(ticket)}
                    role="button"
                    tabIndex={0}
                  >
                    {/* Top Row: Title + Status Badge */}
                    <div className="ref-ticket-title">
                      <span className="ref-ticket-name">{t("examDesktop.modeTicket", "Bilet #{{n}}", { n: ticket.ticket_number })}</span>
                      {isLocked ? (
                        <span className="ds-badge ds-badge-purple" style={{ fontSize: 11, padding: "2px 8px" }}>
                          <IconLock size={12} />
                          <span>Malibu</span>
                        </span>
                      ) : isPerfect ? (
                        <span className="ref-ticket-chip chip-passed" title={t("celebrate.perfect", "100% mukammal!")}>
                          <IconStarFilled size={12} style={{ color: "#f59e0b" }} />
                          <span>100%</span>
                        </span>
                      ) : passed > 0 ? (
                        <span className="ref-ticket-chip chip-passed">
                          <IconCheck size={12} stroke={2.5} />
                          <span>{t("tickets.passed", "O'tgan")}</span>
                        </span>
                      ) : done > 0 ? (
                        <span className="ref-ticket-chip chip-ongoing">
                          <span>{t("tickets.ongoing", "Jarayonda")}</span>
                        </span>
                      ) : (
                        <span className="ref-ticket-chip chip-new">
                          <span>{t("tickets.new", "Yangi")}</span>
                        </span>
                      )}
                    </div>

                    {/* Donut Gauge matching reference Screen 3 */}
                    <div className="ref-ticket-gauge-wrap">
                      <svg width="76" height="76" viewBox="0 0 76 76" style={{ transform: "rotate(-90deg)" }}>
                        {/* Background track (Adaptive high contrast in both themes) */}
                        <circle
                          cx="38"
                          cy="38"
                          r="30"
                          fill="transparent"
                          className="ref-ticket-gauge-track"
                          strokeWidth="6"
                        />
                        {/* Fill progress */}
                        {done > 0 && (
                          <circle
                            cx="38"
                            cy="38"
                            r="30"
                            fill="transparent"
                            stroke={strokeColor}
                            strokeWidth="6"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            style={{ transition: "stroke-dashoffset 0.6s ease" }}
                          />
                        )}
                      </svg>
                      {/* Inside Score / State */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isLocked ? (
                          <IconLock size={22} color="var(--g-purple)" />
                        ) : done > 0 ? (
                          <div style={{ textAlign: "center", lineHeight: 1.1 }}>
                            <span className="ref-ticket-score" style={{ color: strokeColor }}>
                              {bestCorrect}
                            </span>
                            <span className="ref-ticket-score-total">/{qCount}</span>
                          </div>
                        ) : (
                          <div style={{ textAlign: "center", lineHeight: 1.1 }}>
                            <span className="ref-ticket-score is-zero">0</span>
                            <span className="ref-ticket-score-total">/{qCount}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="ref-ticket-meta">
                      <IconClock size={12} />
                      <span>{qCount} {t("common.questions", "savol")} • {qCount} {t("common.min", "daq")}</span>
                    </div>

                    {/* Footer Button / CTA */}
                    <div style={{ width: "100%" }}>
                      {isLocked ? (
                        <div
                          className="ref-ticket-btn btn-locked"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartTicket(ticket);
                          }}
                        >
                          <IconLock size={14} />
                          <span>{t("tariff.needMalibu", "Malibu")}</span>
                        </div>
                      ) : done > 0 ? (
                        <div
                          className="ref-ticket-btn btn-continue"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartTicket(ticket);
                          }}
                        >
                          <IconPlayerPlay size={14} />
                          <span>{t("tickets.continue", "Davom etish")}</span>
                        </div>
                      ) : (
                        <div
                          className="ref-ticket-btn btn-start"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartTicket(ticket);
                          }}
                        >
                          <IconPlayerPlay size={14} />
                          <span>{t("tickets.start", "Bajarish")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
