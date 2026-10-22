import React from "react";
import { useTranslation } from "react-i18next";
import { RANK_ORDER, getRankMeta } from "../rank";
import { leagueProgress } from "../arena";
import "../octagon.css";

interface Props {
  elo: number;
}

/**
 * Liga zinapoyasi (lobby): 6 liga, joriysi ajratilgan, o'tilganlari rangli; pastda keyingi ligagacha
 * qolgan ELO. Chegaralar server OctagonRank bilan bir xil.
 */
export const OctagonLeagueLadder: React.FC<Props> = ({ elo }) => {
  const { t } = useTranslation();
  const p = leagueProgress(elo);
  const currentIdx = RANK_ORDER.indexOf(p.current);

  return (
    <div className="oct-league" aria-label={t("octagon.lobby.leagueLadder")}>
      <ol className="oct-league-steps">
        {RANK_ORDER.map((id, i) => {
          const meta = getRankMeta(id);
          const state = i < currentIdx ? "passed" : i === currentIdx ? "current" : "locked";
          return (
            <li key={id} className={`oct-league-step ${state}`} aria-current={state === "current" ? "step" : undefined}>
              <span className="oct-league-emoji" aria-hidden="true">
                {meta.emoji}
              </span>
              <span className="oct-league-name">{t(meta.labelKey)}</span>
            </li>
          );
        })}
      </ol>
      <div
        className="oct-league-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={p.pct}
        aria-label={t("octagon.lobby.leagueLadder")}
      >
        <div className="oct-league-bar-fill" style={{ width: `${p.pct}%` }} />
      </div>
      <div className="oct-league-caption">
        {p.next
          ? t("octagon.lobby.toNextLeague", { elo: p.toNext, league: t(`octagon.rank.${p.next}`) })
          : t("octagon.lobby.topLeague")}
      </div>
    </div>
  );
};
