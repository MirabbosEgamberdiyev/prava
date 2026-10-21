import React from "react";
import { IconRadar } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { UserSearchResult } from "../types";
import { OctagonAvatar } from "./OctagonAvatar";
import { safeName } from "../rank";
import { RADAR_MAX, radarPosition } from "../layout";
import "../octagon.css";

interface Props {
  players: UserSearchResult[];
  selectedId: string | null;
  onSelect: (userId: string) => void;
}

/**
 * Qidiruvda bir nechta o'yinchi topilsa — ular radar aylanasi atrofida joylashadi; bittasini bosish
 * bilan tanlanadi (tanlangani kattalashadi). Bitta natija bo'lsa markazda turadi.
 */
export const OctagonOpponentRadar: React.FC<Props> = ({ players, selectedId, onSelect }) => {
  const { t } = useTranslation();
  const shown = players.slice(0, RADAR_MAX);

  return (
    <div className="oct-pick-radar" role="listbox" aria-label={t("octagon.duel.radarLabel")}>
      <div className="oct-pick-ring r1" />
      <div className="oct-pick-ring r2" />
      <div className="oct-pick-ring r3" />
      <div className="oct-pick-sweep" />
      {shown.length > 1 && (
        <div className="oct-pick-center" aria-hidden="true">
          <IconRadar size={26} />
        </div>
      )}

      {shown.map((p, i) => {
        const pos = radarPosition(i, shown.length);
        const name = safeName(p.displayName, t("octagon.lobby.defaultUser"));
        const selected = p.userId === selectedId;
        const online = p.isOnline && p.status !== "OFFLINE";
        return (
          <button
            key={p.userId}
            type="button"
            role="option"
            aria-selected={selected}
            aria-label={`${name}, ${p.eloRating} ELO`}
            className={`oct-pick-node ${selected ? "selected" : ""} ${online ? "online" : "offline"}`}
            style={{ left: `${pos.left}%`, top: `${pos.top}%`, animationDelay: `${i * 60}ms` }}
            onClick={() => onSelect(p.userId)}
          >
            <span className="oct-pick-avatar">
              <OctagonAvatar name={name} src={p.avatarUrl} size={selected ? 64 : 46} ring={selected ? "#e879f9" : undefined} />
              <span className={`oct-pick-dot ${online ? "on" : "off"}`} />
            </span>
            <span className="oct-pick-name">{name}</span>
            <span className="oct-pick-elo">{p.eloRating} ELO</span>
          </button>
        );
      })}
    </div>
  );
};
