import React, { useState, useEffect } from "react";
import { Modal } from "@mantine/core";
import { IconTrophy, IconCrown } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { OctagonApi } from "../OctagonApi";
import type { LeaderboardEntry } from "../types";
import { OctagonAvatar } from "./OctagonAvatar";
import { OctagonRankBadge } from "./OctagonRankBadge";
import { safeName } from "../rank";
import { podiumOrder } from "../arena";
import "../octagon.css";

type Period = "weekly" | "monthly" | "all_time";

interface Props {
  opened: boolean;
  onClose: () => void;
  /** Tizimga kirgan bo'lsa — jadval ostida o'z o'rni ko'rsatiladi. */
  myUserId?: string | null;
}

const PERIODS: Array<{ id: Period; icon: string; key: string }> = [
  { id: "weekly", icon: "🗓️", key: "octagon.leaderboard.weekly" },
  { id: "monthly", icon: "📅", key: "octagon.leaderboard.monthly" },
  { id: "all_time", icon: "👑", key: "octagon.leaderboard.allTime" },
];

const MEDAL = ["🥇", "🥈", "🥉"];

export const OctagonLeaderboardModal: React.FC<Props> = ({ opened, onClose, myUserId }) => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>("weekly");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [me, setMe] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!opened) return;
    let alive = true;
    setLoading(true);
    setFailed(false);
    Promise.all([
      OctagonApi.getLeaderboard(period),
      myUserId ? OctagonApi.getMyLeaderboardPosition(period).catch(() => null) : Promise.resolve(null),
    ])
      .then(([list, mine]) => {
        if (!alive) return;
        setEntries(list || []);
        setMe(mine);
      })
      .catch(() => {
        if (alive) setFailed(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [opened, period, myUserId]);

  const nameOf = (e: LeaderboardEntry) => safeName(e.displayName || e.name, t("octagon.lobby.defaultUser"));
  const posOf = (e: LeaderboardEntry, idx: number) => e.position || e.rankPosition || idx + 1;
  const ranked = entries.map((e, idx) => ({ ...e, position: posOf(e, idx) }));
  const podium = podiumOrder(ranked);
  const rest = ranked.slice(3);
  const meInTable = Boolean(me && ranked.some((e) => e.userId === me.userId));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      closeButtonProps={{ "aria-label": t("common.close") }}
      centered
      size="lg"
      radius="lg"
      padding="lg"
      overlayProps={{ backgroundOpacity: 0.7, blur: 4 }}
      classNames={{ content: "oct-modal-dark", header: "oct-modal-dark-header", close: "oct-modal-dark-close" }}
      title={
        <span className="oct-modal-title">
          <span className="oct-modal-title-icon gold">
            <IconTrophy size={20} />
          </span>
          {t("octagon.leaderboard.title")}
        </span>
      }
    >
      <div className="oct-seg" role="tablist" aria-label={t("octagon.leaderboard.title")}>
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={period === p.id}
            className={`oct-seg-btn ${period === p.id ? "active" : ""}`}
            onClick={() => setPeriod(p.id)}
          >
            <span aria-hidden="true">{p.icon}</span> {t(p.key)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="oct-lb-skeleton" aria-busy="true">
          <div className="oct-podium">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`oct-podium-col p${i === 1 ? 1 : i === 0 ? 2 : 3}`}>
                <div className="oct-skel oct-skel-avatar" />
                <div className="oct-skel oct-skel-line" style={{ width: 70, marginTop: 8 }} />
                <div className="oct-podium-step oct-skel" />
              </div>
            ))}
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="oct-skel oct-skel-row" />
          ))}
        </div>
      ) : failed ? (
        <div className="oct-empty">{t("octagon.common.error")}</div>
      ) : ranked.length === 0 ? (
        <div className="oct-empty">
          <div className="oct-empty-icon">🏆</div>
          {t("octagon.leaderboard.empty")}
        </div>
      ) : (
        <>
          <div className="oct-podium">
            {podium.map((e) => {
              const place = e.position;
              const name = nameOf(e);
              return (
                <div key={e.userId} className={`oct-podium-col p${place} ${e.userId === myUserId ? "mine" : ""}`}>
                  {place === 1 && <IconCrown className="oct-podium-crown" size={26} aria-hidden="true" />}
                  <OctagonAvatar
                    name={name}
                    src={e.avatarUrl}
                    size={place === 1 ? 72 : 58}
                    ring={place === 1 ? "#fbbf24" : place === 2 ? "#cbd5e1" : "#d97706"}
                  />
                  <div className="oct-podium-name" title={name}>
                    {name}
                  </div>
                  <div className="oct-podium-elo">{e.eloRating} ELO</div>
                  <div className="oct-podium-step">
                    <span className="oct-podium-medal">{MEDAL[place - 1] ?? place}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {rest.length > 0 && (
            <div className="oct-lb-list">
              {rest.map((e) => (
                <LeaderRow key={e.userId} entry={e} name={nameOf(e)} mine={e.userId === myUserId} />
              ))}
            </div>
          )}
        </>
      )}

      {!loading && myUserId && (
        <div className="oct-lb-me">
          <div className="oct-lb-me-label">{t("octagon.leaderboard.myPosition")}</div>
          {me ? (
            meInTable && me.position <= 3 ? (
              <div className="oct-lb-me-podium">{t("octagon.leaderboard.onPodium", { pos: me.position })}</div>
            ) : (
              <LeaderRow entry={me} name={nameOf(me)} mine />
            )
          ) : (
            <div className="oct-lb-me-empty">{t("octagon.leaderboard.notRanked")}</div>
          )}
        </div>
      )}
    </Modal>
  );
};

const LeaderRow: React.FC<{ entry: LeaderboardEntry; name: string; mine?: boolean }> = ({ entry, name, mine }) => {
  const { t } = useTranslation();
  return (
    <div className={`oct-lb-row ${mine ? "mine" : ""}`}>
      <span className="oct-lb-pos">#{entry.position}</span>
      <OctagonAvatar name={name} src={entry.avatarUrl} size={38} />
      <div className="oct-lb-user">
        <div className="oct-lb-name">
          {name}
          {mine && <span className="oct-hud-badge-you">{t("octagon.arena.you")}</span>}
        </div>
        <div className="oct-lb-sub">
          {t("octagon.leaderboard.winsAndMatches", { wins: entry.wins, total: entry.totalMatches })}
        </div>
      </div>
      <OctagonRankBadge rank={entry.rank} elo={entry.eloRating} size="xs" />
      <span className="oct-lb-elo">{entry.eloRating}</span>
    </div>
  );
};
